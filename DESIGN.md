# Mlask! – vizuální svět
Režim: Experience (hra). Reference nálady: nArtBox „Boy vs Girl“ (ploché čisté vektory, málo prvků, velké plochy). Nic z originálu se nekopíruje.
- Svět: den na ulici, dvě sousední domy přes ulici (žlutý a mátový), balkony, lampa, strom, kopce. Žádné paprsky, textury ani dekorace.
- Kresba: plné ploché barvy, žádné přechody. Inkoustová linka #1D2145 (4 jednotky) jen na postavách a předmětech, prostředí je bez linky.
- Postavy (vlastní): kluk s třemi pačesy a velkýma ušima, holka s obřími vlasy, drdolem a brýlemi. Hlava je velká, výraz se mění podle situace (soustředění, úsměv, leknutí, K.O.), před zásahem se postava předem lekne.
- Prostředí partie (losuje se ze seedu, nikdy dvakrát po sobě stejné): ulice (městská silueta, asfalt), pláž (moře, slunce, písek), déšť (šedá obloha, čáry deště, kaluže), noc (tmavá obloha, měsíc, hvězdy, rozsvícené lampy a okna), podzimní park (teplá obloha, oranžový strom, padající listí). Jen barvy a několik plochých tvarů přes jednu funkci `Art.world(c, L, v, t, motiv)`.
- Postup v sérii (kosmetika): 1 výhra červená čelenka, 2 výhry párty čepice, 3 a víc výher koruna (`Art.head` volba `hat`). Tituly: Nováček, Házeč, Mlaskač, Král polštářů.
- Barvy: ink #1D2145, obloha #BFE7F6, kopce #A9DDB6 a #6FC48F, země #F8E0AC, kluk modrá #4D6BFF, holka růžová #FF5C93, akcent žlutá #FFD23F.
- Písmo: Fredoka (statické řezy zabudované v souboru jako base64, žádný Google Fonts).
- HUD: jeden společný pruh zdraví s hlavami obou hráčů, kulaté ikony triků vlevo a vpravo, vítr uprostřed s ikonou prostředí, tečkovaný oblouk míření. Spodní dok: předměty a tři obrany Uhni!.
- Pohyb: jeden autorský moment = zásah (hit-stop, kamera, komiksové slovo, otřes); vše vypnuto při prefers-reduced-motion.
- Návrhy: `design/navrh-mobil.svg` (390×844) a `design/navrh-desktop.svg` (1440×900), vybraná byla varianta s velkou hlavou a širokým pruhem zdraví.
