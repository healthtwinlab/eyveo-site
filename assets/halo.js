/* EYVEO Halo — Partikelband um das Logo (Port von lib/core/ui/eyveo_halo.dart).
   Eigenes Skript: keine Cookies, kein Tracking, keine Netzwerkanfragen. */
(function () {
  'use strict';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var C0 = [57, 230, 242], C1 = [59, 123, 255], C2 = [155, 92, 255];
  var COLORS = 14, SIZES = 3, PERIOD = 18;
  function lerp(a, b, k) { return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]; }
  function grad(x) { x = Math.max(0, Math.min(1, x)); return x < 0.55 ? lerp(C0, C1, x / 0.55) : lerp(C1, C2, (x - 0.55) / 0.45); }
  function ease(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function rng(seed) { return function () { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }

  function Halo(root) {
    var cv = root.querySelector('canvas'), ctx = cv.getContext('2d');
    var logo = root.querySelector('img');
    var n = root.classList.contains('halo-sm') ? 180 : 260, rows = root.classList.contains('halo-sm') ? 11 : 15;
    var N = n * rows, U = new Float32Array(N), V = new Float32Array(N), J = new Float32Array(N), r = rng(7);
    for (var i = 0; i < n; i++) for (var k = 0; k < rows; k++) {
      var id = i * rows + k;
      U[id] = (i + r() * 0.6) / n; V[id] = -1 + 2 * (k + 0.5) / rows + (r() - 0.5) * 0.08; J[id] = r();
    }
    var buckets = [], cols = [];
    for (var b = 0; b < COLORS * SIZES; b++) buckets.push(new Float32Array(N * 2));
    var cnt = new Int32Array(COLORS * SIZES);
    for (var c = 0; c < COLORS; c++) cols.push(grad((c + 0.5) / COLORS));
    var W = 0, H = 0, dpr = 1;
    function resize() {
      var rc = cv.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = rc.width; H = rc.height;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    }
    resize();
    if (window.ResizeObserver) new ResizeObserver(resize).observe(cv); else addEventListener('resize', resize);

    var t = reduce ? 1.3 : 0, rt = 0, speed = 1, tiltX = 0, tiltY = 0, vX = 0, vY = 0;
    var dragging = false, touch = null, touchK = 0, wave = -1, actAt = -1, last = 0, visible = true, raf = 0;
    var downAt = null, moved = 0;

    function gatherK() {
      if (actAt < 0) return 0;
      var a = rt - actAt;
      if (a < 0.12) return 0;
      if (a < 0.62) return ease((a - 0.12) / 0.5);
      if (a < 1.3) return 1;
      var f = 1 - (a - 1.3) / 0.9;
      return f <= 0 ? 0 : ease(f);
    }

    function draw() {
      var w = W, h = H;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      var rx = w * 0.44, ry = Math.min(h * 0.40, rx * 0.46), band = ry * 0.42, cx = w / 2, cy = h / 2;
      var pulse = 1 + 0.02 * Math.sin(t * 2 * Math.PI / 2.6);
      var gk = gatherK(), glowBoost = 1 + 1.1 * gk;
      var rot = t * 2 * Math.PI / PERIOD;
      var tx = tiltX + 0.38 * Math.sin(t * 0.21), ty = tiltY + 0.12 * Math.sin(t * 0.17 + 1);
      var ctx_ = Math.cos(tx), stx = Math.sin(tx), cty = Math.cos(ty), sty = Math.sin(ty);
      var focal = Math.max(w, h) * 2.2;
      var wt = wave < 0 ? 99 : t - wave, waveR = wt * Math.max(w, h) * 0.9, waveK = wt < 1.6 ? 1 - wt / 1.6 : 0;
      var tk = touchK;
      for (var q = 0; q < cnt.length; q++) cnt[q] = 0;
      var baseDot = Math.max(1.2, Math.min(2.6, Math.min(w, h) / 220));
      for (var idx = 0; idx < N; idx++) {
        var v = V[idx], jit = J[idx];
        var shear = 0.82 + 0.36 * (0.5 + 0.5 * Math.sin(v * 1.7 + jit * 0.6));
        var th = U[idx] * 2 * Math.PI + rot * shear;
        var wv = 0.55 + 0.30 * Math.sin(2 * th + t * 0.22) + 0.15 * Math.sin(3 * th - t * 0.15 + 1.3);
        var twist = th + 0.9 * Math.sin(t * 0.17) + 0.5 * Math.sin(th * 2 - t * 0.21);
        var cth = Math.cos(th), sth = Math.sin(th);
        var x = rx * cth, y = ry * sth, z = 0;
        var nx = ry * cth, ny = rx * sth, nl = Math.sqrt(nx * nx + ny * ny);
        var wa = 0.32 * Math.sin(3 * th - t * 0.75 + v * 1.4) + 0.18 * Math.sin(5 * th + t * 0.5 - v * 2.1);
        var d = (v * wv + wa * 0.55) * band;
        x += nx / nl * d * Math.cos(twist); y += ny / nl * d * Math.cos(twist);
        z += d * Math.sin(twist) * 1.6 + band * 0.35 * Math.sin(2 * th - t * 0.6 + v);
        var fl = Math.sin(t * 0.5 + th * 4 + v * 3 + jit * 6.28) * band * 0.07;
        x += fl * Math.cos(th * 3); y += fl * Math.sin(th * 2);
        x *= pulse; y *= pulse;
        var y1 = y * ctx_ - z * stx, z1 = y * stx + z * ctx_;
        var x2 = x * cty + z1 * sty, z2 = -x * sty + z1 * cty;
        var kk = focal / (focal - z2), px = cx + x2 * kk, py = cy + y1 * kk;
        if (gk > 0) { var g = 1 - 0.3 * gk; px = cx + (px - cx) * g; py = cy + (py - cy) * g; }
        if (touch && tk > 0.01) {
          var dx = px - touch[0], dy = py - touch[1], dd = dx * dx + dy * dy, rr = band * 2.2;
          if (dd < rr * rr * 4) { var dist = Math.sqrt(dd) + 1e-3, push = tk * band * 0.9 * Math.exp(-dd / (rr * rr)); px += dx / dist * push; py += dy / dist * push; }
        }
        if (waveK > 0) {
          var ex = px - cx, ey = py - cy, ed = Math.sqrt(ex * ex + ey * ey) + 1e-3;
          var off = Math.exp(-Math.pow((ed - waveR) / (band * 1.2), 2)) * band * 0.7 * waveK;
          px += ex / ed * off; py += ey / ed * off;
        }
        var ang = Math.atan2(y1, x2), gx = 0.5 - 0.5 * Math.cos(ang - 0.6) + 0.12 * v;
        var ci = Math.floor(Math.max(0, Math.min(0.999, gx)) * COLORS);
        var depth = Math.max(0, Math.min(0.999, (z2 / (band * 1.6)) * 0.5 + 0.5));
        var bb = ci * SIZES + Math.floor(depth * SIZES), cc = cnt[bb];
        buckets[bb][cc * 2] = px; buckets[bb][cc * 2 + 1] = py; cnt[bb] = cc + 1;
      }
      for (var ci2 = 0; ci2 < COLORS; ci2++) {
        var col = cols[ci2];
        for (var si = 0; si < SIZES; si++) {
          var b2 = ci2 * SIZES + si, m = cnt[b2];
          if (!m) continue;
          var dp = (si + 0.5) / SIZES, a = Math.min(1, (0.38 + 0.55 * dp) * (0.85 + 0.15 * glowBoost));
          var wk = 0.12 * dp + 0.3 * gk, rgb = lerp(col, [255, 255, 255], wk);
          ctx.fillStyle = 'rgba(' + (rgb[0] | 0) + ',' + (rgb[1] | 0) + ',' + (rgb[2] | 0) + ',' + a.toFixed(3) + ')';
          var s = baseDot * (0.7 + 0.75 * dp), hs = s / 2, arr = buckets[b2];
          ctx.beginPath();
          for (var p = 0; p < m; p++) { ctx.moveTo(arr[p * 2] + hs, arr[p * 2 + 1]); ctx.arc(arr[p * 2], arr[p * 2 + 1], hs, 0, 6.2832); }
          ctx.fill();
        }
      }
      if (logo) {
        var sc = 1 + 0.045 * gk;
        logo.style.transform = 'scale(' + sc.toFixed(4) + ')';
        logo.style.filter = gk > 0.01 ? 'drop-shadow(0 0 ' + (4 + 18 * gk).toFixed(1) + 'px rgba(127,243,255,' + (0.85 * gk).toFixed(2) + '))' : '';
      }
      root.style.setProperty('--glow', (0.10 * glowBoost).toFixed(3));
    }

    function frame(ms) {
      raf = 0;
      var dt = last ? Math.min(0.05, Math.max(0, (ms - last) / 1000)) : 0;
      last = ms; rt += dt;
      var target = 1 + 3.2 * gatherK();
      speed += (target - speed) * (1 - Math.exp(-dt * 2.5));
      t += dt * speed;
      if (!dragging) {
        vX += (-18 * tiltX - 8.5 * vX) * dt; vY += (-18 * tiltY - 8.5 * vY) * dt;
        tiltX += vX * dt; tiltY += vY * dt;
      }
      touchK += ((touch ? 1 : 0) - touchK) * (1 - Math.exp(-dt * 6));
      draw();
      if (visible) raf = requestAnimationFrame(frame);
    }
    function start() { if (!raf && !reduce) { last = 0; raf = requestAnimationFrame(frame); } }
    if (reduce) draw(); else start();
    if (window.IntersectionObserver) new IntersectionObserver(function (e) {
      visible = e[0].isIntersecting; if (visible) start();
    }).observe(root);
    document.addEventListener('visibilitychange', function () { visible = !document.hidden; if (visible) start(); });

    function local(e) { var rc = cv.getBoundingClientRect(); return [e.clientX - rc.left, e.clientY - rc.top]; }
    root.addEventListener('pointerdown', function (e) { downAt = local(e); moved = 0; touch = downAt; dragging = true; });
    root.addEventListener('pointermove', function (e) {
      var p = local(e);
      if (downAt) {
        var mx = e.movementX || 0, my = e.movementY || 0; moved += Math.abs(mx) + Math.abs(my);
        tiltY = Math.max(-0.7, Math.min(0.7, tiltY + mx / W * 1.6));
        if (e.pointerType === 'mouse') tiltX = Math.max(-0.7, Math.min(0.7, tiltX - my / H * 1.6));
      }
      touch = p; // Maus: Partikel weichen auch beim Überfahren aus
    });
    function end() { downAt = null; dragging = false; }
    root.addEventListener('pointerup', end);
    root.addEventListener('pointercancel', function () { end(); touch = null; });
    root.addEventListener('pointerleave', function () { end(); touch = null; });

    // Klick: Welle, Partikel sammeln sich, dann zur Startseite
    root.addEventListener('click', function (e) {
      e.preventDefault();
      if (moved > 12) return; // war ein Ziehen, kein Tippen
      if (actAt >= 0 && rt - actAt < 1.2) return;
      wave = t; actAt = rt; start();
      var href = root.getAttribute('href') || '/';
      setTimeout(function () {
        var strip = function (x) { return x.replace(/index\.html$/, ''); };
        if (strip(new URL(href, location.href).pathname) === strip(location.pathname)) { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); }
        else location.href = href;
      }, reduce ? 0 : 640);
    });
  }
  var els = document.querySelectorAll('.halo-logo');
  for (var i = 0; i < els.length; i++) Halo(els[i]);
})();
