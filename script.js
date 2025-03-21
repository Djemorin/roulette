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

// Remplacer les variables globales de séquence par un objet qui gère les 3 types
const activeSequences = {
  color: { active: false, broken: false },
  evenOdd: { active: false, broken: false },
  passManque: { active: false, broken: false },
};

// Ajouter après les variables globales
const alternanceValues = []; // Stocke les valeurs d'alternance pour chaque tirage

function isEven(num) {
  return num % 2 === 0;
}

// Modifier la fonction getAlternanceValue
function getAlternanceValue(currentNum, type, index) {
  if (alternanceValues[index] === undefined) {
    alternanceValues[index] = {};
  }

  if (alternanceValues[index][type] !== undefined) {
    return alternanceValues[index][type];
  }

  const currentIndex = numbers.length - 1;
  if (index !== currentIndex) {
    return null;
  }

  if (currentNum === 0) {
    alternanceValues[index][type] = "-0.5";
    return alternanceValues[index][type];
  }

  if (!activeSequences[type].active) {
    return null;
  }

  const currentInfo = getNumberInfo(currentNum);
  let previousIndex = index - 1;
  while (previousIndex >= 0 && numbers[previousIndex] === 0) {
    previousIndex--;
  }

  if (previousIndex >= 0) {
    const previousInfo = getNumberInfo(numbers[previousIndex]);
    if (currentInfo[type] !== previousInfo[type]) {
      alternanceValues[index][type] = "  +1";
    } else {
      alternanceValues[index][type] = "  -1";
      activeSequences[type].active = false;
    }
  }

  return alternanceValues[index][type];
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

// Modifier la fonction updateDisplay
function updateDisplay() {
  resultsContainer.innerHTML = numbers
    .map((n, index) => {
      const info = getNumberInfo(n);
      const lastSeen = getLastSeen(n, index);

      const colorValue = getAlternanceValue(n, "color", index);
      const evenOddValue = getAlternanceValue(n, "evenOdd", index);
      const passManqueValue = getAlternanceValue(n, "passManque", index);

      if (n === 0) {
        return `<div class="number-row">
                    <span class="number" style="background-color: #4CAF50">${n}</span>
                    <span class="info-box">Zero</span>
                    <span class="info-box last-seen">${lastSeen} tours</span>
                </div>`;
      }

      return `<div class="number-row">
                <span class="number ${info.color}">${n}</span>
                <span class="info-box ${info.color}">${
        colorValue || info.color
      }</span>
                <span class="info-box ${info.evenOdd}">${
        evenOddValue || info.evenOdd
      }</span>
                <span class="info-box ${info.passManque}">${
        passManqueValue || info.passManque
      }</span>
                <span class="info-box last-seen">${lastSeen} tours</span>
            </div>`;
    })
    .join("");

  resultsContainer.scrollTop = resultsContainer.scrollHeight;
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

// Modifier la fonction checkAlternances
function checkAlternances() {
  const currentIndex = numbers.length - 1;
  const currentNum = numbers[currentIndex];

  if (currentNum === 0) {
    return;
  }

  const nonZeroNumbers = numbers.filter((n) => n !== 0);
  if (nonZeroNumbers.length < 6) return;

  const last6 = nonZeroNumbers.slice(-6);
  const info = last6.map((n) => getNumberInfo(n));

  ["color", "evenOdd", "passManque"].forEach((type) => {
    const sequence = info.map((i) => i[type]);
    if (sequence.every((val, i) => i === 0 || val !== sequence[i - 1])) {
      activeSequences[type].active = true;
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
