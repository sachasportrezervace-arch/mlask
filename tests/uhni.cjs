// Engine Uhni! bez prohlížeče: node tests/uhni.cjs
// Pro stovky náhodných hodů ověří: (1) bez obrany je výsledek stejný jako dřív, (2) obrana, která odpovídá třídě hodu při dotyku, zásah zruší
// (Přikrčit se a Uskočit nechají věc proletět, Chytit ji zastaví), (3) jiná obrana na výsledku nic nezmění, (4) stejný vstup dá vždy stejný výsledek.
const path = require("path"), fs = require("fs"), vm = require("vm");
const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const src = /<script id="engine">([\s\S]*?)<\/script>/.exec(html)[1];
const ctx = { Math }; vm.createContext(ctx); vm.runInContext(src + "\nthis.Pol = Pol;", ctx);
const Pol = ctx.Pol;
let pass = 0, fail = 0;
const check = (n, ok, x = "") => { ok ? pass++ : fail++; console.log(`${ok ? "PASS" : "FAIL"}  ${n}${x ? "  (" + x + ")" : ""}`); };

let rnd = 12345; const R = () => (rnd = (rnd * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
const stats = { hits: 0, negated: [0, 0, 0, 0], wrongKept: 0, differs: 0, nondet: 0, classes: [0, 0, 0, 0], total: 0 };
for (let n = 0; n < 4000; n++) {
  const g = { seed: (R() * 1e9) | 0, s: n % 2, px: [1, 2, 4], po: [1, 3, 6], T: [], rx: 0, xs: "k", w: [0, 0], gn: 0 };
  const st = Pol.initState(g), t = Pol.throwerOf(g, 0), o = 1 - t;
  const dir = t === 0 ? 1 : -1;
  const a = 12 + R() * 70, p = 0.45 + R() * 0.55;
  const vx = Math.round(dir * Math.cos(a * Math.PI / 180) * p * Pol.VMAX / 250) * 250, vy = Math.round(-Math.sin(a * Math.PI / 180) * p * Pol.VMAX / 250) * 250;
  const item = R() < 0.5 ? 0 : 1 + ((R() * 4) | 0);
  const run = def => { const s = { ...st, def: [0, 0] }; s.def[o] = def; return Pol.simulate(g, s, [item, 0, vx, vy, 0, "", 0, 0]); };
  const base = run(0), again = run(0);
  stats.total++;
  if (JSON.stringify(base.st.hp) !== JSON.stringify(again.st.hp) || JSON.stringify(base.events) !== JSON.stringify(again.events)) stats.nondet++;
  const dmg = st.hp[o] - base.st.hp[o];
  if (!base.cls || dmg <= 0) continue; // nic netrefil, nemá co zneškodnit
  stats.hits++; stats.classes[base.cls]++;
  for (const d of [1, 2, 3]) {
    const r = run(d), got = st.hp[o] - r.st.hp[o];
    if (d === base.cls) { if (got < dmg) stats.negated[d]++; if (!r.events.some(e => e.type === (d === 2 ? "catch" : "dodge"))) stats.wrongKept++; }
    else if (got === dmg && !r.events.some(e => e.type === "catch" || e.type === "dodge")) { /* stejné jako bez obrany */ } else stats.differs++;
  }
}
console.log(JSON.stringify(stats));
check("determinismus: stejný vstup dá stejný výsledek", stats.nondet === 0, `${stats.total} hodů`);
check("dost zásahů všech tří tříd na smysluplný test", stats.hits >= 100 && stats.classes[1] > 5 && stats.classes[2] > 5 && stats.classes[3] > 5, `zásahů ${stats.hits}, třídy ${stats.classes.slice(1)}`);
check("správná obrana zruší zásah (a hlásí catch/dodge)", stats.negated.reduce((a, b) => a + b, 0) === stats.hits && stats.wrongKept === 0, `${stats.negated.slice(1)} z ${stats.classes.slice(1)}`);
check("špatná obrana na zásahu nic nemění", stats.differs === 0, `${stats.differs} odchylek`);
console.log(`\n${pass}/${pass + fail} PASS`);
process.exit(fail ? 1 : 0);
