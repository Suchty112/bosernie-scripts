// ==UserScript==
// @name        * Fahrzeugbesatzungsrapport
// @namespace   bos-ernie.leitstellenspiel.de
// @version     1.1.0
// @license     BSD-3-Clause
// @author      BOS-Ernie
// @description Zeigt die Anzahl zugewiesener Personen pro Fahrzeug und die Anzahl der benötigten Personen an, um alle Fahrzeuge zu besetzen
// @match       https://www.leitstellenspiel.de/buildings/*
// @match       https://polizei.leitstellenspiel.de/buildings/*
// @icon        https://www.google.com/s2/favicons?sz=64&domain=leitstellenspiel.de
// @run-at      document-idle
// @grant       none
// @resource    https://forum.leitstellenspiel.de/index.php?thread/24772-script-fahrzeugbesatzungsrapport-by-bos-ernie/
// ==/UserScript==
 
(function () {
  const buildingTypeIdsWithoutPersonnel = [1, 3, 4, 7, 8, 10, 14, 16];
 
  function countVehicleCrew() {
    let vehicleCrewCount = 0;
    const vehicleTable = document.getElementById("vehicle_table");
    if (!vehicleTable) {
      return vehicleCrewCount;
    }
    const vehicleTableRows = vehicleTable.querySelectorAll("tr");
    vehicleTableRows.forEach(row => {
      const crewCount = parseInt(row.children[5].textContent);
      if (!isNaN(crewCount)) {
        vehicleCrewCount += crewCount;
      }
    });
 
    return vehicleCrewCount;
  }
 
  function getPersonalDlDtDd() {
    const dl = document.querySelector("dl");
    if (!dl) {
      return null;
    }
 
    const dtElements = dl.querySelectorAll("dt");
    for (const dtElement of dtElements) {
      if (dtElement.textContent.includes("Personal")) {
        return dtElement.nextElementSibling;
      }
    }
  }
 
  function setCrewInfo() {
    const dd = getPersonalDlDtDd();
 
    if (!dd) {
      console.error("[Fahrzeugbesatzungsrapport] Listenpunkt für Personal nicht gefunden");
      return;
    }
 
    const btnGroup = dd.querySelector(".btn-group");
    let personnelInfo = dd.textContent;
    if (btnGroup) {
      personnelInfo = personnelInfo.replace(btnGroup.textContent, "");
    }
 
    personnelInfo = personnelInfo.replace(/\s+/g, " ").trim();
    let personnelInfoElements = personnelInfo.split(",");
    personnelInfoElements = personnelInfoElements.map(element => element.trim());
 
    const numberOfCurrentCrew = parseInt(personnelInfoElements[0].match(/\d+/)[0]);
    const numberOfVehicleCrew = countVehicleCrew();
    const numberOfTargetCrew = parseInt(personnelInfoElements[1].match(/\d+/)[0]);
 
    let currentCrewLabel = document.createElement("span");
    currentCrewLabel.title = "Anzahl aktuell Angestellter / Ziel";
    currentCrewLabel.textContent = `${numberOfCurrentCrew} / ${numberOfTargetCrew}`;
    currentCrewLabel.style.cursor = "help";
    if (numberOfCurrentCrew >= numberOfTargetCrew) {
      currentCrewLabel.classList.add("label", "label-success");
    } else {
      currentCrewLabel.classList.add("label", "label-warning");
    }
 
    let totalCrewLabel = document.createElement("span");
    totalCrewLabel.title = "Anzahl benötigter Angestellter bei vollbesetzten Fahrzeugen";
    totalCrewLabel.textContent = numberOfVehicleCrew;
    totalCrewLabel.style.cursor = "help";
    if (numberOfCurrentCrew >= numberOfVehicleCrew) {
      totalCrewLabel.classList.add("label", "label-success");
    } else {
      totalCrewLabel.classList.add("label", "label-warning");
    }
 
    let crewInfo = document.createElement("dd");
    crewInfo.appendChild(currentCrewLabel);
    crewInfo.appendChild(document.createTextNode(" Angestellte / "));
    crewInfo.appendChild(totalCrewLabel);
    crewInfo.appendChild(document.createTextNode(" Benötigte "));
 
    if (btnGroup) {
      const btnShowAssignedPersonnel = document.createElement("a");
      btnShowAssignedPersonnel.classList.add("btn", "btn-xs", "btn-default");
      btnShowAssignedPersonnel.textContent = "Zugewiesene Fahrzeugbesatzung anzeigen";
      btnShowAssignedPersonnel.addEventListener("click", showAssignedPersonnelToVehicle);
      btnGroup.appendChild(btnShowAssignedPersonnel);
 
      crewInfo.appendChild(btnGroup);
    }
 
    dd.replaceWith(crewInfo);
  }
 
  async function getAssignedPersonnel(vehicleId) {
    const response = await fetch(`/vehicles/${vehicleId}/zuweisung`).then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response;
    });
 
    const responseText = await response.text();
 
    const parser = new DOMParser();
    const responseDocument = parser.parseFromString(responseText, "text/html");
    const assignedPersonnel = responseDocument.querySelectorAll("a.btn-assigned");
    return assignedPersonnel.length;
  }
 
  async function showAssignedPersonnelToVehicle(event) {
    if (event) {
      event.target.removeEventListener("click", showAssignedPersonnelToVehicle);
      event.target.setAttribute("disabled", "disabled");
      event.preventDefault();
    }
 
    const vehicleTable = document.getElementById("vehicle_table");
    if (!vehicleTable) {
      return;
    }
 
    const vehicleRows = vehicleTable.querySelectorAll("tr");
    for (const vehicleRow of vehicleRows) {
      if (vehicleRow.classList.contains("tablesorter-headerRow")) {
        vehicleRow.querySelector("th:nth-child(6)").textContent = "Besatzung (Zugewiesen/Maximal)";
        continue;
      }
 
      const vehicleId = vehicleRow.querySelector("a[href^='/vehicles/']").getAttribute("href").match(/\d+/)[0];
      const vehicleCrewCell = vehicleRow.children[5];
      const maxCrewCount = parseInt(vehicleCrewCell.textContent);
      const assignedPersonnel = await getAssignedPersonnel(vehicleId);
 
      const crewLabel = document.createElement("span");
      crewLabel.title = "Anzahl zugewiesener Personen / maximal mögliche Anzahl";
      crewLabel.textContent = `${assignedPersonnel} / ${maxCrewCount}`;
      crewLabel.style.cursor = "help";
      crewLabel.classList.add("fahrzeugbesatzung-label", "label");
      if (assignedPersonnel === maxCrewCount) {
        crewLabel.classList.add("label-success");
      } else if (assignedPersonnel > maxCrewCount) {
        crewLabel.classList.add("label-danger");
      } else {
        crewLabel.classList.add("label-warning");
      }
      crewLabel.setAttribute("data-vehicle-id", vehicleId);
 
      vehicleCrewCell.textContent = "";
      vehicleCrewCell.appendChild(crewLabel);
    }
 
    document.dispatchEvent(new CustomEvent("bos-ernie.personalzuweiser.show-assigned-personnel-completed"));
  }
 
  function main() {
    if (window.location.href.match(/\/buildings\/\d+\/hire/)) {
      return;
    }
 
    const h1 = document.querySelector("h1[building_type]");
    if (!h1) {
      return;
    }
 
    const buildingTypeId = h1.getAttribute("building_type");
    if (buildingTypeIdsWithoutPersonnel.includes(parseInt(buildingTypeId))) {
      return;
    }
 
    setCrewInfo();
  }
 
  main();
})();
