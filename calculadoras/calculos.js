// Calculs de les calculadores (Espanya). Funcions pures, sense DOM, per poder-les provar amb node.
(function (root) {
  'use strict';

  // ---------- Hipoteca / prestec (sistema frances, quota constant) ----------
  // capital (EUR), tinAnual (%), anys. Retorna quota, totals i quadre anual.
  function hipoteca(capital, tinAnual, anys) {
    var n = Math.min(1200, Math.max(1, Math.round(anys * 12))), r = tinAnual / 100 / 12; // maxim 100 anys
    var cuota = r === 0 ? capital / n : capital * r / (1 - Math.pow(1 + r, -n));
    var saldo = capital, totInt = 0, years = [], yi = 0, yp = 0;
    for (var m = 1; m <= n; m++) {
      var i = saldo * r, p = cuota - i;
      saldo -= p; totInt += i; yi += i; yp += p;
      if (m % 12 === 0 || m === n) {
        years.push({ year: Math.ceil(m / 12), interes: yi, capital: yp, pendiente: Math.max(0, saldo) });
        yi = 0; yp = 0;
      }
    }
    return { cuota: cuota, meses: n, intereses: totInt, total: cuota * n, years: years };
  }

  // ---------- IVA ----------
  function ivaDesdeBase(base, tipo) { var iva = base * tipo / 100; return { base: base, iva: iva, total: base + iva }; }
  function ivaDesdeTotal(total, tipo) { var base = total / (1 + tipo / 100); return { base: base, iva: total - base, total: total }; }

  // ---------- Porcentajes ----------
  var pct = {
    deY: function (x, y) { return y * x / 100; },            // x% de y
    queporcentaje: function (x, y) { return x / y * 100; },  // x es que % de y
    variacion: function (a, b) { return (b - a) / a * 100; },// % de cambio de a a b
    aumentar: function (y, x) { return y * (1 + x / 100); }, // y + x%
    disminuir: function (y, x) { return y * (1 - x / 100); },// y - x%
    total: function (x, p) { return x / (p / 100); }         // x es el p% de que numero
  };

  // ---------- Interes compuesto con aportacion mensual ----------
  // inicial (EUR), aportMensual (EUR), tasaAnual (%, nominal, capitalizacion mensual), anys
  function interesCompuesto(inicial, aportMensual, tasaAnual, anys) {
    var r = tasaAnual / 100 / 12, n = Math.min(1200, Math.max(1, Math.round(anys * 12))); // maxim 100 anys
    var saldo = inicial, aportado = inicial, years = [];
    for (var m = 1; m <= n; m++) {
      saldo = saldo * (1 + r) + aportMensual;
      aportado += aportMensual;
      if (m % 12 === 0 || m === n) years.push({ year: Math.ceil(m / 12), aportado: aportado, saldo: saldo });
    }
    return { final: saldo, aportado: aportado, intereses: saldo - aportado, years: years };
  }

  // ---------- Indemnizacion por despido (Espana) ----------
  // Una mensualidad = 30 dias de salario (24 mensualidades = 720 dias).
  // Improcedente (art. 56 ET + DT 11a RDL 3/2012): 45 dias/ano hasta el 11-02-2012 y 33 dias/ano desde el 12-02-2012.
  //   Tope 720 dias; si la parte anterior supera 720 dias, se aplica solo esa (tope 1260 dias = 42 mensualidades).
  // Objetivo (art. 53.1.b ET): 20 dias/ano, tope 360 dias (12 mensualidades).
  // Antiguedad prorrateada por dias / 365 (aproximacion; en la practica se prorratea por meses).
  var CORTE = Date.UTC(2012, 1, 12); // 12-02-2012
  function diasEntre(a, b) { return Math.max(0, Math.round((b - a) / 86400000)); }

  function despido(inicio, fin, salarioAnual, tipo) {
    // inicio, fin: Date.UTC(...) en ms
    var diario = salarioAnual / 365;
    var totalDias = diasEntre(inicio, fin);
    var out = { salarioDiario: diario, antiguedadDias: totalDias, antiguedadAnys: totalDias / 365, tipo: tipo };
    var dias;
    if (tipo === 'objetivo') {
      dias = Math.min(20 * totalDias / 365, 360);
      out.topeAplicado = 20 * totalDias / 365 > 360;
    } else {
      var diasPre = diasEntre(inicio, Math.min(fin, CORTE));
      var diasPost = totalDias - diasPre;
      var parte45 = 45 * diasPre / 365, parte33 = 33 * diasPost / 365;
      out.diasPre = diasPre; out.diasPost = diasPost; out.parte45 = parte45; out.parte33 = parte33;
      if (parte45 > 720) { dias = Math.min(parte45, 1260); out.topeAplicado = parte45 > 1260; out.soloPre = true; }
      else { dias = parte45 + parte33; out.topeAplicado = dias > 720; dias = Math.min(dias, 720); }
    }
    out.diasIndemnizacion = dias;
    out.indemnizacion = dias * diario;
    return out;
  }


  // ---------- IMC (OMS, adults) ----------
  function imc(kg, cm) {
    var m = cm / 100, v = kg / (m * m);
    var cat = v < 18.5 ? 'bajo' : v < 25 ? 'normal' : v < 30 ? 'sobre' : v < 35 ? 'ob1' : v < 40 ? 'ob2' : 'ob3';
    return { imc: v, cat: cat, pesoMin: 18.5 * m * m, pesoMax: 24.9 * m * m };
  }

  // ---------- Calories: equacio de Mifflin-St Jeor ----------
  // sexo: 'h' (home) o 'm' (dona); kg, cm, edat en anys; factor = factor d'activitat
  function calorias(sexo, kg, cm, edad, factor) {
    var bmr = 10 * kg + 6.25 * cm - 5 * edad + (sexo === 'h' ? 5 : -161);
    var mant = bmr * factor;
    return { bmr: bmr, mantenimiento: mant, deficit: mant * 0.85, superavit: mant * 1.10 };
  }

  // ---------- Dates ----------
  var DAY = 86400000;
  function addMonthsClamp(ms, n) {
    var d = new Date(ms), y = d.getUTCFullYear(), mo = d.getUTCMonth() + n, day = d.getUTCDate();
    var ny = y + Math.floor(mo / 12), nm = ((mo % 12) + 12) % 12;
    var last = new Date(Date.UTC(ny, nm + 1, 0)).getUTCDate();
    return Date.UTC(ny, nm, Math.min(day, last));
  }
  // Diferencia en anys, mesos i dies entre a <= b (ms UTC).
  function difYMD(a, b) {
    var A = new Date(a), B = new Date(b);
    var total = (B.getUTCFullYear() - A.getUTCFullYear()) * 12 + (B.getUTCMonth() - A.getUTCMonth());
    var cand = addMonthsClamp(a, total);
    if (cand > b) { total--; cand = addMonthsClamp(a, total); }
    return { y: Math.floor(total / 12), m: total % 12, d: Math.round((b - cand) / DAY), mesesTotales: total };
  }
  function diasEntreFechas(a, b) { return Math.round((b - a) / DAY); }
  // Dies fins al proper aniversari (ref dins l'any o seguent).
  function proximoCumple(nac, ref) {
    var N = new Date(nac), R = new Date(ref), y = R.getUTCFullYear();
    function cumple(yy) { var last = new Date(Date.UTC(yy, N.getUTCMonth() + 1, 0)).getUTCDate(); return Date.UTC(yy, N.getUTCMonth(), Math.min(N.getUTCDate(), last)); }
    var c = cumple(y);
    if (c < ref) c = cumple(y + 1);
    return Math.round((c - ref) / DAY);
  }

  // ---------- Prestec personal amb comissio d'obertura i TAE aproximada ----------
  // TAE: tipus anual equivalent amb els fluxos: rep (P - comissio) i paga la quota mensual.
  // No inclou assegurances ni altres despeses.
  function prestamo(P, tin, meses, comPct) {
    meses = Math.min(1200, Math.max(1, Math.round(meses)));
    var h = hipoteca(P, tin, meses / 12), com = P * comPct / 100, neto = P - com, n = meses;
    var lo = 1e-9, hi = 1;
    function f(i) { return h.cuota * (1 - Math.pow(1 + i, -n)) / i - neto; }
    var tae = 0;
    if (f(lo) > 0) {
      for (var k = 0; k < 200; k++) { var mid = (lo + hi) / 2; if (f(mid) > 0) lo = mid; else hi = mid; }
      tae = Math.pow(1 + (lo + hi) / 2, 12) - 1;
    }
    return { cuota: h.cuota, intereses: h.intereses, comision: com, costeTotal: h.intereses + com, totalPagado: h.total + com, tae: tae * 100 };
  }

  // ---------- Descomptes ----------
  var dto = {
    precioFinal: function (p, d) { return p * (1 - d / 100); },
    entrePrecios: function (orig, fin) { return (1 - fin / orig) * 100; },
    acumulado: function (d1, d2) { return (1 - (1 - d1 / 100) * (1 - d2 / 100)) * 100; }
  };


  // ---------- Dates: sumar/restar, dies laborables, dia de la setmana ----------
  // sign = +1 (sumar) o -1 (restar). Primer anys i mesos (amb clamp de final de mes), despres dies.
  function sumarARestar(ms, anys, mesos, dies, sign) {
    var r = addMonthsClamp(ms, sign * (anys * 12 + mesos));
    return r + sign * dies * DAY;
  }
  function diaSemana(ms) { return new Date(ms).getUTCDay(); } // 0 = diumenge ... 6 = dissabte
  // Dies de dilluns a divendres entre a i b, tots dos inclosos. No coneix festius.
  function diasLaborables(a, b) {
    if (b < a) return 0;
    var total = Math.round((b - a) / DAY) + 1, n = 0, d0 = new Date(a).getUTCDay();
    var full = Math.floor(total / 7); n = full * 5;
    for (var i = 0; i < total % 7; i++) { var wd = (d0 + i) % 7; if (wd !== 0 && wd !== 6) n++; }
    return n;
  }
  function diaDelAnyo(ms) { return Math.floor((ms - Date.UTC(new Date(ms).getUTCFullYear(), 0, 1)) / DAY) + 1; }
  function semanaISO(ms) {
    var day = (new Date(ms).getUTCDay() + 6) % 7, th = ms + (3 - day) * DAY;
    var jan1 = Date.UTC(new Date(th).getUTCFullYear(), 0, 1);
    return Math.floor((th - jan1) / DAY / 7) + 1;
  }
  function esBisiesto(y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }

  var api = { sumarARestar: sumarARestar, diaSemana: diaSemana, diasLaborables: diasLaborables, diaDelAnyo: diaDelAnyo, semanaISO: semanaISO, esBisiesto: esBisiesto, imc: imc, calorias: calorias, difYMD: difYMD, diasEntreFechas: diasEntreFechas, proximoCumple: proximoCumple, prestamo: prestamo, dto: dto, addMonthsClamp: addMonthsClamp, hipoteca: hipoteca, ivaDesdeBase: ivaDesdeBase, ivaDesdeTotal: ivaDesdeTotal, pct: pct, interesCompuesto: interesCompuesto, despido: despido };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Calc = api;
})(typeof window !== 'undefined' ? window : this);
