// Proves contra valors fets a ma. Executa: node test.js
const { output, operatingPoint, requiredRatio, RPM } = require('./gear.js');
let fails = 0;
function ok(name, got, exp, tol) {
  tol = tol || 1e-9;
  const pass = Math.abs(got - exp) <= tol;
  if (!pass) fails++;
  console.log((pass ? 'OK   ' : 'FALLA') + ' ' + name + ': ' + got.toFixed(6) + ' (esperat ' + exp.toFixed(6) + ')');
}
// 0.1 N*m a 3000 rpm, reductor 50:1, rendiment 0.8 -> 4 N*m a 60 rpm
let o = output(0.1, 3000, 50, 0.8);
ok('parell sortida', o.T, 4); ok('velocitat sortida', o.n, 60);
// Potencia d'entrada: 0.1 * 3000 * 2pi/60 = 31.4159 W
ok('potencia entrada', o.Pin, 0.1 * 3000 * 2 * Math.PI / 60);
// Potencia de sortida = Pin * eff (a ma: 4 * 60 * 2pi/60 = 25.1327 = 31.4159 * 0.8)
ok('potencia sortida = Pin*eff', o.Pout, o.Pin * 0.8);
// Punt de funcionament: Ts=0.5, n0=6000, i=50, eff=0.8, Tl=10 -> Tm=0.25 (meitat del calat) -> nm=3000, n_out=60
let p = operatingPoint(0.5, 6000, 50, 0.8, 10);
ok('Tm', p.Tm, 0.25); ok('nm', p.nm, 3000); ok('n sortida', p.n, 60);
ok('potencia sortida punt', p.Pout, 10 * 60 * RPM);
// Carrega superior al calat de sortida (0.5*50*0.8 = 20): no pot
ok('carrega massa gran', operatingPoint(0.5, 6000, 50, 0.8, 21) === null ? 1 : 0, 1);
ok('just al calat', operatingPoint(0.5, 6000, 50, 0.8, 20).n, 0, 1e-9);
// Relacio necessaria: 10 N*m, motor continu 0.1, eff 0.8, sf 2 -> 10*2/(0.1*0.8) = 250
ok('relacio necessaria', requiredRatio(10, 0.1, 0.8, 2), 250);
console.log(fails === 0 ? '\nTOT CORRECTE' : '\nFALLADES: ' + fails);
process.exit(fails ? 1 : 0);
