/**
 * decorations.js
 * Generates festival-specific inline SVG/HTML decorations.
 * Each exported function returns an HTML string inserted into #decoration-layer.
 * All decorations use pointer-events:none so they never block button clicks.
 */

/* ─── Helper: check reduced motion preference ─────────────────────────────── */
const reduced = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ─── HALLOWEEN ──────────────────────────────────────────────────────────── */
function halloween() {
  const pumpkins = Array.from({ length: 5 }, (_, i) => {
    const size = 40 + Math.random() * 30;
    const left = 5 + i * 20 + (Math.random() * 8 - 4);
    const delay = i * 0.5;
    return `<div class="deco-halloween-pumpkin" style="left:${left}%;font-size:${size}px;animation-delay:${delay}s">🎃</div>`;
  }).join("");

  const bats = Array.from({ length: 8 }, (_, i) => {
    const top = 10 + Math.random() * 60;
    const delay = i * 0.7;
    const size = 20 + Math.random() * 20;
    return `<div class="deco-bat" style="top:${top}%;font-size:${size}px;animation-delay:${delay}s">🦇</div>`;
  }).join("");

  const moon = `<div class="deco-moon">🌕</div>`;

  const spiders = Array.from({ length: 3 }, (_, i) => {
    const left = 10 + i * 35;
    return `<div class="deco-spider" style="left:${left}%">🕷️<div class="spider-web"></div></div>`;
  }).join("");

  return `<div class="deco-halloween">${moon}${pumpkins}${bats}${spiders}</div>`;
}

/* ─── DIWALI ─────────────────────────────────────────────────────────────── */
function diwali() {
  // Animated diyas with flickering flame effect using SVG
  const diyas = Array.from({ length: 7 }, (_, i) => {
    const delay = i * 0.3;
    return `
      <div class="deco-diya" style="animation-delay:${delay}s">
        <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true">
          <!-- Flame -->
          <ellipse cx="24" cy="12" rx="4" ry="8" fill="#FF4500" class="diya-flame" style="animation-delay:${delay}s"/>
          <ellipse cx="24" cy="14" rx="2.5" ry="5" fill="#FFD700" class="diya-flame-inner" style="animation-delay:${delay}s"/>
          <!-- Diya body -->
          <path d="M10 30 Q24 20 38 30 L34 40 Q24 44 14 40 Z" fill="#D2691E"/>
          <path d="M10 30 Q24 24 38 30" fill="none" stroke="#8B4513" stroke-width="1.5"/>
          <!-- Oil -->
          <ellipse cx="24" cy="30" rx="8" ry="3" fill="#FFD700" opacity="0.6"/>
          <!-- Wick -->
          <line x1="24" y1="27" x2="24" y2="20" stroke="#888" stroke-width="1.5"/>
        </svg>
      </div>`;
  }).join("");

  // Sparkles floating up
  const sparkles = Array.from({ length: 12 }, (_, i) => {
    const left = 5 + i * 8;
    const delay = i * 0.4;
    return `<div class="deco-sparkle" style="left:${left}%;animation-delay:${delay}s">✨</div>`;
  }).join("");

  // Rangoli border pattern (SVG)
  const rangoli = `
    <svg class="deco-rangoli" viewBox="0 0 1200 60" preserveAspectRatio="none" aria-hidden="true">
      ${Array.from({ length: 24 }, (_, i) => {
        const x = i * 50 + 25;
        const colors = ["#FFD700","#FF4500","#FF69B4","#9B59B6","#00CED1"];
        const c = colors[i % colors.length];
        return `<circle cx="${x}" cy="30" r="8" fill="${c}" opacity="0.7"/>
                <circle cx="${x}" cy="30" r="4" fill="white" opacity="0.8"/>
                <circle cx="${x+12}" cy="20" r="4" fill="${c}" opacity="0.5"/>
                <circle cx="${x-12}" cy="40" r="4" fill="${c}" opacity="0.5"/>`;
      }).join("")}
    </svg>`;

  return `<div class="deco-diwali">${rangoli}<div class="diya-row">${diyas}</div>${sparkles}</div>`;
}

/* ─── CHRISTMAS ──────────────────────────────────────────────────────────── */
function christmas() {
  const snowflakes = Array.from({ length: 20 }, (_, i) => {
    const left = i * 5;
    const delay = Math.random() * 5;
    const dur = 4 + Math.random() * 4;
    const size = 10 + Math.random() * 20;
    return `<div class="deco-snow" style="left:${left}%;font-size:${size}px;animation-duration:${dur}s;animation-delay:${delay}s">❄️</div>`;
  }).join("");

  const tree = `
    <div class="deco-tree">
      <svg width="80" height="120" viewBox="0 0 80 120" aria-hidden="true">
        <polygon points="40,5 70,45 55,45 65,75 50,75 60,105 20,105 30,75 15,75 25,45 10,45" fill="#1A6B1A"/>
        <rect x="35" y="105" width="10" height="12" fill="#8B4513"/>
        <!-- Baubles -->
        <circle cx="30" cy="55" r="5" fill="#CC0000"/>
        <circle cx="50" cy="65" r="4" fill="#FFD700"/>
        <circle cx="40" cy="85" r="5" fill="#CC0000"/>
        <circle cx="25" cy="90" r="4" fill="#FFD700"/>
        <circle cx="55" cy="88" r="4" fill="#CC0000"/>
        <!-- Star on top -->
        <polygon points="40,2 42,8 48,8 43,12 45,18 40,14 35,18 37,12 32,8 38,8" fill="#FFD700"/>
      </svg>
    </div>`;

  const santa = `<div class="deco-santa">🎅</div>`;

  const stars = Array.from({ length: 8 }, (_, i) => {
    const left = 5 + i * 13;
    const top = 5 + Math.random() * 15;
    const delay = i * 0.6;
    return `<div class="deco-star" style="left:${left}%;top:${top}%;animation-delay:${delay}s">⭐</div>`;
  }).join("");

  return `<div class="deco-christmas">${snowflakes}${tree}${santa}${stars}</div>`;
}

/* ─── NEW YEAR ───────────────────────────────────────────────────────────── */
function newYear() {
  // Fireworks bursts
  const fireworks = Array.from({ length: 6 }, (_, i) => {
    const left = 5 + i * 17;
    const delay = i * 0.8;
    const colors = ["#FFD700","#FF69B4","#00CED1","#FF4500","#9B59B6","#FFD700"];
    const color = colors[i];
    return `
      <div class="deco-firework" style="left:${left}%;animation-delay:${delay}s">
        <svg width="60" height="60" viewBox="0 0 60 60" aria-hidden="true">
          ${Array.from({ length: 12 }, (_, j) => {
            const angle = j * 30;
            const r = angle * Math.PI / 180;
            const x2 = 30 + 25 * Math.cos(r);
            const y2 = 30 + 25 * Math.sin(r);
            return `<line x1="30" y1="30" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="2" opacity="0.9"/>
                    <circle cx="${x2}" cy="${y2}" r="3" fill="${color}"/>`;
          }).join("")}
          <circle cx="30" cy="30" r="5" fill="${color}"/>
        </svg>
      </div>`;
  }).join("");

  const confetti = Array.from({ length: 30 }, (_, i) => {
    const left = i * 3.3;
    const delay = Math.random() * 3;
    const colors = ["#FFD700","#FF69B4","#00CED1","#FF4500","#9B59B6","#C0C0C0"];
    const color = colors[i % colors.length];
    const size = 6 + Math.random() * 8;
    return `<div class="deco-confetti" style="left:${left}%;width:${size}px;height:${size}px;background:${color};animation-delay:${delay}s"></div>`;
  }).join("");

  const banner = `<div class="deco-newyear-banner">✨ Happy New Year 2027! ✨</div>`;

  return `<div class="deco-newyear">${fireworks}${confetti}${banner}</div>`;
}

/* ─── MAKAR SANKRANTI ────────────────────────────────────────────────────── */
function makarSankranti() {
  const kiteColors = [
    ["#FF4500","#FFD700"],["#1E90FF","#FFFFFF"],["#32CD32","#FF69B4"],
    ["#9B59B6","#F7C31C"],["#CC0000","#00CED1"],
  ];

  const kites = kiteColors.map(([c1, c2], i) => {
    const left = 5 + i * 20;
    const top = 5 + (i % 3) * 15;
    const delay = i * 1.2;
    return `
      <div class="deco-kite" style="left:${left}%;top:${top}%;animation-delay:${delay}s">
        <svg width="50" height="60" viewBox="0 0 50 60" aria-hidden="true">
          <!-- Kite diamond shape -->
          <polygon points="25,2 48,22 25,45 2,22" fill="${c1}" stroke="${c2}" stroke-width="2"/>
          <line x1="25" y1="2" x2="25" y2="45" stroke="${c2}" stroke-width="1.5" opacity="0.7"/>
          <line x1="2" y1="22" x2="48" y2="22" stroke="${c2}" stroke-width="1.5" opacity="0.7"/>
          <!-- Kite tail -->
          <path d="M25 45 Q30 50 25 55 Q20 58 25 60" fill="none" stroke="${c2}" stroke-width="2"/>
          <!-- Bow ties on tail -->
          <ellipse cx="27" cy="52" rx="4" ry="2" fill="${c1}" transform="rotate(-10 27 52)"/>
        </svg>
      </div>`;
  }).join("");

  const clouds = Array.from({ length: 4 }, (_, i) => {
    const left = i * 25;
    return `
      <div class="deco-cloud" style="left:${left}%">
        <svg width="80" height="40" viewBox="0 0 80 40" aria-hidden="true">
          <ellipse cx="40" cy="30" rx="35" ry="12" fill="white" opacity="0.8"/>
          <ellipse cx="30" cy="22" rx="18" ry="14" fill="white" opacity="0.8"/>
          <ellipse cx="52" cy="24" rx="16" ry="12" fill="white" opacity="0.8"/>
        </svg>
      </div>`;
  }).join("");

  const strings = kiteColors.map((_, i) => {
    const left = 5 + i * 20 + 2.5;
    return `<div class="deco-kite-string" style="left:${left}%"></div>`;
  }).join("");

  return `<div class="deco-sankranti">${clouds}${kites}${strings}</div>`;
}

/* ─── REPUBLIC DAY ───────────────────────────────────────────────────────── */
function republicDay() {
  // Tricolor stripes
  const stripes = `
    <div class="deco-tricolor">
      <div class="tricolor-stripe" style="background:#FF9933"></div>
      <div class="tricolor-stripe" style="background:#FFFFFF"></div>
      <div class="tricolor-stripe" style="background:#138808"></div>
    </div>`;

  // Ashoka Chakra (spinning wheel)
  const chakra = `
    <div class="deco-chakra">
      <svg class="chakra-spin" width="100" height="100" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="45" fill="none" stroke="#000080" stroke-width="3"/>
        <circle cx="50" cy="50" r="6" fill="#000080"/>
        ${Array.from({ length: 24 }, (_, i) => {
          const angle = (i * 15) * Math.PI / 180;
          const x1 = 50 + 6 * Math.cos(angle);
          const y1 = 50 + 6 * Math.sin(angle);
          const x2 = 50 + 44 * Math.cos(angle);
          const y2 = 50 + 44 * Math.sin(angle);
          return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#000080" stroke-width="1.5"/>`;
        }).join("")}
      </svg>
    </div>`;

  const flag = `<div class="deco-flag">🇮🇳</div>`;

  return `<div class="deco-republic">${stripes}${chakra}${flag}</div>`;
}

/* ─── VALENTINE'S DAY ────────────────────────────────────────────────────── */
function valentines() {
  const hearts = Array.from({ length: 15 }, (_, i) => {
    const left = i * 7;
    const delay = Math.random() * 4;
    const dur = 4 + Math.random() * 3;
    const size = 16 + Math.random() * 24;
    const emojis = ["❤️","💕","💖","💗","💝","🌹"];
    const e = emojis[i % emojis.length];
    return `<div class="deco-heart" style="left:${left}%;font-size:${size}px;animation-duration:${dur}s;animation-delay:${delay}s">${e}</div>`;
  }).join("");

  const roses = Array.from({ length: 4 }, (_, i) => {
    const left = 10 + i * 25;
    return `<div class="deco-rose" style="left:${left}%">🌹</div>`;
  }).join("");

  return `<div class="deco-valentines">${hearts}${roses}</div>`;
}

/* ─── EID ────────────────────────────────────────────────────────────────── */
function eid() {
  // Crescent moon
  const moon = `
    <div class="deco-crescent">
      <svg width="80" height="80" viewBox="0 0 80 80" aria-hidden="true">
        <path d="M60 40 A20 20 0 1 1 40 20 A30 30 0 0 0 60 40Z" fill="#FFD700"/>
        <circle cx="55" cy="20" r="4" fill="#FFD700"/>
        <circle cx="65" cy="30" r="3" fill="#FFD700"/>
        <circle cx="58" cy="12" r="2.5" fill="#FFD700"/>
      </svg>
    </div>`;

  const stars = Array.from({ length: 12 }, (_, i) => {
    const left = i * 9;
    const top = 5 + Math.random() * 20;
    const delay = i * 0.5;
    const size = 10 + Math.random() * 16;
    return `<div class="deco-eid-star" style="left:${left}%;top:${top}%;font-size:${size}px;animation-delay:${delay}s">⭐</div>`;
  }).join("");

  // Hanging lanterns
  const lanterns = Array.from({ length: 5 }, (_, i) => {
    const left = 8 + i * 20;
    const delay = i * 0.4;
    const colors = ["#FFD700","#FF4500","#FF69B4","#00CED1","#9B59B6"];
    const c = colors[i];
    return `
      <div class="deco-lantern" style="left:${left}%;animation-delay:${delay}s">
        <svg width="30" height="50" viewBox="0 0 30 50" aria-hidden="true">
          <line x1="15" y1="0" x2="15" y2="8" stroke="#FFD700" stroke-width="2"/>
          <ellipse cx="15" cy="13" rx="8" ry="4" fill="${c}"/>
          <rect x="7" y="13" width="16" height="22" rx="8" fill="${c}" opacity="0.9"/>
          <ellipse cx="15" cy="35" rx="8" ry="4" fill="${c}"/>
          <!-- Light glow -->
          <ellipse cx="15" cy="24" rx="5" ry="7" fill="white" opacity="0.3"/>
          <line x1="15" y1="38" x2="15" y2="50" stroke="${c}" stroke-width="2"/>
        </svg>
      </div>`;
  }).join("");

  // Mosque silhouette
  const mosque = `
    <div class="deco-mosque">
      <svg width="150" height="80" viewBox="0 0 150 80" aria-hidden="true">
        <rect x="10" y="40" width="130" height="40" fill="#006400" opacity="0.8"/>
        <!-- Main dome -->
        <ellipse cx="75" cy="40" rx="30" ry="30" fill="#006400" opacity="0.9"/>
        <!-- Side domes -->
        <ellipse cx="30" cy="52" rx="18" ry="18" fill="#006400" opacity="0.8"/>
        <ellipse cx="120" cy="52" rx="18" ry="18" fill="#006400" opacity="0.8"/>
        <!-- Minarets -->
        <rect x="5" y="20" width="8" height="40" fill="#004C00"/>
        <ellipse cx="9" cy="20" rx="4" ry="6" fill="#006400"/>
        <rect x="137" y="20" width="8" height="40" fill="#004C00"/>
        <ellipse cx="141" cy="20" rx="4" ry="6" fill="#006400"/>
        <!-- Crescent on top -->
        <path d="M78 15 A6 6 0 1 1 72 10 A8 8 0 0 0 78 15Z" fill="#FFD700"/>
        <circle cx="78" cy="8" r="1.5" fill="#FFD700"/>
      </svg>
    </div>`;

  return `<div class="deco-eid">${moon}${stars}${lanterns}${mosque}</div>`;
}

/* ─── HOLI ───────────────────────────────────────────────────────────────── */
function holi() {
  const splashColors = ["#FF1493","#FF8C00","#00CED1","#9B59B6","#FFD700","#32CD32","#FF4500","#FF69B4"];

  const splashes = Array.from({ length: 12 }, (_, i) => {
    const left = i * 8.5;
    const top = Math.random() * 60;
    const color = splashColors[i % splashColors.length];
    const size = 60 + Math.random() * 60;
    const delay = i * 0.4;
    return `
      <div class="deco-splash" style="left:${left}%;top:${top}%;animation-delay:${delay}s">
        <svg width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="30" fill="${color}" opacity="0.4"/>
          <circle cx="40" cy="40" r="15" fill="${color}" opacity="0.6"/>
          <circle cx="65" cy="35" r="10" fill="${color}" opacity="0.5"/>
          <circle cx="60" cy="65" r="12" fill="${color}" opacity="0.5"/>
          <circle cx="35" cy="65" r="8" fill="${color}" opacity="0.6"/>
        </svg>
      </div>`;
  }).join("");

  const pichkari = `<div class="deco-pichkari">🔫</div>`;

  const colorDots = Array.from({ length: 20 }, (_, i) => {
    const left = i * 5;
    const color = splashColors[i % splashColors.length];
    const size = 8 + Math.random() * 12;
    const delay = i * 0.2;
    return `<div class="deco-color-dot" style="left:${left}%;width:${size}px;height:${size}px;background:${color};animation-delay:${delay}s"></div>`;
  }).join("");

  return `<div class="deco-holi">${splashes}${pichkari}${colorDots}</div>`;
}

/* ─── GANESH CHATURTHI ───────────────────────────────────────────────────── */
function ganeshChaturthi() {
  // Marigold garland border
  const garland = `
    <svg class="deco-garland" viewBox="0 0 1200 60" preserveAspectRatio="none" aria-hidden="true">
      ${Array.from({ length: 30 }, (_, i) => {
        const x = i * 40 + 20;
        return `<circle cx="${x}" cy="30" r="12" fill="#FF6B00" opacity="0.8"/>
                <circle cx="${x}" cy="30" r="7" fill="#FFD700" opacity="0.9"/>
                <circle cx="${x+8}" cy="20" r="6" fill="#FF6B00" opacity="0.6"/>
                <circle cx="${x-8}" cy="40" r="6" fill="#FFD700" opacity="0.6"/>`;
      }).join("")}
    </svg>`;

  // Lotus flowers
  const lotuses = Array.from({ length: 4 }, (_, i) => {
    const left = 10 + i * 25;
    return `
      <div class="deco-lotus" style="left:${left}%">
        <svg width="60" height="60" viewBox="0 0 60 60" aria-hidden="true">
          <!-- Petals -->
          ${Array.from({ length: 8 }, (_, j) => {
            const angle = (j * 45) * Math.PI / 180;
            const cx = 30 + 20 * Math.cos(angle);
            const cy = 30 + 20 * Math.sin(angle);
            return `<ellipse cx="${cx}" cy="${cy}" rx="8" ry="14" fill="#FF6B00" opacity="0.8" transform="rotate(${j*45} ${cx} ${cy})"/>`;
          }).join("")}
          <circle cx="30" cy="30" r="10" fill="#FFD700"/>
        </svg>
      </div>`;
  }).join("");

  const modak = `<div class="deco-modak">🍬</div>`;
  const elephant = `<div class="deco-elephant">🐘</div>`;

  return `<div class="deco-ganesh">${garland}<div class="ganesh-symbols">${lotuses}${modak}${elephant}</div></div>`;
}

/* ─── DISPATCHER ─────────────────────────────────────────────────────────── */

const DECORATION_MAP = {
  halloween,
  diwali,
  christmas,
  "new-year": newYear,
  "makar-sankranti": makarSankranti,
  "republic-day": republicDay,
  valentines,
  eid,
  holi,
  "ganesh-chaturthi": ganeshChaturthi,
};

/**
 * Renders decorations for the given festival into #decoration-layer.
 * When reduced motion is preferred, decorations are shown but animations disabled.
 * @param {string|null} decorationType
 */
export function renderDecorations(decorationType) {
  const layer = document.getElementById("decoration-layer");
  if (!layer) return;

  if (!decorationType || !DECORATION_MAP[decorationType]) {
    layer.innerHTML = "";
    layer.className = "";
    return;
  }

  layer.innerHTML = DECORATION_MAP[decorationType]();
  layer.className = `active ${decorationType}`;

  // If user prefers reduced motion, add class to suppress animations
  if (reduced()) {
    layer.classList.add("reduced-motion");
  }
}
