// Nur die öffentliche Projekt-URL und den PUBLISHABLE/ANON KEY eintragen.
// NIEMALS einen secret- oder service_role-Key hier eintragen.
window.H2H_CLOUD_CONFIG = {
  supabaseUrl: "https://amdtcadswtmgwdhytehe.supabase.co",
  supabasePublishableKey: "sb_publishable_7vPlnbXzjnUtPAIdvt4Zvw_y4kLL6zV",
  syncIntervalMs: 15000
};

window.H2H_APP_VERSION = '3.0.0';

// Production runtime bootstrap.
// index.html is intentionally kept as the stable shell; the current full runtime
// is loaded after app.js/cloud.js have initialized so the installed PWA and Pages
// always use the same production feature set.
window.addEventListener('load', () => {
  const versionNode = document.querySelector('#sidebar .brand small');
  if (versionNode) versionNode.textContent = 'Version 3.0.0 · wird geladen …';
  document.title = 'Kickbase H2H Coach 3.0.0';

  // Installed PWAs can keep an older worker alive for a while. Explicitly ask the
  // registration to check GitHub Pages for a fresh worker on every online launch.
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    setTimeout(async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) await registration.update();
      } catch (error) {
        console.warn('PWA update check failed', error);
      }
    }, 750);
  }

  if (document.querySelector('script[data-phase230-production]')) return;

  const runtime = document.createElement('script');
  runtime.src = 'phase230.js?v=300release1';
  runtime.async = false;
  runtime.dataset.phase230Production = '1';
  runtime.onerror = () => {
    if (versionNode) versionNode.textContent = 'Version 3.0.0 · Ladefehler';
    console.error('Kickbase Coach 3.0.0 production runtime could not be loaded.');
  };
  runtime.onload = () => {
    if (versionNode) versionNode.textContent = 'Version 3.0.0';
    const existing = document.querySelector('script[data-st1-anchor]');
    if (existing) return;
    const anchor = document.createElement('script');
    anchor.src = 'phase230-st1-anchor.js?v=300release1';
    anchor.async = false;
    anchor.dataset.st1Anchor = '1';
    anchor.onerror = () => console.error('Kickbase Coach ST1 screenshot anchor could not be loaded.');
    document.head.appendChild(anchor);
  };
  document.head.appendChild(runtime);
});
