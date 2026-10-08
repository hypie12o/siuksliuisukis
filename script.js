// ═══════════════════════════════════════════════
// FORCE UNIFIED FONT
// ═══════════════════════════════════════════════
(function () {
  const s = document.createElement("style");
  s.textContent = `
    *, *::before, *::after { font-family: 'Nunito', sans-serif !important; }
    .game-title, #level-title, .li-label, .li-go, .lu-title,
    .ach-title, .ach-li-title, .result-overlay h2,
    #achievements-modal h2, .level-up-popup .lu-title,
    .ach-section-header, #leaderboard-modal h2 { font-family: 'Fredoka One', cursive !important; }
  `;
  document.head.appendChild(s);
})();

// ═══════════════════════════════════════════════
// AUDIO
// ═══════════════════════════════════════════════
const bgMusic = document.getElementById("bg-music");
let musicState = parseInt(localStorage.getItem("musicState") ?? "2");
const MUSIC_VOL = [0, 0.11, 0.22];
const MUSIC_LBL = ["🔇 Muzika", "🔉 Muzika", "🔊 Muzika"];
if (bgMusic) bgMusic.volume = MUSIC_VOL[musicState];

function cycleMusicState() {
  musicState = (musicState + 1) % 3;
  localStorage.setItem("musicState", musicState);
  if (bgMusic) {
    bgMusic.volume = MUSIC_VOL[musicState];
    if (musicState === 0) bgMusic.pause();
    else bgMusic.play().catch(() => {});
  }
  document.querySelectorAll(".music-toggle-btn").forEach(b => { b.textContent = MUSIC_LBL[musicState]; });
}

function startMusic() {
  musicState = parseInt(localStorage.getItem("musicState") ?? "2");
  if (bgMusic) {
    bgMusic.volume = MUSIC_VOL[musicState];
    if (musicState > 0) bgMusic.play().catch(() => {});
  }
  document.querySelectorAll(".music-toggle-btn").forEach(b => { b.textContent = MUSIC_LBL[musicState]; });
}

// Click SFX
const clickSnd = new Audio("buttonclic1.mp3");
clickSnd.volume = 0.5; clickSnd.preload = "auto";
document.addEventListener("pointerdown", e => {
  const el = e.target;
  if (el.closest("button") || el.classList.contains("bin") || el.closest(".bin") || el.closest(".saved-user-chip")) {
    clickSnd.currentTime = 0; clickSnd.play().catch(() => {});
  }
}, { passive: true });

const introSound = new Audio("openingintro.wav");
introSound.preload = "auto";
window.addEventListener("load", () => { introSound.volume = 0.7; introSound.play().catch(() => {}); });

// ═══════════════════════════════════════════════
// STORAGE HELPERS — minimise JSON.parse calls
// ═══════════════════════════════════════════════
function getUsers() { return JSON.parse(localStorage.getItem("users") || "{}"); }
function saveUsers(users) { localStorage.setItem("users", JSON.stringify(users)); }
function saveCurrentUser() {
  const users = getUsers();
  users[currentUser.username] = currentUser;
  saveUsers(users);
}

// ═══════════════════════════════════════════════
// LOGIN / REGISTER
// ═══════════════════════════════════════════════
let currentUser = null;

const USER_DEFAULTS = {
  perfectGames: 0, totalCorrect: 0, maxCombo: 0,
  timedGames: 0, hardGames: 0, easyGames: 0, mediumGames: 0,
  achievements: {}, mistakesByType: {},
  _badStart: 0, _comebacks: 0, _closecall: 0,
  _earlyQuit: 0, _fastEasy: 0, _noComboGame: 0,
  _perfectTimed: 0, _streak3: 0, _rewindUsed: 0,
  _consecutivePerfect: 0,
  _nightOwl: 0, _morning: 0, _monday: 0,
  avatar: "🌿"
};

let _consecutivePerfect = 0;
let _thisGameCombo = 0;

function _applyUser(user) {
  currentUser = user;
  Object.keys(USER_DEFAULTS).forEach(k => { if (currentUser[k] == null) currentUser[k] = USER_DEFAULTS[k]; });
  _consecutivePerfect = currentUser._consecutivePerfect || 0;
  // Sync achievement done-flags from saved data — do NOT re-check conditions here
  achievements.forEach(a => { a.done = !!currentUser.achievements[a.id]; });
  document.getElementById("login-msg").textContent = "";
  updateXPBar();
  startMusic();
  switchScreen("start-screen");
}

function login() {
  const u = document.getElementById("usernameInput").value.trim();
  const msg = document.getElementById("login-msg");
  if (!u) { msg.textContent = "Įvesk vartotojo vardą"; return; }
  const users = getUsers();
  if (!users[u]) { msg.style.color = "#e74c3c"; msg.textContent = "❌ Vartotojas nerastas. Paspausk 'Registruotis'!"; return; }
  msg.style.color = ""; _applyUser(users[u]);
}

function register() {
  const u = document.getElementById("usernameInput").value.trim();
  const msg = document.getElementById("login-msg");
  if (!u) { msg.textContent = "Įvesk vartotojo vardą"; return; }
  if (u.length < 2) { msg.textContent = "Vardas per trumpas (min. 2 simboliai)"; return; }
  const users = getUsers();
  if (users[u]) { msg.style.color = "#f39c12"; msg.textContent = "⚠️ Toks vardas jau užimtas. Prisijungk!"; return; }
  const newUser = { username: u, xp: 0, games: 0, ...USER_DEFAULTS };
  users[u] = newUser; saveUsers(users); renderSavedUsers();
  msg.style.color = "#2ecc71"; msg.textContent = `✅ Paskyra „${u}" sukurta!`;
  setTimeout(() => { msg.textContent = ""; _applyUser(newUser); }, 700);
}

function renderSavedUsers() {
  const row = document.getElementById("saved-users-row");
  if (!row) return;
  const users = getUsers();
  const keys = Object.keys(users);
  row.innerHTML = "";
  if (!keys.length) return;
  const label = document.createElement("div");
  label.style.cssText = "font-size:11px;font-weight:700;color:rgba(255,255,255,0.35);letter-spacing:1px;width:100%;text-align:center;margin-bottom:2px;";
  label.textContent = "GREITAS PRISIJUNGIMAS"; row.appendChild(label);
  keys.forEach(u => {
    const chip = document.createElement("button"); chip.className = "saved-user-chip";
    chip.innerHTML = `${users[u].avatar || "🌿"} ${u} <span class="chip-xp">${users[u].xp} XP</span>`;
    chip.onclick = () => { document.getElementById("usernameInput").value = u; _applyUser(users[u]); };
    row.appendChild(chip);
  });
}
document.getElementById("usernameInput")?.addEventListener("keydown", e => { if (e.key === "Enter") login(); });
window.addEventListener("load", renderSavedUsers);

// ═══════════════════════════════════════════════
// AVATAR PICKER
// ═══════════════════════════════════════════════
const AVATAR_OPTIONS = [
  "🌿","🌱","🌲","🌳","🍀","🌸","🌻","🌺","🍃","🌊",
  "🦁","🐉","🦅","🦚","🐸","🦊","🐺","🦋","🐝","🐢",
  "♻️","🌍","🌏","🌎","⭐","🏆","💎","🔥","⚡","🎯"
];

function openAvatarPicker() {
  const existing = document.getElementById("avatar-picker-modal");
  if (existing) { existing.remove(); return; }
  const modal = document.createElement("div");
  modal.id = "avatar-picker-modal";
  modal.style.cssText = "position:fixed;inset:0;z-index:20000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.8);backdrop-filter:blur(6px);padding:16px;overflow-y:auto;";
  const box = document.createElement("div");
  box.style.cssText = "background:rgba(7,31,20,0.98);border:1px solid rgba(46,204,113,0.35);border-radius:24px;padding:22px 18px 18px;width:100%;max-width:320px;max-height:calc(100vh - 32px);overflow-y:auto;box-shadow:0 8px 40px rgba(0,0,0,0.7);display:flex;flex-direction:column;gap:14px;box-sizing:border-box;";
  box.addEventListener("click", e => e.stopPropagation());
  const title = document.createElement("div");
  title.style.cssText = "font-family:'Fredoka One',cursive;font-size:1.3rem;color:#2ecc71;text-align:center;";
  title.textContent = "✏️ Pasirink avatarą";
  const grid = document.createElement("div");
  grid.style.cssText = "display:grid;grid-template-columns:repeat(5,1fr);gap:7px;";
  AVATAR_OPTIONS.forEach(emoji => {
    const btn = document.createElement("button");
    const isCurrent = (currentUser.avatar || "🌿") === emoji;
    btn.style.cssText = `font-size:20px;aspect-ratio:1;width:100%;border-radius:12px;cursor:pointer;border:2px solid ${isCurrent ? "#2ecc71" : "rgba(255,255,255,0.1)"};background:${isCurrent ? "rgba(46,204,113,0.25)" : "rgba(255,255,255,0.04)"};transition:transform 0.15s;display:flex;align-items:center;justify-content:center;`;
    btn.textContent = emoji;
    btn.addEventListener("pointerenter", () => { btn.style.transform = "scale(1.18)"; });
    btn.addEventListener("pointerleave", () => { btn.style.transform = "scale(1)"; });
    btn.onclick = () => {
      currentUser.avatar = emoji;
      saveCurrentUser();
      document.querySelectorAll(".player-avatar").forEach(el => {
        const firstChild = el.childNodes[0];
        if (firstChild && firstChild.nodeType === Node.TEXT_NODE) firstChild.textContent = emoji;
      });
      const avatarEmoji = document.getElementById("player-avatar-el");
      if (avatarEmoji) {
        const tn = avatarEmoji.childNodes[0];
        if (tn && tn.nodeType === Node.TEXT_NODE) tn.textContent = emoji;
      }
      renderSavedUsers();
      modal.remove();
    };
    grid.appendChild(btn);
  });
  const cancelBtn = document.createElement("button");
  cancelBtn.style.cssText = "width:100%;padding:10px;border-radius:12px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.6);font-weight:800;font-size:14px;cursor:pointer;";
  cancelBtn.textContent = "✖ Atšaukti";
  cancelBtn.onclick = () => modal.remove();
  box.appendChild(title); box.appendChild(grid); box.appendChild(cancelBtn);
  modal.appendChild(box);
  modal.addEventListener("click", () => modal.remove());
  document.body.appendChild(modal);
}

// ═══════════════════════════════════════════════
// XP LEVEL SYSTEM
// ═══════════════════════════════════════════════
const levelsXP = [
  { level: 1,  name: "Pradinukas",               xp: 0      },
  { level: 2,  name: "Pradedantysis",            xp: 80     },
  { level: 3,  name: "Žingeidus žaidėjas",       xp: 200    },
  { level: 4,  name: "Šiukšlių draugas",         xp: 380    },
  { level: 5,  name: "Rūšiuotojas",              xp: 620    },
  { level: 6,  name: "Žaliasis pilietis",        xp: 940    },
  { level: 7,  name: "Aplinkos bičiulis",        xp: 1360   },
  { level: 8,  name: "Eko entuziastas",          xp: 1900   },
  { level: 9,  name: "Patyręs rūšiuotojas",      xp: 2580   },
  { level: 10, name: "Tikslus rūšiuotojas",      xp: 3420   },
  { level: 11, name: "Žaliasis gynėjas",         xp: 4450   },
  { level: 12, name: "Skilled Recycler",         xp: 5700   },
  { level: 13, name: "Expert Recycler",          xp: 7200   },
  { level: 14, name: "Šiukšlių ekspertas",       xp: 9000   },
  { level: 15, name: "Master Recycler",          xp: 11200  },
  { level: 16, name: "Eco Hero",                 xp: 13800  },
  { level: 17, name: "Planet Saver",             xp: 16900  },
  { level: 18, name: "Trash Destroyer",          xp: 20500  },
  { level: 19, name: "Eco Warrior",              xp: 24800  },
  { level: 20, name: "Ultimate Recycler",        xp: 29900  },
  { level: 21, name: "Eco Legend",               xp: 35800  },
  { level: 22, name: "Green Ninja",              xp: 42800  },
  { level: 23, name: "Eco Mastermind",           xp: 51100  },
  { level: 24, name: "Žaliasis titanas",         xp: 60800  },
  { level: 25, name: "Eko valdovas",             xp: 72200  },
  { level: 26, name: "Planetary Guardian",       xp: 85600  },
  { level: 27, name: "Supreme Recycler",         xp: 101400 },
  { level: 28, name: "Eco Overlord",             xp: 119900 },
  { level: 29, name: "Legendary Eco God",        xp: 141500 },
  { level: 30, name: "Geriausias rūšiuotojas",   xp: 166500 },
];

function getCurrentLevel(xp) {
  const x = xp != null ? xp : currentUser.xp;
  return levelsXP.filter(l => l.xp <= x).pop() || levelsXP[0];
}

// ═══════════════════════════════════════════════
// LEVEL CONFIG
// ═══════════════════════════════════════════════
const levelConfig = {
  easy:   { plastic: 4, paper: 4, organic: 4, electronics: 2, glass: 3 },
  medium: { plastic: 5, paper: 5, organic: 4, electronics: 3, glass: 4 },
  hard:   { plastic: 6, paper: 5, organic: 5, electronics: 4, glass: 5, bulky: 7 },
  timed:  { plastic: 6, paper: 5, organic: 5, electronics: 4, glass: 5, bulky: 7 }
};
const XP_VALUES  = { easy: 4, medium: 8, hard: 14, timed: 12 };
const XP_PENALTY = { easy: 1, medium: 3, hard: 6,  timed: 5  };
const LEVEL_INTRO = {
  easy:   { emoji: "🌱", label: "LENGVAS",  sub: "Pradedančiajam tinkamas lygis!", color1: "#27ae60", color2: "#1e8449", glow: "rgba(46,204,113,0.8)"  },
  medium: { emoji: "⚡", label: "VIDUTINIS", sub: "Išbandyk savo jėgas!",           color1: "#f39c12", color2: "#ca7d0a", glow: "rgba(243,156,18,0.8)"  },
  hard:   { emoji: "💀", label: "SUNKUS",   sub: "Tik stipriausiems rūšiuotojams!", color1: "#e74c3c", color2: "#a93226", glow: "rgba(231,76,60,0.85)"  },
  timed:  { emoji: "💨", label: "LAIKINAS", sub: "60 sekundžių — kiek gali?",       color1: "#8e44ad", color2: "#5b2c6f", glow: "rgba(142,68,173,0.85)" }
};

// ═══════════════════════════════════════════════
// ACHIEVEMENTS
//
// DESIGN RULES (fixes the "5 achievements on login" bug):
//
// 1. check() is ONLY called inside finishGame() after stats are updated.
//    It is NEVER called on login/register.
//
// 2. Every achievement that counts a cumulative stat uses a THRESHOLD that
//    requires meaningful play. "first_game" requires games >= 1, which means
//    you only unlock it after finishing your first game — not before.
//
// 3. Game-session achievements (combo, perfect, speed, etc.) use per-game
//    variables (_thisGameCombo, _gameWasPerfect, etc.) that are reset at
//    the start of each game. They NEVER look at all-time stats.
//
// 4. The "gameWasComplete" gate ensures achievements only fire when the
//    player genuinely finished (sorted all items or timed out with >50%).
// ═══════════════════════════════════════════════
const achievements = [
  // ─── BRONZE ───
  { id: "first_game",   icon: "🌱", title: "Pirmasis žingsnis",       desc: "Sužaisk pirmą žaidimą.",                                     rarity: "bronze", done: false, check: () => currentUser.games >= 1 },
  { id: "xp_500",       icon: "💚", title: "XP rinktinys",            desc: "Surink 500 XP.",                                             rarity: "bronze", done: false, check: () => currentUser.xp >= 500 },
  { id: "cor_50",       icon: "♻️", title: "Rūšiuotojas-naujokas",    desc: "Teisingai rūšiuok 50 daiktų.",                               rarity: "bronze", done: false, check: () => currentUser.totalCorrect >= 50 },
  { id: "cor_100",      icon: "🥬", title: "Žaliasis pradedantysis",  desc: "Teisingai rūšiuok 100 daiktų.",                              rarity: "bronze", done: false, check: () => currentUser.totalCorrect >= 100 },
  // combo_5: uses THIS game's combo — never fires just from logging in
  { id: "perfect_1",    icon: "⭐", title: "Puikus rezultatas",       desc: "Baik žaidimą visiškai be klaidų.",                           rarity: "bronze", done: false, check: () => currentUser.perfectGames >= 1 },
  { id: "easy_5",       icon: "🍀", title: "Lengvų kelias",           desc: "Sužaisk 5 lengvus žaidimus.",                                rarity: "bronze", done: false, check: () => (currentUser.easyGames || 0) >= 5 },
  { id: "medium_first", icon: "⚡", title: "Vidutinis startas",       desc: "Sužaisk pirmą vidutinį žaidimą.",                            rarity: "bronze", done: false, check: () => (currentUser.mediumGames || 0) >= 1 },
  { id: "hard_first",   icon: "😬", title: "Pirmasis iššūkis",        desc: "Sužaisk bent vieną sunkų žaidimą.",                          rarity: "bronze", done: false, check: () => (currentUser.hardGames || 0) >= 1 },
  { id: "timed_first",  icon: "⏳", title: "Laikrodis pradėtas",      desc: "Sužaisk laikiną žaidimą.",                                   rarity: "bronze", done: false, check: () => (currentUser.timedGames || 0) >= 1 },
  { id: "night_owl",    icon: "🦉", title: "Naktinis rūšiuotojas",    desc: "Sužaisk po 22:00 vakaro.",                                   rarity: "bronze", done: false, check: () => (currentUser._nightOwl || 0) >= 1 },
  { id: "morning",      icon: "🌅", title: "Ryto rūšiuotojas",        desc: "Sužaisk iki 8:00 ryto.",                                     rarity: "bronze", done: false, check: () => (currentUser._morning || 0) >= 1 },
  { id: "bad_start",    icon: "🙈", title: "Blogos pradžios meistras",desc: "Padaryk klaidą su pirmuoju daiktu.",                         rarity: "bronze", done: false, check: () => (currentUser._badStart || 0) >= 1 },
  { id: "early_quit",   icon: "🚪", title: "Svarbu pabandyti",        desc: "Baik laikiną žaidimą surūšiavęs mažiau nei pusę daiktų.",    rarity: "bronze", done: false, check: () => (currentUser._earlyQuit || 0) >= 1 },
  { id: "no_combo",     icon: "🐢", title: "Lėtasis rūšiuotojas",     desc: "Baik žaidimą nesukaupęs nė 2 combo iš eilės.",              rarity: "bronze", done: false, check: () => (currentUser._noComboGame || 0) >= 1 },
  { id: "lv5",          icon: "🐣", title: "Pirmieji sparnai",        desc: "Pasiek 5 lygį.",                                             rarity: "bronze", done: false, check: () => getCurrentLevel().level >= 5 },
  { id: "rewind_3",     icon: "⏪", title: "Atsargus rūšiuotojas",    desc: "Naudok 'Ankstesnė' mygtuką 3 kartus iš viso.",               rarity: "bronze", done: false, check: () => (currentUser._rewindUsed || 0) >= 3 },
  { id: "monday",       icon: "📅", title: "Pirmadienio rūšiuotojas", desc: "Sužaisk žaidimą pirmadienį.",                                rarity: "bronze", done: false, check: () => (currentUser._monday || 0) >= 1 },

  // ─── SILVER ───
  { id: "twenty_games",    icon: "🕹️", title: "Žaidimų maniakas",          desc: "Sužaisk 20 žaidimų.",                                     rarity: "silver", done: false, check: () => currentUser.games >= 20 },
  { id: "thirty_games",    icon: "🎯", title: "30 žaidimų riba",            desc: "Sužaisk 30 žaidimų.",                                     rarity: "silver", done: false, check: () => currentUser.games >= 30 },
  { id: "xp_1000",         icon: "💛", title: "XP tūkstantis",              desc: "Surink 1000 XP.",                                         rarity: "silver", done: false, check: () => currentUser.xp >= 1000 },
  { id: "xp_3000",         icon: "🧡", title: "XP kolekcionierius",         desc: "Surink 3000 XP.",                                         rarity: "silver", done: false, check: () => currentUser.xp >= 3000 },
  { id: "xp_7000",         icon: "🔶", title: "XP ekspertas",               desc: "Surink 7000 XP.",                                         rarity: "silver", done: false, check: () => currentUser.xp >= 7000 },
  { id: "cor_200",         icon: "🌿", title: "Žalias pilietis",            desc: "Teisingai rūšiuok 200 daiktų.",                           rarity: "silver", done: false, check: () => currentUser.totalCorrect >= 200 },
  { id: "cor_400",         icon: "🌍", title: "Planetos gynėjas",           desc: "Teisingai rūšiuok 400 daiktų.",                           rarity: "silver", done: false, check: () => currentUser.totalCorrect >= 400 },
  { id: "perfect_3",       icon: "🌟", title: "Tikslumas — įprotis",        desc: "Baik 3 žaidimus be klaidų.",                              rarity: "silver", done: false, check: () => currentUser.perfectGames >= 3 },
  { id: "perfect_7",       icon: "💫", title: "Septyni tobuli",             desc: "Baik 7 žaidimus be klaidų.",                              rarity: "silver", done: false, check: () => currentUser.perfectGames >= 7 },
  { id: "hard_3",          icon: "💪", title: "Drąsuolis",                  desc: "Baik 3 sunkius žaidimus.",                                rarity: "silver", done: false, check: () => (currentUser.hardGames || 0) >= 3 },
  { id: "hard_7",          icon: "🦾", title: "Geležinis rūšiuotojas",      desc: "Baik 7 sunkius žaidimus.",                                rarity: "silver", done: false, check: () => (currentUser.hardGames || 0) >= 7 },
  { id: "timed_3",         icon: "⏱️", title: "Laiko valdovas",             desc: "Baik 3 laikinių žaidimų.",                                rarity: "silver", done: false, check: () => (currentUser.timedGames || 0) >= 3 },
  { id: "timed_7",         icon: "⏰", title: "Laikrodžio draugas",         desc: "Baik 7 laikinių žaidimų.",                                rarity: "silver", done: false, check: () => (currentUser.timedGames || 0) >= 7 },
  { id: "medium_5",        icon: "🌤️", title: "Vidutinis kovotojas",        desc: "Sužaisk 5 vidutinius žaidimus.",                          rarity: "silver", done: false, check: () => (currentUser.mediumGames || 0) >= 5 },
  { id: "medium_15",       icon: "⛈️", title: "Vidutinis strategas",        desc: "Sužaisk 15 vidutinių žaidimų.",                           rarity: "silver", done: false, check: () => (currentUser.mediumGames || 0) >= 15 },
  { id: "comeback",        icon: "🦸", title: "Didysis sugrįžimas",         desc: "Padaryk 3+ klaidų ir vis tiek gauk >80%.",                rarity: "silver", done: false, check: () => (currentUser._comebacks || 0) >= 1 },
  { id: "close_call",      icon: "😅", title: "Vos nespėjau!",              desc: "Baik laikiną žaidimą likus ≤3 sekundėms.",                rarity: "silver", done: false, check: () => (currentUser._closecall || 0) >= 1 },
  { id: "speed_easy",      icon: "🏃", title: "Greituolis",                 desc: "Sužaisk lengvą žaidimą per <30 sekundžių.",               rarity: "silver", done: false, check: () => (currentUser._fastEasy || 0) >= 1 },
  { id: "lv8",             icon: "🦅", title: "Aukštyn kyla",               desc: "Pasiek 8 lygį.",                                          rarity: "silver", done: false, check: () => getCurrentLevel().level >= 8 },
  { id: "lv12",            icon: "🦚", title: "Dvyliktasis lygis",          desc: "Pasiek 12 lygį.",                                         rarity: "silver", done: false, check: () => getCurrentLevel().level >= 12 },
  { id: "eco_warrior",     icon: "🌳", title: "Miško gynėjas",              desc: "Surink 300 teisingų iš viso.",                            rarity: "silver", done: false, check: () => currentUser.totalCorrect >= 300 },
  { id: "all_levels",      icon: "🌈", title: "Visų kelių žinovas",         desc: "Sužaisk visus 4 lygio tipus bent po kartą.",              rarity: "silver", done: false, check: () => (currentUser.easyGames||0)>=1&&(currentUser.mediumGames||0)>=1&&(currentUser.hardGames||0)>=1&&(currentUser.timedGames||0)>=1 },
  { id: "easy_15",         icon: "☘️", title: "Lengvų kelias II",           desc: "Sužaisk 15 lengvų žaidimų.",                              rarity: "silver", done: false, check: () => (currentUser.easyGames || 0) >= 15 },
  { id: "timed_perfect_1", icon: "🌠", title: "Tobulas laikininkas",        desc: "Baik laikiną žaidimą be klaidų.",                         rarity: "silver", done: false, check: () => (currentUser._perfectTimed || 0) >= 1 },
  { id: "rewind_15",       icon: "⏮️", title: "Korektinius meistras",       desc: "Naudok 'Ankstesnė' mygtuką 15 kartų iš viso.",            rarity: "silver", done: false, check: () => (currentUser._rewindUsed || 0) >= 15 },
  { id: "all_bronze",      icon: "🥉", title: "Bronzos kolekcija",          desc: "Atrak visus bronzinius pasiekimus.",                       rarity: "silver", done: false, check: () => achievements.filter(a => a.rarity === "bronze").every(a => a.done) },

  // ─── GOLD ───
  { id: "fifty_games",     icon: "👾", title: "Nepailstantis rūšiuotojas",  desc: "Sužaisk 50 žaidimų.",                                     rarity: "gold", done: false, check: () => currentUser.games >= 50 },
  { id: "seventy_games",   icon: "🎭", title: "70 žaidimų legenda",         desc: "Sužaisk 70 žaidimų.",                                     rarity: "gold", done: false, check: () => currentUser.games >= 70 },
  { id: "xp_12000",        icon: "🏅", title: "XP meistras",                desc: "Surink 12 000 XP.",                                       rarity: "gold", done: false, check: () => currentUser.xp >= 12000 },
  { id: "xp_25000",        icon: "🎖️", title: "XP grandas",                 desc: "Surink 25 000 XP.",                                       rarity: "gold", done: false, check: () => currentUser.xp >= 25000 },
  { id: "xp_50000",        icon: "🔮", title: "XP archyvas",                desc: "Surink 50 000 XP.",                                       rarity: "gold", done: false, check: () => currentUser.xp >= 50000 },
  { id: "cor_600",         icon: "🌊", title: "Vandenyno sergėtojas",       desc: "Teisingai rūšiuok 600 daiktų.",                           rarity: "gold", done: false, check: () => currentUser.totalCorrect >= 600 },
  { id: "cor_1000",        icon: "🌏", title: "Tūkstantis teisingų",        desc: "Teisingai rūšiuok 1000 daiktų.",                          rarity: "gold", done: false, check: () => currentUser.totalCorrect >= 1000 },
  { id: "cor_2000",        icon: "🌐", title: "Dviejų tūkstančių herojus",  desc: "Teisingai rūšiuok 2000 daiktų.",                          rarity: "gold", done: false, check: () => currentUser.totalCorrect >= 2000 },
  { id: "combo_15",        icon: "🌪️", title: "Kombo tornadas",             desc: "Pasiek 15 combo iš eilės.",                               rarity: "gold", done: false, check: () => _thisGameCombo >= 15 },
  { id: "combo_20",        icon: "☄️", title: "Kombo meteoras",             desc: "Pasiek 20 combo iš eilės.",                               rarity: "gold", done: false, check: () => _thisGameCombo >= 20 },
  { id: "perfect_10",      icon: "💫", title: "Tobulybės meistras",         desc: "Baik 10 žaidimų be klaidų.",                              rarity: "gold", done: false, check: () => currentUser.perfectGames >= 10 },
  { id: "perfect_20",      icon: "🌟", title: "Tobulybės legionas",         desc: "Baik 20 žaidimų be klaidų.",                              rarity: "gold", done: false, check: () => currentUser.perfectGames >= 20 },
  { id: "streak_3",        icon: "🎯", title: "Tobulų serija",              desc: "Laimėk 3 tobulus žaidimus iš eilės.",                     rarity: "gold", done: false, check: () => (currentUser._streak3 || 0) >= 3 },
  { id: "hard_15",         icon: "🧱", title: "Geležinis žaidėjas",         desc: "Baik 15 sunkių žaidimų.",                                 rarity: "gold", done: false, check: () => (currentUser.hardGames || 0) >= 15 },
  { id: "hard_25",         icon: "🏔️", title: "Kalnų nugalėtojas",          desc: "Baik 25 sunkius žaidimus.",                               rarity: "gold", done: false, check: () => (currentUser.hardGames || 0) >= 25 },
  { id: "timed_15",        icon: "⏲️", title: "Chronometro meistras",       desc: "Baik 15 laikinių žaidimų.",                               rarity: "gold", done: false, check: () => (currentUser.timedGames || 0) >= 15 },
  { id: "lv15",            icon: "🦁", title: "Penkioliktasis lygis",       desc: "Pasiek 15 lygį.",                                         rarity: "gold", done: false, check: () => getCurrentLevel().level >= 15 },
  { id: "lv20",            icon: "🐉", title: "Dvidešimtasis lygis",        desc: "Pasiek 20 lygį.",                                         rarity: "gold", done: false, check: () => getCurrentLevel().level >= 20 },
  { id: "comeback_3",      icon: "🦸", title: "Trijų sugrįžimų herojus",    desc: "Pasiek 'Didžiojo sugrįžimo' pasiekimą 3 kartus.",         rarity: "gold", done: false, check: () => (currentUser._comebacks || 0) >= 3 },
  { id: "speed_5",         icon: "⚡", title: "Nuolatinis greituolis",      desc: "Sužaisk 5 lengvus žaidimus per <30 sek.",                  rarity: "gold", done: false, check: () => (currentUser._fastEasy || 0) >= 5 },
  { id: "close_call_3",    icon: "😰", title: "Tris kartus vos!",           desc: "Baik laikiną žaidimą likus ≤3 sek. tris kartus.",         rarity: "gold", done: false, check: () => (currentUser._closecall || 0) >= 3 },
  { id: "easy_25",         icon: "🌻", title: "Lengvas kelias III",          desc: "Sužaisk 25 lengvus žaidimus.",                            rarity: "gold", done: false, check: () => (currentUser.easyGames || 0) >= 25 },
  { id: "medium_25",       icon: "🌤️", title: "Vidutiniokas pro",           desc: "Sužaisk 25 vidutinius žaidimus.",                         rarity: "gold", done: false, check: () => (currentUser.mediumGames || 0) >= 25 },
  { id: "timed_perfect_5", icon: "🏆", title: "Penkis kartus tobulas",      desc: "Baik laikiną žaidimą be klaidų 5 kartus.",                rarity: "gold", done: false, check: () => (currentUser._perfectTimed || 0) >= 5 },
  { id: "eco_champion",    icon: "🌱", title: "Ekologinis čempionas",       desc: "Baik tobulai visus 4 lygius bent po kartą.",              rarity: "gold", done: false, check: () => (currentUser.easyGames||0)>=1&&(currentUser.mediumGames||0)>=1&&(currentUser.hardGames||0)>=1&&(currentUser.timedGames||0)>=1&&currentUser.perfectGames>=4 },
  { id: "all_silver",      icon: "🥈", title: "Sidabro spindesys",          desc: "Atrak visus sidabrinius pasiekimus.",                      rarity: "gold", done: false, check: () => achievements.filter(a => a.rarity === "silver" && a.id !== "all_silver").every(a => a.done) },
  { id: "three_quarters",  icon: "🎪", title: "75 pasiekimų",               desc: "Atrak 75 pasiekimus.",                                    rarity: "gold", done: false, check: () => achievements.filter(a => a.done && a.rarity !== "secret").length >= 75 },

  // ─── LEGENDARY ───
  { id: "hundred_games",  icon: "🤖", title: "Rūšiavimo robotas",           desc: "Sužaisk 100 žaidimų.",                                    rarity: "legendary", done: false, check: () => currentUser.games >= 100 },
  { id: "hundredfifty",   icon: "🌀", title: "Pusantro šimto",              desc: "Sužaisk 150 žaidimų.",                                    rarity: "legendary", done: false, check: () => currentUser.games >= 150 },
  { id: "twohundred",     icon: "🔮", title: "Dvi šimtai žaidimų",          desc: "Sužaisk 200 žaidimų.",                                    rarity: "legendary", done: false, check: () => currentUser.games >= 200 },
  { id: "xp_80000",       icon: "💎", title: "XP dievas",                   desc: "Surink 80 000 XP.",                                       rarity: "legendary", done: false, check: () => currentUser.xp >= 80000 },
  { id: "xp_max",         icon: "🌌", title: "XP absoliutas",               desc: "Surink 166 500 XP — aukščiausias lygis.",                 rarity: "legendary", done: false, check: () => currentUser.xp >= 166500 },
  { id: "cor_3000",       icon: "🏆", title: "Trijų tūkstančių legenda",    desc: "Teisingai rūšiuok 3000 daiktų.",                          rarity: "legendary", done: false, check: () => currentUser.totalCorrect >= 3000 },
  { id: "cor_5000",       icon: "🌠", title: "Penkių tūkstančių titanas",   desc: "Teisingai rūšiuok 5000 daiktų.",                          rarity: "legendary", done: false, check: () => currentUser.totalCorrect >= 5000 },
  { id: "perfect_30",     icon: "✨", title: "Neklystantis orakulas",        desc: "Baik 30 žaidimų be klaidų.",                              rarity: "legendary", done: false, check: () => currentUser.perfectGames >= 30 },
  { id: "perfect_50",     icon: "🌌", title: "Tobulybės Dievas",             desc: "Baik 50 žaidimų be klaidų.",                              rarity: "legendary", done: false, check: () => currentUser.perfectGames >= 50 },
  { id: "streak_10",      icon: "🔥", title: "Dešimties tobulų serija",      desc: "Laimėk 10 tobulų žaidimų iš eilės.",                     rarity: "legendary", done: false, check: () => (currentUser._streak3 || 0) >= 10 },
  { id: "lv25",           icon: "👑", title: "Sidabrinis žvaigždynas",       desc: "Pasiek 25 lygį.",                                         rarity: "legendary", done: false, check: () => getCurrentLevel().level >= 25 },
  { id: "lv30",           icon: "🌟", title: "Rūšiavimo karalius",           desc: "Pasiek 30 — aukščiausią — lygį.",                        rarity: "legendary", done: false, check: () => getCurrentLevel().level >= 30 },
  { id: "hard_50",        icon: "💀", title: "Nesunaikinamas",               desc: "Baik 50 sunkių žaidimų.",                                 rarity: "legendary", done: false, check: () => (currentUser.hardGames || 0) >= 50 },
  { id: "timed_30",       icon: "⏰", title: "Laikrodžio dievas",            desc: "Baik 30 laikinių žaidimų.",                               rarity: "legendary", done: false, check: () => (currentUser.timedGames || 0) >= 30 },
  { id: "all_gold",       icon: "🥇", title: "Aukso kolekcija",              desc: "Atrak visus auksinius pasiekimus.",                       rarity: "legendary", done: false, check: () => achievements.filter(a => a.rarity === "gold" && a.id !== "all_gold").every(a => a.done) },
  { id: "done_80",        icon: "🎖️", title: "Absoliutus kolekcionierius",   desc: "Atrak 80 pasiekimų.",                                     rarity: "legendary", done: false, check: () => achievements.filter(a => a.done && a.rarity !== "secret").length >= 80 },
  { id: "all_legendary",  icon: "💫", title: "Legendų legenda",              desc: "Atrak visus legendinius pasiekimus.",                     rarity: "legendary", done: false, check: () => achievements.filter(a => a.rarity === "legendary" && a.id !== "all_legendary").every(a => a.done) },
  { id: "eco_god",        icon: "🌍", title: "Planetos Sargas",              desc: "Atrak visus bronzos, sidabro ir aukso pasiekimus.",       rarity: "legendary", done: false, check: () => ["bronze","silver","gold"].every(r => achievements.filter(a => a.rarity === r).every(a => a.done)) },

  // ─── SECRET ───
  { id: "secret_omega",   icon: "🌑", title: "???", desc: "Niekas nežino šio pasiekimo. Gal tu esi išrinktasis?", rarity: "secret", done: false,
    check: () => currentUser.perfectGames >= 5 && (currentUser._streak3 || 0) >= 5 && (currentUser.hardGames || 0) >= 20 && currentUser.maxCombo >= 20 },
  { id: "secret_void",    icon: "❓", title: "???", desc: "Šio pasiekimo niekas dar neatrakino. Ar sugebėsi?", rarity: "secret", done: false,
    check: () => getCurrentLevel().level >= 28 && currentUser.totalCorrect >= 2500 && (currentUser._perfectTimed || 0) >= 3 && (currentUser._comebacks || 0) >= 5 },
];

const RARITY = {
  bronze:    { label: "Bronza",     color: "#cd7f32", glow: "rgba(205,127,50,0.65)",  bg: "linear-gradient(135deg,#3d2200,#6b3a0f)" },
  silver:    { label: "Sidabras",   color: "#c0c0c0", glow: "rgba(192,192,192,0.65)", bg: "linear-gradient(135deg,#1a1a2e,#2d2d4a)" },
  gold:      { label: "Auksas",     color: "#ffd700", glow: "rgba(255,215,0,0.75)",   bg: "linear-gradient(135deg,#2d1f00,#5a3e00)" },
  legendary: { label: "Legendinis", color: "#e040fb", glow: "rgba(224,64,251,0.8)",   bg: "linear-gradient(135deg,#1a0030,#3d0060)" },
  secret:    { label: "SLAPTASIS",  color: "#00f5ff", glow: "rgba(0,245,255,0.9)",    bg: "linear-gradient(135deg,#001a20,#002a35)" }
};

// ═══════════════════════════════════════════════
// TRASH POOL
// ═══════════════════════════════════════════════
const trashPool = {
  plastic: [
    { img: "https://allcitycandy.com/cdn/shop/products/a5214c3a-8860-4d09-aab4-70524e7a0921.8ccd57d5e98c67f93544c8a059fe15b9.jpg?v=1632837195" },
    { img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTs6MhcP0Mxb9Ajpv2FeDip5hUE-IWXQhOGgg&s" },
    { img: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Bubble_Tea.png/250px-Bubble_Tea.png" },
    { img: "https://5.imimg.com/data5/CJ/LM/MM/SELLER-47837534/plastic-tooth-brush.jpg" },
    { img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ8FCI0y3SitqsC_002OuIWoEnsmZlkorg3ew&s" },
    { img: "https://bellroy-product-images.imgix.net//bellroy_dot_com_gallery_image/USD/PCXE-GRA-107/0" }
  ],
  paper: [
    { img: "https://static.vecteezy.com/system/resources/thumbnails/011/643/706/small/business-newspaper-isolated-on-white-background-daily-newspaper-mock-up-concept-photo.jpg" },
    { img: "https://previews.123rf.com/images/picsfive/picsfive2001/picsfive200100352/138798063-close-up-of-a-paper-ball-trash-on-white-background.jpg" },
    { img: "https://sugarpaper.com/cdn/shop/files/NBK75_LargeSpiralNotebook_Black_Cover.jpg" },
    { img: "https://images.squarespace-cdn.com/content/v1/5d3178f5c443690001caace9/1678859744004-BOMG3CF0079ZV2LIDL3P/KB-PA-3030" },
    { img: "https://m.media-amazon.com/images/I/51zMzLXAsqL.jpg" }
  ],
  organic: [
    { img: "https://preview.free3d.com/img/2015/05/1876171187512411691/jvskip50.jpg" },
    { img: "https://koro.imgix.net/media/6a/02/4f/1653292044/KAUGU_001-02.jpg?w=3000&auto=format,compress&fit=max&cs=srgb" },
    { img: "https://media.istockphoto.com/id/146805514/photo/banana-skin.jpg?s=612x612&w=0&k=20&c=yJwjbj8l671Y8WGeASM-1vnZ1HRsKLoVmtJk2IeY3DA=" },
    { img: "https://thumbs.dreamstime.com/b/eaten-apple-close-up-white-background-isolated-136817997.jpg" },
    { img: "https://www.allthatgrows.in/cdn/shop/products/Carrot-Orange.jpg?v=1598079671" }
  ],
  electronics: [
    { img: "https://m.media-amazon.com/images/I/61XmhmEup8L._AC_SL1000_.jpg" },
    { img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ1MwkxMbU7_tkvqCdounLlr1PXcBf3KtaGhA&s" },
    { img: "https://cdn11.bigcommerce.com/s-8vy557m296/images/stencil/original/products/342/4555/30_SMC2266KS_3QR_WEB__24717.1740693309.JPG?c=2" },
    { img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTNXYd0YUfVx-BWvb_xD9ujC12ox6TDOapCyQ&s" }
  ],
  glass: [
    { img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSzZiPvFfBG7weiFsq_iHn-blyoyU6Uff92EQ&s" },
    { img: "https://assets.manufactum.de/p/067/067835/67835_01.jpg/drinking-glass-jus.jpg" },
    { img: "https://cdn11.bigcommerce.com/s-xizoo/images/stencil/original/products/1042/4014/ECO12GB__23886.1707332829.jpg" },
    { img: "https://media.royaldesign.co.uk/6/spiegelau-salute-red-wine-glass-set-of-4-55-cl-13?w=800&quality=80" },
    { img: "https://cdn.pixabay.com/photo/2017/06/15/23/56/mirror-frame-2407292_640.png" },
    { img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTxLoLS9gof52cqQ9pAv28_rQ-iA9EdDI3kYQ&s" }
  ],
  bulky: [
    { img: "https://5.imimg.com/data5/FW/FG/MY-20864985/car-rear-bumper-500x500.jpg" },
    { img: "https://primaline.eu/wp-content/uploads/2025/08/europal-e1754981395149.jpg" },
    { img: "https://www.baldinis.lt/image/cache/catalog/Spintos/IMG_20220225_102459_1-1200x1111.jpg" },
    { img: "https://www.pirtims.lt/wp-content/uploads/2025/04/langas-pirciai.jpg" },
    { img: "https://www.alsoda.lt/images/uploader/pa/padanga-20x1000-10-1.jpg" },
    { img: "https://weld.lt/media/products/GX200UT2SXE5OH_1.jpg" },
    { img: "https://images.kaina24.lt/5909/67/kompiuterio-korpusas-darkflash-ds900-baltas.jpg" }
  ]
};

const bins = [
  { name: "🛢 Plastikas",       type: "plastic"     },
  { name: "📰 Popierius",       type: "paper"       },
  { name: "🥦 Organinės",       type: "organic"     },
  { name: "🔌 Elektronika",     type: "electronics" },
  { name: "🍾 Stiklas",         type: "glass"       },
  { name: "🛋 Didžiagabaritės", type: "bulky"       }
];

// ═══════════════════════════════════════════════
// GAME STATE
// ═══════════════════════════════════════════════
let trashItems      = [];
let currentIndex    = 0;
let correct         = 0;
let mistakes        = [];
let timerInterval   = null;
let combo           = 0;
let comboMultiplier = 1;
let currentLevel    = null;
let gameStartTime   = null;

// ═══════════════════════════════════════════════
// XP BAR
// ═══════════════════════════════════════════════
function _calcXPBar(xp) {
  const cur  = levelsXP.filter(l => l.xp <= xp).pop() || levelsXP[0];
  const idx  = levelsXP.findIndex(l => l.level === cur.level);
  const next = levelsXP[idx + 1] || cur;
  const range  = next.xp - cur.xp || 1;
  const earned = xp - cur.xp;
  const pct    = Math.min(100, (earned / range) * 100);
  return { cur, next, pct, range, earned };
}

function updateXPBar() {
  const bar   = document.getElementById("xp-bar");
  const text  = document.getElementById("xp-text");
  const barM  = document.getElementById("xp-bar-main");
  const textM = document.getElementById("xp-text-main");
  const { cur, pct } = _calcXPBar(currentUser.xp);
  const label = `Lv.${cur.level} ${cur.name}  •  ${currentUser.xp} XP`;
  if (bar)  { bar.style.transition  = "none"; bar.style.width  = pct + "%"; }
  if (text)  text.textContent  = label;
  if (barM) { barM.style.transition = "none"; barM.style.width = pct + "%"; }
  if (textM) textM.textContent = label;
}

// ═══════════════════════════════════════════════
// ANIMATED XP GAIN
// ═══════════════════════════════════════════════
function animateXPGain(oldXP, newXP, onDone) {
  const bar       = document.getElementById("xp-bar");
  const container = document.getElementById("xp-bar-container");
  const text      = document.getElementById("xp-text");
  if (!bar || !container || !text) { onDone && onDone(); return; }

  const gained = newXP - oldXP;
  if (gained <= 0) { updateXPBar(); onDone && onDone(); return; }

  const { cur: oldCur, pct: oldPct } = _calcXPBar(oldXP);
  bar.style.transition = "none"; bar.style.width = oldPct + "%";
  text.textContent = `Lv.${oldCur.level} ${oldCur.name}  •  ${oldXP} XP`;

  const barRect = container.getBoundingClientRect();
  const xpLabel = document.createElement("div");
  xpLabel.className = "xp-float-label";
  xpLabel.textContent = `+${gained} XP`;
  xpLabel.style.cssText = `position:fixed;left:${barRect.left+barRect.width/2}px;top:${barRect.top-18}px;transform:translate(-50%,0);font-family:'Fredoka One',cursive;font-size:1.3rem;color:#2ecc71;text-shadow:0 0 12px rgba(46,204,113,0.9);pointer-events:none;z-index:9000;animation:xpLabelAnim 1.6s cubic-bezier(0.2,0.8,0.4,1) forwards;`;
  document.body.appendChild(xpLabel);

  const particleCount = Math.min(28, 8 + Math.floor(gained / 10));
  for (let i = 0; i < particleCount; i++) setTimeout(() => _shootXPParticle(barRect, gained), i * 55);

  setTimeout(() => {
    xpLabel.remove();
    container.style.boxShadow = "0 0 0 3px rgba(46,204,113,0.7),0 0 30px rgba(46,204,113,0.5)";
    bar.classList.add("xp-bar-gaining");
    setTimeout(() => { container.style.boxShadow = ""; bar.classList.remove("xp-bar-gaining"); }, 1800);
    _animateBarFill(oldXP, newXP, () => { onDone && onDone(); });
  }, 620);
}

function _shootXPParticle(barRect, gained) {
  const size = 6 + Math.random() * 6;
  const startX = barRect.left + Math.random() * barRect.width;
  const startY = barRect.top + barRect.height / 2 + (Math.random() - 0.5) * 60 - 80;
  const endX = barRect.left + Math.random() * barRect.width;
  const endY = barRect.top + barRect.height / 2;
  const hue = 120 + Math.random() * 40;
  const bright = gained > 50 ? "gold" : `hsl(${hue},100%,65%)`;
  const p = document.createElement("div");
  p.style.cssText = `position:fixed;left:${startX}px;top:${startY}px;width:${size}px;height:${size}px;border-radius:50%;background:${bright};box-shadow:0 0 8px ${bright};pointer-events:none;z-index:8999;transition:left 0.45s cubic-bezier(0.4,0,0.2,1),top 0.45s cubic-bezier(0.4,0,0.2,1),opacity 0.45s ease,transform 0.45s ease;`;
  document.body.appendChild(p);
  requestAnimationFrame(() => { requestAnimationFrame(() => { p.style.left = endX + "px"; p.style.top = endY + "px"; p.style.opacity = "0"; p.style.transform = "scale(0.2)"; }); });
  setTimeout(() => p.remove(), 500);
}

function _animateBarFill(fromXP, toXP, onDone) {
  const bar = document.getElementById("xp-bar"); const text = document.getElementById("xp-text");
  const barM = document.getElementById("xp-bar-main"); const textM = document.getElementById("xp-text-main");
  if (!bar && !barM) { onDone && onDone(); return; }
  function setBar(w, t) { if (bar) { bar.style.transition = t; bar.style.width = w; } if (barM) { barM.style.transition = t; barM.style.width = w; } }
  function setText(s) { if (text) text.textContent = s; if (textM) textM.textContent = s; }
  const { cur: fromCur } = _calcXPBar(fromXP);
  const { cur: toCur, pct: toPct } = _calcXPBar(toXP);
  const leveledUp = toCur.level > fromCur.level;
  if (leveledUp) {
    setBar("100%", "width 0.7s cubic-bezier(0.4,0,0.2,1)");
    _animateXPCounter(fromXP, fromCur.xp + (levelsXP[levelsXP.findIndex(l => l.level === fromCur.level) + 1]?.xp - fromCur.xp || 0), 700);
    setTimeout(() => {
      if (bar) bar.style.boxShadow = "0 0 40px rgba(46,204,113,1),0 0 80px rgba(46,204,113,0.6)";
      _showLevelUpPopup(toCur); startConfetti();
      setTimeout(() => {
        setBar("0%", "none");
        if (bar) bar.style.boxShadow = "";
        setText(`Lv.${toCur.level} ${toCur.name}  •  ${toXP} XP`);
        setTimeout(() => { setBar(toPct + "%", "width 0.9s cubic-bezier(0.4,0,0.2,1)"); _animateXPCounter(fromCur.xp, toXP, 900); setTimeout(() => onDone && onDone(), 950); }, 120);
      }, 700);
    }, 750);
  } else {
    setBar(toPct + "%", "width 1s cubic-bezier(0.4,0,0.2,1)");
    _animateXPCounter(fromXP, toXP, 1000);
    setText(`Lv.${toCur.level} ${toCur.name}  •  ${fromXP} XP`);
    setTimeout(() => { setText(`Lv.${toCur.level} ${toCur.name}  •  ${toXP} XP`); onDone && onDone(); }, 1050);
  }
}

function _animateXPCounter(from, to, duration) {
  const text = document.getElementById("xp-text"); const textM = document.getElementById("xp-text-main");
  if (!text && !textM) return;
  const startTime = performance.now(); const { cur } = _calcXPBar(to);
  function tick(now) {
    const t = Math.min(1, (now - startTime) / duration);
    const ease = 1 - Math.pow(1 - t, 3);
    const current = Math.round(from + (to - from) * ease);
    const label = `Lv.${cur.level} ${cur.name}  •  ${current} XP`;
    if (text) text.textContent = label; if (textM) textM.textContent = label;
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function _showLevelUpPopup(cur) {
  document.querySelectorAll(".level-up-popup").forEach(el => el.remove());
  const p = document.createElement("div"); p.className = "level-up-popup";
  p.innerHTML = `<div class="lu-glow-ring"></div><div class="lu-badge">⬆</div><div class="lu-title">LEVEL UP!</div><div class="lu-level">Lv.${cur.level}</div><div class="lu-sub">${cur.name}</div>`;
  document.body.appendChild(p); setTimeout(() => p.remove(), 3400);
}

// ═══════════════════════════════════════════════
// GENERATE TRASH
// ═══════════════════════════════════════════════
function generate(level) {
  trashItems = []; correct = 0; mistakes = []; currentIndex = 0; combo = 0; comboMultiplier = 1;
  _thisGameCombo = 0;
  gameStartTime = Date.now();
  const config = levelConfig[level];
  for (const type in config) {
    const needed = config[type];
    const shuffled = [...trashPool[type]].sort(() => Math.random() - 0.5);
    for (let i = 0; i < needed; i++) trashItems.push({ ...shuffled[i % shuffled.length], type });
  }
  trashItems.sort(() => Math.random() - 0.5);
  const seen = new Set();
  trashItems = trashItems.filter(item => { if (seen.has(item.img)) return false; seen.add(item.img); return true; });
}

// ═══════════════════════════════════════════════
// LEVEL INTRO
// ═══════════════════════════════════════════════
function showLevelIntro(level, callback) {
  const cfg = LEVEL_INTRO[level];
  const overlay = document.createElement("div");
  overlay.id = "level-intro-overlay";
  overlay.style.cssText = `position:fixed;inset:0;z-index:20000;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(ellipse at center,${cfg.color1}33 0%,#071f14 65%);backdrop-filter:blur(4px);overflow:hidden;`;
  overlay.innerHTML = `
    <div class="li-rings"><div class="li-ring li-ring1" style="border-color:${cfg.color1}44;"></div><div class="li-ring li-ring2" style="border-color:${cfg.color1}28;"></div><div class="li-ring li-ring3" style="border-color:${cfg.color1}14;"></div></div>
    <div class="li-content">
      <div class="li-ready">PASIRUOŠK!</div>
      <div class="li-emoji" style="text-shadow:0 0 60px ${cfg.glow};">${cfg.emoji}</div>
      <div class="li-label" style="color:${cfg.color1};text-shadow:0 0 30px ${cfg.glow},0 0 60px ${cfg.glow};">${cfg.label}</div>
      <div class="li-sub-box" style="background:rgba(0,0,0,0.55);border:1px solid rgba(255,255,255,0.12);border-radius:12px;padding:8px 20px;margin-top:2px;"><div class="li-sub">${cfg.sub}</div></div>
      <div class="li-bar-wrap"><div class="li-bar" style="background:linear-gradient(90deg,${cfg.color1},${cfg.color2});box-shadow:0 0 20px ${cfg.glow};"></div></div>
      <div class="li-go" style="color:${cfg.color1};text-shadow:0 0 40px ${cfg.glow};">PRADĖTI!</div>
    </div>`;
  document.body.appendChild(overlay);
  setTimeout(() => { overlay.querySelector(".li-go").classList.add("li-go-visible"); }, 1900);
  setTimeout(() => { overlay.classList.add("li-outro"); setTimeout(() => { overlay.remove(); callback(); }, 500); }, 2700);
}

// ═══════════════════════════════════════════════
// START GAME
// ═══════════════════════════════════════════════
function startGame(level) {
  currentLevel = level;
  window._timedCloseCall = false;
  const h = new Date().getHours(), d = new Date().getDay();
  if (h >= 22 || h < 4) currentUser._nightOwl = (currentUser._nightOwl || 0) + 1;
  if (h < 8)            currentUser._morning  = (currentUser._morning  || 0) + 1;
  if (d === 1)          currentUser._monday   = (currentUser._monday   || 0) + 1;
  showLevelIntro(level, () => {
    switchScreen("game");
    const labels = { easy: "🟢 Lengvas", medium: "🟡 Vidutinis", hard: "🔴 Sunkus", timed: "💨 Laikinas" };
    document.getElementById("level-title").textContent = `Lygis: ${labels[level] || level}`;
    generate(level); renderTrash(); renderBins();
    const timerEl = document.getElementById("timer-container");
    if (level === "timed") { timerEl.style.display = "block"; startTimer(60); }
    else { timerEl.style.display = "none"; clearInterval(timerInterval); }
  });
}

// ═══════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════
function renderTrash() {
  const container = document.getElementById("trash"); container.innerHTML = "";
  const item = trashItems[currentIndex]; if (!item) return;
  const div = document.createElement("div"); div.className = "trash-item";
  const counter = document.createElement("div");
  counter.style.cssText = "position:absolute;top:10px;right:14px;font-size:12px;font-weight:800;color:rgba(0,0,0,0.38);pointer-events:none;";
  counter.textContent = `${currentIndex + 1} / ${trashItems.length}`;
  const img = document.createElement("img"); img.src = item.img; img.alt = "Šiukšlė";
  div.appendChild(counter); div.appendChild(img); container.appendChild(div);
  renderComboBadge();
}

function renderComboBadge(extinguish) {
  const existing = document.getElementById("combo-badge");
  if (extinguish && existing) { existing.classList.add("combo-extinguish"); setTimeout(() => existing.remove(), 500); return; }
  if (existing) existing.remove();
  if (combo < 2) return;
  const colors = combo >= 10 ? ["#e040fb","#9c27b0"] : combo >= 6 ? ["#e74c3c","#c0392b"] : ["#f39c12","#e67e22"];
  const badge = document.createElement("div"); badge.id = "combo-badge";
  const isMilestone = combo > 0 && combo % 5 === 0;
  badge.style.cssText = `position:fixed;top:16px;right:16px;background:linear-gradient(135deg,${colors[0]},${colors[1]});color:white;font-size:1.05rem;font-weight:800;padding:8px 18px;border-radius:50px;box-shadow:0 4px 18px ${colors[0]}88;z-index:200;animation:${isMilestone ? "comboMilestone 0.55s cubic-bezier(0.34,1.56,0.64,1)" : "popIn 0.3s cubic-bezier(0.34,1.56,0.64,1)"};transform-origin:center;`;
  badge.textContent = `🔥 Combo ×${combo}  (+${comboMultiplier}× XP)`;
  document.body.appendChild(badge);
  if (isMilestone) {
    setTimeout(() => {
      const rect = badge.getBoundingClientRect();
      const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
      for (let i = 0; i < 12; i++) {
        const spark = document.createElement("div");
        const angle = (i / 12) * 360, dist = 38 + Math.random() * 22, size = 5 + Math.random() * 5;
        spark.style.cssText = `position:fixed;left:${cx}px;top:${cy}px;width:${size}px;height:${size}px;border-radius:50%;background:${colors[0]};pointer-events:none;z-index:201;transform:translate(-50%,-50%);animation:sparkFly 0.5s ease-out forwards;--dx:${Math.cos(angle*Math.PI/180)*dist}px;--dy:${Math.sin(angle*Math.PI/180)*dist}px;`;
        document.body.appendChild(spark); setTimeout(() => spark.remove(), 520);
      }
    }, 50);
  }
}

function extinguishCombo() { renderComboBadge(true); }

function renderBins() {
  const binsEl = document.getElementById("bins"); binsEl.innerHTML = "";
  bins.forEach(b => {
    const d = document.createElement("div"); d.className = "bin";
    d.setAttribute("data-type", b.type); d.textContent = b.name;
    d.onclick = () => chooseBin(b.type); binsEl.appendChild(d);
  });
}

// ═══════════════════════════════════════════════
// CHOOSE BIN
// ═══════════════════════════════════════════════
function chooseBin(type) {
  const item = trashItems[currentIndex]; if (!item) return;
  const binEl = document.querySelector(`.bin[data-type="${type}"]`);
  if (item.type === type) {
    correct++; combo++;
    if (combo > _thisGameCombo) _thisGameCombo = combo;
    if (combo > (currentUser.maxCombo || 0)) currentUser.maxCombo = combo;
    comboMultiplier = combo >= 15 ? 5 : combo >= 10 ? 4 : combo >= 6 ? 3 : combo >= 3 ? 2 : 1;
    flashBin(binEl, "rgba(46,204,113,0.6)");
  } else {
    mistakes.push({ img: item.img, correct: item.type });
    if (currentIndex === 0) currentUser._badStart = (currentUser._badStart || 0) + 1;
    extinguishCombo(); combo = 0; comboMultiplier = 1;
    flashBin(binEl, "rgba(231,76,60,0.7)");
    const card = document.querySelector(".trash-item");
    if (card) { card.style.animation = "none"; requestAnimationFrame(() => { card.style.animation = "shake 0.4s ease"; }); }
  }
  currentIndex++;
  if (currentIndex >= trashItems.length) finishGame(); else renderTrash();
}

function flashBin(el, color) {
  if (!el) return;
  el.style.outline = `4px solid ${color}`; el.style.transform = "scale(0.94)";
  setTimeout(() => { el.style.outline = ""; el.style.transform = ""; }, 280);
}

// ═══════════════════════════════════════════════
// PREVIOUS ITEM (rewind)
// ═══════════════════════════════════════════════
function previousTrash() {
  if (currentIndex <= 0) return;
  currentUser._rewindUsed = (currentUser._rewindUsed || 0) + 1;
  currentIndex--;
  const item = trashItems[currentIndex];
  const mi = mistakes.findIndex(m => m.img === item.img);
  if (mi !== -1) mistakes.splice(mi, 1); else correct = Math.max(0, correct - 1);
  combo = Math.max(0, combo - 1);
  comboMultiplier = combo >= 15 ? 5 : combo >= 10 ? 4 : combo >= 6 ? 3 : combo >= 3 ? 2 : 1;
  renderTrash();
}

// ═══════════════════════════════════════════════
// FINISH GAME — block early exit
// ═══════════════════════════════════════════════
function tryFinishGame() {
  const remaining = trashItems.length - currentIndex;
  if (remaining > 0) {
    document.getElementById("finish-warn")?.remove();
    const warn = document.createElement("div"); warn.id = "finish-warn";
    warn.style.cssText = "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:30000;background:rgba(7,31,20,0.97);border:2px solid rgba(231,76,60,0.6);border-radius:20px;padding:28px 32px;text-align:center;box-shadow:0 8px 40px rgba(231,76,60,0.3);animation:popIn 0.35s cubic-bezier(0.34,1.56,0.64,1);max-width:300px;width:90%;";
    warn.innerHTML = `<div style="font-size:48px;margin-bottom:10px;">🚫</div><div style="font-family:'Fredoka One',cursive;font-size:1.5rem;color:#e74c3c;margin-bottom:8px;">Dar ne!</div><div style="font-size:14px;font-weight:700;color:rgba(255,255,255,0.75);margin-bottom:18px;">Liko dar <b style="color:#f39c12;">${remaining}</b> ${remaining===1?"daiktas":remaining<10?"daiktai":"daiktų"}!<br>Surūšiuok <b>visus</b> prieš baigdamas.</div><button style="padding:10px 28px;border:none;border-radius:12px;background:linear-gradient(135deg,#2ecc71,#27ae60);color:white;font-weight:800;font-size:14px;cursor:pointer;" onclick="document.getElementById('finish-warn')?.remove()">✓ Tęsti</button>`;
    document.body.appendChild(warn);
    setTimeout(() => { document.getElementById("finish-warn")?.remove(); }, 4000);
    return;
  }
  finishGame();
}

// ═══════════════════════════════════════════════
// FINISH GAME — all bugs fixed
// ═══════════════════════════════════════════════
function finishGame() {
  clearInterval(timerInterval);
  const total     = trashItems.length;
  const missCount = mistakes.length;
  const percent   = currentIndex > 0 ? Math.round((correct / total) * 100) : 0;
  const isPerfect = currentIndex > 0 && missCount === 0;
  const elapsed   = (Date.now() - gameStartTime) / 1000;

  // ── Mistake type tracking ──
  const mistakeMap = {};
  mistakes.forEach(m => { mistakeMap[m.correct] = (mistakeMap[m.correct] || 0) + 1; });
  if (!currentUser.mistakesByType) currentUser.mistakesByType = {};
  Object.entries(mistakeMap).forEach(([type, count]) => {
    currentUser.mistakesByType[type] = (currentUser.mistakesByType[type] || 0) + count;
  });

  // ── XP calculation ──
  const baseXP = correct * XP_VALUES[currentLevel];
  let penaltyXP = 0;
  mistakes.forEach(m => {
    const lt = currentUser.mistakesByType[m.correct] || 1;
    penaltyXP += XP_PENALTY[currentLevel] * Math.min(3, 1 + Math.floor(lt / 5) * 0.5);
  });
  penaltyXP = Math.round(penaltyXP);
  const accMult = isPerfect ? 1.5 : percent >= 80 ? 1.2 : percent >= 60 ? 1.0 : percent >= 40 ? 0.7 : 0.4;
  const finalXP = Math.max(0, Math.round((baseXP - penaltyXP) * accMult));
  const grade = currentIndex === 0 ? "😴 Nieko nesurūšiavai!" : isPerfect ? "🏆 Tobulai!" : percent >= 80 ? "🌟 Puiku!" : percent >= 60 ? "👍 Neblogai" : percent >= 40 ? "😐 Vidutiniškai" : "💪 Reikia daugiau pastangų";

  switchScreen("result");

  // ── Grade config ──
  const gradeConfig = {
    perfect: { emoji:"🏆", label:"TOBULAI!",        color:"#2ecc71", glow:"rgba(46,204,113,0.8)",  bg:"linear-gradient(135deg,#0d3b27,#1a5c3a)" },
    great:   { emoji:"🌟", label:"PUIKU!",           color:"#f1c40f", glow:"rgba(241,196,15,0.8)",  bg:"linear-gradient(135deg,#2d2200,#4a3800)" },
    good:    { emoji:"👍", label:"NEBLOGAI",         color:"#3498db", glow:"rgba(52,152,219,0.8)",  bg:"linear-gradient(135deg,#0a1f35,#1a3a55)" },
    ok:      { emoji:"😐", label:"VIDUTINIŠKAI",     color:"#e67e22", glow:"rgba(230,126,34,0.8)",  bg:"linear-gradient(135deg,#2d1500,#4a2800)" },
    bad:     { emoji:"💪", label:"BANDYK DAR!",      color:"#e74c3c", glow:"rgba(231,76,60,0.8)",   bg:"linear-gradient(135deg,#2d0a0a,#4a1515)" },
    zero:    { emoji:"😴", label:"NIEKO...",         color:"#95a5a6", glow:"rgba(149,165,166,0.6)", bg:"linear-gradient(135deg,#1a1a1a,#2d2d2d)" },
  };
  const gc = isPerfect ? gradeConfig.perfect : percent >= 80 ? gradeConfig.great : percent >= 60 ? gradeConfig.good : percent >= 40 ? gradeConfig.ok : currentIndex === 0 ? gradeConfig.zero : gradeConfig.bad;

  // ── Build the result overlay HTML ──
  const overlay = document.querySelector(".result-overlay");
  overlay.className = "result-overlay result-overlay--new";
  overlay.innerHTML = `
    <div class="rs-bg-glow" style="background:radial-gradient(ellipse at 50% 0%,${gc.glow} 0%,transparent 65%);"></div>

    <!-- Grade hero -->
    <div class="rs-hero">
      <div class="rs-emoji" style="filter:drop-shadow(0 0 24px ${gc.glow});">${gc.emoji}</div>
      <div class="rs-grade" style="color:${gc.color};text-shadow:0 0 30px ${gc.glow},0 0 60px ${gc.glow}aa;">${gc.label}</div>
      ${isPerfect ? `<div class="rs-perfect-ring" style="border-color:${gc.color}55;box-shadow:0 0 30px ${gc.glow};"></div>` : ""}
    </div>

    <!-- Accuracy ring -->
    <div class="rs-accuracy-wrap">
      <svg class="rs-ring-svg" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="10"/>
        <circle cx="60" cy="60" r="52" fill="none" stroke="${gc.color}" stroke-width="10"
          stroke-linecap="round" stroke-dasharray="326.7" stroke-dashoffset="${326.7 - 326.7 * percent / 100}"
          transform="rotate(-90 60 60)" style="transition:stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1);filter:drop-shadow(0 0 8px ${gc.glow});"/>
      </svg>
      <div class="rs-ring-inner">
        <div class="rs-pct" style="color:${gc.color};">${percent}<span style="font-size:1.2rem;">%</span></div>
        <div class="rs-pct-label">tikslumas</div>
      </div>
    </div>

    <!-- Stats row -->
    <div class="rs-stats">
      <div class="rs-stat">
        <div class="rs-stat-val" style="color:#2ecc71;">${correct}</div>
        <div class="rs-stat-key">teisingi</div>
      </div>
      <div class="rs-stat-divider"></div>
      <div class="rs-stat">
        <div class="rs-stat-val" style="color:#e74c3c;">${missCount}</div>
        <div class="rs-stat-key">klaidos</div>
      </div>
      <div class="rs-stat-divider"></div>
      <div class="rs-stat">
        <div class="rs-stat-val" style="color:#f39c12;">${_thisGameCombo > 0 ? "×"+_thisGameCombo : "—"}</div>
        <div class="rs-stat-key">maks combo</div>
      </div>
      <div class="rs-stat-divider"></div>
      <div class="rs-stat">
        <div class="rs-stat-val" style="color:#9b59b6;">${Math.round(elapsed)}s</div>
        <div class="rs-stat-key">laikas</div>
      </div>
    </div>

    <!-- XP breakdown -->
    <div class="rs-xp-card">
      <div class="rs-xp-shine"></div>
      <div class="rs-xp-row"><span class="rs-xp-label">Bazinis XP</span><span class="rs-xp-val">+${baseXP}</span></div>
      ${penaltyXP > 0 ? `<div class="rs-xp-row"><span class="rs-xp-label">Baudos</span><span class="rs-xp-val rs-xp-neg">−${penaltyXP}</span></div>` : ""}
      <div class="rs-xp-row"><span class="rs-xp-label">Tikslumas</span><span class="rs-xp-val">×${accMult.toFixed(1)}</span></div>
      <div class="rs-xp-divider"></div>
      <div class="rs-xp-total">
        <span class="rs-xp-total-label">GAUTAS XP</span>
        <span class="rs-xp-total-val" style="color:${gc.color};text-shadow:0 0 20px ${gc.glow};" id="rs-final-xp">+0</span>
      </div>
    </div>

    <!-- XP bar -->
    <div class="rs-bar-wrap">
      <div id="xp-bar-container" style="background:rgba(0,0,0,0.35);border-radius:50px;overflow:hidden;width:100%;height:22px;border:1px solid rgba(46,204,113,0.2);transition:box-shadow 0.3s;">
        <div id="xp-bar" style="height:100%;background:linear-gradient(90deg,#27ae60,#2ecc71,#80ffb4);width:0%;border-radius:50px;box-shadow:0 0 12px rgba(46,204,113,0.65);"></div>
      </div>
      <div id="xp-text" style="margin-top:6px;font-size:12px;color:rgba(255,255,255,0.55);font-weight:600;text-align:center;"></div>
    </div>

    <!-- Mistakes -->
    <div id="mistakes" class="rs-mistakes"></div>

    <!-- Restart -->
    <button class="rs-restart-btn" onclick="resetGame()">🔄 Žaisti dar kartą</button>
  `;

  // Animate the +XP counter in the card
  const xpTotalEl = document.getElementById("rs-final-xp");
  if (xpTotalEl) {
    let start = null;
    const dur = 900;
    function countUp(ts) {
      if (!start) start = ts;
      const t = Math.min(1, (ts - start) / dur);
      const ease = 1 - Math.pow(1 - t, 3);
      xpTotalEl.textContent = "+" + Math.round(finalXP * ease);
      if (t < 1) requestAnimationFrame(countUp);
      else xpTotalEl.textContent = "+" + finalXP;
    }
    setTimeout(() => requestAnimationFrame(countUp), 400);
  }

  // Mistakes section
  const mistakesDiv = document.getElementById("mistakes"); mistakesDiv.innerHTML = "";
  if (mistakes.length > 0) {
    const hdr = document.createElement("div");
    hdr.className = "rs-mistakes-hdr";
    hdr.textContent = `❌ ${mistakes.length} klaida${mistakes.length === 1 ? "" : "s"}`;
    mistakesDiv.appendChild(hdr);
    mistakes.forEach(m => {
      const row = document.createElement("div"); row.className = "rs-mistake-row";
      const lt = currentUser.mistakesByType[m.correct] || 1;
      row.innerHTML = `
        <img src="${m.img}" alt="${m.correct}">
        <div class="rs-mistake-info">
          <div class="rs-mistake-bin">→ ${bins.find(b => b.type === m.correct)?.name || m.correct}</div>
          ${lt >= 5 ? `<div class="rs-mistake-warn">⚠️ Jau ${lt}× klysti čia!</div>` : ""}
        </div>`;
      mistakesDiv.appendChild(row);
    });
  } else if (isPerfect) {
    mistakesDiv.innerHTML = `<div class="rs-perfect-msg">✨ Nė vienos klaidos! Tobulas žaidimas!</div>`;
  }

  const oldXP = currentUser.xp;

  // ── UPDATE STATS (before achievement checks) ──
  currentUser.xp      += finalXP;
  currentUser.games   += 1;
  currentUser.totalCorrect += correct;
  if (isPerfect)                currentUser.perfectGames++;
  if (currentLevel === "hard")  currentUser.hardGames++;
  if (currentLevel === "timed") currentUser.timedGames++;
  if (currentLevel === "easy")  currentUser.easyGames   = (currentUser.easyGames   || 0) + 1;
  if (currentLevel === "medium")currentUser.mediumGames = (currentUser.mediumGames || 0) + 1;

  // ── Consecutive perfect streak ──
  if (isPerfect) {
    _consecutivePerfect++;
    if (_consecutivePerfect > (currentUser._streak3 || 0)) currentUser._streak3 = _consecutivePerfect;
  } else {
    _consecutivePerfect = 0;
  }
  currentUser._consecutivePerfect = _consecutivePerfect;

  // ── Perfect timed ──
  if (isPerfect && currentLevel === "timed") currentUser._perfectTimed = (currentUser._perfectTimed || 0) + 1;

  // ── Comeback: 3+ mistakes but still >80% ──
  if (missCount >= 3 && percent > 80) currentUser._comebacks = (currentUser._comebacks || 0) + 1;

  // ── Speed easy: finished in <30s ──
  if (currentLevel === "easy" && elapsed < 30 && currentIndex >= total) currentUser._fastEasy = (currentUser._fastEasy || 0) + 1;

  // ── Early quit: timed mode, sorted fewer than half ──
  // NOTE: only applies to timed (timer ran out), never to normal modes
  // because tryFinishGame() blocks early exit for normal modes.
  if (currentLevel === "timed" && currentIndex < Math.floor(total / 2)) {
    currentUser._earlyQuit = (currentUser._earlyQuit || 0) + 1;
  }

  // ── No combo: never reached 2 consecutive in this game (more than 5 items) ──
  if (currentIndex > 0 && _thisGameCombo < 2 && total > 5) {
    currentUser._noComboGame = (currentUser._noComboGame || 0) + 1;
  }

  // ── Close call: timed game, ≤3 seconds left ──
  if (window._timedCloseCall && currentLevel === "timed") {
    currentUser._closecall = (currentUser._closecall || 0) + 1;
    window._timedCloseCall = false;
  }

  // ── ACHIEVEMENT CHECKS ──
  // Gate: achievements only fire when the game was genuinely played through.
  // Normal modes: all items sorted. Timed: at least half sorted.
  const allSorted   = currentIndex >= total;
  const timedEnough = currentLevel === "timed" && currentIndex >= Math.ceil(total / 2);
  const gameWasComplete = allSorted || timedEnough;

  // Extra gate: player must have sorted at least 3 items (prevents
  // 1-item quit or near-empty timed games from triggering things)
  const newlyUnlocked = [];
  if (gameWasComplete && currentIndex >= 3) {
    achievements.forEach(a => {
      if (!a.done) {
        let ok = false;
        try { ok = a.check(); } catch (e) {}
        if (ok) { a.done = true; currentUser.achievements[a.id] = true; newlyUnlocked.push(a); }
      }
    });
  }

  saveCurrentUser();
  renderSavedUsers();
  document.getElementById("combo-badge")?.remove();

  startConfetti();
  setTimeout(() => {
    animateXPGain(oldXP, currentUser.xp, () => {
      newlyUnlocked.forEach((a, i) => setTimeout(() => showAchievementPopup(a), 300 + i * 2200));
    });
  }, 700);
}

// ═══════════════════════════════════════════════
// ACHIEVEMENT POPUP
// ═══════════════════════════════════════════════
function showAchievementPopup(a) {
  const r = RARITY[a.rarity] || RARITY.legendary;
  const isSecret = a.rarity === "secret";
  const overlay = document.createElement("div"); overlay.className = "ach-popup-overlay";
  overlay.innerHTML = `
    <div class="ach-popup" style="background:${r.bg};box-shadow:0 0 70px ${r.glow},0 16px 50px rgba(0,0,0,0.65);">
      <div class="ach-shine"></div>
      <div class="ach-rarity-label" style="color:${r.color};border-color:${r.color}55;">${isSecret ? "⚡ SLAPTASIS ⚡" : r.label.toUpperCase()}</div>
      <div class="ach-icon" ${isSecret ? 'style="animation:secretPulse 1s ease infinite;"' : ''}>${a.icon}</div>
      <div class="ach-unlocked-text">${isSecret ? "🔓 Slaptas pasiekimas atrakinta!" : "Achievement atrakinta!"}</div>
      <div class="ach-title" style="color:${r.color};text-shadow:0 0 14px ${r.glow};">${a.title}</div>
      <div class="ach-desc">${a.desc}</div>
      <div class="ach-particles" id="ap-${a.id}"></div>
      <button class="ach-skip-btn">⏭ Praleisti</button>
    </div>`;
  document.body.appendChild(overlay);
  const pc = overlay.querySelector(`#ap-${a.id}`);
  for (let i = 0; i < 18; i++) {
    const p = document.createElement("div"); p.className = "ach-particle";
    p.style.cssText = `left:${Math.random()*100}%;animation-delay:${Math.random()*0.7}s;animation-duration:${0.8+Math.random()*0.9}s;background:${r.color};box-shadow:0 0 6px ${r.color};`;
    pc.appendChild(p);
  }
  const dismiss = () => { overlay.classList.add("ach-popup-out"); setTimeout(() => overlay.remove(), 500); };
  overlay.querySelector(".ach-skip-btn").addEventListener("click", e => { e.stopPropagation(); dismiss(); });
  setTimeout(dismiss, isSecret ? 5000 : 3400);
  overlay.addEventListener("click", dismiss);
}

// ═══════════════════════════════════════════════
// ACHIEVEMENTS SCREEN
// ═══════════════════════════════════════════════
function openAchievements() {
  switchScreen("achievements-modal");
  const ul = document.getElementById("achievements-list"); ul.innerHTML = "";
  const doneCount = achievements.filter(a => a.done).length;
  const secretDone = achievements.filter(a => a.rarity === "secret" && a.done).length;
  const hdr = document.createElement("div");
  hdr.style.cssText = "text-align:center;margin-bottom:14px;font-size:13px;font-weight:700;color:rgba(255,255,255,0.5);";
  hdr.textContent = `${doneCount} / ${achievements.length} atrakinta  •  ${secretDone}/2 slaptieji`;
  ul.appendChild(hdr);
  const order = { bronze: 0, silver: 1, gold: 2, legendary: 3, secret: 4 };
  const sorted = [...achievements].sort((a, b) => { const rd = order[a.rarity] - order[b.rarity]; return rd !== 0 ? rd : (b.done ? 1 : 0) - (a.done ? 1 : 0); });
  let lastRarity = null;
  sorted.forEach(a => {
    const r = RARITY[a.rarity] || RARITY.legendary;
    if (a.rarity !== lastRarity) {
      lastRarity = a.rarity;
      const sec = document.createElement("div"); sec.className = "ach-section-header";
      sec.style.cssText = `color:${r.color};text-shadow:0 0 10px ${r.glow};border-color:${r.color}44;`;
      const done = achievements.filter(x => x.rarity === a.rarity && x.done).length;
      const total = achievements.filter(x => x.rarity === a.rarity).length;
      sec.textContent = `${r.label.toUpperCase()} — ${done}/${total}`;
      ul.appendChild(sec);
    }
    const li = document.createElement("li"); li.className = "ach-list-item" + (a.done ? " ach-done" : " ach-locked");
    const isSecret = a.rarity === "secret";
    if (a.done) li.style.cssText = `border-color:${r.color}44;background:${r.bg};`;
    else li.style.cssText = `border-color:rgba(255,255,255,0.08);background:rgba(0,0,0,0.28);${isSecret ? "" : "filter:grayscale(0.4);"}`;
    li.innerHTML = `
      <span class="ach-li-icon">${a.done ? a.icon : "🔒"}</span>
      <div class="ach-li-body">
        <div class="ach-li-title" style="color:${a.done ? r.color : isSecret ? r.color + "aa" : "rgba(255,255,255,0.4)"};">${a.done ? a.title : isSecret ? "??? (Slaptasis)" : "???"}</div>
        <div class="ach-li-desc">${a.done || isSecret ? a.desc : "???"}</div>
        <div class="ach-li-rarity" style="color:${r.color};">${r.label}</div>
      </div>
      ${a.done ? `<span class="ach-li-check">✓</span>` : ""}`;
    ul.appendChild(li);
  });
}

// ═══════════════════════════════════════════════
// LEADERBOARD
// ═══════════════════════════════════════════════
let lbSortKey = "xp";

function openLeaderboard() {
  switchScreen("leaderboard-modal");
  renderLeaderboard();
}

function renderLeaderboard(sortKey) {
  if (sortKey) lbSortKey = sortKey;
  const users = getUsers();
  const list = Object.values(users).sort((a, b) => (b[lbSortKey] || 0) - (a[lbSortKey] || 0));
  const container = document.getElementById("lb-list");
  container.innerHTML = "";

  // Tab highlight
  document.querySelectorAll(".lb-tab").forEach(t => {
    t.style.background = t.dataset.key === lbSortKey ? "rgba(46,204,113,0.25)" : "rgba(255,255,255,0.05)";
    t.style.borderColor = t.dataset.key === lbSortKey ? "rgba(46,204,113,0.6)" : "rgba(255,255,255,0.12)";
    t.style.color = t.dataset.key === lbSortKey ? "#2ecc71" : "rgba(255,255,255,0.55)";
  });

  if (!list.length) {
    container.innerHTML = `<div style="text-align:center;color:rgba(255,255,255,0.4);padding:30px;font-size:14px;font-weight:700;">Nėra žaidėjų dar!</div>`;
    return;
  }

  const medals = ["🥇","🥈","🥉"];
  list.forEach((u, i) => {
    const lv = getCurrentLevel(u.xp || 0);
    const isMe = currentUser && u.username === currentUser.username;
    const achCount = Object.keys(u.achievements || {}).length;
    const row = document.createElement("div");
    row.style.cssText = `display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:16px;margin-bottom:8px;border:1px solid ${isMe ? "rgba(46,204,113,0.45)" : "rgba(255,255,255,0.08)"};background:${isMe ? "rgba(46,204,113,0.1)" : "rgba(0,0,0,0.28)"};transition:transform 0.2s;position:relative;overflow:hidden;`;

    // rank glow for top 3
    if (i < 3) {
      const glowColors = ["rgba(255,215,0,0.12)","rgba(192,192,192,0.10)","rgba(205,127,50,0.10)"];
      row.style.background = isMe ? "rgba(46,204,113,0.13)" : glowColors[i];
      row.style.borderColor = isMe ? "rgba(46,204,113,0.45)" : ["rgba(255,215,0,0.4)","rgba(192,192,192,0.3)","rgba(205,127,50,0.3)"][i];
    }

    const rankEl = document.createElement("div");
    rankEl.style.cssText = "font-size:22px;width:32px;text-align:center;flex-shrink:0;";
    rankEl.textContent = medals[i] || `#${i + 1}`;

    const avatar = document.createElement("div");
    avatar.style.cssText = "width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#27ae60,#1e8449);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;";
    avatar.textContent = u.avatar || "🌿";

    const info = document.createElement("div");
    info.style.cssText = "flex:1;text-align:left;";
    info.innerHTML = `
      <div style="font-weight:800;font-size:15px;color:${isMe ? "#2ecc71" : "white"}">${u.username}${isMe ? " 👈" : ""}</div>
      <div style="font-size:11px;color:rgba(255,255,255,0.45);font-weight:600;">Lv.${lv.level} ${lv.name} · ${achCount} ach.</div>`;

    const stats = document.createElement("div");
    stats.style.cssText = "text-align:right;flex-shrink:0;";
    const statLabels = { xp: `${(u.xp||0).toLocaleString()} XP`, games: `${u.games||0} žaidimai`, perfectGames: `${u.perfectGames||0} tobuli`, maxCombo: `×${u.maxCombo||0} combo`, totalCorrect: `${u.totalCorrect||0} teisingi` };
    stats.innerHTML = `<div style="font-family:'Fredoka One',cursive;font-size:1.1rem;color:${isMe?"#2ecc71":"#f1c40f"}">${statLabels[lbSortKey] || ""}</div>`;

    row.appendChild(rankEl); row.appendChild(avatar); row.appendChild(info); row.appendChild(stats);
    row.addEventListener("pointerenter", () => { row.style.transform = "scale(1.01)"; });
    row.addEventListener("pointerleave", () => { row.style.transform = ""; });
    container.appendChild(row);
  });
}

function closeLeaderboard() { switchScreen("start-screen"); }
function closeAchievements() { switchScreen("start-screen"); }
function resetGame()         { document.getElementById("combo-badge")?.remove(); switchScreen("start-screen"); }

// ═══════════════════════════════════════════════
// TIMER
// ═══════════════════════════════════════════════
function startTimer(seconds) {
  let t = seconds; const el = document.getElementById("timer"); el.textContent = t;
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    t--; el.textContent = t; el.style.color = t <= 10 ? "#e74c3c" : "";
    if (t <= 3 && t > 0) window._timedCloseCall = true;
    if (t <= 0) { clearInterval(timerInterval); finishGame(); }
  }, 1000);
}

// ═══════════════════════════════════════════════
// SCREEN SWITCHER
// ═══════════════════════════════════════════════
function switchScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id)?.classList.add("active");
}

// ═══════════════════════════════════════════════
// CONFETTI
// ═══════════════════════════════════════════════
function startConfetti() {
  const canvas = document.getElementById("confetti"); if (!canvas) return;
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth; canvas.height = window.innerHeight;
  const p = Array.from({ length: 180 }, () => ({ x: Math.random() * canvas.width, y: Math.random() * canvas.height - canvas.height, r: Math.random() * 6 + 2, d: Math.random() * 50 + 10, color: `hsl(${Math.random() * 360},100%,55%)`, tilt: Math.random() * 10 - 10 }));
  let angle = 0, alpha = 1;
  if (window._cRaf) cancelAnimationFrame(window._cRaf);
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.globalAlpha = alpha;
    p.forEach(f => { ctx.beginPath(); ctx.lineWidth = f.r; ctx.strokeStyle = f.color; ctx.moveTo(f.x + f.tilt + f.r / 2, f.y); ctx.lineTo(f.x + f.tilt, f.y + f.tilt + f.r / 2); ctx.stroke(); f.y += (Math.cos(angle + f.d) + 1 + f.r / 2) / 2; f.x += Math.sin(angle); if (f.y > canvas.height) { f.y = 0; f.x = Math.random() * canvas.width; } });
    angle += 0.01; window._cRaf = requestAnimationFrame(draw);
  }
  draw();
  setTimeout(() => { const fade = setInterval(() => { alpha -= 0.02; if (alpha <= 0) { clearInterval(fade); cancelAnimationFrame(window._cRaf); ctx.clearRect(0, 0, canvas.width, canvas.height); } }, 30); }, 5000);
}

// ═══════════════════════════════════════════════
// INJECTED STYLES
// ═══════════════════════════════════════════════
const extraStyles = document.createElement("style");
extraStyles.textContent = `
@keyframes shake{0%,100%{transform:translateX(0) rotate(0)}20%{transform:translateX(-10px) rotate(-3deg)}40%{transform:translateX(10px) rotate(3deg)}60%{transform:translateX(-7px) rotate(-2deg)}80%{transform:translateX(7px) rotate(2deg)}}
@keyframes popIn{from{transform:scale(0.3);opacity:0}to{transform:scale(1);opacity:1}}
@keyframes secretPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}

#level-intro-overlay{animation:liIn 0.35s ease;}
@keyframes liIn{from{opacity:0}to{opacity:1}}
.li-outro{animation:liOut 0.5s ease forwards!important;}
@keyframes liOut{to{opacity:0;transform:scale(1.08)}}
.li-rings{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;}
.li-ring{position:absolute;border-radius:50%;border:2px solid;animation:liRingPulse 2s ease-out infinite;}
.li-ring1{width:200px;height:200px;animation-delay:0s;}
.li-ring2{width:350px;height:350px;animation-delay:0.3s;}
.li-ring3{width:520px;height:520px;animation-delay:0.6s;}
@keyframes liRingPulse{0%{transform:scale(0.6);opacity:0.8}100%{transform:scale(1.4);opacity:0}}
.li-content{position:relative;display:flex;flex-direction:column;align-items:center;gap:8px;animation:liContentIn 0.5s cubic-bezier(0.34,1.56,0.64,1);}
@keyframes liContentIn{from{transform:scale(0.5) translateY(30px);opacity:0}to{transform:scale(1) translateY(0);opacity:1}}
.li-ready{font-size:13px;font-weight:900;letter-spacing:4px;color:rgba(255,255,255,0.75);text-transform:uppercase;background:rgba(0,0,0,0.45);padding:4px 14px;border-radius:50px;}
.li-emoji{font-size:90px;line-height:1;animation:liEmojiBounce 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.1s both;}
@keyframes liEmojiBounce{from{transform:scale(0) rotate(-20deg);opacity:0}to{transform:scale(1) rotate(0);opacity:1}}
.li-label{font-family:'Fredoka One',cursive!important;font-size:3.8rem;line-height:1;animation:liLabelIn 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.15s both;}
@keyframes liLabelIn{from{transform:translateY(20px) scaleX(0.5);opacity:0}to{transform:translateY(0) scaleX(1);opacity:1}}
.li-sub{font-size:1rem;font-weight:700;color:rgba(255,255,255,0.9);}
.li-bar-wrap{width:220px;height:6px;background:rgba(255,255,255,0.12);border-radius:50px;overflow:hidden;margin-top:10px;}
.li-bar{height:100%;width:0%;border-radius:50px;animation:liBarFill 1.6s cubic-bezier(0.4,0,0.2,1) 0.4s forwards;}
@keyframes liBarFill{to{width:100%}}
.li-go{font-family:'Fredoka One',cursive!important;font-size:3rem;opacity:0;transform:scale(0.3);transition:all 0.4s cubic-bezier(0.34,1.56,0.64,1);margin-top:4px;}
.li-go-visible{opacity:1!important;transform:scale(1)!important;}

.ach-popup-overlay{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:10000;background:rgba(0,0,0,0);animation:achBgIn 0.3s ease forwards;cursor:pointer;}
@keyframes achBgIn{to{background:rgba(0,0,0,0.6)}}
.ach-popup-out{animation:achBgOut 0.5s ease forwards;}
@keyframes achBgOut{to{opacity:0;transform:scale(0.95)}}
.ach-popup{position:relative;border-radius:28px;padding:36px 42px 28px;max-width:340px;width:90%;text-align:center;border:1px solid rgba(255,255,255,0.1);overflow:hidden;animation:achCardIn 0.55s cubic-bezier(0.34,1.56,0.64,1);}
@keyframes achCardIn{from{transform:scale(0.4) translateY(50px);opacity:0}to{transform:scale(1) translateY(0);opacity:1}}
.ach-shine{position:absolute;top:-100%;left:-100%;width:60%;height:300%;background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.15) 50%,transparent 60%);animation:achShine 1.3s ease 0.25s forwards;pointer-events:none;}
@keyframes achShine{to{left:200%}}
.ach-rarity-label{display:inline-block;font-size:11px;font-weight:900;letter-spacing:2.5px;padding:3px 14px;border-radius:50px;border:1px solid;margin-bottom:16px;text-transform:uppercase;}
.ach-icon{font-size:64px;line-height:1;margin-bottom:12px;animation:achIconPop 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.2s both;}
@keyframes achIconPop{from{transform:scale(0) rotate(-25deg);opacity:0}to{transform:scale(1) rotate(0);opacity:1}}
.ach-unlocked-text{font-size:11px;font-weight:700;color:rgba(255,255,255,0.5);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px;}
.ach-title{font-family:'Fredoka One',cursive!important;font-size:2rem;line-height:1.15;margin-bottom:10px;}
.ach-desc{font-size:14px;font-weight:600;color:rgba(255,255,255,0.6);margin-bottom:16px;}
.ach-particles{position:absolute;inset:0;pointer-events:none;overflow:hidden;}
.ach-particle{position:absolute;bottom:0;width:7px;height:7px;border-radius:50%;animation:achParticleUp 1s ease forwards;opacity:0;}
@keyframes achParticleUp{0%{transform:translateY(0) scale(0);opacity:1}70%{transform:translateY(-90px) scale(1);opacity:0.9}100%{transform:translateY(-130px) scale(0.4);opacity:0}}
.ach-skip-btn{position:relative;z-index:10;padding:8px 22px;border:none;border-radius:50px;background:rgba(255,255,255,0.12);color:rgba(255,255,255,0.7);font-size:13px;font-weight:800;cursor:pointer;transition:background 0.2s,transform 0.15s;}
.ach-skip-btn:hover{background:rgba(255,255,255,0.25);transform:scale(1.05);}

.ach-section-header{font-family:'Fredoka One',cursive!important;font-size:0.95rem;letter-spacing:2px;padding:6px 12px;border-radius:8px;border:1px solid;margin:12px 0 6px;text-align:center;background:rgba(0,0,0,0.25);}
.ach-list-item{display:flex;align-items:center;gap:14px;border-radius:16px;padding:14px 16px;border:1px solid;margin-bottom:8px;transition:transform 0.2s;}
.ach-done:hover{transform:scale(1.02)}
.ach-li-icon{font-size:2rem;flex-shrink:0;width:44px;text-align:center;}
.ach-li-body{flex:1;text-align:left;}
.ach-li-title{font-family:'Fredoka One',cursive!important;font-size:1rem;margin-bottom:2px;}
.ach-li-desc{font-size:12px;font-weight:600;color:rgba(255,255,255,0.48);margin-bottom:4px;}
.ach-li-rarity{font-size:10px;font-weight:900;letter-spacing:1.5px;text-transform:uppercase;}
.ach-li-check{font-size:18px;color:#2ecc71;font-weight:900;flex-shrink:0;}

.level-up-popup{position:fixed;top:38%;left:50%;transform:translate(-50%,-50%);z-index:9998;text-align:center;pointer-events:none;animation:luIn 0.55s cubic-bezier(0.34,1.56,0.64,1),luOut 0.5s ease 2.9s forwards;}
.lu-glow-ring{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:260px;height:260px;border-radius:50%;border:3px solid rgba(46,204,113,0.5);animation:luRingExpand 3.4s ease forwards;pointer-events:none;}
@keyframes luRingExpand{0%{transform:translate(-50%,-50%) scale(0.2);opacity:1}100%{transform:translate(-50%,-50%) scale(2.2);opacity:0}}
.lu-badge{font-size:54px;animation:luSpin 0.65s cubic-bezier(0.34,1.56,0.64,1);display:block;filter:drop-shadow(0 0 18px rgba(46,204,113,0.9));}
.lu-title{font-family:'Fredoka One',cursive!important;font-size:3.4rem;color:#2ecc71;line-height:1;text-shadow:0 0 30px rgba(46,204,113,1),0 0 70px rgba(46,204,113,0.6);animation:luTitlePulse 0.7s ease 0.3s both;}
.lu-level{font-family:'Fredoka One',cursive!important;font-size:2rem;color:#fff;text-shadow:0 0 20px rgba(46,204,113,0.8);animation:luLevelIn 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.5s both;}
.lu-sub{font-size:1rem;font-weight:700;color:rgba(255,255,255,0.7);margin-top:4px;animation:luSubIn 0.4s ease 0.65s both;}
@keyframes luIn{from{opacity:0;transform:translate(-50%,-50%) scale(0.2) rotate(-10deg)}to{opacity:1;transform:translate(-50%,-50%) scale(1) rotate(0)}}
@keyframes luOut{to{opacity:0;transform:translate(-50%,-68%) scale(0.85)}}
@keyframes luSpin{from{transform:rotate(-360deg) scale(0)}to{transform:rotate(0deg) scale(1)}}
@keyframes luTitlePulse{0%{transform:scale(0.3);opacity:0}60%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}
@keyframes luLevelIn{from{transform:translateY(20px) scale(0.5);opacity:0}to{transform:translateY(0) scale(1);opacity:1}}
@keyframes luSubIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}

@keyframes comboMilestone{0%{transform:scale(0.5) rotate(-8deg);opacity:0.5;}40%{transform:scale(1.35) rotate(4deg);opacity:1;}65%{transform:scale(0.92) rotate(-2deg);}80%{transform:scale(1.08) rotate(1deg);}100%{transform:scale(1) rotate(0);}}
@keyframes sparkFly{0%{transform:translate(-50%,-50%) translate(0,0) scale(1);opacity:1;}100%{transform:translate(-50%,-50%) translate(var(--dx),var(--dy)) scale(0);opacity:0;}}
@keyframes comboExtinguish{0%{opacity:1;transform:scale(1);}30%{transform:scale(1.08) translateY(-4px);filter:brightness(1.5);}100%{opacity:0;transform:scale(0.6) translateY(-18px);filter:brightness(0.3) grayscale(1);}}
.combo-extinguish{animation:comboExtinguish 0.5s ease forwards !important;}
@keyframes xpLabelAnim{0%{opacity:0;transform:translate(-50%,8px) scale(0.7);}20%{opacity:1;transform:translate(-50%,-2px) scale(1.1);}60%{opacity:1;transform:translate(-50%,-18px) scale(1);}100%{opacity:0;transform:translate(-50%,-38px) scale(0.9);}}
@keyframes xpBarPulse{0%,100%{box-shadow:0 0 12px rgba(46,204,113,0.65);}50%{box-shadow:0 0 30px rgba(46,204,113,1),0 0 60px rgba(46,204,113,0.5);}}
.xp-bar-gaining{animation:xpBarPulse 0.6s ease infinite;}

.music-toggle-btn{padding:8px 16px;border-radius:50px;border:1px solid rgba(255,255,255,0.22);background:rgba(255,255,255,0.07);color:rgba(255,255,255,0.75);font-size:13px;font-weight:800;cursor:pointer;transition:background 0.2s,transform 0.15s;white-space:nowrap;}
.music-toggle-btn:hover{background:rgba(255,255,255,0.18);transform:scale(1.04);}

.player-avatar{cursor:pointer;transition:transform 0.2s,box-shadow 0.2s;}
.player-avatar:hover{transform:scale(1.12);box-shadow:0 0 0 3px rgba(46,204,113,0.5);}
.player-avatar::after{content:'✏️';position:absolute;font-size:10px;bottom:-2px;right:-2px;}

/* LEADERBOARD TABS */
.lb-tabs{display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-bottom:14px;}
.lb-tab{padding:7px 14px;border-radius:50px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.55);font-size:12px;font-weight:800;cursor:pointer;transition:all 0.2s;letter-spacing:0.5px;}
.lb-tab:hover{background:rgba(46,204,113,0.15);border-color:rgba(46,204,113,0.4);color:#2ecc71;}
#lb-list{max-height:55vh;overflow-y:auto;}
`;
document.head.appendChild(extraStyles);
