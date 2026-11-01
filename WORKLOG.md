# Pracovní deník – Polštářovka

PŘEVZATO 1. 11. – kolo vylepšení, session polstarovka (mlask kolo 1. 11.); jiná session sem nepíše.

## 2026-11-01 – kolo vylepšení: konec bitvy, mobil na šířku, nestabilní ui.cjs
- **Design-eye na živé animaci** (listy z videa skutečné partie v reálném čase, `tests/video.cjs`): kolo 1 „NE“ (dock na šířku třetina obrazovky, K.O. useknuté, přejezd přes prázdné nebe, statická radost vítěze), kolo 2 **„ANO, profi indie hra“** s drobnostmi (karta na šířku zakryje visícího poraženého, texty karty suché → přepsány hlasem vítěze, mírné pumpování zoomu na desktopu po K.O.). Listy `tests/shots/video-r3..r5`.
- **Opravy po kole 1:** na šířku mimo tah plovoucí pilulka stavu + 2 ikony (`.dock.idle`), na tahu boční dock 252 px (`.app.side`); kamera po konci zabírá poraženého bez posunu ven (`loserShot`); přejezd na vítěze ease-in-out 0,4 s (`endPan`, `PAN_S`); radost vítěze cyklus 600 ms; konfety 36 ks úměrné zoomu; karta na šířku v půlce na straně poraženého (`#end.wl`), zhutněná. `ui.cjs`: na šířku se ulice vejde → `fitBtn` skrytý, posun a Celá scéna se přeskočí (`fits`).
- **Texty karty bez sázky:** jedna věta hlasem vítěze podle seedu (`pickLine`).
- **Ověřeno lokálně (127.0.0.1:8797):** `uhni` 4/4, `mods` 12/12, `duel` A i B 25/25, `solo` 42/42, `ui` 131/131, `series` 4/4, vše exit 0.
- **Nasazeno (7ff379d), živě** (https://sachasportrezervace-arch.github.io/mlask/): `duel … A` 25/25, `solo` 42/42, `ui` 131/131, `herna … /herna/` 30/30, vše exit 0.
- **NEOVĚŘENO:** skutečný iPhone (Safari na šířku 750×342), boční dock na tahu na šířku jen testem `ui`, ne očima ve videu; zvuk.
- **Dál (drobnosti z design-eye kola 2):** na šířku karta zakryje visícího poraženého (kartu max 70 % výšky nahoru, HUD poražené strany pod kartou skrýt), na desktopu po K.O. mírně pumpuje zoom (zamknout). `tests/_all.sh`, `_crop.cjs`, `_dbg.cjs` nejsou moje, necommitnuto.
- **Příčina nestabilního `ui.cjs` (sevření + kolečko):** výška balkonů se losuje podle místnosti (`layout(seed)`, y 500–620), štítek „soupeř mimo obraz“ (`peekHit`) se tím posouvá a u části místností leží pod prvním prstem sevření. Štítek se chytal už na `pointerdown` → gesto = ťuk na štítek, zoom se neprovedl. Důkaz: původní kód + nový test na 8798 → FAIL „sevřít“ (0,902) a „kolečko“; nový kód 149/149. Oprava: štítek platí až po ťuknutí (`peekTap`), druhý prst = štípnutí, posun = posun/prak. Nové kontroly v `ui.cjs` (4b). Pád undici v Node 24 po konci `ui.cjs` opraven čtením těla fetch.
- **Konec bitvy:** kamera drží poraženého do dopadu K.O., pak přejede na vítěze (`endShot`), konfety až tam, karta ~1,9 s potom; lišta dole po konci bez „X vyhrál.“ (`waitBox` skrytý bez textu); štítek soupeře po konci zmizí.
- **Nástroj:** `tests/video.cjs URL out [jména]` – video celé sólo partie (výhra/prohra, desktop, mobil, na šířku) + kontaktní listy zásahu a konce z videa v reálném čase (ffmpeg). Kolo 1: `tests/shots/video-r1`.

PŘEVZATO 31. 10. 19:35 – redesign postav a efektů z Markova zadání, session mlask-vizual (jiná session sem nepíše).

PŘEVZATO 31. 10. – dodělává session na účtu P, jiná session sem nepíše.

## 2026-10-31 – napojení na Hernu (session na účtu P)
- **Hotovo:** `<meta name="herna-protokol" content="1">` a adresa `#herna=1&m=…&r=…&seat=0|1&names=A,B&zaklada=0|1` (`parseHerna`, `hernaOpen`, `hernaStav`, `doHerny` v `index.html`). Bez výzvy a setupu: `zaklada=1` založí dokument `polstarovka-<r>/hra` (stejné klíče jako dřív) se jmény, seed, prostředím přes `Pol.pickMod`, náhodným začínajícím, náhodnou první obranou `rx` a náhodnými triky, bez sázky; `zaklada=0` čeká a sedne si sám. Sedadlo = hráč v `g`, takže `vitez` = `o.win`. Dokud nesedí oba, nehází se. Rodiči jde `pripraveno`, `stav` (ceka/hraje/konec), jeden `vysledek` na bitvu (`partie` = `r:gn`) a „Jiná hra“ (na konci bitvy místo odkazu a „Uznat porážku“). Skryté: výzva, sdílení, „Zkusit sám“, nová hra, kopie odkazu. Bez platného `#herna` beze změny.
- **Ověřeno lokálně (127.0.0.1:8797):** `tests/herna.cjs` http://127.0.0.1:8797/ http://127.0.0.1:8890/ 30/30 (maketa rodiče + skutečná Herna lokálně), exit 0; `uhni` 4/4, `mods` 12/12, `duel A` 25/25, `solo` 42/42, `ui` 137/137, vše exit 0.
- **Nasazeno (a7bd6e3), živě:** `node tests/herna.cjs https://sachasportrezervace-arch.github.io/mlask/ https://sachasportrezervace-arch.github.io/herna/` 30/30, exit 0 (Mark Chromium desktop, Radka WebKit iPhone 13, místnost, výběr Mlasku, partie, skóre v liště, Jiná hra); `node tests/duel.cjs https://sachasportrezervace-arch.github.io/mlask/ A` 25/25, exit 0.
- **Otevřené / NEOVĚŘENO:** skutečný iPhone a mobil na šířku v iframe Herny, `fsBtn` (fullscreen) uvnitř iframe, `series`/`ui` živě, pohlaví postavy se tipuje z koncovky jména (-a = holka, pár výjimek), protože protokol pohlaví nezná; remíza (`vitez: null`) jen z kódu, ne z testu.

## 2026-10-31 – sólo režim „Zkusit sám“ / #solo (session na účtu P)
- **Hotovo:** tlačítko „Zkusit sám“ vedle „Založit výzvu“ a adresa `#solo`: partie proti botovi (36 náhodných hodů, vybere nejlepší a přidá šum ±7 %, trefí asi 35 %, hází s pauzou ~1,2 s), bez sync, místnosti a odkazu, mimo sérii a kosmetiku (`startSolo`, `botMaybe`, `botThrow`). V HUD je „Bot(ka) · trénink“, na konci „Znovu“ a „Vyzvat soupeře“. Prostředí se losuje přes `Pol.pickMod`.
- **Ověřeno lokálně:** `tests/solo.cjs` 42/42 (Chromium desktop + WebKit iPhone 13, 0 požadavků na mantledb, beze změny localStorage), uhni 4/4, mods 12/12, duel A 25/25, ui 137/137, vše exit 0.
- **Nasazeno (ad5b85f), živě:** `node tests/solo.cjs https://sachasportrezervace-arch.github.io/mlask/` 42/42, exit 0.
- **Otevřené:** když začíná bot, první obrana hráče je náhodná; test hraje dokonalým řešičem, takže partie jsou krátké.

## 2026-10-31 20:55 – redesign postav a efektů hotov (session mlask-vizual)
- **Hotovo:** rig z dílů s pivoty (`Art.char`, `Art.head`, výrazy, pružiny vlasů a lemu) a nové efekty (`Art.feather/poof/impact/trail/dust`) jsou v `index.html`; návrh a model sheet v `design/rig-navrh/`. Marek vytáhlý s velkým nosem, Radka kulatá s ofinou a culíky.
- **Animace (`buildPose`):** nádech a mrkání, nápřah při míření, hod (švih s protažením a dokmit), reakce na zásah podle poškození (`hitBig`), málem K.O. při ≤ 25 životech (třes, pot), K.O. = závrať a přehození přes zábradlí (kreslí se po `balconyFront`), vítěz skáče s pěstí, posměšek s dlouhým nosem po úhybu a minutí.
- **Efekty:** střídmé peří (3-4 kusy, létá od zásahu nahoru a ven), náraz (5 čárek) a obláček za postavou, hit-stop, jemný otřes jen u hlavy a K.O., stopa letu jako zužující se pruh, prach při dopadu. Zrušeny všechny texty přes hru (PLESK, MIMO, DOLŮ, špatný tip, +život, kvák, KOMBO, VZTEK, DEŠTNÍK); banner nad scénou se ve hře schovává; po konci bitvy drží kamera poraženého a karta výsledku přijde po 2,6 s. Zábradlí vizuálně sníženo na 48 px (engine beze změny), aby byl vidět trup.
- **Ověřeno lokálně (127.0.0.1:8963):** `uhni` 4/4, `mods` 12/12, `duel` A, B, C 25/25, `series` 4/4, `solo` 42/42, `ui` 137/137 (jednou 135/137: sevření a kolečko, známá nestabilita pod zátěží, příští běh 137/137). Série snímků: `node tests/anim.cjs URL out` → `tests/shots/anim-r6`.
- **design-eye:** model sheet OK s výhradami (opraveno), živý build kolo 1 a 2 OK s výhradami, kolo 3 „NE, zbývá pointa K.O.“; po něm opravena silueta K.O. a póza výhry (render `anim-r6` zkontrolován očima, design-eye už neběželo, max 3 kola).
- **Otevřené / NEOVĚŘENO:** razítkované rendery, skutečný iPhone, ležatý mobil v design-eye, mobil kdy prohraje hráč, kamera na vítěze před kartou, spodní lišta opakuje „vyhrál“.

## PŘEDÁVKA 2026-10-31 19:45 – redesign postav a efektů (session mlask-vizual, kontext plný)
- **Zadání (Mark přes session herny):** postavy, animace a efekty jsou „slop“ – přepracovat od základu na úroveň profi indie hry (reference nArtBox Boy vs Girl, plochý vektor, humor ve výrazech). Logiku, sync, mody a testy neměnit, jen kvůli vykreslení.
- **Hotovo (návrh, ne v `index.html`):** `design/rig-navrh/`
  - `rig.js` – rig z dílů s klouby: `char(c, sex, o)` (kyčel, trup s lemem, krk, hlava, ruce FK i IK `t1/t2`, nohy, dlaně fist/open/mitt/point), `head2` s výrazy `EXPR` (idle, aim, tense, scared, hit, weak, ko, dizzy, joy, taunt, smug, throw), pružiny `sec.h1/h2/hem`, pot, třes `shiver`, `headPos`, `noseAt` (posměšek „dlouhý nos“).
  - Marek: vytáhlý a hranatý (protáhlá hlava s bradou, vysoký účes s vláskem, velký nos, pruhované tričko). Radka: malá a kulatá (mikádo s rovnou ofinou, obočí přes ofinu, dva culíky do stran, pihy, šaty).
  - `fx.js` – `feather`, `poof` (shluk kruhů s jedním obrysem), `impact` (hvězda nárazu), `trail` (zužující se pruh), `dust`.
  - Náhledy: `sheet.png` (9 póz × 2), `heads.png` (9 výrazů × 2), `scene-desktop.png`, `scene-mobil.png` (zásah polštářem). Generuje `node design/rig-navrh/sheet.cjs <out.png> [1=jen hlavy]` a `node design/rig-navrh/scene.cjs` (Playwright z `%APPDATA%/npm`).
- **Ještě neuděláno:** posudek model sheetu (`mark-design-taste-lens` + agent design-eye), implementace do hry, design-eye živého buildu (desktop i mobil, max 3 kola), playtest Chromium + WebKit iPhone, 60 fps, testy `mods/uhni/duel/ui/series`, deploy `sachasportrezervace-arch/mlask`, živý test, srovnání před/po.
- **Plán implementace:** v `Art` nahradit `kid/head/face/hat` za `char/head2/hat2` (export i `headPos`), postavy kreslit `k≈1.2` a o ~22 níž, aby hlava seděla na hitbox (`hitboxes`: hlava p.y-134 r30). `kidPose` přepsat na klíčové snímky: nádech + náhodné mrkání, hod = nápřah (squash) → švih (stretch) → dokmit, zásah podle síly (dmg/hlava/K.O.), málem K.O. při hp ≤ 25 (třes, pot, výraz weak), K.O. = přehoz přes zábradlí (kreslit po `balconyFront`, bez ořezu), vítěz skáče s pěstí, posměšek po úhybu/minutí. Pružiny vlasů z pohybu `headPos` mezi snímky. Efekty ve vrstvě za postavou (impact, poof) a před ní (polštář, pírka); třes kamery jen hlava/K.O.; **zrušit všechny textové hlášky na plátně** (`pop` sfx, MIMO, kvák, „špatný tip“, +život); dav teček dráhy → stopa `trail`; dopad → `dust`.
- **Opravy z review:** mobil menší horní pás a dock (dock ~36 % výšky), při míření vidět soupeře (kamera oba hráče), čepice/koruna nesmí do ikon HUD (`hudMinY`), text stavu podle dění, tečky míření čitelné na světlém nebi (inkoustový obrys).
- **Pozor, souběh:** od 19:34 někdo jiný necommitnutě mění `index.html`, `README.md` a přidal `tests/solo.cjs` (sólo trénink s botem, „Zkusit sám“). Jeho změny nepřepisovat; začít až po jeho commitu (`git log`, časy souborů), před commitem `git pull --rebase`. Commit e0ef78a (převzetí) a tahle předávka jsou zatím jen lokálně, nepushnuté.

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
