// Calcul de parell estatic d'un braç robotic pla (nomes gravetat + flotabilitat).
// Unitats SI: m, kg, rad, N, N*m. La UI converteix des de mm, g i graus.
// Conveni: pla XY, X horitzontal, Y amunt, eix Z cap a l'observador (regla de la ma dreta).
// L'angle de cada tram es ABSOLUT, respecte a l'horitzontal (+X), positiu en sentit antihorari.
// Parell de subjeccio positiu = el motor ha de fer parell antihorari per mantenir la posicio.
// Hipotesi: el centre de massa de cada tram es a cmFrac*L des de l'articulacio (0.5 = al mig).
// Flotabilitat: empenta = rhoMedi * V * g, amb V = massa / densitat del cos (cos massis equivalent).
(function (root) {
  'use strict';

  var G = 9.80665;

  // Pes net (N) = pes - empenta. rhoBody <= 0 => sense flotabilitat.
  function netWeight(m, rhoBody, rhoMed, g) {
    var buoy = rhoBody > 0 ? rhoMed * (m / rhoBody) : 0;
    return (m - buoy) * g;
  }

  // arm = { links:[{L,m,rho,theta,cmFrac}], payload:{m,rho}, rhoMed, g, sf }
  function computeArm(arm) {
    var g = arm.g || G;
    var n = arm.links.length;
    var pts = [{ x: 0, y: 0 }];
    var cms = [];
    var w = [];
    for (var i = 0; i < n; i++) {
      var l = arm.links[i];
      var c = Math.cos(l.theta), s = Math.sin(l.theta);
      var p = pts[i];
      cms.push({ x: p.x + l.cmFrac * l.L * c, y: p.y + l.cmFrac * l.L * s });
      pts.push({ x: p.x + l.L * c, y: p.y + l.L * s });
      w.push(netWeight(l.m, l.rho, arm.rhoMed, g));
    }
    var tip = pts[n];
    var wPay = netWeight(arm.payload.m, arm.payload.rho, arm.rhoMed, g);
    var joints = [];
    for (var j = 0; j < n; j++) {
      var xj = pts[j].x;
      var t = 0;
      for (var k = j; k < n; k++) t += w[k] * (cms[k].x - xj);
      t += wPay * (tip.x - xj);
      joints.push({
        torque: t,                       // parell de subjeccio amb signe (N*m)
        abs: Math.abs(t),
        withSF: Math.abs(t) * (arm.sf || 1)
      });
    }
    return { joints: joints, pts: pts, cms: cms, tip: tip, netWeights: w, netPayload: wPay };
  }

  // Cas pitjor: tots els trams estirats en horitzontal (angle 0).
  function worstCase(arm) {
    var a = JSON.parse(JSON.stringify(arm));
    a.links.forEach(function (l) { l.theta = 0; });
    return computeArm(a);
  }

  var api = { G: G, netWeight: netWeight, computeArm: computeArm, worstCase: worstCase };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TorqueCalc = api;
})(typeof window !== 'undefined' ? window : this);
