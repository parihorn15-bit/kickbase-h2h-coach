const BASE = "https://api.football-data.org/v4";
const token = process.env.FOOTBALL_DATA_API_KEY;
const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!token || !supabaseUrl || !serviceKey) {
  throw new Error("FOOTBALL_DATA_API_KEY, SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY fehlen.");
}
async function fd(path) {
  const response = await fetch(`${BASE}${path}`, {headers:{"X-Auth-Token":token}});
  if (!response.ok) throw new Error(`${path}: ${response.status} ${await response.text()}`);
  return response.json();
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
    if (id && !nextById[id]) {
      nextById[id] = {
        id:match.id,
        utcDate:match.utcDate,
        homeTeam:match.homeTeam?.name,
        awayTeam:match.awayTeam?.name
      };
    }
  }
}
const now = new Date().toISOString();
const rows = (teamsData.teams || []).map(team=>{
  const standing = tableById[team.id] || {};
  return {
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
  };
});
const response = await fetch(`${supabaseUrl}/rest/v1/bundesliga_clubs?on_conflict=team`, {
  method:"POST",
  headers:{
    apikey:serviceKey,
    Authorization:`Bearer ${serviceKey}`,
    "Content-Type":"application/json",
    Prefer:"resolution=merge-duplicates,return=minimal"
  },
  body:JSON.stringify(rows)
});
if (!response.ok) throw new Error(`Supabase: ${response.status} ${await response.text()}`);
console.log(`${rows.length} Vereinsdatensätze aktualisiert.`);
