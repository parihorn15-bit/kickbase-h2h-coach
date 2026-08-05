
import { syncFootballData } from "./provider-football-data.mjs";
import { syncSportmonks } from "./provider-sportmonks.mjs";
import { syncOfficialNews } from "./provider-official-news.mjs";

const providers = [
  ["football-data.org", syncFootballData],
  ["sportmonks", syncSportmonks],
  ["official-club-news", syncOfficialNews]
];

const results = [];
for (const [name, sync] of providers) {
  try {
    results.push(await sync());
  } catch (error) {
    console.error(`${name} fehlgeschlagen:`, error);
    results.push({ provider: name, error: error.message });
  }
}
console.log(JSON.stringify(results, null, 2));
if (results.every(x => x.error)) process.exitCode = 1;
