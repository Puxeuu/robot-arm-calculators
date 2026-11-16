// Proves: IK contra FK (error de posicio i orientacio) i casos fets a ma. Executa: node test.js
const { fk, ik, wrap, workspace } = require('./ik.js');
let fails = 0;
function ok(name, got, exp, tol) {
  tol = tol || 1e-9;
  const pass = Math.abs(got - exp) <= tol;
  if (!pass) fails++;
  console.log((pass ? 'OK   ' : 'FALLA') + ' ' + name + ': ' + got.toFixed(9) + ' (esperat ' + exp.toFixed(9) + ')');
}

// Casos a ma: L1=L2=1
let s = ik(1, 1, 2, 0, 1);               // tot estirat a +X
ok('estirat th1', s.th1, 0); ok('estirat th2', s.th2, 0);
s = ik(1, 1, 0, 2, 1);                   // estirat cap amunt
ok('amunt th1', s.th1, Math.PI / 2);
s = ik(1, 1, 1, 1, 1);                   // cas classic: th2 = +90 deg, th1 = 0
ok('(1,1) elbow+ th1', s.th1, 0); ok('(1,1) elbow+ th2', s.th2, Math.PI / 2);
s = ik(1, 1, 1, 1, -1);                  // th2 = -90 deg, th1 = +90 deg
ok('(1,1) elbow- th1', s.th1, Math.PI / 2); ok('(1,1) elbow- th2', s.th2, -Math.PI / 2);

// Fora d'abast
ok('fora abast (3,0)', ik(1, 1, 3, 0, 1) === null ? 1 : 0, 1);
ok('dins forat (0,0) amb L1=1,L2=0.5', ik(1, 0.5, 0, 0, 1) === null ? 1 : 0, 1);
ok('rMin', workspace(1, 0.4).rMin, 0.6); ok('rMax', workspace(1, 0.4).rMax, 1.4);

// FK(IK(p)) = p en una malla de punts, per als dos colzes: error maxim
let maxPos = 0, maxOri = 0, n = 0;
for (const [L1, L2] of [[0.3, 0.25], [1, 1], [0.5, 0.2], [0.2, 0.5]]) {
  for (let x = -1; x <= 1; x += 0.05) for (let y = -1; y <= 1; y += 0.05) {
    for (const e of [1, -1]) {
      const sol = ik(L1, L2, x, y, e);
      if (!sol) continue;
      const p = fk(L1, L2, sol.th1, sol.th2);
      maxPos = Math.max(maxPos, Math.hypot(p.x - x, p.y - y));
      // orientacio: la FK ha de donar phi = th1+th2 (coherencia interna)
      maxOri = Math.max(maxOri, Math.abs(wrap(p.phi - (sol.th1 + sol.th2))));
      n++;
    }
  }
}
console.log('punts provats: ' + n);
ok('error maxim de posicio (m)', maxPos, 0, 1e-12);
ok('error maxim d\'orientacio (rad)', maxOri, 0, 1e-12);

console.log(fails === 0 ? '\nTOT CORRECTE' : '\nFALLADES: ' + fails);
process.exit(fails ? 1 : 0);
