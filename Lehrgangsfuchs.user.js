// ==UserScript==
// @name        * Lehrgangsfuchs
// @namespace   bos-ernie.leitstellenspiel.de
// @version     1.3.2
// @license     BSD-3-Clause
// @author      BOS-Ernie
// @description Platziert die eigenen und offenen Lehrgänge auf Tabs, bietet Filtermöglichkeiten an und zeigt die Anzahl der Lehrgänge (gefiltert/gesamt) an
// @match       https://www.leitstellenspiel.de/schoolings*
// @match       https://polizei.leitstellenspiel.de/schoolings*
// @icon        https://www.google.com/s2/favicons?sz=64&domain=leitstellenspiel.de
// @run-at      document-idle
// @grant       none
// @resource    https://forum.leitstellenspiel.de/index.php?thread/24748-script-lehrgangsfuchs-by-bos-ernie/
// ==/UserScript==
 
(function () {
  "use strict";
 
  function getQueryParameter(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
  }
 
  function setQueryParameter(name, value) {
    const url = new URL(window.location.href);
    url.searchParams.set(name, value);
    window.history.replaceState({}, "", url);
  }
 
  function removeQueryParameter(name) {
    const url = new URL(window.location.href);
    url.searchParams.delete(name);
    window.history.replaceState({}, "", url);
  }
 
  function filterRows(startsWith) {
    if (startsWith === null) {
      startsWith = getQueryParameter("filter");
    } else {
      setQueryParameter("filter", startsWith);
    }
 
    if (startsWith === null) {
      startsWith = "";
 
      removeQueryParameter("filter");
    }
 
    filterTableRows("schooling_own_table", startsWith);
    filterTableRows("schooling_opened_table", startsWith);
  }
 
  function filterTableRows(tableId, startsWith) {
    const rows = document.getElementById(tableId).getElementsByTagName("tr");
 
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      row.style.display = "";
 
      if (row.innerText.startsWith("Lehrgang")) {
        continue;
      }
 
      if (
        row.getElementsByTagName("td").length > 0 &&
        row.getElementsByTagName("td")[0].getElementsByTagName("a").length > 0 &&
        !row.getElementsByTagName("td")[0].getElementsByTagName("a")[0].innerText.toLowerCase().startsWith(startsWith)
      ) {
        row.style.display = "none";
      }
    }
 
    updateCounters();
  }
 
  function updateCounters() {
    updateCount("schooling_own_table", "count-own");
    updateCount("schooling_opened_table", "count-open");
  }
 
  function updateCount(tableId, counterId) {
    const tableSchoolingsOpened = document.getElementById(tableId);
    const countOpen = tableSchoolingsOpened.getElementsByTagName("tr").length - 1;
    const countOpenFiltered = tableSchoolingsOpened.querySelectorAll("tr:not([style*='display: none'])").length - 1;
 
    const spanCountOpen = document.getElementById(counterId);
    if (countOpen === countOpenFiltered) {
      spanCountOpen.innerText = countOpen;
    } else {
      spanCountOpen.innerText = countOpenFiltered + "/" + countOpen;
    }
  }
 
  function createFilterButton(text) {
    const button = document.createElement("button");
    button.id = "filter-button-" + text.toLowerCase();
    button.type = "button";
    button.innerText = text;
    button.setAttribute("data-filter-value", text.toLowerCase());
 
    if (getQueryParameter("filter") === text.toLowerCase()) {
      button.className = "btn btn-success";
    } else {
      button.className = "btn btn-default";
    }
 
    button.addEventListener("click", function (event) {
      event.preventDefault();
 
      if (button.className === "btn btn-success") {
        button.className = "btn btn-default";
        filterRows("");
        return;
      }
 
      const buttons = document.getElementById("filter-button-group").getElementsByTagName("button");
      for (let i = 0; i < buttons.length; i++) {
        const button = buttons[i];
        if (button.id === event.target.id) {
          button.className = "btn btn-success";
        } else {
          button.className = "btn btn-default";
        }
      }
 
      filterRows(event.target.getAttribute("data-filter-value"));
    });
 
    return button;
  }
 
  function addFilterButtonGroup() {
    const buttonGroup = document.createElement("div");
    buttonGroup.id = "filter-button-group";
    buttonGroup.className = "btn-group btn-group-sm";
    buttonGroup.style.margin = "0 0 10px 10px";
    buttonGroup.setAttribute("role", "group");
    buttonGroup.setAttribute("aria-label", "Filter");
 
    buttonGroup.appendChild(createFilterButton("Feuerwehr"));
    buttonGroup.appendChild(createFilterButton("Rettungsdienst"));
    buttonGroup.appendChild(createFilterButton("Polizei"));
    buttonGroup.appendChild(createFilterButton("THW"));
 
    const container = document.getElementById("iframe-inside-container");
    container.appendChild(buttonGroup);
  }
 
  function placeTablesOnTabs() {
    let currentTab = getQueryParameter("tab");
    if (currentTab === null) {
      currentTab = "eigene";
    }
 
    const headings = document.querySelectorAll("h3");
    for (let i = 0; i < headings.length; i++) {
      headings[i].remove();
    }
 
    const tableSchoolings = document.getElementById("schooling_own_table");
 
    const spanCountOwn = document.createElement("span");
    spanCountOwn.id = "count-own";
    spanCountOwn.innerText = "?/?";
 
    const aOwn = document.createElement("a");
    aOwn.href = "#schooling_own_table";
    aOwn.setAttribute("data-toggle", "tab");
    aOwn.innerText = "Lehrgänge mit eigenen Teilnehmern ";
    aOwn.appendChild(spanCountOwn);
 
    const liOwn = document.createElement("li");
    liOwn.appendChild(aOwn);
    aOwn.addEventListener("click", function (event) {
      event.preventDefault();
      setQueryParameter("tab", "eigene");
    });
 
    if (currentTab === "eigene") {
      liOwn.className = "active";
    }
 
    const divOwn = document.createElement("div");
    divOwn.id = "schooling_own_table";
    divOwn.className = "tab-pane";
    divOwn.appendChild(tableSchoolings);
 
    if (currentTab === "eigene") {
      divOwn.classList.add("active");
    }
 
    const tableSchoolingsOpened = document.getElementById("schooling_opened_table");
 
    const spanCountOpen = document.createElement("span");
    spanCountOpen.id = "count-open";
    spanCountOpen.innerText = "?/?";
 
    const aOpen = document.createElement("a");
    aOpen.href = "#schooling_opened_table";
    aOpen.setAttribute("data-toggle", "tab");
    aOpen.innerText = "Offene Lehrgänge ";
    aOpen.appendChild(spanCountOpen);
 
    const liOpen = document.createElement("li");
    liOpen.appendChild(aOpen);
    aOpen.addEventListener("click", function (event) {
      event.preventDefault();
      setQueryParameter("tab", "offene");
    });
 
    if (currentTab === "offene") {
      liOpen.className = "active";
    }
 
    const divOpen = document.createElement("div");
    divOpen.className = "tab-pane";
    divOpen.id = "schooling_opened_table";
    divOpen.appendChild(document.querySelector("[search_class='schooling_opened_table_searchable']"));
    divOpen.appendChild(tableSchoolingsOpened);
 
    if (currentTab === "offene") {
      divOpen.classList.add("active");
    }
 
    const div = document.createElement("div");
    div.className = "tab-content";
    div.appendChild(divOwn);
    div.appendChild(divOpen);
 
    const ul = document.createElement("ul");
    ul.className = "nav nav-tabs";
    ul.appendChild(liOwn);
    ul.appendChild(liOpen);
 
    const tabs = document.createElement("div");
    tabs.className = "tabs";
    tabs.appendChild(ul);
    tabs.appendChild(div);
 
    const container = document.getElementById("iframe-inside-container");
    container.appendChild(tabs);
  }
 
  function main() {
    if (window.location.pathname.match(/\/schoolings\/\d+/)) {
      return;
    }
 
    addFilterButtonGroup();
    placeTablesOnTabs();
    filterRows(null);
  }
 
  main();
})();