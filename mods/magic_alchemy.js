// =====================================================================
// Magic & Alchemy — a Sandboxels mod
// =====================================================================
// Adds 10 magic-themed elements with reactions:
//   mana, arcane dust, magic fire, rune stone, active rune,
//   philosopher's stone, lead, enchanted gold, mandrake, ectoplasm
//
// Install:
//   1. Save this file as magic_alchemy.js
//   2. Place it in your Sandboxels mods folder, OR upload via the
//      in-game Mods menu (gear icon → Mods → Add Mod → pick this file)
//   3. Reload the page; new elements appear in their categories
// =====================================================================

// ---------- Mana ------------------------------------------------------
// A magical liquid. Boils into magic fire when hot. Transmutes lead
// (slowly) and turns rune stones into active runes on contact.
elements.mana = {
    name: "mana",
    color: ["#3a7bff", "#5ea0ff", "#82c1ff"],
    behavior: behaviors.LIQUID,
    category: "liquids",
    state: "liquid",
    density: 850,
    viscosity: 100,
    tempHigh: 250,
    stateHigh: "magic_fire",
    reactions: {
        // mana energizes a rune stone
        "rune_stone": { elem1: null, elem2: "rune_active" },
        // slow alchemical transmutation
        "lead": { elem1: null, elem2: "enchanted_gold", chance: 0.004 },
        "iron": { elem1: null, elem2: "enchanted_gold", chance: 0.0008 },
        // re-imbues ash into arcane dust
        "ash": { elem1: "arcane_dust", elem2: null, chance: 0.04 },
        // mana + dust ignites
        "arcane_dust": { elem1: "magic_fire", elem2: "magic_fire", chance: 0.25 },
        // mana neutralizes acid into water
        "acid": { elem1: "water", elem2: "salt", chance: 0.3 },
    },
};

// ---------- Arcane Dust -----------------------------------------------
// Volatile purple powder. Ignites into magic fire on contact with
// flame, mana, or lightning.
elements.arcane_dust = {
    name: "arcane dust",
    color: ["#b58fff", "#c8a8ff", "#9870e0"],
    behavior: behaviors.POWDER,
    category: "powders",
    state: "solid",
    density: 700,
    burn: 95,
    burnTime: 80,
    burnInto: "magic_fire",
    reactions: {
        "fire":      { elem1: "magic_fire", elem2: null },
        "lightning": { elem1: "magic_fire", elem2: null },
        "lava":      { elem1: "magic_fire", elem2: null, chance: 0.3 },
        "plasma":    { elem1: "magic_fire", elem2: null },
    },
};

// ---------- Magic Fire -------------------------------------------------
// A purple-blue arcane flame. Hotter than ordinary fire, burns most
// organics straight to ash, but is absorbed by dragon scale.
elements.magic_fire = {
    name: "magic fire",
    color: ["#7a3fff", "#a06fff", "#d6a0ff"],
    behavior: behaviors.GAS,
    category: "energy",
    state: "gas",
    temp: 600,
    tempHigh: 900,
    density: 0.05,
    hidden: false,
    excludeRandom: true,
    reactions: {
        "water":  { elem1: null, elem2: "steam" },
        "wood":   { elem1: null, elem2: "ash" },
        "plant":  { elem1: null, elem2: "ash" },
        "paper":  { elem1: null, elem2: "ash" },
        "cloth":  { elem1: null, elem2: "ash" },
        "ice":    { elem1: null, elem2: "water" },
        "snow":   { elem1: null, elem2: "water" },
        // dragon scale absorbs magic fire (both consumed)
        "dragon_scale": { elem1: null, elem2: null, chance: 0.05 },
        "mandrake": { elem1: null, elem2: "fire", chance: 0.6 },
    },
    tick: function(pixel) {
        // 4% chance to extinguish each tick (so it burns out unlike normal fire)
        if (Math.random() < 0.04) {
            deletePixel(pixel.x, pixel.y);
            return;
        }
    },
};

// ---------- Rune Stone -------------------------------------------------
// Inert magical stone. Becomes "rune_active" when touched by mana.
elements.rune_stone = {
    name: "rune stone",
    color: ["#3a3a4a", "#4a4a5e", "#2a2a3a"],
    behavior: behaviors.WALL,
    category: "solids",
    state: "solid",
    density: 2500,
    hardness: 0.8,
    conduct: 0.3,
    tempHigh: 1500,
    stateHigh: "lava",
    breakInto: "stone",
};

// ---------- Active Rune -----------------------------------------------
// A glowing rune stone. Slowly emits mana to its surroundings and very
// occasionally fires a lightning spark — a renewable mana source.
elements.rune_active = {
    name: "active rune",
    color: ["#5fb4ff", "#80c8ff", "#3a8ff0"],
    behavior: behaviors.WALL,
    category: "solids",
    state: "solid",
    density: 2500,
    hardness: 0.8,
    conduct: 1.0,
    glow: true,
    tempHigh: 1500,
    stateHigh: "lava",
    breakInto: "stone",
    tick: function(pixel) {
        // emit a droplet of mana into a random adjacent empty cell
        if (Math.random() < 0.015) {
            const dirs = [[0,1],[0,-1],[1,0],[-1,0]];
            const [dx, dy] = dirs[Math.floor(Math.random() * 4)];
            if (isEmpty(pixel.x + dx, pixel.y + dy, false)) {
                createPixel("mana", pixel.x + dx, pixel.y + dy);
            }
        }
        // rarely zap lightning
        if (Math.random() < 0.0008) {
            const dirs = [[0,1],[0,-1],[1,0],[-1,0]];
            const [dx, dy] = dirs[Math.floor(Math.random() * 4)];
            if (isEmpty(pixel.x + dx, pixel.y + dy, false)) {
                createPixel("lightning", pixel.x + dx, pixel.y + dy);
            }
        }
    },
};

// ---------- Philosopher's Stone ---------------------------------------
// The legendary catalyst. Indestructible. Transmutes adjacent lead
// into enchanted gold over time.
elements.philosopher_stone = {
    name: "philosopher's stone",
    color: ["#ff5544", "#ff7755", "#cc3322"],
    behavior: behaviors.WALL,
    category: "solids",
    state: "solid",
    density: 4000,
    hardness: 1.0,
    glow: true,
    insulate: true,
    tempHigh: 9999,
    breakInto: "philosopher_stone",
    tick: function(pixel) {
        // transmutation: any neighbouring lead has a chance to become enchanted gold
        const offsets = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
        for (const [dx, dy] of offsets) {
            const nx = pixel.x + dx, ny = pixel.y + dy;
            const p = pixelMap[nx] && pixelMap[nx][ny];
            if (p && (p.element === "lead" || p.element === "iron") && Math.random() < 0.05) {
                changePixel(p, "enchanted_gold");
            }
        }
    },
};

// ---------- Lead -------------------------------------------------------
// Heavy base metal — feedstock for transmutation.
elements.lead = {
    name: "lead",
    color: ["#5a5a64", "#6a6a78", "#4a4a52"],
    behavior: behaviors.SUPPORT,
    category: "solids",
    state: "solid",
    density: 11340,
    hardness: 0.4,
    conduct: 0.7,
    tempHigh: 327,
    stateHigh: "molten_lead",
    breakInto: "lead",
};

elements.molten_lead = {
    name: "molten lead",
    color: ["#888892", "#a0a0aa", "#666670"],
    behavior: behaviors.LIQUID,
    category: "liquids",
    state: "liquid",
    density: 10500,
    viscosity: 1500,
    temp: 400,
    tempLow: 327,
    stateLow: "lead",
    hidden: true, // only appears as a state of lead
};

// ---------- Enchanted Gold --------------------------------------------
// Glowing gold — the prize of alchemy. Conducts beautifully and tints
// magic fire even hotter (via reactions on neighbours).
elements.enchanted_gold = {
    name: "enchanted gold",
    color: ["#ffd54f", "#ffe082", "#e0b830"],
    behavior: behaviors.SUPPORT,
    category: "solids",
    state: "solid",
    density: 19300,
    hardness: 0.5,
    conduct: 1.0,
    glow: true,
    tempHigh: 1064,
    stateHigh: "molten_gold",
    breakInto: "enchanted_gold",
};

// ---------- Mandrake ---------------------------------------------------
// A screaming root. When set alight, it explodes into fire and ash.
elements.mandrake = {
    name: "mandrake",
    color: ["#3a8b3a", "#4aaa4a", "#2a6a2a"],
    behavior: behaviors.STURDY,
    category: "life",
    state: "solid",
    density: 800,
    hardness: 0.2,
    burn: 80,
    burnTime: 30,
    burnInto: "ash",
    tempHigh: 180,
    stateHigh: "fire",
    reactions: {
        // sunlight = grow (rarely produces a seed of itself nearby)
        "dirt":  { elem1: null, elem2: "mandrake", chance: 0.0008 },
        "soil":  { elem1: null, elem2: "mandrake", chance: 0.0008 },
        "fire":  { elem1: "ash", elem2: "fire", chance: 0.6 },
    },
    tick: function(pixel) {
        // when very hot, scream — small explosion
        if (pixel.temp > 120 && Math.random() < 0.05) {
            if (typeof explodeAtPlus === "function") {
                explodeAtPlus(pixel.x, pixel.y, 3, "fire");
            } else if (typeof explodeAt === "function") {
                explodeAt(pixel.x, pixel.y, 3, "fire");
            } else {
                deletePixel(pixel.x, pixel.y);
            }
        }
    },
};

// ---------- Dragon Scale ----------------------------------------------
// Heat-proof armour material. Absorbs fire and magic fire instead of
// burning. Survives lava.
elements.dragon_scale = {
    name: "dragon scale",
    color: ["#9a3030", "#b04040", "#7a2020"],
    behavior: behaviors.WALL,
    category: "solids",
    state: "solid",
    density: 3000,
    hardness: 1.0,
    insulate: true,
    tempHigh: 5000,
    breakInto: "dragon_scale",
    reactions: {
        "fire":       { elem1: null, elem2: null, chance: 0.4 },
        "magic_fire": { elem1: null, elem2: null, chance: 0.4 },
    },
};

// ---------- Ectoplasm --------------------------------------------------
// Ghostly fluid, almost weightless. Slowly dissipates and occasionally
// phases through nearby solids.
elements.ectoplasm = {
    name: "ectoplasm",
    color: ["#a0ffd0", "#b8ffe0", "#80e0a8"],
    behavior: behaviors.LIQUID,
    category: "liquids",
    state: "liquid",
    density: 50,
    viscosity: 50,
    temp: 5,
    glow: true,
    reactions: {
        "salt":   { elem1: null, elem2: "salt", chance: 0.5 },   // banished by salt
        "fire":   { elem1: null, elem2: null, chance: 0.4 },     // burned away
        "water":  { elem1: "ectoplasm", elem2: "ectoplasm", chance: 0.005 }, // multiplies in water
    },
    tick: function(pixel) {
        // rare phase: teleport up to 3 cells in any direction if there's empty space
        if (Math.random() < 0.006) {
            const dx = Math.floor(Math.random() * 7) - 3;
            const dy = Math.floor(Math.random() * 7) - 3;
            const nx = pixel.x + dx, ny = pixel.y + dy;
            if (isEmpty(nx, ny, false)) {
                deletePixel(pixel.x, pixel.y);
                createPixel("ectoplasm", nx, ny);
                return;
            }
        }
        // gently dissipates
        if (Math.random() < 0.0012) deletePixel(pixel.x, pixel.y);
    },
};

// =====================================================================
// MORE MAGIC
// =====================================================================

// ---------- Mana Crystal ----------------------------------------------
// Crystallised mana — break it to release the fluid form.
elements.mana_crystal = {
    name: "mana crystal",
    color: ["#5fb4ff", "#82c8ff", "#3a8ff0"],
    behavior: behaviors.WALL,
    category: "solids",
    state: "solid",
    density: 1800,
    hardness: 0.5,
    glow: true,
    tempHigh: 1200,
    stateHigh: "mana",
    breakInto: ["mana", "mana", "arcane_dust"],
};

// ---------- Soul Orb --------------------------------------------------
// A trapped soul. Releases ectoplasm when broken or heated.
elements.soul_orb = {
    name: "soul orb",
    color: ["#d8ffe8", "#a0ffd0", "#80e0a8"],
    behavior: behaviors.STURDY,
    category: "life",
    state: "solid",
    density: 600,
    hardness: 0.3,
    glow: true,
    tempHigh: 250,
    stateHigh: "ectoplasm",
    breakInto: ["ectoplasm", "ectoplasm", "ectoplasm"],
};

// ---------- Frost Rune ------------------------------------------------
// A rune that emits cold and ice instead of mana.
elements.frost_rune = {
    name: "frost rune",
    color: ["#a0d8ff", "#cfe8ff", "#7fb8e8"],
    behavior: behaviors.WALL,
    category: "solids",
    state: "solid",
    density: 2500,
    hardness: 0.8,
    conduct: 0.4,
    glow: true,
    tempLow: -200,
    temp: -10,
    breakInto: "stone",
    tick: function(pixel) {
        // chill neighbours
        const offsets = [[1,0],[-1,0],[0,1],[0,-1]];
        for (const [dx, dy] of offsets) {
            const p = pixelMap[pixel.x + dx] && pixelMap[pixel.x + dx][pixel.y + dy];
            if (p && p.temp > -30) p.temp -= 4;
        }
        // occasionally emit snow
        if (Math.random() < 0.01) {
            const [dx, dy] = [[0,1],[0,-1],[1,0],[-1,0]][Math.floor(Math.random()*4)];
            if (isEmpty(pixel.x + dx, pixel.y + dy, false)) {
                createPixel("snow", pixel.x + dx, pixel.y + dy);
            }
        }
    },
};

// ---------- Fire Rune -------------------------------------------------
// A rune that emits fire instead of mana — turret-like.
elements.fire_rune = {
    name: "fire rune",
    color: ["#ff6a3a", "#ff8a55", "#cc4a1a"],
    behavior: behaviors.WALL,
    category: "solids",
    state: "solid",
    density: 2500,
    hardness: 0.8,
    conduct: 0.4,
    glow: true,
    temp: 300,
    breakInto: "stone",
    tick: function(pixel) {
        if (Math.random() < 0.02) {
            const [dx, dy] = [[0,1],[0,-1],[1,0],[-1,0]][Math.floor(Math.random()*4)];
            if (isEmpty(pixel.x + dx, pixel.y + dy, false)) {
                createPixel("fire", pixel.x + dx, pixel.y + dy);
            }
        }
    },
};

// ---------- Holy Water ------------------------------------------------
// Blessed water — banishes ectoplasm and douses magic fire violently.
elements.holy_water = {
    name: "holy water",
    color: ["#fff5b8", "#fffae0", "#e8d870"],
    behavior: behaviors.LIQUID,
    category: "liquids",
    state: "liquid",
    density: 1010,
    viscosity: 80,
    glow: true,
    tempHigh: 110,
    stateHigh: "steam",
    reactions: {
        "ectoplasm":  { elem1: "steam", elem2: null, chance: 0.9 },
        "wraith":     { elem1: "steam", elem2: null, chance: 0.9 },
        "magic_fire": { elem1: "steam", elem2: null, chance: 0.6 },
        "fire":       { elem1: "steam", elem2: null },
        "ash":        { elem1: "water", elem2: "salt", chance: 0.05 },
    },
};

// ---------- Wraith ----------------------------------------------------
// A wandering ghost. Drifts upward like a gas and is banished by holy
// water or salt.
elements.wraith = {
    name: "wraith",
    color: ["#cfd5dc", "#a0a8b8", "#e8eef5"],
    behavior: behaviors.GAS,
    category: "life",
    state: "gas",
    density: 0.3,
    glow: true,
    temp: -5,
    reactions: {
        "holy_water": { elem1: null, elem2: "steam", chance: 0.9 },
        "salt":       { elem1: null, elem2: "salt", chance: 0.5 },
        "fire":       { elem1: null, elem2: null, chance: 0.5 },
        "magic_fire": { elem1: null, elem2: null, chance: 0.4 },
    },
    tick: function(pixel) {
        // small chance to phase / drift sideways
        if (Math.random() < 0.05) {
            const dx = (Math.random() < 0.5 ? -1 : 1);
            if (isEmpty(pixel.x + dx, pixel.y, false)) {
                deletePixel(pixel.x, pixel.y);
                createPixel("wraith", pixel.x + dx, pixel.y);
            }
        }
        // dissipates eventually
        if (Math.random() < 0.0015) deletePixel(pixel.x, pixel.y);
    },
};

// =====================================================================
// WEAPONS — throw or detonate. Most are powders that explode on heat.
// =====================================================================

// ---------- Mana Bomb -------------------------------------------------
// Throw it, set it alight → blast of magic fire.
elements.mana_bomb = {
    name: "mana bomb",
    color: ["#3a7bff", "#5ea0ff", "#7e5fff"],
    behavior: behaviors.POWDER,
    category: "weapons",
    state: "solid",
    density: 1400,
    hardness: 0.4,
    glow: true,
    burn: 100,
    burnTime: 3,
    burnInto: "magic_fire",
    reactions: {
        "fire":      { elem1: "magic_fire", elem2: null },
        "magic_fire":{ elem1: "magic_fire", elem2: null },
        "lightning": { elem1: "magic_fire", elem2: null },
        "lava":      { elem1: "magic_fire", elem2: null },
    },
    tick: function(pixel) {
        if (pixel.temp > 200 && Math.random() < 0.5) {
            if (typeof explodeAtPlus === "function") explodeAtPlus(pixel.x, pixel.y, 7, "magic_fire");
            else if (typeof explodeAt === "function") explodeAt(pixel.x, pixel.y, 7, "magic_fire");
            else deletePixel(pixel.x, pixel.y);
        }
    },
};

// ---------- Frost Grenade ---------------------------------------------
// Pale-blue powder that bursts into snow + ice on impact heat.
elements.frost_grenade = {
    name: "frost grenade",
    color: ["#a0d8ff", "#cfe8ff", "#7fb8e8"],
    behavior: behaviors.POWDER,
    category: "weapons",
    state: "solid",
    density: 1400,
    hardness: 0.4,
    glow: true,
    reactions: {
        "fire":       { elem1: "snow", elem2: null, chance: 0.8 },
        "lightning":  { elem1: "snow", elem2: null },
        "magic_fire": { elem1: "snow", elem2: null },
        "lava":       { elem1: "snow", elem2: "stone" },
    },
    tick: function(pixel) {
        if ((pixel.temp > 100) && Math.random() < 0.5) {
            if (typeof explodeAtPlus === "function") explodeAtPlus(pixel.x, pixel.y, 6, "snow");
            else if (typeof explodeAt === "function") explodeAt(pixel.x, pixel.y, 6, "snow");
            // chill the area
            for (let dx = -3; dx <= 3; dx++) for (let dy = -3; dy <= 3; dy++) {
                const p = pixelMap[pixel.x+dx] && pixelMap[pixel.x+dx][pixel.y+dy];
                if (p) p.temp -= 80;
            }
            deletePixel(pixel.x, pixel.y);
        }
    },
};

// ---------- Holy Grenade ----------------------------------------------
// Detonates into holy water and steam.
elements.holy_grenade = {
    name: "holy grenade",
    color: ["#fff5b8", "#fffae0", "#e8d870"],
    behavior: behaviors.POWDER,
    category: "weapons",
    state: "solid",
    density: 1500,
    hardness: 0.4,
    glow: true,
    reactions: {
        "fire":      { elem1: "holy_water", elem2: null, chance: 0.7 },
        "lightning": { elem1: "holy_water", elem2: null },
    },
    tick: function(pixel) {
        if (pixel.temp > 150 && Math.random() < 0.5) {
            if (typeof explodeAtPlus === "function") explodeAtPlus(pixel.x, pixel.y, 6, "holy_water");
            else if (typeof explodeAt === "function") explodeAt(pixel.x, pixel.y, 6, "holy_water");
            else deletePixel(pixel.x, pixel.y);
        }
    },
};

// ---------- Thunder Orb -----------------------------------------------
// Sturdy orb that releases lightning when struck or heated.
elements.thunder_orb = {
    name: "thunder orb",
    color: ["#fff080", "#fff8c0", "#dcc830"],
    behavior: behaviors.STURDYPOWDER,
    category: "weapons",
    state: "solid",
    density: 2000,
    hardness: 0.5,
    glow: true,
    conduct: 1.0,
    reactions: {
        "fire":       { elem1: "lightning", elem2: null },
        "magic_fire": { elem1: "lightning", elem2: null },
        "lightning":  { elem1: "lightning", elem2: null },
        "water":      { elem1: "lightning", elem2: "lightning", chance: 0.05 },
    },
    tick: function(pixel) {
        if (pixel.temp > 220 && Math.random() < 0.4) {
            // spray lightning around
            for (let i = 0; i < 8; i++) {
                const dx = Math.floor(Math.random() * 9) - 4;
                const dy = Math.floor(Math.random() * 9) - 4;
                if (isEmpty(pixel.x + dx, pixel.y + dy, false)) {
                    createPixel("lightning", pixel.x + dx, pixel.y + dy);
                }
            }
            deletePixel(pixel.x, pixel.y);
        }
    },
};

// ---------- Void Bomb -------------------------------------------------
// Deletes everything in a radius. Use with caution.
elements.void_bomb = {
    name: "void bomb",
    color: ["#1a0a2a", "#2a1040", "#3a1858"],
    behavior: behaviors.POWDER,
    category: "weapons",
    state: "solid",
    density: 2500,
    hardness: 0.6,
    reactions: {
        "fire":      { elem1: "void", elem2: null },
        "lightning": { elem1: "void", elem2: null },
    },
    tick: function(pixel) {
        if (pixel.temp > 200 && Math.random() < 0.5) {
            // void burst — delete in radius (skip self until end)
            const r = 6;
            for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) {
                if (dx === 0 && dy === 0) continue;
                if (dx*dx + dy*dy > r*r) continue;
                const p = pixelMap[pixel.x+dx] && pixelMap[pixel.x+dx][pixel.y+dy];
                if (p && Math.random() < 0.7) deletePixel(p.x, p.y);
            }
            deletePixel(pixel.x, pixel.y);
        }
    },
};

// ---------- Void ------------------------------------------------------
// Lingering after-effect — slowly consumes adjacent cells then fades.
elements.void = {
    name: "void",
    color: ["#1a0a2a", "#2a1040", "#0a0010"],
    behavior: behaviors.SUPPORTPOWDER,
    category: "energy",
    state: "solid",
    density: 0.2,
    glow: false,
    tick: function(pixel) {
        // eat 1 random neighbour each tick, ~20% chance
        if (Math.random() < 0.2) {
            const offsets = [[1,0],[-1,0],[0,1],[0,-1]];
            const [dx, dy] = offsets[Math.floor(Math.random() * 4)];
            const p = pixelMap[pixel.x+dx] && pixelMap[pixel.x+dx][pixel.y+dy];
            if (p && p.element !== "void" && p.element !== "philosopher_stone") {
                deletePixel(p.x, p.y);
            }
        }
        // dissipates after ~5s of life
        if (Math.random() < 0.02) deletePixel(pixel.x, pixel.y);
    },
};

// ---------- Fire Arrow ------------------------------------------------
// Lightweight flammable bolt. Falls down, then flares up on landing.
elements.fire_arrow = {
    name: "fire arrow",
    color: ["#cc4a1a", "#ff7a3a", "#a03010"],
    behavior: behaviors.POWDER,
    category: "weapons",
    state: "solid",
    density: 600,
    hardness: 0.2,
    burn: 100,
    burnTime: 12,
    burnInto: "fire",
    reactions: {
        "wood":  { elem1: "fire", elem2: "fire" },
        "plant": { elem1: "fire", elem2: "fire" },
        "cloth": { elem1: "fire", elem2: "fire" },
        "paper": { elem1: "fire", elem2: "fire" },
    },
    tick: function(pixel) {
        // ignite on impact: when something solid is below, ignite into fire
        const below = pixelMap[pixel.x] && pixelMap[pixel.x][pixel.y + 1];
        if (below && below.element !== "fire_arrow" && Math.random() < 0.05) {
            if (isEmpty(pixel.x, pixel.y - 1, false)) createPixel("fire", pixel.x, pixel.y - 1);
        }
    },
};

// ---------- Explosive Rune --------------------------------------------
// A wall that detonates when mana, lightning, or fire touches it.
elements.explosive_rune = {
    name: "explosive rune",
    color: ["#a02020", "#d04040", "#702010"],
    behavior: behaviors.WALL,
    category: "weapons",
    state: "solid",
    density: 2500,
    hardness: 0.7,
    glow: true,
    reactions: {
        "fire":      { elem1: "explosion", elem2: null },
        "lightning": { elem1: "explosion", elem2: null },
        "mana":      { elem1: "explosion", elem2: null },
        "magic_fire":{ elem1: "explosion", elem2: null },
    },
    tick: function(pixel) {
        if (pixel.temp > 180 && Math.random() < 0.3) {
            if (typeof explodeAtPlus === "function") explodeAtPlus(pixel.x, pixel.y, 8, "fire");
            else if (typeof explodeAt === "function") explodeAt(pixel.x, pixel.y, 8, "fire");
            else deletePixel(pixel.x, pixel.y);
        }
    },
};

// ---------- Arcane Grenade --------------------------------------------
// The flagship: arcane dust + magic fire combo blast.
elements.arcane_grenade = {
    name: "arcane grenade",
    color: ["#b58fff", "#7a3fff", "#d6a0ff"],
    behavior: behaviors.POWDER,
    category: "weapons",
    state: "solid",
    density: 1700,
    hardness: 0.5,
    glow: true,
    reactions: {
        "fire":      { elem1: "magic_fire", elem2: null, chance: 0.6 },
        "lightning": { elem1: "magic_fire", elem2: null },
        "mana":      { elem1: "magic_fire", elem2: null, chance: 0.5 },
    },
    tick: function(pixel) {
        if (pixel.temp > 180 && Math.random() < 0.4) {
            // double-burst: arcane dust then magic fire
            for (let i = 0; i < 12; i++) {
                const a = Math.random() * Math.PI * 2;
                const r = 1 + Math.random() * 5;
                const tx = pixel.x + Math.round(Math.cos(a) * r);
                const ty = pixel.y + Math.round(Math.sin(a) * r);
                if (isEmpty(tx, ty, false)) createPixel("arcane_dust", tx, ty);
            }
            if (typeof explodeAtPlus === "function") explodeAtPlus(pixel.x, pixel.y, 6, "magic_fire");
            else if (typeof explodeAt === "function") explodeAt(pixel.x, pixel.y, 6, "magic_fire");
            else deletePixel(pixel.x, pixel.y);
        }
    },
};

// =====================================================================
// One-off setup: log so the user knows the mod loaded.
// =====================================================================
console.log("[Magic & Alchemy] mod loaded — added 24 elements (10 magic, 6 more, 8 weapons)");
