  // ---------- efekty: ploché tvary, linka jen tam, kde by bílá zanikla na nebi ----------
  // pírko: zahnutý list s brkem; s = délka, rot = natočení, flip = zrcadlo
  function feather(c, x, y, s, rot, col) {
    c.save(); c.translate(x, y); c.rotate(rot);
    c.beginPath(); c.moveTo(-s * 0.46, 0); c.bezierCurveTo(-s * 0.3, -s * 0.5, s * 0.1, -s * 0.62, s * 0.5, -s * 0.2); c.lineTo(s * 0.4, -s * 0.08); c.lineTo(s * 0.5, s * 0.02); c.lineTo(s * 0.34, s * 0.08); c.bezierCurveTo(s * 0.1, s * 0.4, -s * 0.2, s * 0.34, -s * 0.46, 0); c.closePath();
    paint(c, col || P.white, Math.max(2, s * 0.08));
    c.beginPath(); c.moveTo(-s * 0.74, s * 0.1); c.quadraticCurveTo(-s * 0.1, -s * 0.04, s * 0.46, -s * 0.12); line(c, Math.max(1.8, s * 0.07));
    c.beginPath(); c.moveTo(-s * 0.18, -s * 0.02); c.lineTo(-s * 0.02, -s * 0.22); c.moveTo(s * 0.08, -s * 0.08); c.lineTo(s * 0.18, -s * 0.28); line(c, Math.max(1.2, s * 0.04), "#C9C3E8");
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
  // náraz: 5 krátkých čárek kolem místa dopadu (jen v obloučku od směru letu), u 0..1 – čárky se oddalují a zkracují
  function impact(c, x, y, r, u, rot) {
    var k = u < 0.2 ? 1 : 1 - (u - 0.2) / 0.8; if (k <= 0) return;
    c.save(); c.translate(x, y); c.rotate(rot || 0);
    for (var i = -2; i <= 2; i++) {
      var a = Math.PI + i * 0.5, r0 = r * (0.62 + 0.5 * (1 - k)), r1 = r0 + r * 0.42 * k * (i % 2 ? 0.8 : 1);
      var x0 = Math.cos(a) * r0, y0 = Math.sin(a) * r0, x1 = Math.cos(a) * r1, y1 = Math.sin(a) * r1;
      seg(c, x0, y0, x1, y1, 11 * k + 3, P.ink); seg(c, x0, y0, x1, y1, 6.4 * k + 0.6, P.yellow);
    }
    c.restore();
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
