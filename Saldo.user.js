// ==UserScript==
// @name        * Saldo
// @namespace   bos-ernie.leitstellenspiel.de
// @version     1.2.0
// @license     BSD-3-Clause
// @author      BOS-Ernie
// @description Ergänzt eine Zeile mit den Spaltensummen zur Creditsübersicht
// @match       https://www.leitstellenspiel.de/credits/overview
// @icon        https://www.google.com/s2/favicons?sz=64&domain=leitstellenspiel.de
// @run-at      document-idle
// @grant       none
// @resource    https://forum.leitstellenspiel.de/index.php?thread/25282-script-saldo-by-bos-ernie/
// ==/UserScript==
 
(function () {
  const table = document.querySelector("table");
 
  function reorderColumns() {
    const rows = table.rows;
 
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const cells = row.cells;
      const balanceCell = cells[0];
      const revenueCell = cells[1];
      const expenditureCell = cells[2];
      const dateCell = cells[3];
 
      row.removeChild(balanceCell);
      row.removeChild(revenueCell);
      row.removeChild(expenditureCell);
      row.removeChild(dateCell);
 
      expenditureCell.classList.add("text-right");
      revenueCell.classList.add("text-right");
      balanceCell.classList.add("text-right");
 
      row.appendChild(dateCell);
      row.appendChild(expenditureCell);
      row.appendChild(revenueCell);
      row.appendChild(balanceCell);
    }
  }
 
  function sum(columnIndex) {
    const cells = table.querySelectorAll(`tbody tr td:nth-child(${columnIndex})`);
    let sum = 0;
    cells.forEach(cell => {
      sum += parseInt(cell.textContent.replace(/\./g, ""));
    });
    return sum;
  }
 
  function addFooter() {
    const sumOfRevenue = sum(2);
    const sumOfExpenditure = sum(3);
    const sumOfBalance = sum(4);
 
    const dateCell = document.createElement("td");
    dateCell.textContent = "Summe";
 
    const revenueCell = document.createElement("td");
    revenueCell.textContent = sumOfRevenue.toLocaleString();
    revenueCell.classList.add("text-right");
 
    const expenditureCell = document.createElement("td");
    expenditureCell.textContent = sumOfExpenditure.toLocaleString();
    expenditureCell.classList.add("text-right");
 
    const balanceCell = document.createElement("td");
    balanceCell.classList.add(sumOfBalance < 0 ? "text-danger" : "text-success");
    balanceCell.textContent = sumOfBalance.toLocaleString();
    balanceCell.classList.add("text-right");
 
    const footerRow = document.createElement("tr");
    footerRow.style.fontWeight = "bold";
    footerRow.appendChild(dateCell);
    footerRow.appendChild(revenueCell);
    footerRow.appendChild(expenditureCell);
    footerRow.appendChild(balanceCell);
 
    const footer = document.createElement("tfoot");
    footer.appendChild(footerRow);
 
    table.appendChild(footer);
  }
 
  function main() {
    table.querySelector("thead tr th").textContent = "Saldo";
    table.classList.add("table-hover");
 
    reorderColumns();
    addFooter();
  }
 
  main();
})();