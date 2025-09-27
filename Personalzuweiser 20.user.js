// ==UserScript==
// @name        * Personalzuweiser 2.0
// @namespace   bos-ernie.leitstellenspiel.de
// @version     2.6.0
// @license     BSD-3-Clause
// @author      BOS-Ernie
// @description Weist benötigtes Personal einem Fahrzeug zu.
// @match       https://*.leitstellenspiel.de/vehicles/*/zuweisung
// @icon        https://www.google.com/s2/favicons?sz=64&domain=leitstellenspiel.de
// @run-at      document-idle
// @grant       none
// @resource    https://forum.leitstellenspiel.de/index.php?thread/27234-script-personalzuweiser-2-0/
// ==/UserScript==
 
/* global $, I18n */
 
(async function () {
  const assignButtonHotkey = "s";
  const resetButtonHotkey = "x";
  const buildingButtonHotkey = "w";
  const previousVehicleButtonHotkey = "a";
  const nextVehicleButtonHotkey = "d";
 
  const assignMostSeniorPersonnelFirst = true;
 
  /*
   * Um die Personalzuweisung für einen Fahrzeugtyp zu überschreiben, entferne die Kommentare am entsprechenden Block
   * oder füge einen neuen hinzu. Wenn du Fragen zur Konfiguration hast, melde dich im Forum.
   *
   * Erklärung der Felder:
   * {
   *   id: 53, // ID des Fahrzeugtyps
   *   caption: "Dekon-P", // Name des Fahrzeugtyps
   *   maxStaff: 6, // Maximale Fahrzeugbesatzung
   *   training: [ // Benötigte Lehrgänge
   *     {
   *       key: "dekon_p", // Schlüssel des benötigten Lehrgangs
   *       number: 6, // Anzahl des benötigten Lehrgangs
   *     },
   *   ],
   * }
   */
  const vehiclesConfigurationOverride = [
    // {
    //   id: 53,
    //   caption: "Dekon-P",
    //   maxStaff: 6,
    //   training: [
    //     {
    //       key: "dekon_p",
    //       number: 6,
    //     },
    //   ],
    // },
    // {
    //   id: 134,
    //   caption: "Pferdetransporter klein",
    //   maxStaff: 4,
    //   training: [
    //     {
    //       key: "police_horse",
    //       number: 4,
    //     },
    //   ],
    // },
    // {
    //   id: 135,
    //   caption: "Pferdetransporter groß",
    //   maxStaff: 2,
    //   training: [
    //     {
    //       key: "police_horse",
    //       number: 2,
    //     },
    //   ],
    // },
    // {
    //   id: 137,
    //   caption: "Zugfahrzeug Pferdetransport",
    //   maxStaff: 6,
    //   training: [
    //     {
    //       key: "police_horse",
    //       number: 6,
    //     },
    //   ],
    // },
  ];
 
  let vehiclesConfiguration = [];
 
  const storageKey = "bos-ernie.personnel-allocator.vehicle-type-configurations";
  const storageTtl = 24 * 60 * 60 * 1000;
 
  function transformVehiclesData(data) {
    return Object.entries(data)
      .filter(([id, vehicle]) => !vehicle.isTrailer)
      .map(([id, vehicle]) => {
        const trainingMap = {};
 
        if (vehicle.staff && vehicle.staff.training) {
          for (const trainings of Object.values(vehicle.staff.training)) {
            for (const [trainingKey, trainingInfo] of Object.entries(trainings)) {
              if (trainingInfo.min !== 0) {
                trainingMap[trainingKey] = trainingInfo.min ? trainingInfo.min : vehicle.maxPersonnel;
              }
            }
          }
        }
 
        return {
          id: Number(id),
          caption: vehicle.caption,
          maxStaff: vehicle.maxPersonnel,
          training: Object.entries(trainingMap).map(([key, number]) => ({
            key,
            number,
          })),
        };
      });
  }
 
  async function initVehiclesConfiguration() {
    const storedVehiclesConfiguration = localStorage.getItem(storageKey);
 
    if (storedVehiclesConfiguration) {
      const cachedData = JSON.parse(storedVehiclesConfiguration);
 
      if (cachedData.lastUpdate > new Date().getTime() - storageTtl) {
        vehiclesConfiguration = applyVehicleConfigurationOverride(cachedData.data);
        return;
      }
    }
 
    try {
      const response = await fetch("https://api.lss-manager.de/de_DE/vehicles");
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      vehiclesConfiguration = applyVehicleConfigurationOverride(transformVehiclesData(data));
 
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          lastUpdate: new Date().getTime(),
          data: vehiclesConfiguration,
        }),
      );
    } catch (error) {
      console.error("Error fetching and transforming vehicles data:", error);
    }
  }
 
  function applyVehicleConfigurationOverride(vehiclesConfiguration) {
    return vehiclesConfiguration.map(vehicle => {
      const override = vehiclesConfigurationOverride.find(override => override.id === vehicle.id);
      return override ? override : vehicle;
    });
  }
 
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
    const vehicleTypeId = getVehicleTypeId();
    if (vehicleTypeId === null) {
      return;
    }
 
    const vehicleConfiguration = vehiclesConfiguration.find(vehicle => vehicle.id === vehicleTypeId);
    const vehicleCapacity = vehicleConfiguration.maxStaff;
 
    const assignedPersonsElement = getAssignedPersonsElement();
    let numberOfAssignedPersonnel = parseInt(assignedPersonsElement.innerText);
    let numberOfPersonnelToAssign = vehicleCapacity - numberOfAssignedPersonnel;
 
    if (numberOfPersonnelToAssign <= 0) {
      return;
    }
 
    for (const training of vehicleConfiguration.training) {
      if (numberOfPersonnelToAssign === 0) {
        break;
      }
 
      numberOfPersonnelToAssign -= await assignPersonnel(training.key, training.number);
    }
 
    if (numberOfPersonnelToAssign > 0) {
      await assignPersonnel(null, numberOfPersonnelToAssign);
    }
 
    document.dispatchEvent(new CustomEvent("bos-ernie.personalzuweiser.assign-completed"));
  }
 
  function getAvailableWithTraining(identifier) {
    const rows = document.querySelectorAll("tr[data-filterable-by]");
 
    return Array.from(rows).filter(row => {
      const filterData = row
        .getAttribute("data-filterable-by")
        .replace(/"/g, "")
        .replace(/[\[\]]/g, "")
        .split(",")
        .map(item => item.trim());
 
      const isInTraining = row.children[2].innerText.startsWith("Im Unterricht");
 
      if (identifier === null) {
        return filterData.length === 1 && filterData[0] === "" && !isInTraining;
      }
 
      return filterData.includes(identifier) && !isInTraining;
    });
  }
 
  async function assignPersonnel(identifier, number) {
    let numberOfPersonnelAssigned = 0;
    if (number === 0) {
      return numberOfPersonnelAssigned;
    }
 
    const rowsNotInTraining = getAvailableWithTraining(identifier);
 
    if (assignMostSeniorPersonnelFirst) {
      rowsNotInTraining.reverse();
    }
 
    for (const row of rowsNotInTraining) {
      if (numberOfPersonnelAssigned === number) {
        break;
      }
 
      const button = row.querySelector("a.btn-success");
 
      if (!button) {
        continue;
      }
 
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
 
      numberOfPersonnelAssigned++;
 
      const assignedPersonsElement = getAssignedPersonsElement();
      getAssignedPersonsElement().innerText = parseInt(assignedPersonsElement.innerText) + 1;
 
      await new Promise(r => setTimeout(r, 50));
    }
 
    return numberOfPersonnelAssigned;
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
 
    document.dispatchEvent(new CustomEvent("bos-ernie.personalzuweiser.reset-completed"));
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
    assignButton.className = "btn btn-success";
    assignButton.appendChild(okIcon);
    assignButton.addEventListener("click", assignClickEvent);
 
    let resetIcon = document.createElement("span");
    resetIcon.className = "glyphicon glyphicon-trash";
 
    let resetButton = document.createElement("button");
    resetButton.type = "button";
    resetButton.className = "btn btn-danger";
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
 
  async function main() {
    await initVehiclesConfiguration();
 
    observeNumberOfAssignedPersonnelMutations();
    removeEventListenersOfAssignButtons();
 
    addButtonGroup();
 
    document.addEventListener("keydown", function (event) {
      const activeElement = document.activeElement;
      if (activeElement.tagName.toLowerCase() !== "body") {
        return;
      }
 
      const key = event.key.toLocaleLowerCase();
      const buildingElement = document.querySelector("#iframe-inside-container ol.breadcrumb a");
      switch (key) {
        case assignButtonHotkey:
          assign();
          break;
        case resetButtonHotkey:
          reset();
          break;
        case previousVehicleButtonHotkey:
          document.querySelectorAll(".btn-group.pull-right a")[0].click();
          break;
        case nextVehicleButtonHotkey:
          document.querySelectorAll(".btn-group.pull-right a")[1].click();
          break;
 
        case buildingButtonHotkey:
          if (buildingElement) {
            buildingElement.click();
          }
          break;
      }
    });
  }
 
  main();
})();