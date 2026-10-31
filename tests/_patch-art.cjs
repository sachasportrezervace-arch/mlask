const fs = require("fs"); const f = process.argv[2]; let t = fs.readFileSync(f, "utf8"); let n = 0;
const rep = (a, b) => { if (!t.includes(a)) { console.log("MISSING:", a.slice(0, 70)); process.exit(1); } t = t.replace(a, () => b); n++; };

rep(`  function houseSide(c, L, j, v) {
    var p = L.players[j], d = p.dir, top = p.y - 330, x = function (a) { return d > 0 ? a : 1600 - a; };
    var col = j ? P.houseR : P.houseL, dk = j ? P.houseRd : P.houseLd, pn = j ? P.panelR : P.panelL;`,
`  // Motivy partie (g.m): 0 klasika, 1 ulice, 2 pláž, 3 déšť, 4 noc, 5 podzimní park. Jen barvy a pár plochých tvarů, žádné přechody.
  var THEMES = [
    { sky: P.sky, cloud: P.cloud, hill1: P.hill1, hill2: P.hill2, ground: P.ground, ground2: P.ground2, leaf: P.leaf, glass: P.glass,
      hl: P.houseL, hld: P.houseLd, hpl: P.panelL, hr: P.houseR, hrd: P.houseRd, hpr: P.panelR },
    { sky: "#C6E8F6", cloud: "#FFFFFF", hill1: "#BCC9DD", hill2: "#97A9C6", ground: "#C3C8DA", ground2: "#A3A9C2", leaf: P.leaf, kind: "street" },
    { sky: "#BFEBF7", cloud: "#FFFFFF", hill1: "#A9DDB6", hill2: "#59C3E4", ground: "#F7D78F", ground2: "#EABF6D", leaf: "#7BCB6E", kind: "beach" },
    { sky: "#A4B8CC", cloud: "#7D91A8", hill1: "#8DB3A0", hill2: "#69998A", ground: "#D2C4A2", ground2: "#B9A982", leaf: "#3F9E6B", glass: "#8FB5CC", kind: "rain" },
    { sky: "#2A2F66", cloud: "#444A8A", hill1: "#35507A", hill2: "#2B4468", ground: "#3E4C73", ground2: "#2F3B5E", leaf: "#2E7F5C", glass: "#FFE28A", kind: "night",
      hl: "#C79A2E", hld: "#9A7418", hpl: "#E0BE63", hr: "#23917F", hrd: "#186B5D", hpr: "#79BFB1" },
    { sky: "#FFE8BF", cloud: "#FFFFFF", hill1: "#F3CB7E", hill2: "#E69B4F", ground: "#C3DA8E", ground2: "#A2C26D", leaf: "#F0883A", kind: "park" }
  ];
  (function () { for (var i = 1; i < THEMES.length; i++) for (var key in THEMES[0]) if (THEMES[i][key] === undefined) THEMES[i][key] = THEMES[0][key]; })();
  function theme(th) { return THEMES[th | 0] || THEMES[0]; }
  function houseSide(c, L, j, v, T) {
    var p = L.players[j], d = p.dir, top = p.y - 330, x = function (a) { return d > 0 ? a : 1600 - a; };
    var col = j ? T.hr : T.hl, dk = j ? T.hrd : T.hld, pn = j ? T.hpr : T.hpl;`);
rep(`    c.fillStyle = P.glass; var wx = x(46);`, `    c.fillStyle = T.glass; var wx = x(46);`);

rep(`  function world(c, L, v, t) {
    c.fillStyle = P.sky; c.fillRect(v.x0 - 20, v.y0 - 20, v.x1 - v.x0 + 40, 900 - v.y0 + 20);
    var dr = (t || 0) * 5;
    cloud(c, 560 + dr % 2400 - 400, Math.max(150, v.y0 + 100), 1.1); cloud(c, 1180 + dr * 0.6, Math.max(270, v.y0 + 230), 0.8); cloud(c, 240 + dr * 0.8, Math.max(340, v.y0 + 170), 0.7);
    // kopce: půlkruhy v jedné ploše, dvě vrstvy
    c.fillStyle = P.hill1; ell(c, 560, 884, 560, 330); c.fill(); ell(c, 1250, 884, 640, 270); c.fill();
    c.fillStyle = P.hill2; ell(c, 380, 884, 480, 170); c.fill(); ell(c, 960, 884, 560, 130); c.fill(); ell(c, 1500, 884, 420, 190); c.fill();
    c.fillStyle = P.ground; c.fillRect(v.x0 - 20, 880, v.x1 - v.x0 + 40, v.y1 - 880 + 20);
    c.fillStyle = P.ground2; c.fillRect(v.x0 - 20, 880, v.x1 - v.x0 + 40, 14);
    if (L.players && L.players.length) { houseSide(c, L, 0, v); houseSide(c, L, 1, v); }
    for (var i = 0; i < L.deco.length; i++) deco(c, L.deco[i]);
  }
  function deco(c, d) {`, `  function world(c, L, v, t, th) {
    var T = theme(th), kind = T.kind || "", wd = v.x1 - v.x0 + 40;
    c.fillStyle = T.sky; c.fillRect(v.x0 - 20, v.y0 - 20, wd, 900 - v.y0 + 20);
    if (kind === "night") {
      for (var si = 0; si < 46; si++) { circ(c, 60 + hash(si, 1) * 1500, 30 + hash(si, 2) * 520, 2 + hash(si, 3) * 3.5); c.fillStyle = "#FFFFFF"; c.globalAlpha = 0.5 + 0.5 * hash(si, 4); c.fill(); }
      c.globalAlpha = 1; circ(c, 1180, 190, 62); fill(c, "#FFF1BF"); circ(c, 1210, 172, 54); fill(c, T.sky);
    } else if (kind === "beach") { circ(c, 1230, 200, 72); fill(c, "#FFE27A"); }
    var dr = (t || 0) * 5;
    cloud2(c, T, 560 + dr % 2400 - 400, Math.max(150, v.y0 + 100), 1.1); cloud2(c, T, 1180 + dr * 0.6, Math.max(270, v.y0 + 230), 0.8); cloud2(c, T, 240 + dr * 0.8, Math.max(340, v.y0 + 170), 0.7);
    if (kind === "street") {
      // městská silueta místo kopců: dvě vrstvy plochých domů
      c.fillStyle = T.hill1; for (var b1 = 0; b1 < 9; b1++) c.fillRect(-40 + b1 * 190, 880 - (190 + hash(b1, 7) * 230), 150 + hash(b1, 8) * 40, 400);
      c.fillStyle = T.hill2; for (var b2 = 0; b2 < 8; b2++) c.fillRect(30 + b2 * 210, 880 - (110 + hash(b2, 9) * 150), 170 + hash(b2, 10) * 30, 300);
    } else if (kind === "beach") {
      c.fillStyle = T.hill1; ell(c, 1000, 884, 300, 120); c.fill();
      c.fillStyle = T.hill2; c.fillRect(v.x0 - 20, 770, wd, 120);
      c.fillStyle = "#FFFFFF"; c.fillRect(v.x0 - 20, 770, wd, 8);
    } else {
      // kopce: půlkruhy v jedné ploše, dvě vrstvy
      c.fillStyle = T.hill1; ell(c, 560, 884, 560, 330); c.fill(); ell(c, 1250, 884, 640, 270); c.fill();
      c.fillStyle = T.hill2; ell(c, 380, 884, 480, 170); c.fill(); ell(c, 960, 884, 560, 130); c.fill(); ell(c, 1500, 884, 420, 190); c.fill();
    }
    c.fillStyle = T.ground; c.fillRect(v.x0 - 20, 880, wd, v.y1 - 880 + 20);
    c.fillStyle = T.ground2; c.fillRect(v.x0 - 20, 880, wd, 14);
    if (kind === "street") { c.fillStyle = "#FFFFFF"; for (var dx = -40; dx < 1700; dx += 150) c.fillRect(dx, 930, 80, 9); }
    if (kind === "rain") { c.fillStyle = "#8FB6D9"; ell(c, 700, 910, 120, 14); c.fill(); ell(c, 1180, 936, 150, 16); c.fill(); ell(c, 260, 950, 90, 11); c.fill(); }
    if (L.players && L.players.length) { houseSide(c, L, 0, v, T); houseSide(c, L, 1, v, T); }
    for (var i = 0; i < L.deco.length; i++) deco(c, L.deco[i], T);
  }
  function cloud2(c, T, x, y, s) { var old = P.cloud; P.cloud = T.cloud; cloud(c, x, y, s); P.cloud = old; }
  // počasí před scénou: déšť a padající listí (v klidovém režimu t = 0, tedy stojí)
  function weather(c, v, t, th) {
    var kind = theme(th).kind;
    if (kind !== "rain" && kind !== "park") return;
    var w = v.x1 - v.x0, h = v.y1 - v.y0;
    c.save();
    if (kind === "rain") {
      c.strokeStyle = "rgba(255,255,255,.62)"; c.lineWidth = 3.4; c.lineCap = "round"; c.beginPath();
      for (var i = 0; i < 90; i++) {
        var x = v.x0 + hash(i, 21) * (w + 200) - 60, y = v.y0 + (hash(i, 22) * h + t * 900 * (0.8 + hash(i, 23) * 0.4)) % h;
        c.moveTo(x, y); c.lineTo(x - 14, y + 42);
      }
      c.stroke();
    } else {
      for (var k = 0; k < 16; k++) {
        var lx = v.x0 + ((hash(k, 31) * (w + 200) + t * (36 + hash(k, 32) * 40)) % (w + 200)) - 60, ly = v.y0 + (hash(k, 33) * h + t * (50 + hash(k, 34) * 50)) % h;
        c.save(); c.translate(lx, ly); c.rotate(t * (1 + hash(k, 35)) + k); ell(c, 0, 0, 13, 7); fill(c, k % 3 === 0 ? "#E4572E" : k % 3 === 1 ? "#F0883A" : "#F2B84B"); c.restore();
      }
    }
    c.restore();
  }
  function deco(c, d, T) {
    T = T || THEMES[0];`);
rep(`      c.fillStyle = P.slate; c.fillRect(d.x - 7, 450, 14, 430); rrect(c, d.x - 30, 424, 60, 28, 10); c.fill();
      c.fillStyle = P.yellow; rrect(c, d.x - 22, 432, 44, 12, 6); c.fill();`, `      if (T.kind === "night") { circ(c, d.x, 438, 96); c.fillStyle = "rgba(255,226,138,.22)"; c.fill(); }
      c.fillStyle = P.slate; c.fillRect(d.x - 7, 450, 14, 430); rrect(c, d.x - 30, 424, 60, 28, 10); c.fill();
      c.fillStyle = P.yellow; rrect(c, d.x - 22, 432, 44, 12, 6); c.fill();`);
rep(`      c.fillStyle = P.leaf; circ(c, d.x, d.cy, 96 * s)`, `      c.fillStyle = T.leaf; circ(c, d.x, d.cy, 96 * s)`);
rep(`  function balconyFront(c, L, j) {
    var p = L.players[j], d = p.dir, x = function (a) { return d > 0 ? a : 1600 - a; };
    var dk = j ? P.houseRd : P.houseLd, pn = j ? P.panelR : P.panelL, a`, `  function balconyFront(c, L, j, th) {
    var T = theme(th), p = L.players[j], d = p.dir, x = function (a) { return d > 0 ? a : 1600 - a; };
    var dk = j ? T.hrd : T.hld, pn = j ? T.hpr : T.hpl, a`);
rep(`    c.save(); if (!K) c.translate(0, 6); face(c, sex, f); if (f.cream) cream(c); c.restore();
  }`, `    c.save(); if (!K) c.translate(0, 6); face(c, sex, f); if (f.cream) cream(c); c.restore();
    if (f.hat) hat(c, K, f.hat);
  }
  // postup v sérii: 1 čelenka, 2 párty čepice, 3 koruna
  function hat(c, K, h) {
    var y = K ? -56 : -88, a = K ? -26 : -34, b = K ? -12 : -20, m = K ? -48 : -56, m2 = K ? -34 : -42;
    if (h === 1) {
      c.beginPath(); c.moveTo(-50, a); c.quadraticCurveTo(0, m, 50, a); c.lineTo(50, b); c.quadraticCurveTo(0, m2, -50, b); c.closePath(); paint(c, P.red, 4);
      circ(c, 50, (a + b) / 2, 9); paint(c, P.red, 4);
    } else if (h === 2) {
      c.beginPath(); c.moveTo(-26, y + 4); c.lineTo(2, y - 74); c.lineTo(30, y + 4); c.closePath(); paint(c, P.sky2, 4);
      c.beginPath(); c.moveTo(-15, y - 26); c.lineTo(17, y - 26); line(c, 7, P.yellow); circ(c, 2, y - 78, 10); paint(c, P.pink, 4);
    } else if (h >= 3) {
      c.beginPath(); c.moveTo(-34, y + 6); c.lineTo(-38, y - 44); c.lineTo(-18, y - 22); c.lineTo(0, y - 54); c.lineTo(18, y - 22); c.lineTo(38, y - 44); c.lineTo(34, y + 6); c.closePath(); paint(c, P.yellow, 4);
      circ(c, 0, y - 12, 6); paint(c, P.red, 3);
    }
  }`);
rep(`head(c, sex, { mood: o.mood, lx: o.lx, ly: o.ly, blink: o.blink, cream: o.cream });
    c.restore();
    arm(c, 30, -84`, `head(c, sex, { mood: o.mood, lx: o.lx, ly: o.ly, blink: o.blink, cream: o.cream, hat: o.hat });
    c.restore();
    arm(c, 30, -84`);
rep(`world: world, balconyFront: balconyFront,`, `world: world, weather: weather, balconyFront: balconyFront, THEMES: THEMES,`);
fs.writeFileSync(f, t); console.log("ok", n);
