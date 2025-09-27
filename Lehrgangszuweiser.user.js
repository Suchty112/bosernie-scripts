// ==UserScript==
// @name        * Lehrgangszuweiser
// @namespace   bos-ernie.leitstellenspiel.de
// @version     1.5.0
// @license     BSD-3-Clause
// @author      BOS-Ernie
// @description Fügt Buttons hinzu, um zwischen 1 und 10 Personen einer Wache auf einmal einem Lehrgang zuzuweisen.
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
// @resource    https://forum.leitstellenspiel.de/index.php?thread/23382-script-lehrgangszuweiser-by-bos-ernie/
// ==/UserScript==
 
/* global loadedBuildings */
 
(function () {
  let requiredNumberOfPersonnel = null;
 
  document.addEventListener("educationValueChanged", function (e) {
    const numberOfRequiredPersonnel = e.detail;
    if (numberOfRequiredPersonnel === requiredNumberOfPersonnel) {
      return;
    }
 
    requiredNumberOfPersonnel = numberOfRequiredPersonnel;
    renderPersonnelSelectors();
  });
 
  function renderPersonnelSelectors() {
    let elements = document.getElementsByClassName("panel-heading personal-select-heading");
    for (let i = 0; i < elements.length; i++) {
      let buildingId = elements[i].getAttribute("building_id");
      elements[i].children[0].appendChild(createPersonnelSelector(buildingId));
    }
 
    $(".personal-select-heading").unbind("click").bind("click", panelHeadingClickEvent);
  }
 
  async function selectPersonnelClick(event) {
    await selectPersonnel(event.target.dataset.buildingId, event.target.dataset.capacity);
    event.preventDefault();
  }
 
  async function resetPersonnelClick(event) {
    await resetPersonnel(event.target.dataset.buildingId);
    event.preventDefault();
  }
 
  async function panelHeadingClickEvent(event) {
    // Skip redundant panelHeadingClick call which is handled by button click event
    if (
      event.target.classList.contains("schooling-personnel-select-button") ||
      event.target.parentNode.classList.contains("schooling-personnel-reset-button")
    ) {
      return;
    }
 
    let buildingIdElement = event.target.outerHTML.match(/building_id="(\d+)"/);
    if (buildingIdElement === null) {
      buildingIdElement =
        event.target.parentElement.parentElement.parentElement.parentElement.outerHTML.match(/building_id="(\d+)"/);
    }
 
    await panelHeadingClick(buildingIdElement[1], true);
  }
 
  async function panelHeadingClick(buildingId, toggle = false) {
    const panelHeading = getPanelHeading(buildingId);
    const panelBody = document.querySelector(".panel-body[building_id='" + buildingId + "']");
 
    const href = panelHeading.outerHTML.match(/href="([^"]+)"/)[1];
 
    if (panelBody.classList.contains("hidden")) {
      if (toggle) {
        panelBody.classList.remove("hidden");
      }
 
      if (loadedBuildings.indexOf(href) === -1) {
        loadedBuildings.push(href);
        await $.get(href, function (data) {
          $(".panel-body[building_id='" + buildingId + "']").html(data);
 
          const education_key = $("input[name=education]:checked").attr("education_key");
 
          if (typeof education_key == "undefined" && typeof globalEducationKey != "undefined") {
            schooling_disable(globalEducationKey);
          } else if (typeof education_key != "undefined") {
            schooling_disable(education_key);
            update_schooling_free();
          }
        });
      }
    } else if (toggle) {
      panelBody.classList.add("hidden");
    }
  }
 
  function createPersonnelSelector(buildingId) {
    let existingButtonGroup = document.getElementById("schooling-assigner-" + buildingId);
    if (existingButtonGroup) {
      existingButtonGroup.remove();
    }
 
    let buttonGroup = document.createElement("div");
    buttonGroup.id = "schooling-assigner-" + buildingId;
    buttonGroup.className = "btn-group btn-group-xs";
 
    let resetIcon = document.createElement("span");
    resetIcon.className = "glyphicon glyphicon-trash";
    resetIcon.dataset.buildingId = buildingId;
 
    let resetButton = document.createElement("button");
    resetButton.type = "button";
    resetButton.className = "btn btn-default btn-sm schooling-personnel-reset-button";
    resetButton.appendChild(resetIcon);
    resetButton.addEventListener("click", resetPersonnelClick);
 
    buttonGroup.appendChild(resetButton);
 
    for (let i = 1; i < 11; i++) {
      let button = document.createElement("button");
      button.type = "button";
      button.className = "btn btn-default btn-sm schooling-personnel-select-button";
      button.dataset.buildingId = buildingId;
      button.dataset.capacity = i.toString();
      button.textContent = i.toString();
      button.addEventListener("click", selectPersonnelClick);
 
      buttonGroup.appendChild(button);
    }
 
    if (requiredNumberOfPersonnel > 10) {
      let button = document.createElement("button");
      button.type = "button";
      button.className = "btn btn-default btn-sm schooling-personnel-select-button";
      button.dataset.buildingId = buildingId;
      button.dataset.capacity = requiredNumberOfPersonnel.toString();
      button.textContent = requiredNumberOfPersonnel.toString();
      button.addEventListener("click", selectPersonnelClick);
 
      buttonGroup.appendChild(button);
    }
 
    return buttonGroup;
  }
 
  async function selectPersonnel(buildingId, capacity) {
    await panelHeadingClick(buildingId);
 
    let schoolingFree = $("#schooling_free");
    let free = schoolingFree.html();
    $(".schooling_checkbox[building_id='" + buildingId + "']").each(function () {
      if (!$(this).prop("checked") && !$(this).prop("disabled") && free > 0 && capacity > 0) {
        const educationCell = document.getElementById("school_personal_education_" + $(this).val());
        const vehicleAssignmentCell = educationCell.nextElementSibling;
 
        if (educationCell.innerHTML.trim() === "" && vehicleAssignmentCell.innerHTML.trim() === "") {
          $(this).prop("checked", true);
          --free;
          --capacity;
        }
      }
    });
 
    schoolingFree.html(free);
    update_costs();
 
    updateSelectionCounter(buildingId);
  }
 
  async function resetPersonnel(buildingId) {
    await panelHeadingClick(buildingId);
 
    let schoolingFree = $("#schooling_free");
    let free = schoolingFree.html();
 
    $(".schooling_checkbox[building_id='" + buildingId + "']").each(function () {
      if ($(this).prop("checked")) {
        $(this).prop("checked", false);
        ++free;
      }
    });
 
    schoolingFree.html(free);
    update_costs();
 
    updateSelectionCounter(buildingId);
  }
 
  function countSelectedPersonnel(buildingId) {
    let count = 0;
    let checkboxes = document.querySelectorAll(".schooling_checkbox[building_id='" + buildingId + "']");
 
    for (let i = 0; i < checkboxes.length; i++) {
      if (checkboxes[i].checked) {
        count++;
      }
    }
 
    return count;
  }
 
  function updateSelectionCounter(buildingId) {
    const element_id = "personnel-selection-counter-" + buildingId;
 
    let counter = document.createElement("span");
    counter.id = element_id;
    counter.className = "label label-primary";
    counter.textContent = countSelectedPersonnel(buildingId) + " ausgewählt";
 
    const element = document.getElementById(element_id);
 
    if (element) {
      element.replaceWith(counter);
    } else {
      document.getElementById("schooling-assigner-" + buildingId).parentNode.prepend(counter);
    }
  }
 
  function getPanelHeading(buildingId) {
    return document.querySelector(".personal-select-heading[building_id='" + buildingId + "']");
  }
 
  function main() {
    // Skip hire personnel page
    if (window.location.href.match(/\/buildings\/\d+\/hire/)) {
      return;
    }
 
    renderPersonnelSelectors();
    document.addEventListener("lehrgangszuweiser:render-personnel-selectors", renderPersonnelSelectors);
  }
 
  main();
})();