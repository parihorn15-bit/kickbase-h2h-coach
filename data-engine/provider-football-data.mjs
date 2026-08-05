
import { isoNow } from "./normalizers.mjs";
import { upsert, setSyncStatus } from "./supabase.mjs";

const PROVIDER = "football-data.org";
const token = process.env.FOOTBALL_DATA_API_KEY;
const base = "https://api.football-data.org/v4";

async function get(path) {
  const response = await fetch(`${base}${path}`, { headers: { "X-Auth-Token": token } });
  if (!response.ok) throw new Error(`${path}: ${response.status} ${await response.text()}`);
  return response.json();
}

export async function syncFootballData() {
  if (!token) {
    await setSyncStatus(PROVIDER, { status: "disabled", message: "FOOTBALL_DATA_API_KEY fehlt." });
    return { provider: PROVIDER, records: 0, disabled: true };
  }
  const started = isoNow();
  await setSyncStatus(PROVIDER, {
    status: "running",
    message: "1. und 2. Bundesliga: Vereine, Wappen und Kader werden aktualisiert.",
    last_started_at: started
  });

  try {
    const competitions = [
      { code: "BL1", name: "Bundesliga", level: 1 },
      { code: "BL2", name: "2. Bundesliga", level: 2 }
    ];
    const now = isoNow();
    const players = [];
    const clubs = [];
    const failures = [];

    for (const meta of competitions) {
      try {
        const competition = await get(`/competitions/${meta.code}/teams`);
        for (const team of competition.teams || []) {
          clubs.push({
            team: team.name,
            short_name: team.shortName || team.tla || team.name,
            crest_url: team.crest || null,
            coach: team.coach?.name || null,
            venue: team.venue || null,
            competition_code: meta.code,
            competition_name: meta.name,
            competition_level: meta.level,
            source: PROVIDER,
            source_updated_at: now,
            updated_at: now
          });
          for (const player of team.squad || []) {
            players.push({
              external_id: player.id,
              name: player.name,
              first_name: player.firstName || null,
              last_name: player.lastName || null,
              position: player.position || null,
              shirt_number: player.shirtNumber || null,
              date_of_birth: player.dateOfBirth || null,
              nationality: player.nationality || null,
              team: team.name,
              team_external_id: team.id,
              competition_code: meta.code,
              competition_name: meta.name,
              competition_level: meta.level,
              photo_url: null,
              source: PROVIDER,
              source_updated_at: now,
              updated_at: now
            });
          }
        }
      } catch (error) {
        failures.push(`${meta.code}: ${error.message}`);
      }
    }

    if (!clubs.length) throw new Error(failures.join(" | ") || "Keine Ligadaten empfangen.");

    await upsert("bundesliga_clubs", clubs, "team");
    await upsert("bundesliga_players", players, "external_id");

    const bl1Clubs = clubs.filter(x => x.competition_code === "BL1").length;
    const bl2Clubs = clubs.filter(x => x.competition_code === "BL2").length;
    await setSyncStatus(PROVIDER, {
      status: failures.length ? "success" : "success",
      message: `${bl1Clubs} Erstliga- und ${bl2Clubs} Zweitligavereine sowie ${players.length} Spieler aktualisiert.${failures.length ? ` Hinweise: ${failures.join(" | ")}` : ""}`,
      records_written: clubs.length + players.length,
      last_success_at: isoNow()
    });
    return { provider: PROVIDER, records: clubs.length + players.length, failures };
  } catch (error) {
    await setSyncStatus(PROVIDER, { status: "error", message: error.message, last_error_at: isoNow() });
    throw error;
  }
}

