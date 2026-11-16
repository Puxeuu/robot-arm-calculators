// Proves del calcul contra valors fets a ma. Executa: node test.js
const { computeArm, worstCase, netWeight, G } = require('./calc.js');
let fails = 0;
function ok(name, got, exp, tol) {
  tol = tol || 1e-6;
  const pass = Math.abs(got - exp) <= tol;
  if (!pass) fails++;
  console.log((pass ? 'OK   ' : 'FALLA') + ' ' + name + ': ' + got.toFixed(6) + ' (esperat ' + exp.toFixed(6) + ')');
}
const base = (o) => Object.assign({ rhoMed: 1.2, g: G, sf: 1, payload: { m: 0, rho: 0 } }, o);

// 1) Un tram de 1 m, 1 kg, horitzontal, sense flotabilitat: T = m*g*0.5
let r = computeArm(base({ rhoMed: 0, links: [{ L: 1, m: 1, rho: 0, theta: 0, cmFrac: 0.5 }] }));
ok('1 tram horitzontal', r.joints[0].torque, 1 * G * 0.5);

// 2) Mateix tram amb carrega d'1 kg a la punta: T = 0.5*m*g + 1*g*1
r = computeArm(base({ rhoMed: 0, payload: { m: 1, rho: 0 }, links: [{ L: 1, m: 1, rho: 0, theta: 0, cmFrac: 0.5 }] }));
ok('tram + carrega', r.joints[0].torque, G * 1.5);

// 3) Tram vertical (90 graus): parell zero
r = computeArm(base({ rhoMed: 0, links: [{ L: 1, m: 1, rho: 0, theta: Math.PI / 2, cmFrac: 0.5 }] }));
ok('tram vertical', r.joints[0].torque, 0, 1e-9);

// 4) A 30 graus: T = m*g*0.5*cos(30)
r = computeArm(base({ rhoMed: 0, links: [{ L: 1, m: 1, rho: 0, theta: Math.PI / 6, cmFrac: 0.5 }] }));
ok('tram a 30 graus', r.joints[0].torque, G * 0.5 * Math.cos(Math.PI / 6));

// 5) Aigua dolca, alumini (2700): pes net = (1 - 1000/2700)*g
ok('pes net alumini en aigua', netWeight(1, 2700, 1000, G), (1 - 1000 / 2700) * G);
r = computeArm(base({ rhoMed: 1000, links: [{ L: 1, m: 1, rho: 2700, theta: 0, cmFrac: 0.5 }] }));
ok('1 tram en aigua', r.joints[0].torque, (1 - 1000 / 2700) * G * 0.5);

// 6) Objecte mes lleuger que l'aigua (flota): parell negatiu
r = computeArm(base({ rhoMed: 1000, links: [{ L: 1, m: 1, rho: 500, theta: 0, cmFrac: 0.5 }] }));
ok('tram que flota (signe)', r.joints[0].torque < 0 ? 1 : 0, 1);

// 7) Dos trams horitzontals iguals (1 m, 1 kg): J0 = g*(0.5 + 1.5) = 2g ; J1 = 0.5g
r = computeArm(base({ rhoMed: 0, links: [
  { L: 1, m: 1, rho: 0, theta: 0, cmFrac: 0.5 },
  { L: 1, m: 1, rho: 0, theta: 0, cmFrac: 0.5 }] }));
ok('2 trams J0', r.joints[0].torque, 2 * G);
ok('2 trams J1', r.joints[1].torque, 0.5 * G);

// 8) Cas pitjor ignora els angles
r = worstCase(base({ rhoMed: 0, links: [{ L: 1, m: 1, rho: 0, theta: 1.2, cmFrac: 0.5 }] }));
ok('cas pitjor', r.joints[0].torque, G * 0.5);

// 9) Factor de seguretat
r = computeArm(base({ rhoMed: 0, sf: 2, links: [{ L: 1, m: 1, rho: 0, theta: 0, cmFrac: 0.5 }] }));
ok('factor seguretat', r.joints[0].withSF, 2 * G * 0.5);

console.log(fails === 0 ? '\nTOT CORRECTE' : '\nFALLADES: ' + fails);
process.exit(fails ? 1 : 0);
