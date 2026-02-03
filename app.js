// === КОНФИГ И ХРАНИЛИЩЕ ===

const STORAGE_KEYS = {
  INGREDIENTS: "kbju_ingredients",
  RESULTS: "kbju_results"
};

// Варианты молока (id должны совпадать с ингредиентами в базе)
const MILK_VARIANTS = [
  { id: "milk_regular", label: "на обычном молоке" },
  { id: "milk_soy", label: "на соевом" },
  { id: "milk_oat", label: "на овсяном" },
  { id: "milk_coconut", label: "на кокосовом" },
  { id: "milk_almond", label: "на миндальном" },
  { id: "milk_skim", label: "на низколактозном 0%" }
];

function loadFromStorage(key, defaultValue) {
  const raw = localStorage.getItem(key);
  if (!raw) return defaultValue;
  try {
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

let ingredients = loadFromStorage(STORAGE_KEYS.INGREDIENTS, []);
let savedResults = loadFromStorage(STORAGE_KEYS.RESULTS, []);

// === ИНИЦИАЛИЗАЦИЯ ===

document.addEventListener("DOMContentLoaded", () => {
  setupTabs();
  setupIngredientsSection();
  setupPrepsSection();
  setupDrinksSection();
  setupResultsSection();
  ensureMilkIngredients();
});

// === ВКЛАДКИ ===

function setupTabs() {
  const navButtons = document.querySelectorAll("nav button");
  const sections = document.querySelectorAll("main > section");

  navButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-tab");

      navButtons.forEach((b) =>
        b.setAttribute("aria-pressed", b === btn ? "true" : "false")
      );

      sections.forEach((section) => {
        if (section.id === `tab-${target}`) {
          section.setAttribute("data-active", "true");
        } else {
          section.removeAttribute("data-active");
        }
      });
    });
  });

  const firstButton = navButtons[0];
  if (firstButton) firstButton.click();
}

// === ПРЕДЗАПОЛНЕНИЕ МОЛОКА ===

function ensureMilkIngredients() {
  const hasAnyMilk = ingredients.some((ing) =>
    MILK_VARIANTS.some((m) => m.id === ing.id)
  );
  if (hasAnyMilk) {
    renderIngredientsTable(
      document.querySelector("#ingredients-table tbody")
    );
    updateAllIngredientSelects();
    return;
  }

  // Значения КБЖУ на 100 г — подкорректируй под свои из Google-таблицы
  const milkDefaults = [
    {
      id: "milk_regular",
      name: "Молоко обычное 3,2%",
      per100: { kcal: 60, protein: 3.0, fat: 3.2, carbs: 4.7 }
    },
    {
      id: "milk_soy",
      name: "Молоко соевое",
      per100: { kcal: 45, protein: 3.0, fat: 1.9, carbs: 4.0 }
    },
    {
      id: "milk_oat",
      name: "Молоко овсяное",
      per100: { kcal: 47, protein: 0.8, fat: 1.5, carbs: 8.0 }
    },
    {
      id: "milk_coconut",
      name: "Молоко кокосовое",
      per100: { kcal: 75, protein: 1.0, fat: 7.5, carbs: 2.0 }
    },
    {
      id: "milk_almond",
      name: "Молоко миндальное",
      per100: { kcal: 50, protein: 1.6, fat: 3.6, carbs: 3.5 }
    },
    {
      id: "milk_skim",
      name: "Молоко 0%",
      per100: { kcal: 32, protein: 3.3, fat: 0.1, carbs: 4.8 }
    }
  ];

  ingredients = ingredients.concat(milkDefaults);
  saveToStorage(STORAGE_KEYS.INGREDIENTS, ingredients);
  renderIngredientsTable(
    document.querySelector("#ingredients-table tbody")
  );
  updateAllIngredientSelects();
}

// === РАЗДЕЛ: ИНГРЕДИЕНТЫ ===

function setupIngredientsSection() {
  const form = document.getElementById("ingredient-form");
  const tableBody = document.querySelector("#ingredients-table tbody");

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = form.elements["name"].value.trim();
    const kcal = Number(form.elements["kcal"].value);
    const protein = Number(form.elements["protein"].value);
    const fat = Number(form.elements["fat"].value);
    const carbs = Number(form.elements["carbs"].value);

    if (!name) return;

    const ingredient = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      name,
      per100: { kcal, protein, fat, carbs }
    };

    ingredients.push(ingredient);
    saveToStorage(STORAGE_KEYS.INGREDIENTS, ingredients);
    renderIngredientsTable(tableBody);
    updateAllIngredientSelects();
    form.reset();
  });

  tableBody.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action='delete']");
    if (!button) return;

    const id = button.getAttribute("data-id");
    ingredients = ingredients.filter((ing) => ing.id !== id);
    saveToStorage(STORAGE_KEYS.INGREDIENTS, ingredients);
    renderIngredientsTable(tableBody);
    updateAllIngredientSelects();
  });

  renderIngredientsTable(tableBody);
}

function renderIngredientsTable(tbody) {
  tbody.innerHTML = "";

  if (!ingredients.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 6;
    cell.textContent = "Ингредиентов пока нет.";
    row.appendChild(cell);
    tbody.appendChild(row);
    return;
  }

  ingredients.forEach((ing) => {
    const row = document.createElement("tr");

    const nameCell = document.createElement("td");
    nameCell.textContent = ing.name;

    const kcalCell = document.createElement("td");
    kcalCell.textContent = ing.per100.kcal.toFixed(1);

    const proteinCell = document.createElement("td");
    proteinCell.textContent = ing.per100.protein.toFixed(1);

    const fatCell = document.createElement("td");
    fatCell.textContent = ing.per100.fat.toFixed(1);

    const carbsCell = document.createElement("td");
    carbsCell.textContent = ing.per100.carbs.toFixed(1);

    const actionsCell = document.createElement("td");
    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.textContent = "Удалить";
    delBtn.setAttribute("data-action", "delete");
    delBtn.setAttribute("data-id", ing.id);
    actionsCell.appendChild(delBtn);

    row.append(
      nameCell,
      kcalCell,
      proteinCell,
      fatCell,
      carbsCell,
      actionsCell
    );
    tbody.appendChild(row);
  });
}

// === ОБЩИЙ SELECT ИНГРЕДИЕНТОВ ===

function createIngredientSelect() {
  const select = document.createElement("select");
  select.name = "ingredientId";
  select.required = true;

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Выберите ингредиент";
  placeholder.disabled = true;
  placeholder.selected = true;
  select.appendChild(placeholder);

  ingredients.forEach((ing) => {
    const opt = document.createElement("option");
    opt.value = ing.id;
    opt.textContent = ing.name;
    select.appendChild(opt);
  });

  return select;
}

function updateAllIngredientSelects() {
  const selects = document.querySelectorAll("select[name='ingredientId']");
  selects.forEach((select) => {
    const currentValue = select.value;
    select.innerHTML = "";

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Выберите ингредиент";
    placeholder.disabled = true;
    select.appendChild(placeholder);

    ingredients.forEach((ing) => {
      const opt = document.createElement("option");
      opt.value = ing.id;
      opt.textContent = ing.name;
      select.appendChild(opt);
    });

    if (currentValue) select.value = currentValue;
  });
}

// === РАЗДЕЛ: ЗАГОТОВКИ ===

function setupPrepsSection() {
  const form = document.getElementById("prep-form");
  if (!form) return;

  const componentsContainer = document.getElementById("prep-components-list");
  const addComponentBtn = document.getElementById("prep-add-component");
  const calcBtn = document.getElementById("prep-calc-btn");
  const saveAsIngredientBtn = document.getElementById(
    "prep-save-as-ingredient"
  );

  addPrepComponentRow(componentsContainer);

  addComponentBtn.addEventListener("click", () => {
    addPrepComponentRow(componentsContainer);
  });

  calcBtn.addEventListener("click", () => {
    const result = calculateMixtureFromForm(form, componentsContainer);
    if (!result) return;
    updatePrepResultUI(result);
  });

  saveAsIngredientBtn.addEventListener("click", () => {
    const result = calculateMixtureFromForm(form, componentsContainer);
    if (!result) return;

    const name = form.elements["prepName"].value.trim();
    if (!name) return;

    const newIngredient = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      name,
      per100: result
    };

    ingredients.push(newIngredient);
    saveToStorage(STORAGE_KEYS.INGREDIENTS, ingredients);
    renderIngredientsTable(
      document.querySelector("#ingredients-table tbody")
    );
    updateAllIngredientSelects();
    alert("Заготовка сохранена как ингредиент.");
  });
}

function addPrepComponentRow(container) {
  const row = document.createElement("div");

  const ingredientSelect = createIngredientSelect();
  const weightInput = document.createElement("input");
  weightInput.type = "number";
  weightInput.name = "weight";
  weightInput.min = "0";
  weightInput.step = "1";
  weightInput.placeholder = "г";

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.textContent = "×";

  removeBtn.addEventListener("click", () => {
    container.removeChild(row);
  });

  row.append(ingredientSelect, weightInput, removeBtn);
  container.appendChild(row);
}

function calculateMixtureFromForm(form, componentsContainer) {
  const totalWeight = Number(form.elements["totalWeight"].value);
  if (!totalWeight || totalWeight <= 0) {
    alert("Укажите итоговый вес заготовки.");
    return null;
  }

  const componentRows = Array.from(componentsContainer.children);
  const components = [];

  for (const row of componentRows) {
    const select = row.querySelector("select[name='ingredientId']");
    const weightInput = row.querySelector("input[name='weight']");
    if (!select || !weightInput) continue;

    const ingredientId = select.value;
    const weight = Number(weightInput.value);

    if (!ingredientId || !weight || weight <= 0) continue;

    components.push({ ingredientId, weight });
  }

  if (!components.length) {
    alert("Добавьте хотя бы один ингредиент в заготовку.");
    return null;
  }

  return calculateMixturePer100(components, totalWeight);
}

function calculateMixturePer100(components, totalWeight) {
  const totals = { kcal: 0, protein: 0, fat: 0, carbs: 0 };

  components.forEach((c) => {
    const ing = ingredients.find((i) => i.id === c.ingredientId);
    if (!ing) return;
    const factor = c.weight / 100;

    totals.kcal += ing.per100.kcal * factor;
    totals.protein += ing.per100.protein * factor;
    totals.fat += ing.per100.fat * factor;
    totals.carbs += ing.per100.carbs * factor;
  });

  const factor100 = 100 / totalWeight;

  return {
    kcal: totals.kcal * factor100,
    protein: totals.protein * factor100,
    fat: totals.fat * factor100,
    carbs: totals.carbs * factor100
  };
}

function updatePrepResultUI(result) {
  document.getElementById("prep-kcal").textContent = result.kcal.toFixed(1);
  document.getElementById("prep-protein").textContent =
    result.protein.toFixed(1);
  document.getElementById("prep-fat").textContent = result.fat.toFixed(1);
  document.getElementById("prep-carbs").textContent = result.carbs.toFixed(1);
}

// === РАЗДЕЛ: НАПИТКИ ===

function setupDrinksSection() {
  const form = document.getElementById("drink-form");
  const calcBtn = document.getElementById("drink-calc-btn");
  const saveResultBtn = document.getElementById("drink-save-result");

  ["250", "350", "450"].forEach((vol) => {
    const container = document.getElementById(`drink-components-${vol}`);
    if (container) addDrinkComponentRow(container);
  });

  const addButtons = form.querySelectorAll(".drink-add-component");
  addButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-target");
      const container = document.getElementById(
        `drink-components-${target}`
      );
      addDrinkComponentRow(container);
    });
  });

  calcBtn.addEventListener("click", () => {
    calculateAllDrinkVolumesWithMilk(form);
  });

  saveResultBtn.addEventListener("click", () => {
    const drinkName = form.elements["drinkName"].value.trim();
    if (!drinkName) {
      alert("Введите название напитка.");
      return;
    }

    const result = calculateAllDrinkVolumesWithMilk(form, { silent: true });
    if (!result) return;

    const record = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      name: drinkName,
      date: new Date().toISOString(),
      volumes: result.volumes,          // КБЖУ по базовому молоку
      milkVariants: result.milkVariants // КБЖУ по всем видам молока
    };

    savedResults.push(record);
    saveToStorage(STORAGE_KEYS.RESULTS, savedResults);
    renderResultsTable();
    alert("Результат сохранён в историю.");
  });
}

function addDrinkComponentRow(container) {
  const row = document.createElement("div");

  const ingredientSelect = createIngredientSelect();
  const weightInput = document.createElement("input");
  weightInput.type = "number";
  weightInput.name = "weight";
  weightInput.min = "0";
  weightInput.step = "1";
  weightInput.placeholder = "г";

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.textContent = "×";

  removeBtn.addEventListener("click", () => {
    container.removeChild(row);
  });

  row.append(ingredientSelect, weightInput, removeBtn);
  container.appendChild(row);
}

function calculateDrinkForVolume(container) {
  const rows = Array.from(container.children);
  const components = [];

  for (const row of rows) {
    const select = row.querySelector("select[name='ingredientId']");
    const weightInput = row.querySelector("input[name='weight']");
    if (!select || !weightInput) continue;

    const id = select.value;
    const weight = Number(weightInput.value);
    if (!id || !weight || weight <= 0) continue;

    components.push({ ingredientId: id, weight });
  }

  if (!components.length) return null;

  const totals = calculateDrinkTotals(components);
  return { totals, components };
}

function calculateDrinkTotals(components) {
  const totals = { kcal: 0, protein: 0, fat: 0, carbs: 0 };

  components.forEach((c) => {
    const ing = ingredients.find((i) => i.id === c.ingredientId);
    if (!ing) return;
    const factor = c.weight / 100;

    totals.kcal += ing.per100.kcal * factor;
    totals.protein += ing.per100.protein * factor;
    totals.fat += ing.per100.fat * factor;
    totals.carbs += ing.per100.carbs * factor;
  });

  return totals;
}

// === МОЛОЧНЫЕ ВАРИАНТЫ ДЛЯ ОБЪЁМА ===

function splitComponentsMilk(components) {
  const milkIds = new Set(MILK_VARIANTS.map((m) => m.id));
  const baseComponents = [];
  let milkWeight = 0;
  let milkIngredientId = null;

  for (const c of components) {
    if (milkIds.has(c.ingredientId)) {
      milkWeight += c.weight;
      milkIngredientId = c.ingredientId;
    } else {
      baseComponents.push(c);
    }
  }

  return { baseComponents, milkWeight, milkIngredientId };
}

function calculateMilkPartTotals(milkIngredientId, weight) {
  const ing = ingredients.find((i) => i.id === milkIngredientId);
  if (!ing || !weight || weight <= 0) {
    return { kcal: 0, protein: 0, fat: 0, carbs: 0 };
  }
  const factor = weight / 100;
  return {
    kcal: ing.per100.kcal * factor,
    protein: ing.per100.protein * factor,
    fat: ing.per100.fat * factor,
    carbs: ing.per100.carbs * factor
  };
}

function sumTotals(a, b) {
  return {
    kcal: a.kcal + b.kcal,
    protein: a.protein + b.protein,
    fat: a.fat + b.fat,
    carbs: a.carbs + b.carbs
  };
}

function calculateMilkVariantsForVolume(components) {
  const { baseComponents, milkWeight, milkIngredientId } =
    splitComponentsMilk(components);

  if (!milkWeight || !milkIngredientId) return null;

  const baseTotals = calculateDrinkTotals(baseComponents);
  const rows = [];

  MILK_VARIANTS.forEach((variant) => {
    const milkTotals = calculateMilkPartTotals(variant.id, milkWeight);
    const total = sumTotals(baseTotals, milkTotals);
    rows.push({
      label: variant.label,
      totals: total
    });
  });

  return rows;
}

function renderMilkVariantsTable(volume, rows) {
  const table = document.getElementById(
    `drink-${volume}-milk-variants-table`
  );
  if (!table) return;
  const tbody = table.querySelector("tbody");
  tbody.innerHTML = "";

  if (!rows || !rows.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 5;
    td.textContent = "Нет данных (в составе не найдено молока).";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  rows.forEach((row) => {
    const tr = document.createElement("tr");

    const nameTd = document.createElement("td");
    nameTd.textContent = row.label;

    const kcalTd = document.createElement("td");
    kcalTd.textContent = row.totals.kcal.toFixed(1);

    const pTd = document.createElement("td");
    pTd.textContent = row.totals.protein.toFixed(1);

    const fTd = document.createElement("td");
    fTd.textContent = row.totals.fat.toFixed(1);

    const cTd = document.createElement("td");
    cTd.textContent = row.totals.carbs.toFixed(1);

    tr.append(nameTd, kcalTd, pTd, fTd, cTd);
    tbody.appendChild(tr);
  });
}

// === РАСЧЁТ ВСЕХ ОБЪЁМОВ С УЧЁТОМ МОЛОК ===

function updateDrinkResultUI(volume, totals) {
  document.getElementById(`drink-${volume}-kcal`).textContent =
    totals.kcal.toFixed(1);
  document.getElementById(`drink-${volume}-protein`).textContent =
    totals.protein.toFixed(1);
  document.getElementById(`drink-${volume}-fat`).textContent =
    totals.fat.toFixed(1);
  document.getElementById(`drink-${volume}-carbs`).textContent =
    totals.carbs.toFixed(1);
}

// возвращает { volumes, milkVariants }
function calculateAllDrinkVolumesWithMilk(form, options = {}) {
  const volumesList = ["250", "350", "450"];
  const resultVolumes = {};
  const resultMilkVariants = {};

  volumesList.forEach((vol) => {
    const container = document.getElementById(`drink-components-${vol}`);
    if (!container) return;

    const res = calculateDrinkForVolume(container);
    if (res) {
      resultVolumes[vol] = res.totals;
      const variants = calculateMilkVariantsForVolume(res.components);
      resultMilkVariants[vol] = variants;

      if (!options.silent) {
        updateDrinkResultUI(vol, res.totals);
        renderMilkVariantsTable(vol, variants);
      }
    } else if (!options.silent) {
      updateDrinkResultUI(vol, {
        kcal: 0,
        protein: 0,
        fat: 0,
        carbs: 0
      });
      renderMilkVariantsTable(vol, null);
    }
  });

  if (Object.keys(resultVolumes).length === 0) {
    if (!options.silent) {
      alert("Добавьте ингредиенты хотя бы для одного объёма.");
    }
    return null;
  }

  return { volumes: resultVolumes, milkVariants: resultMilkVariants };
}

// === РАЗДЕЛ: ГОТОВЫЕ РАСЧЁТЫ ===

function setupResultsSection() {
  renderResultsTable();

  const copyBtn = document.getElementById("results-copy");
  const deleteBtn = document.getElementById("results-delete");
  const tbody = document.querySelector("#results-table tbody");

  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      const selected = tbody.querySelector("tr.results-selected");
      if (!selected) {
        alert("Выберите строку в таблице.");
        return;
      }
      const id = selected.getAttribute("data-id");
      const rec = savedResults.find((r) => r.id === id);
      if (!rec) return;
      copyResultToClipboard(rec);
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener("click", () => {
      const selected = tbody.querySelector("tr.results-selected");
      if (!selected) {
        alert("Выберите строку в таблице.");
        return;
      }
      const id = selected.getAttribute("data-id");
      savedResults = savedResults.filter((r) => r.id !== id);
      saveToStorage(STORAGE_KEYS.RESULTS, savedResults);
      renderResultsTable();
    });
  }
}


function renderResultsTable() {
  const tbody = document.querySelector("#results-table tbody");
  tbody.innerHTML = "";

  if (!savedResults.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5; // стало 5 колонок
    cell.textContent = "Сохранённых расчётов пока нет.";
    row.appendChild(cell);
    tbody.appendChild(row);
    return;
  }

  savedResults.forEach((rec) => {
    const row = document.createElement("tr");
    row.setAttribute("data-id", rec.id);

    const dateCell = document.createElement("td");
    const date = new Date(rec.date);
    dateCell.textContent = date.toLocaleString("ru-RU");

    const nameCell = document.createElement("td");
    nameCell.textContent = rec.name;

    const vol250Cell = document.createElement("td");
    const vol350Cell = document.createElement("td");
    const vol450Cell = document.createElement("td");

    vol250Cell.appendChild(
      createMilkVariantsSummary("250", rec.volumes, rec.milkVariants)
    );
    vol350Cell.appendChild(
      createMilkVariantsSummary("350", rec.volumes, rec.milkVariants)
    );
    vol450Cell.appendChild(
      createMilkVariantsSummary("450", rec.volumes, rec.milkVariants)
    );

    row.append(dateCell, nameCell, vol250Cell, vol350Cell, vol450Cell);
    tbody.appendChild(row);
  });

  // выбор строки по клику
  tbody.addEventListener("click", (event) => {
    const tr = event.target.closest("tr");
    if (!tr || !tr.hasAttribute("data-id")) return;

    // снять выделение со всех
    tbody.querySelectorAll("tr").forEach((row) =>
      row.classList.remove("results-selected")
    );
    tr.classList.add("results-selected");
  });
}

// маленькое представление вариантов молока в ячейке истории
function createMilkVariantsSummary(volume, volumes, milkVariants) {
  const container = document.createElement("div");
  const variants = milkVariants ? milkVariants[volume] : null;

  if (!variants || !variants.length) {
    container.textContent = "-";
    return container;
  }

  variants.forEach((variant) => {
    const p = document.createElement("p");
    p.textContent =
      `${variant.label}: ` +
      `${variant.totals.kcal.toFixed(1)}, ` +
      `${variant.totals.protein.toFixed(1)}, ` +
      `${variant.totals.fat.toFixed(1)}, ` +
      `${variant.totals.carbs.toFixed(1)}`;
    container.appendChild(p);
  });

  return container;
}

function copyResultToClipboard(rec) {
  const lines = [];
  lines.push(`Напиток: ${rec.name}`);
  const volumesList = ["250", "350", "450"];

  volumesList.forEach((vol) => {
    const header = `${vol} мл`;
    const variants = rec.milkVariants ? rec.milkVariants[vol] : null;
    if (!variants || !variants.length) return;

    lines.push(header + ":");
    variants.forEach((variant) => {
      const v = variant.totals;
      lines.push(
        `  ${variant.label}: ${v.kcal.toFixed(1)} ккал, Б ${v.protein.toFixed(
          1
        )}, Ж ${v.fat.toFixed(1)}, У ${v.carbs.toFixed(1)}`
      );
    });
  });

  const text = lines.join("\n");

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(
      () => alert("Результат скопирован в буфер обмена."),
      () => alert("Не удалось скопировать результат.")
    );
  } else {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      alert("Результат скопирован в буфер обмена.");
    } catch {
      alert("Не удалось скопировать результат.");
    }
    document.body.removeChild(textarea);
  }
}