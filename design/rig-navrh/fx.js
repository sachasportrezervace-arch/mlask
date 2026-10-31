  // ---------- efekty: ploché tvary, linka jen tam, kde by bílá zanikla na nebi ----------
  // pírko: zahnutý list s brkem; s = délka, rot = natočení, flip = zrcadlo
  function feather(c, x, y, s, rot, col) {
    c.save(); c.translate(x, y); c.rotate(rot);
    c.beginPath(); c.moveTo(-s * 0.5, 0); c.quadraticCurveTo(-s * 0.1, -s * 0.34, s * 0.5, -s * 0.06); c.quadraticCurveTo(s * 0.05, s * 0.3, -s * 0.5, 0); c.closePath();
    paint(c, col || P.white, Math.max(1.6, s * 0.075));
    c.beginPath(); c.moveTo(-s * 0.62, s * 0.04); c.quadraticCurveTo(-s * 0.05, -s * 0.06, s * 0.42, -s * 0.06); line(c, Math.max(1.2, s * 0.05));
    c.restore();
  }
  // obláček „puf“: shluk kruhů jednou obrysovou linkou (nejdřív obrys všech, pak výplň), u = 0..1 průběh
  function poof(c, x, y, r, u, col, seed) {
    var n = 6, grow = 0.55 + 0.6 * (1 - Math.pow(1 - Math.min(1, u * 1.6), 3)), fade = u < 0.55 ? 1 : 1 - (u - 0.55) / 0.45, rr = r * grow;
    if (fade <= 0) return;
    var pts = [];
    for (var i = 0; i < n; i++) { var a = i / n * TAU + (seed || 0), d = rr * (0.62 + 0.18 * hash(i, seed | 0)); pts.push([x + Math.cos(a) * d, y + Math.sin(a) * d * 0.8, rr * (0.5 + 0.18 * hash(i + 7, seed | 0)) * fade]); }
    pts.push([x, y, rr * 0.7 * fade]);
    c.fillStyle = P.ink; for (var j = 0; j < pts.length; j++) { circ(c, pts[j][0], pts[j][1], pts[j][2] + 3.6); c.fill(); }
    c.fillStyle = col || P.white; for (j = 0; j < pts.length; j++) { circ(c, pts[j][0], pts[j][1], pts[j][2]); c.fill(); }
  }
  // impact frame: hvězda nárazu na 2–4 snímky (u 0..1), za postavou
  function impact(c, x, y, r, u, rot) {
    var k = u < 0.35 ? 1 : 1 - (u - 0.35) / 0.65; if (k <= 0) return;
    c.save(); c.translate(x, y); c.rotate(rot || 0);
    var pts = 9;
    c.beginPath();
    for (var i = 0; i < pts * 2; i++) { var a = i / (pts * 2) * TAU, q = i % 2 ? 0.42 : 0.86 + 0.24 * hash(i, 3); c.lineTo(Math.cos(a) * r * q * (0.7 + 0.3 * k), Math.sin(a) * r * q * (0.7 + 0.3 * k)); }
    c.closePath(); c.globalAlpha = k; paint(c, P.white, 4);
    c.beginPath();
    for (i = 0; i < pts * 2; i++) { a = i / (pts * 2) * TAU + 0.18, q = i % 2 ? 0.22 : 0.5; c.lineTo(Math.cos(a) * r * q, Math.sin(a) * r * q); }
    c.closePath(); fill(c, P.yellow);
    c.globalAlpha = 1; c.restore();
  }
  // stopa letu: zužující se pruh za předmětem (pts od nejstaršího po nejnovější)
  function trail(c, pts, w, col, alpha) {
    if (pts.length < 3) return;
    var L = [], R = [];
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i], q = pts[Math.min(pts.length - 1, i + 1)], o = pts[Math.max(0, i - 1)], dx = q[0] - o[0], dy = q[1] - o[1], d = Math.hypot(dx, dy) || 1, k = Math.pow(i / (pts.length - 1), 1.4) * w;
      L.push([p[0] - dy / d * k, p[1] + dx / d * k]); R.push([p[0] + dy / d * k, p[1] - dx / d * k]);
    }
    c.beginPath(); c.moveTo(L[0][0], L[0][1]);
    for (i = 1; i < L.length; i++) c.lineTo(L[i][0], L[i][1]);
    for (i = R.length - 1; i >= 0; i--) c.lineTo(R[i][0], R[i][1]);
    c.closePath(); c.globalAlpha = alpha == null ? 0.55 : alpha; fill(c, col || P.white); c.globalAlpha = 1;
  }
  // prach při dopadu: dva obláčky kloužou po zemi do stran a mizí
  function dust(c, x, y, s, u, col) {
    var e = 1 - Math.pow(1 - Math.min(1, u), 2.4), k = Math.max(0, 1 - u);
    c.fillStyle = col || "rgba(255,255,255,.85)";
    for (var sdx = -1; sdx <= 1; sdx += 2) for (var i = 0; i < 3; i++) {
      var px = x + sdx * (10 + e * (34 + i * 16)) * s, py = y - (6 + i * 5 * (1 - e)) * s, r = (11 - i * 2.4) * s * (0.5 + 0.5 * k) + 2;
      circ(c, px, py, r * k + 0.01); c.fill();
    }
  }
