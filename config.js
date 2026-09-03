// Nur die öffentliche Projekt-URL und den PUBLISHABLE/ANON KEY eintragen.
// NIEMALS einen secret- oder service_role-Key hier eintragen.
window.H2H_CLOUD_CONFIG = {
  supabaseUrl: "https://amdtcadswtmgwdhytehe.supabase.co",
  supabasePublishableKey: "sb_publishable_7vPlnbXzjnUtPAIdvt4Zvw_y4kLL6zV",
  syncIntervalMs: 15000
};

window.H2H_APP_VERSION = '3.0.0';

// Production runtime bootstrap. Service-worker registration is owned by index.html.
// Never force a worker update or load phase230.js twice: both can restart the UI.
window.addEventListener('load', () => {
  const versionNode = document.querySelector('#sidebar .brand small');
  if (versionNode) versionNode.textContent = 'Version 3.0.0 · wird geladen …';
  document.title = 'Kickbase H2H Coach 3.0.0';

  if (
    window.__H2H_PHASE230_BOOTSTRAPPED__ ||
    document.querySelector('script[data-phase230-production]') ||
    document.querySelector('script[src*="phase230.js"]')
  ) {
    if (versionNode) versionNode.textContent = 'Version 3.0.0';
    return;
  }

  const runtime = document.createElement('script');
  runtime.src = 'phase230.js?v=300reloadfix1';
  runtime.async = false;
  runtime.dataset.phase230Production = '1';
  runtime.onerror = () => {
    if (versionNode) versionNode.textContent = 'Version 3.0.0 · Ladefehler';
    console.error('Kickbase Coach 3.0.0 production runtime could not be loaded.');
  };
  runtime.onload = () => {
    if (versionNode) versionNode.textContent = 'Version 3.0.0';
  };
  document.head.appendChild(runtime);
});
