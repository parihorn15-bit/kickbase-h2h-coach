
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("SUPABASE_URL oder SUPABASE_SERVICE_ROLE_KEY fehlt.");

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json"
};

export async function upsert(table, rows, conflict) {
  if (!rows?.length) return;
  const response = await fetch(`${url}/rest/v1/${table}?on_conflict=${encodeURIComponent(conflict)}`, {
    method: "POST",
    headers: { ...headers, Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(rows)
  });
  if (!response.ok) throw new Error(`${table}: ${response.status} ${await response.text()}`);
}

export async function setSyncStatus(provider, patch) {
  const row = { provider, updated_at: new Date().toISOString(), ...patch };
  await upsert("data_sync_status", [row], "provider");
}
