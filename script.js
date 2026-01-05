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

      // ✅ Only one Enchant button, inside the footer
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

        // re-evaluate overlap after changes
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

        // If disabled (including Too Expensive), do nothing
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

    // Enforce conflict UI after load
    document.querySelectorAll(".armor-piece").forEach(pieceDiv => {
      syncAllConflictGroupsInPiece(pieceDiv);
    });

    updateEnchantButtons();
    updateXpSummary();

    requestAnimationFrame(() => {
      grid.classList.remove("fade-out");
      grid.classList.add("fade-in");
    });

    // ensure the auto-move logic is active
    setupReceiptAutoMove();
    requestAnimationFrame(() => window.__updateReceiptAutoMove?.());
  }, 200);
}

// ------------------------
// Conflict Groups (disable + grey-out)
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

/**
 * ✅ Correct "Too Expensive!" rule:
 * The anvil blocks ONLY if ANY SINGLE operation costs >= 40.
 * So we compute the optimal plan and check its max single-step cost.
 */
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

    const tooExpensive = isTooExpensiveForItem(enchants);

    if (tooExpensive) {
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

  const steps = generateEnchantPlan(enchants);
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
// Auto-move receipt if it would cover Reset (with 20px buffer)
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

    if (coveredOrTooClose) {
      layout.classList.add("receipt-bottom");
    } else {
      layout.classList.remove("receipt-bottom");
    }
  }

  window.__updateReceiptAutoMove = update;

  window.addEventListener("resize", update, { passive: true });
  window.addEventListener("scroll", update, { passive: true });

  const ro = new ResizeObserver(() => requestAnimationFrame(update));
  ro.observe(document.body);

  requestAnimationFrame(update);
}

// ------------------------
// Java 1.21.x anvil math + plan + XP summary
// ------------------------
const ROMAN = { I:1, II:2, III:3, IV:4, V:5, VI:6, VII:7, VIII:8, IX:9, X:10 };
const INV_ROMAN = {1:"I",2:"II",3:"III",4:"IV",5:"V",6:"VI",7:"VII",8:"VIII",9:"IX",10:"X"};

function parseEnchantLabelToNameLevel(label) {
  const parts = label.trim().split(" ");
  const last = parts[parts.length - 1];
  if (ROMAN[last]) return { name: parts.slice(0, -1).join(" "), level: ROMAN[last] };
  return { name: label.trim(), level: 1 };
}

function priorPenalty(uses) {
  return (1 << uses) - 1;
}

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

/**
 * ✅ optimalBookMerge now tracks:
 * - total levels spent (total)
 * - max single-step anvil cost (maxOp)  <-- correct "Too Expensive!" gate
 */
function optimalBookMerge(enchants, wantSteps = false) {
  const parsed = enchants.map(parseEnchantLabelToNameLevel);

  const consolidated = {};
  for (const e of parsed) consolidated[e.name] = Math.max(consolidated[e.name] ?? 0, e.level);

  const names = Object.keys(consolidated);
  const n = names.length;
  if (n === 0) return { total: 0, steps: [], maxOp: 0 };

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
      label: leafBooks[i].label,
      maxOp: 0
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
          // A target + B sacrifice
          {
            const res = anvilApplyJava(A.enchants, A.uses, B.enchants, B.uses);
            const newUses = res.newTargetUses;
            const opCost = res.opCost;

            const maxOp = Math.max(A.maxOp ?? 0, B.maxOp ?? 0, opCost);

            const steps = wantSteps
              ? [...A.steps, ...B.steps, `Combine (${A.label}) + (${B.label}) → Book (cost ${opCost})${opCost >= 40 ? " ⚠ Too Expensive!" : ""}`]
              : [];

            relax(dp[mask], newUses, {
              cost: A.cost + B.cost + opCost,
              uses: newUses,
              enchants: res.newTargetEnchants,
              steps,
              label: "Book",
              maxOp
            });
          }

          // B target + A sacrifice
          {
            const res = anvilApplyJava(B.enchants, B.uses, A.enchants, A.uses);
            const newUses = res.newTargetUses;
            const opCost = res.opCost;

            const maxOp = Math.max(A.maxOp ?? 0, B.maxOp ?? 0, opCost);

            const steps = wantSteps
              ? [...B.steps, ...A.steps, `Combine (${B.label}) + (${A.label}) → Book (cost ${opCost})${opCost >= 40 ? " ⚠ Too Expensive!" : ""}`]
              : [];

            relax(dp[mask], newUses, {
              cost: A.cost + B.cost + opCost,
              uses: newUses,
              enchants: res.newTargetEnchants,
              steps,
              label: "Book",
              maxOp
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
  const maxOp = Math.max(best.maxOp ?? 0, apply.opCost);

  const steps = wantSteps
    ? [...best.steps,
        `Apply final book to item (cost ${apply.opCost})${apply.opCost >= 40 ? " ⚠ Too Expensive!" : ""}`,
        `Total levels spent: ${total}`]
    : [];

  return { total, steps, maxOp };
}

function isTooExpensiveForItem(enchants) {
  return optimalBookMerge(enchants, false).maxOp >= 40;
}

function estimateOptimalLevelsForItem(enchants) {
  return optimalBookMerge(enchants, false).total;
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

function generateEnchantPlan(enchants) {
  return optimalBookMerge(enchants, true).steps;
}

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
