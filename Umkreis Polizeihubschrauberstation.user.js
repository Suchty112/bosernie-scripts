// ==UserScript==
// @name        * Umkreis: Polizeihubschrauberstation
// @namespace   bos-ernie.leitstellenspiel.de
// @version     1.0.0
// @license     BSD-3-Clause
// @author      BOS-Ernie
// @description Zeichnet den Umkreis um jede Polizeihubschrauberstation
// @match       https://www.leitstellenspiel.de/
// @match       https://polizei.leitstellenspiel.de/
// @icon        https://www.google.com/s2/favicons?sz=64&domain=leitstellenspiel.de
// @run-at      document-idle
// @grant       none
// ==/UserScript==
 
(function () {
  async function getBuildings() {
    if (
      !sessionStorage.aBuildings ||
      JSON.parse(sessionStorage.aBuildings).lastUpdate < new Date().getTime() - 5 * 1000 * 60
    ) {
      const buildings = await fetch("/api/buildings.json").then(response => response.json());
 
      try {
        sessionStorage.setItem("aBuildings", JSON.stringify({ lastUpdate: new Date().getTime(), value: buildings }));
      } catch (e) {
        return buildings;
      }
    }
    return JSON.parse(sessionStorage.aBuildings).value;
  }
 
  async function init() {
    if (typeof map === "undefined") {
      return;
    }
 
    const buildings = await getBuildings().then(buildings =>
      buildings.filter(building => building.building_type === 13),
    );
 
 
    buildings.map(controlCenter => {
      L.circle([controlCenter.latitude, controlCenter.longitude], {
        weight: 2,
        radius: 25000,
      }).addTo(map);
    });
  }
 
  init();
})();