// App-Funktionen: Service Worker, Installieren-Knopf. (Reichweitenmessung: <Analytics /> im Layout, ohne Cookies.)
(() => {
  const tr = (document.documentElement.lang || '').startsWith('tr');
  const T = tr
    ? { install: 'Uygulamayı yükle', iosT: 'Ana ekrana ekle', iosP: 'Safari\'de alttaki „Paylaş“ simgesine, sonra „Ana Ekrana Ekle“ seçeneğine dokun.', ok: 'Tamam' }
    : { install: 'App installieren', iosT: 'Zum Home-Bildschirm', iosP: 'Tippe in Safari unten auf „Teilen“ und dann auf „Zum Home-Bildschirm“.', ok: 'OK' };

  if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));

  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const btn = document.getElementById('installbtn');
  if (!btn || standalone) return;
  const label = btn.querySelector('span'); if (label) label.textContent = T.install;
  btn.setAttribute('aria-label', T.install);
  let deferred = null;
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; btn.hidden = false; });
  window.addEventListener('appinstalled', () => { btn.hidden = true; deferred = null; });
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (ios) btn.hidden = false;
  btn.addEventListener('click', async () => {
    if (deferred) { deferred.prompt(); await deferred.userChoice.catch(() => {}); deferred = null; btn.hidden = true; return; }
    if (ios) {
      let d = document.getElementById('iosdlg');
      if (!d) {
        d = document.createElement('dialog'); d.id = 'iosdlg';
        d.innerHTML = `<h3 style="margin:0 0 8px;font-size:19px;color:#0f2d4a">${T.iosT}</h3><p style="margin:0 0 18px;color:#56616f;line-height:1.5">${T.iosP}</p><form method="dialog" style="margin:0;text-align:right"><button style="font:inherit;font-weight:600;border:0;border-radius:8px;background:#0f2d4a;color:#fff;padding:10px 18px">${T.ok}</button></form>`;
        d.style.cssText = 'border:1px solid #dfe4ea;border-radius:12px;padding:22px;max-width:340px;font-family:inherit';
        document.body.appendChild(d);
      }
      d.showModal();
    }
  });
})();
