// Motor DC + reductor. Unitats SI: N*m, rad/s, W. La UI usa rpm per a la velocitat.
// Model simple: recta parell-velocitat del motor (parell de calat Ts, velocitat en buit n0).
// Reductor de relacio i (>1 redueix) amb rendiment eff, aplicat nomes al parell:
//   T_sortida = T_motor * i * eff ;  n_sortida = n_motor / i
// No inclou fregament de l'eix, inercies ni limits termics (parell continu del motor).
(function (root) {
  'use strict';
  var RPM = 2 * Math.PI / 60; // rpm -> rad/s

  // Sortida del reductor per a un punt (T motor, n motor).
  function output(Tm, nm, ratio, eff) {
    var To = Tm * ratio * eff, no = nm / ratio;
    return { T: To, n: no, Pin: Tm * nm * RPM, Pout: To * no * RPM };
  }

  // Punt de funcionament amb una carrega de parell Tl a la sortida.
  // Retorna null si el motor no pot (Tl > parell de calat a la sortida).
  function operatingPoint(Ts, n0, ratio, eff, Tl) {
    var Tm = Tl / (ratio * eff);
    if (Tm > Ts) return null;
    var nm = n0 * (1 - Tm / Ts);
    var o = output(Tm, nm, ratio, eff);
    o.Tm = Tm; o.nm = nm;
    return o;
  }

  // Relacio minima perque el parell continu del motor aguanti Tl amb factor de seguretat sf.
  function requiredRatio(Tl, Tcont, eff, sf) { return Tl * sf / (Tcont * eff); }

  var api = { RPM: RPM, output: output, operatingPoint: operatingPoint, requiredRatio: requiredRatio };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Gear = api;
})(typeof window !== 'undefined' ? window : this);
