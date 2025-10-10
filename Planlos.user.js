// ==UserScript==
// @name        * Planlos
// @namespace   bos-ernie.leitstellenspiel.de
// @version     1.1.0
// @license     BSD-3-Clause
// @author      BOS-Ernie
// @description Blendet die Karte aus Performancegründen direkt aus
// @match       https://www.leitstellenspiel.de/
// @match       https://polizei.leitstellenspiel.de/
// @icon        https://www.google.com/s2/favicons?sz=64&domain=leitstellenspiel.de
// @run-at      document-idle
// @grant       none
// ==/UserScript==
 
/** global mapExpand */
 
(function () {
  mapExpand = function (e) {
    document.getElementById("map").style.display = "none";
  };
 
  mapExpand();
})();