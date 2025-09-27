// ==UserScript==
// @name        * Baumeister
// @namespace   bos-ernie.leitstellenspiel.de
// @version     1.5.0
// @license     BSD-3-Clause
// @author      BOS-Ernie
// @description Fügt einen Präfix zum Namen neuer Gebäude hinzu, wählt die nächste Integrierte Leitstelle aus und selektiert das Startfahrzeug für Feuerwachen aus. Zudem erstellt es über separate Buttons verschiedene Wachenkombinationen am aktuellen Standort.
// @match       https://www.leitstellenspiel.de/
// @match       https://polizei.leitstellenspiel.de/
// @icon        https://www.google.com/s2/favicons?sz=64&domain=leitstellenspiel.de
// @run-at      document-idle
// @grant       none
// ==/UserScript==
 
/* global building_new_marker, building_new_dragend, map */
 
(function () {
  /**
   * Konfiguration der Wachenkombinationen
   *
   * Diese Konfiguration definiert die verschiedenen Wachenkombinationen, die erstellt werden können. Pro Kombination
   * wird ein Objekt mit folgenden Eigenschaften definiert:
   * - `id`: Eindeutige ID der Kombination
   * - `enabled`: Gibt an, ob die Kombination aktiviert ist (true) oder nicht (false)
   * - `icon`: Emoji-Icon, das die Kombination repräsentiert
   * - `title`: Titel der Kombination, der im Tooltip angezeigt wird
   * - `buildingTypes`: Array von Gebäude-Typen, die in dieser Kombination erstellt werden sollen. Diese IDs
   *   entsprechen den `building_type` IDs im Spiel.
   *
   * @type {[{id: string, enabled: boolean, icon: string, title: string, buildingTypes: number[]},{id: string, enabled: boolean, icon: string, title: string, buildingTypes: number[]},{id: string, enabled: boolean, icon: string, title: string, buildingTypes: number[]},{id: string, enabled: boolean, icon: string, title: string, buildingTypes: number[]},{id: string, enabled: boolean, icon: string, title: string, buildingTypes: number[]},null]}
   */
  const buildingCombinations = [
    {
      id: "rescue-buildings",
      enabled: true,
      icon: "🚑",
      title: "Rettungswache (Kleinwache) + SEG",
      buildingTypes: [20, 12],
    },
    {
      id: "police-buildings",
      enabled: true,
      icon: "🚔",
      title: "Bereitschaftspolizei + Polizeiwache",
      buildingTypes: [11, 6],
    },
    {
      id: "hospital-buildings",
      enabled: true,
      icon: "🏥",
      title: "Krankenhaus + Rettungswache (Kleinwache)",
      buildingTypes: [4, 20],
    },
    {
      id: "fire-rescue-buildings",
      enabled: true,
      icon: "🚒",
      title: "Feuerwache + Rettungswache (Kleinwache)",
      buildingTypes: [0, 20],
    },
    {
      id: "mountain-rescue-buildings",
      enabled: true,
      icon: "⛑️",
      title: "Bergrettungswache + Rettungshundestaffel",
      buildingTypes: [25, 21],
    },
    {
      id: "special-police-buildings",
      enabled: true,
      icon: "🚁",
      title: "Bereitschaftspolizei + Polizeihubschrauberstation",
      buildingTypes: [11, 13],
    },
  ];
 
  const buildingImages = [
    {
      buildingTypeId: 7,
      caption: "Leitstelle",
      image: "/images/building_leitstelle.png",
    },
    {
      buildingTypeId: 0,
      caption: "Feuerwache",
      image: "/images/building_fire.png",
    },
    {
      buildingTypeId: 18,
      caption: "Feuerwache (Kleinwache)",
      image: "/images/building_fire.png",
    },
    {
      buildingTypeId: 1,
      caption: "Feuerwehrschule",
      image: "/images/building_fireschool.png",
    },
    {
      buildingTypeId: 2,
      caption: "Rettungswache",
      image: "/images/building_rescue_station.png",
    },
    {
      buildingTypeId: 20,
      caption: "Rettungswache (Kleinwache)",
      image: "/images/building_rescue_station.png",
    },
    {
      buildingTypeId: 3,
      caption: "Rettungsschule",
      image: "/images/building_rettungsschule.png",
    },
    {
      buildingTypeId: 4,
      caption: "Krankenhaus",
      image: "/images/building_hospital.png",
    },
    {
      buildingTypeId: 5,
      caption: "Rettungshubschrauber-Station",
      image: null,
    },
    {
      buildingTypeId: 12,
      caption: "Schnelleinsatzgruppe (SEG)",
      image: "/images/building_seg.png",
    },
    {
      buildingTypeId: 6,
      caption: "Polizeiwache",
      image: "/images/building_polizeiwache.png",
    },
    {
      buildingTypeId: 19,
      caption: "Polizeiwache (Kleinwache)",
      image: "/images/building_polizeiwache.png",
    },
    {
      buildingTypeId: 11,
      caption: "Bereitschaftspolizei",
      image: "/images/building_bereitschaftspolizei.png",
    },
    {
      buildingTypeId: 17,
      caption: "Polizei-Sondereinheiten",
      image: null,
    },
    {
      buildingTypeId: 13,
      caption: "Polizeihubschrauberstation",
      image: "/images/building_helipad_polizei.png",
    },
    {
      buildingTypeId: 8,
      caption: "Polizeischule",
      image: "/images/building_polizeischule.png",
    },
    {
      buildingTypeId: 9,
      caption: "THW",
      image: "/images/building_thw.png",
    },
    {
      buildingTypeId: 10,
      caption: "THW Bundesschule",
      image: "/images/building_thw_school.png",
    },
    {
      buildingTypeId: 14,
      caption: "Bereitstellungsraum",
      image: null,
    },
    {
      buildingTypeId: 15,
      caption: "Wasserrettung",
      image: "/images/building_wasserwacht.png",
    },
    {
      buildingTypeId: 21,
      caption: "Rettungshundestaffel",
      image: "/images/building_rescue_dog_unit.png",
    },
  ];
 
  class Coordinate {
    constructor(latitude, longitude) {
      this.latitude = latitude;
      this.longitude = longitude;
    }
  }
 
  let controlCenters = [];
 
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, "");
 
  const prefixes = {
    7: "ILS",
    0: "Florian " + date + " NW",
    18: "Florian " + date + " KW",
    1: "FS",
    2: "Rettung " + date + " NW",
    20: "Rettung " + date + " KW",
    3: "RS",
    4: "KH",
    5: "Christoph",
    12: "SEG " + date,
    6: "Dora " + date + " NW",
    19: "Dora " + date + " KW",
    11: "Bruno " + date,
    17: "Polizei-Sondereinheiten",
    13: "Bussard",
    8: "PS",
    9: "Heros " + date,
    10: "TS",
    14: "BSR",
    15: "Neptun " + date,
    21: "Antonius " + date,
    16: "Polizeizellen",
  };
 
  const buildingButtonContainerId = "building-buttons-container";
  const createdBuildingsListId = "created-buildings-list";
 
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
 
  async function initControlCenters() {
    const buildings = await getBuildings();
 
    controlCenters = buildings.filter(building => building.building_type === 7);
  }
 
  function calculateDistanceInKm(coordinateA, coordinateB) {
    const R = 6371;
    const dLat = deg2rad(coordinateB.latitude - coordinateA.latitude);
    const dLon = deg2rad(coordinateB.longitude - coordinateA.longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(coordinateA.latitude)) *
        Math.cos(deg2rad(coordinateB.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
 
  function deg2rad(deg) {
    return deg * (Math.PI / 180);
  }
 
  function getIdOfClosestControlCenter(coordinate) {
    let localControlCenters = controlCenters.map(controlCenter => {
      const distance = calculateDistanceInKm(
        coordinate,
        new Coordinate(controlCenter.latitude, controlCenter.longitude),
      );
      return {
        id: controlCenter.id,
        caption: controlCenter.caption,
        distance: distance,
      };
    });
 
    localControlCenters.sort((a, b) => a.distance - b.distance);
 
    return localControlCenters[0].id;
  }
 
  function getCurrentCity() {
    const address = document.getElementById("building_address").value;
 
    return address
      .substring(address.lastIndexOf(",") + 1)
      .trim()
      .replace(/\d+/g, "")
      .trim();
  }
 
  function updateBuildingName(buildingType) {
    let buildingName = "";
 
    const prefix = prefixes[buildingType];
    if (prefix) {
      buildingName = prefix + " ";
    }
 
    document.getElementById("building_name").value = buildingName + getCurrentCity();
  }
 
  function buildingTypeChangeEvent(event) {
    const buildingType = event.target.value;
    updateBuildingName(buildingType);
 
    if (buildingType === "0") {
      document.getElementById("building_start_vehicle_feuerwache").value = 30;
    }
    if (buildingType === "18") {
      document.getElementById("building_start_vehicle_feuerwache_kleinwache").value = 30;
    }
  }
 
  function selectClosestControlCenter(coordinate) {
    document.getElementById("building_leitstelle_building_id").value = getIdOfClosestControlCenter(coordinate);
  }
 
  function overwriteDrangEndListener() {
    let latitude = null;
    let longitude = null;
    const buildingNewDragendOriginal = building_new_dragend;
    building_new_dragend = function () {
      let coordinates = building_new_marker.getLatLng();
 
      let coordinatesChanged = false;
      if (latitude !== coordinates.lat) {
        latitude = coordinates.lat;
        coordinatesChanged = true;
      }
 
      if (longitude !== coordinates.lng) {
        longitude = coordinates.lng;
        coordinatesChanged = true;
      }
 
      if (coordinatesChanged) {
        selectClosestControlCenter(new Coordinate(latitude, longitude));
      }
 
      buildingNewDragendOriginal();
 
      setTimeout(() => {
        updateBuildingName(document.getElementById("building_building_type").value);
      }, 250);
    };
  }
 
  function selectBuildingType(id) {
    const buildingType = document.getElementById("building_building_type");
 
    for (let i = 0; i < buildingType.options.length; i++) {
      if (buildingType.options[i].value === id) {
        buildingType.selectedIndex = i;
        buildingType.dispatchEvent(new Event("change"));
        break;
      }
    }
 
    console.warn("[Baumeister] Failed to select building type");
  }
 
  function getImageUrlByBuildingTypeId(buildingTypeId) {
    const buildingImage = buildingImages.find(
      buildingImage => buildingImage.buildingTypeId === parseInt(buildingTypeId),
    );
    if (buildingImage) {
      return buildingImage.image;
    }
 
    return null;
  }
 
  async function createBuilding() {
    const coordinate = building_new_marker.getLatLng();
 
    const form = document.getElementById("new_building");
    const formData = new FormData(form);
 
    const response = await fetch("/buildings", {
      headers: {
        "x-csrf-token": document.querySelector('meta[name="csrf-token"]').content,
        "x-requested-with": "XMLHttpRequest",
      },
      method: "POST",
      body: formData,
    });
 
    const responseText = await response.text();
 
    const parser = new DOMParser();
    const responseParser = parser.parseFromString(responseText, "text/html");
    const alerts = responseParser.querySelectorAll("span.label-danger");
 
    if (alerts.length > 0) {
      alerts.forEach(alert => {
        const message = alert.innerText;
 
        const alertElement = document.createElement("div");
        alertElement.className = "alert alert-danger";
        alertElement.innerText = message;
 
        document.getElementById("detail_16").parentElement.insertAdjacentElement("beforeend", alertElement);
      });
 
      return;
    }
 
    const buildingId = responseText.match(/\/buildings\/(\d+)/)[1];
 
    const buildingName = document.getElementById("building_name").value;
 
    const createdBuildingsListItem = document.createElement("li");
    createdBuildingsListItem.innerHTML = `<a href="/buildings/${buildingId}" target="_blank" class="text-success">${buildingName}</a>`;
    document.getElementById(createdBuildingsListId).appendChild(createdBuildingsListItem);
 
    const iconUrl = getImageUrlByBuildingTypeId(formData.get("building[building_type]"));
 
    if (iconUrl) {
      const markerOptions = {
        icon: L.icon({
          iconUrl: iconUrl,
          iconSize: [32, 37],
          iconAnchor: [16, 37],
          popupAnchor: [0, -37],
        }),
      };
      L.marker([coordinate.lat, coordinate.lng], markerOptions).addTo(map);
    } else {
      L.marker([coordinate.lat, coordinate.lng]).addTo(map);
    }
  }
 
  async function createBuildingCombination(buildingTypes) {
    for (const buildingType of buildingTypes) {
      selectBuildingType(buildingType.toString());
      await createBuilding();
    }
  }
 
  function addBuildingButtons() {
    if (document.getElementById(buildingButtonContainerId)) {
      return;
    }
 
    const buttonContainer = document.createElement("div");
    buttonContainer.id = buildingButtonContainerId;
    buttonContainer.className = "building-buttons-container";
 
    buildingCombinations.forEach(combination => {
      if (!combination.enabled) return;
 
      const button = document.createElement("button");
      button.id = combination.id + "-button";
      button.type = "button";
      button.className = "btn btn-sm btn-default";
      button.title = combination.title;
      button.innerHTML = combination.icon;
 
      button.addEventListener("click", async event => {
        event.preventDefault();
        button.disabled = true;
        await createBuildingCombination(combination.buildingTypes);
        button.disabled = false;
      });
 
      buttonContainer.appendChild(button);
    });
 
    document.getElementById("detail_16").parentElement.insertAdjacentElement("beforeend", buttonContainer);
  }
 
  function addOrderedList() {
    if (document.getElementById(createdBuildingsListId)) {
      return;
    }
 
    const orderedList = document.createElement("ol");
    orderedList.id = createdBuildingsListId;
 
    document.getElementById("detail_16").parentElement.insertAdjacentElement("beforeend", orderedList);
  }
 
  async function buildButtonClickEvent(event) {
    event.preventDefault();
 
    const buildButton = event.target;
 
    buildButton.disabled = true;
 
    await createBuilding();
 
    buildButton.disabled = false;
  }
 
  function addEventListeners() {
    const buildButtons = document.querySelectorAll("input[type=submit].build_with_credits_step");
 
    for (let i = 0; i < buildButtons.length; i++) {
      buildButtons[i].addEventListener("click", buildButtonClickEvent);
    }
  }
 
  async function main() {
    await initControlCenters();
 
    const observer = new MutationObserver(mutationRecords => {
      mutationRecords.forEach(mutation => {
        if (!mutation.target.querySelector("#new_building")) {
          return;
        }
 
        addEventListeners();
        addBuildingButtons();
        addOrderedList();
 
        document.getElementById("building_building_type").addEventListener("change", buildingTypeChangeEvent);
 
        overwriteDrangEndListener();
 
        updateBuildingName();
 
        const element = document.getElementById("building_new_info_message");
        if (element) {
          element.remove();
        }
      });
    });
 
    observer.observe(document.getElementById("buildings"), {
      childList: true,
    });
  }
 
  main();
})();
