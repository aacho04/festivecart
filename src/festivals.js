/**
 * festivals.js
 * Single source of truth for all festival configurations.
 *
 * To add a new festival, add one object to the FESTIVALS array.
 * No other file needs to change.
 *
 * Date format: "YYYY-MM-DD"
 * Lunar-calendar festivals are marked with // verify date — update them each year.
 */

export const FESTIVALS = [
  // ─── 1. HALLOWEEN ─────────────────────────────────────────────────────────
  {
    id: "halloween",
    name: "Halloween 🎃",
    startDate: "2026-10-29",
    endDate: "2026-10-31",
    colors: {
      primary: "#FF6B00",      // pumpkin orange
      secondary: "#1A1A2E",    // deep black
      accent: "#9B59B6",       // spooky purple
      background: "#0D0D0D",
      surface: "#1A1A1A",
      text: "#F5F5F5",
      textMuted: "#BBBBBB",
      buttonText: "#FFFFFF",
    },
    bannerMessage: "👻 Spooky Savings Are Here! BOO-nus discounts on every item!",
    heroHeadline: "Don't be scared of great deals! 🎃",
    heroSub: "Trick or treat yourself — special Halloween prices haunt every product.",
    offerText: "👻 10% off — use BOONOW",
    decoration: "halloween",
    productBadge: "🕷 Spooky Deal",
  },

  // ─── 2. DIWALI ────────────────────────────────────────────────────────────
  // verify date — lunar calendar, changes each year
  {
    id: "diwali",
    name: "Diwali 🪔",
    startDate: "2026-11-06",   // verify date
    endDate: "2026-11-10",     // verify date
    colors: {
      primary: "#FFD700",      // gold
      secondary: "#FF6B00",    // deep orange
      accent: "#FF4500",       // fire red
      background: "#0A0A2E",   // dark navy
      surface: "#12125A",
      text: "#FFD700",
      textMuted: "#FFA500",
      buttonText: "#0A0A2E",
    },
    bannerMessage: "🪔 Diwali Special — Light up your cart with golden deals!",
    heroHeadline: "Illuminate your life this Diwali! ✨",
    heroSub: "Festival of lights, festival of savings. Free gift-wrapping on all orders.",
    offerText: "🪔 15% off — use DIWALI2026",
    decoration: "diwali",
    productBadge: "✨ Diwali Pick",
  },

  // ─── 3. CHRISTMAS ─────────────────────────────────────────────────────────
  {
    id: "christmas",
    name: "Christmas 🎄",
    startDate: "2026-12-20",
    endDate: "2026-12-26",
    colors: {
      primary: "#CC0000",      // Christmas red
      secondary: "#1A6B1A",    // Christmas green
      accent: "#FFD700",       // gold star
      background: "#F9F5F0",
      surface: "#FFFFFF",
      text: "#1A1A1A",
      textMuted: "#555555",
      buttonText: "#FFFFFF",
    },
    bannerMessage: "🎅 Ho Ho Ho! Santa's deals have arrived — Free shipping on all gifts!",
    heroHeadline: "Merry Christmas! 🎄 Gifts for everyone on your list.",
    heroSub: "Spread the joy — 20% off sitewide. Order by Dec 23 for Christmas delivery.",
    offerText: "🎁 20% off — use HOHOHO",
    decoration: "christmas",
    productBadge: "🎁 Gift Idea",
  },

  // ─── 4. NEW YEAR ──────────────────────────────────────────────────────────
  {
    id: "new-year",
    name: "New Year 🎆",
    startDate: "2026-12-30",
    endDate: "2027-01-02",
    colors: {
      primary: "#FFD700",      // gold
      secondary: "#C0C0C0",    // silver
      accent: "#FF69B4",       // champagne pink
      background: "#0D0D1A",   // midnight black
      surface: "#1A1A33",
      text: "#FFD700",
      textMuted: "#C0C0C0",
      buttonText: "#0D0D1A",
    },
    bannerMessage: "🎆 New Year, New Deals! Countdown to massive savings!",
    heroHeadline: "Welcome 2027 with a bang! 🥂",
    heroSub: "New year, new you — Start fresh with our biggest sale of the year.",
    offerText: "🎉 25% off — use NEWYEAR27",
    decoration: "new-year",
    productBadge: "🎆 New Year Deal",
  },

  // ─── 5. MAKAR SANKRANTI ───────────────────────────────────────────────────
  // verify date — lunar calendar, changes each year
  {
    id: "makar-sankranti",
    name: "Makar Sankranti 🪁",
    startDate: "2027-01-13",   // verify date
    endDate: "2027-01-15",     // verify date
    colors: {
      primary: "#F7C31C",      // kite yellow
      secondary: "#1E90FF",    // sky blue
      accent: "#FF6347",       // bright red
      background: "#E8F4FD",   // pale sky
      surface: "#FFFFFF",
      text: "#1A1A1A",
      textMuted: "#555555",
      buttonText: "#FFFFFF",
    },
    bannerMessage: "🪁 Uttarayan! Let your savings soar as high as the kites!",
    heroHeadline: "Kai Po Che! 🪁 Catch the best deals this Sankranti!",
    heroSub: "Celebrate the harvest festival with colorful discounts across the store.",
    offerText: "🪁 12% off — use KITEUP",
    decoration: "makar-sankranti",
    productBadge: "🪁 Sankranti Deal",
  },

  // ─── 6. REPUBLIC DAY ──────────────────────────────────────────────────────
  {
    id: "republic-day",
    name: "Republic Day 🇮🇳",
    startDate: "2027-01-24",
    endDate: "2027-01-26",
    colors: {
      primary: "#FF9933",      // saffron
      secondary: "#138808",    // India green
      accent: "#000080",       // navy blue (Ashoka chakra)
      background: "#FAFAFA",
      surface: "#FFFFFF",
      text: "#1A1A1A",
      textMuted: "#555555",
      buttonText: "#FFFFFF",
    },
    bannerMessage: "🇮🇳 Jai Hind! Happy Republic Day — Celebrating 78 years of democracy!",
    heroHeadline: "Proud to be Indian! 🇮🇳 Republic Day Sale is here.",
    heroSub: "Unite in savings — tricolor deals for every Indian household.",
    offerText: "🇮🇳 26% off — use JAIHIND",
    decoration: "republic-day",
    productBadge: "🇮🇳 Republic Deal",
  },

  // ─── 7. VALENTINE'S DAY ───────────────────────────────────────────────────
  {
    id: "valentines",
    name: "Valentine's Day 💕",
    startDate: "2027-02-12",
    endDate: "2027-02-14",
    colors: {
      primary: "#E91E8C",      // hot pink
      secondary: "#C0392B",    // deep red
      accent: "#FFB6C1",       // light pink
      background: "#FFF0F3",
      surface: "#FFFFFF",
      text: "#2D0A14",
      textMuted: "#7B3041",
      buttonText: "#FFFFFF",
    },
    bannerMessage: "💕 Love is in the air — and so are amazing Valentine's deals!",
    heroHeadline: "Show your love with the perfect gift! 💝",
    heroSub: "Roses are red, violets are blue, here's 20% off, just for you two.",
    offerText: "💕 20% off — use LOVEYOU",
    decoration: "valentines",
    productBadge: "💝 Valentine's Gift",
  },

  // ─── 8. EID AL-FITR ───────────────────────────────────────────────────────
  // verify date — lunar calendar, changes each year
  {
    id: "eid",
    name: "Eid al-Fitr 🌙",
    startDate: "2027-03-09",   // verify date
    endDate: "2027-03-11",     // verify date
    colors: {
      primary: "#FFD700",      // gold
      secondary: "#006400",    // deep green
      accent: "#7CFC00",       // light green
      background: "#0A1A0A",   // very dark green
      surface: "#0F2A0F",
      text: "#FFD700",
      textMuted: "#90EE90",
      buttonText: "#0A1A0A",
    },
    bannerMessage: "🌙 Eid Mubarak! May your celebrations be as bright as the crescent moon.",
    heroHeadline: "Eid Mubarak! 🌙 Celebrate with our special collection.",
    heroSub: "Spread joy and blessings this Eid — special gifts for every occasion.",
    offerText: "🌙 18% off — use EIDMUBARAK",
    decoration: "eid",
    productBadge: "🌙 Eid Special",
  },

  // ─── 9. HOLI ──────────────────────────────────────────────────────────────
  // verify date — lunar calendar, changes each year
  {
    id: "holi",
    name: "Holi 🎨",
    startDate: "2027-03-21",   // verify date
    endDate: "2027-03-23",     // verify date
    colors: {
      primary: "#FF1493",      // deep pink
      secondary: "#FF8C00",    // orange
      accent: "#00CED1",       // teal
      background: "#FFF8E7",   // warm white
      surface: "#FFFFFF",
      text: "#1A0A2E",
      textMuted: "#555555",
      buttonText: "#FFFFFF",
    },
    bannerMessage: "🎨 Happy Holi! Splash into colorful savings — Bura na maano, Holi hai!",
    heroHeadline: "Play Holi with colors and savings! 🎨",
    heroSub: "Life's too short for boring shopping — add some color to your cart!",
    offerText: "🎨 15% off — use HOLIHAI",
    decoration: "holi",
    productBadge: "🎨 Holi Pick",
  },

  // ─── 10. GANESH CHATURTHI ─────────────────────────────────────────────────
  // verify date — lunar calendar, changes each year
  {
    id: "ganesh-chaturthi",
    name: "Ganesh Chaturthi 🐘",
    startDate: "2027-09-04",   // verify date
    endDate: "2027-09-14",     // verify date
    colors: {
      primary: "#FF6B00",      // marigold orange
      secondary: "#CC0000",    // deep red
      accent: "#FFD700",       // gold
      background: "#FFF5E6",
      surface: "#FFFFFF",
      text: "#2D1A00",
      textMuted: "#7A4000",
      buttonText: "#FFFFFF",
    },
    bannerMessage: "🐘 Ganpati Bappa Morya! Celebrate with our festive collection.",
    heroHeadline: "Ganpati Bappa Morya! 🐘 Bring prosperity home.",
    heroSub: "May Ganesha bless your cart — modak-sweet deals on every product.",
    offerText: "🐘 11% off — use BAPPAMORYA",
    decoration: "ganesh-chaturthi",
    productBadge: "🐘 Festival Pick",
  },
];

/**
 * Returns the festival active on the given date, or null if none.
 * @param {Date} date
 * @returns {object|null}
 */
export function getActiveFestival(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const dateStr = `${y}-${m}-${d}`;

  return (
    FESTIVALS.find((f) => dateStr >= f.startDate && dateStr <= f.endDate) ??
    null
  );
}

