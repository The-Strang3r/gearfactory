// ------------------------
// Data
// ------------------------
const armorIcons = {
  "Netherite Helmet": "helmet.png",
  "Netherite Chestplate": "chestplate.png",
  "Netherite Leggings": "leggings.png",
  "Netherite Boots": "boots.png"
};

const toolIcons = {
  "Netherite Sword": "sword.png",
  "Netherite Pickaxe": "pickaxe.png",
  "Netherite Axe": "axe.png",
  "Netherite Shovel": "shovel.png",
  "Netherite Hoe": "hoe.png"
};

const armorPieces = [
  {
    name: "Netherite Helmet",
    enchantments: [
      "Protection IV",
      "Unbreaking III",
      "Mending",
      "Respiration III",
      "Aqua Affinity I",
      "Thorns III"
    ]
  },
  {
    name: "Netherite Chestplate",
    enchantments: ["Protection IV", "Unbreaking III", "Mending", "Thorns III"]
  },
  {
    name: "Netherite Leggings",
    enchantments: ["Protection IV", "Unbreaking III", "Mending", "Swift Sneak III", "Thorns III"]
  },
  {
    name: "Netherite Boots",
    enchantments: [
      "Protection IV",
      "Unbreaking III",
      "Mending",
      { label: "Depth Strider III", group: "boots-walk" },
      { label: "Frost Walker II", group: "boots-walk" },
      "Soul Speed III",
      "Feather Falling IV",
      "Thorns III"
    ]
  }
];

const toolPieces = [
  {
    name: "Netherite Sword",
    enchantments: ["Sharpness V", "Unbreaking III", "Mending", "Looting III", "Fire Aspect II"]
  },
  {
    name: "Netherite Pickaxe",
    enchantments: [
      "Efficiency V",
      "Unbreaking III",
      "Mending",
      { label: "Fortune III", group: "pickaxe-miner" },
      { label: "Silk Touch", group: "pickaxe-miner" }
    ]
  },
  {
    name: "Netherite Axe",
    enchantments: [
      "Efficiency V",
      "Unbreaking III",
      "Mending",
      "Sharpness V",
      { label: "Silk Touch", group: "axe-harvest" },
      { label: "Fortune III", group: "axe-harvest" }
    ]
  },
  {
    name: "Netherite Shovel",
    enchantments: [
      "Efficiency V",
      "Unbreaking III",
      "Mending",
      { label: "Silk Touch", group: "shovel-dig" },
      { label: "Fortune III", group: "shovel-dig" }
    ]
  },
  {
    name: "Netherite Hoe",
    enchantments: ["Efficiency V", "Unbreaking III", "Mending", "Fortune III", "Silk Touch"]
  }
];

const trims = ["Trim", "Spire", "Tide", "Ward", "Vex", "Wild", "Rib", "Coast", "Sentry", "Eye", "Snout", "Wayfinder"];
const colors = ["Color", "Emerald", "Redstone", "Lapis", "Amethyst", "Quartz", "Netherite", "Diamond", "Gold", "Iron", "Copper", "Resin"];

let currentView = "armor";
let _receiptAutoMoveSetup = false;

// ------------------------
// Rendering
// ------------------------
function renderItems() {
  const grid = document.querySelector(".armor-grid");

  grid.classList.remove("fade-in");
  grid.classList.add("fade-out");

  setTimeout(() => {
    grid.innerHTML = "";

    const data = (currentView === "armor") ? armorPieces : toolPieces;

    data.forEach((piece) => {
      const itemDiv = document.createElement("div");
      itemDiv.className = "armor-piece";
      itemDiv.dataset.name = piece.name;

      let dropdownHTML = "";
      if (currentView === "armor") {
        dropdownHTML = `
          <div class="dropdown-group">
            <select class="trim-select">
              ${trims.map(trim => `<option value="${trim}">${trim}</option>`).join("")}
            </select>
            <select class="color-select">
              ${colors.map(color => `<option value="${color}">${color}</option>`).join("")}
            </select>
          </div>
        `;
      }

      const enchHTML = piece.enchantments.map((en) => {
        const label = (typeof en === "string") ? en : en.label;
        const group = (typeof en === "string") ? "" : (en.group || "");
        const thornsDisabled = label.includes("Thorns") ? "disabled" : "";
        const groupAttr = group ? `data-group="${group}"` : "";

        return `
          <label class="enchantment">
            <input type="checkbox" data-enchant="${label}" ${groupAttr} ${thornsDisabled}>
            ${label}
          </label>
        `;
      }).join("");

      itemDiv.innerHTML = `
        <div class="armor-header">
          <h2>
            <img src="${currentView === "armor" ? armorIcons[piece.name] : toolIcons[piece.name]}"
                 alt="${piece.name}" class="item-icon">
            ${piece.name}
          </h2>
          ${dropdownHTML}
        </div>

        <div class="enchantments">
          ${enchHTML}
        </div>

        <div class="item-footer">
          <button class="item-enchant-btn" disabled>Enchant!</button>
        </div>
      `;

      grid.appendChild(itemDiv);
    });

    // Checkbox listeners
    document.querySelectorAll('input[type="checkbox"]').forEach((el) => {
      el.addEventListener("change", (e) => {
        updateConflictGroupStateFromCheckbox(e.target);

        (currentView === "armor") ? saveArmor() : saveTools();
        updateEnchantButtons();
        updateXpSummary();

        requestAnimationFrame(() => window.__updateReceiptAutoMove?.());
      });
    });

    // Select listeners
    document.querySelectorAll("select").forEach((el) => {
      el.addEventListener("change", () => {
        saveArmor();
        updateXpSummary();
        requestAnimationFrame(() => window.__updateReceiptAutoMove?.());
      });
    });

    // Enchant button listeners
    document.querySelectorAll(".item-enchant-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const pieceDiv = e.target.closest(".armor-piece");
        if (!pieceDiv) return;
        if (e.target.disabled) return;

        const itemName = pieceDiv.dataset.name;
        const enchants = getSelectedEnchants(pieceDiv);
        if (enchants.length === 0) return;

        showPlanModal(itemName, enchants);
      });
    });

    // Restore state
    if (currentView === "armor") {
      toggleThorns();
      loadArmor();
      toggleThorns();
    } else {
      loadTools();
    }

    document.querySelectorAll(".armor-piece").forEach(pieceDiv => {
      syncAllConflictGroupsInPiece(pieceDiv);
    });

    updateEnchantButtons();
    updateXpSummary();

    requestAnimationFrame(() => {
      grid.classList.remove("fade-out");
      grid.classList.add("fade-in");
    });

    setupReceiptAutoMove();
    requestAnimationFrame(() => window.__updateReceiptAutoMove?.());
  }, 200);
}

// ------------------------
// Conflict Groups
// ------------------------
function updateConflictGroupStateFromCheckbox(changedCheckbox) {
  if (!changedCheckbox) return;
  const group = changedCheckbox.dataset.group;
  if (!group) return;

  const pieceDiv = changedCheckbox.closest(".armor-piece");
  if (!pieceDiv) return;

  syncConflictGroup(pieceDiv, group);
}

function syncAllConflictGroupsInPiece(pieceDiv) {
  const groups = new Set();
  pieceDiv.querySelectorAll('input[type="checkbox"][data-group]').forEach(cb => groups.add(cb.dataset.group));
  groups.forEach(g => syncConflictGroup(pieceDiv, g));
}

function syncConflictGroup(pieceDiv, group) {
  const list = Array.from(pieceDiv.querySelectorAll(`input[type="checkbox"][data-group="${CSS.escape(group)}"]`));
  if (list.length === 0) return;

  const checked = list.filter(cb => cb.checked);

  if (checked.length === 0) {
    list.forEach(cb => {
      if (cb.dataset.enchant === "Thorns III") return;
      cb.disabled = false;
      const label = cb.closest("label");
      if (label) label.classList.remove("disabled-thorns");
    });
    return;
  }

  const keeper = checked[0];
  checked.slice(1).forEach(cb => cb.checked = false);

  list.forEach(cb => {
    if (cb === keeper) {
      cb.disabled = false;
      const label = cb.closest("label");
      if (label) label.classList.remove("disabled-thorns");
    } else {
      cb.disabled = true;
      const label = cb.closest("label");
      if (label) label.classList.add("disabled-thorns");
    }
  });
}

// ------------------------
// Init
// ------------------------
document.addEventListener("DOMContentLoaded", () => {
  (localStorage.getItem("theme") === "light") ? setLightTheme() : setDarkTheme();

  document.getElementById("toggle-view-btn").addEventListener("click", () => {
    (currentView === "armor") ? saveArmor() : saveTools();

    currentView = (currentView === "armor") ? "tools" : "armor";
    document.getElementById("toggle-view-btn").textContent =
      (currentView === "armor") ? "Show Tools" : "Show Armor";

    renderItems();
  });

  document.getElementById("reset-btn").addEventListener("click", () => {
    resetArmorData();
    requestAnimationFrame(() => window.__updateReceiptAutoMove?.());
  });

  document.getElementById("theme-toggle").addEventListener("click", toggleTheme);

  const thornsToggle = document.getElementById("thorns-toggle");
  if (thornsToggle) {
    const thornsEnabled = localStorage.getItem("thornsEnabled") === "true";
    thornsToggle.checked = thornsEnabled;
    thornsToggle.addEventListener("change", () => {
      toggleThorns();
      updateXpSummary();
      requestAnimationFrame(() => window.__updateReceiptAutoMove?.());
    });
  }

  wireModalControls();
  renderItems();
  document.querySelector(".container").classList.add("show");

  setupReceiptAutoMove();
  requestAnimationFrame(() => window.__updateReceiptAutoMove?.());
});

// ------------------------
// Save/Load
// ------------------------
function saveArmor() {
  const data = {};
  document.querySelectorAll(".armor-piece").forEach((pieceDiv) => {
    const name = pieceDiv.dataset.name;
    const trimSelect = pieceDiv.querySelector(".trim-select");
    const colorSelect = pieceDiv.querySelector(".color-select");
    const trim = trimSelect ? trimSelect.value : null;
    const color = colorSelect ? colorSelect.value : null;

    const enchants = Array.from(pieceDiv.querySelectorAll('input[type="checkbox"]:checked'))
      .map(cb => cb.dataset.enchant);

    data[name] = {
      ...(trim && { trim }),
      ...(color && { color }),
      enchantments: enchants
    };
  });

  localStorage.setItem("armorData", JSON.stringify(data));
  showSaveNotice();
}

function saveTools() {
  const data = {};
  document.querySelectorAll(".armor-piece").forEach((pieceDiv) => {
    const name = pieceDiv.dataset.name;
    const enchants = Array.from(pieceDiv.querySelectorAll('input[type="checkbox"]:checked'))
      .map(cb => cb.dataset.enchant);

    data[name] = { enchantments: enchants };
  });

  localStorage.setItem("toolData", JSON.stringify(data));
  showSaveNotice();
}

function loadArmor() {
  const savedData = JSON.parse(localStorage.getItem("armorData"));
  if (!savedData) return;

  document.querySelectorAll(".armor-piece").forEach((pieceDiv) => {
    const name = pieceDiv.dataset.name;
    const pieceData = savedData[name];
    if (!pieceData) return;

    const trimSelect = pieceDiv.querySelector(".trim-select");
    const colorSelect = pieceDiv.querySelector(".color-select");

    if (trimSelect && pieceData.trim) trimSelect.value = pieceData.trim;
    if (colorSelect && pieceData.color) colorSelect.value = pieceData.color;

    pieceDiv.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
      checkbox.checked = pieceData.enchantments.includes(checkbox.dataset.enchant);
    });

    syncAllConflictGroupsInPiece(pieceDiv);
  });
}

function loadTools() {
  const savedData = JSON.parse(localStorage.getItem("toolData"));
  if (!savedData) return;

  document.querySelectorAll(".armor-piece").forEach((pieceDiv) => {
    const name = pieceDiv.dataset.name;
    const pieceData = savedData[name];
    if (!pieceData) return;

    pieceDiv.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
      checkbox.checked = pieceData.enchantments.includes(checkbox.dataset.enchant);
    });

    syncAllConflictGroupsInPiece(pieceDiv);
  });
}

// ------------------------
// Reset + Notice
// ------------------------
function resetArmorData() {
  document.querySelectorAll("select").forEach(select => select.selectedIndex = 0);

  document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.checked = false;
    if (cb.dataset.group) {
      cb.disabled = false;
      const label = cb.closest("label");
      if (label) label.classList.remove("disabled-thorns");
    }
  });

  const storageKey = (currentView === "armor") ? "armorData" : "toolData";
  localStorage.removeItem(storageKey);

  if (currentView === "armor") toggleThorns();

  updateEnchantButtons();
  updateXpSummary();

  const btn = document.getElementById("reset-btn");
  btn.classList.add("flash");
  setTimeout(() => btn.classList.remove("flash"), 500);

  showSaveNotice("Reset Successful!");
}

function showSaveNotice(message = "Saved!") {
  const notice = document.getElementById("save-notice");
  if (!notice) return;

  notice.textContent = message;
  notice.style.backgroundColor = (message === "Reset Successful!") ? "#ff9800" : "#4caf50";
  notice.style.opacity = "1";
  setTimeout(() => { notice.style.opacity = "0"; }, 1000);
}

// ------------------------
// Theme
// ------------------------
function toggleTheme() {
  if (localStorage.getItem("theme") === "light") {
    setDarkTheme();
    hideLightModeJoke();
  } else {
    setLightTheme();
    showLightModeJoke();
  }
}

function setLightTheme() {
  const root = document.documentElement;
  root.style.setProperty("--bg-color", "#ffffff");
  root.style.setProperty("--text-color", "#000000");
  root.style.setProperty("--container-bg", "#f5f5f5");
  root.style.setProperty("--armor-piece-bg", "#e0e0e0");
  root.style.setProperty("--hover-bg", "#d0d0d0");
  root.style.setProperty("--checkbox-bg", "#ccc");
  root.style.setProperty("--checkbox-checked", "#4caf50");
  root.style.setProperty("--save-success", "#4caf50");
  root.style.setProperty("--reset-success", "#ff9800");
  root.style.setProperty("--footer-text", "#555");
  localStorage.setItem("theme", "light");
}

function setDarkTheme() {
  const root = document.documentElement;
  root.style.setProperty("--bg-color", "#1e1e1e");
  root.style.setProperty("--text-color", "#ffffff");
  root.style.setProperty("--container-bg", "#2c2c2c");
  root.style.setProperty("--armor-piece-bg", "#3c3c3c");
  root.style.setProperty("--hover-bg", "#4a4a4a");
  root.style.setProperty("--checkbox-bg", "#555");
  root.style.setProperty("--checkbox-checked", "#4caf50");
  root.style.setProperty("--save-success", "#4caf50");
  root.style.setProperty("--reset-success", "#ff9800");
  root.style.setProperty("--footer-text", "#777");
  localStorage.setItem("theme", "dark");
}

function showLightModeJoke() {
  if (window.innerWidth <= 768) return;

  let joke = document.getElementById("light-mode-joke");
  if (!joke) {
    joke = document.createElement("div");
    joke.id = "light-mode-joke";
    joke.style.cssText =
      "position:fixed;bottom:20px;right:20px;background:rgba(0,0,0,0.7);color:white;padding:10px 15px;border-radius:10px;font-size:14px;z-index:9999;opacity:0;transition:opacity 0.5s;";
    joke.textContent = "Only fucken freaks use light mode -_-";
    document.body.appendChild(joke);
    requestAnimationFrame(() => { joke.style.opacity = "1"; });
  }
}

function hideLightModeJoke() {
  const joke = document.getElementById("light-mode-joke");
  if (joke) {
    joke.style.opacity = "0";
    setTimeout(() => { joke.remove(); }, 500);
  }
}

// ------------------------
// Thorns Toggle
// ------------------------
function toggleThorns() {
  if (currentView !== "armor") return;

  const thornsToggle = document.getElementById("thorns-toggle");
  if (!thornsToggle) return;

  localStorage.setItem("thornsEnabled", String(thornsToggle.checked));

  const savedData = JSON.parse(localStorage.getItem("armorData")) || {};

  document.querySelectorAll(".armor-piece").forEach((pieceDiv) => {
    const armorName = pieceDiv.dataset.name;
    const savedEnchantments = savedData[armorName]?.enchantments || [];

    const checkbox = pieceDiv.querySelector('input[data-enchant="Thorns III"]');
    if (!checkbox) return;

    if (thornsToggle.checked) {
      checkbox.disabled = false;
      checkbox.checked = savedEnchantments.includes("Thorns III");
      const label = checkbox.closest("label");
      if (label) label.classList.remove("disabled-thorns");
    } else {
      checkbox.checked = false;
      checkbox.disabled = true;
      const label = checkbox.closest("label");
      if (label) label.classList.add("disabled-thorns");
    }
  });

  updateEnchantButtons();
}

// ------------------------
// Enchant button + modal
// ------------------------
function getSelectedEnchants(pieceDiv) {
  return Array.from(pieceDiv.querySelectorAll('input[type="checkbox"]:checked'))
    .map(cb => cb.dataset.enchant);
}

function updateEnchantButtons() {
  document.querySelectorAll(".armor-piece").forEach((pieceDiv) => {
    const btn = pieceDiv.querySelector(".item-enchant-btn");
    if (!btn) return;

    const enchants = getSelectedEnchants(pieceDiv);

    if (enchants.length === 0) {
      btn.disabled = true;
      btn.textContent = "Enchant!";
      btn.classList.remove("too-expensive");
      return;
    }

    // ✅ now checks full-process feasibility (<40 every step)
    const feasible = isFeasibleUnder40FullProcess(enchants);

    if (!feasible) {
      btn.disabled = true;
      btn.textContent = "Too Expensive!";
      btn.classList.add("too-expensive");
    } else {
      btn.disabled = false;
      btn.textContent = "Enchant!";
      btn.classList.remove("too-expensive");
    }
  });
}

function wireModalControls() {
  const modal = document.getElementById("enchant-modal");
  const closeBtn = document.getElementById("modal-close");
  const okBtn = document.getElementById("modal-ok");
  const copyBtn = document.getElementById("modal-copy");

  if (!modal || !closeBtn || !okBtn || !copyBtn) return;

  const hide = () => hidePlanModal();

  closeBtn.addEventListener("click", hide);
  okBtn.addEventListener("click", hide);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) hide();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hide();
  });

  copyBtn.addEventListener("click", () => {
    const title = document.getElementById("modal-title")?.textContent || "";
    const subtitle = document.getElementById("modal-subtitle")?.textContent || "";
    const steps = Array.from(document.querySelectorAll("#modal-steps li"))
      .map(li => `- ${li.textContent}`).join("\n");

    const text = `${title}\n${subtitle ? subtitle + "\n" : ""}${steps}`;
    navigator.clipboard?.writeText(text).then(() => showSaveNotice("Copied!"));
  });
}

function showPlanModal(itemName, enchants) {
  const modal = document.getElementById("enchant-modal");
  if (!modal) return;

  const titleEl = document.getElementById("modal-title");
  const subtitleEl = document.getElementById("modal-subtitle");
  const stepsEl = document.getElementById("modal-steps");

  if (titleEl) titleEl.textContent = `Enchant Plan — ${itemName}`;
  if (subtitleEl) subtitleEl.textContent = `Selected enchantments: ${enchants.join(", ")}`;

  // ✅ show full-process plan (not just mega-book)
  const plan = optimalFullProcessPlan(enchants, true);
  const steps = plan.steps.length ? plan.steps : ["No valid plan found."];
  if (stepsEl) stepsEl.innerHTML = steps.map(s => `<li>${s}</li>`).join("");

  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function hidePlanModal() {
  const modal = document.getElementById("enchant-modal");
  if (!modal) return;

  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

// ------------------------
// Auto-move receipt
// ------------------------
function setupReceiptAutoMove() {
  if (_receiptAutoMoveSetup) return;
  _receiptAutoMoveSetup = true;

  const layout = document.querySelector(".main-layout");
  if (!layout) return;

  const BUFFER = 20;

  function rectsOverlapWithBuffer(a, b, buffer) {
    const bExp = {
      left: b.left - buffer,
      right: b.right + buffer,
      top: b.top - buffer,
      bottom: b.bottom + buffer
    };

    const overlapX = !(a.right <= bExp.left || a.left >= bExp.right);
    const overlapY = !(a.bottom <= bExp.top || a.top >= bExp.bottom);
    return overlapX && overlapY;
  }

  function update() {
    const receipt = document.querySelector(".xp-summary");
    const resetBtn = document.getElementById("reset-btn");
    if (!receipt || !resetBtn) return;

    const isTwoColumn = window.matchMedia("(min-width: 901px)").matches;
    if (!isTwoColumn) {
      layout.classList.remove("receipt-bottom");
      return;
    }

    layout.classList.remove("receipt-bottom");

    const rRect = receipt.getBoundingClientRect();
    const bRect = resetBtn.getBoundingClientRect();

    const coveredOrTooClose = rectsOverlapWithBuffer(rRect, bRect, BUFFER);
    layout.classList.toggle("receipt-bottom", coveredOrTooClose);
  }

  window.__updateReceiptAutoMove = update;

  window.addEventListener("resize", update, { passive: true });
  window.addEventListener("scroll", update, { passive: true });

  const ro = new ResizeObserver(() => requestAnimationFrame(update));
  ro.observe(document.body);

  requestAnimationFrame(update);
}

// ------------------------
// Java anvil math
// ------------------------
const ROMAN = { I:1, II:2, III:3, IV:4, V:5, VI:6, VII:7, VIII:8, IX:9, X:10 };
const INV_ROMAN = {1:"I",2:"II",3:"III",4:"IV",5:"V",6:"VI",7:"VII",8:"VIII",9:"IX",10:"X"};

function parseEnchantLabelToNameLevel(label) {
  const parts = label.trim().split(" ");
  const last = parts[parts.length - 1];
  if (ROMAN[last]) return { name: parts.slice(0, -1).join(" "), level: ROMAN[last] };
  return { name: label.trim(), level: 1 };
}

function priorPenalty(uses) { return (1 << uses) - 1; }

const BOOK_MULT = {
  "Protection": 1,
  "Unbreaking": 1,
  "Mending": 2,
  "Respiration": 2,
  "Aqua Affinity": 2,
  "Thorns": 4,
  "Swift Sneak": 4,
  "Feather Falling": 1,
  "Depth Strider": 2,
  "Frost Walker": 2,
  "Soul Speed": 4,
  "Sharpness": 1,
  "Smite": 1,
  "Bane of Arthropods": 1,
  "Looting": 2,
  "Fire Aspect": 2,
  "Efficiency": 1,
  "Fortune": 2,
  "Silk Touch": 4
};

const MAX_LEVEL = {
  "Protection": 4,
  "Unbreaking": 3,
  "Mending": 1,
  "Respiration": 3,
  "Aqua Affinity": 1,
  "Thorns": 3,
  "Swift Sneak": 3,
  "Feather Falling": 4,
  "Depth Strider": 3,
  "Frost Walker": 2,
  "Soul Speed": 3,
  "Sharpness": 5,
  "Smite": 5,
  "Bane of Arthropods": 5,
  "Looting": 3,
  "Fire Aspect": 2,
  "Efficiency": 5,
  "Fortune": 3,
  "Silk Touch": 1
};

const INCOMP_GROUPS = [
  new Set(["Sharpness", "Smite", "Bane of Arthropods"]),
  new Set(["Fortune", "Silk Touch"]),
  new Set(["Depth Strider", "Frost Walker"]),
  new Set(["Protection", "Fire Protection", "Blast Protection", "Projectile Protection"])
];

function isIncompatible(existingMap, candidateName) {
  for (const group of INCOMP_GROUPS) {
    if (!group.has(candidateName)) continue;
    for (const ex of Object.keys(existingMap)) {
      if (group.has(ex) && ex !== candidateName) return true;
    }
  }
  return false;
}

function mergedLevel(targetLevel, sacrificeLevel, maxLevel) {
  if (targetLevel === sacrificeLevel && targetLevel < maxLevel) return targetLevel + 1;
  return Math.max(targetLevel, sacrificeLevel);
}

function applyEnchantmentsJava(targetEnchants, sacrificeEnchants) {
  const result = { ...targetEnchants };
  let enchantCost = 0;

  for (const [name, sLevel] of Object.entries(sacrificeEnchants)) {
    const mult = BOOK_MULT[name];
    if (!mult) continue;

    if (isIncompatible(result, name)) {
      enchantCost += 1;
      continue;
    }

    const maxL = MAX_LEVEL[name] ?? 1;
    const tLevel = result[name] ?? 0;
    const finalL = mergedLevel(tLevel, sLevel, maxL);

    enchantCost += finalL * mult;
    result[name] = Math.max(finalL, tLevel);
  }

  return { resultEnchants: result, enchantCost };
}

function anvilApplyJava(targetEnchants, targetUses, sacrificeEnchants, sacrificeUses) {
  const { resultEnchants, enchantCost } = applyEnchantmentsJava(targetEnchants, sacrificeEnchants);
  const opPenalty = priorPenalty(targetUses) + priorPenalty(sacrificeUses);
  const opCost = enchantCost + opPenalty;

  return {
    opCost,
    newTargetEnchants: resultEnchants,
    newTargetUses: Math.max(targetUses, sacrificeUses) + 1
  };
}

// ------------------------
// NEW: Full-process planner (books + item), enforcing per-op < 40
// ------------------------
function consolidateEnchantList(labels) {
  const parsed = labels.map(parseEnchantLabelToNameLevel);
  const consolidated = {};
  for (const e of parsed) consolidated[e.name] = Math.max(consolidated[e.name] ?? 0, e.level);
  return consolidated;
}

function enchMapToLabelList(enchMap) {
  const parts = [];
  for (const [name, level] of Object.entries(enchMap)) {
    if (level <= 1) parts.push(name);
    else parts.push(`${name} ${INV_ROMAN[level] ?? level}`);
  }
  return parts.join(", ");
}

function canonKey(itemMask, itemUses, books) {
  // books: array of {mask, uses}
  const sorted = books
    .slice()
    .sort((a, b) => (a.mask - b.mask) || (a.uses - b.uses))
    .map(b => `${b.mask}:${b.uses}`)
    .join("|");
  return `${itemMask}:${itemUses}::${sorted}`;
}

function optimalFullProcessPlan(selectedLabels, wantSteps) {
  const consolidated = consolidateEnchantList(selectedLabels);
  const names = Object.keys(consolidated);
  const n = names.length;

  if (n === 0) return { feasible: true, total: 0, maxOp: 0, steps: [] };

  const nameToIdx = new Map(names.map((nm, i) => [nm, i]));
  const goalMask = (1 << n) - 1;

  function mapToMask(enchMap) {
    let m = 0;
    for (const nm of Object.keys(enchMap)) {
      const idx = nameToIdx.get(nm);
      if (idx !== undefined) m |= (1 << idx);
    }
    return m;
  }

  // build leaf books
  const leafBooks = names.map(nm => ({
    type: "book",
    ench: { [nm]: consolidated[nm] },
    uses: 0,
    mask: (1 << nameToIdx.get(nm)),
    label: `${nm}${consolidated[nm] > 1 ? " " + (INV_ROMAN[consolidated[nm]] ?? consolidated[nm]) : ""}`
  }));

  const startItem = { type: "item", ench: {}, uses: 0, mask: 0, label: "Item" };

  // Dijkstra over (itemMask,itemUses, multiset of books (mask,uses,ench,label))
  const startBooks = leafBooks.map(b => ({ ...b }));
  const startKey = canonKey(startItem.mask, startItem.uses, startBooks);

  const dist = new Map([[startKey, 0]]);
  const bestMaxOp = new Map([[startKey, 0]]);
  const prev = new Map(); // key -> { prevKey, step }

  // simple priority queue (n small); array + min scan is fine
  const pq = [{ key: startKey, cost: 0 }];

  // store full node payloads for reconstruction / expansion
  const payload = new Map([[startKey, { item: startItem, books: startBooks }]]);

  while (pq.length) {
    // pop min
    let mi = 0;
    for (let i = 1; i < pq.length; i++) if (pq[i].cost < pq[mi].cost) mi = i;
    const cur = pq.splice(mi, 1)[0];

    const curCost = dist.get(cur.key);
    if (curCost === undefined || cur.cost !== curCost) continue;

    const state = payload.get(cur.key);
    if (!state) continue;

    const { item, books } = state;

    if (item.mask === goalMask && books.length === 0) {
      // reached goal
      const steps = [];
      if (wantSteps) {
        let k = cur.key;
        while (prev.has(k)) {
          const p = prev.get(k);
          steps.push(p.step);
          k = p.prevKey;
        }
        steps.reverse();
        steps.push(`Total levels spent: ${curCost}`);
      }
      return {
        feasible: true,
        total: curCost,
        maxOp: bestMaxOp.get(cur.key) ?? 0,
        steps
      };
    }

    // generate transitions:
    // 1) book + book -> book
    for (let i = 0; i < books.length; i++) {
      for (let j = 0; j < books.length; j++) {
        if (i === j) continue;

        const A = books[i];
        const B = books[j];

        // target book A, sacrifice book B
        const res = anvilApplyJava(A.ench, A.uses, B.ench, B.uses);
        const opCost = res.opCost;
        if (opCost >= 40) continue; // enforce rule

        // ensure we didn't lose enchants (shouldn't for compatible inputs)
        const newEnch = res.newTargetEnchants;
        const newMask = mapToMask(newEnch);
        const expectedMask = (A.mask | B.mask);
        if (newMask !== expectedMask) continue;

        const newBook = {
          type: "book",
          ench: newEnch,
          uses: res.newTargetUses,
          mask: newMask,
          label: `Book(${enchMapToLabelList(newEnch)})`
        };

        const newBooks = books.filter((_, idx) => idx !== i && idx !== j);
        newBooks.push(newBook);

        const nextItem = item;
        const nextKey = canonKey(nextItem.mask, nextItem.uses, newBooks);
        const nextCost = curCost + opCost;
        const nextMax = Math.max(bestMaxOp.get(cur.key) ?? 0, opCost);

        const old = dist.get(nextKey);
        if (old === undefined || nextCost < old) {
          dist.set(nextKey, nextCost);
          bestMaxOp.set(nextKey, nextMax);
          payload.set(nextKey, { item: nextItem, books: newBooks });
          pq.push({ key: nextKey, cost: nextCost });
          if (wantSteps) prev.set(nextKey, {
            prevKey: cur.key,
            step: `Combine (${A.label}) + (${B.label}) → Book (cost ${opCost})`
          });
        }
      }
    }

    // 2) item + book -> item  (apply book to item)
    for (let j = 0; j < books.length; j++) {
      const B = books[j];

      const res = anvilApplyJava(item.ench, item.uses, B.ench, B.uses);
      const opCost = res.opCost;
      if (opCost >= 40) continue;

      const newEnch = res.newTargetEnchants;
      const newMask = mapToMask(newEnch);
      const expectedMask = (item.mask | B.mask);
      if (newMask !== expectedMask) continue;

      const nextItem = {
        type: "item",
        ench: newEnch,
        uses: res.newTargetUses,
        mask: newMask,
        label: "Item"
      };

      const newBooks = books.filter((_, idx) => idx !== j);

      const nextKey = canonKey(nextItem.mask, nextItem.uses, newBooks);
      const nextCost = curCost + opCost;
      const nextMax = Math.max(bestMaxOp.get(cur.key) ?? 0, opCost);

      const old = dist.get(nextKey);
      if (old === undefined || nextCost < old) {
        dist.set(nextKey, nextCost);
        bestMaxOp.set(nextKey, nextMax);
        payload.set(nextKey, { item: nextItem, books: newBooks });
        pq.push({ key: nextKey, cost: nextCost });
        if (wantSteps) prev.set(nextKey, {
          prevKey: cur.key,
          step: `Apply (${B.label}) → Item (cost ${opCost})`
        });
      }
    }
  }

  return { feasible: false, total: Infinity, maxOp: Infinity, steps: wantSteps ? ["No valid <40-per-step anvil sequence found."] : [] };
}

function isFeasibleUnder40FullProcess(selectedLabels) {
  return optimalFullProcessPlan(selectedLabels, false).feasible;
}

// ------------------------
// XP summary (leave total estimate as "best feasible plan if possible")
// ------------------------
function estimateOptimalLevelsForItem(enchants) {
  const plan = optimalFullProcessPlan(enchants, false);
  if (plan.feasible) return plan.total;
  // fallback: if impossible under 40, still show the theoretical min spend using old behavior:
  return optimalBookMergeFallback(enchants).total;
}

function estimateNaiveLevelsForItem(enchants) {
  let itemUses = 0;
  let itemEnchants = {};
  let total = 0;

  for (const label of enchants) {
    const { name, level } = parseEnchantLabelToNameLevel(label);
    const bookEnchants = { [name]: level };
    const res = anvilApplyJava(itemEnchants, itemUses, bookEnchants, 0);
    total += res.opCost;
    itemEnchants = res.newTargetEnchants;
    itemUses = res.newTargetUses;
  }

  return total;
}

// ------------------------
// Fallback old "mega-book" optimizer for display when infeasible
// ------------------------
function optimalBookMergeFallback(enchants) {
  const consolidated = consolidateEnchantList(enchants);
  const names = Object.keys(consolidated);
  const n = names.length;
  if (n === 0) return { total: 0, steps: [] };

  const leafBooks = names.map(name => ({
    enchants: { [name]: consolidated[name] },
    uses: 0,
    label: `${name}${consolidated[name] > 1 ? " " + (INV_ROMAN[consolidated[name]] ?? consolidated[name]) : ""}`
  }));

  const FULL = (1 << n) - 1;
  const dp = Array.from({ length: 1 << n }, () => new Map());

  for (let i = 0; i < n; i++) {
    dp[1 << i].set(0, {
      cost: 0,
      uses: 0,
      enchants: { ...leafBooks[i].enchants },
      steps: [],
      label: leafBooks[i].label
    });
  }

  const relax = (map, uses, cand) => {
    const ex = map.get(uses);
    if (!ex || cand.cost < ex.cost) map.set(uses, cand);
  };

  for (let mask = 1; mask <= FULL; mask++) {
    if ((mask & (mask - 1)) === 0) continue;

    for (let a = (mask - 1) & mask; a > 0; a = (a - 1) & mask) {
      const b = mask ^ a;
      if (b === 0) continue;
      if (a > b) continue;

      for (const A of dp[a].values()) {
        for (const B of dp[b].values()) {
          {
            const res = anvilApplyJava(A.enchants, A.uses, B.enchants, B.uses);
            const newUses = res.newTargetUses;
            const opCost = res.opCost;
            relax(dp[mask], newUses, {
              cost: A.cost + B.cost + opCost,
              uses: newUses,
              enchants: res.newTargetEnchants,
              steps: [],
              label: "Book"
            });
          }
          {
            const res = anvilApplyJava(B.enchants, B.uses, A.enchants, A.uses);
            const newUses = res.newTargetUses;
            const opCost = res.opCost;
            relax(dp[mask], newUses, {
              cost: A.cost + B.cost + opCost,
              uses: newUses,
              enchants: res.newTargetEnchants,
              steps: [],
              label: "Book"
            });
          }
        }
      }
    }
  }

  let best = null;
  for (const s of dp[FULL].values()) {
    if (!best || s.cost < best.cost) best = s;
  }

  const apply = anvilApplyJava({}, 0, best.enchants, best.uses);
  const total = best.cost + apply.opCost;
  return { total, steps: [] };
}

// ------------------------
// Modal step generation uses full-process plan
// ------------------------
function generateEnchantPlan(enchants) {
  return optimalFullProcessPlan(enchants, true).steps;
}

// ------------------------
// XP summary UI
// ------------------------
function updateXpSummary() {
  const totalEl = document.getElementById("xp-total");
  const savedEl = document.getElementById("xp-saved");
  const breakdownEl = document.getElementById("xp-breakdown");
  if (!totalEl || !savedEl || !breakdownEl) return;

  let totalOptimal = 0;
  let totalNaive = 0;

  const lines = [];

  document.querySelectorAll(".armor-piece").forEach(pieceDiv => {
    const name = pieceDiv.dataset.name;
    const enchants = getSelectedEnchants(pieceDiv);
    if (enchants.length === 0) return;

    const opt = estimateOptimalLevelsForItem(enchants);
    const naive = estimateNaiveLevelsForItem(enchants);

    totalOptimal += opt;
    totalNaive += naive;

    const saved = Math.max(0, naive - opt);
    lines.push({ name, opt, saved });
  });

  const savedTotal = Math.max(0, totalNaive - totalOptimal);

  totalEl.textContent = String(totalOptimal);
  savedEl.textContent = String(savedTotal);

  breakdownEl.innerHTML = lines.length
    ? lines
        .sort((a,b) => b.opt - a.opt)
        .map(l => `
          <div class="xp-itemline">
            <span><b>${l.name}</b></span>
            <span>${l.opt} <span style="opacity:.8;">(saved ${l.saved})</span></span>
          </div>
        `).join("")
    : `<div style="opacity:.7;">Select some enchants to see totals.</div>`;
}
