// Cinematica d'un braç pla de 2 trams. Unitats SI al codi (m, rad); la UI converteix des de mm i graus.
// Conveni: pla XY, X horitzontal, Y amunt, Z cap a l'observador (regla de la ma dreta).
// th1 = angle del tram 1 respecte a +X (antihorari positiu).
// th2 = angle del tram 2 RESPECTE al tram 1 (antihorari positiu). Orientacio de la punta: phi = th1 + th2.
// elbow = +1 (colze cap avall, th2 > 0 en el conveni habitual) o -1 (colze cap amunt, th2 < 0).
(function (root) {
  'use strict';

  function fk(L1, L2, th1, th2) {
    return {
      x: L1 * Math.cos(th1) + L2 * Math.cos(th1 + th2),
      y: L1 * Math.sin(th1) + L2 * Math.sin(th1 + th2),
      phi: th1 + th2
    };
  }

  // Retorna null si el punt es fora de l'espai de treball.
  function ik(L1, L2, x, y, elbow) {
    var d2 = x * x + y * y;
    var c2 = (d2 - L1 * L1 - L2 * L2) / (2 * L1 * L2);
    if (c2 > 1 + 1e-12 || c2 < -1 - 1e-12) return null;
    c2 = Math.max(-1, Math.min(1, c2));
    var th2 = elbow * Math.acos(c2);
    var th1 = Math.atan2(y, x) - Math.atan2(L2 * Math.sin(th2), L1 + L2 * Math.cos(th2));
    return { th1: th1, th2: th2 };
  }

  // Envolta un angle a (-pi, pi].
  function wrap(a) {
    while (a > Math.PI) a -= 2 * Math.PI;
    while (a <= -Math.PI) a += 2 * Math.PI;
    return a;
  }

  // Espai de treball: corona entre |L1-L2| i L1+L2.
  function workspace(L1, L2) { return { rMin: Math.abs(L1 - L2), rMax: L1 + L2 }; }

  var api = { fk: fk, ik: ik, wrap: wrap, workspace: workspace };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.IK = api;
})(typeof window !== 'undefined' ? window : this);
