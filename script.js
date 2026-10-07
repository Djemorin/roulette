// Base Supabase (projet "Roulette") : la table spins est la source de vérité
const SUPABASE_URL = "https://eyecoxpjvyloangqdjxa.supabase.co";
const SUPABASE_KEY = "sb_publishable_AFGg1-JjOwpWbPMS1J1YEQ_KS7iW-Iv";
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let spins = []; // { id, number } triés par id, tels qu'en base
const numbers = []; // reconstruit à partir de spins par rebuild()
let editMode = false;
let adding = false;

const resultsContainer = document.getElementById("results-container");
const numberInput = document.getElementById("numberInput");
const addButton = document.getElementById("addButton");
const editButton = document.getElementById("editButton");
const clearButton = document.getElementById("clearButton");
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

// scrollMode : "bottom" (défilement doux vers le dernier tirage),
// "instant" (saut direct vers le dernier tirage) ou "keep" (position conservée)
function updateDisplay(scrollMode = "bottom") {
  const previousScroll = resultsContainer.scrollTop;

  resultsContainer.innerHTML = numbers
    .map((n, index) => {
      const info = getNumberInfo(n);
      const lastSeen = getLastSeen(n, index);

      const colorValue = getAlternanceValue(n, "color", index);
      const evenOddValue = getAlternanceValue(n, "evenOdd", index);
      const passManqueValue = getAlternanceValue(n, "passManque", index);

      if (n === 0) {
        return `<div class="number-row" data-index="${index}">
          <span class="number" style="background-color: #4CAF50">${n}</span>
          <span class="info-box">${colorValue || ""}</span>
          <span class="info-box">${evenOddValue || ""}</span>
          <span class="info-box">${passManqueValue || ""}</span>
          <span class="info-box last-seen">${lastSeen} tours</span>
        </div>`;
      }

      return `<div class="number-row" data-index="${index}">
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

  if (scrollMode === "keep") {
    resultsContainer.scrollTo({ top: previousScroll, behavior: "instant" });
  } else {
    resultsContainer.scrollTo({
      top: resultsContainer.scrollHeight,
      behavior: scrollMode === "instant" ? "instant" : "smooth",
    });
  }

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

// Renvoie le numéro saisi, ou null s'il n'est pas un entier de 0 à 36
function parseSpin(rawValue) {
  const trimmed = String(rawValue).trim();
  const number = Number(trimmed);
  // Number("") vaut 0 : le champ vide doit être rejeté explicitement
  if (trimmed !== "" && Number.isInteger(number) && number >= 0 && number <= 36) {
    return number;
  }
  return null;
}

// Recalcule tout l'état (séquences, scores) en rejouant les tirages un par un,
// exactement comme s'ils venaient d'être saisis : checkAlternances puis le
// calcul des scores du dernier tirage. Seul le dernier tirage peut alerter.
function rebuild({ alertLast = false } = {}) {
  numbers.length = 0;
  alternanceValues.length = 0;
  ["color", "evenOdd", "passManque"].forEach((type) => {
    Object.assign(activeSequences[type], {
      active: false,
      broken: false,
      negativeCount: 0,
      startCount: 0,
    });
  });

  spins.forEach((spin, index) => {
    numbers.push(spin.number);
    const isLast = index === spins.length - 1;
    checkAlternances(!(alertLast && isLast));
    ["color", "evenOdd", "passManque"].forEach((type) =>
      getAlternanceValue(spin.number, type, index)
    );
  });
}

// Supabase renvoie au plus 1000 lignes par requête : lecture par paquets
async function fetchAllSpins() {
  const PAGE_SIZE = 1000;
  const all = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await db
      .from("spins")
      .select("id, number")
      .order("id")
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    all.push(...data);
    if (data.length < PAGE_SIZE) return all;
  }
}

async function reload(scrollMode = "bottom") {
  try {
    spins = await fetchAllSpins();
  } catch (error) {
    console.error(error);
    if (numbers.length === 0) {
      resultsContainer.innerHTML = `<p class="status-message">Connexion à la base impossible.</p>`;
    }
    return;
  }
  rebuild();
  updateDisplay(scrollMode);
}

async function addNumber() {
  if (editMode || adding) return;

  const number = parseSpin(numberInput.value);
  if (number === null) {
    alert("Veuillez entrer un numéro entre 0 et 36");
    return;
  }

  adding = true;
  addButton.disabled = true;
  const { data, error } = await db
    .from("spins")
    .insert({ number })
    .select("id, number")
    .single();
  adding = false;
  addButton.disabled = false;

  if (error) {
    console.error(error);
    alert("Erreur d'enregistrement : le tirage n'a pas été ajouté.");
    return;
  }

  numberInput.value = "";
  // La synchro en direct a pu recharger la liste entre-temps
  if (!spins.some((spin) => spin.id === data.id)) {
    spins.push(data);
    spins.sort((a, b) => a.id - b.id);
  }
  // L'alerte n'est affichée que sur l'appareil qui a saisi le tirage
  rebuild({ alertLast: spins[spins.length - 1].id === data.id });
  updateDisplay("bottom");
}

// --- Mode édition : modifier ou supprimer n'importe quel tirage ---

function setEditMode(on) {
  editMode = on;
  document.body.classList.toggle("edit-mode", on);
  numberInput.disabled = on;
  numberInput.value = "";
  numberInput.placeholder = on
    ? "Touchez un tirage à modifier"
    : "Entrez un numéro";
  addButton.hidden = on;
  clearButton.hidden = !on;
}

async function editSpin(index) {
  const spin = spins[index];
  if (!spin) return;

  const answer = prompt(
    `Tirage n°${index + 1} : ${spin.number}\n\n` +
      "Nouveau numéro (0 à 36), ou laisser vide pour le supprimer :",
    String(spin.number)
  );
  if (answer === null) return; // Annulé : on reste en mode édition

  let error = null;
  if (answer.trim() === "") {
    if (!confirm(`Supprimer le tirage n°${index + 1} (${spin.number}) ?`)) {
      return;
    }
    ({ error } = await db.from("spins").delete().eq("id", spin.id));
  } else {
    const number = parseSpin(answer);
    if (number === null) {
      alert("Veuillez entrer un numéro entre 0 et 36");
      return;
    }
    if (number === spin.number) {
      setEditMode(false);
      return;
    }
    ({ error } = await db.from("spins").update({ number }).eq("id", spin.id));
  }

  if (error) {
    console.error(error);
    alert("Erreur d'enregistrement : la modification n'a pas été faite.");
    return;
  }
  setEditMode(false);
  await reload("keep");
}

async function clearAllSpins() {
  if (!confirm("Effacer TOUS les tirages ?")) return;
  if (!confirm("Confirmer : tous les tirages seront définitivement effacés.")) {
    return;
  }

  // Supabase refuse un delete sans filtre : id >= 0 couvre toutes les lignes
  const { error } = await db.from("spins").delete().gte("id", 0);
  if (error) {
    console.error(error);
    alert("Erreur : les tirages n'ont pas été effacés.");
    return;
  }
  setEditMode(false);
  await reload("bottom");
}

function handleKeyPress(event) {
  if (event.key === "Enter") {
    addNumber();
  }
}

// silent : met à jour les séquences sans afficher d'alerte (rejeu des tirages)
function checkAlternances(silent = false) {
  const currentIndex = numbers.length - 1;
  const currentNum = numbers[currentIndex];

  // On vérifie d'abord si on a un zéro avec une séquence active
  if (currentNum === 0) {
    if (silent) return;
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

  if (silent) return;

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

// Event Listeners
numberInput.addEventListener("keypress", handleKeyPress);
addButton.addEventListener("click", addNumber);
editButton.addEventListener("click", () => setEditMode(!editMode));
clearButton.addEventListener("click", clearAllSpins);

resultsContainer.addEventListener("click", (event) => {
  if (!editMode) return;
  const row = event.target.closest(".number-row");
  if (row) editSpin(Number(row.dataset.index));
});

// Synchronisation entre appareils : tout changement en base recharge la liste
let reloadTimer = null;
function scheduleReload() {
  clearTimeout(reloadTimer);
  reloadTimer = setTimeout(() => reload(editMode ? "keep" : "bottom"), 200);
}

db.channel("spins-changes")
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "spins" },
    scheduleReload
  )
  .subscribe();

// Au retour sur l'app (téléphone sorti de veille), la connexion en direct
// a pu être coupée : on recharge pour rattraper les tirages manqués
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) scheduleReload();
});

// Chargement initial : directement sur les derniers tirages
updateClosedNumbers();
resultsContainer.innerHTML = `<p class="status-message">Chargement…</p>`;
reload("instant");
