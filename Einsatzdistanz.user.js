// ==UserScript==
// @name        * Einsatzdistanz
// @namespace   bos-ernie.leitstellenspiel.de
// @version     1.1.0
// @license     BSD-3-Clause
// @author      BOS-Ernie
// @description Zeigt die Distanz eines Einsatzes zu der nähesten Leitstelle in der Einsatzliste an
// @match       https://*.leitstellenspiel.de/
// @icon        https://www.google.com/s2/favicons?sz=64&domain=leitstellenspiel.de
// @run-at      document-idle
// @grant       none
// ==/UserScript==
 
/* global missionMarkerAdd,building_markers_cache,user_id  */
 
(function () {
  "use strict";
 
  const originalFunc = missionMarkerAdd;
 
  missionMarkerAdd = async function (mission) {
    originalFunc.apply(this, arguments);
    await eventHandler(mission);
  };
 
  let controlCenters = null;
 
  class Coordinate {
    constructor(latitude, longitude) {
      this.latitude = latitude;
      this.longitude = longitude;
    }
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
 
  function getMissionDistanceElementByMissionId(missionId) {
    return document.getElementById("mission-distance-" + missionId);
  }
 
  function missionDistanceElementExists(missionId) {
    return getMissionDistanceElementByMissionId(missionId) !== null;
  }
 
  function addMissionDistanceElement(missionId, distance) {
    const icon = document.createElement("span");
    icon.className = "glyphicon glyphicon-resize-horizontal";
 
    const missionDistanceElement = document.createElement("label");
    missionDistanceElement.id = "mission-distance-" + missionId;
    missionDistanceElement.classList.add("label", "label-" + getIconClassByDistance(distance));
    missionDistanceElement.title = formatDistance(distance);
    missionDistanceElement.style.marginRight = "3px";
    missionDistanceElement.appendChild(icon);
 
    document.getElementById("mission_caption_" + missionId).before(missionDistanceElement);
  }
 
  function formatDistance(distance) {
    if (distance < 100) {
      return distance.toFixed(2) + " km";
    } else {
      return distance.toFixed(0) + " km";
    }
  }
 
  function getIconClassByDistance(distance) {
    if (distance < 100) {
      return "success";
    } else if (distance < 1000) {
      return "warning";
    } else {
      return "danger";
    }
  }
 
  function closestDistanceToAControlCenter(coordinate) {
    let closestDistance = null;
    for (const controlCenter of controlCenters) {
      const distance = calculateDistanceInKm(
        coordinate,
        new Coordinate(controlCenter.latitude, controlCenter.longitude),
      );
      if (closestDistance === null || distance < closestDistance) {
        closestDistance = distance;
      }
    }
 
    return closestDistance;
  }
 
  function eventHandler(event) {
    const missionId = event.id;
 
    // Skip own and event missions
    if (event.user_id === user_id || event.user_id === null) {
      return;
    }
 
    if (missionDistanceElementExists(missionId)) {
      return;
    }
 
    const distance = closestDistanceToAControlCenter(new Coordinate(event.latitude, event.longitude));
 
    addMissionDistanceElement(missionId, distance);
  }
 
  async function main() {
    controlCenters = building_markers_cache.filter(building => building.building_type === 7);
 
    const missionList = document.getElementById("mission_list_alliance").querySelectorAll(".missionSideBarEntry");
 
    for (const mission of missionList) {
      const missionId = mission.getAttribute("mission_id");
      if (missionDistanceElementExists(missionId)) {
        continue;
      }
 
      const distance = closestDistanceToAControlCenter(
        new Coordinate(mission.getAttribute("latitude"), mission.getAttribute("longitude")),
      );
 
      addMissionDistanceElement(missionId, distance);
    }
  }
 
  main();
})();