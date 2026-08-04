
(() => {
  const cfg = window.H2H_CLOUD_CONFIG || {};
  const configured =
    cfg.supabaseUrl &&
    cfg.supabasePublishableKey &&
    !cfg.supabaseUrl.includes("HIER_") &&
    !cfg.supabasePublishableKey.includes("HIER_");

  let client = null;
  let currentUser = null;
  let cloudReady = false;
  let saveTimer = null;
  let lastCloudUpdated = "";
  let pollingTimer = null;
  let syncing = false;

  const byId = id => document.getElementById(id);

  function setCloudState(text, kind="neutral") {
    const badge = byId("cloudBadge");
    if (!badge) return;
    badge.textContent = text;
    badge.dataset.kind = kind;
  }

  function showAuthPanel(message="") {
    const panel = byId("cloudPanel");
    if (!panel) return;
    panel.hidden = false;
    byId("cloudUserArea").hidden = true;
    byId("cloudLoginArea").hidden = false;
    byId("cloudMessage").textContent = message;
  }

  function showUserPanel(email) {
    const panel = byId("cloudPanel");
    if (!panel) return;
    panel.hidden = false;
    byId("cloudLoginArea").hidden = true;
    byId("cloudUserArea").hidden = false;
    byId("cloudEmailShown").textContent = email || "";
    byId("cloudMessage").textContent = "";
  }

  function hidePanel() {
    const panel = byId("cloudPanel");
    if (panel) panel.hidden = true;
  }


  async function fetchTeamStrengths() {
    if (!client || !currentUser) return;
    try {
      const { data: rows, error } = await client
        .from("team_strengths")
        .select("*")
        .order("overall", { ascending: false });

      if (error) {
        // Fehlende Tabelle oder Rechte sollen die App nicht blockieren.
        console.warn("Teamstärken-Cloud nicht verfügbar:", error.message || error);
        return;
      }
      if (!Array.isArray(rows) || rows.length === 0) return;

      data.teamStrength = {
        ...(window.TEAM_STRENGTH_BASELINE || {}),
        ...(data.teamStrength || {})
      };
      data.teamStrengthDetails = {
        ...(data.teamStrengthDetails || {})
      };

      for (const row of rows) {
        if (!row || !row.team || !Number.isFinite(Number(row.overall))) continue;
        data.teamStrength[row.team] = Number(row.overall);
        data.teamStrengthDetails[row.team] = {
          season: Number(row.season_score ?? row.overall ?? 5),
          form: Number(row.form_score ?? row.overall ?? 5),
          attack: Number(row.attack_score ?? row.overall ?? 5),
          defence: Number(row.defence_score ?? row.overall ?? 5),
          home: Number(row.home_score ?? row.overall ?? 5),
          away: Number(row.away_score ?? row.overall ?? 5),
          matchesPlayed: Number(row.matches_played ?? 0),
          source: row.source || "OpenLigaDB",
          sourceUpdatedAt: row.source_updated_at || row.updated_at || ""
        };
      }

      data.teamStrengthCloudUpdatedAt =
        rows.find(r => r?.updated_at)?.updated_at ||
        data.teamStrengthCloudUpdatedAt ||
        "";

      localStorage.setItem("kickbaseCoachV07", JSON.stringify(data));
      if (!window.h2hEditingInProgress?.()) render();
    } catch (err) {
      console.warn("Teamstärken konnten nicht geladen werden:", err);
    }
  }


  async function fetchBundesligaLiveData(){
    if(!client||!currentUser)return;
    try{
      const [{data:clubs,error:clubError},{data:players,error:playerError}]=await Promise.all([
        client.from("bundesliga_clubs").select("*").order("position",{ascending:true,nullsFirst:false}),
        client.from("bundesliga_players").select("*").order("team").order("name")
      ]);
      if(!clubError&&Array.isArray(clubs))window.BUNDESLIGA_CLUBS=clubs;
      if(!playerError&&Array.isArray(players))window.BUNDESLIGA_PLAYERS=players;
      if(!window.h2hEditingInProgress?.())render();
    }catch(error){console.warn("Bundesliga-Livedaten nicht verfügbar:",error)}
  }

  async function fetchCloudState({initial=false}={}) {
    if (!client || !currentUser || syncing) return;
    syncing = true;
    setCloudState("Synchronisiere …", "working");
    try {
      const { data: row, error } = await client
        .from("coach_state")
        .select("state, updated_at")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (error) throw error;

      if (!row) {
        const { error: insertError } = await client
          .from("coach_state")
          .insert({ user_id: currentUser.id, state: data });
        if (insertError) throw insertError;
        lastCloudUpdated = new Date().toISOString();
        setCloudState("Cloud eingerichtet", "good");
      } else {
        const remoteTime = row.updated_at || "";
        const shouldApply = initial || (remoteTime && remoteTime > lastCloudUpdated);
        if (shouldApply && row.state) {
          if (window.h2hEditingInProgress?.()) {
            setCloudState("Eingabe wird geschützt", "working");
          } else {
            data = mergeData(row.state);
            localStorage.setItem("kickbaseCoachV07", JSON.stringify(data));
            lastCloudUpdated = remoteTime;
            render();
          }
        }
        setCloudState("Cloud aktuell", "good");
      }
      cloudReady = true;
      await fetchTeamStrengths();
      await fetchBundesligaLiveData();
    } catch (err) {
      console.error(err);
      setCloudState("Cloud-Fehler", "bad");
      const msg = err?.message || "Synchronisierung fehlgeschlagen.";
      const m = byId("cloudMessage");
      if (m) m.textContent = msg;
    } finally {
      syncing = false;
    }
  }

  async function pushCloudState() {
    if (!client || !currentUser || !cloudReady || syncing) return;
    syncing = true;
    setCloudState("Speichere …", "working");
    try {
      const { data: row, error } = await client
        .from("coach_state")
        .upsert(
          { user_id: currentUser.id, state: data, updated_at: new Date().toISOString() },
          { onConflict: "user_id" }
        )
        .select("updated_at")
        .single();
      if (error) throw error;
      lastCloudUpdated = row?.updated_at || new Date().toISOString();
      setCloudState("Gespeichert", "good");
    } catch (err) {
      console.error(err);
      setCloudState("Nicht synchronisiert", "bad");
    } finally {
      syncing = false;
    }
  }

  window.cloudQueueSave = () => {
    if (!cloudReady) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(pushCloudState, 700);
  };

  async function signIn() {
    const email = byId("cloudEmail")?.value.trim();
    if (!email) {
      byId("cloudMessage").textContent = "Bitte deine E-Mail-Adresse eintragen.";
      return;
    }
    setCloudState("Login-Link wird gesendet …", "working");
    const redirectTo = location.href.split("#")[0].split("?")[0];
    const { error } = await client.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo }
    });
    if (error) {
      byId("cloudMessage").textContent = error.message;
      setCloudState("Login fehlgeschlagen", "bad");
      return;
    }
    byId("cloudMessage").textContent =
      "E-Mail wurde gesendet. Öffne den Login-Link auf diesem Gerät.";
    setCloudState("E-Mail prüfen", "working");
  }

  async function signOut() {
    await client.auth.signOut();
    currentUser = null;
    cloudReady = false;
    clearInterval(pollingTimer);
    setCloudState("Nicht angemeldet", "neutral");
    showAuthPanel("Du wurdest abgemeldet. Lokale Daten bleiben erhalten.");
  }

  async function onSession(session) {
    currentUser = session?.user || null;
    if (!currentUser) {
      cloudReady = false;
      setCloudState("Nicht angemeldet", "neutral");
      showAuthPanel();
      return;
    }
    showUserPanel(currentUser.email);
    await fetchCloudState({initial:true});
    clearInterval(pollingTimer);
    pollingTimer = setInterval(() => fetchCloudState(), cfg.syncIntervalMs || 15000);
  }

  async function initCloud() {
    const badge = byId("cloudBadge");
    if (badge) badge.onclick = () => {
      const panel = byId("cloudPanel");
      panel.hidden = !panel.hidden;
    };
    byId("cloudClose")?.addEventListener("click", hidePanel);

    if (!configured) {
      setCloudState("Cloud noch nicht eingerichtet", "bad");
      showAuthPanel(
        "Öffne config.js und trage deine Supabase-Projekt-URL sowie den Publishable Key ein."
      );
      byId("cloudLoginBtn").disabled = true;
      return;
    }

    client = window.supabase.createClient(
      cfg.supabaseUrl,
      cfg.supabasePublishableKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      }
    );

    byId("cloudLoginBtn")?.addEventListener("click", signIn);
    byId("cloudLogoutBtn")?.addEventListener("click", signOut);
    byId("cloudSyncNow")?.addEventListener("click", () => fetchCloudState({initial:true}));
    byId("cloudUploadLocal")?.addEventListener("click", async () => {
      cloudReady = true;
      await fetchTeamStrengths();
      await fetchBundesligaLiveData();
      await pushCloudState();
    });

    const { data: { session } } = await client.auth.getSession();
    await onSession(session);

    client.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => onSession(session), 0);
    });

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && currentUser) { fetchCloudState(); fetchTeamStrengths(); fetchBundesligaLiveData(); }
    });
    window.addEventListener("focus", () => {
      if (currentUser) { fetchCloudState(); fetchTeamStrengths(); fetchBundesligaLiveData(); }
    });
  }

  window.addEventListener("DOMContentLoaded", initCloud);
})();
