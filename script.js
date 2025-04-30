const armorPieces = [
    { name: "Netherite Helmet", enchantments: ["Protection IV", "Unbreaking III", "Mending", "Respiration III", "Aqua Affinity I", "Thorns III"] },
    { name: "Netherite Chestplate", enchantments: ["Protection IV", "Unbreaking III", "Mending", "Thorns III"] },
    { name: "Netherite Leggings", enchantments: ["Protection IV", "Unbreaking III", "Mending", "Swift Sneak III", "Thorns III"] },
    { name: "Netherite Boots", enchantments: ["Protection IV", "Unbreaking III", "Mending", "Depth Strider III / Frost Walker II", "Soul Speed III", "Feather Falling IV", "Thorns III"] }
];

const toolPieces = [
    { name: "Netherite Sword", enchantments: ["Sharpness V", "Unbreaking III", "Mending", "Looting III", "Fire Aspect II"] },
    { name: "Netherite Pickaxe", enchantments: ["Efficiency V", "Unbreaking III", "Mending", "Fortune III / Silk Touch"] },
    { name: "Netherite Axe", enchantments: ["Efficiency V", "Unbreaking III", "Mending", "Sharpness V", "Silk Touch / Fortune III"] },
    { name: "Netherite Shovel", enchantments: ["Efficiency V", "Unbreaking III", "Mending", "Silk Touch / Fortune III"] },
    { name: "Netherite Hoe", enchantments: ["Efficiency V", "Unbreaking III", "Mending", "Fortune III", "Silk Touch"] }
];

const trims = ["Trim", "Spire", "Tide", "Ward", "Vex", "Wild", "Rib", "Coast", "Sentry", "Eye", "Snout", "Wayfinder"];
const colors = ["Color", "Emerald", "Redstone", "Lapis", "Amethyst", "Quartz", "Netherite", "Diamond", "Gold", "Iron", "Copper", "Resin"];

let currentView = 'armor'; // or 'tools'

function renderItems() {
    const grid = document.querySelector(".armor-grid");

    // Start fade-out
    grid.classList.remove('fade-in');
    grid.classList.add('fade-out');

    // Wait for fade-out transition
    setTimeout(() => {
        grid.innerHTML = "";

        const data = (currentView === 'armor') ? armorPieces : toolPieces;

        data.forEach((piece, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'armor-piece';

            let dropdownHTML = '';
            if (currentView === 'armor') {
                dropdownHTML = `
                    <div class="dropdown-group">
                        <select class="trim-select">
                            ${trims.map(trim => `<option value="${trim}">${trim}</option>`).join('')}
                        </select>
                        <select class="color-select">
                            ${colors.map(color => `<option value="${color}">${color}</option>`).join('')}
                        </select>
                    </div>
                `;
            }

            itemDiv.innerHTML = `
                <div class="armor-header">
                    <h2>${piece.name}</h2>
                    ${dropdownHTML}
                </div>
                <div class="enchantments">
                    ${piece.enchantments.map(enchant => `
                        <label class="enchantment">
                            <input type="checkbox" data-enchant="${enchant}" ${enchant.includes("Thorns") ? 'disabled' : ''}>
                            ${enchant}
                        </label>
                    `).join('')}
                </div>
            `;

            grid.appendChild(itemDiv);
        });

        document.querySelectorAll('input[type="checkbox"]').forEach(el =>
            el.addEventListener('change', () => currentView === 'armor' ? saveArmor() : saveTools())
        );

        document.querySelectorAll('select').forEach(el =>
            el.addEventListener('change', () => saveArmor())
        );

        if (currentView === 'armor') {
            toggleThorns();
            loadArmor();
        } else {
            loadTools();
        }

        requestAnimationFrame(() => {
            grid.classList.remove('fade-out');
            grid.classList.add('fade-in');
        });
    }, 200); // Matches CSS transition duration
}

document.addEventListener("DOMContentLoaded", () => {
    (localStorage.getItem('theme') === 'light') ? setLightTheme() : setDarkTheme();

    renderItems(); // ← now works because it was defined earlier

    document.getElementById("toggle-view-btn").addEventListener("click", () => {
        if (currentView === 'armor') {
            saveArmor();
        } else {
            saveTools();
        }

        // Switch the view
        currentView = (currentView === 'armor') ? 'tools' : 'armor';

        // Update the button label
        document.getElementById("toggle-view-btn").textContent =
            (currentView === 'armor') ? 'Show Tools' : 'Show Armor';

        // Render the new view
        renderItems();
    });

    document.getElementById("reset-btn").addEventListener("click", resetArmorData);
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

    const thornsToggle = document.getElementById('thorns-toggle');
    if (thornsToggle) {
        const thornsEnabled = localStorage.getItem('thornsEnabled') === 'true';
        thornsToggle.checked = thornsEnabled;
        thornsToggle.addEventListener('change', toggleThorns);
    }

    document.querySelector('.container').classList.add('show');
});


function saveArmor() {
    const data = {};
    document.querySelectorAll('.armor-piece').forEach(pieceDiv => {
        const name = pieceDiv.querySelector("h2").textContent;
        const trimSelect = pieceDiv.querySelector('.trim-select');
        const colorSelect = pieceDiv.querySelector('.color-select');
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

    console.log("[saveArmor] Saving data:", data);
    localStorage.setItem("armorData", JSON.stringify(data));
    showSaveNotice();
}

function saveTools() {
    const data = {};
    document.querySelectorAll('.armor-piece').forEach(pieceDiv => {
        const name = pieceDiv.querySelector("h2").textContent;
        const enchants = Array.from(pieceDiv.querySelectorAll('input[type="checkbox"]:checked'))
                              .map(cb => cb.dataset.enchant);

        data[name] = { enchantments: enchants };
    });

    localStorage.setItem("toolData", JSON.stringify(data));
    showSaveNotice();
}




function loadArmor() {
    const savedData = JSON.parse(localStorage.getItem("armorData"));
    console.log("[loadArmor] Loaded data from localStorage:", savedData);
    if (!savedData) return;

    document.querySelectorAll('.armor-piece').forEach(pieceDiv => {
        const name = pieceDiv.querySelector("h2").textContent;
        const pieceData = savedData[name];
        if (!pieceData) {
            console.log(`[loadArmor] No saved data for ${name}`);
            return;
        }

        console.log(`[loadArmor] Restoring ${name}:`, pieceData);

        const trimSelect = pieceDiv.querySelector('.trim-select');
        const colorSelect = pieceDiv.querySelector('.color-select');
        if (trimSelect && pieceData.trim) {
            trimSelect.value = pieceData.trim;
            console.log(`[loadArmor] Set trim for ${name} to:`, pieceData.trim);
        }
        if (colorSelect && pieceData.color) {
            colorSelect.value = pieceData.color;
            console.log(`[loadArmor] Set color for ${name} to:`, pieceData.color);
        }

        pieceDiv.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = pieceData.enchantments.includes(checkbox.dataset.enchant);
            if (checkbox.checked) {
                console.log(`[loadArmor] Checked: ${checkbox.dataset.enchant}`);
            }
        });
    });
}

function loadTools() {
    const savedData = JSON.parse(localStorage.getItem("toolData"));
    if (!savedData) return;

    document.querySelectorAll('.armor-piece').forEach(pieceDiv => {
        const name = pieceDiv.querySelector("h2").textContent;
        const pieceData = savedData[name];
        if (!pieceData) return;

        pieceDiv.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
            checkbox.checked = pieceData.enchantments.includes(checkbox.dataset.enchant);
        });
    });
}




function resetArmorData() {
     document.querySelectorAll('select').forEach(select => select.selectedIndex = 0);
     document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);

     const storageKey = (currentView === 'armor') ? 'armorData' : 'toolData';
     localStorage.removeItem(storageKey);

     document.getElementById("reset-btn").classList.add('flash');
     setTimeout(() => document.getElementById("reset-btn").classList.remove('flash'), 500);
     showSaveNotice("Reset Successful!");
 }

function showSaveNotice(message = "Saved!") {
    const notice = document.getElementById('save-notice');
    notice.textContent = message;
    notice.style.backgroundColor = (message === "Reset Successful!") ? "#ff9800" : "#4caf50";
    notice.style.opacity = '1';
    setTimeout(() => { notice.style.opacity = '0'; }, 1000);
}

function toggleTheme() {
    if (localStorage.getItem('theme') === 'light') {
        setDarkTheme();
        hideLightModeJoke();
    } else {
        setLightTheme();
        showLightModeJoke();
    }
}

function setLightTheme() {
    const root = document.documentElement;
    root.style.setProperty('--bg-color', '#ffffff');
    root.style.setProperty('--text-color', '#000000');
    root.style.setProperty('--container-bg', '#f5f5f5');
    root.style.setProperty('--armor-piece-bg', '#e0e0e0');
    root.style.setProperty('--hover-bg', '#d0d0d0');
    root.style.setProperty('--checkbox-bg', '#ccc');
    root.style.setProperty('--checkbox-checked', '#4caf50');
    root.style.setProperty('--save-success', '#4caf50');
    root.style.setProperty('--reset-success', '#ff9800');
    root.style.setProperty('--footer-text', '#555');
    localStorage.setItem('theme', 'light');
}

function setDarkTheme() {
    const root = document.documentElement;
    root.style.setProperty('--bg-color', '#1e1e1e');
    root.style.setProperty('--text-color', '#ffffff');
    root.style.setProperty('--container-bg', '#2c2c2c');
    root.style.setProperty('--armor-piece-bg', '#3c3c3c');
    root.style.setProperty('--hover-bg', '#4a4a4a');
    root.style.setProperty('--checkbox-bg', '#555');
    root.style.setProperty('--checkbox-checked', '#4caf50');
    root.style.setProperty('--save-success', '#4caf50');
    root.style.setProperty('--reset-success', '#ff9800');
    root.style.setProperty('--footer-text', '#777');
    localStorage.setItem('theme', 'dark');
}

// Joke is now desktop-only
function showLightModeJoke() {
    if (window.innerWidth <= 768) return;

    let joke = document.getElementById('light-mode-joke');
    if (!joke) {
        joke = document.createElement('div');
        joke.id = 'light-mode-joke';
        joke.style.cssText = 'position:fixed;bottom:20px;right:20px;background:rgba(0,0,0,0.7);color:white;padding:10px 15px;border-radius:10px;font-size:14px;z-index:9999;opacity:0;transition:opacity 0.5s;';
        joke.textContent = "Only fucken freaks use light mode -_-";
        document.body.appendChild(joke);
        requestAnimationFrame(() => { joke.style.opacity = '1'; });
    }
}

function hideLightModeJoke() {
    const joke = document.getElementById('light-mode-joke');
    if (joke) {
        joke.style.opacity = '0';
        setTimeout(() => { joke.remove(); }, 500);
    }
}

function toggleThorns() {
    if (currentView !== 'armor') return; // 🛑 Do nothing in tool view

    const thornsToggle = document.getElementById('thorns-toggle');
    localStorage.setItem('thornsEnabled', thornsToggle.checked);

    const thornsCheckboxes = document.querySelectorAll('input[data-enchant="Thorns III"]');
    const savedData = JSON.parse(localStorage.getItem('armorData')) || {};

    thornsCheckboxes.forEach((checkbox, idx) => {
        const armorName = armorPieces[Math.floor(idx / 1)].name;
        const savedEnchantments = savedData[armorName]?.enchantments || [];

        if (thornsToggle.checked) {
            checkbox.disabled = false;
            checkbox.checked = savedEnchantments.includes("Thorns III");
        } else {
            checkbox.checked = false;
            checkbox.disabled = true;
        }

        const label = checkbox.closest('label');
        label.classList.toggle('disabled-thorns', !thornsToggle.checked);
    });
}

window.addEventListener('load', () => {
    document.querySelector('.container').classList.add('show');
});
