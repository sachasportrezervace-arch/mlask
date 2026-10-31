// statický snímek scény se zásahem: node scene.cjs
const fs = require("fs"), path = require("path");
const { chromium } = require(path.join(process.env.APPDATA || "", "npm/node_modules/playwright"));
const D = __dirname, base = require("child_process").execSync("git cat-file -p HEAD:index.html", { cwd: path.join(D, "../.."), maxBuffer: 1e8 }).toString();
const grab = id => base.match(new RegExp(`<script id="${id}">([\\s\\S]*?)</script>`))[1];
const rig = fs.readFileSync(path.join(D, "rig.js"), "utf8"), fx = fs.readFileSync(path.join(D, "fx.js"), "utf8");
const scene = `
var P = Art.P, PI = Math.PI, TAU = PI * 2, circ = Art.circ, ell = Art.ell, rrect = Art.rrect, fill = Art.fill, line = Art.line, paint = Art.paint, hash = Art.hash;
function seg(c, x1, y1, x2, y2, w, col) { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); line(c, w, col); }
${rig}
${fx}
window.render = function (cw, ch, camx, camy, s, th, seed) {
  var cv = document.getElementById("c"); cv.width = cw * 2; cv.height = ch * 2; cv.style.width = cw + "px";
  var c = cv.getContext("2d"); c.setTransform(2 * s, 0, 0, 2 * s, 2 * (cw / 2 - camx * s), 2 * (ch / 2 - camy * s));
  var L = Pol.layout(seed), v = { x0: camx - cw / 2 / s, x1: camx + cw / 2 / s, y0: camy - ch / 2 / s, y1: camy + ch / 2 / s };
  Art.world(c, L, v, 3, th);
  var A = L.players[0], B = L.players[1];
  var oa = { x: A.x, y: A.y, dir: 1, k: 1.08, ex: "throw", lx: 1, ly: 0.1, lean: 0.26, sy: 1.04, sx: 0.97, a1: [1.3, 1.6], a2: [-0.9, -0.5], h1: "open", t: 0.3, sec: { h1: 0.35, h2: -0.2, hem: -0.6 } };
  var ob = { x: B.x, y: B.y, dir: -1, k: 1.08, ex: "hit", lean: -0.26, hr: -0.34, sx: 1.06, sy: 0.95, bx: -10, a1: [2.5, 2.15], a2: [-2.5, -2.95], h1: "open", h2: "open", t: 0.3, sec: { h1: 0.55, h2: -0.55, hem: 1 } };
  var K = 1.2, DY = 22; oa.k = ob.k = K; oa.y += DY; ob.y += DY;
  var hp = headPos("h", ob), hx = hp[0] - 50, hy = hp[1] + 4;
  // stopa letu: oblouk od Marka k Radce
  var pts = []; for (var i = 0; i <= 22; i++) { var u = 0.55 + i / 22 * 0.45, x = A.x + 60 + (hx - A.x - 60) * u, y = A.y - 200 - Math.sin(u * PI) * 260 + (hy - A.y + 200) * u; pts.push([x, y]); }
  trail(c, pts, 15, P.white, 0.6);
  impact(c, hx - 10, hy, 92, 0.1, 0.2);
  poof(c, hx - 26, hy - 8, 40, 0.3, P.white, 4);
  [[0, oa], [1, ob]].forEach(function (q) { var Pl = L.players[q[0]]; c.save(); c.beginPath(); c.rect(Pl.x - 700, Pl.y - 1200, 1400, 1204); c.clip(); char(c, q[0] ? "h" : "k", q[1]); c.restore(); });
  Art.balconyFront(c, L, 0, th); Art.balconyFront(c, L, 1, th);
  // polštář přimáčknutý z boku na tváři
  c.save(); c.translate(hx + 4, hy); c.rotate(0.2); c.scale(0.55, 1.2); Art.item(c, 0, 0, 0, 27, 0, 0, false); c.restore();
  var fs = [[-70, -76, 36, 0.4], [-10, -104, 30, -0.8], [-118, -16, 30, 1.6], [-96, 52, 32, 2.6], [36, -120, 26, -0.3], [-40, 84, 28, 0.9], [-150, -64, 24, 2.1]];
  fs.forEach(function (f) { feather(c, hx + f[0], hy + f[1], f[2], f[3]); });
};`;
const html = `<body style="margin:0;background:#fff"><canvas id="c"></canvas><script>${grab("engine")}</script><script>${grab("art")}</script><script>${scene}</script></body>`;
(async () => {
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; p.on("pageerror", e => errs.push(String(e)));
  await p.setContent(html);
  const shots = [["scene-desktop.png", 1440, 760, 800, 965 - 760 / 2 / 0.86, 0.86, 1, 7], ["scene-mobil.png", 390, 640, 1250, 965 - 640 / 2 / 0.78, 0.78, 1, 7]];
  for (const [f, w, h, cx, cy, s, th, seed] of shots) {
    await p.evaluate(a => window.render(...a), [w, h, cx, cy, s, th, seed]);
    await p.locator("canvas").screenshot({ path: path.join(D, f) });
  }
  if (errs.length) console.log("ERR", errs.join("\n"));
  await b.close(); console.log("ok");
})();
