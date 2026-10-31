# Pracovní deník – Polštářovka

PŘEVZATO 31. 10. – dodělává session na účtu P, jiná session sem nepíše.

## 2026-10-31 večer – přestavba dokončena: Mlask!
- **Hotovo:** převzatý stav přestavby (WIP 3fede6d) dotažen. Nový název **Mlask!**, twist Uhni!, plochý vektor, nový HUD, 5 prostředí (ulice, pláž, déšť, noc, park), Vztek, odměny v sérii.
- **Opravy po design-eye (3 kola):** jména v noci bílá, sevřená horní řada HUD na 390 px, kužel lampy místo koule, banner na mobilu dole a mizí při reakčním slově i při ukázce míření, zrušen kruh síly, tečky dráhy ne přes HUD, dock bez zdvojené síly a bez odznaku ∞, čísla zdraví od avatarů, „Celá scéna“, mraky níž, HUD 1,15× na desktopu ≥1200×820, síla max 100 %.
- **Verdikt design-eye:** kolo 3 „ANO profi indie hra po opravě překryvu docku na mobilu“; oprava (vrácený nadpis Hoď) ověřena renderem 390×844 `tests/shots/flow/mobil-04-miri.png`.
- **Ověřeno lokálně (127.0.0.1:8797):** `uhni.cjs` 4/4, `mods.cjs` 12/12, `duel.cjs` A/B/C 25/25 (exit 0), `ui.cjs` 137/137 (exit 0), `series.cjs` 4/4 (3 bitvy: ulice → park → déšť, různý vítěz, vítr i odměny).
- **Nasazeno (e4f4837):** https://sachasportrezervace-arch.github.io/mlask/ (repo `sachasportrezervace-arch/mlask`). Živě: `node tests/duel.cjs https://sachasportrezervace-arch.github.io/mlask/ A` 25/25 exit 0, `node tests/ui.cjs` tamtéž 137/137 exit 0. Starý odkaz https://sachasportrezervace-arch.github.io/polstarovka/#r.test123 přesměruje na `/mlask/#r.test123` (Playwright, exit 0); přesměrování je v novém repu `sachasportrezervace-arch/polstarovka`.
- **Test:** gesto sevření v `ui.cjs` zpomaleno (10 kroků po 20 ms); pod zátěží ostatních her padalo i na nezměněném kódu.
- **Rozhodnuto:** repo přejmenováno na `mlask`, do nového `polstarovka` jde přesměrování se zachováním `#r.<id>`; klíče mantledb (`polstarovka-<id>`) a `app:"polstarovka"` zůstávají kvůli rozehraným hrám.
- **Otevřené:** dock na mobilu zabírá ~36 % výšky (přestavba na 2 řady), mraky občas za hlavami, doplňky postav těsně pod HUD na 1440×900, `shots.cjs` občas spadne v kroku desktop-09 (nástroj snímků, ne hra). NEOVĚŘENO: skutečný iPhone, chybový stav neplatného odkazu, ležatý mobil v design-eye.

## PŘEDÁVKA 2026-10-31 – kompletní přestavba (kontext plný)
- **Zadání od Marka (přes session Piskvorky):** současný vzhled ani název se mu nelíbí. Chce „čistý plochý vektor jako reference, vlastní twist, vlastní design, UX/UI bez hnusu“.
  - Reference: nArtBox Boy vs Girl, `C:\Users\LEARTI~1\AppData\Local\Temp\claude\C--Users-le-artist-AppData-Roaming-Claude-scratch-workspaces-a6a7acfc-0a38-40ad-94ae-6ba230a3b53c-6a5adc0f-5814-4034-986e-41296f8d6841-scratch-2026-10-30-bcf3d5\922eab0b-50bc-40cb-b2dc-56155839c37f\images\4.png`. Nekopírovat.
  - Styl: málo prvků, velké ploché plochy, jednoduché pozadí (obloha, kopce nebo písek), žádné paprsky, textury ani dekorace. Postavy velké, vtipné výrazem tváře (karikatura, ne generické chibi).
  - HUD: jeden společný pruh zdraví nahoře s hlavičkami obou hráčů, power-upy jako kulaté ikony vlevo a vpravo, vítr uprostřed, tečkovaný oblouk míření, nic víc. Humor ve hře (reakce na zásah, hlášky), ne v nadpisech.
- **Postup podle Marka:**
  1. Nový krátký vtipný český název.
  2. Twist.
  3. Nejdřív 2 statické SVG návrhy herní obrazovky (mobil na výšku i desktop). Porovnat s `agent-skills/skills/mark-design-taste-lens/SKILL.md` a referencí, posoudit agentem design-eye a vybrat lepší.
  4. Pak přestavět celou hru včetně úvodu, výzvy a výsledku. Vše vektor, žádné rastry.
- **Před nasazením:**
  - game-feel test ve 2 prohlížečích;
  - design-eye s verdiktem „profi indie“ a anti-slop seznamem (bez emoji, výchozích fontů a dekorací, sjednocená zaoblení, stíny a odsazení, dotažené stavy), max 3 kola;
  - živý test, screenshoty.
- **Rozhodnutý twist „Uhni!“:**
  - Po vlastním hodu hráč tajně zvolí obranu proti dalšímu soupeřovu hodu: přikrčit, uskočit nebo chytit. Každá volba poráží jiné typy hodů, žádná není dominantní. Při dopadu se odhalí komiksovým momentem.
  - Sync: 8. prvek tahu `T`; tahy se 7 prvky = bez obrany. Engine s obranou 0 musí dát totožný výsledek kvůli zpětné kompatibilitě rozehraných her. První hod: obranu volí obránce při založení nebo přijetí výzvy (např. `g.rx`).
  - Vyřazené: „munice se vrací“ (subtilní, projeví se až po kolech), „pevnost z polštářů“ (bez interakce mezi hráči).
- **Co zůstává:**
  - Deterministický engine `<script id="engine">` (celá čísla) a sync mantledb `{app,g,v,s0,s1,u}`.
  - Opravy z revize Codexu: `decodeG`, `docOk`, `opStale`.
  - Fullscreen, posun, sevření, „Celá ulice“, manifest a ikony.
  - Testy `tests/duel.cjs` A/B/C a `tests/ui.cjs`.
  - Kreslení (`drawTitle`, `drawKid`, `drawHouse`, `drawItem`, `drawTexts`) a CSS se celé nahradí.
- **Stav:**
  - Commit 76ef173 + deník je živě na https://sachasportrezervace-arch.github.io/polstarovka/: duel A/B/C 20/20 a ui 137/137, exit 0.
  - Lokálně jsou možné neuložené úpravy z běžícího ladění pocitu (agent playtestu); jeho nálezy jsou v poznámce `polstarovka.md` ve sdílených poznámkách.
  - Při přejmenování založit nové repo, nebo přejmenovat, a ponechat přesměrování.
- **Server:** `python -m http.server 8797` ve složce. Playwright je v `%APPDATA%/npm/node_modules/playwright`. Push přes `git -c credential.helper= -c credential.helper='!gh auth git-credential' push`.

## 2026-10-31 – komiksový vzhled, fullscreen, posun a zoom
- **Hotovo:**
  - **Vzhled:** vlastní komiksový vzhled ve stylu chibi. Kluk s kšiltovkou a holka s copem, tlusté obrysy, teplé paprsky, pastelové domy. Úvodní scéna VS s logem. Komiksové výbuchy se slovy PLESK!, ŽBLUŇK! a DO HLAVY!.
  - **Rozhraní:** papírové panely s posunutým stínem a písma Lilita One, Bangers, Nunito a Caveat. Odstraněné nadpisky nad titulky a znaky ♥ a šipek.
  - **Podklady:** PRODUCT.md a DESIGN.md.
  - **Ovládání:** tlačítko fullscreen; na iPhonu místo něj nápověda „Přidat na plochu“ a `manifest.webmanifest` s režimem standalone. Posun tažením, sevření dvěma prsty, kolečko myši a tlačítko „Celá ulice“. Dotykové cíle mají aspoň 44 px.
- **Revize:** Codex (`codex exec`, jen čtení) prošel kód. Engine je bez zdroje nedeterminismu. Opravené nálezy:
  - validace v `decodeG`, kontrola obálky `docOk` a ochrana generace přes `opStale`;
  - `busy` se uvolňuje přes `finally`, vrácení hodu po chybě, zrušení rozběhnutého pollu a seřazení událostí podle kroku.
- **design-eye:** „OK s výhradami“ (D2). Opraveno 8 nálezů: HUD na mobilu, výbuch při zásahu, zásobník, razítka, okno za postavou, úvodní obrazovka na mobilu a přišpendlené tlačítko.
- **Ověřeno lokálně:**
  - `node tests/duel.cjs http://127.0.0.1:8797/ A`, `B` i `C`: vždy 20/20 PASS, exit 0. Režim C hraje Chromium na desktopu proti WebKitu s iPhonem 13 na šířku.
  - `node tests/ui.cjs …`: 137/137 PASS, exit 0.
- **Ověřeno živě (commit 76ef173):**
  - `node tests/duel.cjs https://sachasportrezervace-arch.github.io/polstarovka/ A`, `B` i `C`: vždy 20/20 PASS, exit 0.
  - `node tests/ui.cjs` na stejné URL: 137/137 PASS, exit 0.
- **Otevřené:**
  - Spuštěný souběžně s duely měl `ui.cjs` 135/137, chybělo gesto sevření a zoom kolečkem. Sám prošel, test je pod zátěží nestabilní.
  - Nevyřešená rizika ze sítě: mantledb nemá atomický zápis (compare-and-swap), zápis po ztracené odpovědi není idempotentní a zůstává nález v `setG`.
  - NEOVĚŘENO: přidání na plochu v reálném Safari a fullscreen na skutečném iPhonu.

## 2026-10-31 – první verze, nasazeno
- **Hotovo:** `index.html` (jeden soubor, bez buildu), repo sachasportrezervace-arch/polstarovka, commit d6695cb, GitHub Pages https://sachasportrezervace-arch.github.io/polstarovka/
- **Hra:** prak tahem (myš, dotyk, šipky + Enter), 5 předmětů (polštář ∞, vlaštovka 3, balónek 3, kachnička 2, dort 1), 6 triků (každý vybere 3 a použije je jednou za bitvu), vítr podle seedu, události kola (holub, poryv, bonusový balónek), zásah do hlavy ×1,5, kombo, 3 náhodné scény (ulice, dvorek s kočkou, park), výzva se sázkou nebo fantem, vzkaz a razítko k hodu, série odvet, přihlížející.
- **Sync:** mantledb.sh `polstarovka-<id>/hra`, dokument `{app, g, v, s0, s1, u}`, `g.T` = jen vstupy `[předmět, trik, vx, vy, razítko, vzkaz, minuta]`, vx/vy jsou celá čísla kvantovaná po 250. Engine v `<script id="engine">` počítá jen s celými čísly (Math.trunc, Math.imul).
- **Ověřeno:** `node tests/duel.cjs https://sachasportrezervace-arch.github.io/polstarovka/ A` → 20/20 PASS, exit 0 (Chromium desktop myš × WebKit iPhone 13 dotyk). Stejně `… B` → 20/20 PASS, exit 0 (WebKit desktop × Chromium Pixel 7, dotyk přes CDP). V obou běžích se po každém hodu shodovaly životy na obou stranách i s přepočtem v Node.
- **Rozhodnuto:** název Polštářovka zůstal. Hod nejde vzít zpět (výsledek je vidět hned). Triky platí pro celou sérii. Bitva má nejvýš 40 hodů.
- **Otevřené / NEOVĚŘENO:** skutečný iPhone a Android (dotyk ve WebKitu je simulovaný PointerEventy), Playwright WebKit na Windows kreslí Baloo 2 tence (variabilní font; v Safari NEOVĚŘENO), vyváženost předmětů s lidmi (test hází optimálním řešičem).
- **Dál:** odehrát jednu bitvu s Radkou a podle ní doladit sílu vlaštovky a kachničky.
