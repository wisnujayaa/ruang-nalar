/* Site name from config.js (kept out of index.html so the Content-Security-Policy can forbid inline scripts) */
(function () { var c = window.NALAR_CONFIG || {}; if (c.siteName) { document.getElementById('site-name').textContent = c.siteName; document.title = c.siteName; } })();
