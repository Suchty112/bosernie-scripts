// ==UserScript==
// @name        * Personalzuweiser
// @namespace   bos-ernie.leitstellenspiel.de
// @version     1.14.0
// @license     BSD-3-Clause
// @author      BOS-Ernie
// @description Weist maximal mögliche Anzahl an Personal einem Fahrzeug zu.
// @match       https://*.leitstellenspiel.de/vehicles/*/zuweisung
// @icon        https://www.google.com/s2/favicons?sz=64&domain=leitstellenspiel.de
// @run-at      document-idle
// @grant       none
// @resource    https://forum.leitstellenspiel.de/index.php?thread/23435-script-personalzuweiser-by-bos-ernie/
// ==/UserScript==
 
/* global $, I18n */
 
(async function () {
  // Set to true, if only 1 Notarzt should be assigned to NEF
  const assignOnlyOnePersonToNEF = false;
 
  function observeNumberOfAssignedPersonnelMutations() {
    const targetNode = document.getElementById("count_personal");
    const config = { attributes: true, childList: true, subtree: true };
 
    const callback = function (mutationsList, observer) {
      for (const mutation of mutationsList) {
        if (mutation.type === "childList") {
          updateNumberOfAssignedPersonnelDecoration();
        }
      }
    };
 
    const observer = new MutationObserver(callback);
    observer.observe(targetNode, config);
  }
 
  function updateNumberOfAssignedPersonnelDecoration() {
    const assignedPersonsElement = getAssignedPersonsElement();
    const vehicleCapacity = parseInt(assignedPersonsElement.parentElement.firstElementChild.innerText);
 
    let numberOfAssignedPersonnel = parseInt(assignedPersonsElement.innerText);
    let numberOfPersonnelToAssign = vehicleCapacity - numberOfAssignedPersonnel;
 
    if (numberOfPersonnelToAssign <= 0) {
      assignedPersonsElement.classList.remove("label-warning");
      assignedPersonsElement.classList.add("label-success");
    } else {
      assignedPersonsElement.classList.remove("label-success");
      assignedPersonsElement.classList.add("label-warning");
    }
  }
 
  async function assign() {
    const assignedPersonsElement = getAssignedPersonsElement();
    const vehicleCapacity = parseInt(assignedPersonsElement.parentElement.firstElementChild.innerText);
 
    let numberOfAssignedPersonnel = parseInt(assignedPersonsElement.innerText);
    let numberOfPersonnelToAssign = vehicleCapacity - numberOfAssignedPersonnel;
    const vehicleTypeId = getVehicleTypeId();
 
    // Assigning only 1 person to NEF
    if (vehicleTypeId === 29 && assignOnlyOnePersonToNEF) {
      numberOfPersonnelToAssign = 1;
    }
 
    if (numberOfPersonnelToAssign <= 0 || vehicleTypeId === null) {
      return;
    }
 
    const identifier = getIdentifierByVehicleTypeId(vehicleTypeId);
    const rows = document.querySelectorAll('tr[data-filterable-by*="' + identifier + '"]');
    const rowsNotInTraining = Array.from(rows).filter(
      row => row.children[2].innerText.startsWith("Im Unterricht") === false,
    );
 
    for (const row of rowsNotInTraining) {
      if (numberOfPersonnelToAssign === 0) {
        break;
      }
 
      const button = row.querySelector("a.btn-success");
 
      if (button) {
        const personalId = button.getAttribute("personal_id");
        const personalElement = document.getElementById(`personal_${personalId}`);
        personalElement.innerHTML = `<td colspan="4">${I18n.t("common.loading")}</td>`;
 
        const response = await fetch(button.href, {
          method: "POST",
          headers: {
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            "x-csrf-token": document.querySelector("meta[name=csrf-token]").content,
            "x-requested-with": "XMLHttpRequest",
          },
        });
 
        if (!response.ok) {
          throw new Error("HTTP Fehler! Statuscode: " + response.status);
        }
 
        personalElement.innerHTML = await response.text();
 
        numberOfAssignedPersonnel++;
        numberOfPersonnelToAssign--;
 
        assignedPersonsElement.innerText = numberOfAssignedPersonnel;
 
        await new Promise(r => setTimeout(r, 50));
      }
    }
  }
 
  async function reset() {
    const selectButtons = document.getElementsByClassName("btn btn-default btn-assigned");
 
    // Since the click event removes the button from the DOM, only every second item would be clicked.
    // To prevent this, the loop is executed backwards.
    for (let i = selectButtons.length - 1; i >= 0; i--) {
      selectButtons[i].click();
      // Wait 250ms to prevent possible race conditions
      await new Promise(r => setTimeout(r, 250));
    }
  }
 
  function assignClickEvent(event) {
    assign();
    event.preventDefault();
  }
 
  function resetClickEvent(event) {
    reset();
    event.preventDefault();
  }
 
  function getAssignedPersonsElement() {
    return document.getElementById("count_personal");
  }
 
  function addButtonGroup() {
    let okIcon = document.createElement("span");
    okIcon.className = "glyphicon glyphicon-ok";
 
    let assignButton = document.createElement("button");
    assignButton.type = "button";
    assignButton.className = "btn btn-default";
    assignButton.appendChild(okIcon);
    assignButton.addEventListener("click", assignClickEvent);
 
    let resetIcon = document.createElement("span");
    resetIcon.className = "glyphicon glyphicon-trash";
 
    let resetButton = document.createElement("button");
    resetButton.type = "button";
    resetButton.className = "btn btn-default";
    resetButton.appendChild(resetIcon);
    resetButton.addEventListener("click", resetClickEvent);
 
    let buttonGroup = document.createElement("div");
    buttonGroup.id = "vehicle-assigner-button-group";
    buttonGroup.className = "btn-group";
    buttonGroup.style = "margin-left: 5px";
    buttonGroup.appendChild(assignButton);
    buttonGroup.appendChild(resetButton);
 
    // Append button group to element with class "vehicles-education-filter-box"
    document.getElementsByClassName("vehicles-education-filter-box")[0].appendChild(buttonGroup);
  }
 
  function getVehicleId() {
    return window.location.pathname.split("/")[2];
  }
 
  function getVehicleTypeId() {
    const vehicleId = getVehicleId();
    const request = new XMLHttpRequest();
    request.open("GET", `/api/v2/vehicles/${vehicleId}`, false);
    request.send(null);
 
    if (request.status === 200) {
      const vehicle = JSON.parse(request.responseText);
      return vehicle.result.vehicle_type;
    }
 
    return null;
  }
 
  function removeEventListenersOfAssignButtons() {
    const personalTable = document.getElementById("personal_table");
 
    const buttons = personalTable.querySelectorAll("a.btn");
    for (let button of buttons) {
      button = button.cloneNode(true);
      button.replaceWith(button);
    }
  }
 
  function getIdentifierByVehicleTypeId(vehicleTypeId) {
    switch (vehicleTypeId) {
      case 0: //LF 20
        return "[]";
      case 1: //LF 10
        return "[]";
      case 2: //DLK 23
        return "[]";
      case 3: //ELW 1
        return "[]";
      case 4: //RW
        return "[]";
      case 5: //GW-A
        return "[]";
      case 6: //LF 8/6
        return "[]";
      case 7: //LF 20/16
        return "[]";
      case 8: //LF 10/6
        return "[]";
      case 9: //LF 16-TS
        return "[]";
      case 10: //GW-Öl
        return "[]";
      case 11: //GW-L2-Wasser
        return "[]";
      case 12: //GW-Messtechnik
        return "gw_messtechnik";
      case 13: //SW 1000
        return "[]";
      case 14: //SW 2000
        return "[]";
      case 15: //SW 2000-Tr
        return "[]";
      case 16: //SW Kats
        return "[]";
      case 17: //TLF 2000
        return "[]";
      case 18: //TLF 3000
        return "[]";
      case 19: //TLF 8/8
        return "[]";
      case 20: //TLF 8/18
        return "[]";
      case 21: //TLF 16/24-Tr
        return "[]";
      case 22: //TLF 16/25
        return "[]";
      case 23: //TLF 16/45
        return "[]";
      case 24: //TLF 20/40
        return "[]";
      case 25: //TLF 20/40-SL
        return "[]";
      case 26: //TLF 16
        return "[]";
      case 27: //GW-Gefahrgut
        return "gw_gefahrgut";
      case 28: //RTW
        return "[]";
      case 29: //NEF
        return "notarzt";
      case 30: //HLF 20
        return "[]";
      case 31: //RTH
        return "notarzt";
      case 32: //FuStW
        return "[]";
      case 33: //GW-Höhenrettung
        return "gw_hoehenrettung";
      case 34: //ELW 2
        return "elw2";
      case 35: //leBefKw
        return "police_einsatzleiter";
      case 36: //MTW
        return "[]";
      case 37: //TSF-W
        return "[]";
      case 38: //KTW
        return "[]";
      case 39: //GKW
        return "[]";
      case 40: //MTW-TZ
        return "thw_zugtrupp";
      case 41: //MzKW
        return "[]";
      case 42: //LKW K 9
        return "thw_raumen";
      case 45: //MLW 5
        return "thw_raumen";
      case 46: //WLF
        return "wechsellader";
      case 50: //GruKw
        return "[]";
      case 51: //FüKW (Polizei)
        return "police_fukw";
      case 52: //GefKw
        return "[]";
      case 53: //Dekon-P
        return "dekon_p";
      case 55: //KdoW-LNA
        return "lna";
      case 56: //KdoW-OrgL
        return "orgl";
      case 57: //FwK
        return "fwk";
      case 58: //KTW Typ B
        return "[]";
      case 59: //ELW 1 (SEG)
        return "seg_elw";
      case 60: //GW-San
        return "seg_gw_san";
      case 61: //Polizeihubschrauber
        return "polizeihubschrauber";
      case 63: //GW-Taucher
        return "gw_taucher";
      case 64: //GW-Wasserrettung
        return "gw_wasserrettung";
      case 65: //LKW 7 Lkr 19 tm
        return "[]";
      case 69: //Tauchkraftwagen
        return "gw_taucher";
      case 72: //WaWe 10
        return "police_wasserwerfer";
      case 73: //GRTW
        return "[]";
      case 74: //NAW
        return "notarzt";
      case 75: //FLF
        return "arff";
      case 76: //Rettungstreppe
        return "rettungstreppe";
      case 79: //SEK - ZF
        return "police_sek";
      case 80: //SEK - MTF
        return "police_sek";
      case 81: //MEK - ZF
        return "police_mek";
      case 82: //MEK - MTF
        return "police_mek";
      case 83: //GW-Werkfeuerwehr
        return "werkfeuerwehr";
      case 84: //ULF mit Löscharm
        return "werkfeuerwehr";
      case 85: //TM 50
        return "werkfeuerwehr";
      case 86: //Turbolöscher
        return "werkfeuerwehr";
      case 87: //TLF 4000
        return "[]";
      case 88: //KLF
        return "[]";
      case 89: //MLF
        return "[]";
      case 90: //HLF 10
        return "[]";
      case 91: //Rettungshundefahrzeug
        return "seg_rescue_dogs";
      case 93: //MTW-O
        return "thw_rescue_dogs";
      case 94: //DHuFüKw
        return "k9";
      case 95: //Polizeimotorrad
        return "police_motorcycle";
      case 97: //ITW
        return "todo";
      case 98: //Zivilstreifenwagen
        return "criminal_investigation";
      case 99: //LKW 7 Lbw
        return "water_damage_pump";
      case 100: //MLW 4
        return "water_damage_pump";
      case 103: //FuStW (DGL)
        return "police_service_group_leader";
      case 104: //GW-L1
        return "[]";
      case 105: //GW-L2
        return "[]";
      case 106: //MTF-L
        return "[]";
      case 107: //LF-L
        return "[]";
      case 109: //MzGW SB
        return "heavy_rescue";
      case 114: //GW-Lüfter
        return "[]";
      case 121: //GTLF
        return "[]";
      case 122: //LKW 7 Lbw (FGr E)
        return "thw_energy_supply";
      case 123: //LKW 7 Lbw (FGr WP)
        return "water_damage_pump";
      case 124: //MTW-OV
        return "[]";
      case 125: //MTW-Tr UL
        return "thw_drone";
      case 126: //MTF Drohne
        return "fire_drone";
      case 127: //SEG GW UAS
        return "seg_drone";
      case 128: // ELW Drohne
        return "fire_drone";
      case 131: //SEG BT-Kombi
        return "care_service";
      case 133: //SEG BT-LKW
        return "care_service_equipment";
      case 134: //Pferdetransporter (klein)
        return "police_horse";
      case 135: //Pferdetransporter (groß)
        return "police_horse";
      case 137: //Zugfahrzeug Pferdetransporter
        return "police_horse";
      case 140: //MTW-Verpflegung
        return "fire_care_service";
      case 144: //FüKw (THW)
        return "thw_command";
      case 145: //FüKomKW
        return "thw_command";
      case 147: //FmKW
        return "thw_command";
      case 148: //MTW Fgr K
        return "thw_command";
      case 149: //GW Bergrettung (NEF)
        return "notarzt";
      case 150: //GW Bergrettung
        return "[]";
      case 151: //ELW Bergrettung
        return "mountain_command";
      case 152: //ATV
        return "[]";
      case 153: //Hundestaffel (Bergrettung)
        return "seg_rescue_dogs";
      case 154: //Schneefahrzeug
        return "[]";
      case 156: //Polizeihubschrauber mit verbauter Winde
        return "[]"; // 1 Polizeihubschrauber (polizeihubschrauber) und 1 Windenoperator (police_helicopter_lift) werden benötigt
      case 157: //RTH Winde
        return "[]"; // 1 Windenoperator (police_helicopter_lift) und 1 Notarzt (notarzt) werden benötigt
      case 158: //GW-Höhenrettung (Bergrettung)
        return "mountain_height_rescue";
    }
  }
 
  observeNumberOfAssignedPersonnelMutations();
  removeEventListenersOfAssignButtons();
 
  addButtonGroup();
})();