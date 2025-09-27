// ==UserScript==
// @name        * Belegungsanzeiger
// @namespace   bos-ernie.leitstellenspiel.de
// @version     1.6.2
// @license     BSD-3-Clause
// @author      BOS-Ernie
// @description Zeigt die Belegung von Betten, Zellen und Schulen der eigenen und Verbandsgebäuden an.
// @match       https://www.leitstellenspiel.de/
// @match       https://polizei.leitstellenspiel.de/
// @icon        https://www.google.com/s2/favicons?sz=64&domain=leitstellenspiel.de
// @run-at      document-idle
// @grant       none
// @resource    https://forum.leitstellenspiel.de/index.php?thread/23822-script-belegungsanzeiger-by-bos-ernie/
// ==/UserScript==
 
(function () {
  let buildings;
  let allianceBuildings;
 
  function addMenuEntry() {
    const divider = document.createElement("li");
    divider.setAttribute("class", "divider");
    divider.setAttribute("role", "presentation");
 
    document.getElementById("logout_button").parentElement.parentElement.append(divider);
 
    const bedIcon = document.createElement("span");
    bedIcon.setAttribute("class", "glyphicon glyphicon-blackboard");
 
    const button = document.createElement("a");
    button.setAttribute("href", "javascript: void(0)");
    button.setAttribute("id", "occupancy-button");
    button.append(bedIcon);
    button.append(" Belegungsanzeiger");
    button.addEventListener("click", buttonClick);
 
    const li = document.createElement("li");
    li.appendChild(button);
 
    document.getElementById("logout_button").parentElement.parentElement.append(li);
  }
 
  function addModal() {
    const modal = document.createElement("div");
    modal.className = "modal fade";
    modal.id = "occupancy-modal";
    modal.setAttribute("tabindex", "-1");
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-labelledby", "occupancy-modal-label");
    modal.setAttribute("aria-hidden", "true");
    modal.style.display = "none";
    modal.style.zIndex = "5000";
    modal.innerHTML = `
<div class="modal-dialog modal-lg" role="document" style="width: 1280px;">
    <div class="modal-content">
        <div class="modal-header">
            <h1 class="modal-title" id="occupancy-modal-label"><span class="glyphicon glyphicon-blackboard" aria-hidden="true"></span> Belegungsanzeiger</h1>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">    
                <span aria-hidden="true">&times;</span>
            </button>   
        </div>  
        <div class="modal-body" style="max-height: calc(100vh - 212px);overflow-y: auto;">
            <div>
                <!-- Summary -->
                <table class="table table-striped table-hover">
                    <thead>
                        <tr>
                            <th>Gebäudetyp</th>
                            <th>Eigene Gebäude</th>
                            <th>Verbandsgebäude</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Krankenhäuser</td>
                            <td id="summary-hospitals-occupancy">
                                <div class="row">
                                    <div class="col-md-12">
                                        <div class="loader">
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td id="summary-alliance-hospitals-occupancy">
                                <div class="row">
                                    <div class="col-md-12">
                                        <div class="loader">
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                        </div>
                                    </div>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>Zellen</td>
                            <td id="summary-cells-occupancy">
                                <div class="row">
                                    <div class="col-md-12">
                                        <div class="loader">
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td id="summary-alliance-cells-occupancy">
                                <div class="row">
                                    <div class="col-md-12">
                                        <div class="loader">
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                        </div>
                                    </div>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>Feuerwehrschulen</td>
                            <td id="summary-fire-academies-occupancy">
                                <div class="row">
                                    <div class="col-md-12">
                                        <div class="loader">
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td id="summary-alliance-fire-academies-occupancy">
                                <div class="row">
                                    <div class="col-md-12">
                                        <div class="loader">
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                        </div>
                                    </div>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>Rettungsschulen</td>
                            <td id="summary-rescue-academies-occupancy">
                                <div class="row">
                                    <div class="col-md-12">
                                        <div class="loader">
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td id="summary-alliance-rescue-academies-occupancy">
                                <div class="row">
                                    <div class="col-md-12">
                                        <div class="loader">
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                        </div>
                                    </div>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>Polizeischulen</td>
                            <td id="summary-police-academies-occupancy">
                                <div class="row">
                                    <div class="col-md-12">
                                        <div class="loader">
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td id="summary-alliance-police-academies-occupancy">
                                <div class="row">
                                    <div class="col-md-12">
                                        <div class="loader">
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                        </div>
                                    </div>
                                </div>
                            </td>
                        </tr>
                        <tr>
                        <tr>
                            <td>Schule für Seefahrt und Seenotrettung</td>
                            <td id="summary-search-and-rescue-academies-occupancy">
                                <div class="row">
                                    <div class="col-md-12">
                                        <div class="loader">
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td id="summary-alliance-search-and-rescue-academies-occupancy">
                                <div class="row">
                                    <div class="col-md-12">
                                        <div class="loader">
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                        </div>
                                    </div>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>THW Bundesschulen</td>
                            <td id="summary-technical-aid-academies-occupancy">
                                <div class="row">
                                    <div class="col-md-12">
                                        <div class="loader">
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td id="summary-alliance-technical-aid-academies-occupancy">
                                <div class="row">
                                    <div class="col-md-12">
                                        <div class="loader">
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                        </div>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <hr class="divider">
                <!-- Nav tabs -->
                <ul class="nav nav-tabs" role="tablist">
                    <li role="presentation" class="active">
                        <a href="#hospitals-panel" aria-controls="hospitals-panel" role="tab" data-toggle="tab"><span class="glyphicon glyphicon-bed" aria-hidden="true"></span> Krankenhäuser</a>
                    </li>
                    <li role="presentation">
                        <a href="#alliance-hospitals-panel" aria-controls="alliance-hospitals-panel" role="tab" data-toggle="tab"><span class="glyphicon glyphicon-bed" aria-hidden="true"></span> Verbands-Krankenhäuser</a>
                    </li>
                    <li role="presentation">
                        <a href="#cells-panel" aria-controls="cells-panel" role="tab" data-toggle="tab"><span class="glyphicon glyphicon-user" aria-hidden="true"></span> Zellen</a>
                    </li>
                    <li role="presentation">
                        <a href="#alliance-cells-panel" aria-controls="alliance-cells-panel" role="tab" data-toggle="tab"><span class="glyphicon glyphicon-user" aria-hidden="true"></span> Verbandszellen</a>
                    </li>
                    <li role="presentation">
                        <a href="#schools-panel" aria-controls="schools-panel" role="tab" data-toggle="tab"><span class="glyphicon glyphicon-blackboard" aria-hidden="true"></span> Schulen</a>
                    </li>
                    <li role="presentation">
                        <a href="#alliance-schools-panel" aria-controls="alliance-schools-panel" role="tab" data-toggle="tab"><span class="glyphicon glyphicon-blackboard" aria-hidden="true"></span> Verbandsschulen</a>
                    </li>
                </ul>
                <!-- Tab panes -->
                <div class="tab-content">
                    <div role="tabpanel" class="tab-pane active" id="hospitals-panel">
                        <div id="hospitals-occupancy">
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
                    <div role="tabpanel" class="tab-pane" id="alliance-hospitals-panel">
                        <div id="alliance-hospitals-occupancy">
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
                    <div role="tabpanel" class="tab-pane" id="cells-panel">
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
                    <div role="tabpanel" class="tab-pane" id="alliance-cells-panel">
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
                    <div role="tabpanel" class="tab-pane" id="schools-panel">
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
                    <div role="tabpanel" class="tab-pane" id="alliance-schools-panel">
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
            </div>
        </div>
    </div>
</div>
`;
    document.body.appendChild(modal);
  }
 
  function addStyle() {
    const style =
      ".loader{width:100px;height:100px;border-radius:100%;position:relative;margin:0 auto;top:40px;left:-2.5px}.loader span{display:inline-block;width:5px;height:20px;background-color:#c9302c}.loader span:first-child{animation:1s ease-in-out infinite grow}.loader span:nth-child(2){animation:1s ease-in-out .15s infinite grow}.loader span:nth-child(3){animation:1s ease-in-out .3s infinite grow}.loader span:nth-child(4){animation:1s ease-in-out .45s infinite grow}@keyframes grow{0%,100%{-webkit-transform:scaleY(1);-ms-transform:scaleY(1);-o-transform:scaleY(1);transform:scaleY(1)}50%{-webkit-transform:scaleY(1.8);-ms-transform:scaleY(1.8);-o-transform:scaleY(1.8);transform:scaleY(1.8)}}";
 
    const styleElement = document.createElement("style");
    styleElement.innerHTML = style;
    document.head.appendChild(styleElement);
  }
 
  async function fetchBuildings() {
    if (buildings) {
      return buildings;
    }
 
    buildings = await fetch("/api/buildings")
      .then(response => response.json())
      .then(buildings => {
        return buildings.sort((a, b) => {
          if (a.caption < b.caption) return -1;
          if (a.caption > b.caption) return 1;
          return 0;
        });
      });
 
    return buildings;
  }
 
  async function fetchAllianceBuildings() {
    if (allianceBuildings) {
      return allianceBuildings;
    }
 
    allianceBuildings = await fetch("/api/alliance_buildings")
      .then(response => response.json())
      .then(buildings => {
        return buildings.sort((a, b) => {
          if (a.caption < b.caption) return -1;
          if (a.caption > b.caption) return 1;
          return 0;
        });
      });
 
    return allianceBuildings;
  }
 
  function renderProgressbarAbsolute(capacity, used) {
    return renderProgressbar(capacity, used, used + "/" + capacity);
  }
 
  function renderProgressbarRelative(capacity, used) {
    let occupancy = 0;
    if (capacity > 0) {
      occupancy = (used / capacity) * 100;
    }
 
    return renderProgressbar(capacity, used, Math.round(occupancy) + "%");
  }
 
  function renderProgressbar(capacity, used, innerText) {
    const occupancy = (used / capacity) * 100;
 
    let progressBarColor = "progress-bar-success";
    if (occupancy >= 80) {
      progressBarColor = "progress-bar-danger";
    } else if (occupancy >= 40) {
      progressBarColor = "progress-bar-warning";
    }
 
    const progressBarInner = document.createElement("div");
    progressBarInner.classList.add("progress-bar");
    progressBarInner.classList.add(progressBarColor);
    progressBarInner.setAttribute("role", "progressbar");
    progressBarInner.setAttribute("aria-valuenow", used);
    progressBarInner.setAttribute("aria-valuemin", "0");
    progressBarInner.setAttribute("aria-valuemax", capacity);
    progressBarInner.setAttribute("style", "width: " + occupancy + "%;");
    progressBarInner.innerText = innerText;
 
    const progressBar = document.createElement("div");
    progressBar.classList.add("progress");
 
    progressBar.appendChild(progressBarInner);
 
    return progressBar;
  }
 
  function renderHospitalsTable(hospitals) {
    const hospitalTable = document.createElement("table");
    hospitalTable.classList.add("table", "table-striped", "table-hover", "table-condensed");
 
    const hospitalTableHeader = document.createElement("thead");
    const hospitalTableHeaderRow = document.createElement("tr");
    const hospitalTableHeaderCaption = document.createElement("th");
    hospitalTableHeaderCaption.innerText = "Krankenhaus";
    const hospitalTableHeaderLevel = document.createElement("th");
    hospitalTableHeaderLevel.innerText = "Kapazität";
    const hospitalTableHeaderAllianceShare = document.createElement("th");
    hospitalTableHeaderAllianceShare.innerText = "Provision";
    const hospitalTableHeaderOccupancy = document.createElement("th");
    hospitalTableHeaderOccupancy.innerText = "Auslastung";
 
    hospitalTableHeaderRow.appendChild(hospitalTableHeaderCaption);
    hospitalTableHeaderRow.appendChild(hospitalTableHeaderLevel);
    hospitalTableHeaderRow.appendChild(hospitalTableHeaderAllianceShare);
    hospitalTableHeaderRow.appendChild(hospitalTableHeaderOccupancy);
    hospitalTableHeader.appendChild(hospitalTableHeaderRow);
 
    const hospitalTableBody = document.createElement("tbody");
    hospitals.forEach(hospital => {
      const capacity = hospital.level + 10;
 
      let levelColor = "warning";
      if (capacity === 30) {
        levelColor = "success";
      }
 
      const capacitySpan = document.createElement("span");
      capacitySpan.classList.add("label", "label-" + levelColor);
      capacitySpan.innerText = capacity;
 
      let creditsText = "Nicht geteilt";
      let creditsClass = "warning";
      if (hospital.hasOwnProperty("alliance_share_credits_percentage")) {
        if (hospital.alliance_share_credits_percentage === 10) {
          creditsClass = "success";
        }
        creditsText = hospital.alliance_share_credits_percentage + "%";
      } else {
        creditsClass = "danger";
      }
 
      const creditsSpan = document.createElement("span");
      creditsSpan.classList.add("label", "label-" + creditsClass);
      creditsSpan.innerText = creditsText;
 
      const buildingLink = document.createElement("a");
      buildingLink.href = "/buildings/" + hospital.id;
      buildingLink.innerText = hospital.caption;
      buildingLink.setAttribute("target", "_blank");
 
      const hospitalTableRow = document.createElement("tr");
      const hospitalTableRowCaption = document.createElement("td");
      hospitalTableRowCaption.appendChild(buildingLink);
      const hospitalTableRowLevel = document.createElement("td");
      hospitalTableRowLevel.appendChild(capacitySpan);
      const hospitalTableRowAllianceShare = document.createElement("td");
      hospitalTableRowAllianceShare.appendChild(creditsSpan);
      const hospitalTableRowOccupancy = document.createElement("td");
      hospitalTableRowOccupancy.appendChild(renderProgressbarAbsolute(hospital.level + 10, hospital.patient_count));
 
      hospitalTableRow.appendChild(hospitalTableRowCaption);
      hospitalTableRow.appendChild(hospitalTableRowLevel);
      hospitalTableRow.appendChild(hospitalTableRowAllianceShare);
      hospitalTableRow.appendChild(hospitalTableRowOccupancy);
      hospitalTableBody.appendChild(hospitalTableRow);
    });
 
    hospitalTable.appendChild(hospitalTableHeader);
    hospitalTable.appendChild(hospitalTableBody);
 
    return hospitalTable;
  }
 
  function calculateNumberOfHospitalsAndTotalCapacity(hospitals) {
    let totalCapacity = 0;
 
    hospitals.forEach(hospital => {
      totalCapacity += hospital.level + 10;
    });
 
    // Large hospital extension adds 10 beds
    let largeHospitalExtension = hospitals.find(hospital =>
      hospital.extensions.find(extension => extension.type_id === 9 && extension.available && extension.enabled),
    );
    if (largeHospitalExtension !== undefined) {
      totalCapacity += 10;
    }
 
    return totalCapacity;
  }
 
  async function renderHospitals() {
    await fetchBuildings()
      .then(buildings => buildings.filter(building => building.building_type === 4))
      .then(hospitals => {
        const hospitalTable = renderHospitalsTable(hospitals);
 
        const totalCapacity = calculateNumberOfHospitalsAndTotalCapacity(hospitals);
 
        const totalPatients = hospitals.reduce((total, hospital) => {
          return total + hospital.patient_count;
        }, 0);
 
        const freeCapacity = totalCapacity - totalPatients;
 
        const infoParagraph = document.createElement("p");
        infoParagraph.innerText =
          freeCapacity.toLocaleString() + " von " + totalCapacity.toLocaleString() + " Betten sind frei";
 
        const summaryHospitalsOccupancyDiv = document.getElementById("summary-hospitals-occupancy");
        summaryHospitalsOccupancyDiv.innerHTML = "";
        summaryHospitalsOccupancyDiv.appendChild(renderProgressbarRelative(totalCapacity, totalPatients));
        summaryHospitalsOccupancyDiv.appendChild(infoParagraph);
 
        const hospitalsOccupancyDiv = document.getElementById("hospitals-occupancy");
        hospitalsOccupancyDiv.innerHTML = "";
        hospitalsOccupancyDiv.appendChild(hospitalTable);
      });
  }
 
  async function renderAllianceHospitals() {
    await fetchAllianceBuildings()
      .then(buildings => buildings.filter(building => building.building_type === 4))
      .then(hospitals => {
        const hospitalTable = renderHospitalsTable(hospitals);
 
        const totalCapacity = calculateNumberOfHospitalsAndTotalCapacity(hospitals);
 
        const totalPatients = hospitals.reduce((total, hospital) => {
          return total + hospital.patient_count;
        }, 0);
 
        const freeCapacity = totalCapacity - totalPatients;
 
        const infoParagraph = document.createElement("p");
        infoParagraph.innerText =
          freeCapacity.toLocaleString() + " von " + totalCapacity.toLocaleString() + " Betten sind frei";
 
        const summaryHospitalsOccupancyDiv = document.getElementById("summary-alliance-hospitals-occupancy");
        summaryHospitalsOccupancyDiv.innerHTML = "";
        summaryHospitalsOccupancyDiv.appendChild(renderProgressbarRelative(totalCapacity, totalPatients));
        summaryHospitalsOccupancyDiv.appendChild(infoParagraph);
 
        const hospitalsOccupancyDiv = document.getElementById("alliance-hospitals-occupancy");
        hospitalsOccupancyDiv.innerHTML = "";
        hospitalsOccupancyDiv.appendChild(hospitalTable);
      });
  }
 
  function renderCellsTable(buildings) {
    const cellsTable = document.createElement("table");
    cellsTable.classList.add("table", "table-striped");
 
    const cellsTableHeaderRow = document.createElement("tr");
    const cellsTableHeaderCaption = document.createElement("th");
    cellsTableHeaderCaption.innerText = "Name";
    const cellsTableHeaderCapacity = document.createElement("th");
    cellsTableHeaderCapacity.innerText = "Kapazität";
    const cellsTableHeaderProvision = document.createElement("th");
    cellsTableHeaderProvision.innerText = "Provision";
    const cellsTableHeaderOccupancy = document.createElement("th");
    cellsTableHeaderOccupancy.innerText = "Auslastung";
 
    const cellsTableHeader = document.createElement("thead");
    cellsTableHeaderRow.appendChild(cellsTableHeaderCaption);
    cellsTableHeaderRow.appendChild(cellsTableHeaderCapacity);
    cellsTableHeaderRow.appendChild(cellsTableHeaderProvision);
    cellsTableHeaderRow.appendChild(cellsTableHeaderOccupancy);
    cellsTableHeader.appendChild(cellsTableHeaderRow);
 
    const cellsTableBody = document.createElement("tbody");
    buildings.forEach(building => {
      let capacityClass = "warning";
 
      if (building.smallBuilding === false && (building.numberOfCells === 10 || building.numberOfCells === 20)) {
        capacityClass = "success";
      }
      if (building.smallBuilding === true && building.numberOfCells === 2) {
        capacityClass = "success";
      }
 
      const capacitySpan = document.createElement("span");
      capacitySpan.classList.add("label", "label-" + capacityClass);
      capacitySpan.innerText = building.numberOfCells;
 
      const buildingLink = document.createElement("a");
      buildingLink.href = "/buildings/" + building.id;
      buildingLink.innerText = building.caption;
      buildingLink.setAttribute("target", "_blank");
 
      let creditsText = "Nicht geteilt";
      let provisionClass = "warning";
      if (building.provision !== undefined) {
        if (building.provision === 10) {
          provisionClass = "success";
        }
 
        creditsText = building.provision + "%";
      } else {
        provisionClass = "danger";
      }
 
      const provisionSpan = document.createElement("span");
      provisionSpan.classList.add("label", "label-" + provisionClass);
      provisionSpan.innerText = creditsText;
 
      const cellsTableRowCaption = document.createElement("td");
      cellsTableRowCaption.appendChild(buildingLink);
      const cellsTableRowCapacity = document.createElement("td");
      cellsTableRowCapacity.appendChild(capacitySpan);
      const cellsTableRowProvision = document.createElement("td");
      cellsTableRowProvision.appendChild(provisionSpan);
      const cellsTableRowOccupancy = document.createElement("td");
      cellsTableRowOccupancy.append(renderProgressbarAbsolute(building.numberOfCells, building.numberOfPrisoners));
 
      const cellsTableRow = document.createElement("tr");
      cellsTableRow.appendChild(cellsTableRowCaption);
      cellsTableRow.appendChild(cellsTableRowCapacity);
      cellsTableRow.appendChild(cellsTableRowProvision);
      cellsTableRow.appendChild(cellsTableRowOccupancy);
      cellsTableBody.appendChild(cellsTableRow);
    });
 
    cellsTable.appendChild(cellsTableHeader);
    cellsTable.appendChild(cellsTableBody);
 
    return cellsTable;
  }
 
  function calculateNumberOfCells(policeStation) {
    let numberOfCells = policeStation.extensions.filter(
      extension => extension.type_id >= 0 && extension.type_id <= 9,
    ).length;
 
    // Large scale custody extension adds 10 cells
    let largeScaleCustodyExtension = policeStation.extensions.find(extension => extension.type_id === 15);
    if (
      largeScaleCustodyExtension !== undefined &&
      largeScaleCustodyExtension.available &&
      largeScaleCustodyExtension.enabled
    ) {
      numberOfCells += 10;
    }
 
    return numberOfCells;
  }
 
  async function renderCells() {
    // policeStations constitutes an array of objects which have the following structure:
    // {
    //   id: 123456,
    //   caption: "Polizeistation",
    //   buildingType: 6, // Either 6 or 19
    //   numberOfCells: 10, // sum of all extensions of type id 0 through 9
    //   numberOfPrisoners: 5, // taken from prisoner_count of the building
    // }
 
    let policeStations = await fetchBuildings()
      .then(buildings => buildings.filter(building => building.building_type === 6 || building.building_type === 19))
      .then(policeStations => {
        return policeStations.map(policeStation => {
          return {
            id: policeStation.id,
            caption: policeStation.caption,
            buildingType: policeStation.building_type,
            smallBuilding: policeStation.small_building,
            numberOfCells: calculateNumberOfCells(policeStation),
            numberOfPrisoners: policeStation.prisoner_count,
            provision: policeStation.alliance_share_credits_percentage,
          };
        });
      });
 
    const totalCapacity = policeStations.reduce(
      (accumulator, currentValue) => accumulator + currentValue.numberOfCells,
      0,
    );
    const totalOccupancy = policeStations.reduce(
      (accumulator, currentValue) => accumulator + currentValue.numberOfPrisoners,
      0,
    );
 
    const freeCapacity = totalCapacity - totalOccupancy;
 
    const infoParagraph = document.createElement("p");
    infoParagraph.innerText =
      freeCapacity.toLocaleString() + " von " + totalCapacity.toLocaleString() + " Zellen sind frei";
 
    const summaryCellsOccupancyDiv = document.getElementById("summary-cells-occupancy");
    summaryCellsOccupancyDiv.innerHTML = "";
    summaryCellsOccupancyDiv.appendChild(renderProgressbarRelative(totalCapacity, totalOccupancy));
    summaryCellsOccupancyDiv.appendChild(infoParagraph);
 
    const cellsPanel = document.getElementById("cells-panel");
    cellsPanel.innerHTML = "";
    cellsPanel.appendChild(renderCellsTable(policeStations));
  }
 
  function renderAllianceCellsTable(policeStations) {
    const cellsTable = document.createElement("table");
    cellsTable.classList.add("table", "table-bordered", "table-striped");
 
    const cellsTableHeaderRow = document.createElement("tr");
    const cellsTableHeaderCaption = document.createElement("th");
    cellsTableHeaderCaption.innerText = "Gebäude";
    const cellsTableHeaderCapacity = document.createElement("th");
    cellsTableHeaderCapacity.innerText = "Kapazität";
    const cellsTableHeaderProvision = document.createElement("th");
    cellsTableHeaderProvision.innerText = "Provision";
    const cellsTableHeaderOccupancy = document.createElement("th");
    cellsTableHeaderOccupancy.innerText = "Auslastung";
 
    const cellsTableHeader = document.createElement("thead");
    cellsTableHeaderRow.appendChild(cellsTableHeaderCaption);
    cellsTableHeaderRow.appendChild(cellsTableHeaderCapacity);
    cellsTableHeaderRow.appendChild(cellsTableHeaderProvision);
    cellsTableHeaderRow.appendChild(cellsTableHeaderOccupancy);
    cellsTableHeader.appendChild(cellsTableHeaderRow);
 
    const cellsTableBody = document.createElement("tbody");
    policeStations.forEach(building => {
      let capacityClass = "warning";
 
      if (building.smallBuilding === false && (building.numberOfCells === 10 || building.numberOfCells === 20)) {
        capacityClass = "success";
      }
      if (building.smallBuilding === true && building.numberOfCells === 2) {
        capacityClass = "success";
      }
 
      const capacitySpan = document.createElement("span");
      capacitySpan.classList.add("label", "label-" + capacityClass);
      capacitySpan.innerText = building.numberOfCells;
 
      const buildingLink = document.createElement("a");
      buildingLink.href = "/buildings/" + building.id;
      buildingLink.innerText = building.caption;
      buildingLink.setAttribute("target", "_blank");
 
      let provisionClass = "warning";
      if (building.provision === 0) {
        provisionClass = "success";
      }
 
      const provisionSpan = document.createElement("span");
      provisionSpan.classList.add("label", "label-" + provisionClass);
      provisionSpan.innerText = building.provision;
      if (!isNaN(building.provision)) {
        provisionSpan.innerText += "%";
      }
 
      const cellsTableRowCaption = document.createElement("td");
      cellsTableRowCaption.appendChild(buildingLink);
      const cellsTableRowCapacity = document.createElement("td");
      cellsTableRowCapacity.appendChild(capacitySpan);
      const cellsTableRowProvision = document.createElement("td");
      cellsTableRowProvision.appendChild(provisionSpan);
      const cellsTableRowOccupancy = document.createElement("td");
      cellsTableRowOccupancy.appendChild(renderProgressbarAbsolute(building.numberOfCells, building.numberOfPrisoners));
 
      const cellsTableRow = document.createElement("tr");
      cellsTableRow.appendChild(cellsTableRowCaption);
      cellsTableRow.appendChild(cellsTableRowCapacity);
      cellsTableRow.appendChild(cellsTableRowProvision);
      cellsTableRow.appendChild(cellsTableRowOccupancy);
 
      cellsTableBody.appendChild(cellsTableRow);
    });
 
    cellsTable.appendChild(cellsTableHeader);
    cellsTable.appendChild(cellsTableBody);
 
    return cellsTable;
  }
 
  async function renderAllianceCells() {
    let alliancePoliceStations = await fetchAllianceBuildings()
      .then(buildings => buildings.filter(building => building.building_type === 16))
      .then(policeStations => {
        return policeStations.map(policeStation => {
          return {
            id: policeStation.id,
            caption: policeStation.caption,
            buildingType: policeStation.building_type,
            smallBuilding: policeStation.small_building,
            numberOfCells: calculateNumberOfCells(policeStation),
            numberOfPrisoners: policeStation.prisoner_count,
            provision: policeStation.alliance_share_credits_percentage,
          };
        });
      });
 
    const totalCapacity = alliancePoliceStations.reduce(
      (accumulator, currentValue) => accumulator + currentValue.numberOfCells,
      0,
    );
    const totalOccupancy = alliancePoliceStations.reduce(
      (accumulator, currentValue) => accumulator + currentValue.numberOfPrisoners,
      0,
    );
 
    const freeCapacity = totalCapacity - totalOccupancy;
 
    const infoParagraph = document.createElement("p");
    infoParagraph.innerText =
      freeCapacity.toLocaleString() + " von " + totalCapacity.toLocaleString() + " Zellen sind frei";
 
    const summaryCellsOccupancyDiv = document.getElementById("summary-alliance-cells-occupancy");
    summaryCellsOccupancyDiv.innerHTML = "";
    summaryCellsOccupancyDiv.appendChild(renderProgressbarRelative(totalCapacity, totalOccupancy));
    summaryCellsOccupancyDiv.appendChild(infoParagraph);
 
    const cellsPanel = document.getElementById("alliance-cells-panel");
    cellsPanel.innerHTML = "";
    cellsPanel.appendChild(renderAllianceCellsTable(alliancePoliceStations));
  }
 
  function renderSchoolsTable(schools, name) {
    const schoolsTable = document.createElement("table");
    schoolsTable.classList.add("table", "table-bordered", "table-striped");
 
    const schoolsTableHeaderRow = document.createElement("tr");
    const schoolsTableHeaderCaption = document.createElement("th");
    schoolsTableHeaderCaption.innerText = name;
    const schoolsTableHeaderCapacity = document.createElement("th");
    schoolsTableHeaderCapacity.innerText = "Kapazität";
    const schoolsTableHeaderOccupancy = document.createElement("th");
    schoolsTableHeaderOccupancy.innerText = "Auslastung";
 
    const schoolsTableHeader = document.createElement("thead");
    schoolsTableHeaderRow.appendChild(schoolsTableHeaderCaption);
    schoolsTableHeaderRow.appendChild(schoolsTableHeaderCapacity);
    schoolsTableHeaderRow.appendChild(schoolsTableHeaderOccupancy);
    schoolsTableHeader.appendChild(schoolsTableHeaderRow);
 
    const schoolsTableBody = document.createElement("tbody");
    schools.forEach(building => {
      const buildingLink = document.createElement("a");
      buildingLink.href = "/buildings/" + building.id;
      buildingLink.innerText = building.caption;
      buildingLink.setAttribute("target", "_blank");
 
      let capacityClass = "warning";
      if (building.capacity === 4) {
        capacityClass = "success";
      }
 
      let capacitySpan = document.createElement("span");
      capacitySpan.classList.add("label", "label-" + capacityClass);
      capacitySpan.innerText = building.capacity;
 
      const schoolsTableRowCaption = document.createElement("td");
      schoolsTableRowCaption.appendChild(buildingLink);
      const schoolsTableRowCapacity = document.createElement("td");
      schoolsTableRowCapacity.appendChild(capacitySpan);
      const schoolsTableRowOccupancy = document.createElement("td");
      schoolsTableRowOccupancy.appendChild(renderProgressbarAbsolute(building.capacity, building.occupancy));
 
      const schoolsTableRow = document.createElement("tr");
      schoolsTableRow.appendChild(schoolsTableRowCaption);
      schoolsTableRow.appendChild(schoolsTableRowCapacity);
      schoolsTableRow.appendChild(schoolsTableRowOccupancy);
 
      schoolsTableBody.appendChild(schoolsTableRow);
    });
 
    schoolsTable.appendChild(schoolsTableHeader);
    schoolsTable.appendChild(schoolsTableBody);
 
    return schoolsTable;
  }
 
  async function getSchoolsMeta(buildingTypeId) {
    return await fetchBuildings()
      .then(buildings => buildings.filter(building => building.building_type === buildingTypeId))
      .then(schools => {
        return schools.map(school => {
          let numberOfRooms = school.extensions.filter(
            extension => extension.type_id >= 0 && extension.type_id <= 2,
          ).length;
 
          return {
            id: school.id,
            caption: school.caption,
            buildingType: school.building_type,
            capacity: 1 + numberOfRooms,
            occupancy: school.schoolings.length,
            provision: school.alliance_share_credits_percentage,
          };
        });
      });
  }
 
  async function renderSchools() {
    const schoolTypes = [
      { id: 1, name: "Feuerwehrschulen", divId: "summary-fire-academies-occupancy" },
      { id: 3, name: "Rettungsschulen", divId: "summary-rescue-academies-occupancy" },
      { id: 8, name: "Polizeischulen", divId: "summary-police-academies-occupancy" },
      { id: 10, name: "THW Bundesschulen", divId: "summary-technical-aid-academies-occupancy" },
      { id: 27, name: "Schule für Seefahrt und Seenotrettung", divId: "summary-search-and-rescue-academies-occupancy" },
    ];
 
    const schoolsPanel = document.getElementById("schools-panel");
    schoolsPanel.innerHTML = "";
 
    for (const schoolType of schoolTypes) {
      let schools = await getSchoolsMeta(schoolType.id);
 
      const totalCapacity = schools.reduce((accumulator, currentValue) => accumulator + currentValue.capacity, 0);
      const totalOccupancy = schools.reduce((accumulator, currentValue) => accumulator + currentValue.occupancy, 0);
 
      const freeCapacity = totalCapacity - totalOccupancy;
 
      const infoParagraph = document.createElement("p");
      infoParagraph.innerText =
        freeCapacity.toLocaleString() + " von " + totalCapacity.toLocaleString() + " Klassenräumen sind frei";
 
      const summaryCellsOccupancyDiv = document.getElementById(schoolType.divId);
      summaryCellsOccupancyDiv.innerHTML = "";
      summaryCellsOccupancyDiv.appendChild(renderProgressbarRelative(totalCapacity, totalOccupancy));
      summaryCellsOccupancyDiv.appendChild(infoParagraph);
 
      schoolsPanel.appendChild(renderSchoolsTable(schools, schoolType.name));
    }
  }
 
  async function getAllianceSchoolsMeta(buildingTypeId) {
    return await fetchAllianceBuildings()
      .then(buildings => buildings.filter(building => building.building_type === buildingTypeId))
      .then(schools => {
        return schools.map(school => {
          let numberOfRooms = school.extensions.filter(
            extension => extension.type_id >= 0 && extension.type_id <= 2,
          ).length;
 
          return {
            id: school.id,
            caption: school.caption,
            buildingType: school.building_type,
            capacity: 1 + numberOfRooms,
            // Return school.schoolings.length as occupancy
            // if school.schoolings is undefined, apply 0
            occupancy: school.schoolings ? school.schoolings.length : 0,
            provision: school.alliance_share_credits_percentage,
          };
        });
      });
  }
 
  async function renderAllianceSchools() {
    const schoolTypes = [
      { id: 1, name: "Feuerwehrschulen", divId: "summary-alliance-fire-academies-occupancy" },
      { id: 3, name: "Rettungsschulen", divId: "summary-alliance-rescue-academies-occupancy" },
      { id: 8, name: "Polizeischulen", divId: "summary-alliance-police-academies-occupancy" },
      { id: 10, name: "THW Bundesschulen", divId: "summary-alliance-technical-aid-academies-occupancy" },
      {
        id: 27,
        name: "Schule für Seefahrt und Seenotrettung",
        divId: "summary-alliance-search-and-rescue-academies-occupancy",
      },
    ];
 
    const schoolsPanel = document.getElementById("alliance-schools-panel");
    schoolsPanel.innerHTML = "";
 
    for (const schoolType of schoolTypes) {
      let allianceSchools = await getAllianceSchoolsMeta(schoolType.id);
 
      const totalCapacity = allianceSchools.reduce(
        (accumulator, currentValue) => accumulator + currentValue.capacity,
        0,
      );
      const totalOccupancy = allianceSchools.reduce(
        (accumulator, currentValue) => accumulator + currentValue.occupancy,
        0,
      );
 
      const freeCapacity = totalCapacity - totalOccupancy;
 
      const infoParagraph = document.createElement("p");
      infoParagraph.innerText =
        freeCapacity.toLocaleString() + " von " + totalCapacity.toLocaleString() + " Klassenräumen sind frei";
 
      const summarySchoolsOccupancyDiv = document.getElementById(schoolType.divId);
      summarySchoolsOccupancyDiv.innerHTML = "";
      summarySchoolsOccupancyDiv.appendChild(renderProgressbarRelative(totalCapacity, totalOccupancy));
      summarySchoolsOccupancyDiv.appendChild(infoParagraph);
 
      schoolsPanel.appendChild(renderSchoolsTable(allianceSchools, schoolType.name));
    }
  }
 
  function buttonClick(event) {
    event.preventDefault();
 
    $("#occupancy-modal").modal("show");
 
    renderHospitals();
    renderAllianceHospitals();
    renderCells();
    renderAllianceCells();
    renderSchools();
    renderAllianceSchools();
  }
 
  function main() {
    addStyle();
    addModal();
    addMenuEntry();
  }
 
  main();
})();