
import { normalizeStatus, isoNow, cleanText } from "./normalizers.mjs";
import { upsert, setSyncStatus } from "./supabase.mjs";

const PROVIDER = "sportmonks";
const token = process.env.SPORTMONKS_API_TOKEN;
const bundesligaSeasonId = process.env.SPORTMONKS_BUNDESLIGA_SEASON_ID;
const base = "https://api.sportmonks.com/v3/football";

async function get(path) {
  const separator = path.includes("?") ? "&" : "?";
  const response = await fetch(`${base}${path}${separator}api_token=${encodeURIComponent(token)}`);
  if (!response.ok) throw new Error(`${path}: ${response.status} ${await response.text()}`);
  return response.json();
}

function lineupRow(item, fixture, teamName) {
  const starter = Number(item.type_id) === 77614 || Boolean(item.formation_position);
  const candidate = Number(item.type_id) === 77615 || !starter;
  const normalized = normalizeStatus({ predictedStarter: starter, candidate, confirmed: Boolean(fixture?.lineup_confirmed) });
  return {
    provider: PROVIDER,
    external_player_id: String(item.player_id),
    player_name: cleanText(item.player_name || item.player?.display_name || item.player?.name) || `Spieler ${item.player_id}`,
    team: cleanText(teamName || item.team?.name),
    fixture_external_id: String(item.fixture_id || fixture?.id),
    fixture_date: fixture?.starting_at || fixture?.starting_at_timestamp ? new Date((fixture.starting_at_timestamp || 0) * 1000).toISOString() : null,
    ...normalized,
    injury_status: null,
    suspension_status: null,
    provider_updated_at: isoNow(),
    updated_at: isoNow(),
    raw: item
  };
}

export async function syncSportmonks() {
  if (!token || !bundesligaSeasonId) {
    await setSyncStatus(PROVIDER, {
      status: "disabled",
      message: !token ? "SPORTMONKS_API_TOKEN fehlt." : "SPORTMONKS_BUNDESLIGA_SEASON_ID fehlt."
    });
    return { provider: PROVIDER, records: 0, disabled: true };
  }

  await setSyncStatus(PROVIDER, { status: "running", message: "Aufstellungen und Verfügbarkeiten werden geladen.", last_started_at: isoNow() });
  try {
    const today = new Date();
    const from = today.toISOString().slice(0, 10);
    const until = new Date(today.getTime() + 10 * 86400000).toISOString().slice(0, 10);
    const fixturesResponse = await get(`/fixtures/between/${from}/${until}?filters=fixtureSeasons:${bundesligaSeasonId}&include=participants;expectedLineups.player;lineups.player;sidelined.player`);
    const rows = [];

    for (const fixture of fixturesResponse.data || []) {
      const teamById = Object.fromEntries((fixture.participants || []).map(t => [String(t.id), t.name]));
      const expected = fixture.expectedlineups || fixture.expectedLineups || [];
      for (const item of expected) rows.push(lineupRow(item, fixture, teamById[String(item.team_id)]));

      // Confirmed lineups can overwrite predictions closer to kickoff.
      for (const item of fixture.lineups || []) {
        rows.push(lineupRow({ ...item, type_id: 77614 }, { ...fixture, lineup_confirmed: true }, teamById[String(item.team_id)]));
      }

      for (const sidelined of fixture.sidelined || []) {
        const player = sidelined.player || {};
        const normalized = normalizeStatus({ injured: true, confirmed: true });
        rows.push({
          provider: PROVIDER,
          external_player_id: String(sidelined.player_id || player.id),
          player_name: cleanText(player.display_name || player.name) || `Spieler ${sidelined.player_id}`,
          team: cleanText(teamById[String(sidelined.team_id)]),
          fixture_external_id: String(fixture.id),
          fixture_date: fixture.starting_at || null,
          ...normalized,
          injury_status: cleanText(sidelined.description || sidelined.reason || "Nicht verfügbar"),
          suspension_status: null,
          provider_updated_at: isoNow(),
          updated_at: isoNow(),
          raw: sidelined
        });
      }
    }

    await upsert("player_availability", rows, "provider,external_player_id,fixture_external_id");
    await setSyncStatus(PROVIDER, {
      status: "success", message: `${rows.length} Aufstellungs-/Verfügbarkeitsdaten aktualisiert.`,
      records_written: rows.length, last_success_at: isoNow()
    });
    return { provider: PROVIDER, records: rows.length };
  } catch (error) {
    await setSyncStatus(PROVIDER, { status: "error", message: error.message, last_error_at: isoNow() });
    throw error;
  }
}
