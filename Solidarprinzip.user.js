// ==UserScript==
// @name        * Solidarprinzip
// @namespace   bos-ernie.leitstellenspiel.de
// @version     1.3.0
// @license     BSD-3-Clause
// @author      BOS-Ernie
// @description Fügt einen Button zum schnellen Teilen der eigenen Einsätze aus der Einsatzliste hinzu.
// @match       https://www.leitstellenspiel.de/
// @match       https://polizei.leitstellenspiel.de/
// @icon        https://www.google.com/s2/favicons?sz=64&domain=leitstellenspiel.de
// @run-at      document-idle
// @grant       none
// @resource    https://forum.leitstellenspiel.de/index.php?thread/23842-script-solidarprinzip-by-bos-ernie/
// ==/UserScript==
 
/* global missionMarkerAdd */
 
(function () {
  function addShareButtonToMissionList() {
    document.querySelectorAll("#mission_list .missionSideBarEntry:not(.mission_deleted)").forEach(mission => {
      if (mission.querySelector(".panel-success")) {
        return;
      }
 
      addShareButtonToMission(mission.id.replace(/\D+/g, ""));
    });
 
    document.querySelectorAll("#mission_list_sicherheitswache .missionSideBarEntry:not(.mission_deleted)").forEach(mission => {
      if (mission.querySelector(".panel-success")) {
        return;
      }
 
      addShareButtonToMission(mission.id.replace(/\D+/g, ""));
    });
  }
 
  function addShareButtonToNewMissions() {
    let originalMissionMarkerAdd = missionMarkerAdd;
 
    missionMarkerAdd = e => {
      originalMissionMarkerAdd(e);
 
      if (e.alliance_id) {
        const shareButton = document.querySelector(`#share-button-${e.id}`);
 
        if (shareButton) {
          shareButton.remove();
        }
      }
 
      if (e.user_id !== user_id || e.kt === true || e.alliance_id || document.querySelector(`#share-button-${e.id}`)) {
        return;
      }
 
      addShareButtonToMission(e.id);
    };
  }
 
  function addShareButtonToMission(missionId) {
    const alarmButton = document.getElementById(`alarm_button_${missionId}`);
 
    if (!alarmButton) {
      console.warn(`Mission ${missionId} not found`);
      return;
    }
 
    const icon = document.createElement("span");
    icon.classList.add("glyphicon", "glyphicon-bullhorn");
 
    const button = document.createElement("a");
    button.id = `share-button-${missionId}`;
    button.classList.add("btn", "btn-default", "btn-xs");
    button.dataset.missionId = missionId;
    button.title = "Im Verband freigeben";
    button.appendChild(icon);
 
    button.addEventListener("click", async event => {
      event.preventDefault();
 
      await share(missionId).then(() => {
        button.remove();
      });
    });
 
    alarmButton.parentNode.insertBefore(button, alarmButton.nextElementSibling);
  }
 
  async function share(missionId) {
    await fetch(`/missions/${missionId}/alliance`, { redirect: "manual" });
  }
 
  function main() {
    addShareButtonToMissionList();
    addShareButtonToNewMissions();
  }
 
  main();
})();