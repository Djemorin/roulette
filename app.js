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

function addValue() {
  const input = document.getElementById("valueInput");
  const value = input.value.trim();
  const number = parseInt(value);

  // Vérifie si la valeur est un nombre valide
  if (!isNaN(number) && number >= 0 && number <= 36) {
    const tableBody = document.getElementById("valueTableBody");
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
    tableBody.appendChild(row);

    // Réinitialise le champ de saisie
    input.value = "";
  } else {
    alert("Veuillez entrer un numéro valide entre 0 et 36.");
  }
}
