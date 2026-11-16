// Calculs de les calculadores (Espanya). Funcions pures, sense DOM, per poder-les provar amb node.
(function (root) {
  'use strict';

  // ---------- Hipoteca / prestec (sistema frances, quota constant) ----------
  // capital (EUR), tinAnual (%), anys. Retorna quota, totals i quadre anual.
  function hipoteca(capital, tinAnual, anys) {
    var n = Math.round(anys * 12), r = tinAnual / 100 / 12;
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
    var r = tasaAnual / 100 / 12, n = Math.round(anys * 12);
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

  var api = { hipoteca: hipoteca, ivaDesdeBase: ivaDesdeBase, ivaDesdeTotal: ivaDesdeTotal, pct: pct, interesCompuesto: interesCompuesto, despido: despido };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Calc = api;
})(typeof window !== 'undefined' ? window : this);
