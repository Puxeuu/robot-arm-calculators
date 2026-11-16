// Proves contra valors fets a ma / coneguts. Executa: node test.js
const C = require('./calculos.js');
let fails = 0;
function ok(name, got, exp, tol) {
  tol = tol === undefined ? 1e-6 : tol;
  const pass = Math.abs(got - exp) <= tol;
  if (!pass) fails++;
  console.log((pass ? 'OK   ' : 'FALLA') + ' ' + name + ': ' + got.toFixed(4) + ' (esperat ' + exp.toFixed(4) + ')');
}
const U = (y, m, d) => Date.UTC(y, m - 1, d);

// Hipoteca: 100.000 EUR, 3 %, 20 anys -> quota coneguda 554,60 EUR
let h = C.hipoteca(100000, 3, 20);
ok('hipoteca quota', h.cuota, 554.60, 0.01);
ok('hipoteca capital amortitzat = capital', h.years.reduce((s, y) => s + y.capital, 0), 100000, 1e-6);
ok('hipoteca saldo final 0', h.years[h.years.length - 1].pendiente, 0, 1e-6);
ok('hipoteca total = interessos + capital', h.total, h.intereses + 100000, 1e-6);
ok('hipoteca 0 % -> quota = capital/mesos', C.hipoteca(12000, 0, 1).cuota, 1000);

// IVA
ok('IVA base 100 al 21 -> 121', C.ivaDesdeBase(100, 21).total, 121);
ok('IVA total 121 al 21 -> base 100', C.ivaDesdeTotal(121, 21).base, 100);
ok('IVA total 110 al 10 -> IVA 10', C.ivaDesdeTotal(110, 10).iva, 10);

// Percentatges
ok('20 % de 150', C.pct.deY(20, 150), 30);
ok('30 es el 20 % de 150', C.pct.queporcentaje(30, 150), 20);
ok('de 80 a 100 = +25 %', C.pct.variacion(80, 100), 25);
ok('100 + 21 %', C.pct.aumentar(100, 21), 121);
ok('100 - 10 %', C.pct.disminuir(100, 10), 90);
ok('30 es el 20 % de 150 (total)', C.pct.total(30, 20), 150);

// Interes compost: 1000 al 12 % anual, capitalitzacio mensual, 1 any = 1000*1.01^12
ok('interes compost 1 any', C.interesCompuesto(1000, 0, 12, 1).final, 1000 * Math.pow(1.01, 12));
// Aportacio mensual: 100/mes al 0 % durant 10 anys = 12000
ok('aportacions sense interes', C.interesCompuesto(0, 100, 0, 10).final, 12000);
// Formula tancada: 100/mes, 6 % anual, 10 anys: FV = a*((1+r)^n-1)/r (aportacio a final de mes)
const r = 0.06 / 12, n = 120;
ok('aportacions formula tancada', C.interesCompuesto(0, 100, 6, 10).final, 100 * (Math.pow(1 + r, n) - 1) / r, 1e-6);

// Acomiadament improcedent: 365 dies, salari anual 36.500 -> 100 EUR/dia -> 33 dies = 3.300
let d = C.despido(U(2017, 3, 1), U(2018, 3, 1), 36500, 'improcedente');
ok('improcedent 1 any (33 dies)', d.indemnizacion, 3300);
ok('objectiu 1 any (20 dies)', C.despido(U(2017, 3, 1), U(2018, 3, 1), 36500, 'objetivo').indemnizacion, 2000);
// Tram mixt: 2011-02-12 -> 2013-02-12: 365 dies a 45 + 366 dies a 33
d = C.despido(U(2011, 2, 12), U(2013, 2, 12), 36500, 'improcedente');
ok('mixt: dies pre', d.diasPre, 365, 0); ok('mixt: dies post', d.diasPost, 366, 0);
ok('mixt: indemnitzacio', d.indemnizacion, 4500 + 3300 * 366 / 365);
// Topall 720 dies: 40 anys nomes posteriors -> 33*40 > 720
d = C.despido(U(2012, 3, 1), U(2052, 3, 1), 36500, 'improcedente');
ok('topall 24 mensualitats (720 dies)', d.indemnizacion, 72000, 1e-6);
// Part anterior > 720 dies: nomes es aplica la part de 45 dies (sense sumar la de 33)
d = C.despido(U(1985, 1, 1), U(2020, 1, 1), 36500, 'improcedente');
ok('part anterior > 720: nomes pre', d.indemnizacion, d.parte45 * 100 / 1, 1e-6);
ok('part anterior > 720: marcat soloPre', d.soloPre ? 1 : 0, 1);
// Topall 42 mensualitats (1260 dies)
d = C.despido(U(1960, 1, 1), U(2020, 1, 1), 36500, 'improcedente');
ok('topall 1260 dies', d.indemnizacion, 126000, 1e-6);
// Objectiu: topall 360 dies
ok('objectiu topall 12 mensualitats', C.despido(U(1990, 1, 1), U(2020, 1, 1), 36500, 'objetivo').indemnizacion, 36000, 1e-6);
// Dates invertides no donen negatiu
ok('dates invertides = 0', C.despido(U(2020, 1, 1), U(2019, 1, 1), 36500, 'improcedente').indemnizacion, 0);

console.log(fails === 0 ? '\nTOT CORRECTE' : '\nFALLADES: ' + fails);
process.exit(fails ? 1 : 0);
