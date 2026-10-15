/* Nama situs dari config.js (dipisah dari index.html supaya Content-Security-Policy bisa melarang skrip inline) */
(function () { var c = window.NALAR_CONFIG || {}; if (c.siteName) { document.getElementById('site-name').textContent = c.siteName; document.title = c.siteName; } })();
