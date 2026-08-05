
import { isoNow, cleanText } from "./normalizers.mjs";
import { readFile } from "node:fs/promises";
import { upsert, setSyncStatus } from "./supabase.mjs";

const PROVIDER = "official-club-news";
const rawSources = process.env.OFFICIAL_NEWS_SOURCES_JSON || "";
async function loadSources() {
  let builtIn = [];
  try {
    builtIn = JSON.parse(await readFile(new URL("./official-news-sources.json", import.meta.url), "utf8"));
  } catch (error) {
    console.warn("Lokaler Quellenkatalog konnte nicht geladen werden:", error.message);
  }
  if (!rawSources.trim()) return builtIn;
  const configured = JSON.parse(rawSources);
  const merged = new Map();
  for (const source of [...builtIn, ...(Array.isArray(configured) ? configured : [])]) {
    if (source?.team && source?.url) merged.set(`${source.team}|${source.url}`, source);
  }
  return [...merged.values()];
}

function decode(value="") {
  return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}
function strip(value="") {
  return decode(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
function tag(block, names) {
  for (const name of names) {
    const match = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "i"));
    if (match) return strip(match[1]);
  }
  return "";
}
function link(block) {
  const atom = block.match(/<link[^>]+href=["']([^"']+)["']/i);
  if (atom) return decode(atom[1]);
  return tag(block, ["link"]);
}
function items(xml) {
  const rss = [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].map(x=>x[1]);
  if (rss.length) return rss;
  return [...xml.matchAll(/<entry(?:\s[^>]*)?>([\s\S]*?)<\/entry>/gi)].map(x=>x[1]);
}
function classify(text) {
  const t = text.toLocaleLowerCase("de-DE");
  const rules = [
    {words:["fällt aus","nicht zur verfügung","verletzt","ausfall"], type:"unavailable", score:-30},
    {words:["gesperrt","sperre"], type:"suspended", score:-30},
    {words:["fraglich","einsatz offen","angeschlagen"], type:"doubtful", score:-14},
    {words:["zurück im training","mannschaftstraining","wieder fit","einsatzbereit"], type:"return", score:16},
    {words:["rotation","belastungssteuerung","pausieren"], type:"rotation", score:-10},
    {words:["startelf","von beginn an","wird beginnen"], type:"starter_hint", score:14}
  ];
  for (const rule of rules) if (rule.words.some(w=>t.includes(w))) return {impact_type:rule.type,impact_score:rule.score,keywords:rule.words.filter(w=>t.includes(w))};
  return {impact_type:"information",impact_score:0,keywords:[]};
}
function idFor(team, url, title, date) {
  const value = `${team}|${url}|${title}|${date}`;
  let hash = 2166136261;
  for (let i=0;i<value.length;i++) hash = Math.imul(hash ^ value.charCodeAt(i), 16777619);
  return `${team.replace(/\W+/g,"-").toLowerCase()}-${(hash>>>0).toString(16)}`;
}

export async function syncOfficialNews() {
  let sources;
  try {
    sources = await loadSources();
  } catch {
    throw new Error("OFFICIAL_NEWS_SOURCES_JSON ist kein gültiges JSON.");
  }

  if (!Array.isArray(sources) || !sources.length) {
    await setSyncStatus(PROVIDER,{
      status:"disabled",
      message:"Keine verifizierten offiziellen RSS-/Atom-Quellen konfiguriert."
    });
    return {provider:PROVIDER,records:0,disabled:true};
  }

  await setSyncStatus(PROVIDER,{
    status:"running",
    message:`${sources.length} offizielle Quellen werden geprüft.`,
    last_started_at:isoNow()
  });

  const rows=[];
  const successful=[];
  const failed=[];

  for (const source of sources) {
    if (!source?.team || !source?.url) continue;

    try {
      const response = await fetch(source.url,{
        redirect:"follow",
        headers:{
          "User-Agent":"H2H-Coach/1.0 (+private fantasy manager app)",
          "Accept":"application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.2"
        },
        signal:AbortSignal.timeout(15000)
      });

      if (!response.ok) {
        failed.push({team:source.team,message:`HTTP ${response.status}`});
        continue;
      }

      const xml = await response.text();
      const parsedItems = items(xml).slice(0,25);
      if (!parsedItems.length) {
        failed.push({team:source.team,message:"Kein RSS-/Atom-Inhalt erkannt"});
        continue;
      }

      let sourceRows=0;
      for (const block of parsedItems) {
        const title=tag(block,["title"]);
        const summary=tag(block,["description","summary","content"]);
        const url=link(block);
        const published=tag(block,["pubDate","published","updated"]);
        if (!title) continue;

        const impact=classify(`${title} ${summary}`);
        let publishedAt=null;
        if (published) {
          const parsedDate=new Date(published);
          if (!Number.isNaN(parsedDate.getTime())) publishedAt=parsedDate.toISOString();
        }

        rows.push({
          external_id:idFor(source.team,url,title,published),
          team:source.team,
          title,
          summary:summary||null,
          url:url||null,
          published_at:publishedAt,
          source_name:source.name||source.team,
          source_type:"official_rss",
          trust_score:95,
          player_names:[],
          ...impact,
          updated_at:isoNow(),
          raw:{source:itemSafe(source),title,summary,url,published}
        });
        sourceRows++;
      }

      successful.push({team:source.team,records:sourceRows});
    } catch(error) {
      failed.push({
        team:source.team,
        message:error?.name==="TimeoutError"?"Zeitüberschreitung":error.message
      });
    }
  }

  if (rows.length) await upsert("official_club_news",rows,"external_id");

  const failureText=failed.length
    ? ` Ausgefallen: ${failed.map(x=>`${x.team} (${x.message})`).join(", ")}.`
    : "";

  if (!successful.length) {
    await setSyncStatus(PROVIDER,{
      status:"error",
      message:`Keine Quelle erreichbar.${failureText}`,
      records_written:0,
      last_error_at:isoNow()
    });
    return {provider:PROVIDER,records:0,successful,failed};
  }

  await setSyncStatus(PROVIDER,{
    status:"success",
    message:`${successful.length}/${sources.length} Quellen erreichbar; ${rows.length} Meldungen aktualisiert.${failureText}`,
    records_written:rows.length,
    last_success_at:isoNow()
  });

  return {provider:PROVIDER,records:rows.length,successful,failed};
}
function itemSafe(source){ return {team:source.team,name:source.name,url:source.url}; }
