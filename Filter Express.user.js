// ==UserScript==
// @name        * Filter Express
// @namespace   bos-ernie.leitstellenspiel.de
// @version     1.1.0
// @license     BSD-3-Clause
// @author      BOS-Ernie
// @description Fügt Buttons zum schnellen Wechseln zwischen den Filter-Optionen hinzu.
// @match       https://www.leitstellenspiel.de/
// @match       https://polizei.leitstellenspiel.de/
// @icon        https://www.google.com/s2/favicons?sz=64&domain=leitstellenspiel.de
// @run-at      document-idle
// @grant       none
// @resource    https://forum.leitstellenspiel.de/index.php?thread/28150-skript-filter-express-blitzschnelles-filtern-sortieren-der-einsatzliste/
// ==/UserScript==
 
/* global $, progressBarScrollUpdate, missionSelectionActive, missionSelectionDeactive, missionSelectionOnly */
(function () {
  /*
   * BEGINN DER BENUTZERKONFIGURATION - BUTTONS ANPASSEN
   *
   * Jeder Button wird durch ein Objekt in der buttonConfig-Array definiert.
   * Verfügbare Optionen für jeden Button:
   *
   * - text:              Der auf dem Button angezeigte Text (z.B. "M", "V", etc.)
   * - title:             Der Tooltip-Text (wird beim Hovern angezeigt)
   * - action:            Die Aktion, die beim Klick ausgeführt wird
   *   ├─ sources:        Array von Quellen-Filtern
   *   ├─ states:         Array von Status-Filtern
   *   ├─ participations: Array von Beteiligungs-Filtern
   *   └─ sorting:        Sortierkonfiguration {key, direction}
   *
   * Verfügbare Filter- und Sortieroptionen:
   *
   * SOURCES:
   * - "own"                Eigene Einsätze ("Notfälle")
   * - "patient_transport"  Krankentransporte
   * - "alliance"           Verbandseinsätze
   * - "event"              Event-Einsätze
   * - "planned"            Geplante Einsätze
   *
   * STATES:
   * - "red"     Unbearbeitete Einsätze
   * - "yellow"  Bearbeitete Einsätze
   * - "green"   Einsätze in Durchführung
   *
   * PARTICIPATIONS:
   * - "without"  Einsätze ohne eigener Beteiligung ("Neue Einsätze")
   * - "with"     Einsätze mit eigener Beteiligung ("Gestartete Einsätze")
   *
   * SORTING KEYS:
   * - "shared_at"   Alter des Einsatzes (Freigeben)
   * - "created_at"  Alter des Einsatzes (Erstellt)
   * - "caption"     Einsatzname (A bis Z)
   * - "credits"     Durchschnittliche Belohnung (Credits)
   * - "prisoners"   Anzahl der Gefangenen
   * - "patients"    Anzahl der Patienten
   *
   * SORTING DIRECTIONS:
   * - "asc"  Aufsteigend (A-Z, 1-9)
   * - "desc" Absteigend (Z-A, 9-1)
   */
  const buttonConfig = [
    {
      text: "M",
      title: "Unbearbeitete eigene Einsätze",
      action: {
        sources: ["own"],
        states: ["red", "yellow", "green"],
        participations: ["without"],
        sorting: { key: "shared_at", direction: "asc" },
      },
    },
    {
      text: "M:$↑",
      title: "Unbearbeitete eigene Einsätze sortiert nach Credits aufsteigend",
      action: {
        sources: ["own"],
        states: ["red", "yellow", "green"],
        participations: ["without"],
        sorting: { key: "credits", direction: "asc" },
      },
    },
    {
      text: "M:R",
      title: "Alle eigenen roten Einsätze",
      action: {
        sources: ["own"],
        states: ["red"],
        participations: ["without", "with"],
        sorting: { key: "shared_at", direction: "asc" },
      },
    },
    {
      text: "V",
      title: "Unbearbeitete Verbandseinsätze",
      action: {
        sources: ["alliance"],
        states: ["red", "yellow", "green"],
        participations: ["without"],
        sorting: { key: "shared_at", direction: "asc" },
      },
    },
    {
      text: "V:$↓",
      title: "Unbearbeitete Verbandseinsätze sortiert nach Credits absteigend",
      action: {
        sources: ["alliance"],
        states: ["red", "yellow", "green"],
        participations: ["without"],
        sorting: { key: "credits", direction: "desc" },
      },
    },
    {
      text: "E",
      title: "Unbearbeitete Event-Einsätze",
      action: {
        sources: ["event"],
        states: ["red", "yellow", "green"],
        participations: ["without"],
        sorting: { key: "shared_at", direction: "asc" },
      },
    },
    {
      text: "E:P",
      title: "Event-Einsätze sortiert nach Patienten",
      action: {
        sources: ["event"],
        states: ["red", "yellow", "green"],
        participations: ["without", "with"],
        sorting: { key: "patients", direction: "desc" },
      },
    },
    {
      text: "G",
      title: "Unbearbeitete geplante Einsätze",
      action: {
        sources: ["planned"],
        states: ["red", "yellow", "green"],
        participations: ["without"],
        sorting: { key: "shared_at", direction: "asc" },
      },
    },
    {
      text: "VG",
      title: "Unbearbeitete Verbands- und geplante Einsätze",
      action: {
        sources: ["alliance", "planned"],
        states: ["red", "yellow", "green"],
        participations: ["without"],
        sorting: { key: "shared_at", direction: "asc" },
      },
    },
  ];
 
  // ENDE DER BENUTZERKONFIGURATION
  // Ab hier folgt der Skript-Code - Änderungen nur für fortgeschrittene Benutzer empfohlen!
 
  // Mapping der sprechenden Strings auf die tatsächlichen Werte
  const sourceMapping = {
    own: "#mission_select_emergency",
    patient_transport: "#mission_select_krankentransporte",
    alliance: "#mission_select_alliance",
    event: "#mission_select_alliance_event",
    planned: "#mission_select_sicherheitswache",
  };
 
  const stateMapping = {
    red: "#mission_select_unattended",
    yellow: "#mission_select_attended",
    green: "#mission_select_finishing",
  };
 
  const participationMapping = {
    without: "#mission_select_new",
    with: "#mission_select_started",
  };
 
  const sortingMapping = {
    shared_at: "age",
    created_at: "created_at",
    caption: "caption",
    credits: "average_credits",
    prisoners: "prisoners_count",
    patients: "patients_count",
  };
 
  function mapSources(sources) {
    return sources.map(source => {
      if (sourceMapping[source]) {
        return sourceMapping[source];
      }
      console.error(`[Filter Express] Unknown source: ${source}`);
      return source;
    });
  }
 
  function mapStates(states) {
    return states.map(state => {
      if (stateMapping[state]) {
        return stateMapping[state];
      }
      console.error(`[Filter Express] Unknown state: ${state}`);
      return state;
    });
  }
 
  function mapParticipations(participations) {
    return participations.map(participation => {
      if (participationMapping[participation]) {
        return participationMapping[participation];
      }
      console.error(`[Filter Express] Unknown participation: ${participation}`);
      return participation;
    });
  }
 
  const supportedSources = Object.values(sourceMapping);
  const supportedStates = Object.values(stateMapping);
  const supportedParticipations = Object.values(participationMapping);
  const supportedSortingDirections = ["asc", "desc"];
 
  function sortMissions(key, direction) {
    const mappedKey = sortingMapping[key];
    if (!mappedKey) {
      console.error(`[Filter Express] Unable to sort missions: key ${key} is not mapped`);
      return;
    }
 
    if (!supportedSortingDirections.includes(direction)) {
      console.error(`[Filter Express] Unable to sort missions: direction ${direction} is not allowed`);
      return;
    }
 
    const select = document.querySelector("#missions-sortable-select");
    if (!select) {
      console.error("[Filter Express] Unable to sort missions: select not found");
      return;
    }
 
    const options = Array.from(select.options);
    const option = options.find(option => {
      return (
        option.getAttribute("data-sort-key") === mappedKey && option.getAttribute("data-sort-direction") === direction
      );
    });
 
    if (option) {
      select.value = option.value;
      select.dispatchEvent(new Event("change"));
    } else {
      console.error(
        `[Filter Express] Unable to sort missions: option not found for key ${mappedKey} (mapped from ${key}) and direction ${direction}`,
      );
    }
  }
 
  function selectSources(sources) {
    if (!Array.isArray(sources)) {
      console.error(`[Filter Express] Unable to select source: ${sources} is not an array`);
      return;
    }
 
    const mappedSources = mapSources(sources);
    const unsupportedSources = mappedSources.filter(source => !supportedSources.includes(source));
    if (unsupportedSources.length > 0) {
      console.error(`[Filter Express] Unable to select source: ${unsupportedSources} are not supported`);
      return;
    }
 
    supportedSources.forEach(source => {
      if (!mappedSources.includes(source)) {
        missionSelectionDeactive($(source));
      } else {
        missionSelectionActive($(source));
      }
    });
  }
 
  function selectStates(states) {
    if (!Array.isArray(states)) {
      console.error(`[Filter Express] Unable to select state: ${states} is not an array`);
      return;
    }
 
    const mappedStates = mapStates(states);
    const unsupportedStates = mappedStates.filter(state => !supportedStates.includes(state));
    if (unsupportedStates.length > 0) {
      console.error(`[Filter Express] Unable to select state: ${unsupportedStates} are not supported`);
      return;
    }
 
    supportedStates.forEach(state => {
      if (!mappedStates.includes(state)) {
        missionSelectionDeactive($(state));
      } else {
        missionSelectionActive($(state));
      }
    });
  }
 
  function selectParticipations(participations) {
    if (!Array.isArray(participations)) {
      console.error(`[Filter Express] Unable to select participation: ${participations} is not an array`);
      return;
    }
 
    const mappedParticipations = mapParticipations(participations);
    const unsupportedParticipations = mappedParticipations.filter(
      participation => !supportedParticipations.includes(participation),
    );
    if (unsupportedParticipations.length > 0) {
      console.error(`[Filter Express] Unable to select participation: ${unsupportedParticipations} are not supported`);
      return;
    }
 
    supportedParticipations.forEach(participation => {
      if (!mappedParticipations.includes(participation)) {
        missionSelectionDeactive($(participation));
      } else {
        missionSelectionActive($(participation));
      }
    });
  }
 
  function createButtonHandler(config) {
    return function () {
      if (config.action.sources) selectSources(config.action.sources);
      if (config.action.states) selectStates(config.action.states);
      if (config.action.participations) selectParticipations(config.action.participations);
      if (config.action.sorting) sortMissions(config.action.sorting.key, config.action.sorting.direction);
    };
  }
 
  function addButtonGroup() {
    const buttonGroup = document.createElement("div");
    buttonGroup.className = "btn-group btn-group-xs";
    buttonGroup.style.marginLeft = "10px";
 
    buttonConfig.forEach(config => {
      const button = document.createElement("button");
      button.className = "btn btn-default";
      button.innerText = config.text;
      button.title = config.title;
      button.onclick = createButtonHandler(config);
      buttonGroup.appendChild(button);
    });
 
    const lastElement = document.querySelector("#missions-panel-main > div:last-child");
    if (!lastElement) {
      console.error("[Filter Express] Unable to render button group: lastElement not found");
      return;
    }
 
    lastElement.parentNode.insertBefore(buttonGroup, lastElement);
  }
 
  addButtonGroup();
})();