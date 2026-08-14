const BASE = "https://api.football-data.org/v4";

const token = process.env.FOOTBALL_DATA_API_KEY;
const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!token || !supabaseUrl || !serviceKey) {
  throw new Error(
    "FOOTBALL_DATA_API_KEY, SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY fehlen."
  );
}

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

const REQUEST_DELAY_MS = 7000;
const MAX_RETRIES = 5;

let lastFootballDataRequestAt = 0;

async function waitForRateLimit() {
  const elapsed = Date.now() - lastFootballDataRequestAt;
  const remaining = REQUEST_DELAY_MS - elapsed;

  if (remaining > 0) {
    await wait(remaining);
  }
}

async function fd(path, attempt = 1) {
  await waitForRateLimit();

  lastFootballDataRequestAt = Date.now();

  const response = await fetch(`${BASE}${path}`, {
    headers: {
      "X-Auth-Token": token
    }
  });

  if (response.ok) {
    const available = response.headers.get("x-requestsavailable");

    console.log(
      `✓ ${path}` +
      (available !== null ? ` · Requests verfügbar: ${available}` : "")
    );

    return response.json();
  }

  const body = await response.text();

  if (response.status === 429 && attempt <= MAX_RETRIES) {
    const resetHeader = Number(
      response.headers.get("x-requestcounter-reset")
    );

    let waitSeconds =
      Number.isFinite(resetHeader) && resetHeader > 0
        ? resetHeader + 1
        : 10;

    try {
      const parsed = JSON.parse(body);

      const message = String(parsed?.message || "");
      const match = message.match(/wait\s+(\d+)\s+seconds?/i);

      if (match) {
        waitSeconds = Math.max(waitSeconds, Number(match[1]) + 1);
      }
    } catch {
      // Response war kein JSON – Fallback bleibt bestehen.
    }

    console.warn(
      `⚠ Rate Limit bei ${path}. ` +
      `Warte ${waitSeconds}s · Versuch ${attempt}/${MAX_RETRIES}`
    );

    await wait(waitSeconds * 1000);

    return fd(path, attempt + 1);
  }

  throw new Error(
    `${path}: ${response.status} ${body}`
  );
}

async function upsert(table, rows, conflict) {
  if (!rows.length) return;

  const response = await fetch(
    `${supabaseUrl}/rest/v1/${table}?on_conflict=${conflict}`,
    {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal"
      },
      body: JSON.stringify(rows)
    }
  );

  if (!response.ok) {
    throw new Error(
      `${table}: ${response.status} ${await response.text()}`
    );
  }

  console.log(`✓ ${table}: ${rows.length} Datensätze gespeichert`);
}


// ---------------------------------------------------------
// football-data.org bewusst SEQUENZIELL laden.
// Kein Promise.all – schützt das Free-Tier-Limit.
// ---------------------------------------------------------

console.log("Lade Bundesliga-Vereinsliste ...");
const teamsData = await fd("/competitions/BL1/teams");

console.log("Lade Bundesliga-Tabelle ...");
const standingsData = await fd("/competitions/BL1/standings");

console.log("Lade kommende Bundesliga-Spiele ...");
const matchesData = await fd(
  "/competitions/BL1/matches?status=SCHEDULED"
);


const table =
  standingsData.standings?.find(s => s.type === "TOTAL")?.table || [];

const tableById = Object.fromEntries(
  table.map(x => [x.team.id, x])
);

const scheduled = matchesData.matches || [];

const nextById = {};

for (
  const match of scheduled.sort(
    (a, b) => new Date(a.utcDate) - new Date(b.utcDate)
  )
) {
  for (const side of ["homeTeam", "awayTeam"]) {
    const id = match[side]?.id;

    if (id && !nextById[id]) {
      nextById[id] = {
        id: match.id,
        utcDate: match.utcDate,
        homeTeam: match.homeTeam?.name,
        awayTeam: match.awayTeam?.name
      };
    }
  }
}


const now = new Date().toISOString();

const clubs = [];
const players = [];


// ---------------------------------------------------------
// Vereinsdetails inkl. Kader laden
// ---------------------------------------------------------

for (const baseTeam of teamsData.teams || []) {
  console.log(`Lade ${baseTeam.name} ...`);

  const team = await fd(`/teams/${baseTeam.id}`);

  const standing = tableById[team.id] || {};

  clubs.push({
    team: team.name,
    short_name: team.shortName || team.tla || team.name,
    crest_url: team.crest || null,
    coach: team.coach?.name || null,
    venue: team.venue || null,

    position: standing.position || null,
    points: standing.points || 0,
    played: standing.playedGames || 0,
    won: standing.won || 0,
    drawn: standing.draw || 0,
    lost: standing.lost || 0,

    goals_for: standing.goalsFor || 0,
    goals_against: standing.goalsAgainst || 0,
    goal_difference: standing.goalDifference || 0,

    form: standing.form || null,

    next_match: nextById[team.id] || null,

    source: "football-data.org",
    source_updated_at: now,
    updated_at: now
  });


  for (const p of team.squad || []) {
    players.push({
      external_id: p.id,

      name: p.name,

      first_name: p.firstName || null,
      last_name: p.lastName || null,

      position: p.position || null,
      shirt_number: p.shirtNumber || null,

      date_of_birth: p.dateOfBirth || null,
      nationality: p.nationality || null,

      team: team.name,
      team_external_id: team.id,

      photo_url: null,

      source: "football-data.org",
      source_updated_at: now,
      updated_at: now
    });
  }
}


// ---------------------------------------------------------
// Erst speichern, wenn ALLE football-data-Requests fertig sind.
// So landet kein halbfertiger Stand in Supabase.
// ---------------------------------------------------------

await upsert(
  "bundesliga_clubs",
  clubs,
  "team"
);

await upsert(
  "bundesliga_players",
  players,
  "external_id"
);

console.log(
  `✅ Update abgeschlossen: ${clubs.length} Vereine und ` +
  `${players.length} Spieler aktualisiert.`
);
