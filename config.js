// Nur die öffentliche Projekt-URL und den PUBLISHABLE/ANON KEY eintragen.
// NIEMALS einen secret- oder service_role-Key hier eintragen.
window.H2H_CLOUD_CONFIG = {
  supabaseUrl: "https://amdtcadswtmgwdhytehe.supabase.co",
  supabasePublishableKey: "sb_publishable_7vPlnbXzjnUtPAIdvt4Zvw_y4kLL6zV",
  syncIntervalMs: 15000
};

// Production runtime bootstrap.
// index.html is intentionally kept as the stable shell; the current full runtime
// is loaded after app.js/cloud.js have initialized so the installed PWA and Pages
// always use the same production feature set.
window.addEventListener('load', () => {
  if (document.querySelector('script[data-phase230-production]')) return;

  const versionNode = document.querySelector('#sidebar .brand small');
  if (versionNode) versionNode.textContent = 'Version 2.3.0 · wird geladen …';
  document.title = 'Kickbase H2H Coach 2.3.0';

  const runtime = document.createElement('script');
  runtime.src = 'phase230.js?v=230fulluse17';
  runtime.async = false;
  runtime.dataset.phase230Production = '1';
  runtime.onerror = () => {
    if (versionNode) versionNode.textContent = 'Version 2.3.0 · Ladefehler';
    console.error('Kickbase Coach 2.3.0 production runtime could not be loaded.');
  };
  document.head.appendChild(runtime);
});
