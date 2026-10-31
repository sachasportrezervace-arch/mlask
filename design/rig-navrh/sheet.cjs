// model sheet: node sheet.cjs out.png
const fs = require("fs"), path = require("path");
const PW = path.join(process.env.APPDATA || "", "npm/node_modules/playwright");
const { chromium } = require(PW);
const rig = fs.readFileSync(path.join(__dirname, "rig.js"), "utf8");
const helpers = `
var PI = Math.PI, TAU = PI * 2;
var P = { ink: "#1D2145", white: "#FFFFFF", red: "#FF5A4D", yellow: "#FFD23F", pink: "#FF5C93", tongue: "#FF6F91", mouth: "#7B1E3F", cream: "#FFF5E6", sky2: "#4DB5FF" };
function circ(c, x, y, r) { c.beginPath(); c.arc(x, y, Math.abs(r), 0, TAU); }
function ell(c, x, y, rx, ry, rot) { c.beginPath(); c.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot || 0, 0, TAU); }
function rrect(c, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.arc(x + w - r, y + r, r, -PI / 2, 0); c.lineTo(x + w, y + h - r); c.arc(x + w - r, y + h - r, r, 0, PI / 2); c.lineTo(x + r, y + h); c.arc(x + r, y + h - r, r, PI / 2, PI); c.lineTo(x, y + r); c.arc(x + r, y + r, r, PI, PI * 1.5); c.closePath(); }
function fill(c, col) { c.fillStyle = col; c.fill(); }
function line(c, w, col) { c.strokeStyle = col || P.ink; c.lineWidth = w; c.lineCap = "round"; c.lineJoin = "round"; c.stroke(); }
function paint(c, col, w) { c.fillStyle = col; c.fill(); if (w) line(c, w); }
function seg(c, x1, y1, x2, y2, w, col) { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); line(c, w, col); }
`;
const poses = `
var POSES = [
 ["klid", { ex: "idle", lx: 0.7, ly: -0.1, sec: { h1: 0, h2: 0 } }],
 ["míření", { ex: "aim", lx: 0.95, ly: -0.2, lean: -0.14, a1: [-2.25, -3.0], a2: [1.45, 1.6], h2: "point", sec: { h1: -0.2, h2: 0.15 } }],
 ["napětí", { ex: "tense", lx: 0.95, ly: -0.2, lean: -0.24, sx: 1.05, sy: 0.93, a1: [-2.05, -2.7], a2: [1.35, 1.5], h2: "open", sweat: 0.5, sec: { h1: -0.35, h2: 0.25 } }],
 ["hod", { ex: "throw", lx: 1, ly: 0.1, lean: 0.3, sy: 1.06, sx: 0.96, a2: [1.55, 1.5], h2: "open", a1: [-0.9, -0.4], h1: "fist", sec: { h1: 0.4, h2: -0.3, hem: -0.8 } }],
 ["zásah", { ex: "hit", lean: -0.36, hr: -0.3, sx: 1.1, sy: 0.9, bx: -8, a1: [2.55, 2.2], a2: [-2.5, -2.95], h1: "open", h2: "open", sec: { h1: 0.6, h2: -0.6, hem: 1 } }],
 ["málem K.O.", { ex: "weak", lx: 0.5, ly: 0.4, lean: 0.2, hr: 0.28, sy: 0.97, a1: [0.06, 0.0], a2: [-0.05, 0.02], h1: "open", h2: "open", sweat: 1, sec: { h1: 0.5, h2: 0.4 } }],
 ["K.O.", { ex: "ko", lean: -0.16, hr: -0.5, a1: [0.5, 0.15], a2: [-0.7, -0.35], h1: "open", h2: "open", sec: { h1: 0.9, h2: -0.4 } }],
 ["radost", { ex: "joy", by: -12, legs: 1, l1: [0.7, -0.4], l2: [-0.3, -0.9], a1: [2.75, 2.95], a2: [-2.7, -2.95], h1: "fist", h2: "fist", sec: { h1: -0.4, h2: 0.3 } }],
 ["posměšek", { ex: "taunt", lx: 0.9, ly: 0, lean: -0.06, nose: 1, h1: "mitt", h1a: 2.2, a2: [-2.6, -3.0], h2: "mitt", h2a: 3.1, sec: { h1: 0.1, h2: -0.1 } }]
];`;
const html = `<body style="margin:0;background:#F4EFE4"><canvas id="c"></canvas><script>${helpers}(function(){${rig}
${poses}
var cols = POSES.length, cw = 205, ch = 300, S = 1.05;
var cv = document.getElementById("c"); cv.width = cols * cw * 2; cv.height = (ch * 2 + 450) * 2; cv.style.width = cols * cw + "px";
var c = cv.getContext("2d"); c.scale(2, 2);
c.fillStyle = "#F4EFE4"; c.fillRect(0, 0, cols * cw, ch * 2 + 450);
c.font = "600 16px system-ui"; c.textAlign = "center"; c.fillStyle = "#1D2145";
["k", "h"].forEach(function (sex, row) {
  POSES.forEach(function (p, i) {
    var x = i * cw + cw / 2, y = row * ch + ch - 50;
    c.fillStyle = "#E6DECB"; c.fillRect(i * cw + 10, y, cw - 20, 3);
    var o = Object.assign({ x: x, y: y, dir: 1, k: S, legs: 1, t: 0.3 }, p[1]); if (o.nose) { var n = noseAt(sex); o.t1 = [n[0] - 4, n[1] + 4, -1]; }
    char(c, sex, o);
    c.fillStyle = "#1D2145"; c.fillText(p[0], x, row * ch + ch - 18);
  });
});
// hlavy zblízka: výrazy, 2 řady po 9
var ex = ["idle","aim","tense","scared","hit","weak","ko","joy","taunt"], hw = cols * cw / ex.length;
ex.forEach(function (e, i) { ["k","h"].forEach(function (sex, r) {
  var x = i * hw + hw / 2, y = ch * 2 + 120 + r * 210;
  c.save(); c.translate(x, y); c.scale(1.45, 1.45); head2(c, sex, { ex: e, lx: 0.8, ly: -0.1, t: 0.4 }, { h1: 0, h2: 0 }); c.restore();
  if (r) { c.fillStyle = "#1D2145"; c.font = "500 13px system-ui"; c.fillText(e, x, y + 105); }
}); });
})();</script></body>`;
(async () => {
  const out = process.argv[2] || path.join(__dirname, "sheet.png"); const zoom = process.argv[3];
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1850, height: 1100 } });
  const errs = []; p.on("pageerror", e => errs.push(String(e))); p.on("console", m => m.type() === "error" && errs.push(m.text()));
  await p.setContent(html); await p.waitForTimeout(300);
  if (zoom) await p.screenshot({ path: out, clip: { x: 0, y: 600, width: 1845, height: 450 } }); else await p.locator("canvas").screenshot({ path: out });
  if (errs.length) console.log("ERR", errs.join("\n"));
  await b.close(); console.log("ok", out);
})();
