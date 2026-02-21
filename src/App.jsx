import { useState, useEffect, useCallback, useMemo } from "react";

// ═══════════════════════════════════════════════════════════════
// TOM'S TRAVEL COMPANION
// ═══════════════════════════════════════════════════════════════
// ⚡ EDIT THESE PLACEHOLDERS to match Tom's actual details
// ═══════════════════════════════════════════════════════════════

// ── LOCATION CONFIG ──────────────────────────────────────────
const HOME_POSTCODE = "GU7 1LW";           // Tom's home postcode (Godalming)
const SCHOOL_STATION = "Woking";            // Nearest station to college
const SCHOOL_STATION_CODE = "WOK";          // National Rail CRS code
const SCHOOL_NAME = "Woking College";       // College name
const WX_LAT = 51.1854;                    // Weather latitude (Godalming)
const WX_LON = -0.6127;                    // Weather longitude

// ── GEOLOCATION ────────────────────────────────────────────
const HOME_LAT = 51.186;
const HOME_LON = -0.613;
const COLLEGE_LAT = 51.319;
const COLLEGE_LON = -0.556;

// ── HOME STATIONS (both shown in combined train list) ────────
const HOME_STATIONS = {
  GOD: { name: "Godalming", code: "GOD", bikeMi: 2.5, bikeMins: 12 },
  FNC: { name: "Farncombe", code: "FNC", bikeMi: 1.5, bikeMins: 8 },
};
const DEFAULT_HOME_STATION = "GOD";

// ── RUBY'S (SANDHURST, BERKSHIRE) ─────────────────────
const RUBY_NAME = "Ruby";
const RUBY_POSTCODE = "GU47 9AG";
const RUBY_STATION = "Sandhurst";
const RUBY_STATION_CODE = "SND";
const RUBY_LAT = 51.348;
const RUBY_LON = -0.801;
const BIKE_STN_RUBY = { mi: 1.2, mins: 8 }; // Sandhurst station → Green Lane
const SUNDAY_LEAVE_RUBY = "19:00"; // Tom aims to leave Ruby's ~7pm Sunday

// ── SAFETY CONTACT ──────────────────────────────────────────
const SAFETY_CONTACT = "+447000000000"; // Replace with real number
const SAFETY_CONTACT_NAME = "Dad";

// ── SWR BIKE RULES ──────────────────────────────────────────
const SWR_BIKE_RULES = [
  { rule: "Full-size bikes allowed on all SWR services", icon: "\u2705" },
  { rule: "Peak restriction: no bikes on trains arriving London Waterloo 07:00-09:30", icon: "\u26A0\uFE0F" },
  { rule: "Peak restriction: no bikes departing Waterloo 16:00-19:00", icon: "\u26A0\uFE0F" },
  { rule: "Godalming/Woking route: no peak restrictions (non-London)", icon: "\u2705" },
  { rule: "Max 2 bikes per carriage (4 on newer trains)", icon: "\u2139\uFE0F" },
  { rule: "Folding bikes allowed at all times when folded", icon: "\u2705" },
  { rule: "E-bikes and cargo bikes not permitted", icon: "\u274C" },
  { rule: "Bikes must not block doors, aisles or vestibules", icon: "\u2139\uFE0F" },
];

// ── ROUTE DISTANCES ──────────────────────────────────────────
const BIKE_STN_SCHOOL = { mi: 1.0, mins: 6 };  // Woking station → Woking College
const TRAIN_MINS = 20;                           // Train journey time (via Guildford)
const BUF = 5;                                   // Buffer minutes

// ── TERM DATES ───────────────────────────────────────────────
const TERM_START = new Date(2026, 0, 5);   // 5 Jan 2026
const TERM_END = new Date(2026, 6, 17);    // 17 Jul 2026

// ═══════════════════════════════════════════════════════════════
// TIMETABLE — Thomas Ritzinger-Kimbell (24007585)
// Woking College — Tutor Group UALJPT25
// Senior Tutor: LTH · Personal Tutor: JPT
// ═══════════════════════════════════════════════════════════════
const TT = {
  1: {
    label: "Monday",
    sessions: [
      { time: "10:05-11:05", subj: "Cert in Sport & Physical Activity", teacher: "Dale S", room: "T08", pe: true, activity: "Sport", outdoor: true },
      { time: "12:40-13:10", subj: "Year 13 Tutor Group", teacher: "Pitt J", room: "P01" },
      { time: "15:05-16:00", subj: "A Level German Year 2", teacher: "Pitt J", room: "W77" },
    ],
    start: "10:05", end: "16:00",
  },
  2: {
    label: "Tuesday",
    sessions: [
      { time: "10:05-11:30", subj: "A Level German Year 2", teacher: "Pitt J", room: "W77" },
      { time: "11:40-12:40", subj: "BTEC Ext Cert in Business", teacher: "Brown J", room: "W51" },
      { time: "13:40-14:55", subj: "Cert in Sport & Physical Activity", teacher: "Dale S", room: "T08", pe: true, activity: "Sport", outdoor: true },
    ],
    start: "10:05", end: "14:55",
  },
  3: {
    label: "Wednesday",
    sessions: [
      { time: "08:45-10:00", subj: "BTEC Ext Cert in Business", teacher: "Brown J", room: "W51" },
    ],
    start: "08:45", end: "10:00",
  },
  4: {
    label: "Thursday",
    sessions: [
      { time: "08:45-10:00", subj: "Cert in Sport & Physical Activity", teacher: "Laker C", room: "T08", pe: true, activity: "Sport", outdoor: true },
      { time: "10:05-11:05", subj: "A Level German Year 2", teacher: "Pitt J", room: "W77" },
      { time: "13:40-14:55", subj: "BTEC Ext Cert in Business", teacher: "Mahmood S", room: "W51" },
    ],
    start: "08:45", end: "14:55",
  },
  5: {
    label: "Friday",
    sessions: [
      { time: "10:05-11:05", subj: "BTEC Ext Cert in Business", teacher: "Mahmood S", room: "W51" },
      { time: "11:40-12:40", subj: "Cert in Sport & Physical Activity", teacher: "Laker C", room: "T08", pe: true, activity: "Sport", outdoor: true },
    ],
    start: "10:05", end: "12:40",
  },
  6: { label: "Saturday", sessions: [], start: null, end: null },
  0: { label: "Sunday", sessions: [], start: null, end: null },
};

// ═══════════════════════════════════════════════════════════════
// AFTER-SCHOOL ACTIVITIES (optional — toggle on/off in app)
// ═══════════════════════════════════════════════════════════════
const AFTER_SCHOOL = {
  1: null,
  2: null,
  3: null,
  4: null,
  5: null,
  6: null,
  0: null,
};

// ═══════════════════════════════════════════════════════════════
// MUSCLE-BUILDING MEALS & RECIPES
// ═══════════════════════════════════════════════════════════════
const MEALS = {
  preWorkout: [
    { name: "Banana & Peanut Butter Toast", desc: "Wholemeal toast with peanut butter and sliced banana", protein: "8g", carbs: "45g", prep: "3 min", icon: "\uD83C\uDF4C" },
    { name: "Porridge with Berries", desc: "Oats with milk, honey, and mixed berries", protein: "12g", carbs: "50g", prep: "5 min", icon: "\uD83E\uDD63" },
    { name: "Greek Yoghurt & Granola", desc: "High-protein yoghurt with granola and fruit", protein: "15g", carbs: "35g", prep: "2 min", icon: "\uD83E\uDD5B" },
    { name: "Rice Cakes & Honey", desc: "Quick energy — rice cakes with honey and a banana", protein: "4g", carbs: "40g", prep: "2 min", icon: "\uD83C\uDF5A" },
  ],
  postWorkout: [
    { name: "Chicken Wrap", desc: "Grilled chicken, salad, and hummus in a tortilla wrap", protein: "30g", carbs: "40g", prep: "10 min", icon: "\uD83C\uDF2F" },
    { name: "Tuna Pasta", desc: "Wholemeal pasta with tuna, sweetcorn, and mayo", protein: "28g", carbs: "55g", prep: "15 min", icon: "\uD83C\uDF5D" },
    { name: "Protein Smoothie", desc: "Banana, milk, peanut butter, oats, and honey blended", protein: "20g", carbs: "45g", prep: "5 min", icon: "\uD83E\uDD64" },
    { name: "Egg & Cheese Bagel", desc: "Scrambled eggs with cheese on a toasted bagel", protein: "22g", carbs: "38g", prep: "8 min", icon: "\uD83E\uDD5A" },
  ],
  muscleBuilding: [
    { name: "Chicken Breast & Rice", desc: "Grilled chicken breast with rice and mixed veg — classic muscle fuel", protein: "40g", carbs: "55g", prep: "25 min", icon: "\uD83C\uDF57" },
    { name: "Beef Mince Bolognese", desc: "Lean beef mince bolognese with wholemeal spaghetti", protein: "35g", carbs: "60g", prep: "30 min", icon: "\uD83C\uDF5D" },
    { name: "Salmon & Sweet Potato", desc: "Baked salmon fillet with sweet potato wedges and greens", protein: "32g", carbs: "45g", prep: "30 min", icon: "\uD83D\uDC1F" },
    { name: "Eggs on Toast (4 eggs)", desc: "Scrambled or poached eggs on thick wholemeal toast", protein: "28g", carbs: "30g", prep: "10 min", icon: "\uD83C\uDF73" },
    { name: "Steak & Jacket Potato", desc: "Lean steak with jacket potato, butter, and side salad", protein: "38g", carbs: "50g", prep: "25 min", icon: "\uD83E\uDD69" },
    { name: "Turkey Chilli Con Carne", desc: "Lean turkey mince chilli with rice and kidney beans", protein: "36g", carbs: "55g", prep: "35 min", icon: "\uD83C\uDF36\uFE0F" },
  ],
  snacks: [
    { name: "Protein Bar", protein: "20g", icon: "\uD83C\uDF6B" },
    { name: "Handful of Nuts", protein: "6g", icon: "\uD83E\uDD5C" },
    { name: "Hard-boiled Eggs (2)", protein: "12g", icon: "\uD83E\uDD5A" },
    { name: "Glass of Milk", protein: "8g", icon: "\uD83E\uDD5B" },
    { name: "Beef Jerky", protein: "15g", icon: "\uD83E\uDD69" },
    { name: "Cheese & Apple", protein: "8g", icon: "\uD83E\uDDC0" },
    { name: "Cottage Cheese & Oatcakes", protein: "18g", icon: "\uD83E\uDDC0" },
    { name: "Peanut Butter on Celery", protein: "7g", icon: "\uD83E\uDD5C" },
  ],
};

// Pick a deterministic "meal of the day" based on date
const mealOfDay = (arr, date) => arr[Math.floor((date.getFullYear() * 366 + date.getMonth() * 31 + date.getDate())) % arr.length];

// ═══════════════════════════════════════════════════════════════
// GO LIFTING — gym slot detection & motivating quotes
// ═══════════════════════════════════════════════════════════════
const GYM_WORKOUT_MINS = 60;
const GYM_CHANGE_MINS = 15;
const EARLY_FINISH_H = 14; // last class before 2pm = early finish

const LIFT_QUOTES = [
  "Light weight baby! Time to get those gains.",
  "The only bad workout is the one you didn't do.",
  "Push harder than yesterday if you want a different tomorrow.",
  "Your muscles don't know the difference between Monday and Friday. Get after it.",
  "Be stronger than your excuses. Hit the gym.",
  "Discipline is choosing between what you want now and what you want most.",
  "Every rep counts. Make them all count.",
  "You don't have to be great to start, but you have to start to be great.",
  "The gym is calling. Don't let it go to voicemail.",
  "Pain is temporary. Pride is forever. Go lift.",
  "Time to build the body you've always wanted.",
  "No excuses. No shortcuts. Just hard work.",
  "Free period + gym = unstoppable combo.",
  "While others rest, you build. Get in there.",
];

const fmtMins = (totalMins) => {
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const getGymSlots = (sessions) => {
  const slots = [];
  if (!sessions.length) return slots;

  // Find gaps between sessions >= 60 min
  for (let i = 0; i < sessions.length - 1; i++) {
    const endStr = sessions[i].time.split("-")[1];
    const startStr = sessions[i + 1].time.split("-")[0];
    const endP = hm(endStr);
    const startP = hm(startStr);
    const gapMins = (startP.h * 60 + startP.m) - (endP.h * 60 + endP.m);
    if (gapMins >= 60) {
      const gymStart = endP.h * 60 + endP.m + GYM_CHANGE_MINS;
      const gymEnd = startP.h * 60 + startP.m - GYM_CHANGE_MINS;
      const gymDur = gymEnd - gymStart;
      if (gymDur >= 45) {
        slots.push({
          type: "gap",
          start: fmtMins(gymStart),
          end: fmtMins(gymEnd),
          mins: gymDur,
          afterClass: sessions[i].subj,
          beforeClass: sessions[i + 1].subj,
        });
      }
    }
  }

  // Early finish: last class ends before 2pm
  const lastEnd = sessions[sessions.length - 1].time.split("-")[1];
  const lastP = hm(lastEnd);
  const lastMins = lastP.h * 60 + lastP.m;
  if (lastMins < EARLY_FINISH_H * 60) {
    const gymStart = lastMins + GYM_CHANGE_MINS;
    const gymEnd = gymStart + GYM_WORKOUT_MINS;
    slots.push({
      type: "earlyFinish",
      start: fmtMins(gymStart),
      end: fmtMins(gymEnd),
      mins: GYM_WORKOUT_MINS,
      doneBy: fmtMins(gymEnd + GYM_CHANGE_MINS),
    });
  }

  return slots;
};

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
const HUXLEY = "https://national-rail-api.davwheat.dev";
const fmt = d => d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
const fmtDate = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const fmtShort = d => d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
const fmtLong = d => d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const addM = (d, m) => new Date(d.getTime() + m * 60000);
const diffM = (a, b) => Math.round((a - b) / 60000);
const hm = s => { const [h, m] = s.split(":").map(Number); return { h, m }; };
const makeT = (d, h, m) => { const x = new Date(d); x.setHours(h, m, 0, 0); return x; };
const parseTT = (s, ref) => { if (!s || s === "On time" || s === "Cancelled" || s === "Delayed") return null; const p = s.split(":").map(Number); if (p.length < 2 || isNaN(p[0]) || isNaN(p[1])) return null; const d = new Date(ref || new Date()); d.setHours(p[0], p[1], 0, 0); return d; };
const dayClone = (d, off = 0) => { const x = new Date(d); x.setDate(x.getDate() + off); x.setHours(0, 0, 0, 0); return x; };
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

function nextSchoolDay(from) {
  for (let i = 0; i < 8; i++) {
    const d = dayClone(from, i);
    if (d > TERM_END) return null;
    if (d < TERM_START && i === 0) continue;
    const tt = TT[d.getDay()];
    if (tt.sessions.length > 0) return d;
  }
  return null;
}

// Weather helpers
const wxD = c => ({ 0: "Clear", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast", 45: "Fog", 48: "Freezing fog", 51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle", 61: "Light rain", 63: "Rain", 65: "Heavy rain", 71: "Light snow", 73: "Snow", 75: "Heavy snow", 80: "Light showers", 81: "Showers", 82: "Heavy showers", 95: "Thunderstorm", 96: "T-storm + hail", 99: "Severe T-storm" }[c] || "—");
const wxI = c => { if (c === 0) return "\u2600\uFE0F"; if (c <= 3) return "\u26C5"; if (c <= 48) return "\uD83C\uDF2B\uFE0F"; if (c <= 65) return "\uD83C\uDF27\uFE0F"; if (c <= 75) return "\uD83C\uDF28\uFE0F"; if (c <= 82) return "\uD83C\uDF26\uFE0F"; return "\u26C8\uFE0F"; };

// ═══════════════════════════════════════════════════════════════
// CLOTHING ADVICE
// ═══════════════════════════════════════════════════════════════
const clothe = (t, rain, wind, dark) => {
  let k, l, i;
  if (t <= 0) { k = ["Heavy winter coat", "Thermal base layer", "Thick gloves", "Scarf & beanie", "Waterproof over-trousers", "Winter cycling gloves"]; l = "WRAP UP WARM"; i = "\uD83E\uDDE5"; }
  else if (t <= 5) { k = ["Warm jacket / puffer", "Hoodie underneath", "Gloves", "Beanie hat", "Thick trousers", "Layered socks"]; l = "LAYER UP"; i = "\uD83E\uDDE4"; }
  else if (t <= 10) { k = ["Light jacket or fleece", "Hoodie or jumper", "Jeans", "Trainers + socks"]; l = "BRING A JACKET"; i = "\uD83E\uDDE5"; }
  else if (t <= 15) { k = ["Light hoodie / long sleeve", "Jeans or joggers", "Trainers"]; l = "LIGHT LAYERS"; i = "\uD83D\uDC55"; }
  else if (t <= 20) { k = ["T-shirt", "Light trousers or shorts", "Trainers", "Sunglasses"]; l = "KEEP COOL"; i = "\uD83D\uDE0E"; }
  else { k = ["Light t-shirt", "Shorts", "Breathable shoes", "Sun cream!", "Water bottle"]; l = "STAY HYDRATED"; i = "\uD83D\uDD25"; }
  const e = [];
  if (rain) e.push("Waterproof jacket", "Mudguards on bike", "Waterproof bag cover", "Spare socks in bag");
  if (wind > 25) e.push("Windbreaker layer", "Secure hat", "Extra cycling time");
  if (dark) e.push("Hi-vis vest", "Bike lights charged", "Reflective strips");
  return { k, l, i, e };
};

// ═══════════════════════════════════════════════════════════════
// ACTIVITY SAFETY — weather-based tips for PE / sport
// ═══════════════════════════════════════════════════════════════
const actSafety = (activity, outdoor, temp, rain, wind, code) => {
  const tips = [];
  const warnings = [];

  // Kit for specific activities
  if (activity === "Football") { tips.push("Football boots & shin pads", "Spare socks"); }
  if (activity === "Rugby") { tips.push("Rugby boots & gumshield", "Headguard (if used)"); }
  if (activity === "Swimming") { tips.push("Swim kit, goggles & towel", "Swim cap (if needed)", "Plastic bag for wet kit", "Shower gel"); }
  if (activity === "Athletics") { tips.push("Running trainers", "Water bottle"); }

  if (outdoor) {
    if (rain) {
      warnings.push("Outdoor sport may be affected by rain");
      tips.push("Bring indoor kit as backup");
      if (activity === "Football" || activity === "Rugby") {
        tips.push("Studded boots for wet grass", "Full change of clothes for after");
      }
    }
    if (temp > 25) {
      warnings.push("High temperature \u2014 stay hydrated");
      tips.push("Sun cream (apply before PE)", "Extra water bottle", "Light breathable sportswear");
    }
    if (temp < 5) {
      warnings.push("Cold conditions \u2014 layer up for sport");
      tips.push("Thermal base layer under kit", "Warm layers for before/after", "Warm up properly");
    }
    if (wind > 30) {
      warnings.push("High winds may affect outdoor sport");
      tips.push("Activity may move indoors");
    }
    if (code >= 95) {
      warnings.push("Thunderstorm risk \u2014 outdoor sport likely cancelled");
      tips.push("Expect indoor alternative");
    }
    if (code >= 71 && code <= 75) {
      warnings.push("Snow \u2014 outdoor sport unlikely");
      tips.push("Indoor kit recommended");
    }
  }

  return { tips, warnings };
};

// ═══════════════════════════════════════════════════════════════
// TRAVEL SAFETY — weather-based tips for cycling
// ═══════════════════════════════════════════════════════════════
const travelSafety = (temp, rain, wind, dark, code) => {
  const tips = [];
  const warnings = [];

  if (rain) {
    warnings.push("Roads may be slippery");
    tips.push("Waterproof jacket", "Mudguards", "Waterproof bag cover", "Take care on corners");
  }
  if (dark) {
    warnings.push("Low visibility \u2014 be extra cautious");
    tips.push("Front & rear bike lights ON", "Hi-vis vest or jacket", "Reflective strips on bag");
  }
  if (temp < 3) {
    warnings.push("Risk of ice on roads");
    tips.push("Reduce speed on corners", "Allow extra time", "Consider walking instead");
  }
  if (wind > 30) {
    warnings.push("Strong winds \u2014 cycling may be harder");
    tips.push("Secure loose items", "Allow extra journey time");
  }
  if (code >= 95) {
    warnings.push("Thunderstorm \u2014 avoid cycling if possible");
    tips.push("Ask for a lift if you can");
  }
  if (code >= 71 && code <= 75) {
    warnings.push("Snow/ice \u2014 cycling NOT recommended");
    tips.push("Consider alternative transport");
  }
  if (tips.length === 0) {
    tips.push("Conditions look good for cycling");
  }

  return { tips, warnings };
};

// ═══════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════
const Pulse = ({ c = "#22c55e" }) => <span style={{ display: "inline-block", position: "relative", width: 10, height: 10, marginRight: 6 }}><span style={{ position: "absolute", inset: 0, borderRadius: "50%", backgroundColor: c, animation: "pulse 2s ease-in-out infinite" }} /><span style={{ position: "absolute", inset: -3, borderRadius: "50%", border: `2px solid ${c}`, animation: "pulsering 2s ease-in-out infinite", opacity: .4 }} /></span>;

const Badge = ({ s, children }) => {
  const c = { good: { bg: "#064e3b", bd: "#10b981", tx: "#6ee7b7" }, warning: { bg: "#78350f", bd: "#f59e0b", tx: "#fcd34d" }, danger: { bg: "#7f1d1d", bd: "#ef4444", tx: "#fca5a5" }, info: { bg: "#1e1b4b", bd: "#818cf8", tx: "#c7d2fe" } }[s] || { bg: "#1e1b4b", bd: "#818cf8", tx: "#c7d2fe" };
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: .5, backgroundColor: c.bg, border: `1px solid ${c.bd}`, color: c.tx, textTransform: "uppercase" }}>{s === "good" && <Pulse c={c.bd} />}{children}</span>;
};

const Card = ({ children, style, glow }) => <div className="ch" style={{ backgroundColor: "rgba(15,23,42,0.7)", backdropFilter: "blur(20px)", borderRadius: 16, border: "1px solid rgba(148,163,184,0.1)", padding: 20, boxShadow: glow ? `0 0 30px ${glow}` : "0 4px 20px rgba(0,0,0,0.3)", transition: "all .3s", ...style }}>{children}</div>;
const Lbl = ({ icon, children }) => <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "#818cf8", marginBottom: 12, textTransform: "uppercase" }}>{icon} {children}</div>;

const Toggle = ({ on, onToggle, label }) => (
  <div onClick={onToggle} style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "4px 10px", borderRadius: 20, backgroundColor: on ? "rgba(16,185,129,.12)" : "rgba(100,116,139,.08)", border: `1px solid ${on ? "rgba(16,185,129,.3)" : "rgba(100,116,139,.15)"}`, transition: "all .2s", userSelect: "none" }}>
    <div style={{ width: 32, height: 18, borderRadius: 9, backgroundColor: on ? "#10b981" : "#475569", position: "relative", transition: "all .2s" }}>
      <div style={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: "#fff", position: "absolute", top: 2, left: on ? 16 : 2, transition: "all .2s" }} />
    </div>
    <span style={{ fontSize: 11, fontWeight: 600, color: on ? "#6ee7b7" : "#94a3b8" }}>{label}</span>
  </div>
);

// ── Train key helper ─────────────────────────────────────────
const trainKey = (t) => `${t.stnKey}_${t.std}`;

// ═══════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════
export default function App() {
  const [now, setNow] = useState(new Date());
  const [wx, setWx] = useState(null);
  const [trainsGOD, setTrainsGOD] = useState({ to: [], from: [] });
  const [trainsFNC, setTrainsFNC] = useState({ to: [], from: [] });
  const [trainsSND, setTrainsSND] = useState({ toRuby: [], fromRuby: [] });
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRef, setLastRef] = useState(null);
  const [selTrain, setSelTrain] = useState(null);
  const [manualDir, setManualDir] = useState(null);
  const [manualDate, setManualDate] = useState(null);

  // Optional feature toggles
  const [showAfterSchool, setShowAfterSchool] = useState(true);
  const [showActivitySafety, setShowActivitySafety] = useState(true);
  const [showTravelSafety, setShowTravelSafety] = useState(true);
  const [showNutrition, setShowNutrition] = useState(true);

  // Geolocation
  const [userLoc, setUserLoc] = useState(null);
  const [locLabel, setLocLabel] = useState(null);

  // Arrived Safely
  const [safetyHistory, setSafetyHistory] = useState(() => JSON.parse(localStorage.getItem('ttc_safety') || '[]'));
  const [showSafetyConfirm, setShowSafetyConfirm] = useState(false);

  // Delay Repay
  const [delayRepayModal, setDelayRepayModal] = useState(null); // holds delay info object or null
  const [delayRepayHistory, setDelayRepayHistory] = useState(() => JSON.parse(localStorage.getItem('ttc_delayrep') || '[]'));
  const [delayRepayDismissed, setDelayRepayDismissed] = useState([]);

  // Timetable & Exam Upload
  const [customTT, setCustomTT] = useState(() => JSON.parse(localStorage.getItem('ttc_custom_tt') || 'null'));
  const [examTT, setExamTT] = useState(() => JSON.parse(localStorage.getItem('ttc_exams') || '[]'));
  const [showTTUpload, setShowTTUpload] = useState(false);
  const [showExamUpload, setShowExamUpload] = useState(false);
  const [uploadingTT, setUploadingTT] = useState(false);
  const [uploadingExam, setUploadingExam] = useState(false);

  // Railcard Savings
  const [costLog, setCostLog] = useState(() => JSON.parse(localStorage.getItem('ttc_costs') || '[]'));
  const [showCostEntry, setShowCostEntry] = useState(false);
  const [costInput, setCostInput] = useState('');

  // Commute Stats
  const [commuteLog, setCommuteLog] = useState(() => JSON.parse(localStorage.getItem('ttc_commute') || '[]'));

  // Bank Holidays
  const [bankHols, setBankHols] = useState([]);

  // Error states
  const [wxError, setWxError] = useState(false);
  const [trainError, setTrainError] = useState(false);

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const update = (pos) => {
      const { latitude, longitude } = pos.coords;
      setUserLoc({ lat: latitude, lon: longitude });
      const distHome = haversine(latitude, longitude, HOME_LAT, HOME_LON);
      const distCollege = haversine(latitude, longitude, COLLEGE_LAT, COLLEGE_LON);
      const distRuby = haversine(latitude, longitude, RUBY_LAT, RUBY_LON);
      if (distHome < 1) setLocLabel("At home");
      else if (distCollege < 1) setLocLabel("At college");
      else if (distRuby < 1) setLocLabel("At Ruby's");
      else if (distHome < distCollege && distHome < distRuby) setLocLabel("Near home");
      else if (distRuby < distCollege) setLocLabel("Near Ruby's");
      else setLocLabel("Near college");
    };
    navigator.geolocation.getCurrentPosition(update, () => {}, { enableHighAccuracy: false });
    const wid = navigator.geolocation.watchPosition(update, () => {}, { enableHighAccuracy: false, maximumAge: 60000 });
    return () => navigator.geolocation.clearWatch(wid);
  }, []);

  // ═══════════════════════════════════════════════════════════
  // SMART DATE + DIRECTION LOGIC
  // ═══════════════════════════════════════════════════════════
  const { planDate, dir, modeLabel, modeIcon } = useMemo(() => {
    if (manualDate !== null) {
      const md = manualDate;
      const d = manualDir || "to";
      return { planDate: md, dir: d, modeLabel: `Planning ${fmtShort(md)}`, modeIcon: "\uD83D\uDCC5" };
    }
    const today = dayClone(now);
    const todayTT = TT[today.getDay()];
    const hasClassToday = todayTT.sessions.length > 0 && today >= TERM_START && today <= TERM_END;
    const nowMins = now.getHours() * 60 + now.getMinutes();

    if (hasClassToday) {
      const startMins = hm(todayTT.start).h * 60 + hm(todayTT.start).m;
      const endMins = hm(todayTT.end).h * 60 + hm(todayTT.end).m;
      // Check if after-school extends the day
      const as = AFTER_SCHOOL[today.getDay()];
      // Account for gym sessions on early-finish days
      const todayGymSlots = getGymSlots(todayTT.sessions);
      const todayEarlyGym = todayGymSlots.find(s => s.type === "earlyFinish");
      const gymEndMins = todayEarlyGym ? (hm(todayEarlyGym.doneBy).h * 60 + hm(todayEarlyGym.doneBy).m) : endMins;
      const actualEndMins = (showAfterSchool && as) ? hm(as.time.split("-")[1]).h * 60 + hm(as.time.split("-")[1]).m : gymEndMins;

      const locDir = (locLabel === "At college" || locLabel === "Near college") ? "from" : "to";
      if (nowMins < startMins + 30) {
        return { planDate: today, dir: manualDir || locDir, modeLabel: "Morning \u2014 time to head to college", modeIcon: "\uD83C\uDF05" };
      }
      if (nowMins < actualEndMins) {
        return { planDate: today, dir: manualDir || (locLabel === "At home" || locLabel === "Near home" ? "to" : "from"), modeLabel: "At college \u2014 planning your trip home", modeIcon: "\uD83D\uDCDA" };
      }
      const nxt = nextSchoolDay(dayClone(now, 1));
      if (nxt) {
        const daysAway = Math.round((nxt - today) / 864e5);
        const when = daysAway === 1 ? "tomorrow" : `in ${daysAway} days`;
        return { planDate: nxt, dir: manualDir || "to", modeLabel: `Evening \u2014 next college ${when} (${DAYS[nxt.getDay()]})`, modeIcon: "\uD83C\uDF19" };
      }
    }

    const nxt = nextSchoolDay(dayClone(now, hasClassToday ? 1 : 0));
    if (nxt) {
      const daysAway = Math.round((nxt - today) / 864e5);
      const when = daysAway === 0 ? "today" : daysAway === 1 ? "tomorrow" : `in ${daysAway} days`;
      const timeOfDay = now.getHours() >= 17 ? "Evening" : now.getHours() >= 12 ? "Afternoon" : "Morning";
      return { planDate: nxt, dir: manualDir || "to", modeLabel: `${timeOfDay} \u2014 next college ${when} (${DAYS[nxt.getDay()]})`, modeIcon: "\uD83C\uDF19" };
    }
    return { planDate: today, dir: manualDir || "to", modeLabel: "Outside term dates", modeIcon: "\uD83C\uDFD6\uFE0F" };
  }, [now, manualDate, manualDir, showAfterSchool, locLabel]);

  const isToday = planDate.toDateString() === new Date().toDateString();
  const isFuture = !isToday;
  const tt = customTT ? (customTT[planDate.getDay()] || TT[planDate.getDay()]) : TT[planDate.getDay()];
  const hasClass = tt.sessions.length > 0;
  const inTerm = planDate >= TERM_START && planDate <= TERM_END;
  const isBankHol = bankHols.includes(planDate.toISOString().split('T')[0]) || bankHols.includes(fmtDate(planDate));

  // Live distance from current position to nearest station (bike ETA)
  const liveStationETA = useMemo(() => {
    if (!userLoc) return null;
    const godDist = haversine(userLoc.lat, userLoc.lon, 51.186, -0.611); // Godalming station
    const fncDist = haversine(userLoc.lat, userLoc.lon, 51.193, -0.607); // Farncombe station
    const nearest = godDist < fncDist ? { name: "Godalming", code: "GOD", dist: godDist } : { name: "Farncombe", code: "FNC", dist: fncDist };
    const bikeMinutes = Math.round(nearest.dist / 0.25); // ~15km/h average cycling = 0.25km/min
    const walkMinutes = Math.round(nearest.dist / 0.083); // ~5km/h walking = 0.083km/min
    return { ...nearest, bikeMinutes, walkMinutes };
  }, [userLoc]);
  const afterSchool = AFTER_SCHOOL[planDate.getDay()];
  const peSession = tt.sessions.find(s => s.pe);
  const dayActivities = [peSession, showAfterSchool ? afterSchool : null].filter(Boolean);

  // Go Lifting — detect gym opportunities
  const gymSlots = useMemo(() => hasClass ? getGymSlots(tt.sessions) : [], [planDate, hasClass]);
  const earlyFinishGym = gymSlots.find(s => s.type === "earlyFinish");
  const liftQuote = LIFT_QUOTES[Math.floor((planDate.getFullYear() * 366 + planDate.getMonth() * 31 + planDate.getDate())) % LIFT_QUOTES.length];

  // Effective end time (accounting for gym after early finish, or after-school)
  const effectiveEnd = (showAfterSchool && afterSchool)
    ? afterSchool.time.split("-")[1]
    : earlyFinishGym ? earlyFinishGym.doneBy : tt.end;

  // ═══════════════════════════════════════════════════════════
  // WEATHER + BIKE ADJUSTMENTS
  // ═══════════════════════════════════════════════════════════
  const fetchWx = useCallback(async () => {
    setWxError(false);
    const lat = userLoc?.lat || WX_LAT;
    const lon = userLoc?.lon || WX_LON;
    try { const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_gusts_10m&hourly=temperature_2m,precipitation_probability,weather_code&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max,weather_code&timezone=Europe/London&forecast_days=7`); setWx(await r.json()); } catch (e) { console.error(e); setWxError(true); }
  }, [userLoc]);

  const fetchTrains = useCallback(async () => {
    setTrainError(false);
    try {
      const [godTo, godFrom, fncTo, fncFrom] = await Promise.all([
        fetch(`${HUXLEY}/departures/GOD/to/${SCHOOL_STATION_CODE}/15?expand=true`),
        fetch(`${HUXLEY}/departures/${SCHOOL_STATION_CODE}/to/GOD/15?expand=true`),
        fetch(`${HUXLEY}/departures/FNC/to/${SCHOOL_STATION_CODE}/15?expand=true`),
        fetch(`${HUXLEY}/departures/${SCHOOL_STATION_CODE}/to/FNC/15?expand=true`),
      ]);
      const [godToD, godFromD, fncToD, fncFromD] = await Promise.all([godTo.json(), godFrom.json(), fncTo.json(), fncFrom.json()]);

      // Extract arrival time at destination from calling points
      const addArrival = (services, destCrs) => (services || []).map(s => {
        let arrTime = null;
        const points = s.subsequentCallingPoints?.[0]?.callingPoint;
        if (points) {
          const dest = points.find(p => p.crs === destCrs);
          if (dest) {
            arrTime = dest.et && dest.et !== "On time" && dest.et !== "Cancelled" && dest.et !== "Delayed" ? dest.et : dest.st;
          }
        }
        return { ...s, arrTime };
      });

      setTrainsGOD({ to: addArrival(godToD.trainServices, SCHOOL_STATION_CODE), from: addArrival(godFromD.trainServices, "GOD") });
      setTrainsFNC({ to: addArrival(fncToD.trainServices, SCHOOL_STATION_CODE), from: addArrival(fncFromD.trainServices, "FNC") });
      setAlerts(godToD.nrccMessages ? godToD.nrccMessages.map(m => typeof m === "string" ? m : m.value || "") : []);
      setLastRef(new Date());

      // Fetch Sandhurst (Ruby) trains
      try {
        const [wokSnd, sndGld] = await Promise.all([
          fetch(`${HUXLEY}/departures/${SCHOOL_STATION_CODE}/to/${RUBY_STATION_CODE}/10?expand=true`),
          fetch(`${HUXLEY}/departures/${RUBY_STATION_CODE}/to/GLD/10?expand=true`),
        ]);
        const [wokSndD, sndGldD] = await Promise.all([wokSnd.json(), sndGld.json()]);
        setTrainsSND({
          toRuby: addArrival(wokSndD.trainServices, RUBY_STATION_CODE),
          fromRuby: addArrival(sndGldD.trainServices, "GLD"),
        });
      } catch (e) { console.error("Sandhurst trains:", e); }
    } catch (e) { console.error(e); setTrainError(true); }
  }, []);

  useEffect(() => {
    (async () => { setLoading(true); await Promise.all([fetchWx(), fetchTrains()]); setLoading(false); })();
    const t1 = setInterval(fetchTrains, 60000), t2 = setInterval(fetchWx, 600000);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, [fetchWx, fetchTrains]);

  useEffect(() => setSelTrain(null), [planDate, dir]);

  useEffect(() => { localStorage.setItem('ttc_safety', JSON.stringify(safetyHistory)); }, [safetyHistory]);
  useEffect(() => { localStorage.setItem('ttc_delayrep', JSON.stringify(delayRepayHistory)); }, [delayRepayHistory]);
  useEffect(() => { localStorage.setItem('ttc_costs', JSON.stringify(costLog)); }, [costLog]);
  useEffect(() => { localStorage.setItem('ttc_commute', JSON.stringify(commuteLog)); }, [commuteLog]);
  useEffect(() => { if (customTT) localStorage.setItem('ttc_custom_tt', JSON.stringify(customTT)); }, [customTT]);
  useEffect(() => { localStorage.setItem('ttc_exams', JSON.stringify(examTT)); }, [examTT]);

  useEffect(() => {
    fetch('https://www.gov.uk/bank-holidays.json')
      .then(r => r.json())
      .then(d => {
        const dates = (d['england-and-wales']?.events || []).map(e => e.date);
        setBankHols(dates);
      })
      .catch(() => {});
  }, []);

  // Weather for plan date
  const daysFromNow = Math.round((planDate - dayClone(now)) / 864e5);
  const wxIdx = Math.min(Math.max(daysFromNow, 0), (wx?.daily?.temperature_2m_max?.length || 1) - 1);
  const curTemp = wx?.current?.temperature_2m ?? 10;
  const curWind = wx?.current?.wind_speed_10m ?? 0;
  const curGusts = wx?.current?.wind_gusts_10m ?? 0;
  const curCode = wx?.current?.weather_code ?? 0;
  const curPrecip = wx?.current?.precipitation ?? 0;
  const curRain = curPrecip > 0 || (curCode >= 51 && curCode <= 82);

  const pTemp = isFuture && wx?.daily ? Math.round(((wx.daily.temperature_2m_min?.[wxIdx] || 5) * 0.4 + (wx.daily.temperature_2m_max?.[wxIdx] || 15) * 0.6)) : curTemp;
  const pRain = isFuture && wx?.daily ? (wx.daily.precipitation_probability_max?.[wxIdx] || 0) > 30 : curRain;
  const pWxCode = isFuture && wx?.daily ? wx.daily.weather_code?.[wxIdx] ?? 0 : curCode;
  const pDark = (() => { const si = wx?.daily?.sunrise?.[wxIdx]; if (!si) return true; return new Date(si).getHours() >= 8; })();

  const bikeAdj = (pRain ? 3 : 0) + (curWind > 30 ? 5 : curWind > 20 ? 3 : 0);
  const bSS = BIKE_STN_SCHOOL.mins + Math.ceil(bikeAdj / 2);
  const clothing = clothe(pTemp, pRain, curWind, pDark);

  // Safety calculations
  const tSafety = travelSafety(pTemp, pRain, curWind, pDark, pWxCode);
  const aSafety = peSession ? actSafety(peSession.activity, peSession.outdoor, pTemp, pRain, curWind, pWxCode) : { tips: [], warnings: [] };
  const asAfterSafety = (showAfterSchool && afterSchool) ? actSafety(afterSchool.activity, afterSchool.outdoor, pTemp, pRain, curWind, pWxCode) : { tips: [], warnings: [] };

  // Weekend at Ruby's (must be after bSS is defined)
  const isFriday = planDate.getDay() === 5;
  const isSaturday = planDate.getDay() === 6;
  const isSunday = planDate.getDay() === 0;
  const isWeekendRuby = isFriday || isSaturday || isSunday;

  const rubyToTrain = useMemo(() => {
    if (!isFriday || !hasClass) return null;
    // After college finishes (with gym if applicable), find first train WOK → SND
    const collegeEndTime = makeT(planDate, hm(effectiveEnd).h, hm(effectiveEnd).m);
    const readyAtStation = addM(collegeEndTime, bSS + BUF);
    for (const t of (trainsSND.toRuby || [])) {
      if (t.etd === "Cancelled") continue;
      const dep = parseTT(t.std, planDate);
      if (!dep) continue;
      if (dep >= readyAtStation) return t;
    }
    return (trainsSND.toRuby || []).find(t => t.etd !== "Cancelled") || null;
  }, [isFriday, hasClass, effectiveEnd, trainsSND, planDate, bSS]);

  const rubyFromTrain = useMemo(() => {
    if (!isSunday) return null;
    // Leave Ruby's at ~7pm, bike 8min to station, find first train after
    const leaveTime = makeT(planDate, 19, 0);
    const atStation = addM(leaveTime, BIKE_STN_RUBY.mins + BUF);
    for (const t of (trainsSND.fromRuby || [])) {
      if (t.etd === "Cancelled") continue;
      const dep = parseTT(t.std, planDate);
      if (!dep) continue;
      if (dep >= atStation) return t;
    }
    return (trainsSND.fromRuby || []).find(t => t.etd !== "Cancelled") || null;
  }, [isSunday, trainsSND, planDate]);

  // ═══════════════════════════════════════════════════════════
  // JOURNEY CALCULATIONS — Combined train list from both stations
  // ═══════════════════════════════════════════════════════════

  // Merge trains from both home stations into one sorted list
  const allTrains = useMemo(() => {
    const godT = dir === "to" ? trainsGOD.to : trainsGOD.from;
    const fncT = dir === "to" ? trainsFNC.to : trainsFNC.from;
    const merged = [
      ...godT.map(t => ({ ...t, stnKey: "GOD" })),
      ...fncT.map(t => ({ ...t, stnKey: "FNC" })),
    ].sort((a, b) => {
      const ta = parseTT(a.std, planDate);
      const tb = parseTT(b.std, planDate);
      return (ta || 0) - (tb || 0);
    });
    return merged;
  }, [dir, trainsGOD, trainsFNC, planDate]);

  const arriveByStr = tt.start || "08:45";
  const finishStr = effectiveEnd || "15:15";
  const arriveBy = (() => { const p = hm(arriveByStr); return makeT(planDate, p.h, p.m); })();
  const finishAt = (() => { const p = hm(finishStr); return makeT(planDate, p.h, p.m); })();

  // Auto-select best train from combined list
  const autoTrain = useMemo(() => {
    if (dir === "to") {
      let best = null;
      for (const t of allTrains) {
        if (t.etd === "Cancelled") continue;
        const dep = parseTT(t.std, planDate);
        if (!dep) continue;
        if (isToday) {
          const bikeToStn = HOME_STATIONS[t.stnKey].bikeMins + bikeAdj;
          if (addM(now, bikeToStn + BUF) > dep) continue;
        }
        const arrDest = t.arrTime ? parseTT(t.arrTime, planDate) : addM(dep, TRAIN_MINS);
        if (!arrDest) continue;
        const arrCollege = addM(arrDest, bSS + BUF);
        if (arrCollege <= arriveBy) best = t;
      }
      if (!best && isToday) {
        for (const t of allTrains) {
          if (t.etd === "Cancelled") continue;
          const dep = parseTT(t.std, planDate);
          if (!dep) continue;
          const bikeToStn = HOME_STATIONS[t.stnKey].bikeMins + bikeAdj;
          if (addM(now, bikeToStn + BUF) > dep) continue;
          return t; // First catchable train, even if late
        }
      }
      return best || null;
    }
    // "from" direction: first catchable train after finish
    for (const t of allTrains) {
      if (t.etd === "Cancelled") continue;
      const dep = parseTT(t.std, planDate);
      if (!dep) continue;
      if (dep >= addM(finishAt, bSS + BUF)) return t;
    }
    return null;
  }, [dir, allTrains, planDate, arriveBy, finishAt, bikeAdj, bSS, isToday, now]);

  const activeTrain = selTrain ? allTrains.find(t => trainKey(t) === selTrain) : autoTrain;

  // Derive station from active train
  const activeStn = activeTrain ? HOME_STATIONS[activeTrain.stnKey] : HOME_STATIONS[DEFAULT_HOME_STATION];
  const bHS = activeStn.bikeMins + bikeAdj;
  const bSH = activeStn.bikeMins + bikeAdj;

  // Train before and after the active train
  const activeIdx = activeTrain ? allTrains.findIndex(t => trainKey(t) === trainKey(activeTrain)) : -1;
  const trainBefore = activeIdx > 0 ? allTrains[activeIdx - 1] : null;
  const trainAfter = activeIdx >= 0 && activeIdx < allTrains.length - 1 ? allTrains[activeIdx + 1] : null;

  // Journey calculation
  const J = useMemo(() => {
    if (dir === "to") {
      const tDep = activeTrain
        ? (parseTT(activeTrain.etd === "On time" ? activeTrain.std : activeTrain.etd, planDate) || parseTT(activeTrain.std, planDate))
        : addM(arriveBy, -(bSS + BUF + TRAIN_MINS));
      const leave = addM(tDep, -(bHS + BUF));
      const arrStn = (activeTrain?.arrTime ? parseTT(activeTrain.arrTime, planDate) : null) || addM(tDep, TRAIN_MINS);
      const trainMinsActual = diffM(arrStn, tDep);
      const arrSchool = addM(arrStn, bSS + BUF);
      const late = arrSchool > arriveBy;
      const spare = diffM(arriveBy, arrSchool);
      return { leave, tDep, arrStn, arrSchool, late, spare, tStr: activeTrain?.std || fmt(tDep), trainMins: trainMinsActual, arrStnStr: activeTrain?.arrTime || null };
    }
    const tDep = activeTrain ? (parseTT(activeTrain.etd === "On time" ? activeTrain.std : activeTrain.etd, planDate) || parseTT(activeTrain.std, planDate)) : addM(finishAt, bSS + BUF);
    const leaveSchool = addM(tDep, -(bSS + BUF));
    const arrStn = (activeTrain?.arrTime ? parseTT(activeTrain.arrTime, planDate) : null) || addM(tDep, TRAIN_MINS);
    const trainMinsActual = diffM(arrStn, tDep);
    const arrHome = addM(arrStn, bSH);
    return { leaveSchool, tDep, arrStn, arrHome, tStr: activeTrain?.std || fmt(tDep), trainMins: trainMinsActual, arrStnStr: activeTrain?.arrTime || null };
  }, [dir, activeTrain, planDate, bHS, bSS, bSH, arriveBy, finishAt, arriveByStr]);

  const countdown = isToday ? diffM(dir === "to" ? J.leave : J.leaveSchool, now) : null;
  const sts = allTrains.some(t => t.etd === "Cancelled") ? "danger" : allTrains.some(t => t.etd !== "On time" && t.etd !== t.std && t.etd !== "\u2014") ? "warning" : "good";

  const dateBtns = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 7; i++) {
      const d = dayClone(now, i);
      const t = TT[d.getDay()];
      arr.push({ date: d, label: i === 0 ? "Today" : i === 1 ? "Tmrw" : DAYS[d.getDay()].slice(0, 3), hasClass: t.sessions.length > 0 && d >= TERM_START && d <= TERM_END, dateStr: `${d.getDate()}/${d.getMonth() + 1}`, isAuto: manualDate === null && d.toDateString() === planDate.toDateString() });
    }
    return arr;
  }, [now, manualDate, planDate]);

  // Trainline booking URL
  const trainlineUrl = useMemo(() => {
    const depName = dir === "to" ? (activeStn?.name || "Godalming") : SCHOOL_STATION;
    const arrName = dir === "to" ? SCHOOL_STATION : (activeStn?.name || "Godalming");
    const timeStr = activeTrain?.std || (dir === "to" ? fmt(J.tDep) : fmt(J.tDep));
    const dt = fmtDate(planDate) + "T" + timeStr.slice(0,5) + ":00";
    return `https://www.thetrainline.com/book/results?journeySearchType=single&origin=${encodeURIComponent(depName)}&destination=${encodeURIComponent(arrName)}&outwardDate=${encodeURIComponent(dt)}&outwardDateType=departAfter&passengers%5B%5D=2008-01-01%7C16-25-railcard`;
  }, [dir, activeStn, planDate, activeTrain, J]);

  const rubyTrainlineUrl = useMemo(() => {
    if (isFriday && rubyToTrain) {
      const dt = fmtDate(planDate) + "T" + rubyToTrain.std + ":00";
      return `https://www.thetrainline.com/book/results?journeySearchType=single&origin=${encodeURIComponent(SCHOOL_STATION)}&destination=${encodeURIComponent(RUBY_STATION)}&outwardDate=${encodeURIComponent(dt)}&outwardDateType=departAfter&passengers%5B%5D=2008-01-01%7C16-25-railcard`;
    }
    if (isSunday && rubyFromTrain) {
      const dt = fmtDate(planDate) + "T" + rubyFromTrain.std + ":00";
      return `https://www.thetrainline.com/book/results?journeySearchType=single&origin=${encodeURIComponent(RUBY_STATION)}&destination=${encodeURIComponent("Godalming")}&outwardDate=${encodeURIComponent(dt)}&outwardDateType=departAfter&passengers%5B%5D=2008-01-01%7C16-25-railcard`;
    }
    return null;
  }, [isFriday, isSunday, rubyToTrain, rubyFromTrain, planDate]);

  // National Rail live departures URL
  const liveTrainsUrl = useMemo(() => {
    const depStn = dir === "to" ? (activeStn?.code || "GOD") : SCHOOL_STATION_CODE;
    const arrStn = dir === "to" ? SCHOOL_STATION_CODE : (activeStn?.code || "GOD");
    return `https://www.nationalrail.co.uk/live-trains/departures/${depStn}/to/${arrStn}`;
  }, [dir, activeStn]);

  // Delay Repay detection — check if active train is 15+ min late
  useEffect(() => {
    if (!activeTrain || !isToday) return;
    const scheduled = parseTT(activeTrain.std, planDate);
    const expected = parseTT(activeTrain.etd, planDate);
    if (!scheduled || !expected) return;
    const delayMins = diffM(expected, scheduled);
    if (delayMins >= 15 && !delayRepayDismissed.includes(trainKey(activeTrain))) {
      setDelayRepayModal({
        date: fmtDate(planDate),
        from: dir === "to" ? (activeStn?.name || "Godalming") : SCHOOL_STATION,
        fromCode: dir === "to" ? (activeStn?.code || "GOD") : SCHOOL_STATION_CODE,
        to: dir === "to" ? SCHOOL_STATION : (activeStn?.name || "Godalming"),
        toCode: dir === "to" ? SCHOOL_STATION_CODE : (activeStn?.code || "GOD"),
        scheduled: activeTrain.std,
        expected: activeTrain.etd,
        delayMins,
        operator: activeTrain.operator || "South Western Railway",
        trainId: trainKey(activeTrain),
      });
    }
  }, [activeTrain, isToday, delayRepayDismissed]);

  // Auto-log commute when Tom arrives (geolocation-based)
  useEffect(() => {
    if (!isToday || !locLabel) return;
    const todayStr = fmtDate(new Date());
    const alreadyLogged = commuteLog.some(c => c.date === todayStr);
    if (!alreadyLogged && (locLabel === "At college" || locLabel === "Near college") && dir === "to") {
      const bikeKm = ((activeStn?.bikeMi || 2.5) + BIKE_STN_SCHOOL.mi) * 1.609;
      setCommuteLog(prev => [...prev, { date: todayStr, bikeKm: Math.round(bikeKm * 10) / 10, mode: "bike+train" }]);
    }
  }, [locLabel, isToday, dir]);

  const handleTTUpload = async (file) => {
    setUploadingTT(true);
    try {
      const isImage = file.type.startsWith('image/');
      let body;
      if (isImage) {
        const b64 = await new Promise((res) => {
          const reader = new FileReader();
          reader.onload = () => res(reader.result.split(',')[1]);
          reader.readAsDataURL(file);
        });
        body = { type: 'image', content: b64, mediaType: file.type };
      } else {
        const text = await file.text();
        body = { type: 'text', content: text };
      }
      const resp = await fetch('/api/parse-timetable', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!resp.ok) throw new Error('Parse failed');
      const data = await resp.json();
      if (data.sessions) {
        setCustomTT(data.sessions);
        setShowTTUpload(false);
      }
    } catch (e) {
      console.error('TT upload error:', e);
      alert('Could not parse timetable. Try pasting the text instead, or check the image quality.');
    }
    setUploadingTT(false);
  };

  const handleExamUpload = async (file) => {
    setUploadingExam(true);
    try {
      const isImage = file.type.startsWith('image/');
      let body;
      if (isImage) {
        const b64 = await new Promise((res) => {
          const reader = new FileReader();
          reader.onload = () => res(reader.result.split(',')[1]);
          reader.readAsDataURL(file);
        });
        body = { type: 'exam_image', content: b64, mediaType: file.type };
      } else {
        const text = await file.text();
        body = { type: 'exam_text', content: text };
      }
      const resp = await fetch('/api/parse-timetable', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!resp.ok) throw new Error('Parse failed');
      const data = await resp.json();
      if (data.exams) {
        setExamTT(data.exams);
        setShowExamUpload(false);
      }
    } catch (e) {
      console.error('Exam upload error:', e);
      alert('Could not parse exam timetable. Try pasting the text instead.');
    }
    setUploadingExam(false);
  };

  // Railcard savings helpers
  const logCost = () => {
    const price = parseFloat(costInput);
    if (isNaN(price) || price <= 0) return;
    const railcardPrice = Math.round(price * 0.6667 * 100) / 100;
    const entry = { date: fmtDate(new Date()), price, railcardPrice, saved: Math.round((price - railcardPrice) * 100) / 100 };
    setCostLog(prev => [...prev, entry]);
    setCostInput('');
    setShowCostEntry(false);
  };

  // Arrived safely handler
  const sendArrivedSafely = () => {
    const msg = `Hi ${SAFETY_CONTACT_NAME}, Tom has arrived safely at ${SCHOOL_NAME}. ${fmt(new Date())}`;
    const smsUrl = `sms:${SAFETY_CONTACT}?body=${encodeURIComponent(msg)}`;
    window.open(smsUrl, '_blank');
    const entry = { date: fmtDate(new Date()), time: fmt(new Date()), location: locLabel || "College" };
    setSafetyHistory(prev => [entry, ...prev].slice(0, 50));
    setShowSafetyConfirm(true);
    setTimeout(() => setShowSafetyConfirm(false), 3000);
  };

  // Commute stats calculations
  const thisWeekCommutes = commuteLog.filter(c => {
    const d = new Date(c.date);
    const now2 = new Date();
    const weekStart = new Date(now2);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    weekStart.setHours(0,0,0,0);
    return d >= weekStart;
  });
  const thisMonthCommutes = commuteLog.filter(c => {
    const d = new Date(c.date);
    return d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear();
  });
  const totalBikeKm = commuteLog.reduce((s, c) => s + (c.bikeKm || 0), 0);
  const co2SavedKg = Math.round(totalBikeKm * 0.12 * 10) / 10; // 120g CO2/km for car
  const streakDays = (() => {
    let streak = 0;
    const sorted = [...commuteLog].sort((a, b) => new Date(b.date) - new Date(a.date));
    if (!sorted.length) return 0;
    let check = dayClone(new Date());
    for (const c of sorted) {
      const cd = new Date(c.date);
      if (cd.toDateString() === check.toDateString()) { streak++; check = dayClone(check, -1); while (check.getDay() === 0 || check.getDay() === 6) check = dayClone(check, -1); }
      else break;
    }
    return streak;
  })();

  // Railcard savings summary
  const thisWeekCosts = costLog.filter(c => {
    const d = new Date(c.date);
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    weekStart.setHours(0,0,0,0);
    return d >= weekStart;
  });
  const thisMonthCosts = costLog.filter(c => {
    const d = new Date(c.date);
    return d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear();
  });
  const totalSaved = costLog.reduce((s, c) => s + (c.saved || 0), 0);

  // Upcoming exams
  const upcomingExams = examTT.filter(e => new Date(e.date) >= dayClone(new Date())).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 5);
  const nextExam = upcomingExams[0] || null;
  const isExamDay = examTT.some(e => e.date === fmtDate(planDate));
  const todayExams = examTT.filter(e => e.date === fmtDate(planDate));

  // ═══ LOADING ═══════════════════════════════════════════════
  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(145deg,#0a1628,#162040,#0c1a2e)", fontFamily: "'Outfit',sans-serif", color: "#e2e8f0" }}>
      <div style={{ textAlign: "center" }}><div style={{ fontSize: 48, marginBottom: 16, animation: "bounce 1s ease infinite" }}>{"\uD83D\uDE82"}</div><div style={{ fontSize: 18, fontWeight: 600, letterSpacing: 2 }}>LOADING TOM'S JOURNEY...</div></div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(145deg,#0a1628 0%,#162040 30%,#0c1a2e 60%,#0a1220 100%)", fontFamily: "'Outfit','DM Sans',sans-serif", color: "#e2e8f0" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.6;transform:scale(.85)}}
        @keyframes pulsering{0%,100%{opacity:0;transform:scale(1)}50%{opacity:.4;transform:scale(1.5)}}
        @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes slideIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .ch:hover{transform:translateY(-2px);box-shadow:0 8px 30px rgba(0,0,0,.4)!important}
        *{box-sizing:border-box;margin:0;padding:0}
        .ts{cursor:pointer;transition:all .12s;border-radius:10px}.ts:hover{background:rgba(99,102,241,.08)!important}
        ::-webkit-scrollbar{width:6px}::-webkit-scrollbar-thumb{background:rgba(99,102,241,.3);border-radius:3px}
        button{font-family:inherit}
        @media(max-width:600px){
          .main-grid{grid-template-columns:1fr!important}
          .safety-grid{grid-template-columns:1fr!important}
          .activities-grid{grid-template-columns:1fr!important}
          .snack-grid{grid-template-columns:1fr 1fr!important}
          .quick-links{grid-template-columns:1fr 1fr!important}
          .checklist-grid{grid-template-columns:1fr 1fr!important}
          .train-row{grid-template-columns:32px 48px 48px 52px 30px 1fr 60px!important;gap:3px!important;padding:6px 8px!important;font-size:10px!important}
          .train-hdr{grid-template-columns:32px 48px 48px 52px 30px 1fr 60px!important;gap:3px!important;padding:4px 8px!important}
          .journey-steps{gap:0!important}
          .journey-step{min-width:46px!important;padding:4px 2px!important}
          .journey-trans{min-width:36px!important}
        }
        @media(max-width:430px){
          .app-wrap{padding:12px 10px 32px!important;padding-top:max(12px,env(safe-area-inset-top))!important;padding-bottom:max(32px,env(safe-area-inset-bottom))!important;padding-left:max(10px,env(safe-area-inset-left))!important;padding-right:max(10px,env(safe-area-inset-right))!important}
          .header-time{font-size:34px!important}
          .countdown-time{font-size:22px!important}
          .future-leave{font-size:20px!important}
        }
      `}</style>

      <div className="app-wrap" style={{ maxWidth: 920, margin: "0 auto", padding: "16px 16px 40px" }}>

        {/* HEADER */}
        <div style={{ textAlign: "center", marginBottom: 12, animation: "slideIn .4s" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 4, color: "#818cf8", textTransform: "uppercase" }}>{"\uD83D\uDEB2"} Tom's Travel Companion {"\uD83D\uDE82"}</div>
          <div className="header-time" style={{ fontSize: 42, fontWeight: 900, letterSpacing: -1, fontFamily: "'JetBrains Mono',monospace", background: "linear-gradient(135deg,#e2e8f0,#818cf8,#6ee7b7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{fmt(now)}</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>{fmtLong(now)}</div>
          {locLabel && <div style={{ fontSize: 10, color: "#6ee7b7", marginTop: 2 }}>{"\uD83D\uDCCD"} {locLabel}{liveStationETA && locLabel !== "At college" && locLabel !== "Near college" ? ` \u2022 ${liveStationETA.bikeMinutes}min bike to ${liveStationETA.name}` : ""}</div>}
        </div>

        {/* OPTIONAL FEATURE TOGGLES */}
        <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 12, flexWrap: "wrap", animation: "slideIn .42s" }}>
          <Toggle on={showAfterSchool} onToggle={() => setShowAfterSchool(p => !p)} label="After-school" />
          <Toggle on={showActivitySafety} onToggle={() => setShowActivitySafety(p => !p)} label="Activity safety" />
          <Toggle on={showTravelSafety} onToggle={() => setShowTravelSafety(p => !p)} label="Travel safety" />
          <Toggle on={showNutrition} onToggle={() => setShowNutrition(p => !p)} label="Nutrition" />
        </div>

        {/* MODE + DATE + DIRECTION */}
        <Card style={{ marginBottom: 14, animation: "slideIn .45s", padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 14 }}>{modeIcon}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#c7d2fe" }}>{modeLabel}</span>
            {isFuture && <span style={{ fontSize: 11, color: "#94a3b8" }}>{"\u2014"} {fmtShort(planDate)}</span>}
            {manualDate !== null && <button onClick={() => { setManualDate(null); setManualDir(null); }} style={{ padding: "2px 8px", borderRadius: 6, border: "1px solid rgba(239,68,68,.3)", backgroundColor: "rgba(239,68,68,.08)", color: "#fca5a5", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>{"\u2715"} Reset</button>}
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: "#475569", letterSpacing: 1, textTransform: "uppercase", marginRight: 2 }}>{"\uD83D\uDCC5"}</span>
              {dateBtns.map((b, i) => {
                const isAct = manualDate !== null ? manualDate.toDateString() === b.date.toDateString() : b.isAuto;
                return (
                  <button key={i} onClick={() => { setManualDate(b.date); if (!manualDir) setManualDir("to"); }} style={{
                    padding: "5px 8px", borderRadius: 8, cursor: "pointer", fontSize: 10, fontWeight: 600,
                    backgroundColor: isAct ? "rgba(99,102,241,.2)" : "rgba(30,41,59,.5)",
                    color: isAct ? "#c7d2fe" : b.hasClass ? "#94a3b8" : "#475569",
                    border: isAct ? "1px solid rgba(99,102,241,.4)" : "1px solid rgba(148,163,184,.06)",
                    opacity: b.hasClass ? 1 : .5, transition: "all .15s", position: "relative", minWidth: 44,
                  }}>
                    <div>{b.label}</div>
                    <div style={{ fontSize: 8, color: isAct ? "#818cf8" : "#475569" }}>{b.dateStr}</div>
                    {b.hasClass && <div style={{ position: "absolute", top: 2, right: 2, width: 4, height: 4, borderRadius: "50%", backgroundColor: isAct ? "#818cf8" : "#4f46e5" }} />}
                  </button>
                );
              })}
            </div>
            {/* Direction selector */}
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {[{ v: null, l: "Auto" }, { v: "to", l: "\u2192 College" }, { v: "from", l: `\u2192 Home` }].map(o => (
                <button key={o.v || "auto"} onClick={() => setManualDir(o.v)} style={{
                  padding: "5px 10px", borderRadius: 8, cursor: "pointer", fontSize: 10, fontWeight: 600,
                  backgroundColor: manualDir === o.v ? "rgba(99,102,241,.2)" : "rgba(30,41,59,.5)",
                  color: manualDir === o.v ? "#c7d2fe" : "#94a3b8",
                  border: manualDir === o.v ? "1px solid rgba(99,102,241,.4)" : "1px solid rgba(148,163,184,.06)",
                }}>{o.l}</button>
              ))}
            </div>
          </div>
        </Card>

        {/* NO SCHOOL / OUT OF TERM */}
        {(!hasClass || !inTerm || isBankHol) && (
          <Card style={{ marginBottom: 14, borderColor: "rgba(139,92,246,.2)" }}>
            <div style={{ textAlign: "center", padding: 10 }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{isBankHol ? "\uD83C\uDDEC\uD83C\uDDE7" : !inTerm ? "\uD83C\uDFD6\uFE0F" : "\uD83D\uDE34"}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#a78bfa" }}>{isBankHol ? "Bank Holiday \u2014 No College" : !inTerm ? "Outside Term Dates" : `No College on ${tt.label}s`}</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>Train times shown below for reference</div>
            </div>
          </Card>
        )}

        {/* COUNTDOWN (today only) */}
        {isToday && hasClass && inTerm && countdown !== null && (
          <div style={{
            animation: "slideIn .5s", marginBottom: 14, padding: "14px 20px", borderRadius: 14, textAlign: "center",
            background: countdown <= 0 ? "linear-gradient(135deg,rgba(239,68,68,.2),rgba(185,28,28,.2))" : countdown <= 15 ? "linear-gradient(135deg,rgba(245,158,11,.2),rgba(180,83,9,.2))" : "linear-gradient(135deg,rgba(16,185,129,.15),rgba(6,78,59,.2))",
            border: `1px solid ${countdown <= 0 ? "rgba(239,68,68,.4)" : countdown <= 15 ? "rgba(245,158,11,.4)" : "rgba(16,185,129,.3)"}`,
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 4 }}>
              {dir === "to" ? (countdown <= 0 ? "\u26A0\uFE0F YOU SHOULD HAVE LEFT!" : countdown <= 5 ? "\uD83C\uDFC3 LEAVE NOW!" : countdown <= 15 ? "\uD83D\uDD14 LEAVING SOON" : "\u2705 YOU HAVE TIME") : "\uD83C\uDFE0 HEADING HOME"}
            </div>
            <div className="countdown-time" style={{ fontSize: 28, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", color: countdown <= 0 ? "#fca5a5" : countdown <= 15 ? "#fcd34d" : "#6ee7b7" }}>
              {countdown <= 0 ? `${Math.abs(countdown)} min overdue` : `${countdown} min until you leave`}
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
              {dir === "to"
                ? <>Leave by <strong style={{ color: "#e2e8f0" }}>{fmt(J.leave)}</strong> {"\u2192"} {tt.sessions[0].subj} starts <strong style={{ color: J.late ? "#fca5a5" : "#e2e8f0" }}>{arriveByStr}</strong></>
                : <>Leave college {"\u2192"} home by <strong style={{ color: "#e2e8f0" }}>{fmt(J.arrHome)}</strong></>}
            </div>
          </div>
        )}

        {/* FUTURE PLAN BANNER */}
        {isFuture && hasClass && inTerm && (
          <div style={{ animation: "slideIn .5s", marginBottom: 14, padding: "16px 20px", borderRadius: 14, textAlign: "center", background: "linear-gradient(135deg,rgba(139,92,246,.12),rgba(99,102,241,.08))", border: "1px solid rgba(139,92,246,.2)" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>{modeLabel}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#a78bfa", marginBottom: 6 }}>
              {"\uD83D\uDCC5"} {fmtLong(planDate)} {"\u2014"} {tt.sessions.length} lesson{tt.sessions.length > 1 ? "s" : ""} ({tt.start} {"\u2013"} {tt.end})
              {showAfterSchool && afterSchool && <span style={{ color: "#6ee7b7" }}> + {afterSchool.name} until {afterSchool.time.split("-")[1]}</span>}
              {gymSlots.length > 0 && <span style={{ color: "#fcd34d" }}> {"\uD83C\uDFCB\uFE0F"} {gymSlots.length} gym slot{gymSlots.length > 1 ? "s" : ""}</span>}
            </div>
            {dir === "to" ? (
              <>
                <div className="future-leave" style={{ fontSize: 26, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", color: "#c7d2fe" }}>Leave home at {fmt(J.leave)}</div>
                <div style={{ fontSize: 12, color: "#a78bfa", marginTop: 4 }}>For {tt.sessions[0].subj} at {arriveByStr} in {tt.sessions[0].room}</div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 6, lineHeight: 1.6 }}>
                  {"\uD83D\uDEB2"} Bike {bHS}min to {activeStn.name} {"\u2192"} {"\uD83D\uDE82"} {J.tStr} train ({J.trainMins}min) {"\u2192"} arr {J.arrStnStr || fmt(J.arrStn)} {"\u2192"} {"\uD83D\uDEB2"} Bike {bSS}min to college
                </div>
                {J.late ? <div style={{ fontSize: 13, color: "#fca5a5", marginTop: 6, fontWeight: 700 }}>{"\u26A0\uFE0F"} Arrive {fmt(J.arrSchool)} {"\u2014"} LATE for {arriveByStr} start!</div>
                  : <div style={{ fontSize: 12, color: "#6ee7b7", marginTop: 6 }}>{"\u2705"} Arrive {fmt(J.arrSchool)} {"\u2014"} {J.spare} minutes spare</div>}
              </>
            ) : (
              <>
                <div className="future-leave" style={{ fontSize: 26, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", color: "#c7d2fe" }}>Home by ~{fmt(J.arrHome)}</div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 6, lineHeight: 1.6 }}>
                  {"\uD83C\uDF93"} Finishes {tt.end}
                  {earlyFinishGym && <> {"\u2192"} {"\uD83C\uDFCB\uFE0F"} <span style={{ color: "#fcd34d" }}>Go Lifting {earlyFinishGym.start}-{earlyFinishGym.end}</span></>}
                  {" \u2192 "}{"\uD83D\uDEB2"} {bSS}min to station {"\u2192"} {"\uD83D\uDE82"} {J.tStr} train ({J.trainMins}min) {"\u2192"} arr {J.arrStnStr || fmt(J.arrStn)} {"\u2192"} {"\uD83D\uDEB2"} {bSH}min home
                </div>
              </>
            )}
          </div>
        )}

        {/* JOURNEY TIMELINE */}
        {hasClass && inTerm && (
          <Card style={{ marginBottom: 14, animation: "slideIn .55s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Lbl icon={"\uD83D\uDCCD"}>{dir === "to" ? `Journey to College \u2014 ${tt.sessions[0].subj} at ${arriveByStr}` : `Journey Home \u2014 ${tt.sessions[tt.sessions.length - 1].subj} ends ${tt.end}`}</Lbl>
              <a href={liveTrainsUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 12, backgroundColor: "rgba(16,185,129,.1)", border: "1px solid rgba(16,185,129,.2)", textDecoration: "none", fontSize: 10, fontWeight: 700, color: "#6ee7b7" }}>
                <Pulse /> View Live &rarr;
              </a>
            </div>
            <div className="journey-steps" style={{ display: "flex", alignItems: "center", gap: 0, flexWrap: "wrap", justifyContent: "center" }}>
              {(dir === "to" ? [
                { icon: "\uD83C\uDFE0", lbl: "Home", time: fmt(J.leave), sub: HOME_POSTCODE },
                { icon: "\uD83D\uDEB2", lbl: `${bHS}m`, sub: `${activeStn.bikeMi}mi`, tr: true },
                { icon: "\uD83D\uDE89", lbl: activeStn.name, time: J.tStr, sub: activeStn.code },
                { icon: "\uD83D\uDE82", lbl: `${J.trainMins}m`, sub: J.arrStnStr ? "Live" : "Est.", tr: true },
                { icon: "\uD83D\uDE89", lbl: SCHOOL_STATION, time: J.arrStnStr || fmt(J.arrStn), sub: SCHOOL_STATION_CODE },
                { icon: "\uD83D\uDEB2", lbl: `${bSS}m`, sub: `${BIKE_STN_SCHOOL.mi}mi`, tr: true },
                { icon: "\uD83C\uDFEB", lbl: "College", time: fmt(J.arrSchool), sub: J.late ? "LATE!" : "\u2713", late: J.late },
              ] : [
                { icon: "\uD83C\uDFEB", lbl: "College", time: tt.end, sub: earlyFinishGym ? "Done" : "Finish" },
                ...(earlyFinishGym ? [
                  { icon: "\uD83C\uDFCB\uFE0F", lbl: `Gym`, time: `${earlyFinishGym.mins}m`, sub: "Lift!", tr: true },
                ] : []),
                { icon: "\uD83D\uDEB2", lbl: `${bSS}m`, sub: `${BIKE_STN_SCHOOL.mi}mi`, tr: true },
                { icon: "\uD83D\uDE89", lbl: SCHOOL_STATION, time: J.tStr, sub: SCHOOL_STATION_CODE },
                { icon: "\uD83D\uDE82", lbl: `${J.trainMins}m`, sub: J.arrStnStr ? "Live" : "Est.", tr: true },
                { icon: "\uD83D\uDE89", lbl: activeStn.name, time: J.arrStnStr || fmt(J.arrStn), sub: activeStn.code },
                { icon: "\uD83D\uDEB2", lbl: `${bSH}m`, sub: `${activeStn.bikeMi}mi`, tr: true },
                { icon: "\uD83C\uDFE0", lbl: "Home", time: fmt(J.arrHome), sub: HOME_POSTCODE },
              ]).map((s, i, a) => (
                <div key={i} style={{ display: "flex", alignItems: "center" }}>
                  <div className={s.tr ? "journey-trans" : "journey-step"} style={{ textAlign: "center", minWidth: s.tr ? 50 : 64, padding: "5px 3px", borderRadius: 10, backgroundColor: s.tr ? "transparent" : s.late ? "rgba(239,68,68,.1)" : "rgba(99,102,241,.08)" }}>
                    <div style={{ fontSize: s.tr ? 13 : 18 }}>{s.icon}</div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#e2e8f0", marginTop: 1 }}>{s.lbl}</div>
                    {s.time && <div style={{ fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: s.late ? "#fca5a5" : "#818cf8" }}>{s.time}</div>}
                    <div style={{ fontSize: 8, color: s.late ? "#fca5a5" : "#64748b" }}>{s.sub}</div>
                  </div>
                  {i < a.length - 1 && <div style={{ width: 14, height: 2, margin: "0 1px", background: s.tr ? "repeating-linear-gradient(90deg,#4f46e5 0px,#4f46e5 3px,transparent 3px,transparent 6px)" : "linear-gradient(90deg,#4f46e5,#818cf8)" }} />}
                </div>
              ))}
            </div>
            {bikeAdj > 0 && <div style={{ marginTop: 8, padding: "5px 10px", borderRadius: 8, backgroundColor: "rgba(245,158,11,.1)", border: "1px solid rgba(245,158,11,.2)", fontSize: 11, color: "#fcd34d" }}>{"\u26A0\uFE0F"} Bike +{bikeAdj}min ({pRain ? "rain" : "wind"})</div>}

            {/* 3-TRAIN PICKER */}
            {allTrains.length > 0 && (
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid rgba(148,163,184,.06)" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#818cf8", letterSpacing: 1, marginBottom: 6 }}>TRAIN OPTIONS</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {[trainBefore, activeTrain, trainAfter].filter(Boolean).map((t) => {
                    const isActive = activeTrain && trainKey(t) === trainKey(activeTrain);
                    return (
                      <div key={trainKey(t)} onClick={() => setSelTrain(isActive ? null : trainKey(t))}
                        style={{
                          flex: 1, padding: "8px 10px", borderRadius: 10, cursor: "pointer",
                          backgroundColor: isActive ? "rgba(99,102,241,.15)" : "rgba(30,41,59,.5)",
                          border: isActive ? "1px solid rgba(99,102,241,.4)" : "1px solid rgba(148,163,184,.06)",
                          textAlign: "center", transition: "all .15s",
                        }}>
                        {isActive && <div style={{ fontSize: 8, fontWeight: 700, color: "#818cf8", marginBottom: 2 }}>RECOMMENDED</div>}
                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 16, fontWeight: 700, color: isActive ? "#e2e8f0" : "#94a3b8" }}>{t.std}</div>
                        <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 2 }}>
                          <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 4, backgroundColor: t.stnKey === "GOD" ? "rgba(16,185,129,.15)" : "rgba(99,102,241,.15)", color: t.stnKey === "GOD" ? "#6ee7b7" : "#818cf8" }}>{t.stnKey}</span>
                        </div>
                        {t.arrTime && <div style={{ fontSize: 10, color: "#818cf8", marginTop: 2 }}>arr {t.arrTime}</div>}
                        {t.etd === "Cancelled" && <div style={{ fontSize: 9, color: "#ef4444", fontWeight: 700 }}>CANCELLED</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* BOOK TRAIN + LIVE TRAINS ROW */}
        {hasClass && inTerm && (
          <div style={{ display: "flex", gap: 10, marginBottom: 14, animation: "slideIn .57s" }}>
            <a href={trainlineUrl} target="_blank" rel="noopener noreferrer" style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "12px 16px", borderRadius: 12, textDecoration: "none",
              background: "linear-gradient(135deg,rgba(16,185,129,.12),rgba(99,102,241,.08))",
              border: "1px solid rgba(16,185,129,.2)",
            }}>
              <span style={{ fontSize: 18 }}>{"\uD83C\uDFAB"}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#6ee7b7" }}>Book on Trainline</div>
                <div style={{ fontSize: 10, color: "#94a3b8" }}>
                  {dir === "to" ? `${activeStn?.name || "Godalming"} \u2192 ${SCHOOL_STATION}` : `${SCHOOL_STATION} \u2192 ${activeStn?.name || "Godalming"}`} {"\u00B7"} 16-25 Railcard
                </div>
              </div>
            </a>
            <a href={liveTrainsUrl} target="_blank" rel="noopener noreferrer" style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "12px 16px", borderRadius: 12, textDecoration: "none",
              backgroundColor: "rgba(99,102,241,.08)", border: "1px solid rgba(99,102,241,.2)",
            }}>
              <Pulse />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#818cf8" }}>Live Trains</span>
            </a>
          </div>
        )}

        {/* ARRIVED SAFELY */}
        {isToday && hasClass && inTerm && (locLabel === "At college" || locLabel === "Near college") && (
          <div style={{ marginBottom: 14, animation: "slideIn .58s" }}>
            <button onClick={sendArrivedSafely} style={{
              width: "100%", padding: "16px 20px", borderRadius: 14, border: "2px solid rgba(16,185,129,.4)",
              background: "linear-gradient(135deg,rgba(16,185,129,.15),rgba(6,78,59,.2))",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              transition: "all .2s",
            }}>
              <span style={{ fontSize: 28 }}>{showSafetyConfirm ? "\u2705" : "\uD83D\uDFE2"}</span>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: showSafetyConfirm ? "#6ee7b7" : "#e2e8f0" }}>
                  {showSafetyConfirm ? "Sent! Stay safe today" : "I've Arrived Safely"}
                </div>
                <div style={{ fontSize: 11, color: "#6ee7b7" }}>
                  {showSafetyConfirm ? `Notified ${SAFETY_CONTACT_NAME}` : `Tap to notify ${SAFETY_CONTACT_NAME} via SMS`}
                </div>
              </div>
            </button>
          </div>
        )}

        {/* WEEKEND AT RUBY'S */}
        {isWeekendRuby && inTerm && (
          <Card style={{ marginBottom: 14, animation: "slideIn .58s" }} glow="rgba(236,72,153,.1)">
            <Lbl icon={"\u2764\uFE0F"}>Weekend at Ruby's — {RUBY_STATION}</Lbl>

            {isFriday && hasClass && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#f472b6", letterSpacing: 1, marginBottom: 6 }}>FRIDAY → ONWARD TO RUBY'S</div>
                <div style={{ padding: "10px 14px", borderRadius: 10, backgroundColor: "rgba(236,72,153,.06)", border: "1px solid rgba(236,72,153,.15)" }}>
                  <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.8 }}>
                    {"\uD83C\uDFEB"} College finishes <strong style={{ color: "#e2e8f0" }}>{tt.end}</strong>
                    {earlyFinishGym && <> → {"\uD83C\uDFCB\uFE0F"} <span style={{ color: "#fcd34d" }}>Gym until {earlyFinishGym.doneBy}</span></>}
                    {" → "}{"\uD83D\uDEB2"} Bike {bSS}min to Woking station
                    {" → "}{"\uD83D\uDE82"} {rubyToTrain ? <><strong style={{ color: "#f472b6" }}>{rubyToTrain.std}</strong> train to {RUBY_STATION}{rubyToTrain.arrTime && <> (arr <strong style={{ color: "#e2e8f0" }}>{rubyToTrain.arrTime}</strong>)</>}</> : <span style={{ color: "#94a3b8" }}>train to {RUBY_STATION} (~35min)</span>}
                    {" → "}{"\uD83D\uDEB2"} Bike {BIKE_STN_RUBY.mins}min to Green Lane
                  </div>
                  {rubyToTrain && (
                    <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 4, backgroundColor: "rgba(236,72,153,.15)", color: "#f472b6" }}>
                        {rubyToTrain.etd === "On time" ? "ON TIME" : rubyToTrain.etd === "Cancelled" ? "CANCELLED" : rubyToTrain.etd}
                      </span>
                      {rubyToTrain.platform && <span style={{ fontSize: 10, color: "#94a3b8" }}>Platform {rubyToTrain.platform}</span>}
                    </div>
                  )}
                </div>
                {rubyTrainlineUrl && (
                  <a href={rubyTrainlineUrl} target="_blank" rel="noopener noreferrer" style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    marginTop: 8, padding: "8px 14px", borderRadius: 10, textDecoration: "none",
                    backgroundColor: "rgba(236,72,153,.08)", border: "1px solid rgba(236,72,153,.15)",
                  }}>
                    <span style={{ fontSize: 14 }}>{"\uD83C\uDFAB"}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#f472b6" }}>Book Woking → Sandhurst on Trainline</span>
                  </a>
                )}
              </div>
            )}

            {isSaturday && (
              <div style={{ textAlign: "center", padding: "14px 10px" }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>{"\uD83D\uDE0D"}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#f472b6" }}>Enjoying the weekend at Ruby's</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{RUBY_POSTCODE} · {RUBY_STATION}, Berkshire</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Head home tomorrow evening ~{SUNDAY_LEAVE_RUBY}</div>
              </div>
            )}

            {isSunday && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#f472b6", letterSpacing: 1, marginBottom: 6 }}>SUNDAY → HEADING HOME</div>
                <div style={{ padding: "10px 14px", borderRadius: 10, backgroundColor: "rgba(236,72,153,.06)", border: "1px solid rgba(236,72,153,.15)" }}>
                  <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.8 }}>
                    {"\uD83C\uDFE0"} Leave Ruby's <strong style={{ color: "#e2e8f0" }}>~{SUNDAY_LEAVE_RUBY}</strong>
                    {" → "}{"\uD83D\uDEB2"} Bike {BIKE_STN_RUBY.mins}min to {RUBY_STATION} station
                    {" → "}{"\uD83D\uDE82"} {rubyFromTrain ? <><strong style={{ color: "#f472b6" }}>{rubyFromTrain.std}</strong> train to Guildford{rubyFromTrain.arrTime && <> (arr <strong style={{ color: "#e2e8f0" }}>{rubyFromTrain.arrTime}</strong>)</>}</> : <span style={{ color: "#94a3b8" }}>train to Guildford (~25min)</span>}
                    {" → "}{"\uD83D\uDD04"} Change at Guildford for Godalming/Farncombe
                    {" → "}{"\uD83D\uDEB2"} Bike home
                  </div>
                  {rubyFromTrain && (
                    <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 4, backgroundColor: "rgba(236,72,153,.15)", color: "#f472b6" }}>
                        {rubyFromTrain.etd === "On time" ? "ON TIME" : rubyFromTrain.etd === "Cancelled" ? "CANCELLED" : rubyFromTrain.etd}
                      </span>
                      {rubyFromTrain.platform && <span style={{ fontSize: 10, color: "#94a3b8" }}>Platform {rubyFromTrain.platform}</span>}
                    </div>
                  )}
                </div>
                {rubyTrainlineUrl && (
                  <a href={rubyTrainlineUrl} target="_blank" rel="noopener noreferrer" style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    marginTop: 8, padding: "8px 14px", borderRadius: 10, textDecoration: "none",
                    backgroundColor: "rgba(236,72,153,.08)", border: "1px solid rgba(236,72,153,.15)",
                  }}>
                    <span style={{ fontSize: 14 }}>{"\uD83C\uDFAB"}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#f472b6" }}>Book Sandhurst → Godalming on Trainline</span>
                  </a>
                )}
              </div>
            )}
          </Card>
        )}

        {/* EXAM COUNTDOWN */}
        {upcomingExams.length > 0 && (
          <Card style={{ marginBottom: 14, animation: "slideIn .59s" }} glow="rgba(239,68,68,.1)">
            <Lbl icon={"\uD83D\uDCDD"}>Upcoming Exams</Lbl>
            {isExamDay && todayExams.length > 0 && (
              <div style={{ marginBottom: 10, padding: "12px 14px", borderRadius: 10, background: "linear-gradient(135deg,rgba(239,68,68,.15),rgba(185,28,28,.1))", border: "1px solid rgba(239,68,68,.3)" }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#fca5a5", marginBottom: 4 }}>{"\u26A0\uFE0F"} EXAM TODAY</div>
                {todayExams.map((ex, i) => (
                  <div key={i} style={{ fontSize: 12, color: "#e2e8f0" }}>
                    <strong>{ex.time}</strong> — {ex.subj} {ex.room && <>in {ex.room}</>} ({ex.duration}min)
                  </div>
                ))}
                <div style={{ fontSize: 11, color: "#fcd34d", marginTop: 6 }}>Leave extra early — arrive 30min before your exam!</div>
              </div>
            )}
            {upcomingExams.map((ex, i) => {
              const examDate = new Date(ex.date);
              const daysUntil = Math.ceil((examDate - dayClone(new Date())) / 864e5);
              return (
                <div key={i} style={{ padding: "8px 12px", borderRadius: 8, marginBottom: 4, backgroundColor: daysUntil <= 3 ? "rgba(239,68,68,.08)" : "rgba(99,102,241,.05)", border: `1px solid ${daysUntil <= 3 ? "rgba(239,68,68,.15)" : "rgba(99,102,241,.08)"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0" }}>{ex.subj}</span>
                      <span style={{ fontSize: 10, color: "#94a3b8", marginLeft: 8 }}>{ex.time} · {ex.duration}min {ex.room && `· ${ex.room}`}</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: daysUntil <= 3 ? "#fca5a5" : daysUntil <= 7 ? "#fcd34d" : "#6ee7b7" }}>
                      {daysUntil === 0 ? "TODAY" : daysUntil === 1 ? "TOMORROW" : `${daysUntil} days`}
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: "#64748b" }}>{examDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</div>
                </div>
              );
            })}
          </Card>
        )}

        {/* MAIN GRID: TIMETABLE / WEATHER / CLOTHING */}
        <div className="main-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          {/* TIMETABLE */}
          <Card style={{ animation: "slideIn .6s" }}>
            <Lbl icon={"\uD83D\uDCDA"}>{isToday ? "Today's Lessons" : `${tt.label}'s Lessons`}</Lbl>
            {tt.sessions.length === 0 ? <div style={{ textAlign: "center", padding: 14, color: "#64748b" }}><div style={{ fontSize: 22, marginBottom: 4 }}>{"\uD83D\uDE0E"}</div><div style={{ fontSize: 12 }}>Day off</div></div>
              : tt.sessions.map((s, i) => (
                <div key={i} style={{ padding: "6px 10px", borderRadius: 8, marginBottom: 4, backgroundColor: s.pe ? "rgba(16,185,129,.08)" : "rgba(99,102,241,.05)", border: `1px solid ${s.pe ? "rgba(16,185,129,.15)" : "rgba(99,102,241,.05)"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: s.pe ? "#6ee7b7" : "#818cf8" }}>{s.time}</span>
                    <span style={{ fontSize: 9, color: "#64748b", fontWeight: 600 }}>{s.room}</span>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#e2e8f0", marginTop: 1 }}>{s.subj}{s.pe && <span style={{ marginLeft: 6, fontSize: 9, color: "#6ee7b7", fontWeight: 700 }}>{"\u26BD"} SPORT</span>}</div>
                  <div style={{ fontSize: 10, color: "#64748b" }}>{s.teacher}</div>
                </div>
              ))}
            {showAfterSchool && afterSchool && (
              <div style={{ marginTop: 8, padding: "8px 10px", borderRadius: 8, backgroundColor: "rgba(245,158,11,.08)", border: "1px solid rgba(245,158,11,.15)" }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: "#f59e0b", marginBottom: 3 }}>AFTER-SCHOOL</div>
                <div style={{ fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: "#fcd34d" }}>{afterSchool.time}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#e2e8f0" }}>{afterSchool.name}</div>
                <div style={{ fontSize: 10, color: "#64748b" }}>{afterSchool.location}</div>
              </div>
            )}
            {/* GO LIFTING — gym slots */}
            {gymSlots.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: "#f59e0b", marginBottom: 4 }}>{"\uD83D\uDCAA"} GO LIFTING</div>
                {gymSlots.map((slot, i) => (
                  <div key={i} style={{ padding: "8px 10px", borderRadius: 8, marginBottom: 4, background: "linear-gradient(135deg,rgba(245,158,11,.1),rgba(239,68,68,.06))", border: "1px solid rgba(245,158,11,.2)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: "#fcd34d" }}>{slot.start} - {slot.end}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, backgroundColor: "rgba(245,158,11,.15)", color: "#fcd34d" }}>{slot.mins}min</span>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#e2e8f0", marginTop: 2 }}>{"\uD83C\uDFCB\uFE0F"} Go Lifting</div>
                    <div style={{ fontSize: 10, color: "#94a3b8" }}>
                      {slot.type === "gap"
                        ? <>Free period {"\u2014"} between {slot.afterClass.split(" ").slice(-1)} & {slot.beforeClass.split(" ").slice(-1)}</>
                        : <>Early finish {"\u2014"} hit the gym before heading home</>}
                    </div>
                  </div>
                ))}
                <div style={{ padding: "6px 10px", borderRadius: 8, backgroundColor: "rgba(245,158,11,.05)", border: "1px solid rgba(245,158,11,.08)", fontSize: 10, color: "#fcd34d", fontStyle: "italic" }}>
                  {"\uD83D\uDD25"} {liftQuote}
                </div>
              </div>
            )}
            {hasClass && <div style={{ marginTop: 6, fontSize: 10, color: "#64748b", textAlign: "center" }}>
              College: <strong style={{ color: "#e2e8f0" }}>{tt.start}</strong> {"\u2013"} <strong style={{ color: "#e2e8f0" }}>{tt.end}</strong>
              {showAfterSchool && afterSchool && <> + club until <strong style={{ color: "#fcd34d" }}>{afterSchool.time.split("-")[1]}</strong></>}
              {earlyFinishGym && <> {"\u2192"} <strong style={{ color: "#fcd34d" }}>{"\uD83C\uDFCB\uFE0F"} Gym until {earlyFinishGym.doneBy}</strong></>}
            </div>}
          </Card>

          {/* WEATHER */}
          <Card style={{ animation: "slideIn .65s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><Lbl icon={"\uD83C\uDF24\uFE0F"}>{isToday ? "Weather Now" : `${tt.label}'s Forecast`}</Lbl>{pRain && <Badge s="warning">Rain</Badge>}</div>
            {wx?.current && <>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{ fontSize: 36 }}>{wxI(pWxCode)}</div>
                <div>
                  {isFuture && wx.daily ? <><div style={{ fontSize: 24, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace" }}>{Math.round(wx.daily.temperature_2m_max[wxIdx])}{"\u00B0"}/{Math.round(wx.daily.temperature_2m_min[wxIdx])}{"\u00B0"}</div><div style={{ fontSize: 11, color: "#94a3b8" }}>{wxD(pWxCode)}</div></> : <><div style={{ fontSize: 26, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace" }}>{Math.round(curTemp)}{"\u00B0"}C</div><div style={{ fontSize: 11, color: "#94a3b8" }}>Feels {Math.round(wx.current.apparent_temperature)}{"\u00B0"}C {"\u00B7"} {wxD(curCode)}</div></>}
                </div>
              </div>
              <div style={{ fontSize: 10, color: "#94a3b8", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                <div>{"\uD83D\uDCA8"} {Math.round(curWind)}km/h{curGusts > 30 && <span style={{ color: "#f59e0b" }}> (gusts {Math.round(curGusts)})</span>}</div>
                <div>{"\uD83C\uDF27"} {isFuture && wx.daily ? `${wx.daily.precipitation_probability_max?.[wxIdx] || 0}%` : `${curPrecip}mm`}</div>
              </div>
            </>}
            {!wx?.current && wxError && (
              <div style={{ textAlign: "center", padding: 14 }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{"\u26A0\uFE0F"}</div>
                <div style={{ fontSize: 12, color: "#fca5a5", fontWeight: 600 }}>Weather unavailable</div>
                <div style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>Check <a href="https://www.metoffice.gov.uk/weather/forecast/gcpf33k42" target="_blank" rel="noopener noreferrer" style={{ color: "#818cf8" }}>Met Office</a></div>
              </div>
            )}
            {wx?.daily && <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(148,163,184,.06)" }}><div style={{ display: "flex", gap: 5 }}>{[0, 1, 2].map(i => <div key={i} style={{ flex: 1, textAlign: "center", padding: "4px 2px", borderRadius: 8, backgroundColor: wxIdx === i ? "rgba(99,102,241,.1)" : "rgba(99,102,241,.03)", border: wxIdx === i ? "1px solid rgba(99,102,241,.2)" : "1px solid transparent" }}><div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 600 }}>{i === 0 ? "Today" : DAYS[new Date(Date.now() + i * 864e5).getDay()].slice(0, 3)}</div><div style={{ fontSize: 16 }}>{wxI(wx.daily.weather_code[i])}</div><div style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>{Math.round(wx.daily.temperature_2m_max[i])}{"\u00B0"}</div></div>)}</div></div>}
          </Card>

          {/* CLOTHING */}
          <Card style={{ animation: "slideIn .7s" }}>
            <Lbl icon={"\uD83D\uDC55"}>{isToday ? "Wear Today" : `Wear ${tt.label}`}</Lbl>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 16, backgroundColor: "rgba(99,102,241,.1)", border: "1px solid rgba(99,102,241,.2)", marginBottom: 10 }}>
              <span style={{ fontSize: 16 }}>{clothing.i}</span><span style={{ fontSize: 11, fontWeight: 700, color: "#c7d2fe" }}>{clothing.l}</span><span style={{ fontSize: 10, color: "#94a3b8" }}>({Math.round(pTemp)}{"\u00B0"}C)</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {clothing.k.map((x, i) => <div key={i} style={{ fontSize: 11, color: "#cbd5e1", display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 3, height: 3, borderRadius: "50%", backgroundColor: "#818cf8", flexShrink: 0 }} />{x}</div>)}
            </div>
            {clothing.e.length > 0 && <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(148,163,184,.06)" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#f59e0b", marginBottom: 4, letterSpacing: 1 }}>{"\u26A1"} EXTRAS</div>
              {clothing.e.map((x, i) => <div key={i} style={{ fontSize: 11, color: "#fcd34d", display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}><span style={{ width: 3, height: 3, borderRadius: "50%", backgroundColor: "#f59e0b", flexShrink: 0 }} />{x}</div>)}
            </div>}
          </Card>
        </div>

        {/* TODAY'S ACTIVITIES */}
        {hasClass && inTerm && dayActivities.length > 0 && (
          <Card style={{ marginTop: 14, animation: "slideIn .72s" }} glow="rgba(16,185,129,.08)">
            <Lbl icon={"\u26BD"}>{isToday ? "Today's Activities" : `${tt.label}'s Activities`}</Lbl>
            <div className="activities-grid" style={{ display: "grid", gridTemplateColumns: dayActivities.length > 1 ? "1fr 1fr" : "1fr", gap: 10 }}>
              {dayActivities.map((act, i) => {
                const isAfter = !act.pe;
                const aName = act.activity || act.name;
                return (
                  <div key={i} style={{ padding: "12px 14px", borderRadius: 12, backgroundColor: isAfter ? "rgba(245,158,11,.06)" : "rgba(16,185,129,.06)", border: `1px solid ${isAfter ? "rgba(245,158,11,.15)" : "rgba(16,185,129,.15)"}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <Badge s={isAfter ? "warning" : "good"}>{isAfter ? "After-school" : "PE Lesson"}</Badge>
                      <span style={{ fontSize: 10, color: act.outdoor ? "#fcd34d" : "#6ee7b7", fontWeight: 600 }}>{act.outdoor ? "\uD83C\uDF33 Outdoor" : "\uD83C\uDFE2 Indoor"}</span>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#e2e8f0", marginBottom: 4 }}>{aName}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>
                      {act.time || act.time} {"\u00B7"} {act.room || act.location}
                    </div>
                    {act.outdoor && pRain && <div style={{ marginTop: 6, fontSize: 11, color: "#fcd34d", fontWeight: 600 }}>{"\uD83C\uDF27\uFE0F"} Rain expected {"\u2014"} may move indoors</div>}
                    {act.outdoor && pTemp > 25 && <div style={{ marginTop: 4, fontSize: 11, color: "#fca5a5", fontWeight: 600 }}>{"\u2600\uFE0F"} Hot conditions {"\u2014"} extra water needed</div>}
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* SAFETY CARDS — Activity + Travel */}
        {hasClass && inTerm && (showActivitySafety || showTravelSafety) && (
          <div className="safety-grid" style={{ display: "grid", gridTemplateColumns: showActivitySafety && showTravelSafety ? "1fr 1fr" : "1fr", gap: 14, marginTop: 14 }}>
            {/* Activity Safety */}
            {showActivitySafety && (aSafety.tips.length > 0 || asAfterSafety.tips.length > 0) && (
              <Card style={{ animation: "slideIn .75s" }} glow={aSafety.warnings.length > 0 || asAfterSafety.warnings.length > 0 ? "rgba(245,158,11,.08)" : undefined}>
                <Lbl icon={"\uD83D\uDEE1\uFE0F"}>Activity Safety</Lbl>
                {aSafety.warnings.map((w, i) => (
                  <div key={`pw${i}`} style={{ padding: "6px 10px", borderRadius: 8, marginBottom: 6, backgroundColor: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.15)", fontSize: 11, color: "#fca5a5", fontWeight: 600 }}>{"\u26A0\uFE0F"} {w}</div>
                ))}
                {peSession && (
                  <>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#6ee7b7", marginBottom: 4, letterSpacing: 1 }}>{"\u26BD"} {peSession.activity} KIT & SAFETY</div>
                    {aSafety.tips.map((t, i) => <div key={`pt${i}`} style={{ fontSize: 11, color: "#cbd5e1", display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}><span style={{ width: 3, height: 3, borderRadius: "50%", backgroundColor: "#10b981", flexShrink: 0 }} />{t}</div>)}
                  </>
                )}
                {showAfterSchool && afterSchool && asAfterSafety.tips.length > 0 && (
                  <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid rgba(148,163,184,.06)" }}>
                    {asAfterSafety.warnings.map((w, i) => (
                      <div key={`aw${i}`} style={{ padding: "6px 10px", borderRadius: 8, marginBottom: 6, backgroundColor: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.15)", fontSize: 11, color: "#fca5a5", fontWeight: 600 }}>{"\u26A0\uFE0F"} {w}</div>
                    ))}
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#fcd34d", marginBottom: 4, letterSpacing: 1 }}>{"\uD83C\uDFC6"} {afterSchool.name} SAFETY</div>
                    {asAfterSafety.tips.map((t, i) => <div key={`at${i}`} style={{ fontSize: 11, color: "#cbd5e1", display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}><span style={{ width: 3, height: 3, borderRadius: "50%", backgroundColor: "#f59e0b", flexShrink: 0 }} />{t}</div>)}
                  </div>
                )}
                {!peSession && (!showAfterSchool || !afterSchool) && <div style={{ fontSize: 12, color: "#64748b", textAlign: "center", padding: 10 }}>No sport activities today</div>}
              </Card>
            )}

            {/* Travel Safety */}
            {showTravelSafety && (
              <Card style={{ animation: "slideIn .78s" }} glow={tSafety.warnings.length > 0 ? "rgba(245,158,11,.08)" : "rgba(16,185,129,.06)"}>
                <Lbl icon={"\uD83D\uDEB2"}>Travel Safety</Lbl>
                {tSafety.warnings.map((w, i) => (
                  <div key={i} style={{ padding: "6px 10px", borderRadius: 8, marginBottom: 6, backgroundColor: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.15)", fontSize: 11, color: "#fca5a5", fontWeight: 600 }}>{"\u26A0\uFE0F"} {w}</div>
                ))}
                <div style={{ fontSize: 10, fontWeight: 700, color: "#818cf8", marginBottom: 4, letterSpacing: 1 }}>CYCLING CONDITIONS</div>
                {tSafety.tips.map((t, i) => <div key={i} style={{ fontSize: 11, color: "#cbd5e1", display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}><span style={{ width: 3, height: 3, borderRadius: "50%", backgroundColor: tSafety.warnings.length > 0 ? "#f59e0b" : "#10b981", flexShrink: 0 }} />{t}</div>)}
              </Card>
            )}
          </div>
        )}

        {/* NUTRITION & RECIPES */}
        {showNutrition && (
          <Card style={{ marginTop: 14, animation: "slideIn .84s" }} glow="rgba(245,158,11,.06)">
            <Lbl icon={"\uD83C\uDF57"}>Muscle Fuel & Nutrition</Lbl>

            {/* Pre-workout (if PE day) */}
            {peSession && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#6ee7b7", letterSpacing: 1, marginBottom: 6 }}>{"\u26A1"} PRE-WORKOUT {"\u2014"} Eat before {peSession.activity}</div>
                {(() => {
                  const meal = mealOfDay(MEALS.preWorkout, planDate);
                  return (
                    <div style={{ padding: "10px 14px", borderRadius: 10, backgroundColor: "rgba(16,185,129,.06)", border: "1px solid rgba(16,185,129,.12)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 22 }}>{meal.icon}</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{meal.name}</div>
                          <div style={{ fontSize: 10, color: "#94a3b8" }}>{meal.desc}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                        <span style={{ fontSize: 10, color: "#6ee7b7", fontWeight: 700 }}>Protein: {meal.protein}</span>
                        <span style={{ fontSize: 10, color: "#fcd34d", fontWeight: 700 }}>Carbs: {meal.carbs}</span>
                        <span style={{ fontSize: 10, color: "#94a3b8" }}>Prep: {meal.prep}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Post-workout */}
            {peSession && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#818cf8", letterSpacing: 1, marginBottom: 6 }}>{"\uD83D\uDD04"} POST-WORKOUT RECOVERY</div>
                {(() => {
                  const meal = mealOfDay(MEALS.postWorkout, planDate);
                  return (
                    <div style={{ padding: "10px 14px", borderRadius: 10, backgroundColor: "rgba(99,102,241,.06)", border: "1px solid rgba(99,102,241,.12)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 22 }}>{meal.icon}</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{meal.name}</div>
                          <div style={{ fontSize: 10, color: "#94a3b8" }}>{meal.desc}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                        <span style={{ fontSize: 10, color: "#6ee7b7", fontWeight: 700 }}>Protein: {meal.protein}</span>
                        <span style={{ fontSize: 10, color: "#fcd34d", fontWeight: 700 }}>Carbs: {meal.carbs}</span>
                        <span style={{ fontSize: 10, color: "#94a3b8" }}>Prep: {meal.prep}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Muscle-building dinner idea */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#f59e0b", letterSpacing: 1, marginBottom: 6 }}>{"\uD83C\uDF57"} MUSCLE-BUILDING DINNER IDEA</div>
              {(() => {
                const meal = mealOfDay(MEALS.muscleBuilding, planDate);
                return (
                  <div style={{ padding: "10px 14px", borderRadius: 10, backgroundColor: "rgba(245,158,11,.06)", border: "1px solid rgba(245,158,11,.12)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 22 }}>{meal.icon}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{meal.name}</div>
                        <div style={{ fontSize: 10, color: "#94a3b8" }}>{meal.desc}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                      <span style={{ fontSize: 10, color: "#6ee7b7", fontWeight: 700 }}>Protein: {meal.protein}</span>
                      <span style={{ fontSize: 10, color: "#fcd34d", fontWeight: 700 }}>Carbs: {meal.carbs}</span>
                      <span style={{ fontSize: 10, color: "#94a3b8" }}>Prep: {meal.prep}</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* High-protein snacks */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#c084fc", letterSpacing: 1, marginBottom: 6 }}>{"\uD83E\uDD5C"} HIGH-PROTEIN SNACK IDEAS</div>
              <div className="snack-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
                {MEALS.snacks.map((s, i) => (
                  <div key={i} style={{ textAlign: "center", padding: "8px 4px", borderRadius: 8, backgroundColor: "rgba(168,85,247,.05)", border: "1px solid rgba(168,85,247,.08)" }}>
                    <div style={{ fontSize: 16 }}>{s.icon}</div>
                    <div style={{ fontSize: 9, fontWeight: 600, color: "#e2e8f0", marginTop: 2 }}>{s.name}</div>
                    <div style={{ fontSize: 9, color: "#6ee7b7", fontWeight: 700, marginTop: 1 }}>{s.protein}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hydration reminder */}
            {(dayActivities.length > 0 || pTemp > 15) && (
              <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 10, backgroundColor: "rgba(56,189,248,.06)", border: "1px solid rgba(56,189,248,.12)", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>{"\uD83D\uDCA7"}</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#7dd3fc" }}>Stay Hydrated</div>
                  <div style={{ fontSize: 10, color: "#94a3b8" }}>
                    {pTemp > 25 ? "Hot day + sport \u2014 aim for 3+ litres of water today" :
                     pTemp > 15 ? "Active day \u2014 aim for 2-3 litres of water" :
                     "Keep drinking water \u2014 aim for at least 2 litres today"}
                  </div>
                </div>
              </div>
            )}

            {/* Daily protein target */}
            <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 10, backgroundColor: "rgba(16,185,129,.04)", border: "1px solid rgba(16,185,129,.1)", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>{"\uD83C\uDFAF"}</span>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#6ee7b7" }}>Daily Protein Target: ~{dayActivities.length > 0 ? "80-100g" : "60-80g"}</div>
                <div style={{ fontSize: 10, color: "#94a3b8" }}>
                  {dayActivities.length > 0 ? "Active day with sport \u2014 higher protein helps muscle recovery & growth" : "Rest day \u2014 maintain steady protein intake for muscle maintenance"}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* TRAINS */}
        <Card style={{ marginTop: 14, animation: "slideIn .8s" }} glow={sts === "danger" ? "rgba(239,68,68,.12)" : undefined}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Lbl icon={dir === "to" ? "\uD83C\uDFEB" : "\uD83C\uDFE0"}>{dir === "to" ? "Trains to Woking" : "Trains from Woking"}</Lbl>
              <Badge s={sts}>{sts === "good" ? "Live" : sts === "warning" ? "Delays" : "Disrupted"}</Badge>
            </div>
            <div style={{ fontSize: 10, color: "#64748b" }}>{lastRef ? fmt(lastRef) : ""} {"\u00B7"} 60s</div>
          </div>

          <div style={{ fontSize: 11, color: "#a78bfa", marginBottom: 8, padding: "5px 10px", borderRadius: 8, backgroundColor: "rgba(139,92,246,.06)", border: "1px solid rgba(139,92,246,.1)" }}>
            {isFuture
              ? <>Today's live departures as a timetable guide for {tt.label}. Click to plan your {dir === "to" ? "morning" : "return"} train</>
              : <>Click a train {"\u2014"} journey recalculates with bike time both sides</>}
          </div>

          {alerts.length > 0 && <div style={{ marginBottom: 10, padding: "8px 12px", borderRadius: 10, backgroundColor: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)" }}>{alerts.map((a, i) => <div key={i} style={{ fontSize: 11, color: "#fca5a5" }}>{typeof a === "string" ? a.replace(/<[^>]*>/g, "") : ""}</div>)}</div>}

          {/* Train list header */}
          <div className="train-hdr" style={{ display: "grid", gridTemplateColumns: "40px 55px 55px 60px 36px 1fr 80px", gap: 6, padding: "4px 12px", marginBottom: 2 }}>
            {["Stn", "Dep", "Arr", "Status", "Plat", "Destination", ""].map((h, i) => <span key={i} style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: "#475569", textTransform: "uppercase" }}>{h}</span>)}
          </div>

          {allTrains.length === 0 && trainError && (
            <div style={{ textAlign: "center", padding: 20 }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{"\u26A0\uFE0F"}</div>
              <div style={{ fontSize: 12, color: "#fca5a5", fontWeight: 600 }}>Train data unavailable</div>
              <div style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>Check <a href="https://www.nationalrail.co.uk" target="_blank" rel="noopener noreferrer" style={{ color: "#818cf8" }}>National Rail</a></div>
            </div>
          )}
          {allTrains.length === 0 ? <div style={{ textAlign: "center", padding: 20, color: "#64748b" }}><div style={{ fontSize: 22, marginBottom: 4 }}>{"\uD83D\uDE82"}</div><div style={{ fontSize: 12 }}>{isFuture ? "Live trains show today's schedule as a guide" : "No trains listed"}</div></div>
            : allTrains.map((t, i) => {
              const sc = t.std || "\u2014"; const es = t.etd || "\u2014";
              const dly = es !== "On time" && es !== sc && es !== "\u2014" && es !== "Cancelled"; const cnc = es === "Cancelled";
              const act = activeTrain && trainKey(t) === trainKey(activeTrain);
              const arr = t.arrTime || "\u2014";
              return (
                <div key={trainKey(t)} className="ts train-row" onClick={() => setSelTrain(trainKey(t) === selTrain ? null : trainKey(t))} style={{ display: "grid", gridTemplateColumns: "40px 55px 55px 60px 36px 1fr 80px", alignItems: "center", gap: 6, padding: "8px 12px", backgroundColor: act ? "rgba(99,102,241,.12)" : "transparent", border: act ? "1px solid rgba(99,102,241,.3)" : "1px solid transparent" }}>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 4px", borderRadius: 4, textAlign: "center", backgroundColor: t.stnKey === "GOD" ? "rgba(16,185,129,.15)" : "rgba(99,102,241,.15)", color: t.stnKey === "GOD" ? "#6ee7b7" : "#818cf8" }}>{t.stnKey}</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 15, fontWeight: 700, color: "#e2e8f0" }}>{sc}</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 600, color: "#818cf8" }}>{arr}</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 600, color: cnc ? "#ef4444" : dly ? "#f59e0b" : "#22c55e" }}>{cnc ? "CANC" : dly ? es : "On time"}</span>
                  <span style={{ fontSize: 11, color: "#94a3b8", textAlign: "center" }}>{t.platform ? `P${t.platform}` : "\u2014"}</span>
                  <span style={{ fontSize: 11, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.destination?.[0]?.locationName || "\u2014"}</span>
                  {act && <Badge s={cnc ? "danger" : dly ? "warning" : "good"}>{selTrain ? "Selected" : "Best"}</Badge>}
                </div>
              );
            })}

          {activeTrain && (
            <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 10, background: "linear-gradient(135deg,rgba(99,102,241,.1),rgba(16,185,129,.06))", border: "1px solid rgba(99,102,241,.2)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#818cf8" }}>
                {dir === "to" ? (
                  <>{"\uD83D\uDE82"} <span style={{ fontFamily: "'JetBrains Mono',monospace", color: "#6ee7b7" }}>{activeTrain.std}</span> {activeStn.code} {"\u2192"} <span style={{ fontFamily: "'JetBrains Mono',monospace", color: "#818cf8" }}>{J.arrStnStr || fmt(J.arrStn)}</span> {SCHOOL_STATION_CODE} ({J.trainMins}m) {"\u2192"} Leave home <span style={{ fontFamily: "'JetBrains Mono',monospace", color: "#6ee7b7" }}>{fmt(J.leave)}</span> {"\u2192"} {"\uD83D\uDEB2"}{bHS}m {"\u2192"} train {"\u2192"} {"\uD83D\uDEB2"}{bSS}m {"\u2192"} {J.late ? <span style={{ color: "#fca5a5" }}>{"\u26A0\uFE0F"} LATE {fmt(J.arrSchool)}</span> : <span style={{ color: "#6ee7b7" }}>{"\u2705"} {fmt(J.arrSchool)} ({J.spare}m spare)</span>}</>
                ) : (
                  <>{"\uD83D\uDE82"} <span style={{ fontFamily: "'JetBrains Mono',monospace", color: "#6ee7b7" }}>{activeTrain.std}</span> {SCHOOL_STATION_CODE} {"\u2192"} <span style={{ fontFamily: "'JetBrains Mono',monospace", color: "#818cf8" }}>{J.arrStnStr || fmt(J.arrStn)}</span> {activeStn.code} ({J.trainMins}m) {"\u2192"} Leave college <span style={{ fontFamily: "'JetBrains Mono',monospace", color: "#6ee7b7" }}>{fmt(J.leaveSchool)}</span> {"\u2192"} {"\uD83D\uDEB2"}{bSS}m {"\u2192"} train {"\u2192"} {"\uD83D\uDEB2"}{bSH}m {"\u2192"} <span style={{ color: "#6ee7b7" }}>{"\uD83C\uDFE0"} {fmt(J.arrHome)}</span></>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* QUICK LINKS */}
        <div className="quick-links" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginTop: 14 }}>
          {[
            { e: "\uD83D\uDE82", l: "Live Trains", u: liveTrainsUrl },
            { e: "\u26A0\uFE0F", l: "Alerts", u: "https://www.nationalrail.co.uk/status-and-disruptions/" },
            { e: "\uD83D\uDCDE", l: "College", u: "https://www.woking.ac.uk/contact/" },
            { e: "\uD83D\uDDFA\uFE0F", l: "Directions", u: `https://www.google.com/maps/dir/${HOME_POSTCODE}/${encodeURIComponent(SCHOOL_NAME)}` },
          ].map((l, i) => (
            <a key={i} href={l.u} target="_blank" rel="noopener noreferrer" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "10px 6px", borderRadius: 12, textDecoration: "none", backgroundColor: "rgba(15,23,42,.5)", border: "1px solid rgba(148,163,184,.06)" }}>
              <span style={{ fontSize: 18 }}>{l.e}</span><span style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8" }}>{l.l}</span>
            </a>
          ))}
        </div>

        {/* CHECKLIST */}
        <Card style={{ marginTop: 14 }}>
          <Lbl icon={"\uD83D\uDCCB"}>Tom's Checklist</Lbl>
          <div className="checklist-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
            {[
              { t: "Bike lights charged", s: pDark },
              { t: "Waterproof packed", s: pRain },
              { t: "Mudguards on", s: pRain },
              { t: "Train ticket / railcard", s: true },
              { t: "Phone charged", s: true },
              { t: "College bag packed", s: hasClass },
              { t: "Water bottle", s: pTemp > 15 || dayActivities.length > 0 },
              { t: "Hi-vis for cycling", s: pDark },
              { t: "Spare socks", s: pRain },
              { t: "PE kit", s: !!peSession },
              { t: "Sport kit & trainers", s: !!peSession },
              { t: "Sun cream", s: pTemp > 20 && dayActivities.some(a => a.outdoor) },
            ].filter(x => x.s).map((x, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#cbd5e1", padding: "5px 8px", borderRadius: 8, backgroundColor: "rgba(99,102,241,.04)" }}>{"\u2610"} {x.t}</div>)}
          </div>
        </Card>

        {/* BIKE-ON-TRAIN RULES */}
        <Card style={{ marginTop: 14, animation: "slideIn .86s" }}>
          <Lbl icon={"\uD83D\uDEB2"}>Bike-on-Train Rules (SWR)</Lbl>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {SWR_BIKE_RULES.map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 11, color: "#cbd5e1", padding: "4px 0" }}>
                <span style={{ flexShrink: 0 }}>{r.icon}</span><span>{r.rule}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 8, fontSize: 10, color: "#64748b" }}>
            Source: South Western Railway · Tom's route (Godalming/Farncombe → Woking) has no peak restrictions
          </div>
        </Card>

        {/* COMMUTE STATS & CO2 */}
        {commuteLog.length > 0 && (
          <Card style={{ marginTop: 14, animation: "slideIn .88s" }} glow="rgba(16,185,129,.06)">
            <Lbl icon={"\uD83D\uDCCA"}>Commute Stats & CO2 Savings</Lbl>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
              {[
                { v: streakDays, l: "Day Streak", icon: "\uD83D\uDD25", c: "#f59e0b" },
                { v: thisWeekCommutes.length, l: "This Week", icon: "\uD83D\uDCC5", c: "#818cf8" },
                { v: `${Math.round(totalBikeKm)}km`, l: "Total Cycled", icon: "\uD83D\uDEB2", c: "#6ee7b7" },
                { v: `${co2SavedKg}kg`, l: "CO2 Saved", icon: "\uD83C\uDF3F", c: "#22c55e" },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: "center", padding: "10px 6px", borderRadius: 10, backgroundColor: "rgba(99,102,241,.05)", border: "1px solid rgba(99,102,241,.08)" }}>
                  <div style={{ fontSize: 14 }}>{s.icon}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", color: s.c }}>{s.v}</div>
                  <div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 600 }}>{s.l}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 10, color: "#64748b", textAlign: "center" }}>
              {thisMonthCommutes.length} commutes this month · {commuteLog.length} total tracked
            </div>
          </Card>
        )}

        {/* RAILCARD SAVINGS TRACKER */}
        <Card style={{ marginTop: 14, animation: "slideIn .9s" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <Lbl icon={"\uD83C\uDFAB"}>16-25 Railcard Savings</Lbl>
            <button onClick={() => setShowCostEntry(p => !p)} style={{
              padding: "4px 12px", borderRadius: 8, border: "1px solid rgba(16,185,129,.3)",
              backgroundColor: "rgba(16,185,129,.1)", color: "#6ee7b7", fontSize: 10, fontWeight: 700, cursor: "pointer"
            }}>{showCostEntry ? "Cancel" : "+ Log Ticket"}</button>
          </div>
          {showCostEntry && (
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input value={costInput} onChange={e => setCostInput(e.target.value)} placeholder="Full ticket price (\u00A3)" type="number" step="0.01" style={{
                flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(148,163,184,.2)",
                backgroundColor: "rgba(15,23,42,.8)", color: "#e2e8f0", fontSize: 13, fontFamily: "'JetBrains Mono',monospace", outline: "none"
              }} />
              <button onClick={logCost} style={{
                padding: "8px 16px", borderRadius: 8, border: "none",
                backgroundColor: "#10b981", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer"
              }}>Save</button>
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[
              { v: `\u00A3${thisWeekCosts.reduce((s, c) => s + c.saved, 0).toFixed(2)}`, l: "Saved This Week", c: "#6ee7b7" },
              { v: `\u00A3${thisMonthCosts.reduce((s, c) => s + c.saved, 0).toFixed(2)}`, l: "Saved This Month", c: "#818cf8" },
              { v: `\u00A3${totalSaved.toFixed(2)}`, l: "Total Saved", c: "#f59e0b" },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: "center", padding: "10px 6px", borderRadius: 10, backgroundColor: "rgba(99,102,241,.05)", border: "1px solid rgba(99,102,241,.08)" }}>
                <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", color: s.c }}>{s.v}</div>
                <div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 600 }}>{s.l}</div>
              </div>
            ))}
          </div>
          {costLog.length > 0 && (
            <div style={{ marginTop: 8, fontSize: 10, color: "#64748b", textAlign: "center" }}>
              {costLog.length} tickets logged · Avg saving: \u00A3{(totalSaved / costLog.length).toFixed(2)} per ticket
            </div>
          )}
        </Card>

        {/* TIMETABLE & EXAM MANAGEMENT */}
        <Card style={{ marginTop: 14, animation: "slideIn .92s" }}>
          <Lbl icon={"\u2699\uFE0F"}>Timetable & Exam Management</Lbl>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => setShowTTUpload(p => !p)} style={{
              padding: "8px 16px", borderRadius: 10, border: "1px solid rgba(99,102,241,.3)",
              backgroundColor: "rgba(99,102,241,.1)", color: "#818cf8", fontSize: 11, fontWeight: 700, cursor: "pointer"
            }}>{"\uD83D\uDCF7"} {showTTUpload ? "Cancel" : customTT ? "Update Timetable" : "Upload Timetable"}</button>
            <button onClick={() => setShowExamUpload(p => !p)} style={{
              padding: "8px 16px", borderRadius: 10, border: "1px solid rgba(239,68,68,.3)",
              backgroundColor: "rgba(239,68,68,.1)", color: "#fca5a5", fontSize: 11, fontWeight: 700, cursor: "pointer"
            }}>{"\uD83D\uDCDD"} {showExamUpload ? "Cancel" : examTT.length > 0 ? "Update Exams" : "Upload Exam Timetable"}</button>
            {customTT && (
              <button onClick={() => { setCustomTT(null); localStorage.removeItem('ttc_custom_tt'); }} style={{
                padding: "8px 16px", borderRadius: 10, border: "1px solid rgba(148,163,184,.2)",
                backgroundColor: "rgba(148,163,184,.05)", color: "#94a3b8", fontSize: 11, fontWeight: 700, cursor: "pointer"
              }}>Reset to Default Timetable</button>
            )}
          </div>
          {customTT && <div style={{ marginTop: 6, fontSize: 10, color: "#6ee7b7" }}>{"\u2705"} Using uploaded timetable</div>}

          {showTTUpload && (
            <div style={{ marginTop: 12, padding: "14px", borderRadius: 10, backgroundColor: "rgba(99,102,241,.06)", border: "1px solid rgba(99,102,241,.15)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#c7d2fe", marginBottom: 8 }}>Upload your timetable photo or paste text</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <label style={{
                  padding: "10px 20px", borderRadius: 10, border: "2px dashed rgba(99,102,241,.3)",
                  backgroundColor: "rgba(99,102,241,.05)", color: "#818cf8", fontSize: 12, fontWeight: 700, cursor: "pointer", textAlign: "center", flex: 1
                }}>
                  {uploadingTT ? "Processing..." : "\uD83D\uDCF7 Take Photo / Upload Image"}
                  <input type="file" accept="image/*" capture="environment" onChange={e => e.target.files[0] && handleTTUpload(e.target.files[0])} style={{ display: "none" }} disabled={uploadingTT} />
                </label>
                <label style={{
                  padding: "10px 20px", borderRadius: 10, border: "2px dashed rgba(16,185,129,.3)",
                  backgroundColor: "rgba(16,185,129,.05)", color: "#6ee7b7", fontSize: 12, fontWeight: 700, cursor: "pointer", textAlign: "center", flex: 1
                }}>
                  {"\uD83D\uDCC4"} Upload Text File
                  <input type="file" accept=".txt,.csv,.ics" onChange={e => e.target.files[0] && handleTTUpload(e.target.files[0])} style={{ display: "none" }} disabled={uploadingTT} />
                </label>
              </div>
              <div style={{ marginTop: 6, fontSize: 10, color: "#94a3b8" }}>
                Supports: photos of printed timetables, screenshots, .txt, .csv files. AI-powered extraction via Claude.
              </div>
            </div>
          )}

          {showExamUpload && (
            <div style={{ marginTop: 12, padding: "14px", borderRadius: 10, backgroundColor: "rgba(239,68,68,.06)", border: "1px solid rgba(239,68,68,.15)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#fca5a5", marginBottom: 8 }}>Upload your exam timetable</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <label style={{
                  padding: "10px 20px", borderRadius: 10, border: "2px dashed rgba(239,68,68,.3)",
                  backgroundColor: "rgba(239,68,68,.05)", color: "#fca5a5", fontSize: 12, fontWeight: 700, cursor: "pointer", textAlign: "center", flex: 1
                }}>
                  {uploadingExam ? "Processing..." : "\uD83D\uDCF7 Take Photo / Upload Image"}
                  <input type="file" accept="image/*" capture="environment" onChange={e => e.target.files[0] && handleExamUpload(e.target.files[0])} style={{ display: "none" }} disabled={uploadingExam} />
                </label>
                <label style={{
                  padding: "10px 20px", borderRadius: 10, border: "2px dashed rgba(245,158,11,.3)",
                  backgroundColor: "rgba(245,158,11,.05)", color: "#fcd34d", fontSize: 12, fontWeight: 700, cursor: "pointer", textAlign: "center", flex: 1
                }}>
                  {"\uD83D\uDCC4"} Upload Text File
                  <input type="file" accept=".txt,.csv" onChange={e => e.target.files[0] && handleExamUpload(e.target.files[0])} style={{ display: "none" }} disabled={uploadingExam} />
                </label>
              </div>
              <div style={{ marginTop: 6, fontSize: 10, color: "#94a3b8" }}>
                Upload exam schedule photo or text. AI extracts dates, times, subjects, rooms and seat numbers.
              </div>
            </div>
          )}
        </Card>

        {/* FOOTER */}
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 10, color: "#475569" }}>
          <div>{HOME_POSTCODE} {"\uD83D\uDEB2"} Godalming / Farncombe {"\uD83D\uDE82"} {SCHOOL_STATION} {"\uD83D\uDE82"} {RUBY_STATION} {"\u2764\uFE0F"} {RUBY_POSTCODE}</div>
          <div style={{ marginTop: 3 }}>National Rail Darwin {"\u00B7"} Open-Meteo {"\u00B7"} Term: {TERM_START.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} {"\u2013"} {TERM_END.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</div>
          <div style={{ marginTop: 6 }}><button onClick={() => { fetchTrains(); fetchWx(); }} style={{ padding: "5px 14px", borderRadius: 8, border: "1px solid rgba(99,102,241,.3)", backgroundColor: "rgba(99,102,241,.1)", color: "#818cf8", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>{"\uD83D\uDD04"} Refresh</button></div>
        </div>
      </div>

      {/* DELAY REPAY MODAL */}
      {delayRepayModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,.7)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20 }} onClick={() => { setDelayRepayDismissed(p => [...p, delayRepayModal.trainId]); setDelayRepayModal(null); }}>
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: 420, width: "100%", padding: "24px", borderRadius: 16, backgroundColor: "#0f172a", border: "2px solid rgba(239,68,68,.4)", boxShadow: "0 20px 60px rgba(0,0,0,.6)" }}>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>{"\uD83D\uDCB0"}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#fca5a5" }}>Delay Repay Eligible!</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>Your train was {delayRepayModal.delayMins}+ minutes late. You can claim compensation.</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
              {[
                { l: "Date", v: delayRepayModal.date },
                { l: "From", v: `${delayRepayModal.from} (${delayRepayModal.fromCode})` },
                { l: "To", v: `${delayRepayModal.to} (${delayRepayModal.toCode})` },
                { l: "Scheduled", v: delayRepayModal.scheduled },
                { l: "Expected", v: delayRepayModal.expected },
                { l: "Delay", v: `${delayRepayModal.delayMins} minutes` },
                { l: "Operator", v: delayRepayModal.operator },
              ].map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", borderRadius: 6, backgroundColor: "rgba(99,102,241,.05)" }}>
                  <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>{r.l}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0", fontFamily: "'JetBrains Mono',monospace" }}>{r.v}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <a href="https://www.southwesternrailway.com/contact-and-help/delay-repay" target="_blank" rel="noopener noreferrer" onClick={() => {
                setDelayRepayHistory(prev => [{ ...delayRepayModal, claimedAt: new Date().toISOString(), status: "submitted" }, ...prev]);
                setDelayRepayDismissed(p => [...p, delayRepayModal.trainId]);
                setDelayRepayModal(null);
              }} style={{
                flex: 1, padding: "12px", borderRadius: 10, border: "none", textAlign: "center", textDecoration: "none",
                backgroundColor: "#10b981", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer"
              }}>Claim Now {"\u2192"}</a>
              <button onClick={() => { setDelayRepayDismissed(p => [...p, delayRepayModal.trainId]); setDelayRepayModal(null); }} style={{
                padding: "12px 20px", borderRadius: 10, border: "1px solid rgba(148,163,184,.2)",
                backgroundColor: "rgba(148,163,184,.05)", color: "#94a3b8", fontSize: 12, fontWeight: 600, cursor: "pointer"
              }}>Dismiss</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
