let recentColors = []; // Liste pour suivre les dernières couleurs
let recentParities = []; // Liste pour suivre les dernières parités
let recentRanges = []; // Liste pour suivre les dernières plages

function getColor(number) {
  if (number == 0) return "green";
  const redNumbers = [
    1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
  ];
  return redNumbers.includes(parseInt(number)) ? "red" : "black";
}

function getParity(number) {
  if (number == 0) return "0 (neutre)";
  return number % 2 === 0 ? "Pair" : "Impair";
}

function getParityColor(number) {
  if (number == 0) return "green";
  return number % 2 === 0 ? "blue" : "yellow";
}

function getRange(number) {
  if (number == 0) return { text: "Hors plage", color: "green" };
  if (number >= 1 && number <= 18) return { text: "1 à 18", color: "orange" };
  if (number >= 19 && number <= 36) return { text: "19 à 36", color: "purple" };
}

function checkAlternance(array, conditionName) {
  // Exclure le 0 des vérifications d'alternance
  const filteredArray = array.filter(
    (item) => item !== "green" && item !== "0 (neutre)"
  );

  if (filteredArray.length >= 5) {
    const lastFive = filteredArray.slice(-5);
    const alternance = lastFive.every((item, index, arr) => {
      return index === 0 || item !== arr[index - 1];
    });
    if (alternance) {
      alert(`Attention : alternance de 5 ${conditionName} consécutifs !`);
    }
  }
}

function addNumber() {
  const input = document.getElementById("numberInput");
  const number = parseInt(input.value);

  if (number >= 0 && number <= 36) {
    const tableBody = document.getElementById("numberTableBody");

    // Déterminer la couleur
    const color = getColor(number);
    recentColors.push(color);
    if (recentColors.length > 10) recentColors.shift(); // Limite à 10 derniers éléments

    // Déterminer la parité
    const parity = getParity(number);
    recentParities.push(parity);
    if (recentParities.length > 10) recentParities.shift(); // Limite à 10 derniers éléments

    // Déterminer la plage
    const range = getRange(number);
    if (number !== 0) {
      // Exclure le 0 des plages
      recentRanges.push(range.text);
      if (recentRanges.length > 10) recentRanges.shift(); // Limite à 10 derniers éléments
    }

    // Vérifier l'alternance
    checkAlternance(recentColors, "rouges/noirs");
    checkAlternance(recentParities, "pairs/impairs");
    checkAlternance(recentRanges, "plages 1-18 / 19-36");

    // Création d'une nouvelle ligne
    const row = document.createElement("tr");

    // Colonne Couleur
    const colorCell = document.createElement("td");
    colorCell.textContent = color.charAt(0).toUpperCase() + color.slice(1); // Capitalise
    colorCell.classList.add(color);

    // Colonne Numéro
    const numberCell = document.createElement("td");
    numberCell.textContent = number;

    // Colonne Parité
    const parityCell = document.createElement("td");
    parityCell.textContent = parity;
    parityCell.classList.add(getParityColor(number));

    // Colonne Plage
    const rangeCell = document.createElement("td");
    rangeCell.textContent = range.text;
    rangeCell.classList.add(range.color);

    // Ajouter les colonnes à la ligne
    row.appendChild(colorCell);
    row.appendChild(numberCell);
    row.appendChild(parityCell);
    row.appendChild(rangeCell);

    // Ajouter la ligne en haut du tableau
    tableBody.insertBefore(row, tableBody.firstChild);

    // Réinitialiser le champ d'entrée
    input.value = "";
    saveTableState();
  } else {
    alert("Veuillez entrer un numéro valide entre 0 et 36.");
  }
}

function saveTableState() {
  const tableBody = document.getElementById("numberTableBody");
  const rows = Array.from(tableBody.children);
  const tableData = rows.map((row) => {
    return Array.from(row.children).map((cell) => ({
      text: cell.textContent,
      class: cell.className,
    }));
  });
  localStorage.setItem("tableData", JSON.stringify(tableData));
}

function loadTableState() {
  const tableData = JSON.parse(localStorage.getItem("tableData")) || [];
  const tableBody = document.getElementById("numberTableBody");

  tableData.forEach((rowData) => {
    const row = document.createElement("tr");
    rowData.forEach((cellData) => {
      const cell = document.createElement("td");
      cell.textContent = cellData.text;
      if (cellData.class) cell.className = cellData.class;
      row.appendChild(cell);
    });
    tableBody.appendChild(row);
  });
}

function clearTable() {
  const tableBody = document.getElementById("numberTableBody");
  tableBody.innerHTML = ""; // Supprime tout le contenu du tableau
  localStorage.removeItem("tableData"); // Supprime les données du localStorage
  recentColors = [];
  recentParities = [];
  recentRanges = [];
}

document.addEventListener("DOMContentLoaded", loadTableState);
