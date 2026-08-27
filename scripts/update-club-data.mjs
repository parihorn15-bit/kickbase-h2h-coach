const BASE = "https://api.football-data.org/v4";

const token = process.env.FOOTBALL_DATA_API_KEY;
const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!token || !supabaseUrl || !serviceKey) throw new Error("FOOTBALL_DATA_API_KEY, SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY fehlen.");

const wait=ms=>new Promise(r=>setTimeout(r,ms));
const REQUEST_DELAY_MS=7000,MAX_RETRIES=5;let lastFootballDataRequestAt=0;
async function waitForRateLimit(){const remaining=REQUEST_DELAY_MS-(Date.now()-lastFootballDataRequestAt);if(remaining>0)await wait(remaining)}
async function fd(path,attempt=1){await waitForRateLimit();lastFootballDataRequestAt=Date.now();const response=await fetch(`${BASE}${path}`,{headers:{"X-Auth-Token":token}});if(response.ok){console.log(`✓ ${path}`);return response.json()}const body=await response.text();if(response.status===429&&attempt<=MAX_RETRIES){const reset=Number(response.headers.get("x-requestcounter-reset"));let seconds=Number.isFinite(reset)&&reset>0?reset+1:10;try{const m=String(JSON.parse(body)?.message||"").match(/wait\s+(\d+)\s+seconds?/i);if(m)seconds=Math.max(seconds,Number(m[1])+1)}catch{}await wait(seconds*1000);return fd(path,attempt+1)}throw new Error(`${path}: ${response.status} ${body}`)}
const sbHeaders={apikey:serviceKey,Authorization:`Bearer ${serviceKey}`,"Content-Type":"application/json"};
async function upsert(table,rows,conflict){if(!rows.length)return;const response=await fetch(`${supabaseUrl}/rest/v1/${table}?on_conflict=${conflict}`,{method:"POST",headers:{...sbHeaders,Prefer:"resolution=merge-duplicates,return=minimal"},body:JSON.stringify(rows)});if(!response.ok)throw new Error(`${table}: ${response.status} ${await response.text()}`);console.log(`✓ ${table}: ${rows.length} Datensätze gespeichert`)}
async function existingPlayerIds(){const r=await fetch(`${supabaseUrl}/rest/v1/bundesliga_players?select=external_id`,{headers:sbHeaders});if(!r.ok)throw new Error(`bundesliga_players read: ${r.status} ${await r.text()}`);return(await r.json()||[]).map(x=>Number(x.external_id)).filter(Number.isFinite)}
async function deletePlayerIds(ids){const unique=[...new Set(ids.map(Number).filter(Number.isFinite))];for(let i=0;i<unique.length;i+=80){const batch=unique.slice(i,i+80);const r=await fetch(`${supabaseUrl}/rest/v1/bundesliga_players?external_id=in.(${batch.join(',')})`,{method:"DELETE",headers:{...sbHeaders,Prefer:"return=minimal"}});if(!r.ok)throw new Error(`bundesliga_players stale delete: ${r.status} ${await r.text()}`)}if(unique.length)console.log(`✓ ${unique.length} veraltete Bundesliga-Spieler entfernt`)}
function dedupePlayers(rows){const byId=new Map();for(const row of rows){const id=Number(row?.external_id);if(Number.isFinite(id))byId.set(id,{...(byId.get(id)||{}),...row})}return[...byId.values()]}

console.log("Lade Bundesliga-Vereinsliste ...");const teamsData=await fd("/competitions/BL1/teams");
console.log("Lade Bundesliga-Tabelle ...");const standingsData=await fd("/competitions/BL1/standings");
console.log("Lade Bundesliga-Spielplan mit exakten Anstoßzeiten ...");const matchesData=await fd("/competitions/BL1/matches");
const table=standingsData.standings?.find(s=>s.type==="TOTAL")?.table||[];const tableById=Object.fromEntries(table.map(x=>[x.team.id,x]));
const matches=(matchesData.matches||[]).filter(m=>m.utcDate&&Number.isFinite(Date.parse(m.utcDate))).sort((a,b)=>Date.parse(a.utcDate)-Date.parse(b.utcDate));
const nextById={};for(const match of matches.filter(m=>Date.parse(m.utcDate)>=Date.now()-3*3600000)){for(const side of ["homeTeam","awayTeam"]){const id=match[side]?.id;if(id&&!nextById[id])nextById[id]={id:match.id,utcDate:match.utcDate,homeTeam:match.homeTeam?.name,awayTeam:match.awayTeam?.name}}}
const now=new Date().toISOString(),clubs=[],rawPlayers=[];
for(const baseTeam of teamsData.teams||[]){console.log(`Lade ${baseTeam.name} ...`);const team=await fd(`/teams/${baseTeam.id}`);const standing=tableById[team.id]||{};clubs.push({team:team.name,short_name:team.shortName||team.tla||team.name,crest_url:team.crest||null,coach:team.coach?.name||null,venue:team.venue||null,position:standing.position||null,points:standing.points||0,played:standing.playedGames||0,won:standing.won||0,drawn:standing.draw||0,lost:standing.lost||0,goals_for:standing.goalsFor||0,goals_against:standing.goalsAgainst||0,goal_difference:standing.goalDifference||0,form:standing.form||null,next_match:nextById[team.id]||null,source:"football-data.org",source_updated_at:now,updated_at:now});for(const p of team.squad||[])rawPlayers.push({external_id:p.id,name:p.name,first_name:p.firstName||null,last_name:p.lastName||null,position:p.position||null,shirt_number:p.shirtNumber||null,date_of_birth:p.dateOfBirth||null,nationality:p.nationality||null,team:team.name,team_external_id:team.id,photo_url:null,source:"football-data.org",source_updated_at:now,updated_at:now})}
const players=dedupePlayers(rawPlayers),oldIds=await existingPlayerIds(),currentIds=new Set(rawPlayers.map(p=>Number(p.external_id)).filter(Number.isFinite)),staleIds=oldIds.filter(id=>!currentIds.has(id));
await upsert("bundesliga_clubs",clubs,"team");await upsert("bundesliga_players",players,"external_id");await deletePlayerIds(staleIds);

// No schema migration is needed: publish the provider schedule as JSON in an existing
// club row. The client reads it from next_match.schedule230 and merges exact UTC times
// into its static season fixture list. This keeps kickoff corrections automatic.
const schedule230=matches.map(m=>({id:m.id,md:Number(m.matchday)||null,kickoffAt:m.utcDate,status:m.status||null,home:m.homeTeam?.name||null,away:m.awayTeam?.name||null})).filter(m=>m.md&&m.home&&m.away);
if(clubs.length&&schedule230.length){const carrier=clubs[0];await upsert("bundesliga_clubs",[{...carrier,next_match:{...(carrier.next_match||{}),schedule230,scheduleUpdatedAt:now}}],"team");console.log(`✓ ${schedule230.length} Anstoßzeiten für den Client veröffentlicht`)}
console.log(`✅ Update abgeschlossen: ${clubs.length} Vereine, ${players.length} Spieler, ${schedule230.length} terminierte Spiele.`);
