// let recentColors = []; // Liste pour suivre les dernières couleurs
let recentParities = []; // Liste pour suivre les dernières parités
let recentRanges = []; // Liste pour suivre les dernières plages

// Détermine la couleur selon les règles de la roulette
function getRouletteColor(number) {
  if (number === 0) {
    return "green"; // Le zéro est vert
  }
  const redNumbers = [
    1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
  ];
  return redNumbers.includes(number) ? "red" : "black";
}

// Détermine la parité : pair, impair ou zéro
function getParityColor(number) {
  if (number === 0) {
    return { color: "green", label: "Zéro" };
  }
  return number % 2 === 0
    ? { color: "blue", label: "Pair" }
    : { color: "yellow", label: "Impair" };
}

// Détermine la plage du numéro (1-18 ou 19-36)
function getRangeInfo(number) {
  if (number >= 1 && number <= 18) {
    return { color: "orange", label: "1-18" };
  } else if (number >= 19 && number <= 36) {
    return { color: "violet", label: "19-36" };
  } else {
    return { color: "gray", label: "Hors plage" }; // Pour 0 ou valeurs invalides
  }
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

function addValue() {
  const input = document.getElementById("valueInput");
  const value = input.value.trim();
  const number = parseInt(value);

  // Vérifie si la valeur est un nombre valide
  if (!isNaN(number) && number >= 0 && number <= 36) {
    const tableBody = document.getElementById("valueTableBody");

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

    const row = document.createElement("tr");

    // Détermine la couleur de la roulette
    const rouletteColor = getRouletteColor(number);

    // Détermine la parité et sa couleur
    const parityInfo = getParityColor(number);

    // Détermine la plage et sa couleur
    const rangeInfo = getRangeInfo(number);

    // Colonne pour la couleur de la roulette
    const colorCell = document.createElement("td");
    colorCell.className = rouletteColor;
    colorCell.textContent =
      rouletteColor.charAt(0).toUpperCase() + rouletteColor.slice(1);

    // Colonne pour la valeur
    const valueCell = document.createElement("td");
    valueCell.textContent = value;

    // Colonne pour la parité
    const parityCell = document.createElement("td");
    parityCell.className = parityInfo.color;
    parityCell.textContent = parityInfo.label;

    // Colonne pour la plage (1-18 ou 19-36)
    const rangeCell = document.createElement("td");
    rangeCell.className = rangeInfo.color;
    rangeCell.textContent = rangeInfo.label;

    // Ajoute les cellules à la ligne
    row.appendChild(colorCell);
    row.appendChild(valueCell);
    row.appendChild(parityCell);
    row.appendChild(rangeCell);

    // Ajoute la ligne au tableau
    // tableBody.appendChild(row);
    tableBody.insertBefore(row, tableBody.firstChild);

    // Réinitialise le champ de saisie
    input.value = "";
  } else {
    alert("Veuillez entrer un numéro valide entre 0 et 36.");
  }
}
