  // ---------- postavy: rig z dílů s klouby ----------
  // Marek (k): vytáhlý a hranatý – úzká protáhlá hlava s bradou, vysoký účes s vláskem, velký nos, dlouhé ruce.
  // Radka (h): malá a kulatá – kulatá hlava, rovná ofina, dva culíky do stran, nosík, pihy, krátké ruce.
  // Lokální souřadnice: počátek mezi chodidly, postava kouká doprava (+x), y dolů. Úhly končetin jsou absolutní: 0 = dolů, PI/2 = dopředu, PI = nahoru.
  var RIG = {
    k: { hip: 50, torso: 54, neck: [3, -54], head: [5, -44], ua: 29, la: 28, hand: 8.5, leg: 25, sleeve: 14, fore: 10.5, shTop: 19, shBot: 22,
      skin: "#FFC9A6", skin2: "#F2A982", hair: "#2B2350", hair2: "#463B7A", top: "#4D6BFF", top2: "#3A52D6", trim: "#FFFFFF", pants: "#2B2350", shoe: "#FF5A4D" },
    h: { hip: 46, torso: 48, neck: [3, -48], head: [6, -40], ua: 23, la: 22, hand: 8.5, leg: 22, sleeve: 15, fore: 11, shTop: 21, shBot: 33,
      skin: "#FFC4A0", skin2: "#F0A580", hair: "#FF7A2E", hair2: "#E05A12", top: "#FF5C93", top2: "#E23C77", trim: "#FFD23F", pants: "#1D2145", shoe: "#FFD23F" }
  };
  var OL = 4.6, IL = 3.2;
  // špička nosu v souřadnicích trupu (pro „dlouhý nos“)
  function noseAt(sex) { var R = RIG[sex]; return sex === "k" ? [R.neck[0] + R.head[0] + 42, R.neck[1] + R.head[1] + 12] : [R.neck[0] + R.head[0] + 22, R.neck[1] + R.head[1] + 20]; } // obrysová a vnitřní linka
  function dirv(a, l) { return [Math.sin(a) * l, Math.cos(a) * l]; }
  function cap(c, x1, y1, x2, y2, w, col) { // končetina: tlustá úsečka s obrysem
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); line(c, w + OL * 2, P.ink); c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); line(c, w, col);
  }
  function hand(c, R, x, y, ang, kind) {
    c.save(); c.translate(x, y); c.rotate(-ang);
    if (kind === "mitt") { // roztažené prsty, chytá
      for (var i = -2; i <= 2; i++) { var a = i * 0.42; seg(c, 0, 0, Math.sin(a) * 15, Math.cos(a) * 15, 6.4 + OL * 2, P.ink); }
      for (i = -2; i <= 2; i++) { a = i * 0.42; seg(c, 0, 0, Math.sin(a) * 15, Math.cos(a) * 15, 6.4, R.skin); }
      circ(c, 0, 2, R.hand + 1.5); paint(c, R.skin, 0);
    } else if (kind === "open") {
      ell(c, 0, 4, R.hand, R.hand + 2.5); paint(c, R.skin, OL * 0.8);
      c.beginPath(); c.moveTo(R.hand * 0.6, 0); c.quadraticCurveTo(R.hand + 6, 2, R.hand + 4, 9); line(c, 5.4 + OL * 1.6); c.beginPath(); c.moveTo(R.hand * 0.6, 0); c.quadraticCurveTo(R.hand + 6, 2, R.hand + 4, 9); line(c, 5.4, R.skin);
    } else if (kind === "point") {
      circ(c, 0, 2, R.hand); paint(c, R.skin, OL * 0.8); seg(c, 0, 6, 0, 18, 5.2 + OL * 1.6); seg(c, 0, 6, 0, 18, 5.2, R.skin);
    } else { circ(c, 0, 2, R.hand); paint(c, R.skin, OL * 0.8); seg(c, -3, 4, 3, 5, 2.2); }
    c.restore();
  }
  // dvoukloubová IK: ruka míří na bod (tx, ty), loket ohnutý ke straně bend (+1 dolů/dozadu, -1 nahoru)
  function ik(sx, sy, tx, ty, l1, l2, bend) {
    var dx = tx - sx, dy = ty - sy, d = Math.max(1, Math.min(Math.hypot(dx, dy), l1 + l2 - 0.01)), base = Math.atan2(dx, dy);
    var A = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)))), up = base + bend * A;
    var ex = sx + Math.sin(up) * l1, ey = sy + Math.cos(up) * l1, X = sx + Math.sin(base) * d, Y = sy + Math.cos(base) * d;
    return [up, Math.atan2(X - ex, Y - ey)];
  }
  function armDraw(c, R, sx, sy, a, kind, ha) {
    var e = dirv(a[0], R.ua), ex = sx + e[0], ey = sy + e[1], w = dirv(a[1], R.la), wx = ex + w[0], wy = ey + w[1];
    cap(c, ex, ey, wx, wy, R.fore, R.skin);
    cap(c, sx, sy, ex + (wx - ex) * 0.12, ey + (wy - ey) * 0.12, R.sleeve, R.top);
    hand(c, R, wx, wy, ha == null ? a[1] : ha, kind);
    return [wx, wy, a[1]];
  }
  function legDraw(c, R, hx, hy, a, k) {
    var e = dirv(a[0], R.leg), ex = hx + e[0], ey = hy + e[1], f = dirv(a[1], R.leg), fx = ex + f[0], fy = ey + f[1];
    cap(c, hx, hy, ex, ey, 13, R.pants); cap(c, ex, ey, fx, fy, 11, R.pants);
    c.save(); c.translate(fx, fy); c.rotate(-a[1]);
    if (k) { c.beginPath(); c.moveTo(-8, -2); c.lineTo(-8, 6); c.quadraticCurveTo(-8, 10, -3, 10); c.lineTo(20, 10); c.quadraticCurveTo(24, 1, 13, -1); c.closePath(); }
    else { ell(c, 4, 4, 12, 8); }
    c.restore();
    paint(c, R.shoe, OL);
  }
  // trup: lichoběžník (Marek tričko s pruhem) / zvon (Radka šaty s límečkem); lem vlaje podle sec.hem
  function torsoDraw(c, R, K, hem) {
    var T = R.torso, a = R.shTop, b = R.shBot, hf = hem * 6;
    c.beginPath();
    if (K) { c.moveTo(-a, -T + 6); c.quadraticCurveTo(-a, -T, -a + 7, -T); c.lineTo(a - 7, -T); c.quadraticCurveTo(a + 1, -T, a + 2, -T + 8); c.lineTo(b + hf * 0.4, 4); c.lineTo(-b - hf, 4 + hf * 0.3); c.closePath(); }
    else { c.moveTo(-a + 2, -T + 4); c.quadraticCurveTo(0, -T - 5, a - 2, -T + 4); c.quadraticCurveTo(b - 6, -T * 0.4, b + hf * 0.5, 6); c.quadraticCurveTo(0, 12, -b - hf, 6 + hf * 0.3); c.quadraticCurveTo(-b + 6, -T * 0.4, -a + 2, -T + 4); c.closePath(); }
    paint(c, R.top, 0);
    c.save(); c.clip();
    if (K) { c.fillStyle = R.trim; c.fillRect(-40, -T * 0.52, 80, 8); c.fillStyle = R.top2; c.fillRect(-40, -T * 0.52 + 8, 80, 3); c.fillRect(-a - 4, -T, 9, T + 10); }
    else { c.fillStyle = R.top2; c.fillRect(-b - 10, -T, 12, T + 16); }
    c.restore();
    line(c, OL);
    if (K) { c.beginPath(); c.moveTo(-7, -T + 0.5); c.quadraticCurveTo(1, -T + 9, 9, -T + 0.5); line(c, IL); }
    else { c.beginPath(); c.moveTo(-12, -T + 1); c.quadraticCurveTo(-6, -T + 10, 2, -T + 3); c.quadraticCurveTo(8, -T + 10, 14, -T + 1); paint(c, R.trim, IL); }
  }

  // ---------- obličej: oči, víčka, obočí, ústa ----------
  // výrazy: idle, aim, tense, hit, weak, ko, joy, taunt, scared, smug, dizzy
  var EXPR = {
    idle:   { lid: 0.18, brow: 0, tilt: 0, mouth: "smile", eye: "o" },
    aim:    { lid: 0.42, lid2: 0.75, brow: 2, tilt: 5, mouth: "tongue", eye: "o" },
    tense:  { lid: 0.22, brow: 4, tilt: 9, mouth: "grit", eye: "o", pupil: 0.8 },
    scared: { lid: 0, brow: -8, tilt: -6, mouth: "o", eye: "wide" },
    hit:    { brow: 6, tilt: -9, mouth: "ouch", eye: "shut" },
    weak:   { lid: 0.48, brow: -2, tilt: -8, mouth: "wavy", eye: "o", pupil: 0.7, sweat: 1 },
    ko:     { brow: -4, tilt: -6, mouth: "ko", eye: "x" },
    dizzy:  { brow: -4, tilt: -4, mouth: "wavy", eye: "spin" },
    joy:    { brow: -6, tilt: -5, mouth: "grin", eye: "happy", blush: 1 },
    taunt:  { lid: 0.5, brow: -3, tilt: -2, browUp: 1, mouth: "raspberry", eye: "o", blush: 0.6 },
    smug:   { lid: 0.5, brow: -2, tilt: 2, browUp: 1, mouth: "smirk", eye: "o" },
    throw:  { lid: 0.25, brow: 5, tilt: 10, mouth: "ouch", eye: "o", pupil: 0.85 }
  };
  function eyeAt(c, R, K, x, y, rx, ry, E, f, side) {
    var kind = E.eye, lx = f.lx || 0, ly = f.ly || 0;
    if (kind === "shut") { var q = -side; c.beginPath(); c.moveTo(x - q * rx * 0.9, y - ry * 0.6); c.lineTo(x + q * rx * 0.6, y); c.lineTo(x - q * rx * 0.9, y + ry * 0.6); line(c, 4.4); return; }
    if (kind === "happy" || (f.blink > 0.55 && kind !== "x" && kind !== "spin")) { c.beginPath(); c.moveTo(x - rx, y + 2); c.quadraticCurveTo(x, y - ry * (kind === "happy" ? 1.3 : 0.1), x + rx, y + 2); line(c, 4.2); return; }
    if (kind === "x") { seg(c, x - rx * 0.8, y - rx * 0.8, x + rx * 0.8, y + rx * 0.8, 4.2); seg(c, x + rx * 0.8, y - rx * 0.8, x - rx * 0.8, y + rx * 0.8, 4.2); return; }
    var wide = kind === "wide", RX = wide ? rx * 1.18 : rx, RY = wide ? ry * 1.18 : ry;
    ell(c, x, y, RX, RY); paint(c, P.white, 0);
    if (kind === "spin") { c.save(); ell(c, x, y, RX, RY); c.clip(); c.beginPath(); for (var i = 0; i <= 24; i++) { var a = i / 24 * 2.2 * TAU * side + (f.t || 0) * 8, rr = RX * 0.85 * i / 24; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * RY / RX); } line(c, 2.6); c.restore(); ell(c, x, y, RX, RY); line(c, IL); return; }
    var pr = (K ? 4.2 : 4.8) * (wide ? 0.62 : E.pupil || 1), mx = RX - pr - 1.6, my = RY - pr - 1.6;
    var px = x + lx * mx, py = y + ly * my;
    c.save(); ell(c, x, y, RX, RY); c.clip();
    circ(c, px, py, pr); fill(c, P.ink); circ(c, px + pr * 0.35, py - pr * 0.4, pr * 0.32); fill(c, P.white);
    // horní víčko: kůže nad šikmou čarou, mrknutí ho stáhne dolů
    var lid = Math.max(E.lid || 0, f.blink || 0); if (side > 0 && E.lid2) lid = Math.max(lid, E.lid2 * (f.blink > 0.55 ? 1 : 1));
    if (lid > 0.02) {
      var ly0 = y - RY + lid * RY * 2, tl = (E.tilt || 0) * 0.5 * (E.mouth === "raspberry" || E.browUp ? -0.6 : 1);
      c.beginPath(); c.moveTo(x - RX - 2, ly0 - tl * side * -1 - tl); c.lineTo(x + RX + 2, ly0 + tl * side * -1 - tl); c.lineTo(x + RX + 2, y - RY - 4); c.lineTo(x - RX - 2, y - RY - 4); c.closePath(); fill(c, R.skin);
      c.beginPath(); c.moveTo(x - RX - 2, ly0 - tl * side * -1 - tl); c.lineTo(x + RX + 2, ly0 + tl * side * -1 - tl); line(c, IL);
    }
    c.restore();
    ell(c, x, y, RX, RY); line(c, IL);
  }
  function brow(c, K, x, y, w, E, side) {
    var up = (E.brow || 0) * -1, tilt = (E.tilt || 0) * side, extra = E.browUp && side > 0 ? -7 : 0;
    // tilt > 0: vnitřní konec dolů (zamračení); side -1 = zadní oko (vlevo), vnitřní konec je vpravo
    var xi = x + w * (side < 0 ? 1 : -1) * 0.5, xo = x - w * (side < 0 ? 1 : -1) * 0.5;
    c.beginPath(); c.moveTo(xo, y + up + extra - tilt * 0.5 * side * side); c.quadraticCurveTo(x, y + up + extra - (K ? 4 : 5), xi, y + up + extra + tilt * 0.6 * side * side);
    line(c, K ? 6.4 : 4.4);
  }
  function mouth(c, R, K, x, y, E, f) {
    var m = E.mouth, w = K ? 15 : 12;
    if (m === "smile") { c.beginPath(); c.moveTo(x - w, y - 3); c.quadraticCurveTo(x + 1, y + 9, x + w + 2, y - 5); line(c, IL + 0.6); seg(c, x + w + 2, y - 5, x + w + 5, y - 8, IL); }
    else if (m === "smirk") { c.beginPath(); c.moveTo(x - w + 4, y + 1); c.quadraticCurveTo(x + 4, y + 5, x + w + 4, y - 7); line(c, IL + 0.6); }
    else if (m === "tongue") { c.beginPath(); c.moveTo(x - w + 2, y); c.lineTo(x + w, y - 2); line(c, IL + 0.6); c.beginPath(); c.moveTo(x + w - 9, y - 1); c.quadraticCurveTo(x + w - 7, y + 11, x + w - 1, y + 9); c.quadraticCurveTo(x + w + 4, y + 7, x + w, y - 2); c.closePath(); paint(c, P.tongue, IL); }
    else if (m === "grit") { rrect(c, x - w, y - 7, w * 2, 14, 5); paint(c, P.white, IL); seg(c, x - w, y, x + w, y, 2.4); for (var i = -1; i <= 1; i++) seg(c, x + i * w * 0.5, y - 7, x + i * w * 0.5, y + 7, 2.2); }
    else if (m === "o") { ell(c, x + 2, y + 2, 6.5, 9); paint(c, P.mouth, IL); }
    else if (m === "ouch") {
      c.beginPath(); c.moveTo(x - w - 2, y - 6); c.lineTo(x + w + 2, y - 8); c.quadraticCurveTo(x + w, y + 14, x, y + 13); c.quadraticCurveTo(x - w, y + 14, x - w - 2, y - 6); c.closePath(); paint(c, P.mouth, 0);
      c.save(); c.clip(); c.fillStyle = P.white; c.fillRect(x - w - 4, y - 10, w * 2 + 8, 7); ell(c, x + 2, y + 13, 8, 5); fill(c, P.tongue); c.restore();
      c.beginPath(); c.moveTo(x - w - 2, y - 6); c.lineTo(x + w + 2, y - 8); c.quadraticCurveTo(x + w, y + 14, x, y + 13); c.quadraticCurveTo(x - w, y + 14, x - w - 2, y - 6); c.closePath(); line(c, IL);
    }
    else if (m === "grin") {
      c.beginPath(); c.moveTo(x - w - 3, y - 6); c.quadraticCurveTo(x + 1, y - 1, x + w + 5, y - 9); c.quadraticCurveTo(x + w, y + 16, x + 1, y + 16); c.quadraticCurveTo(x - w - 2, y + 15, x - w - 3, y - 6); c.closePath(); paint(c, P.mouth, 0);
      c.save(); c.clip();
      if (K) { c.fillStyle = P.white; c.fillRect(x - 8, y - 12, 8, 13); c.fillRect(x + 3, y - 12, 8, 13); } else { c.fillStyle = P.white; c.fillRect(x - w - 4, y - 12, w * 2 + 10, 7); }
      ell(c, x + 2, y + 15, 9, 6); fill(c, P.tongue); c.restore();
      c.beginPath(); c.moveTo(x - w - 3, y - 6); c.quadraticCurveTo(x + 1, y - 1, x + w + 5, y - 9); c.quadraticCurveTo(x + w, y + 16, x + 1, y + 16); c.quadraticCurveTo(x - w - 2, y + 15, x - w - 3, y - 6); c.closePath(); line(c, IL);
    }
    else if (m === "wavy") { c.beginPath(); c.moveTo(x - w, y + 2); for (var q = 1; q <= 4; q++) c.quadraticCurveTo(x - w + (q - 0.5) * w / 2, y + (q % 2 ? -5 : 7), x - w + q * w / 2, y + 2); line(c, IL + 0.4); }
    else if (m === "ko") { ell(c, x + 1, y + 1, 9, 6); paint(c, P.mouth, IL); c.beginPath(); c.moveTo(x - 2, y + 3); c.lineTo(x - 2, y + 15); c.quadraticCurveTo(x + 4, y + 22, x + 9, y + 15); c.lineTo(x + 9, y + 3); c.closePath(); paint(c, P.tongue, IL); seg(c, x + 3.5, y + 6, x + 3.5, y + 13, 1.8); }
    else if (m === "raspberry") { c.beginPath(); c.moveTo(x - 6, y - 3); c.quadraticCurveTo(x + 4, y - 7, x + 12, y - 2); c.quadraticCurveTo(x + 4, y + 4, x - 6, y - 3); c.closePath(); paint(c, P.mouth, IL); c.beginPath(); c.moveTo(x + 2, y - 2); c.quadraticCurveTo(x + 6, y + 15, x + 13, y + 12); c.quadraticCurveTo(x + 17, y + 4, x + 12, y - 2); c.closePath(); paint(c, P.tongue, IL); }
  }
  function sweatDrop(c, x, y, s) { c.beginPath(); c.moveTo(x, y - 8 * s); c.quadraticCurveTo(x + 6 * s, y + 1 * s, x, y + 6 * s); c.quadraticCurveTo(x - 6 * s, y + 1 * s, x, y - 8 * s); c.closePath(); paint(c, "#7FD3FF", IL * 0.8); }
  // hlava: střed v 0,0; sec.h1 / sec.h2 = výchylky vlasů (pružiny), f = {ex, lx, ly, blink, t, sweat}
  function head2(c, sex, f, sec) {
    var K = sex === "k", R = RIG[sex], E = EXPR[f.ex] || EXPR.idle, h1 = (sec && sec.h1) || 0, h2 = (sec && sec.h2) || 0;
    if (K) {
      // vlásek na temeni (pružina)
      c.save(); c.translate(-14, -66); c.rotate(-0.5 + h1);
      c.beginPath(); c.moveTo(-3, 4); c.quadraticCurveTo(-6, -14, 6, -24); c.quadraticCurveTo(0, -12, 5, 4); c.closePath(); paint(c, R.hair, IL); c.restore();
      // ucho vzadu
      ell(c, -30, 2, 9, 13); paint(c, R.skin, OL); c.beginPath(); c.arc(-30, 2, 5, -1.2, 1.4); line(c, IL);
      // hlava: protáhlá, dole širší brada
      c.beginPath(); c.moveTo(-26, -40); c.quadraticCurveTo(-30, 0, -24, 30); c.quadraticCurveTo(-14, 52, 10, 50); c.quadraticCurveTo(34, 48, 34, 22); c.quadraticCurveTo(36, -10, 30, -40); c.quadraticCurveTo(2, -56, -26, -40); c.closePath();
      paint(c, R.skin, OL);
      c.save(); c.clip(); c.fillStyle = R.skin2; c.fillRect(-40, -46, 90, 18); c.restore();
      // účes: vysoký plochý kvádr nakloněný dopředu s vlnou vpředu
      c.beginPath(); c.moveTo(-30, -14); c.lineTo(-31, -46); c.quadraticCurveTo(-30, -70, -6, -72); c.lineTo(30, -74); c.quadraticCurveTo(46, -72, 42, -56); c.quadraticCurveTo(36, -44, 22, -46); c.quadraticCurveTo(14, -36, 2, -42); c.quadraticCurveTo(-10, -36, -18, -38); c.quadraticCurveTo(-24, -28, -22, -14); c.closePath();
      paint(c, R.hair, OL);
      c.beginPath(); c.moveTo(-14, -64); c.quadraticCurveTo(6, -66, 28, -64); line(c, IL, R.hair2);
    } else {
      // culíky nahoře do stran (pružiny), zadní se kreslí za hlavou
      for (var sdx = -1; sdx <= 1; sdx += 2) {
        c.save(); c.translate(sdx * 34 + 2, -34); c.rotate(sdx * 0.55 + (sdx < 0 ? h1 : h2));
        c.beginPath(); c.moveTo(-9, 2); c.quadraticCurveTo(sdx * 6, -34, sdx * 26, -26); c.quadraticCurveTo(sdx * 38, -4, sdx * 12, 8); c.closePath(); paint(c, R.hair, OL);
        c.beginPath(); c.moveTo(sdx * 8, -12); c.quadraticCurveTo(sdx * 20, -20, sdx * 26, -12); line(c, IL, R.hair2);
        rrect(c, -8, -7, 16, 12, 5); paint(c, R.trim, IL);
        c.restore();
      }
      // mikádo: vlasy vzadu sahají k bradě
      c.beginPath(); c.moveTo(-48, 22); c.quadraticCurveTo(-54, -50, 2, -52); c.quadraticCurveTo(56, -50, 50, 18); c.quadraticCurveTo(44, 30, 34, 26); c.lineTo(-38, 30); c.quadraticCurveTo(-48, 32, -48, 22); c.closePath(); paint(c, R.hair, OL);
      // obličej
      ell(c, 4, 10, 40, 36); paint(c, R.skin, OL);
      // stín pod ofinou
      c.save(); ell(c, 4, 10, 38, 34); c.clip(); c.fillStyle = R.skin2; c.fillRect(-40, -30, 90, 26); c.restore();
      // ofina: rovný střih se třemi zoubky
      c.beginPath(); c.moveTo(-42, 8); c.quadraticCurveTo(-48, -44, 2, -46); c.quadraticCurveTo(50, -44, 46, 4); c.quadraticCurveTo(44, -6, 38, -8); c.lineTo(-34, -6); c.quadraticCurveTo(-40, -4, -42, 8); c.closePath(); paint(c, R.hair, OL);
      c.beginPath(); c.moveTo(-26, -34); c.quadraticCurveTo(4, -42, 30, -32); line(c, IL, R.hair2);
    }
    // oči, obočí, nos, ústa
    var ex1 = K ? -4 : -11, ex2 = K ? 17 : 17, ey = K ? -10 : 8, rx = K ? 8 : 10.5, ry = K ? 12 : 11;
    if (f.cream) { creamFace(c, K); }
    else {
      eyeAt(c, R, K, ex1, ey, rx * 0.92, ry * 0.95, E, f, -1); eyeAt(c, R, K, ex2, ey, rx, ry, E, f, 1);
      var by = K ? ey - ry - 7 : -17; // Radka: obočí kreslené přes ofinu
      brow(c, K, ex1 - 1, by, K ? 17 : 15, E, -1); brow(c, K, ex2 + 1, by, K ? 18 : 16, E, 1);
    }
    if (K) { // velký nos, přesahuje obrys
      c.beginPath(); c.moveTo(18, 4); c.quadraticCurveTo(46, 0, 44, 16); c.quadraticCurveTo(40, 26, 22, 20); c.closePath(); paint(c, R.skin, OL); c.beginPath(); c.arc(36, 15, 4, 0.2, 2.4); line(c, IL);
    } else {
      ell(c, 21, 21, 6, 4.6); paint(c, R.skin2, IL);
      for (var fr = 0; fr < 3; fr++) { circ(c, -18 + fr * 5, 20 + (fr % 2) * 3, 1.6); fill(c, "#D9826A"); circ(c, 30 + fr * 4, 20 + (fr % 2) * 3, 1.6); fill(c, "#D9826A"); }
    }
    if (E.blush) { c.globalAlpha = 0.55 * E.blush; ell(c, K ? -12 : -20, K ? 16 : 26, 8, 5); fill(c, "#FF7C8A"); ell(c, K ? 26 : 34, K ? 26 : 26, 7, 4.5); fill(c, "#FF7C8A"); c.globalAlpha = 1; }
    mouth(c, R, K, K ? 12 : 9, K ? 32 : 34, E, f);
    var sw = Math.max(E.sweat || 0, f.sweat || 0);
    if (sw > 0) { var tt = ((f.t || 0) * 0.9) % 1; sweatDrop(c, K ? -24 : -38, (K ? -30 : -24) + tt * 22, 1.05); if (sw > 0.6) sweatDrop(c, K ? 30 : 42, (K ? -34 : -30) + ((tt + 0.5) % 1) * 18, 0.85); }
    if (f.hat) hat2(c, K, f.hat);
  }
  function creamFace(c, K) {
    var y0 = K ? -18 : -8;
    c.beginPath(); c.moveTo(-26, y0 - 12); c.quadraticCurveTo(-30, y0 + 6, -20, y0 + 10); c.quadraticCurveTo(-16, y0 + 26, -8, y0 + 12); c.quadraticCurveTo(0, y0 + 28, 8, y0 + 12);
    c.quadraticCurveTo(16, y0 + 24, 24, y0 + 10); c.quadraticCurveTo(38, y0 + 4, 34, y0 - 12); c.quadraticCurveTo(4, y0 - 24, -26, y0 - 12); c.closePath(); paint(c, P.cream, OL);
    circ(c, 6, y0 - 16, 6.5); paint(c, P.red, IL);
  }
  function hat2(c, K, h) {
    c.save(); c.translate(K ? 6 : 2, K ? -72 : -46);
    if (h === 1) { c.beginPath(); c.moveTo(-34, 6); c.quadraticCurveTo(4, -6, 40, 6); c.lineTo(40, 15); c.quadraticCurveTo(4, 3, -34, 15); c.closePath(); paint(c, P.red, OL); }
    else if (h === 2) { c.beginPath(); c.moveTo(-18, 4); c.lineTo(4, -50); c.lineTo(24, 4); c.closePath(); paint(c, "#4DB5FF", OL); seg(c, -8, -18, 15, -18, 6, P.yellow); circ(c, 4, -54, 8); paint(c, P.pink, IL); }
    else if (h >= 3) { c.beginPath(); c.moveTo(-24, 6); c.lineTo(-27, -28); c.lineTo(-12, -14); c.lineTo(2, -36); c.lineTo(16, -14); c.lineTo(31, -28); c.lineTo(28, 6); c.closePath(); paint(c, P.yellow, OL); circ(c, 2, -6, 4.5); paint(c, P.red, IL); }
    c.restore();
  }
  // celá postava. o: x, y, dir, k (měřítko), bx, by (posun těla), sx, sy (squash u nohou), lean (náklon trupu, + dopředu), hr (natočení hlavy),
  // a1, a2 ([rameno, předloktí] přední a zadní ruka), h1, h2 (tvar dlaně), l1, l2 (nohy), legs (kreslit nohy), ex (výraz), lx, ly, blink,
  // sec {h1, h2, hem}, hat, cream, hold(c, x, y, ang), t, sweat, shiver
  function char(c, sex, o) {
    var K = sex === "k", R = RIG[sex], sec = o.sec || {};
    var sx = o.sx || 1, sy = o.sy || 1, sh = o.shiver ? Math.sin((o.t || 0) * 70) * o.shiver : 0;
    c.save(); c.translate(o.x, o.y); c.scale(o.dir * (o.k || 1), o.k || 1);
    c.translate((o.bx || 0) + sh, o.by || 0); c.scale(sx, sy);
    var hipY = -R.hip;
    if (o.legs) { legDraw(c, R, -6, hipY + 4, o.l2 || [0.05, 0.05], K); }
    c.save(); c.translate(0, hipY); c.rotate(o.lean || 0);
    var s2 = [-5, -R.torso + 9], s1 = [6, -R.torso + 9];
    var a2 = o.t2 ? ik(s2[0], s2[1], o.t2[0], o.t2[1], R.ua, R.la, o.t2[2] || 1) : o.a2 || [-0.35, -0.1];
    var a1 = o.t1 ? ik(s1[0], s1[1], o.t1[0], o.t1[1], R.ua, R.la, o.t1[2] || 1) : o.a1 || [0.45, 1.2];
    armDraw(c, R, s2[0], s2[1], a2, o.h2 || "fist", o.h2a);
    if (o.legs) { c.restore(); legDraw(c, R, 6, hipY + 4, o.l1 || [-0.05, -0.05], K); c.save(); c.translate(0, hipY); c.rotate(o.lean || 0); }
    torsoDraw(c, R, K, sec.hem || 0);
    c.save(); c.translate(R.neck[0], R.neck[1]); c.rotate(o.hr || 0);
    cap(c, 0, 4, 2, -10, K ? 11 : 12, R.skin); // krk
    c.translate(R.head[0], R.head[1]);
    head2(c, sex, { ex: o.ex, lx: o.lx, ly: o.ly, blink: o.blink, t: o.t, sweat: o.sweat, cream: o.cream, hat: o.hat }, sec);
    c.restore();
    var hp = armDraw(c, R, s1[0], s1[1], a1, o.h1 || "fist", o.h1a);
    if (o.hold) o.hold(c, hp[0], hp[1], hp[2]);
    c.restore();
    c.restore();
  }
  // střed hlavy postavy ve světě (pro pružiny vlasů, efekty a kameru)
  function headPos(sex, o) {
    var R = RIG[sex], k = o.k || 1, sx = o.sx || 1, sy = o.sy || 1, la = o.lean || 0, hr = o.hr || 0;
    var rot = function (x, y, a) { return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)]; };
    var n = rot(R.neck[0], R.neck[1], la), h = rot(R.head[0], R.head[1], la + hr);
    var lx = (o.bx || 0) + (n[0] + h[0]) * sx, ly = (o.by || 0) + (-R.hip + n[1] + h[1]) * sy;
    return [o.x + o.dir * k * lx, o.y + k * ly];
  }
