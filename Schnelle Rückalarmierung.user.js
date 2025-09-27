// ==UserScript==
// @name        * Schnelle Rückalarmierung
// @namespace   bos-ernie.leitstellenspiel.de
// @version     1.1.1
// @license     BSD-3-Clause
// @author      BOS-Ernie
// @description Entfernt die Bestätigung beim Rückalarmieren.
// @match       https://*.leitstellenspiel.de/missions/*
// @icon        https://www.google.com/s2/favicons?sz=64&domain=leitstellenspiel.de
// @run-at      document-idle
// @grant       none
// @resource    https://forum.leitstellenspiel.de/index.php?thread/23912-script-schnelle-r%C3%BCckalarmierung-by-bos-ernie/
// ==/UserScript==
 
(function () {
  const aElements = document.getElementsByTagName("a");
  for (let i = 0; i < aElements.length; i++) {
    if (aElements[i].getAttribute("href").endsWith("finishCoins")) {
      continue;
    }
 
    aElements[i].removeAttribute("data-confirm");
  }
 
  const missionId = +window.location.pathname.replace(/\D+/g, "");
 
  const footerNav = document.getElementById("container_navbar_alarm");
 
  const buttonBackalarm = document.createElement("a");
  buttonBackalarm.className = "btn btn-warning";
  buttonBackalarm.setAttribute("href", "/missions/" + missionId + "/backalarmAll");
  buttonBackalarm.setAttribute("role", "button");
  buttonBackalarm.setAttribute("title", "Alle Fahrzeuge rückalarmieren");
  buttonBackalarm.innerHTML = '<span class="glyphicon glyphicon-remove-sign"></span>';
 
  const buttonBackalarmRettungsdienst = document.createElement("a");
  buttonBackalarmRettungsdienst.className = "btn btn-warning";
  buttonBackalarmRettungsdienst.setAttribute("href", "/missions/" + missionId + "/backalarmRettungsdienst");
  buttonBackalarmRettungsdienst.setAttribute("role", "button");
  buttonBackalarmRettungsdienst.setAttribute("title", "Rettungsdienst rückalarmieren");
  buttonBackalarmRettungsdienst.innerHTML =
    '<span class="glyphicon glyphicon-plus-sign"></span><span class="glyphicon glyphicon-remove-sign"></span>';
 
  const buttonGroup = document.createElement("div");
  buttonGroup.className = "btn-group";
  buttonGroup.setAttribute("role", "group");
  buttonGroup.setAttribute("aria-label", "Rückalarmieren");
  buttonGroup.appendChild(buttonBackalarm);
  buttonGroup.appendChild(buttonBackalarmRettungsdienst);
 
  document
    .getElementById("mission_alarm_btn")
    .parentElement.parentElement.insertBefore(
      buttonGroup,
      document.getElementById("mission_alarm_btn").parentElement.parentElement.children[3],
    );
})();