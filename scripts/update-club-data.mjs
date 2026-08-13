const BASE = "https://api.football-data.org/v4";
const token = process.env.FOOTBALL_DATA_API_KEY;
const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!token || !supabaseUrl || !serviceKey) {
  throw new Error("FOOTBALL_DATA_API_KEY, SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY fehlen.");
}
const wait = ms => new Promise(resolve=>setTimeout(resolve,ms));
async function fd(path) {
  const response = await fetch(`${BASE}${path}`, {headers:{"X-Auth-Token":token}});
  if (!response.ok) throw new Error(`${path}: ${response.status} ${await response.text()}`);
  return response.json();
}
async function upsert(table, rows, conflict) {
  if (!rows.length) return;
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?on_conflict=${conflict}`, {
    method:"POST",
    headers:{
      apikey:serviceKey,
      Authorization:`Bearer ${serviceKey}`,
      "Content-Type":"application/json",
      Prefer:"resolution=merge-duplicates,return=minimal"
    },
    body:JSON.stringify(rows)
  });
  if (!response.ok) throw new Error(`${table}: ${response.status} ${await response.text()}`);
}

const [teamsData, standingsData, matchesData] = await Promise.all([
  fd("/competitions/BL1/teams"),
  fd("/competitions/BL1/standings"),
  fd("/competitions/BL1/matches?status=SCHEDULED")
]);
const table = standingsData.standings?.find(s=>s.type==="TOTAL")?.table || [];
const tableById = Object.fromEntries(table.map(x=>[x.team.id,x]));
const scheduled = matchesData.matches || [];
const nextById = {};
for (const match of scheduled.sort((a,b)=>new Date(a.utcDate)-new Date(b.utcDate))) {
  for (const side of ["homeTeam","awayTeam"]) {
    const id = match[side]?.id;
    if (id && !nextById[id]) nextById[id] = {
      id:match.id, utcDate:match.utcDate,
      homeTeam:match.homeTeam?.name, awayTeam:match.awayTeam?.name
    };
  }
}
const now = new Date().toISOString();
const clubs = [];
const players = [];

for (const baseTeam of teamsData.teams || []) {
  // Team detail contains the current squad. Pause to respect free-tier limits.
  const team = await fd(`/teams/${baseTeam.id}`);
  await wait(6500);

  const standing = tableById[team.id] || {};
  clubs.push({
    team:team.name,
    short_name:team.shortName || team.tla || team.name,
    crest_url:team.crest || null,
    coach:team.coach?.name || null,
    venue:team.venue || null,
    position:standing.position || null,
    points:standing.points || 0,
    played:standing.playedGames || 0,
    won:standing.won || 0,
    drawn:standing.draw || 0,
    lost:standing.lost || 0,
    goals_for:standing.goalsFor || 0,
    goals_against:standing.goalsAgainst || 0,
    goal_difference:standing.goalDifference || 0,
    form:standing.form || null,
    next_match:nextById[team.id] || null,
    source:"football-data.org",
    source_updated_at:now,
    updated_at:now
  });

  for (const p of team.squad || []) {
    players.push({
      external_id:p.id,
      name:p.name,
      first_name:p.firstName || null,
      last_name:p.lastName || null,
      position:p.position || null,
      shirt_number:p.shirtNumber || null,
      date_of_birth:p.dateOfBirth || null,
      nationality:p.nationality || null,
      team:team.name,
      team_external_id:team.id,
      photo_url:null,
      source:"football-data.org",
      source_updated_at:now,
      updated_at:now
    });
  }
}
await upsert("bundesliga_clubs", clubs, "team");
await upsert("bundesliga_players", players, "external_id");
console.log(`${clubs.length} Vereine und ${players.length} Spieler aktualisiert.`);
