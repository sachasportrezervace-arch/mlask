const fs = require("fs"); const f = process.argv[2]; let t = fs.readFileSync(f, "utf8"); let n = 0;
const rep = (a, b, all) => { if (!t.includes(a)) { console.log("MISSING:", a.slice(0, 80)); process.exit(1); } t = all ? t.split(a).join(b) : t.replace(a, () => b); n++; };

// MODS: krátké popisky do banneru
rep(`{ id: "street", name: "Ulice", text: "Špička: víc holubů, poryvů větru a balónků." }`, `{ id: "street", name: "Ulice", short: "víc holubů a poryvů", text: "Špička: víc holubů, poryvů větru a balónků." }`);
rep(`{ id: "beach", name: "Pláž", text: "Mořský vítr fouká celou bitvu z jedné strany." }`, `{ id: "beach", name: "Pláž", short: "vítr stále z jedné strany", text: "Mořský vítr fouká celou bitvu z jedné strany." }`);
rep(`{ id: "rain", name: "Déšť", text: "Mokré věci jsou těžké a padají dřív." }`, `{ id: "rain", name: "Déšť", short: "mokré věci padají dřív", text: "Mokré věci jsou těžké a padají dřív." }`);
rep(`{ id: "night", name: "Noc", text: "Tma: náhled dráhy je jen krátký." }`, `{ id: "night", name: "Noc", short: "náhled dráhy je krátký", text: "Tma: náhled dráhy je jen krátký." }`);
rep(`{ id: "park", name: "Podzimní park", text: "Vichr v listí: vítr je dvojnásobný." }`, `{ id: "park", name: "Podzimní park", short: "vítr je dvojnásobný", text: "Vichr v listí: vítr je dvojnásobný." }`);
rep(`{ id: "classic", name: "Klasika", text: "" }`, `{ id: "classic", name: "Klasika", short: "", text: "" }`);

// decodeG
rep(`const px = picks(x.px), po = picks(x.po), rx = int(x.rx) && x.rx >= 0 && x.rx <= 3 ? x.rx : 0;`, `const px = picks(x.px), po = picks(x.po), rx = int(x.rx) && x.rx >= 0 && x.rx <= 3 ? x.rx : 0, m = int(x.m) && x.m >= 0 && x.m < Pol.MODS.length ? x.m : 0;`);
rep(`seed: x.seed % 2147483647, gn: x.gn, rx, k,`, `seed: x.seed % 2147483647, gn: x.gn, rx, m, k,`);
// založení a odveta
rep(`    createRoom({ x, o, xs: demoSex, s: $("starter").value === "0" ? 0 : 1, seed: newSeed(), gn: 0,`, `    const sd0 = newSeed();
    createRoom({ x, o, xs: demoSex, s: $("starter").value === "0" ? 0 : 1, seed: sd0, m: Pol.pickMod(sd0, 0), gn: 0,`);
rep(`    const next = { ...g, gn: gn + 1, seed: newSeed(), s:`, `    const sd1 = newSeed();
    const next = { ...g, gn: gn + 1, seed: sd1, m: Pol.pickMod(sd1, g.m | 0), s:`);
// eventInfo
rep(`const ev = Pol.eventInfo(g.seed, k);`, `const ev = Pol.eventInfo(g.seed, k, g.m | 0);`);
rep(`Pol.eventInfo(g.seed, turnK()).type`, `Pol.eventInfo(g.seed, turnK(), g.m | 0).type`);
// scéna
rep(`    Art.world(ctx, L, v, calm() ? 0 : t);
    drawDebris();`, `    const th = g ? g.m | 0 : 0;
    Art.world(ctx, L, v, calm() ? 0 : t, th);
    drawDebris();`);
rep(`    Art.balconyFront(ctx, L, 0); Art.balconyFront(ctx, L, 1);
    drawProjectiles(t);`, `    Art.balconyFront(ctx, L, 0, th); Art.balconyFront(ctx, L, 1, th);
    Art.weather(ctx, v, calm() ? 0 : t, th);
    drawProjectiles(t);`);
// klobouky
rep(`    Art.kid(ctx, sexOf(j), { ...o, x: Pl.x,`, `    Art.kid(ctx, sexOf(j), { ...o, hat: hatOf(j), x: Pl.x,`);
rep(`Art.head(c, sexOf(j), { mood: o.mood, lx: j ? -0.8 : 0.8, ly: o.ly * 0.5, blink: o.blink, cream: o.cream });`, `Art.head(c, sexOf(j), { mood: o.mood, lx: j ? -0.8 : 0.8, ly: o.ly * 0.5, blink: o.blink, cream: o.cream, hat: hatOf(j) });`);
rep(`  const overOf = () => {`, `  // postup v sérii: výhry v sérii dají titul a kosmetiku (1 čelenka, 2 párty čepice, 3 koruna)
  const TITLES = ["Nováček", "Házeč", "Mlaskač", "Král polštářů"], HATS = ["", "čelenku", "párty čepici", "korunu"];
  const winsOf = j => !g ? 0 : (() => { const s = lastState(); return g.w[j] + (s && s.over && s.over.win === j ? 1 : 0); })();
  const hatOf = j => Math.min(3, winsOf(j));
  const overOf = () => {`);
// vztek: efekt
rep(`      case "combo": pop(`, `      case "rage": pop(e.x + (e.x > W / 2 ? -150 : 150), e.y - 20, "VZTEK!", "#FF5A4D", 50, "sfx"); burst(e.x, e.y + 50, 10, "steam", { sp: 1.6, up: 2, size: 12, life: 1.2 }); break;
      case "combo": pop(`);
// banner
rep(`      const evText = ["", "Holub na trase!", "Poryv větru!", "Bonusový balónek. Tref ho!"][ev];
      banner(canThrow() ? (evText ? "Tvůj hod. " + evText : "Tvůj hod!") : evText, canThrow()); // na tahu je to vidět i na plátně`, `      let evText = ["", "Holub na trase!", "Poryv větru!", "Bonusový balónek. Tref ho!"][ev];
      const mod = Pol.MODS[g.m | 0], tt = thrower(), rage = !overOf() && Pol.rageFor(g, shownState(), tt);
      if (g.T.length < 2 && mod.short && !overOf()) evText = \`\${mod.name}: \${mod.short}\` + (evText ? ". " + evText : "");
      if (rage) evText = canThrow() ? "Vztek! Hodíš o třetinu silněji." : \`\${nameOf(tt)} má vztek, hází silněji.\`;
      banner(canThrow() ? (evText ? (rage ? evText : "Tvůj hod. " + evText) : "Tvůj hod!") : evText, canThrow()); // na tahu je to vidět i na plátně`);
// ikona v HUD
rep(`<div class="wind" id="wind" role="img" aria-live="polite"><svg viewBox="0 0 48 48" aria-hidden="true"><path id="windPath" d=""/></svg>`, `<div class="wind" id="wind" role="img" aria-live="polite"><i class="modic" id="modIc" hidden></i><svg viewBox="0 0 48 48" aria-hidden="true"><path id="windPath" d=""/></svg>`);
rep(`.wind b{font-size:16px;`, `.modic{display:inline-flex}.modic svg{width:22px;height:22px;display:block}
.wind b{font-size:16px;`);
rep(`    $("wind").setAttribute("aria-label", w === 0 ? "bezvětří" : \`vítr \${a}\`);`, `    const md = g.m | 0, mi = $("modIc");
    if (mi.dataset.m !== String(md)) { mi.dataset.m = String(md); mi.innerHTML = MODICONS[md] || ""; mi.hidden = !md; }
    mi.title = md ? \`\${Pol.MODS[md].name}: \${Pol.MODS[md].text}\` : "";
    $("wind").setAttribute("aria-label", (w === 0 ? "bezvětří" : \`vítr \${a}\`) + (md ? \`, \${Pol.MODS[md].name}\` : ""));`);
rep(`  const ICONS = Art.ICONS;`, `  const ICONS = Art.ICONS;
  const MS = (d, fillc) => \`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="\${d}" fill="\${fillc || "none"}" stroke="#1D2145" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>\`;
  const MODICONS = [
    "",
    MS("M4 21V9h6v12M10 21V4h10v17M3 21h18", "#BCC9DD"),
    MS("M3 16c3-3 5 3 9 0s6 3 9 0M12 4v3M5 7l2 2M19 7l-2 2M8 12a4 4 0 0 1 8 0", "#FFE27A"),
    MS("M7 15a4 4 0 0 1 1-8 5 5 0 0 1 9 2 3 3 0 0 1 0 6zM8 19l-1 2M12 19l-1 2M16 19l-1 2", "#A4B8CC"),
    MS("M19 14a8 8 0 1 1-9-10 6.5 6.5 0 0 0 9 10z", "#FFF1BF"),
    MS("M5 19C5 9 11 4 20 4c0 10-6 15-15 15zM5 19l9-9", "#F0883A")
  ];`);
// konec hry
rep("    $(\"endMeta\").textContent = `Bitva ${g.gn + 1}, ${g.T.length} hodů. Zbylo: ${nameOf(0)} ${st.hp[0]}, ${nameOf(1)} ${st.hp[1]}.`;", "    const md = Pol.MODS[g.m | 0], tier = j => Math.min(3, j), up = o.win != null && tier(w[o.win]) > tier(g.w[o.win]);\n    $(\"endMeta\").textContent = `Bitva ${g.gn + 1}${md.name && md.id !== \"classic\" ? \" (\" + md.name.toLowerCase() + \")\" : \"\"}, ${g.T.length} hodů. Zbylo: ${nameOf(0)} ${st.hp[0]}, ${nameOf(1)} ${st.hp[1]}.` + (up ? ` ${nameOf(o.win)} je teď ${TITLES[tier(w[o.win])]} a dostává ${HATS[tier(w[o.win])]}.` : \"\");");
// intro
rep(`    <p class="meta" id="introFirst" hidden></p>`, `    <p class="meta" id="introMod" hidden></p>
    <p class="meta" id="introFirst" hidden></p>`);
rep(`    $("introFirst").hidden = !g.T.length;`, `    const imd = Pol.MODS[g.m | 0]; $("introMod").hidden = !g.m; $("introMod").textContent = g.m ? \`Dnešní prostředí: \${imd.name}. \${imd.text}\` : "";
    $("introFirst").hidden = !g.T.length;`);
// jak se hraje
rep(`    <li><b>Vítr</b> se mění každé kolo.`, `    <li><b>Prostředí</b> se pro každou bitvu losuje a mění pravidla: ulice, pláž, déšť, noc nebo podzimní park. <b>Vztek:</b> kdo prohrává o 30 životů a víc, hází o třetinu silněji. Výhry v sérii dají titul a čelenku, párty čepici a nakonec korunu.</li>
    <li><b>Vítr</b> se mění každé kolo.`);
// info hook
rep(`seed: g && g.seed, selItem, selPower,`, `seed: g && g.seed, m: g && g.m, rage: g && lastState() ? Pol.rageFor(g, lastState(), thrower()) : false, hat: g ? [hatOf(0), hatOf(1)] : null, selItem, selPower,`);
// noc: kratky nahled
rep(`preview = r ? r.frames.slice(0, 47) : null;`, `preview = r ? r.frames.slice(0, g.m === 4 ? 17 : 47) : null;`);
fs.writeFileSync(f, t); console.log("ok", n);
