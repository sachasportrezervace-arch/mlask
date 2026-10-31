// Vykreslí icon-180.png a icon-512.png: Marek, na kterého letí polštář na nebi, stejným kódem jako hra.
// node tests/make-icons.cjs
const path = require("path"), fs = require("fs");
const PW = process.env.PW || path.join(process.env.APPDATA || "", "npm/node_modules/playwright");
const { chromium } = require(PW);
(async () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const art = /<script id="art">([\s\S]*?)<\/script>/.exec(html)[1];
  const b = await chromium.launch();
  for (const size of [180, 512]) {
    const p = await b.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
    await p.setContent(`<style>html,body{margin:0;background:#BFE7F6}canvas{display:block}</style><canvas id="c" width="${size}" height="${size}"></canvas>`);
    await p.addScriptTag({ content: art + "\nwindow.Art = Art;" });
    await p.evaluate(size => {
      const c = document.getElementById("c").getContext("2d"), k = size / 512;
      c.scale(k, k);
      c.fillStyle = "#BFE7F6"; c.fillRect(0, 0, 512, 512);
      // zelené kopce a písek, stejně jako ve hře
      c.fillStyle = "#A9DDB4"; c.beginPath(); c.moveTo(0, 330); c.quadraticCurveTo(150, 250, 300, 320); c.quadraticCurveTo(420, 370, 512, 300); c.lineTo(512, 512); c.lineTo(0, 512); c.fill();
      c.fillStyle = "#6EC48F"; c.beginPath(); c.moveTo(0, 400); c.quadraticCurveTo(200, 340, 512, 410); c.lineTo(512, 512); c.lineTo(0, 512); c.fill();
      c.fillStyle = "#F8E0AC"; c.fillRect(0, 450, 512, 62);
      // hlava s dortem, mírně nakloněná
      c.save(); c.translate(256, 290); c.rotate(-0.08); c.scale(2.35, 2.35);
      Art.head(c, "k", { mood: "scared", lx: 0.9, ly: -0.1, blink: 0, cream: false });
      c.restore();
      // letící polštář zprava, hned ho trefí
      Art.item(c, 0, 400, 150, 70, 0.5, 0, false);
    }, size);
    await p.screenshot({ path: path.join(__dirname, "..", `icon-${size}.png`), clip: { x: 0, y: 0, width: size, height: size } });
    await p.close();
  }
  await b.close();
})();
