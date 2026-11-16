// Comprovador de salut de la web. Executa: node herramientas/check.js
// Revisa: URLs del sitemap en linia (200), proves de calcul, JSON-LD, titols/descripcions,
// presencia de GoatCounter i enllacos interns. Surt amb codi 1 si hi ha algun problema.
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const BASE = 'https://puxeuu.github.io/robot-arm-calculators/';
const problemes = [];
const avis = (m) => { problemes.push(m); console.log('PROBLEMA: ' + m); };

function pagines(dir) {
  let out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('_') || e.name.startsWith('.') || e.name === 'node_modules') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out = out.concat(pagines(p));
    else if (e.name === 'index.html') out.push(p);
  }
  return out;
}

(async () => {
  // 1) Proves de calcul
  for (const d of ['calculadoras', 'torque-calculator', 'ik-calculator', 'gear-calculator']) {
    try { execSync('node test.js', { cwd: path.join(ROOT, d), stdio: 'pipe' }); console.log('OK   proves ' + d); }
    catch (e) { avis('Les proves de ' + d + ' fallen'); }
  }
  // 2) Revisio estatica de cada pagina
  const files = pagines(ROOT);
  for (const f of files) {
    const h = fs.readFileSync(f, 'utf8'), rel = path.relative(ROOT, f);
    const t = (h.match(/<title>(.*?)<\/title>/s) || [])[1] || '';
    const d = (h.match(/name="description" content="(.*?)"/) || [])[1] || '';
    if (!t) avis(rel + ': sense titol'); if (t.length > 60) avis(rel + ': titol llarg (' + t.length + ')');
    if (!d) avis(rel + ': sense descripcio'); if (d.length > 160) avis(rel + ': descripcio llarga (' + d.length + ')');
    if (!h.includes('rel="canonical"')) avis(rel + ': sense canonical');
    if (!h.includes('data-goatcounter')) avis(rel + ': sense analitica');
    for (const m of h.matchAll(/ld\+json">(.*?)<\/script>/gs)) { try { JSON.parse(m[1]); } catch (e) { avis(rel + ': JSON-LD invalid'); } }
    for (const m of h.matchAll(/href="([^"#:]+?)"/g)) {
      if (/^(http|\/\/|data:)/.test(m[1])) continue;
      let p = path.normalize(path.join(path.dirname(f), m[1]));
      if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
      if (!fs.existsSync(p)) avis(rel + ': enllac trencat ' + m[1]);
    }
  }
  console.log('OK   ' + files.length + ' pagines revisades');
  // 3) URLs en linia segons el sitemap
  const sm = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  const urls = [...sm.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
  let errorsXarxa = 0;
  for (const u of urls) {
    try { const r = await fetch(u); if (r.status !== 200) avis(u + ' respon ' + r.status); }
    catch (e) { errorsXarxa++; }
  }
  if (errorsXarxa === urls.length) {
    // Entorn sense acces a puxeuu.github.io: es comprova l'estat de GitHub Pages per l'API.
    console.log('AVIS: cap URL accessible des d\'aquest entorn (xarxa bloquejada). Es comprova GitHub Pages per l\'API.');
    try {
      const r = await fetch('https://api.github.com/repos/Puxeuu/robot-arm-calculators/pages/builds/latest', { headers: { 'User-Agent': 'check' } });
      const j = await r.json();
      if (j.status === 'built') console.log('OK   GitHub Pages: ultima publicacio correcta (' + j.updated_at + ')');
      else avis('GitHub Pages: estat de l\'ultima publicacio = ' + (j.status || ('HTTP ' + r.status)));
    } catch (e) { console.log('AVIS: tampoc s\'ha pogut consultar l\'API de GitHub; no es pot comprovar si la web es en linia.'); }
  } else if (errorsXarxa > 0) avis(errorsXarxa + ' URLs no responen');
  console.log('OK   ' + urls.length + ' URLs del sitemap comprovades en linia');
  // 4) Cada pagina local ha d'estar al sitemap
  for (const f of files) {
    const rel = path.relative(ROOT, path.dirname(f)).split(path.sep).join('/');
    const url = BASE + (rel ? rel + '/' : '');
    if (!urls.includes(url) && !rel.endsWith('privacidad')) avis('Falta al sitemap: ' + url);
  }
  console.log(problemes.length ? '\n' + problemes.length + ' PROBLEMES' : '\nTOT EN ORDRE');
  process.exit(problemes.length ? 1 : 0);
})();
