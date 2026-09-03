// Nur die öffentliche Projekt-URL und den PUBLISHABLE/ANON KEY eintragen.
// NIEMALS einen secret- oder service_role-Key hier eintragen.
window.H2H_CLOUD_CONFIG = {
  supabaseUrl: "https://amdtcadswtmgwdhytehe.supabase.co",
  supabasePublishableKey: "sb_publishable_7vPlnbXzjnUtPAIdvt4Zvw_y4kLL6zV",
  syncIntervalMs: 15000
};

// Production runtime bootstrap. Service-worker registration is owned by index.html.
// version.js is the single canonical source for app version and release asset key.
window.addEventListener('load', async () => {
  const versionNode = document.querySelector('#sidebar .brand small');
  const loadRelease = () => new Promise((resolve, reject) => {
    if (window.H2H_RELEASE?.version) { resolve(window.H2H_RELEASE); return; }
    const existing = document.querySelector('script[data-h2h-release]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.H2H_RELEASE), { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = `version.js?v=canonical1&t=${Date.now()}`;
    script.async = false;
    script.dataset.h2hRelease = '1';
    script.onload = () => window.H2H_RELEASE?.version ? resolve(window.H2H_RELEASE) : reject(new Error('Canonical release metadata missing.'));
    script.onerror = () => reject(new Error('Canonical release metadata could not be loaded.'));
    document.head.appendChild(script);
  });

  try {
    const release = await loadRelease();
    const appVersion = release.version;
    const assetKey = release.assetKey;
    if (versionNode) versionNode.textContent = `Version ${appVersion} · wird geladen …`;
    document.title = `Kickbase H2H Coach ${appVersion}`;

    if (
      window.__H2H_PHASE230_BOOTSTRAPPED__ ||
      document.querySelector('script[data-phase230-production]') ||
      document.querySelector('script[src*="phase230.js"]')
    ) {
      if (versionNode) versionNode.textContent = `Version ${appVersion}`;
      return;
    }

    const runtime = document.createElement('script');
    runtime.src = `phase230.js?v=${encodeURIComponent(assetKey)}`;
    runtime.async = false;
    runtime.dataset.phase230Production = '1';
    runtime.onerror = () => {
      if (versionNode) versionNode.textContent = `Version ${appVersion} · Ladefehler`;
      console.error(`Kickbase Coach ${appVersion} production runtime could not be loaded.`);
    };
    runtime.onload = () => {
      if (versionNode) versionNode.textContent = `Version ${appVersion}`;
    };
    document.head.appendChild(runtime);
  } catch (error) {
    if (versionNode) versionNode.textContent = 'Version unbekannt · Ladefehler';
    console.error('Kickbase Coach release metadata could not be loaded.', error);
  }
});
