const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY müssen als GitHub Secrets gesetzt sein.");
}

const BASELINE = {
  "FC Bayern München": 10.0,
  "Borussia Dortmund": 7.8,
  "Bayer 04 Leverkusen": 7.2,
  "RB Leipzig": 7.0,
  "VfB Stuttgart": 6.7,
  "TSG Hoffenheim": 6.0,
  "Sport-Club Freiburg": 5.7,
  "Eintracht Frankfurt": 5.7,
  "1. FSV Mainz 05": 5.1,
  "FC Augsburg": 5.0,
  "Borussia Mönchengladbach": 4.7,
  "1. FC Union Berlin": 4.6,
  "SV Werder Bremen": 4.4,
  "Hamburger SV": 4.3,
  "FC Schalke 04": 4.1,
  "SV Elversberg": 3.8,
  "1. FC Köln": 3.7,
  "SC Paderborn 07": 3.7
};

const ALIASES = {
  "Bayern München": "FC Bayern München",
  "FC Bayern": "FC Bayern München",
  "Borussia Dortmund": "Borussia Dortmund",
  "Bayer Leverkusen": "Bayer 04 Leverkusen",
  "Bayer 04 Leverkusen": "Bayer 04 Leverkusen",
  "RB Leipzig": "RB Leipzig",
  "VfB Stuttgart": "VfB Stuttgart",
  "1899 Hoffenheim": "TSG Hoffenheim",
  "TSG 1899 Hoffenheim": "TSG Hoffenheim",
  "TSG Hoffenheim": "TSG Hoffenheim",
  "SC Freiburg": "Sport-Club Freiburg",
  "Sport-Club Freiburg": "Sport-Club Freiburg",
  "Eintracht Frankfurt": "Eintracht Frankfurt",
  "1. FSV Mainz 05": "1. FSV Mainz 05",
  "FSV Mainz 05": "1. FSV Mainz 05",
  "FC Augsburg": "FC Augsburg",
  "Borussia Mönchengladbach": "Borussia Mönchengladbach",
  "Bor. Mönchengladbach": "Borussia Mönchengladbach",
  "1. FC Union Berlin": "1. FC Union Berlin",
  "Union Berlin": "1. FC Union Berlin",
  "Werder Bremen": "SV Werder Bremen",
  "SV Werder Bremen": "SV Werder Bremen",
  "Hamburger SV": "Hamburger SV",
  "FC Schalke 04": "FC Schalke 04",
  "Schalke 04": "FC Schalke 04",
  "SV Elversberg": "SV Elversberg",
  "1. FC Köln": "1. FC Köln",
  "SC Paderborn 07": "SC Paderborn 07",
  "SC Paderborn": "SC Paderborn 07"
};

function canonical(name) {
  return ALIASES[name] || name;
}
function clamp(value, min=1, max=10) {
  return Math.max(min, Math.min(max, value));
}
function normalize(values, value, low=2.5, high=9.5) {
  if (!values.length) return 5;
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return 5;
  return low + ((value - min) / (max - min)) * (high - low);
}
function finalResult(match) {
  const results = Array.isArray(match.matchResults) ? match.matchResults : [];
  const final = results.find(r => r.resultTypeID === 2) || results.at(-1);
  if (!match.matchIsFinished || !final) return null;
  return { home: Number(final.pointsTeam1), away: Number(final.pointsTeam2) };
}

const response = await fetch("https://api.openligadb.de/getmatchdata/bl1/2026");
if (!response.ok) throw new Error(`OpenLigaDB: ${response.status}`);
const matches = await response.json();

const stats = Object.fromEntries(Object.keys(BASELINE).map(team => [team, {
  team, played:0, points:0, gf:0, ga:0,
  homePlayed:0, homePoints:0, awayPlayed:0, awayPoints:0,
  results:[]
}]));

for (const match of matches) {
  const result = finalResult(match);
  if (!result) continue;
  const home = canonical(match.team1?.teamName || "");
  const away = canonical(match.team2?.teamName || "");
  if (!stats[home] || !stats[away]) continue;

  const h = stats[home], a = stats[away];
  h.played++; a.played++;
  h.homePlayed++; a.awayPlayed++;
  h.gf += result.home; h.ga += result.away;
  a.gf += result.away; a.ga += result.home;

  let hp=1, ap=1;
  if (result.home > result.away) { hp=3; ap=0; }
  else if (result.away > result.home) { hp=0; ap=3; }
  h.points += hp; a.points += ap;
  h.homePoints += hp; a.awayPoints += ap;

  const date = new Date(match.matchDateTimeUTC || match.matchDateTime || 0).getTime();
  h.results.push({date, points:hp, gf:result.home, ga:result.away});
  a.results.push({date, points:ap, gf:result.away, ga:result.home});
}

const teams = Object.values(stats);
const ppgValues = teams.filter(t=>t.played).map(t=>t.points/t.played);
const gdValues = teams.filter(t=>t.played).map(t=>(t.gf-t.ga)/t.played);
const gfValues = teams.filter(t=>t.played).map(t=>t.gf/t.played);
const gaValues = teams.filter(t=>t.played).map(t=>-t.ga/t.played);
const formValues = teams.filter(t=>t.played).map(t=>{
  const last=t.results.sort((a,b)=>b.date-a.date).slice(0,5);
  return last.reduce((s,x)=>s+x.points,0)/last.length;
});
const homeValues = teams.filter(t=>t.homePlayed).map(t=>t.homePoints/t.homePlayed);
const awayValues = teams.filter(t=>t.awayPlayed).map(t=>t.awayPoints/t.awayPlayed);

const now = new Date().toISOString();
const rows = teams.map(t => {
  const baseline = BASELINE[t.team];
  if (!t.played) {
    return {
      team:t.team, overall:baseline, season_score:baseline, form_score:baseline,
      attack_score:baseline, defence_score:baseline, home_score:baseline,
      away_score:baseline, matches_played:0, source:"OpenLigaDB + Vorsaisonbasis",
      source_updated_at:now, updated_at:now
    };
  }

  const ppg=t.points/t.played;
  const gd=(t.gf-t.ga)/t.played;
  const gf=t.gf/t.played;
  const ga=-t.ga/t.played;
  const last=t.results.sort((a,b)=>b.date-a.date).slice(0,5);
  const form=last.reduce((s,x)=>s+x.points,0)/last.length;

  const seasonScore = 0.65*normalize(ppgValues,ppg)+0.35*normalize(gdValues,gd);
  const formScore = normalize(formValues,form);
  const attackScore = normalize(gfValues,gf);
  const defenceScore = normalize(gaValues,ga);
  const homeScore = t.homePlayed ? normalize(homeValues,t.homePoints/t.homePlayed) : baseline;
  const awayScore = t.awayPlayed ? normalize(awayValues,t.awayPoints/t.awayPlayed) : baseline;

  // Der Einfluss der laufenden Saison steigt bis Spieltag 10 schrittweise.
  const liveWeight = Math.min(0.72, 0.18 + (t.played/10)*0.54);
  const liveComposite =
    0.38*seasonScore +
    0.24*formScore +
    0.14*attackScore +
    0.14*defenceScore +
    0.05*homeScore +
    0.05*awayScore;
  const overall = clamp((1-liveWeight)*baseline + liveWeight*liveComposite);

  return {
    team:t.team,
    overall:Number(overall.toFixed(2)),
    season_score:Number(seasonScore.toFixed(2)),
    form_score:Number(formScore.toFixed(2)),
    attack_score:Number(attackScore.toFixed(2)),
    defence_score:Number(defenceScore.toFixed(2)),
    home_score:Number(homeScore.toFixed(2)),
    away_score:Number(awayScore.toFixed(2)),
    matches_played:t.played,
    source:"OpenLigaDB",
    source_updated_at:now,
    updated_at:now
  };
});

const upsert = await fetch(`${SUPABASE_URL}/rest/v1/team_strengths?on_conflict=team`, {
  method:"POST",
  headers:{
    "apikey":SUPABASE_SERVICE_ROLE_KEY,
    "Authorization":`Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type":"application/json",
    "Prefer":"resolution=merge-duplicates,return=minimal"
  },
  body:JSON.stringify(rows)
});
if (!upsert.ok) throw new Error(`Supabase: ${upsert.status} ${await upsert.text()}`);
console.log(`Aktualisiert: ${rows.length} Teams, ${matches.filter(m=>m.matchIsFinished).length} beendete Spiele.`);
