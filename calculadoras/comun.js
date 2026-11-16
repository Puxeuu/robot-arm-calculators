// Codi comu de les calculadores: idioma (es/ca), formats i utilitats.
(function () {
  var C = { lang: 'es', T: {} };
  function $(id) { return document.getElementById(id); }
  C.$ = $;
  C.t = function (k) { return (C.T[C.lang] && C.T[C.lang][k]) || (C.T.es && C.T.es[k]) || k; };
  C.loc = function () { return C.lang === 'ca' ? 'ca-ES' : 'es-ES'; };
  C.eur = function (n) { return new Intl.NumberFormat(C.loc(), { style: 'currency', currency: 'EUR' }).format(n); };
  C.n = function (n, d) { d = d === undefined ? 2 : d; return new Intl.NumberFormat(C.loc(), { minimumFractionDigits: d, maximumFractionDigits: d }).format(n); };
  C.num = function (id, def) { var v = parseFloat($(id).value); return isFinite(v) ? v : def; };
  C.apply = function () {
    document.documentElement.lang = C.lang;
    document.querySelectorAll('[data-i]').forEach(function (e) { e.textContent = C.t(e.getAttribute('data-i')); });
    document.querySelectorAll('[data-h]').forEach(function (e) { e.innerHTML = C.t(e.getAttribute('data-h')); });
    $('lang').value = C.lang;
  };
  C.init = function (T, redraw) {
    C.T = T;
    var l; try { l = localStorage.getItem('lang'); } catch (e) {}
    l = l || (navigator.language || 'es').slice(0, 2);
    C.lang = (l === 'ca') ? 'ca' : 'es';
    $('lang').onchange = function () { C.lang = this.value; try { localStorage.setItem('lang', C.lang); } catch (e) {} C.apply(); redraw(); };
    document.addEventListener('input', redraw);
    C.apply(); redraw();
  };
  window.Comun = C;
})();
