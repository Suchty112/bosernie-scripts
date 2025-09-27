// ==UserScript==
// @name        * Lehrgangsorganisator
// @namespace   bos-ernie.leitstellenspiel.de
// @version     1.4.0
// @license     BSD-3-Clause
// @author      BOS-Ernie
// @description Setzt die Anzahl Räume und die Dauer eines Lehrgangs auf den maximal möglichen Wert und wählt den zuletzt gestarteten Lehrgang aus.
// @match       https://*.leitstellenspiel.de/buildings/*
// @icon        https://www.google.com/s2/favicons?sz=64&domain=leitstellenspiel.de
// @run-at      document-idle
// @grant       none
// ==/UserScript==
 
(function () {
  "use strict";
 
  const storageKey = "lehrgangsorganisator";
 
  function getSchoolingType() {
    const img = document.querySelector("img.pull-right");
    if (!img) {
      return null;
    }
 
    const src = img.getAttribute("src");
    if (!src) {
      return null;
    }
 
    const schoolingType = src.match(/\/images\/building_(.+)\.png/);
    if (!schoolingType) {
      return null;
    }
 
    return schoolingType[1];
  }
 
  function selectLastEducation() {
    const lastEducations = getLastEducations();
 
    const schoolingType = getSchoolingType();
    if (schoolingType) {
      const lastEducation = lastEducations.find(lastEducation => lastEducation.schoolingType === schoolingType);
      if (lastEducation) {
        const education = lastEducation.education;
        const educationInput = document.getElementById("education_" + education);
        if (educationInput) {
          educationInput.checked = true;
        }
      }
    }
  }
 
  function getLastEducations() {
    const lastEducations = localStorage.getItem(storageKey);
    if (lastEducations) {
      return JSON.parse(lastEducations);
    }
 
    return [];
  }
 
  function saveLastEducation(education) {
    let lastEducations = getLastEducations();
    const schoolingType = getSchoolingType();
 
    lastEducations = lastEducations.filter(lastEducation => lastEducation.schoolingType !== schoolingType);
    lastEducations.push({
      schoolingType: schoolingType,
      education: education,
    });
 
    localStorage.setItem(storageKey, JSON.stringify(lastEducations));
  }
 
  function clickHandler() {
    const education = document.querySelector("input[name='education']:checked").value;
    saveLastEducation(education);
  }
 
  function main() {
    // Skip hire personnel page
    if (window.location.href.match(/\/buildings\/\d+\/hire/)) {
      return;
    }
 
    selectLastEducation();
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        selectLastEducation();
      }
    });
 
    const numberOfRoomsSelect = document.getElementById("building_rooms_use");
    if (numberOfRoomsSelect) {
      numberOfRoomsSelect.selectedIndex = numberOfRoomsSelect.options.length - 1;
    }
 
    const durationSelect = document.getElementById("alliance_duration");
    if (durationSelect) {
      durationSelect.selectedIndex = durationSelect.options.length - 1;
    }
 
    const submitButton = document.querySelector("input[type='submit']");
    if (submitButton) {
      submitButton.addEventListener("click", clickHandler);
    }
  }
 
  main();
})();