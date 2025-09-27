// ==UserScript==
// @name        * AAO Button Volle Breite
// @namespace   bos-ernie.leitstellenspiel.de
// @version     1.2.0
// @license     BSD-3-Clause
// @author      BOS-Ernie
// @description Fügt einen Stil hinzu, welcher alle AAO-Links auf dieselbe Breite setzt
// @match       https://www.leitstellenspiel.de/aaos
// @match       https://www.leitstellenspiel.de/missions/*
// @icon        https://www.google.com/s2/favicons?sz=64&domain=leitstellenspiel.de
// @run-at      document-idle
// @grant       none
// @resource    https://forum.leitstellenspiel.de/index.php?thread/27088-script-aao-button-volle-breite/
// ==/UserScript==
 
(function () {
  let timerActive = false;
  // Wähle alle .aao_btn-Links aus
  const links = document.querySelectorAll("a");
 
  links.forEach(link => {
    const parentColumn = link?.closest(".col-sm-2");
    const isInColumn = parentColumn && parentColumn.className.startsWith("col-");
 
    // Skip applying width to elements outside of columns as it would make them too wide
    if (!isInColumn) {
      return;
    }
 
    // Apply width to button links on the AAO page
    const parentButtonGroup = link.closest(".btn-group.aao_btn_group");
    if (parentButtonGroup) {
      link.style.minWidth = "90%";
      link.style.textAlign = "left";
 
      parentButtonGroup.style.width = "100%";
      parentButtonGroup.style.margin = "0";
    }
 
    // Apply width to button links on the mission page
    if (link.classList.contains("aao_btn")) {
      link.style.minWidth = "100%";
      link.style.textAlign = "left";
 
      const iconElement = link.querySelector("span.label");
      const descriptionElement = link.querySelector("span");
      const timerElement = link.querySelector(".aao_timer");
 
      if (iconElement) {
        iconElement.style.marginRight = "5px";
      }
 
      if (timerElement) {
        timerActive = true;
 
        link.style.display = "flex";
        link.style.alignItems = "center";
        link.style.width = "100%";
        link.style.boxSizing = "border-box";
        link.style.margin = "0";
 
        const timerContainer = document.createElement("span");
        timerContainer.style.marginLeft = "auto";
        timerContainer.appendChild(timerElement);
        link.appendChild(timerContainer);
      }
    }
  });
 
  if (timerActive) {
    const brElements = document.getElementById("mission-aao-group").querySelectorAll("br");
    brElements.forEach(br => {
      br.style.display = "none";
    });
  }
})();