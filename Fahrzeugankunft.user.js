// ==UserScript==
// @name        * Fahrzeugankunft
// @namespace   bos-ernie.leitstellenspiel.de
// @version     1.0.0
// @license     BSD-3-Clause
// @author      BOS-Ernie
// @description Zeigt die Fahrzeugankunft zusätzlich für Fahrzeuge an, die noch nicht ausgerückt sind.
// @match       https://www.leitstellenspiel.de/missions/*
// @icon        https://www.google.com/s2/favicons?sz=64&domain=leitstellenspiel.de
// @run-at      document-idle
// @grant       none
// ==/UserScript==
 
/* global vehicleArrivalCountdown, formatTime */
 
(function () {
  /**
   * @param e {number} Fahrzeugankunft in Sekunden
   * @param t {number} Fahrzeug-ID
   * @param i {number} Fahrzeug-Ausrückzeit in Sekunden
   */
  vehicleArrivalCountdown = function (e, t, i) {
    if (e < 0) {
      document.getElementById("vehicle_drive_" + t).innerHTML =
        "Ankunft" +
        "... <a href='#' class='btn btn-xs btn-default' onclick='window.location.reload();'>" +
        "Neuladen" +
        "</a>";
    } else {
      if (i > 0) {
        document.getElementById("vehicle_drive_" + t).innerHTML =
          formatTime(e, !1) + " (rückt in " + formatTime(i, !1) + " aus)";
      } else {
        document.getElementById("vehicle_drive_" + t).innerHTML = formatTime(e, !1);
      }
      e -= 1;
      i -= 1;
      setTimeout(function () {
        vehicleArrivalCountdown(e, t, i);
      }, 1000);
    }
  };
})();