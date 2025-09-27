// ==UserScript==
// @name        * Wachen Navigation Hotkeys
// @namespace   bos-ernie.leitstellenspiel.de
// @version     1.1.0
// @license     BSD-3-Clause
// @author      BOS-Ernie
// @description Fügt zur Gebäudeseite Hotkeys hinzu, um zur vorherigen oder nächsten Wache zu navigieren.
// @match       https://www.leitstellenspiel.de/buildings/*
// @match       https://polizei.leitstellenspiel.de/buildings/*
// @match       https://www.leitstellenspiel.de/schoolings/*
// @match       https://polizei.leitstellenspiel.de/schoolings/*
// @match       https://www.meldkamerspel.com/buildings/*
// @match       https://politie.meldkamerspel.com/buildings/*
// @match       https://www.meldkamerspel.com/schoolings/*
// @match       https://politie.meldkamerspel.com/schoolings/*
// @icon        https://www.google.com/s2/favicons?sz=64&domain=leitstellenspiel.de
// @run-at      document-idle
// @grant       none
// @resource    https://forum.leitstellenspiel.de/index.php?thread/25831-script-wachen-navigation-hotkeys/
// ==/UserScript==
 
(function () {
  document.addEventListener("keydown", function (event) {
    const activeElement = document.activeElement;
    if (activeElement.tagName.toLowerCase() === "input" && activeElement.type.toLowerCase() === "text") {
      return;
    }
 
    if (event.key === "a") {
      document.getElementById("building-navigation-container").children[0].click();
    }
 
    if (event.key === "d") {
      document.getElementById("building-navigation-container").children[2].click();
    }
 
    if (event.key === "w") {
      document.getElementById("building-navigation-container").children[1].click();
    }
 
    if (event.key === "s") {
      window.open(window.location.href + "/vehicles/new", "_self").focus();
    }
  });
})();