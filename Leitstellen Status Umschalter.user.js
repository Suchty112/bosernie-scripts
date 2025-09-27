// ==UserScript==
// @name        * Leitstellen Status Umschalter
// @namespace   bos-ernie.leitstellenspiel.de
// @version     1.1.0
// @license     BSD-3-Clause
// @author      BOS-Ernie
// @description Fügt der Gebäudeliste einen Button hinzu, mit dem der Status jeder Leitstelle umgeschaltet werden kann.
// @match       https://www.leitstellenspiel.de/
// @match       https://polizei.leitstellenspiel.de/
// @icon        https://www.google.com/s2/favicons?sz=64&domain=leitstellenspiel.de
// @run-at      document-idle
// @grant       none
// @resource    https://forum.leitstellenspiel.de/index.php?thread/23376-script-leitstellen-status-umschalter-by-bos-ernie/
// ==/UserScript==
 
/* global buildingLoadContent */
 
(function () {
  const callback = mutations => {
    mutations.forEach(mutation => {
      if (mutation.addedNodes.length > 0) {
        addToggleButtons();
      }
    });
  };
 
  const observer = new MutationObserver(callback);
  observer.observe(document.getElementById("buildings"), {
    childList: true,
  });
 
  function addToggleButtons() {
    const listItems = document.querySelectorAll('#building_list li[leitstelle_building_id][building_type_id="7"]');
    if (listItems.length === 0) {
      return;
    }
 
    listItems.forEach(li => {
      if (li.getAttribute("building_type_id") !== "7") {
        return;
      }
 
      const buildingId = li.querySelector("img").getAttribute("building_id");
      const captionDiv = document.getElementById("building_list_caption_" + buildingId);
 
      const img = li.querySelector("img");
      const imgSource = img.getAttribute("src");
      img.remove();
 
      if (imgSource === "/images/building_leitstelle_deactivated.png") {
        captionDiv.prepend(createStatusButtonGroup(buildingId, "disabled"));
      } else {
        captionDiv.prepend(createStatusButtonGroup(buildingId, "enabled"));
      }
    });
  }
 
  const buildingList = document.getElementById("building_list");
  if (!buildingList) {
    console.error("Leitstellen Status Umschalter: Building list not found.");
    return;
  }
 
  const observerBuildingList = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.addedNodes.length > 0) {
        addToggleButtons();
      }
    });
  });
  observerBuildingList.observe(buildingList, {
    childList: true,
  });
 
  function createStatusButtonGroup(buildingId, status) {
    const href = "https://www.leitstellenspiel.de/buildings/" + buildingId + "/active";
 
    const listener = e => {
      e.preventDefault();
      $.ajax({
        url: href,
        type: "GET",
        success: function () {
          const statusButtonGroup = document.getElementById("status-button-group-" + buildingId);
          statusButtonGroup.replaceWith(
            createStatusButtonGroup(buildingId, status === "disabled" ? "enabled" : "disabled"),
          );
        },
      });
    };
 
    if (status === "disabled") {
      const enableButtonInactive = document.createElement("a");
      enableButtonInactive.href = href;
      enableButtonInactive.type = "button";
      enableButtonInactive.className = "btn btn-default";
      enableButtonInactive.innerHTML = "An";
      enableButtonInactive.addEventListener("click", listener);
 
      const disableButtonActive = document.createElement("a");
      disableButtonActive.href = href;
      disableButtonActive.type = "button";
      disableButtonActive.className = "btn btn-danger active";
      disableButtonActive.innerHTML = "Aus";
      disableButtonActive.addEventListener("click", listener);
 
      const statusButtonGroupDisabled = document.createElement("div");
      statusButtonGroupDisabled.id = "status-button-group-" + buildingId;
      statusButtonGroupDisabled.className = "btn-group btn-group-xs";
      statusButtonGroupDisabled.role = "group";
      statusButtonGroupDisabled.appendChild(enableButtonInactive);
      statusButtonGroupDisabled.appendChild(disableButtonActive);
 
      return statusButtonGroupDisabled;
    }
 
    const enableButtonActive = document.createElement("a");
    enableButtonActive.href = href;
    enableButtonActive.type = "button";
    enableButtonActive.className = "btn btn-success active";
    enableButtonActive.innerHTML = "An";
    enableButtonActive.addEventListener("click", listener);
 
    const disableButtonInactive = document.createElement("a");
    disableButtonInactive.href = href;
    disableButtonInactive.type = "button";
    disableButtonInactive.className = "btn btn-default";
    disableButtonInactive.innerHTML = "Aus";
    disableButtonInactive.addEventListener("click", listener);
 
    const statusButtonGroupEnabled = document.createElement("div");
    statusButtonGroupEnabled.id = "status-button-group-" + buildingId;
    statusButtonGroupEnabled.className = "btn-group btn-group-xs";
    statusButtonGroupEnabled.role = "group";
    statusButtonGroupEnabled.appendChild(enableButtonActive);
    statusButtonGroupEnabled.appendChild(disableButtonInactive);
 
    return statusButtonGroupEnabled;
  }
})();