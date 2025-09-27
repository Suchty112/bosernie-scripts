// ==UserScript==
// @name        * Einsatz - Fahrzeugtyp
// @namespace   bos-ernie.leitstellenspiel.de
// @version     1.0.2
// @license     BSD-3-Clause
// @author      BOS-Ernie
// @description Entfernt den vom Benutzer vergebenen Fahrzeugnamen und zeigt stattdessen nur den Typ bei der auf Anfahrt und am Einsatz befindlichen Fahrzeuge an.
// @match       https://www.leitstellenspiel.de/missions/*
// @match       https://polizei.leitstellenspiel.de/missions/*
// @icon        https://www.google.com/s2/favicons?sz=64&domain=leitstellenspiel.de
// @run-at      document-idle
// @grant       none
// @resource    https://forum.leitstellenspiel.de/index.php?thread/24725-script-einsatz-fahrzeugtyp-by-bos-ernie/
// ==/UserScript==
 
(async function () {
  function removeCustomVehicleNamesInTable(tableId) {
    const table = document.querySelector("#" + tableId);
 
    if (!table) {
      return;
    }
 
    const rows = Array.from(table.querySelectorAll("tbody tr"));
 
    rows.forEach(row => {
      if (!row.id.startsWith("vehicle_row_")) {
        return;
      }
 
      row.querySelector("td:nth-child(2) a").innerText = row
        .querySelector("td:nth-child(2) small")
        .innerText.replace("(", "")
        .replace(")", "");
 
      row.querySelector("td:nth-child(2) small").remove();
    });
  }
 
  function main() {
    removeCustomVehicleNamesInTable("mission_vehicle_driving");
    removeCustomVehicleNamesInTable("mission_vehicle_at_mission");
  }
 
  main();
})();