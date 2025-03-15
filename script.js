const numbers = [];
const resultsContainer = document.getElementById("results-container");
const numberInput = document.getElementById("numberInput");
const addButton = document.getElementById("addButton");

// Historique des alternances pour chaque type
let lastValues = {
  evenOdd: null,
  redBlack: null,
  passManque: null,
};

// Ajouter ces variables globales
let hasActiveSequence = false; // true quand une alerte est déclenchée
let sequenceType = null; // type d'alternance active
let lastValue = null; // dernière valeur pour vérifier l'alternance
let sequenceBroken = false; // Devient true quand on rencontre un "-1"

// Ajouter après les variables globales
const alternanceValues = []; // Stocke les valeurs d'alternance pour chaque tirage

function isEven(num) {
  return num % 2 === 0;
}

function getAlternanceValue(currentNum, index) {
  // Valeurs déjà stockées sont intouchables
  if (alternanceValues[index] !== undefined) {
    return alternanceValues[index];
  }

  // Uniquement pour le dernier numéro
  const currentIndex = numbers.length - 1;
  if (index !== currentIndex) {
    return null;
  }

  // Pour le zéro, retourner toujours "-0.5" et ne pas modifier la séquence
  if (currentNum === 0) {
    alternanceValues[index] = "-0.5";
    return alternanceValues[index];
  }

  if (!hasActiveSequence) {
    return null;
  }

  // Ne traiter l'alternance que pour les nombres non-zéro
  const currentInfo = getNumberInfo(currentNum);

  // Trouver le dernier nombre non-zéro pour la comparaison
  let previousIndex = index - 1;
  while (previousIndex >= 0 && numbers[previousIndex] === 0) {
    previousIndex--;
  }

  if (previousIndex >= 0) {
    const previousInfo = getNumberInfo(numbers[previousIndex]);
    if (currentInfo[sequenceType] !== previousInfo[sequenceType]) {
      alternanceValues[index] = "  +1";
    } else {
      alternanceValues[index] = "  -1";
      hasActiveSequence = false;
    }
  }

  return alternanceValues[index];
}

function getNumberInfo(num) {
  return {
    color: [
      1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
    ].includes(num)
      ? "rouge"
      : "noir",
    evenOdd: num % 2 === 0 ? "pair" : "impair",
    passManque: num >= 19 ? "passe" : "manque",
  };
}

function getLastSeen(num, index) {
  const previousNumbers = numbers.slice(0, index);
  const lastIndex = previousNumbers.lastIndexOf(num);
  return lastIndex === -1 ? "-" : index - lastIndex;
}

function updateDisplay() {
  resultsContainer.innerHTML = numbers
    .map((n, index) => {
      const info = getNumberInfo(n);
      const lastSeen = getLastSeen(n, index);
      const alternanceValue = getAlternanceValue(n, index);

      const alternanceHtml = alternanceValue
        ? `<span class="info-box">${alternanceValue}</span>`
        : `<span class="info-box"></span>`;

      if (n === 0) {
        return `<div class="number-row">
                <span class="number" style="background-color: #4CAF50">${n}</span>
                <span class="info-box">Zero</span>
                ${alternanceHtml}
                <span class="info-box last-seen">${lastSeen} tours</span>
            </div>`;
      }

      return `<div class="number-row">
            <span class="number ${info.color}">${n}</span>
            <span class="info-box ${info.color}">${info.color}</span>
            <span class="info-box ${info.evenOdd}">${info.evenOdd}</span>
            <span class="info-box ${info.passManque}">${info.passManque}</span>
            ${alternanceHtml}
            <span class="info-box last-seen">${lastSeen} tours</span>
        </div>`;
    })
    .join("");

  // Scroll to bottom
  setTimeout(() => {
    resultsContainer.scrollTop = resultsContainer.scrollHeight;
  }, 100);
}

function addNumber() {
  const number = parseInt(numberInput.value);
  if (number >= 0 && number <= 36) {
    numbers.push(number);
    numberInput.value = ""; // Réinitialiser l'input avant tout
    checkAlternances(); // Vérifier les alternances ensuite
    updateDisplay(); // Mettre à jour l'affichage en dernier
  } else {
    alert("Veuillez entrer un numéro entre 0 et 36");
  }
}

function handleKeyPress(event) {
  if (event.key === "Enter") {
    addNumber();
  }
}

function checkAlternances() {
  const currentIndex = numbers.length - 1;
  const currentNum = numbers[currentIndex];

  // Si c'est un zéro et qu'une séquence est active, alerter l'utilisateur
  if (currentNum === 0 && hasActiveSequence) {
    alert(
      `Attention : Un zéro est sorti pendant une série d'alternances ${
        sequenceType === "color"
          ? "Rouge/Noir"
          : sequenceType === "evenOdd"
          ? "Pair/Impair"
          : "Passe/Manque"
      } !`
    );
    return;
  }

  // Ne pas traiter les zéros dans la détection d'alternances
  if (currentNum === 0) return;

  const nonZeroNumbers = numbers.filter((n) => n !== 0);
  if (nonZeroNumbers.length < 6) return;

  const last6 = nonZeroNumbers.slice(-6);
  const info = last6.map((n) => getNumberInfo(n));

  ["color", "evenOdd", "passManque"].forEach((type) => {
    const sequence = info.map((i) => i[type]);
    if (sequence.every((val, i) => i === 0 || val !== sequence[i - 1])) {
      hasActiveSequence = true;
      sequenceType = type;
      alternanceValues[currentIndex] = "  +1";
      alert(
        `Attention : 6 alternances ${
          type === "color"
            ? "Rouge/Noir"
            : type === "evenOdd"
            ? "Pair/Impair"
            : "Passe/Manque"
        } consécutives !`
      );
    }
  });
}

// Event Listeners
numberInput.addEventListener("keypress", handleKeyPress);
addButton.addEventListener("click", addNumber);

document.addEventListener("DOMContentLoaded", function () {
  const input = document.getElementById("numberInput");
  const button = document.getElementById("addButton");
  input.addEventListener("keypress", handleKeyPress);
  button.addEventListener("click", addNumber);
});
