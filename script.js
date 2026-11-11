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

// Dominante : au moins 7 tirages de la même valeur sur les 10 derniers non
// nuls. Tant qu'elle tient, chaque tirage l'annonce dans l'alerte (0 et
// couleur opposée compris), mais seul un tirage de la valeur dominante reçoit
// la bordure (marked). Générique par catégorie, activée sur rouge/noir.
const DOMINANCE_WINDOW = 10;
const DOMINANCE_THRESHOLD = 7;
const DOMINANCE_TYPES = ["color"];
// parallèle à numbers : { color: { value, count, marked } } ou {}
const dominances = [];

// Calcul pur, sans état : dominante en cours au tirage index (les 10 derniers
// non nuls jusqu'à lui ; pour un 0, ce sont ceux qui le précèdent)
function getDominance(index) {
  const result = {};
  const window = [];
  for (let i = index; i >= 0 && window.length < DOMINANCE_WINDOW; i--) {
    if (numbers[i] !== 0) window.push(getNumberInfo(numbers[i]));
  }
  if (window.length < DOMINANCE_WINDOW) return result;

  const current = numbers[index] === 0 ? null : getNumberInfo(numbers[index]);
  DOMINANCE_TYPES.forEach((type) => {
    const counts = {};
    window.forEach((info) => {
      counts[info[type]] = (counts[info[type]] || 0) + 1;
    });
    Object.entries(counts).forEach(([value, count]) => {
      if (count >= DOMINANCE_THRESHOLD) {
        const marked = current !== null && current[type] === value;
        result[type] = { value, count, marked };
      }
    });
  });
  return result;
}

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

// Tiers : secteurs du cylindre, chacun écrit dans sa case pour le repérer
const TIERS_1 = [
  { cls: "t1-fonce", label: "0/14", numbers: [0, 26, 3, 35, 12, 28, 7, 29, 18, 22, 9, 31, 14] },
  { cls: "t1-moyen", label: "20/36", numbers: [20, 1, 33, 16, 24, 5, 10, 23, 8, 30, 11, 36] },
  { cls: "t1-clair", label: "13/32", numbers: [13, 27, 6, 34, 17, 25, 2, 21, 4, 19, 15, 32] },
];
const TIERS_2 = [
  { cls: "t2-fonce", label: "2/7", numbers: [2, 21, 4, 19, 15, 32, 0, 26, 3, 35, 12, 28, 7] },
  { cls: "t2-moyen", label: "29/5", numbers: [29, 18, 22, 9, 31, 14, 20, 1, 33, 16, 24, 5] },
  { cls: "t2-clair", label: "10/25", numbers: [10, 23, 8, 30, 11, 36, 13, 27, 6, 34, 17, 25] },
];

// Zones du tapis (colonne = 1-12 / 13-24 / 25-36, ligne = 1-4-7… / 2-5-8… /
// 3-6-9…) et secteurs des tiers. Le 0 est rose sur le tapis, mais appartient
// à un secteur de chaque tiers. Affichage seul : pas encore d'alternances.
function getZones(num) {
  return {
    column: num === 0 ? "zero" : `colonne-${Math.ceil(num / 12)}`,
    line: num === 0 ? "zero" : `ligne-${((num - 1) % 3) + 1}`,
    tiers1: TIERS_1.find((s) => s.numbers.includes(num)),
    tiers2: TIERS_2.find((s) => s.numbers.includes(num)),
  };
}

// --- Séries : l'inverse des alternances, sur les 7 catégories ---
// Une série démarre sur 6 résultats identiques consécutifs. Chaque tirage
// est comparé à la valeur de la série : +1 s'il la répète, -1 sinon. Deux -1
// consécutifs la tuent, un +1 remet le compteur à zéro (même tolérance que
// les alternances). Le 0 est neutre (-0.5 si série en cours), sauf pour les
// tiers où il appartient à son secteur et compte comme un tirage normal.
// Calculé une seule fois par tirage dans rebuild() : pas de mémo à protéger.
const SERIES_LENGTH = 6;
const SERIES_TYPES = [
  "color",
  "evenOdd",
  "passManque",
  "column",
  "line",
  "tiers1",
  "tiers2",
];
const SERIES_NAMES = {
  rouge: "Rouge",
  noir: "Noir",
  pair: "Pair",
  impair: "Impair",
  manque: "Manque",
  passe: "Passe",
  "colonne-1": "Colonne 1-12",
  "colonne-2": "Colonne 13-24",
  "colonne-3": "Colonne 25-36",
  "ligne-1": "Ligne 1",
  "ligne-2": "Ligne 2",
  "ligne-3": "Ligne 3",
};
[...TIERS_1, ...TIERS_2].forEach((sector, i) => {
  SERIES_NAMES[sector.cls] = `Tiers ${i < 3 ? 1 : 2} (${sector.label})`;
});

const seriesStates = {}; // par catégorie : { active, value, negativeCount, startCount }
const seriesHistory = {}; // par catégorie : valeurs des tirages non neutres
const seriesValues = []; // parallèle à numbers : { color: "+1", column: "-1"… }
let seriesAlertTypes = []; // séries à annoncer pour le dernier tirage rejoué

function getSeriesValue(type, num) {
  if (type === "tiers1" || type === "tiers2") return getZones(num)[type].cls;
  if (num === 0) return null; // neutre
  if (type === "column" || type === "line") return getZones(num)[type];
  return getNumberInfo(num)[type];
}

function resetSeries() {
  seriesValues.length = 0;
  seriesAlertTypes = [];
  SERIES_TYPES.forEach((type) => {
    seriesStates[type] = { active: false, value: null, negativeCount: 0, startCount: 0 };
    seriesHistory[type] = [];
  });
}

// Fait avancer les séries d'un tirage ; renvoie les catégories à annoncer
// (série en cours, sauf sur la cassure qui la tue — comme les alternances)
function stepSeries(index) {
  const num = numbers[index];
  const scores = {};
  const alertTypes = [];

  SERIES_TYPES.forEach((type) => {
    const state = seriesStates[type];
    const history = seriesHistory[type];
    const value = getSeriesValue(type, num);

    if (value === null) {
      if (state.active) {
        scores[type] = "-0.5";
        alertTypes.push(type);
      }
      return;
    }

    history.push(value);
    if (!state.active) {
      const last = history.slice(-SERIES_LENGTH);
      if (last.length < SERIES_LENGTH || !last.every((v) => v === value)) return;
      Object.assign(state, {
        active: true,
        value,
        negativeCount: 0,
        startCount: history.length - SERIES_LENGTH,
      });
    }

    if (value === state.value) {
      scores[type] = "+1";
      state.negativeCount = 0;
    } else {
      scores[type] = "-1";
      state.negativeCount++;
      if (state.negativeCount === 2) {
        state.active = false;
        state.negativeCount = 0;
        return;
      }
    }
    alertTypes.push(type);
  });

  seriesValues[index] = scores;
  return alertTypes;
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
      // Le 0 est rose sur les trois catégories (getNumberInfo(0) n'a pas de sens)
      const info =
        n === 0
          ? { color: "zero", evenOdd: "zero", passManque: "zero" }
          : getNumberInfo(n);
      const zones = getZones(n);
      const lastSeen = getLastSeen(n, index);

      // Pas de libellé : la couleur suffit, seuls les scores s'écrivent dans
      // la case (série puis alternance, comme dans l'alerte)
      const scoreBox = (type, cls) => {
        const scores = [];
        const seriesScore = seriesValues[index] && seriesValues[index][type];
        if (seriesScore) scores.push(seriesScore);
        if (cls === undefined) {
          const value = getAlternanceValue(n, type, index);
          if (value) scores.push(value.trim());
        }
        const dominant =
          dominances[index] && dominances[index][type] && dominances[index][type].marked;
        return `<span class="info-box ${cls === undefined ? info[type] : cls}${
          dominant ? " dominante" : ""
        }">${scores.join(" ")}</span>`;
      };

      return `<div class="number-row" data-index="${index}">
          <span class="number">${n}</span>
          ${scoreBox("color")}
          ${scoreBox("evenOdd")}
          ${scoreBox("passManque")}
          ${scoreBox("column", zones.column)}
          ${scoreBox("line", zones.line)}
          <span class="info-box tiers ${zones.tiers1.cls}">${zones.tiers1.label}</span>
          <span class="info-box tiers ${zones.tiers2.cls}">${zones.tiers2.label}</span>
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
  dominances.length = 0;
  resetSeries();
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
    // Avant checkAlternances : l'alerte du tirage lit sa dominante
    dominances.push(getDominance(index));
    seriesAlertTypes = stepSeries(index);
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
  if (nonZeroNumbers.length < 6) {
    // Pas encore d'alternance possible, mais une série des tiers peut
    // compter des zéros : l'alerte doit quand même passer
    if (!silent) showSequenceAlert([]);
    return;
  }

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

// Une seule alerte par tirage, toujours dans le même ordre : SÉRIES,
// ALTERNANCES, DOMINANTE ; dans chaque section, l'ordre des cases de la page.
// types : alternances à annoncer (les séries et la dominante sont lues ici).
function showSequenceAlert(types) {
  const dominance = dominances[numbers.length - 1] || {};
  const sections = [];

  // Longueur en tirages comptés par la catégorie depuis les 6 d'ouverture
  const seriesLines = SERIES_TYPES.filter((type) =>
    seriesAlertTypes.includes(type)
  ).map((type) => {
    const state = seriesStates[type];
    const length = seriesHistory[type].length - state.startCount;
    return `• ${SERIES_NAMES[state.value]} : ${length} tours`;
  });
  if (seriesLines.length > 0) sections.push(`SÉRIES\n${seriesLines.join("\n")}`);

  // Longueur en tirages non nuls (les zéros ne comptent pas)
  const nonZeroCount = numbers.filter((n) => n !== 0).length;
  const alternanceLines = ["color", "evenOdd", "passManque"]
    .filter((type) => types.includes(type))
    .map((type) => {
      const name =
        type === "color"
          ? "Rouge/Noir"
          : type === "evenOdd"
          ? "Pair/Impair"
          : "Passe/Manque";
      return `• ${name} : ${nonZeroCount - activeSequences[type].startCount} tours`;
    });
  if (alternanceLines.length > 0) {
    sections.push(`ALTERNANCES\n${alternanceLines.join("\n")}`);
  }

  const dominanceLines = DOMINANCE_TYPES.filter((type) => dominance[type]).map(
    (type) =>
      `• ${SERIES_NAMES[dominance[type].value]} : ${dominance[type].count}/${DOMINANCE_WINDOW}`
  );
  if (dominanceLines.length > 0) {
    sections.push(`DOMINANTE\n${dominanceLines.join("\n")}`);
  }

  if (sections.length === 0) return;
  alert(sections.join("\n────────────\n"));
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
