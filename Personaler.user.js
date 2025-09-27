// ==UserScript==
// @name        * Personaler
// @namespace   bos-ernie.leitstellenspiel.de
// @version     1.1.0
// @license     BSD-3-Clause
// @author      BOS-Ernie
// @description Überprüft das Personalsoll und die Werbephasen in allen Gebäuden
// @match       https://www.leitstellenspiel.de/
// @icon        https://www.google.com/s2/favicons?sz=64&domain=leitstellenspiel.de
// @run-at      document-idle
// @grant       none
// ==/UserScript==
 
/* global $ */
 
(function () {
  "use strict";
 
  const defaultSettings = {
    "building-type-0": 250,
    "building-type-2": 80,
    "building-type-6": 300,
    "building-type-9": 140,
    "building-type-11": 215,
    "building-type-12": 34,
    "building-type-13": 400,
    "building-type-18": 250,
    "building-type-19": 300,
    "building-type-20": 80,
  };
 
  const buildingsWithPersonal = [0, 2, 6, 9, 11, 12, 13, 18, 19, 20];
 
  function addStyle() {
    const style =
      ".loader{width:100px;height:100px;border-radius:100%;position:relative;margin:0 auto;top:40px;left:-2.5px}.loader span{display:inline-block;width:5px;height:20px;background-color:#c9302c}.loader span:first-child{animation:1s ease-in-out infinite grow}.loader span:nth-child(2){animation:1s ease-in-out .15s infinite grow}.loader span:nth-child(3){animation:1s ease-in-out .3s infinite grow}.loader span:nth-child(4){animation:1s ease-in-out .45s infinite grow}@keyframes grow{0%,100%{-webkit-transform:scaleY(1);-ms-transform:scaleY(1);-o-transform:scaleY(1);transform:scaleY(1)}50%{-webkit-transform:scaleY(1.8);-ms-transform:scaleY(1.8);-o-transform:scaleY(1.8);transform:scaleY(1.8)}}";
 
    const styleElement = document.createElement("style");
    styleElement.innerHTML = style;
    document.head.appendChild(styleElement);
  }
 
  function addMenuEntry() {
    const profileMenu = document.getElementById("logout_button").parentElement.parentElement;
    const divider = document.createElement("li");
    divider.setAttribute("class", "divider");
    divider.setAttribute("role", "presentation");
 
    profileMenu.append(divider);
 
    const bedIcon = document.createElement("span");
    bedIcon.setAttribute("class", "glyphicon glyphicon-user");
 
    const button = document.createElement("a");
    button.setAttribute("href", "javascript: void(0)");
    button.setAttribute("id", "personaler-button");
    button.append(bedIcon);
    button.append(" Personaler");
    button.addEventListener("click", menuEntryClick);
 
    const li = document.createElement("li");
    li.appendChild(button);
 
    profileMenu.append(li);
  }
 
  function addModal() {
    const modal = document.createElement("div");
    modal.className = "modal fade";
    modal.id = "personaler-modal";
    modal.setAttribute("tabindex", "-1");
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-labelledby", "personaler-modal-label");
    modal.setAttribute("aria-hidden", "true");
    modal.style.zIndex = "5000";
    modal.innerHTML = `<div class="modal-dialog modal-lg" role="document" style="width: 1280px;">
  <div class="modal-content">
    <div class="modal-header">
      <h1 class="modal-title" id="personaler-modal-label">
        <span class="glyphicon glyphicon-user" aria-hidden="true"></span> Personaler
      </h1>
      <button type="button" class="close" data-dismiss="modal" aria-label="Close">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
    <div class="modal-body" style="max-height: calc(100vh - 212px);overflow-y: auto;">
      <ul class="nav nav-tabs" role="tablist" style="margin-bottom: 10px">
        <li role="presentation" class="active">
          <a
            href="#tab-buildings-with-incorrect-personal-count-target"
            aria-controls="tab-buildings-with-incorrect-personal-count-target"
            role="tab"
            data-toggle="tab"
          >
            Gebäude mit falschem Personal (Soll)
          </a>
        </li>
        <li role="presentation">
          <a
            href="#tab-buildings-without-automatic-hiring"
            aria-controls="tab-buildings-without-automatic-hiring"
            role="tab"
            data-toggle="tab"
          >
            Gebäude ohne automatische Werbung
          </a>
        </li>
        <li role="presentation">
          <a href="#tab-settings" aria-controls="tab-settings" role="tab" data-toggle="tab">
            Einstellungen
          </a>
        </li>
      </ul>
      <div>
        <div class="tab-content">
          <div role="tabpanel" class="tab-pane active" id="tab-buildings-with-incorrect-personal-count-target">
            <div id="buildings-with-incorrect-personal-count-target">
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
          <div role="tabpanel" class="tab-pane" id="tab-buildings-without-automatic-hiring">
            <div id="buildings-without-automatic-hiring">
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
          <div role="tabpanel" class="tab-pane" id="tab-settings">
            <div id="settings">
              <h2>Personal (Soll)</h2>
              <form id="settings" class="form-horizontal">
                <div class="form-group">
                  <label for="building-type-0" class="col-sm-4 control-label">
                    Feuerwache
                  </label>
                  <div class="col-sm-1">
                    <input type="number" class="form-control" id="building-type-0" min="0" max="400" />
                  </div>
                </div>
                <div class="form-group">
                  <label for="building-type-18" class="col-sm-4 control-label">
                    Feuerwache (Kleinwache)
                  </label>
                  <div class="col-sm-1">
                    <input type="number" class="form-control" id="building-type-18" min="0" max="400" />
                  </div>
                </div>
                <div class="form-group">
                  <label for="building-type-2" class="col-sm-4 control-label">
                    Rettungswache
                  </label>
                  <div class="col-sm-1">
                    <input type="number" class="form-control" id="building-type-2" min="0" max="400" />
                  </div>
                </div>
                <div class="form-group">
                  <label for="building-type-20" class="col-sm-4 control-label">
                    Rettungswache (Kleinwache)
                  </label>
                  <div class="col-sm-1">
                    <input type="number" class="form-control" id="building-type-20" min="0" max="400" />
                  </div>
                </div>
                <div class="form-group">
                  <label for="building-type-6" class="col-sm-4 control-label">
                    Polizeiwache
                  </label>
                  <div class="col-sm-1">
                    <input type="number" class="form-control" id="building-type-6" min="0" max="400" />
                  </div>
                </div>
                <div class="form-group">
                  <label for="building-type-19" class="col-sm-4 control-label">
                    Polizeiwache (Kleinwache)
                  </label>
                  <div class="col-sm-1">
                    <input type="number" class="form-control" id="building-type-19" min="0" max="400" />
                  </div>
                </div>
                <div class="form-group">
                  <label for="building-type-11" class="col-sm-4 control-label">
                    Bereitschaftspolizei
                  </label>
                  <div class="col-sm-1">
                    <input type="number" class="form-control" id="building-type-11" min="0" max="400" />
                  </div>
                </div>
                <div class="form-group">
                  <label for="building-type-13" class="col-sm-4 control-label">
                    Polizeihubschrauberstation
                  </label>
                  <div class="col-sm-1">
                    <input type="number" class="form-control" id="building-type-13" min="0" max="400" />
                  </div>
                </div>
                <div class="form-group">
                  <label for="building-type-12" class="col-sm-4 control-label">
                    Schnelleinsatzgruppe (SEG)
                  </label>
                  <div class="col-sm-1">
                    <input type="number" class="form-control" id="building-type-12" min="0" max="400" />
                  </div>
                </div>
                <div class="form-group">
                  <label for="building-type-9" class="col-sm-4 control-label">
                    THW
                  </label>
                  <div class="col-sm-1">
                    <input type="number" class="form-control" id="building-type-9" min="0" max="400" />
                  </div>
                </div>
                <div class="form-group">
                  <div class="col-sm-offset-2 col-sm-2">
                    <button id="save-settings" type="submit" class="btn btn-success">
                      Speichern
                    </button>
                  </div>
                </div>
              </form>
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
 
  function menuEntryClick(event) {
    event.preventDefault();
    render();
 
    $("#personaler-modal").modal("show");
  }
 
  function getSettings() {
    return JSON.parse(localStorage.getItem("personalerSettings"));
  }
 
  function fillForm() {
    if (localStorage.getItem("personalerSettings") === null) {
      localStorage.setItem("personalerSettings", JSON.stringify(defaultSettings));
    }
 
    let settings = getSettings();
 
    for (let key in settings) {
      document.getElementById(key).value = settings[key];
    }
  }
 
  function saveSettings(event) {
    event.preventDefault();
 
    const saveButton = document.getElementById("save-settings");
 
    saveButton.disabled = true;
 
    saveButton.innerHTML = `
    <span class="glyphicon glyphicon-refresh glyphicon-refresh-animate"></span>
    Speichern...`;
 
    const settings = {};
    const inputs = document.querySelectorAll("#settings input");
    for (let i = 0; i < inputs.length; i++) {
      settings[inputs[i].id] = inputs[i].value;
    }
    localStorage.setItem("personalerSettings", JSON.stringify(settings));
 
    setTimeout(() => {
      saveButton.disabled = false;
      saveButton.innerHTML = '<span class="glyphicon glyphicon-ok"></span> Speichern';
    }, 250);
  }
 
  function getPersonalCountTarget(building_type) {
    const settings = getSettings();
    return settings["building-type-" + building_type];
  }
 
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
 
  async function getBuildingsWithIncorrectPersonalCountTarget() {
    const buildings = await getBuildings();
 
    return buildings.filter(
      building =>
        buildingsWithPersonal.includes(building.building_type) &&
        building.personal_count_target !== getPersonalCountTarget(building.building_type),
    );
  }
 
  async function getBuildingsWithoutAutomaticHiring() {
    const buildings = await getBuildings();
 
    return buildings.filter(
      building => buildingsWithPersonal.includes(building.building_type) && building.hiring_automatic !== true,
    );
  }
 
  async function render() {
    const saveButton = document.getElementById("save-settings");
    saveButton.addEventListener("click", saveSettings);
 
    fillForm();
 
    const buildingsWithIncorrectPersonalCountTarget = await getBuildingsWithIncorrectPersonalCountTarget();
    if (buildingsWithIncorrectPersonalCountTarget.length > 0) {
      const tabPersonalCountTarget = document.getElementById("buildings-with-incorrect-personal-count-target");
      tabPersonalCountTarget.innerHTML = `
<table class="table table-striped table-hover">
  <thead>
    <tr>
      <th>Gebäude</th>
      <th>Ist: Personal (Soll)</th>
      <th>Soll: Personal (Soll)</th>
      </tr>
  </thead>
  <tbody>
    ${buildingsWithIncorrectPersonalCountTarget
      .sort((a, b) => {
        if (a.caption < b.caption) {
          return -1;
        }
        if (a.caption > b.caption) {
          return 1;
        }
        return 0;
      })
      .map(
        building => `
    <tr>
      <td><a href="/buildings/${building.id}">${building.caption}</a></td>
      <td>${building.personal_count_target}</td>
      <td>${getPersonalCountTarget(building.building_type)}</td>
    </tr>
    `,
      )
      .join("")}
  </tbody>
</table>
`;
    } else {
      const tabPersonalCountTarget = document.getElementById("buildings-with-incorrect-personal-count-target");
      tabPersonalCountTarget.innerHTML = `
<div class="row">
  <div class="col-md-12 bg">
    <div class="alert alert-success" role="alert">
      <span class="glyphicon glyphicon-ok" aria-hidden="true"></span> Alle Gebäude haben das richtige Soll-Personal
    </div>
  </div>
</div>
`;
    }
 
    const tabHiring = document.getElementById("buildings-without-automatic-hiring");
    const buildingsWithoutAutomaticHiring = await getBuildingsWithoutAutomaticHiring();
    if (buildingsWithoutAutomaticHiring.length > 0) {
      tabHiring.innerHTML = `
<table class="table table-striped table-hover">
  <thead>
    <tr>
      <th>Gebäude</th>
      </tr>
  </thead>
  <tbody>
    ${buildingsWithoutAutomaticHiring
      .sort((a, b) => {
        if (a.caption < b.caption) {
          return -1;
        }
        if (a.caption > b.caption) {
          return 1;
        }
        return 0;
      })
      .map(
        building => `
    <tr>
      <td><a href="/buildings/${building.id}">${building.caption}</a></td>
    </tr>
    `,
      )
      .join("")}
  </tbody>
</table>
`;
    } else {
      tabHiring.innerHTML = `
<div class="row">
  <div class="col-md-12 bg">
    <div class="alert alert-success" role="alert">
      <span class="glyphicon glyphicon-ok" aria-hidden="true"></span> Alle Gebäude haben automatische Werbung aktiviert
    </div>
  </div>
</div>
`;
    }
  }
 
  async function main() {
    addStyle();
    addMenuEntry();
    addModal();
  }
 
  main();
})();