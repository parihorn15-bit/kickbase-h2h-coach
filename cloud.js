
(() => {
  const cfg = window.H2H_CLOUD_CONFIG || {};
  const configured = cfg.supabaseUrl && cfg.supabasePublishableKey && !cfg.supabaseUrl.includes("HIER_") && !cfg.supabasePublishableKey.includes("HIER_");
  let client=null,currentUser=null,cloudReady=false,saveTimer=null,lastCloudUpdated="",pollingTimer=null,syncing=false;
  const byId=id=>document.getElementById(id);
  const same=(a,b)=>JSON.stringify(a??null)===JSON.stringify(b??null);
  function setCloudState(text,kind="neutral"){const badge=byId("cloudBadge");if(!badge)return;badge.textContent=text;badge.dataset.kind=kind}
  function showAuthPanel(message=""){const panel=byId("cloudPanel");if(!panel)return;panel.hidden=false;byId("cloudUserArea").hidden=true;byId("cloudLoginArea").hidden=false;byId("cloudMessage").textContent=message}
  function showUserPanel(email){const panel=byId("cloudPanel");if(!panel)return;panel.hidden=false;byId("cloudLoginArea").hidden=true;byId("cloudUserArea").hidden=false;byId("cloudEmailShown").textContent=email||"";byId("cloudMessage").textContent=""}
  function hidePanel(){const panel=byId("cloudPanel");if(panel)panel.hidden=true}

  async function fetchTeamStrengths(){
    if(!client||!currentUser)return false;
    try{
      const{data:rows,error}=await client.from("team_strengths").select("*").order("overall",{ascending:false});
      if(error||!Array.isArray(rows)||!rows.length)return false;
      const nextStrength={...(window.TEAM_STRENGTH_BASELINE||{}),...(data.teamStrength||{})};
      const nextDetails={...(data.teamStrengthDetails||{})};
      for(const row of rows){
        if(!row?.team||!Number.isFinite(Number(row.overall)))continue;
        nextStrength[row.team]=Number(row.overall);
        nextDetails[row.team]={season:Number(row.season_score??row.overall??5),form:Number(row.form_score??row.overall??5),attack:Number(row.attack_score??row.overall??5),defence:Number(row.defence_score??row.overall??5),home:Number(row.home_score??row.overall??5),away:Number(row.away_score??row.overall??5),matchesPlayed:Number(row.matches_played??0),source:row.source||"OpenLigaDB",sourceUpdatedAt:row.source_updated_at||row.updated_at||""};
      }
      const changed=!same(data.teamStrength,nextStrength)||!same(data.teamStrengthDetails,nextDetails);
      if(changed){
        data.teamStrength=nextStrength;
        data.teamStrengthDetails=nextDetails;
        localStorage.setItem("kickbaseCoachV07",JSON.stringify(data));
      }
      return changed;
    }catch(err){console.warn("Teamstärken konnten nicht geladen werden:",err);return false}
  }

  async function fetchOfficialNews(){
    if(!client||!currentUser)return false;
    try{
      const{data:news,error}=await client.from("official_club_news").select("*").gte("published_at",new Date(Date.now()-21*86400000).toISOString()).order("published_at",{ascending:false}).limit(250);
      if(error||!Array.isArray(news))return false;
      const changed=!same(window.OFFICIAL_CLUB_NEWS,news);
      if(changed)window.OFFICIAL_CLUB_NEWS=news;
      return changed;
    }catch(error){console.warn("Offizielle Meldungen konnten nicht geladen werden:",error);return false}
  }

  async function fetchDataEngine(){
    if(!client||!currentUser)return false;
    try{
      const[{data:availability,error:aError},{data:status,error:sError}]=await Promise.all([
        client.from("player_availability").select("*").gte("fixture_date",new Date(Date.now()-2*86400000).toISOString()).lte("fixture_date",new Date(Date.now()+14*86400000).toISOString()).order("provider_updated_at",{ascending:false}),
        client.from("data_sync_status").select("*").order("provider")
      ]);
      let changed=false;
      if(!aError&&Array.isArray(availability)&&!same(window.PLAYER_AVAILABILITY,availability)){window.PLAYER_AVAILABILITY=availability;changed=true}
      if(!sError&&Array.isArray(status)&&!same(window.DATA_SYNC_STATUS,status)){window.DATA_SYNC_STATUS=status;changed=true}
      return changed;
    }catch(error){console.warn("Data Engine konnte nicht geladen werden:",error);return false}
  }

  function mergeKickoffSchedule(clubs){
    const schedule=clubs.flatMap(c=>Array.isArray(c?.next_match?.schedule230)?c.next_match.schedule230:[]);
    if(!schedule.length||!Array.isArray(window.FIXTURES))return false;
    const changed=!same(window.H2H_BUNDESLIGA_SCHEDULE,schedule);
    if(!changed)return false;
    const norm=v=>String(v||'').toLocaleLowerCase('de-DE').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
    for(const live of schedule){
      const fixture=window.FIXTURES.find(f=>Number(f.md)===Number(live.md)&&norm(f.home)===norm(live.home)&&norm(f.away)===norm(live.away));
      if(!fixture)continue;
      fixture.kickoffAt=live.kickoffAt;
      fixture.externalMatchId=live.id;
      fixture.status=live.status;
    }
    window.H2H_BUNDESLIGA_SCHEDULE=schedule;
    window.dispatchEvent(new CustomEvent('h2h:kickoff-schedule',{detail:{count:schedule.length}}));
    return true;
  }

  async function fetchBundesligaLiveData(){
    if(!client||!currentUser)return false;
    try{
      const[{data:clubs,error:clubError},{data:players,error:playerError}]=await Promise.all([
        client.from("bundesliga_clubs").select("*").order("position",{ascending:true,nullsFirst:false}),
        client.from("bundesliga_players").select("*").eq("competition_code","BL1").order("team").order("name")
      ]);
      let changed=false;
      if(!clubError&&Array.isArray(clubs)){
        if(!same(window.BUNDESLIGA_CLUBS,clubs)){window.BUNDESLIGA_CLUBS=clubs;changed=true}
        if(mergeKickoffSchedule(clubs))changed=true;
      }
      if(!playerError&&Array.isArray(players)&&!same(window.BUNDESLIGA_PLAYERS,players)){window.BUNDESLIGA_PLAYERS=players;changed=true}
      return changed;
    }catch(error){console.warn("Bundesliga-Livedaten nicht verfügbar:",error);return false}
  }

  async function fetchCloudState({applyRemote=false,loadAux=true}={}){
    if(!client||!currentUser||syncing)return;
    syncing=true;
    setCloudState(applyRemote?"Synchronisiere …":"Cloud wird geprüft …","working");
    let shouldRender=false;
    try{
      const{data:row,error}=await client.from("coach_state").select("state, updated_at").eq("user_id",currentUser.id).maybeSingle();
      if(error)throw error;
      if(!row){
        const{data:created,error:insertError}=await client.from("coach_state").insert({user_id:currentUser.id,state:data}).select("updated_at").single();
        if(insertError)throw insertError;
        lastCloudUpdated=created?.updated_at||new Date().toISOString();
        setCloudState("Cloud eingerichtet","good");
      }else{
        lastCloudUpdated=row.updated_at||lastCloudUpdated;
        if(applyRemote&&row.state&&!window.h2hEditingInProgress?.()){
          const merged=mergeData(row.state);
          shouldRender=!same(data,merged);
          if(shouldRender){
            data=merged;
            localStorage.setItem("kickbaseCoachV07",JSON.stringify(data));
          }
        }
        setCloudState(applyRemote?"Cloud übernommen":"Cloud verbunden","good");
      }
      cloudReady=true;
      if(loadAux){
        const changes=await Promise.all([fetchTeamStrengths(),fetchBundesligaLiveData(),fetchDataEngine(),fetchOfficialNews()]);
        if(changes.some(Boolean))shouldRender=true;
      }
      if(shouldRender&&!window.h2hEditingInProgress?.())render();
    }catch(err){
      console.error(err);
      setCloudState("Cloud-Fehler","bad");
      const m=byId("cloudMessage");if(m)m.textContent=err?.message||"Synchronisierung fehlgeschlagen.";
    }finally{syncing=false}
  }

  async function pushCloudState(){
    if(!client||!currentUser||!cloudReady||syncing)return;
    syncing=true;setCloudState("Speichere …","working");
    try{
      const{data:row,error}=await client.from("coach_state").upsert({user_id:currentUser.id,state:data,updated_at:new Date().toISOString()},{onConflict:"user_id"}).select("updated_at").single();
      if(error)throw error;
      lastCloudUpdated=row?.updated_at||new Date().toISOString();
      setCloudState("Gespeichert","good");
    }catch(err){console.error(err);setCloudState("Nicht synchronisiert","bad")}
    finally{syncing=false}
  }

  window.cloudQueueSave=()=>{if(!cloudReady)return;clearTimeout(saveTimer);const attempt=async()=>{if(syncing){saveTimer=setTimeout(attempt,500);return}await pushCloudState()};saveTimer=setTimeout(attempt,350)};
  window.cloudFlushSave=async()=>{if(!cloudReady)return false;clearTimeout(saveTimer);const started=Date.now();while(syncing&&Date.now()-started<10000)await new Promise(r=>setTimeout(r,150));if(syncing)return false;await pushCloudState();return true};
  async function signIn(){const email=byId("cloudEmail")?.value.trim();if(!email){byId("cloudMessage").textContent="Bitte deine E-Mail-Adresse eintragen.";return}setCloudState("Login-Link wird gesendet …","working");const redirectTo=location.href.split("#")[0].split("?")[0];const{error}=await client.auth.signInWithOtp({email,options:{emailRedirectTo:redirectTo}});if(error){byId("cloudMessage").textContent=error.message;setCloudState("Login fehlgeschlagen","bad");return}byId("cloudMessage").textContent="E-Mail wurde gesendet. Öffne den Login-Link auf diesem Gerät.";setCloudState("E-Mail prüfen","working")}
  async function signOut(){await client.auth.signOut();currentUser=null;cloudReady=false;clearInterval(pollingTimer);setCloudState("Nicht angemeldet","neutral");showAuthPanel("Du wurdest abgemeldet. Lokale Daten bleiben erhalten.")}
  async function onSession(session){
    currentUser=session?.user||null;
    clearInterval(pollingTimer);pollingTimer=null;
    if(!currentUser){cloudReady=false;setCloudState("Nicht angemeldet","neutral");showAuthPanel();return}
    hidePanel();
    setCloudState("Verbunden","good");
    // Local data is authoritative on startup. Never import coach_state automatically.
    await fetchCloudState({applyRemote:false,loadAux:true});
  }
  async function init(){if(!configured||!window.supabase){setCloudState("Cloud nicht eingerichtet","bad");return}client=window.supabase.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});const{data:{session}}=await client.auth.getSession();await onSession(session);client.auth.onAuthStateChange((_event,newSession)=>{if(newSession?.user?.id!==currentUser?.id)onSession(newSession)})}
  document.addEventListener("click",event=>{const id=event.target?.id;if(id==="cloudBadge")currentUser?showUserPanel(currentUser.email):showAuthPanel();if(id==="cloudClose")hidePanel();if(id==="cloudLoginBtn")signIn();if(id==="cloudLogoutBtn")signOut();if(id==="cloudSyncNow")fetchCloudState({applyRemote:true,loadAux:true});if(id==="cloudUploadLocal")pushCloudState()});
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
