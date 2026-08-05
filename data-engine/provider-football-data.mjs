
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
  await setSyncStatus(PROVIDER, { status: "running", message: "Vereine und Kader werden aktualisiert.", last_started_at: started });
  try {
    const competition = await get("/competitions/BL1/teams");
    const now = isoNow();
    const players = [];
    const clubs = [];
    for (const team of competition.teams || []) {
      clubs.push({
        team: team.name,
        short_name: team.shortName || team.tla || team.name,
        crest_url: team.crest || null,
        coach: team.coach?.name || null,
        venue: team.venue || null,
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
          photo_url: null,
          source: PROVIDER,
          source_updated_at: now,
          updated_at: now
        });
      }
    }
    await upsert("bundesliga_clubs", clubs, "team");
    await upsert("bundesliga_players", players, "external_id");
    await setSyncStatus(PROVIDER, {
      status: "success", message: `${clubs.length} Vereine und ${players.length} Spieler aktualisiert.`,
      records_written: clubs.length + players.length, last_success_at: isoNow()
    });
    return { provider: PROVIDER, records: clubs.length + players.length };
  } catch (error) {
    await setSyncStatus(PROVIDER, { status: "error", message: error.message, last_error_at: isoNow() });
    throw error;
  }
}
