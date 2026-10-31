const fs = require("fs"); const f = process.argv[2]; let t = fs.readFileSync(f, "utf8"); let n = 0;
const rep = (a, b) => { if (!t.includes(a)) { console.log("MISSING:", a.slice(0, 80)); process.exit(1); } t = t.replace(a, () => b); n++; };
rep(`  function pickMod(seed, prev) {
    var m = 1 + h32(seed, 41) % (MODS.length - 1);
    if (m === prev) m = 1 + (m % (MODS.length - 1));
    return m;
  }`, `  // pickMod(seed, a, b): z pěti prostředí vybere jedno ze seedu, ale ne to z minulé bitvy (a) ani předminulé (b), takže tři bitvy za sebou jsou vždy různé
  function pickMod(seed, a, b) {
    var c = [];
    for (var i = 1; i < MODS.length; i++) if (i !== a && i !== b) c.push(i);
    return c[h32(seed, 41) % c.length];
  }`);
rep(`    var e = h32(seed, 300 + k) % 100, r = h32(seed, 500 + k), A = m === 1 ? 30 : 16, B = m === 1 ? 42 : 28, C = m === 1 ? 54 : 40;`, `    var e = h32(seed, 300 + k) % 100, r = h32(seed, 500 + k), A = m === 1 ? 30 : 16, B = m === 1 ? 46 : 28, C = m === 1 ? 60 : 40;`);
rep(`w = clampI(w + (h32(g.seed, 42) & 1 ? 7 : -7), -20, 20);`, `w = clampI(w + (h32(g.seed, 42) & 1 ? 9 : -9), -20, 20);`);
rep(`m = int(x.m) && x.m >= 0 && x.m < Pol.MODS.length ? x.m : 0;`, `m = int(x.m) && x.m >= 0 && x.m < Pol.MODS.length ? x.m : 0, pm = int(x.p) && x.p >= 0 && x.p < Pol.MODS.length ? x.p : 0;`);
rep(`gn: x.gn, rx, m, k,`, `gn: x.gn, rx, m, p: pm, k,`);
rep(`m: Pol.pickMod(sd0, 0), gn: 0,`, `m: Pol.pickMod(sd0, 0, 0), p: 0, gn: 0,`);
rep(`m: Pol.pickMod(sd1, g.m | 0), s:`, `m: Pol.pickMod(sd1, g.m | 0, g.p | 0), p: g.m | 0, s:`);
fs.writeFileSync(f, t); console.log("ok", n);
