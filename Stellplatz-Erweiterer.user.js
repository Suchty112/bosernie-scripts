// ==UserScript==
// @name        * Stellplatz-Erweiterer
// @namespace   bos-ernie.leitstellenspiel.de
// @version     1.1.0
// @license     BSD-3-Clause
// @author      BOS-Ernie
// @description Baut alle verfügbaren Stellplätze eines Gebäudes aus.
// @match       https://*.leitstellenspiel.de/buildings/*/expand
// @match       https://*.leitstellenspiel.de/buildings/*
// @icon        https://www.google.com/s2/favicons?sz=64&domain=leitstellenspiel.de
// @run-at      document-idle
// @grant       none
// @resource    https://forum.leitstellenspiel.de/index.php?thread/24689-script-stellplatz-erweiterer-by-bos-ernie/
// ==/UserScript==
 
(function () {
  "use strict";
 
  function renderButton() {
    const expandButton = document.evaluate(
      "//a[text()='Ausbauen']",
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null,
    ).singleNodeValue;
 
    if (expandButton === null) {
      return;
    }
 
    const maxExpandButton = document.createElement("a");
    maxExpandButton.classList.add("btn", "btn-info", "btn-xs");
    maxExpandButton.href = expandButton.href + "?level=max";
    maxExpandButton.textContent = "Maximal ausbauen $$$";
 
    expandButton.parentNode.insertBefore(maxExpandButton, expandButton.nextSibling);
  }
 
  function expand() {
    const expandButtons = document.querySelectorAll("[id^='expand_direct_']");
    expandButtons[expandButtons.length - 1].click();
 
    const formActionDivs = document.querySelectorAll(".form-actions");
    formActionDivs[formActionDivs.length - 1].firstElementChild.click();
  }
 
  function main() {
    if (window.location.pathname.match(/\/buildings\/\d+$/) !== null) {
      renderButton();
    }
 
    const searchString = new URLSearchParams(window.location.search);
    if (window.location.pathname.match(/\/buildings\/\d+\/expand$/) !== null && searchString.get("level") === "max") {
      expand();
    }
  }
 
  main();
})();