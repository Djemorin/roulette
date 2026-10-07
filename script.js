const numbers = [];
const resultsContainer = document.getElementById("results-container");
const numberInput = document.getElementById("numberInput");
const addButton = document.getElementById("addButton");
const closedGrid = document.getElementById("closed-grid");

// Ordre officiel du cylindre (roulette européenne), sens horaire à partir du 32
const WHEEL_ORDER = [
  32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16,
  33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];

// Historique des alternances pour chaque type
let lastValues = {
  evenOdd: null,
  redBlack: null,
  passManque: null,
};

// Modifier la déclaration de activeSequences
const activeSequences = {
  color: { active: false, broken: false, negativeCount: 0, startCount: 0 },
  evenOdd: { active: false, broken: false, negativeCount: 0, startCount: 0 },
  passManque: { active: false, broken: false, negativeCount: 0, startCount: 0 },
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
    // On retourne "-0.5" uniquement si une séquence est active
    if (activeSequences[type].active) {
      alternanceValues[index][type] = "-0.5";
      return alternanceValues[index][type];
    }
    return null;
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
      activeSequences[type].negativeCount = 0;
    } else {
      alternanceValues[index][type] = "  -1";
      activeSequences[type].negativeCount++;
      if (activeSequences[type].negativeCount === 2) {
        activeSequences[type].active = false;
        activeSequences[type].negativeCount = 0;
      }
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
          <span class="info-box">${colorValue || ""}</span>
          <span class="info-box">${evenOddValue || ""}</span>
          <span class="info-box">${passManqueValue || ""}</span>
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

  updateClosedNumbers();
}

// Un numéro est "fermé" quand il est sorti un nombre pair de fois (0 exclu)
function updateClosedNumbers() {
  const counts = {};
  numbers.forEach((n) => {
    if (n !== 0) counts[n] = (counts[n] || 0) + 1;
  });

  // Les 36 numéros toujours affichés, seuls les fermés sont allumés
  closedGrid.innerHTML = WHEEL_ORDER.map((n) => {
    const isClosed = counts[n] && counts[n] % 2 === 0;
    return isClosed
      ? `<span class="wheel-cell closed ${getNumberInfo(n).color}">${n}</span>`
      : `<span class="wheel-cell">${n}</span>`;
  }).join("");
}

// Modifier la fonction addNumber
function addNumber() {
  const rawValue = numberInput.value.trim();
  const number = Number(rawValue);
  // Number("") vaut 0 : le champ vide doit être rejeté explicitement
  if (rawValue !== "" && Number.isInteger(number) && number >= 0 && number <= 36) {
    numbers.push(number);
    numberInput.value = "";

    // On vérifie d'abord les nouvelles séquences
    checkAlternances();

    // Puis on met à jour l'affichage
    updateDisplay();
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

  // On vérifie d'abord si on a un zéro avec une séquence active
  if (currentNum === 0) {
    showSequenceAlert(
      ["color", "evenOdd", "passManque"].filter(
        (type) => activeSequences[type].active
      )
    );
    return;
  }

  const nonZeroNumbers = numbers.filter((n) => n !== 0);
  if (nonZeroNumbers.length < 6) return;

  const last6 = nonZeroNumbers.slice(-6);
  const info = last6.map((n) => getNumberInfo(n));

  ["color", "evenOdd", "passManque"].forEach((type) => {
    const sequence = info.map((i) => i[type]);

    const hasAlternances = sequence.every(
      (val, i) => i === 0 || val !== sequence[i - 1]
    );

    // On vérifie d'abord si on doit désactiver la séquence
    if (activeSequences[type].negativeCount >= 2) {
      activeSequences[type].active = false;
      activeSequences[type].negativeCount = 0;
    } else if (hasAlternances) {
      // On active seulement si on n'a pas 2 négatifs
      if (!activeSequences[type].active) {
        // Début de séquence : nombre de tirages non nuls avant les 6 alternances
        activeSequences[type].startCount = nonZeroNumbers.length - 6;
      }
      activeSequences[type].active = true;
    }
  });

  // Les alertes ne se déclencheront que si la séquence est active
  const alertTypes = [];
  ["color", "evenOdd", "passManque"].forEach((type) => {
    if (activeSequences[type].active) {
      const currentInfo = getNumberInfo(numbers[currentIndex]);
      const previousNonZeroIndex = numbers.findLastIndex(
        (n, i) => i < currentIndex && n !== 0
      );
      const previousInfo =
        previousNonZeroIndex >= 0
          ? getNumberInfo(numbers[previousNonZeroIndex])
          : null;

      // On vérifie si on est sur un -1
      if (previousInfo && currentInfo[type] === previousInfo[type]) {
        // Si c'est le deuxième -1, on n'affiche pas l'alerte
        if (activeSequences[type].negativeCount === 1) {
          return;
        }
      }

      alertTypes.push(type);
    }
  });
  showSequenceAlert(alertTypes);
}

// Une seule alerte regroupant toutes les séquences en cours
function showSequenceAlert(types) {
  if (types.length === 0) return;

  // Longueur de la séquence en tirages non nuls (les zéros ne comptent pas)
  const nonZeroCount = numbers.filter((n) => n !== 0).length;

  const labels = types.map((type) => {
    const name =
      type === "color"
        ? "Rouge/Noir"
        : type === "evenOdd"
        ? "Pair/Impair"
        : "Passe/Manque";
    return `${name} : ${nonZeroCount - activeSequences[type].startCount} tours`;
  });

  // Une ligne par séquence pour ne pas en rater une
  const title =
    labels.length === 1 ? "Séquence en cours :" : "Séquences en cours :";
  alert(`Attention ! ${title}\n${labels.map((l) => `• ${l}`).join("\n")}`);
}

updateClosedNumbers();

// Event Listeners
numberInput.addEventListener("keypress", handleKeyPress);
addButton.addEventListener("click", addNumber);

document.addEventListener("DOMContentLoaded", function () {
  const input = document.getElementById("numberInput");
  const button = document.getElementById("addButton");
  input.addEventListener("keypress", handleKeyPress);
  button.addEventListener("click", addNumber);
});
