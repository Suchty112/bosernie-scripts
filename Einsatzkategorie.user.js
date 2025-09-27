// ==UserScript==
// @name        * Einsatzkategorie
// @namespace   bos-ernie.leitstellenspiel.de
// @version     1.3.0
// @license     BSD-3-Clause
// @author      BOS-Ernie
// @description Zeigt die Kategorie(n) eines Einsatzes in der Liste an
// @match       https://www.leitstellenspiel.de/
// @icon        https://www.google.com/s2/favicons?sz=64&domain=leitstellenspiel.de
// @resource    https://forum.leitstellenspiel.de/index.php?thread/25231-script-einsatzkategorie/
// @run-at      document-idle
// @grant       none
// ==/UserScript==
 
(function () {
  const categories = [
    {
      name: "airport",
      abbreviation: "FH",
      title: "Flughafen",
    },
    {
      name: "airport_specialization",
      abbreviation: "FHS",
      title: "Flughafen (Spezialisierung)",
    },
    {
      name: "ambulance",
      abbreviation: "RD",
      title: "Rettungsdienst",
    },
    {
      name: "coastal",
      abbreviation: "SNR",
      title: "Seenotrettung",
    },
    {
      name: "criminal_investigation",
      abbreviation: "K",
      title: "Kriminalpolizei",
    },
    {
      name: "energy_supply",
      abbreviation: "E",
      title: "Energieversorgung",
    },
    {
      name: "energy_supply_2",
      abbreviation: "E2",
      title: "Energieversorgung 2)",
    },
    {
      name: "factory_fire_brigade",
      abbreviation: "WF",
      title: "Werkfeuerwehr",
    },
    {
      name: "fire",
      abbreviation: "FW",
      title: "Feuerwehr",
    },
    {
      name: "mountain",
      abbreviation: "BR",
      title: "Bergrettung",
    },
    {
      name: "police",
      abbreviation: "P",
      title: "Polizei",
    },
    {
      name: "riot_police",
      abbreviation: "BP",
      title: "Bereitschaftspolizei",
    },
    {
      name: "seg",
      abbreviation: "SEG",
      title: "Schnelleinsatzgruppe",
    },
    {
      name: "seg_medical_service",
      abbreviation: "SEG2",
      title: "Schnelleinsatzgruppe 2)",
    },
    {
      name: "thw",
      abbreviation: "THW",
      title: "Technisches Hilfswerk",
    },
    {
      name: "water_rescue",
      abbreviation: "WR",
      title: "Wasserrettung",
    },
  ];
 
  let requirements;
 
  const originalFunc = missionMarkerAdd;
 
  missionMarkerAdd = async function (mission) {
    originalFunc.apply(this, arguments);
    await update(mission);
  };
 
  function getMissionTypeIdFromMission(mission) {
    const missionTypeId = mission.getAttribute("mission_type_id");
    if (missionTypeId === null) {
      return null;
    }
 
    let id = missionTypeId;
 
    const dataOverlayIndex = mission.getAttribute("data-overlay-index");
    if (dataOverlayIndex !== "null" && dataOverlayIndex !== null && dataOverlayIndex !== "") {
      id += "-" + dataOverlayIndex;
    }
 
    const dataAdditiveOverlays = mission.getAttribute("data-additive-overlays");
    if (dataAdditiveOverlays !== "null" && dataAdditiveOverlays !== null && dataAdditiveOverlays !== "") {
      id += "/" + dataAdditiveOverlays;
    }
 
    return id;
  }
 
  function areMissionsLoaded() {
    return (
      window.sessionStorage.hasOwnProperty("aMissions") &&
      JSON.parse(window.sessionStorage.aMissions).lastUpdate >= new Date().getTime() - 24 * 1000 * 60
    );
  }
 
  async function loadMissions() {
    await fetch("/einsaetze.json")
      .then(res => res.json())
      .then(data =>
        window.sessionStorage.setItem(
          "aMissions",
          JSON.stringify({
            lastUpdate: new Date().getTime(),
            value: data,
            user_id: window.user_id,
          }),
        ),
      );
  }
 
  function getCategoryByMissionTypeId(missionTypeId) {
    requirements = JSON.parse(window.sessionStorage.getItem("aMissions"));
 
    return requirements.value.filter(requirement => requirement.id === missionTypeId)[0];
  }
 
  function getMissionCategoriesElementByMissionId(missionId) {
    return document.getElementById("mission_categories_" + missionId);
  }
 
  function missionCategoriesElementExists(missionId) {
    return getMissionCategoriesElementByMissionId(missionId) !== null;
  }
 
  function addMissionCategoriesToMission(mission, categoryNames) {
    const missionId = mission.getAttribute("mission_id");
    const missionCategoriesElement = createMissionCategoriesElement(missionId, categoryNames);
 
    document.getElementById("mission_caption_" + missionId).before(missionCategoriesElement);
  }
 
  function updateMissionCategoriesInMission(childList, missionId, categoryNames) {
    for (let i = 0; i < childList.length; i++) {
      if (childList[i].id.indexOf("mission_categories_") === -1) {
        continue;
      }
 
      getMissionCategoriesElementByMissionId(missionId).replaceWith(
        createMissionCategoriesElement(missionId, categoryNames),
      );
 
      break;
    }
  }
 
  function createMissionCategoriesElement(missionId, categoryNames) {
    let missionCategories = document.createElement("span");
 
    for (const categoryName of categoryNames) {
      const category = getCategoryByName(categoryName);
 
      if (!category) {
        console.warn("[Einsatzkategorie] Category not found: " + categoryName);
      }
 
      let missionCategoriesElement = document.createElement("span");
      missionCategoriesElement.setAttribute("id", "mission_categories_" + missionId);
      missionCategoriesElement.innerText = category.abbreviation;
      missionCategoriesElement.title = category.title;
      missionCategoriesElement.style.marginRight = "3px";
      missionCategoriesElement.style.cursor = "help";
      missionCategoriesElement.setAttribute("class", "label label-default");
 
      missionCategories.appendChild(missionCategoriesElement);
    }
 
    return missionCategories;
  }
 
  function getCategoryByName(name) {
    return categories.filter(map => map.name === name)[0];
  }
 
  async function update(event) {
    if (!areMissionsLoaded()) {
      await loadMissions();
    }
 
    let missionList = $(".missionSideBarEntry");
    for (let i = 0; i < missionList.length; i++) {
      const mission = missionList[i];
 
      const childList = mission.firstElementChild.firstElementChild.children;
      const missionId = parseInt(mission.getAttribute("mission_id"));
      if (event.id !== missionId) {
        continue;
      }
 
      const id = getMissionTypeIdFromMission(mission);
      if (id === null) {
        continue;
      }
 
      const requirement = getCategoryByMissionTypeId(id);
 
      if (requirement === undefined) {
        console.warn("[Einsatzkategorie] Mission type not found in requirements list: " + id);
        continue;
      }
 
      const categories = requirement["mission_categories"];
 
      if (missionCategoriesElementExists(missionId) === true && event.mtid !== null) {
        updateMissionCategoriesInMission(childList, mission, categories);
      } else {
        addMissionCategoriesToMission(mission, categories);
      }
    }
  }
 
  async function main() {
    if (!areMissionsLoaded()) {
      await loadMissions();
    }
 
    const missionList = $(".missionSideBarEntry");
    for (let i = 0; i < missionList.length; i++) {
      const mission = missionList[i];
 
      const id = getMissionTypeIdFromMission(mission);
      if (id === null) {
        continue;
      }
 
      const requirement = getCategoryByMissionTypeId(id);
 
      if (requirement === undefined) {
        console.warn("[Einsatzkategorie] Mission type not found in requirements list: " + id);
        continue;
      }
 
      addMissionCategoriesToMission(mission, requirement["mission_categories"]);
    }
  }
 
  main();
})();
