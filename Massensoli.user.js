// ==UserScript==
// @name        * Massensoli
// @namespace   bos-ernie.leitstellenspiel.de
// @version     1.3.1
// @license     BSD-3-Clause
// @author      BOS-Ernie
// @description Fügt Buttons zum schnellen Teilen der eigenen Einsätze ab einer bestimmten Anzahl Credits hinzu.
// @match       https://www.leitstellenspiel.de/
// @match       https://polizei.leitstellenspiel.de/
// @icon        https://www.google.com/s2/favicons?sz=64&domain=leitstellenspiel.de
// @run-at      document-idle
// @grant       GM_addStyle
// ==/UserScript==
 
/* ********************************************************
 * BENÖTIGT: Dieses Script funktioniert nur in Kombination mit dem "Solidarprinzip"-Script:
 * https://greasyfork.org/de/scripts/461443-solidarprinzip
 * Bitte vorher installieren!
 * ********************************************************/
 
GM_addStyle(`
  .solidarboost-container {
    display: inline-block;
    margin-left: 10px;
  }
  .solidarboost-status {
    display: inline-block;
    margin-left: 5px;
    color: #000;
    background-color: #fff;
    padding: 2px 5px;
    border-radius: 3px;
  }
  .category-btn.hidden {
    display: none !important;
  }
`);
 
(function () {
  "use strict";
 
  const SPECIAL_CATEGORIES = [
    { name: "Weihnachten", icon: "🎄" },
    { name: "Winter", icon: "❄️" },
    { name: "Vatertag", icon: "👨‍🍼" },
    { name: "Halloween", icon: "🎃" },
    { name: "Sommer", icon: "☀️" },
    { name: "Jahreswechsel", icon: "🎆" },
    { name: "Ostern", icon: "🐰" },
    { name: "Muttertag", icon: "🤱" },
    { name: "Fußball-Ereignisse", icon: "⚽" },
    { name: "Valentinstag", icon: "❤️" },
    { name: "Herbst", icon: "🍂" },
    { name: "Europäischen Tag des Notrufs 112", icon: "🆘️" },
    { name: "Fasching", icon: "🎭" },
    { name: "Frühling", icon: "🌷" },
    { name: "LSS Jubiläum", icon: "🎂" },
    { name: "Sport", icon: "🏃‍♂️" },
    { name: "Unbekannt", icon: "❓" },
    { name: "Mülleimer", icon: "🗑" },
  ];
 
  const specialOperations = [
    {
      category: "Weihnachten",
      mission_type_ids: [
        "52",
        "55",
        "129",
        "130",
        "202",
        "203",
        "583",
        "584",
        "585",
        "586",
        "587",
        "589",
        "590",
        "783",
        "784",
        "785",
        "786",
        "911",
        "912",
        "913",
      ],
    },
    {
      category: "Winter",
      mission_type_ids: ["53", "428", "787", "788", "789", "793", "794", "795", "831", "861", "862"],
    },
    {
      category: "Vatertag",
      mission_type_ids: ["88", "626", "627", "628", "629", "630", "844", "845", "846"],
    },
    {
      category: "Halloween",
      mission_type_ids: ["111", "112", "113", "114", "116", "117", "118", "119"],
    },
    {
      category: "Sommer",
      mission_type_ids: ["546", "547", "548", "646", "647", "863"],
    },
    {
      category: "Jahreswechsel",
      mission_type_ids: [
        "259",
        "260",
        "261",
        "262",
        "263",
        "264",
        "265",
        "266",
        "267",
        "268",
        "269",
        "270",
        "591",
        "695",
      ],
    },
    {
      category: "Ostern",
      mission_type_ids: [
        "284",
        "285",
        "286",
        "287",
        "288",
        "289",
        "290",
        "291",
        "442",
        "443",
        "444",
        "445",
        "446",
        "618",
        "732",
        "733",
        "734",
        "735",
        "736",
        "737",
        "739",
        "927",
        "928",
        "929",
      ],
    },
    {
      category: "Muttertag",
      mission_type_ids: ["360", "742", "743", "744", "745", "746", "747", "748", "847"],
    },
    {
      category: "Fußball-Ereignisse",
      mission_type_ids: ["371", "372", "375", "376", "641", "642", "849", "850", "851"],
    },
    {
      category: "Valentinstag",
      mission_type_ids: ["601", "602", "603", "604", "605", "790", "791", "792", "833", "834", "917", "918", "919"],
    },
    {
      category: "Herbst",
      mission_type_ids: ["673", "675", "676", "678", "679", "680"],
    },
    {
      category: "Europäischen Tag des Notrufs 112",
      mission_type_ids: ["704", "705", "706", "707", "708"],
    },
    {
      category: "Fasching",
      mission_type_ids: ["710", "711", "712", "713", "714", "716", "717", "718", "719"],
    },
    {
      category: "Frühling",
      mission_type_ids: ["725", "727", "728", "729", "730"],
    },
    {
      category: "LSS Jubiläum",
      mission_type_ids: ["756", "757", "758", "759", "760", "761", "762", "763", "764", "770", "771", "772"],
    },
    {
      category: "Sport",
      mission_type_ids: ["871", "872", "873"],
    },
    {
      category: "Unbekannt",
      mission_type_ids: ["876", "877", "878", "901"],
    },
    {
      category: "Mülleimer",
      mission_type_ids: ["0"],
    },
  ];
 
  let isSharing = false;
  let stopSharing = false;
  let sharedCount = 0;
  let totalToShare = 0;
  let uiCreated = false;
  let statusElement, stopButton, btnGroup;
  let categoryButtons = {};
 
  function createUI() {
    if (uiCreated)
      return {
        stopBtn: stopButton,
        status: statusElement,
      };
 
    const navbarHeader = document.querySelector("nav#main_navbar > div.container-fluid > div.navbar-header");
    if (!navbarHeader) {
      return null;
    }
 
    const container = document.createElement("div");
    container.className = "solidarboost-container";
 
    btnGroup = document.createElement("div");
    btnGroup.className = "btn-group btn-group-xs solidarboost-btns";
 
    const thresholds = [5000, 7000, 9000, 10000, 11000, 12000, 15000];
    thresholds.forEach(threshold => {
      const btn = document.createElement("button");
      btn.className = "btn btn-default solidarboost-btn";
      btn.textContent = `${threshold / 1000}k`;
      btn.title = `Teile Einsätze ab ${threshold} Credits`;
      btn.addEventListener("click", () => startSharing(threshold));
      btnGroup.appendChild(btn);
    });
 
    SPECIAL_CATEGORIES.forEach(category => {
      const btn = document.createElement("button");
      btn.className = "btn btn-default btn-xs category-btn hidden";
      btn.dataset.category = category.name;
      btn.title = `Teile Einsätze der Kategorie ${category.name}`;
      btn.textContent = category.icon;
      btn.addEventListener("click", () => shareMissionsByCategory(category.name));
      btnGroup.appendChild(btn);
      categoryButtons[category.name] = btn;
    });
 
    stopButton = document.createElement("button");
    stopButton.className = "btn btn-xs btn-danger solidarboost-btn";
    stopButton.textContent = "Stop";
    stopButton.disabled = true;
    stopButton.addEventListener("click", () => {
      stopSharing = true;
    });
    btnGroup.append(stopButton);
 
    statusElement = document.createElement("small");
    statusElement.className = "solidarboost-status";
 
    container.appendChild(btnGroup);
    container.appendChild(statusElement);
    navbarHeader.appendChild(container);
 
    uiCreated = true;
    return {
      stopBtn: stopButton,
      status: statusElement,
    };
  }
 
  function updateCategoryButtons() {
    const missionTypeIds = getMissionTypeIds();
    const activeCategories = new Set();
 
    missionTypeIds.forEach(id => {
      const category = specialOperations.find(op => op.mission_type_ids.includes(id))?.category;
      if (category) {
        activeCategories.add(category);
      }
    });
 
    SPECIAL_CATEGORIES.forEach(category => {
      const btn = categoryButtons[category.name];
      if (btn) {
        btn.classList.toggle("hidden", !activeCategories.has(category.name));
      }
    });
  }
 
  async function shareMissionsByCategory(category) {
    if (isSharing) {
      return;
    }
 
    const ui = createUI();
    if (!ui) {
      return;
    }
 
    isSharing = true;
    stopSharing = false;
    sharedCount = 0;
    ui.stopBtn.disabled = false;
 
    ui.status.textContent = `⏳ ${category}`;
 
    const missionTypeIds = specialOperations.find(op => op.category === category)?.mission_type_ids || [];
    const missionsToShare = findMissionsByTypeIds(missionTypeIds);
    totalToShare = missionsToShare.length;
 
    if (totalToShare === 0) {
      ui.status.textContent = `0 ${category} ✅`;
      isSharing = false;
      ui.stopBtn.disabled = true;
      return;
    }
 
    document.querySelectorAll("a[id^='alarm_button_']").forEach(btn => {
      btn.classList.remove("lightbox-open");
      btn.setAttribute("target", "_blank");
    });
 
    await new Promise(resolve => setTimeout(resolve, 500));
 
    for (const missionId of missionsToShare) {
      if (stopSharing) {
        break;
      }
 
      const shareButton = document.getElementById(`share-button-${missionId}`);
      if (!shareButton) {
        totalToShare--;
        continue;
      }
 
      shareButton.click();
      sharedCount++;
      ui.status.textContent = `${sharedCount}/${totalToShare} ${category}`;
 
      await new Promise(resolve => setTimeout(resolve, 100));
    }
 
    ui.status.textContent = stopSharing
      ? `${sharedCount}/${totalToShare} ${category} ❌`
      : `${sharedCount} ${category} ✅`;
 
    isSharing = false;
    stopSharing = false;
    ui.stopBtn.disabled = true;
  }
 
  function findMissionsByTypeIds(typeIds) {
    const missionList = getMissionList();
    if (!missionList) {
      return [];
    }
 
    const missionDivs = missionList.querySelectorAll("[mission_type_id]:not(.mission_deleted)");
    const missions = [];
 
    for (const missionDiv of missionDivs) {
      const missionTypeId = missionDiv.getAttribute("mission_type_id");
      if (typeIds.includes(missionTypeId)) {
        missions.push(missionDiv.getAttribute("mission_id"));
      }
    }
 
    return missions;
  }
 
  async function startSharing(threshold) {
    if (isSharing) {
      return;
    }
 
    const ui = createUI();
    if (!ui) {
      return;
    }
 
    isSharing = true;
    stopSharing = false;
    sharedCount = 0;
    ui.stopBtn.disabled = false;
 
    ui.status.textContent = "⏳";
 
    const missionsToShare = await findMissionsToShare(threshold);
    totalToShare = missionsToShare.length;
 
    if (totalToShare === 0) {
      ui.status.textContent = "0 ✅";
      isSharing = false;
      ui.stopBtn.disabled = true;
      return;
    }
 
    document.querySelectorAll("a[id^='alarm_button_']").forEach(btn => {
      btn.classList.remove("lightbox-open");
      btn.setAttribute("target", "_blank");
    });
 
    await new Promise(resolve => setTimeout(resolve, 500));
 
    for (const missionId of missionsToShare) {
      if (stopSharing) {
        break;
      }
 
      const shareButton = document.getElementById(`share-button-${missionId}`);
      if (!shareButton) {
        totalToShare--;
        continue;
      }
 
      shareButton.click();
      sharedCount++;
      ui.status.textContent = `${sharedCount}/${totalToShare}`;
 
      await new Promise(resolve => setTimeout(resolve, 100));
    }
 
    ui.status.textContent = stopSharing ? `${sharedCount}/${totalToShare} ❌` : `${sharedCount} ✅`;
 
    isSharing = false;
    stopSharing = false;
    ui.stopBtn.disabled = true;
  }
 
  function getMissionList() {
    return document.getElementById("mission_list");
  }
 
  function getMissionTypeIds() {
    const missionList = getMissionList();
    if (!missionList) {
      return [];
    }
 
    const missionDivs = missionList.querySelectorAll("[mission_type_id]:not(.mission_deleted)");
    const missionTypeIds = [];
 
    for (const missionDiv of missionDivs) {
      missionTypeIds.push(missionDiv.getAttribute("mission_type_id"));
    }
 
    return [...new Set(missionTypeIds)];
  }
 
  function findMissionsToShare(threshold) {
    const missionList = getMissionList();
    if (!missionList) {
      return Promise.resolve([]);
    }
 
    const missionDivs = missionList.querySelectorAll("[mission_type_id]:not(.mission_deleted)");
    const missions = [];
 
    for (const missionDiv of missionDivs) {
      const missionId = missionDiv.getAttribute("mission_id");
      const dataSortableBy = missionDiv.getAttribute("data-sortable-by");
 
      try {
        const credits = JSON.parse(dataSortableBy).average_credits;
        if (credits >= threshold) {
          missions.push(missionId);
        }
      } catch (e) {
        console.error("Error parsing mission data", e);
      }
    }
 
    return Promise.resolve(missions);
  }
 
  if (document.readyState === "complete") {
    init();
  } else {
    window.addEventListener("load", init);
  }
 
  function init() {
    createUI();
 
    const observer = new MutationObserver(() => {
      updateCategoryButtons();
    });
 
    const missionList = document.getElementById("mission_list");
    if (missionList) {
      observer.observe(missionList, {
        childList: true,
        subtree: true,
      });
      updateCategoryButtons();
    }
  }
})();