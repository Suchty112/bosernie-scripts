// ==UserScript==
// @name        * Kassier
// @namespace   bos-ernie.leitstellenspiel.de
// @version     4.0.0
// @license     BSD-3-Clause
// @author      BOS-Ernie
// @description Zeigt die Credits für jeden Einsatz in der Einsatzliste an.
// @match       https://www.leitstellenspiel.de/
// @match       https://polizei.leitstellenspiel.de/
// @icon        https://www.google.com/s2/favicons?sz=64&domain=leitstellenspiel.de
// @run-at      document-idle
// @grant       none
// @resource    https://forum.leitstellenspiel.de/index.php?thread/25633-script-kassier/
// ==/UserScript==
 
/* global missionMarkerAdd */
 
(function () {
  const originalFunc = missionMarkerAdd;
  missionMarkerAdd = function (mission) {
    originalFunc.apply(this, arguments);
    eventHandler(mission);
  };
 
  function createMissionCreditsElement(missionId, credits) {
    let missionCredits = document.createElement("span");
    missionCredits.setAttribute("id", "mission_credits_" + missionId);
    missionCredits.innerText = credits;
    missionCredits.style.marginRight = "3px";
 
    if (credits === 0) {
      missionCredits.innerText = "🚑";
    } else if (credits >= 12000) {
      missionCredits.setAttribute("class", "label label-primary");
    } else if (credits >= 7000) {
      missionCredits.setAttribute("class", "label label-info");
    } else if (credits >= 5000) {
      missionCredits.setAttribute("class", "label label-success");
    } else {
      missionCredits.setAttribute("class", "label label-default");
    }
 
    return missionCredits;
  }
 
  function addOrReplaceMissionCreditsElement(mission) {
    const missionId = mission.getAttribute("mission_id");
 
    const dataSortableBy = mission.getAttribute("data-sortable-by");
    const credits = JSON.parse(dataSortableBy).average_credits;
 
    const currentMissionCreditsElement = document.getElementById("mission_credits_" + missionId);
    const newMissionCreditsElement = createMissionCreditsElement(missionId, credits);
 
    if (currentMissionCreditsElement !== null) {
      currentMissionCreditsElement.replaceWith(newMissionCreditsElement);
    } else {
      document.getElementById("mission_caption_" + missionId).before(newMissionCreditsElement);
    }
  }
 
  function eventHandler(event) {
    addOrReplaceMissionCreditsElement(document.getElementById("mission_" + event.id));
  }
 
  function main() {
    const missionList = document.querySelectorAll(".missionSideBarEntry");
    missionList.forEach(mission => {
      addOrReplaceMissionCreditsElement(mission);
    });
  }
 
  main();
})();