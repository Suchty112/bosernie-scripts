// ==UserScript==
// @name        * Fahrzeug- und Gebäudestatistik
// @namespace   bos-ernie.leitstellenspiel.de
// @version     1.5.0
// @license     BSD-3-Clause
// @author      BOS-Ernie
// @description Listet die Anzahl der Gebäude und Fahrzeuge jeder Art auf.
// @match       https://www.leitstellenspiel.de/
// @match       https://polizei.leitstellenspiel.de/
// @icon        https://www.google.com/s2/favicons?sz=64&domain=leitstellenspiel.de
// @run-at      document-idle
// @grant       none
// @resource    https://forum.leitstellenspiel.de/index.php?thread/23396-script-fahrzeug-und-geb%C3%A4udestatistik-by-bos-ernie/
// ==/UserScript==
 
/* global $ */
 
(async function () {
  let vehicleTypeNames = [];
  const buildingTypeNames = await fetch("https://api.lss-manager.de/de_DE/buildings")
    .then(response => response.json())
    .then(data => {
      const buildings = {};
      for (const buildingId in data) {
        buildings[buildingId] = data[buildingId].caption;
      }
      return buildings;
    });
 
  let numberOfVehiclesPerType = [];
  let numberOfVehicles = 0;
  let numberOfBuildingsPerType = [];
  let numberOfBuildings = 0;
  let numberOfPersonnel = 0;
 
  function addStyle() {
    const style =
      ".loader{width:100px;height:100px;border-radius:100%;position:relative;margin:0 auto;top:40px;left:-2.5px}.loader span{display:inline-block;width:5px;height:20px;background-color:#c9302c}.loader span:first-child{animation:1s ease-in-out infinite grow}.loader span:nth-child(2){animation:1s ease-in-out .15s infinite grow}.loader span:nth-child(3){animation:1s ease-in-out .3s infinite grow}.loader span:nth-child(4){animation:1s ease-in-out .45s infinite grow}@keyframes grow{0%,100%{-webkit-transform:scaleY(1);-ms-transform:scaleY(1);-o-transform:scaleY(1);transform:scaleY(1)}50%{-webkit-transform:scaleY(1.8);-ms-transform:scaleY(1.8);-o-transform:scaleY(1.8);transform:scaleY(1.8)}}";
 
    const styleElement = document.createElement("style");
    styleElement.innerHTML = style;
    document.head.appendChild(styleElement);
  }
 
  function createModal() {
    const modal = document.createElement("div");
    modal.className = "modal fade";
    modal.id = "statistics-modal";
    modal.setAttribute("tabindex", "-1");
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-labelledby", "statistics-modal-label");
    modal.setAttribute("aria-hidden", "true");
    modal.style.display = "none";
    modal.style.zIndex = "5000";
    modal.innerHTML = `
<div class="modal-dialog" role="document">
    <div class="modal-content">
        <div class="modal-header">
            <h3 class="modal-title" id="statistics-modal-label"><span class="glyphicon glyphicon-stats" aria-hidden="true"></span> Fahrzeug- und Gebäudestatistik</h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        </div>
        <div class="modal-body" style="max-height: calc(100vh - 212px);overflow-y: auto;">
            <div>
                <!-- Summary list -->
                <ul class="list-unstyled">
                  <li>Fahrzeuge: <span id="number-of-vehicles">...</span></li>
                  <li>Gebäude: <span id="number-of-buildings">...</span></li>
                  <li>Personal: <span id="number-of-personnel">...</span></li>
                </ul>
                <!-- Nav tabs -->
                <ul class="nav nav-tabs" role="tablist">
                    <li role="presentation" class="active"><a href="#vehicle-types-panel" aria-controls="vehicle-types-panel" role="tab" data-toggle="tab"><span class="glyphicon glyphicon-knight" aria-hidden="true"></span> Fahrzeuge</a></li>
                    <li role="presentation"><a href="#buildings-panel" aria-controls="buildings-panel" role="tab" data-toggle="tab"><span class="glyphicon glyphicon-home" aria-hidden="true"></span> Gebäude</a></li>
                    <li role="presentation"><a href="#export-panel" aria-controls="export-panel" role="tab" data-toggle="tab"><span class="glyphicon glyphicon-export" aria-hidden="true"></span> Export</a></li>
                </ul>
                <!-- Tab panes -->
                <div class="tab-content">
                    <div role="tabpanel" class="tab-pane active" id="vehicle-types-panel">
                        <div id="vehicle-types-statistics">
                            <div class="row">
                                <div class="col-md-12 bg">
                                    <div class="loader">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div role="tabpanel" class="tab-pane" id="buildings-panel">
                        <div id="buildings-statistics">
                            <div class="row">
                                <div class="col-md-12 bg">
                                    <div class="loader">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div role="tabpanel" class="tab-pane" id="export-panel">
                        <div id="export">
                            <textarea id="export-textarea" class="form-control" rows="20"></textarea>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
`;
    document.body.appendChild(modal);
  }
 
  function buttonClick(event) {
    event.preventDefault();
    $("#statistics-modal").modal("show");
    initData();
  }
 
  function addMenuEntry() {
    const divider = document.createElement("li");
    divider.setAttribute("class", "divider");
    divider.setAttribute("role", "presentation");
    document.getElementById("logout_button").parentElement.parentElement.append(divider);
    const li = document.createElement("li");
    li.innerHTML =
      '<a href="javascript: void(0)" id="statistics-button"><span class="glyphicon glyphicon-stats" aria-hidden="true"></span> Fahrzeug- und Gebäudestatistik</a>';
    document.getElementById("logout_button").parentElement.parentElement.append(li);
 
    document.getElementById("statistics-button").addEventListener("click", buttonClick);
  }
 
  async function initData() {
    await initVehicles();
    await initBuildingsAndPersonnel();
 
    renderVehicles();
    renderBuildings();
    renderExport();
  }
 
  async function initVehicles() {
    const vehicles = fetch("https://www.leitstellenspiel.de/api/vehicles").then(response => response.json());
    await vehicles;
    vehicles.then(result => {
      numberOfVehicles = result.length.toLocaleString();
 
      const vehicleTypes = {};
      result.forEach(vehicle => {
        if (vehicleTypes[vehicle.vehicle_type]) {
          vehicleTypes[vehicle.vehicle_type]["count"]++;
        } else {
          vehicleTypes[vehicle.vehicle_type] = {
            count: 1,
            name: vehicleTypeNames[vehicle.vehicle_type],
          };
        }
      });
 
      numberOfVehiclesPerType = Object.values(vehicleTypes).sort((a, b) => {
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      });
    });
  }
 
  async function initBuildingsAndPersonnel() {
    const buildings = await fetch("https://www.leitstellenspiel.de/api/buildings").then(response => response.json());
 
    numberOfBuildings = buildings.length.toLocaleString();
 
    let unsortedBuildingsPerType = {};
    buildings.forEach(building => {
      if (unsortedBuildingsPerType[building.building_type]) {
        unsortedBuildingsPerType[building.building_type]["count"]++;
      } else {
        unsortedBuildingsPerType[building.building_type] = {
          count: 1,
          name: buildingTypeNames[building.building_type],
        };
      }
    });
 
    numberOfBuildingsPerType = Object.values(unsortedBuildingsPerType).sort((a, b) => {
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });
 
    numberOfPersonnel = buildings.reduce((sum, building) => sum + building.personal_count, 0);
    document.getElementById("number-of-personnel").innerHTML = numberOfPersonnel.toLocaleString();
  }
 
  function renderVehicles() {
    document.getElementById("number-of-vehicles").innerHTML = numberOfVehicles;
 
    const tableHead = document.createElement("thead");
    tableHead.innerHTML = "<tr><th>Name</th><th>Anzahl</th></tr>";
 
    const table = document.createElement("table");
    table.setAttribute("class", "table table-responsive table-hover table-striped");
    table.appendChild(tableHead);
 
    const tableBody = document.createElement("tbody");
 
    numberOfVehiclesPerType.forEach(vehicleType => {
      const row = document.createElement("tr");
      row.innerHTML = `<td>${vehicleType.name}</td><td>${vehicleType.count}</td>`;
 
      tableBody.appendChild(row);
    });
 
    table.appendChild(tableBody);
 
    document.getElementById("vehicle-types-statistics").innerHTML = table.outerHTML;
  }
 
  function renderBuildings() {
    document.getElementById("number-of-buildings").innerHTML = numberOfBuildings;
 
    const tableHead = document.createElement("thead");
    tableHead.innerHTML = "<tr><th>Name</th><th>Anzahl</th></tr>";
 
    const table = document.createElement("table");
    table.setAttribute("class", "table table-responsive table-hover table-striped");
    table.appendChild(tableHead);
 
    const tableBody = document.createElement("tbody");
 
    numberOfBuildingsPerType.forEach(buildingType => {
      const row = document.createElement("tr");
      row.innerHTML = `<td>${buildingType.name}</td><td>${buildingType.count}</td>`;
 
      tableBody.appendChild(row);
    });
 
    table.appendChild(tableBody);
 
    document.getElementById("buildings-statistics").innerHTML = table.outerHTML;
  }
 
  function renderExport() {
    const exportArea = document.getElementById("export-textarea");
 
    exportArea.value = "Fahrzeuge: " + numberOfVehicles + "\n";
    exportArea.value += "Gebäude: " + numberOfBuildings + "\n";
    exportArea.value += "Personal: " + numberOfPersonnel.toLocaleString() + "\n\n\n";
 
    exportArea.value += "Fahrzeuge\n";
    exportArea.value += "=====================\n";
    numberOfVehiclesPerType.forEach(vehicleType => {
      exportArea.value += `${vehicleType.name}: ${vehicleType.count}\n`;
    });
 
    exportArea.value += "\n\nGebäude\n";
    exportArea.value += "=====================\n";
    numberOfBuildingsPerType.forEach(buildingType => {
      exportArea.value += `${buildingType.name}: ${buildingType.count}\n`;
    });
 
    exportArea.value += "\n\nStand: " + new Date().toLocaleString();
 
    navigator.clipboard.writeText(exportArea.value);
  }
 
  function loadVehicleTypeNames() {
    fetch("https://api.lss-manager.de/de_DE/vehicles")
      .then(response => response.json())
      .then(result => {
        for (const vehicleType in result) {
          vehicleTypeNames[vehicleType] = result[vehicleType].caption;
        }
      });
  }
 
  function main() {
    addStyle();
    createModal();
    addMenuEntry();
    loadVehicleTypeNames();
  }
 
  main();
})();