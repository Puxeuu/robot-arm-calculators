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

// ---- Lot 2 ----
const U2 = (y, m, d) => Date.UTC(y, m - 1, d);
ok('IMC 70 kg 175 cm', C.imc(70, 175).imc, 70 / (1.75 * 1.75), 1e-9);
ok('IMC categoria normal', C.imc(70, 175).cat === 'normal' ? 1 : 0, 1);
ok('IMC 18.4 = bajo', C.imc(18.4 * 4, 200).cat === 'bajo' ? 1 : 0, 1);
ok('IMC 25 = sobre', C.imc(25 * 4, 200).cat === 'sobre' ? 1 : 0, 1);
ok('IMC 30 = ob1', C.imc(30 * 4, 200).cat === 'ob1' ? 1 : 0, 1);
ok('IMC 40 = ob3', C.imc(40 * 4, 200).cat === 'ob3' ? 1 : 0, 1);
ok('pes max normal 175 cm', C.imc(70, 175).pesoMax, 24.9 * 1.75 * 1.75, 1e-9);
ok('Mifflin home 80/180/30', C.calorias('h', 80, 180, 30, 1).bmr, 1780);
ok('Mifflin dona 60/165/25', C.calorias('m', 60, 165, 25, 1).bmr, 1345.25);
ok('mantenimiento = bmr*1.55', C.calorias('h', 80, 180, 30, 1.55).mantenimiento, 1780 * 1.55);
ok('deficit 15 %', C.calorias('h', 80, 180, 30, 1.2).deficit, 1780 * 1.2 * 0.85);
ok('dies 2024 any de traspas (1-1 a 31-12)', C.diasEntreFechas(U2(2024, 1, 1), U2(2024, 12, 31)), 365, 0);
ok('dies 2023 (1-1 a 31-12)', C.diasEntreFechas(U2(2023, 1, 1), U2(2023, 12, 31)), 364, 0);
let y = C.difYMD(U2(2000, 5, 20), U2(2026, 11, 16));
ok('edat anys', y.y, 26, 0); ok('edat mesos', y.m, 5, 0); ok('edat dies', y.d, 27, 0);
y = C.difYMD(U2(2000, 1, 31), U2(2000, 3, 1));
ok('31-gen a 1-mar: 0a 1m 1d (m)', y.m, 1, 0); ok('31-gen a 1-mar (d)', y.d, 1, 0);
y = C.difYMD(U2(2000, 2, 29), U2(2001, 2, 28));
// Criteri: qui neix un 29-feb compleix anys el 28-feb als anys no de traspas
ok('29-feb a 28-feb seguent: 1 any (criteri 28-feb)', y.y, 1, 0);
ok('proper aniversari 20-mai des de 16-nov-2026', C.proximoCumple(U2(2000, 5, 20), U2(2026, 11, 16)), Math.round((U2(2027, 5, 20) - U2(2026, 11, 16)) / 86400000), 0);
ok('aniversari avui = 0 dies', C.proximoCumple(U2(2000, 11, 16), U2(2026, 11, 16)), 0, 0);
let pr = C.prestamo(10000, 6, 60, 0);
ok('TAE sense comissio = (1+TIN/12)^12-1', pr.tae, (Math.pow(1 + 0.06 / 12, 12) - 1) * 100, 1e-6);
ok('quota prestec 10000 6% 60 mesos', pr.cuota, 193.33, 0.01);
pr = C.prestamo(10000, 6, 60, 2);
ok('TAE amb comissio > TAE sense', pr.tae > 6.1678 ? 1 : 0, 1);
ok('cost total = interessos + comissio', pr.costeTotal, pr.intereses + 200, 1e-9);
ok('descompte 30 % de 80', C.dto.precioFinal(80, 30), 56);
ok('descompte entre 80 i 56', C.dto.entrePrecios(80, 56), 30);
ok('acumulat 20 % + 10 %', C.dto.acumulado(20, 10), 28);
ok('2x1 equival a 50 %', C.dto.entrePrecios(2, 1), 50);

// ---- Lot 3: dates ----
ok('dia setmana 16-11-2026 = dilluns', C.diaSemana(U2(2026, 11, 16)), 1, 0);
ok('dia setmana 1-1-2000 = dissabte', C.diaSemana(U2(2000, 1, 1)), 6, 0);
ok('31-1-2024 + 1 mes = 29-2-2024', C.sumarARestar(U2(2024, 1, 31), 0, 1, 0, 1), U2(2024, 2, 29), 0);
ok('29-2-2024 + 1 any = 28-2-2025', C.sumarARestar(U2(2024, 2, 29), 1, 0, 0, 1), U2(2025, 2, 28), 0);
ok('16-11-2026 + 10 dies', C.sumarARestar(U2(2026, 11, 16), 0, 0, 10, 1), U2(2026, 11, 26), 0);
ok('16-11-2026 - 16 dies', C.sumarARestar(U2(2026, 11, 16), 0, 0, 16, -1), U2(2026, 10, 31), 0);
ok('laborables dll-div', C.diasLaborables(U2(2026, 11, 16), U2(2026, 11, 20)), 5, 0);
ok('laborables dll-diumenge', C.diasLaborables(U2(2026, 11, 16), U2(2026, 11, 22)), 5, 0);
ok('laborables 16 a 30 nov', C.diasLaborables(U2(2026, 11, 16), U2(2026, 11, 30)), 11, 0);
ok('laborables un dilluns', C.diasLaborables(U2(2026, 11, 16), U2(2026, 11, 16)), 1, 0);
ok('laborables un dissabte', C.diasLaborables(U2(2026, 11, 21), U2(2026, 11, 21)), 0, 0);
ok('laborables invertit', C.diasLaborables(U2(2026, 11, 20), U2(2026, 11, 16)), 0, 0);
// laborables per forca bruta en tot 2026
let brute = 0; for (let d = U2(2026, 1, 1); d <= U2(2026, 12, 31); d += 86400000) { const w = new Date(d).getUTCDay(); if (w !== 0 && w !== 6) brute++; }
ok('laborables any 2026 (forca bruta)', C.diasLaborables(U2(2026, 1, 1), U2(2026, 12, 31)), brute, 0);
ok('dia de l\'any 16-11-2026', C.diaDelAnyo(U2(2026, 11, 16)), 320, 0);
ok('setmana ISO 16-11-2026', C.semanaISO(U2(2026, 11, 16)), 47, 0);
ok('setmana ISO 30-12-2024 = 1', C.semanaISO(U2(2024, 12, 30)), 1, 0);
ok('setmana ISO 1-1-2021 = 53', C.semanaISO(U2(2021, 1, 1)), 53, 0);
ok('bisiest 2000', C.esBisiesto(2000) ? 1 : 0, 1, 0); ok('bisiest 1900 no', C.esBisiesto(1900) ? 1 : 0, 0, 0); ok('bisiest 2024', C.esBisiesto(2024) ? 1 : 0, 1, 0);

console.log(fails === 0 ? '\nTOT CORRECTE' : '\nFALLADES: ' + fails);
process.exit(fails ? 1 : 0);
