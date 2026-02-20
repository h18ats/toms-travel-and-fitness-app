import { useState, useEffect, useCallback, useMemo } from "react";

// ═══════════════════════════════════════════════════════════════
// TOM'S TRAVEL COMPANION
// ═══════════════════════════════════════════════════════════════
// ⚡ EDIT THESE PLACEHOLDERS to match Tom's actual details
// ═══════════════════════════════════════════════════════════════

// ── LOCATION CONFIG (change these!) ──────────────────────────
const HOME_POSTCODE = "GU15 1AA";          // Tom's home postcode
const HOME_STATION = "Ash Vale";            // Nearest station to home
const HOME_STATION_CODE = "AHV";            // National Rail CRS code
const SCHOOL_STATION = "Guildford";         // Nearest station to school
const SCHOOL_STATION_CODE = "GLD";          // National Rail CRS code
const SCHOOL_NAME = "Tom's School";         // School name
const WX_LAT = 51.2362;                    // Weather latitude
const WX_LON = -0.5704;                    // Weather longitude

// ── ROUTE DISTANCES ──────────────────────────────────────────
const BIKE_HOME_STN = { mi: 1.8, mins: 11 };   // Home → home station
const BIKE_STN_SCHOOL = { mi: 1.2, mins: 8 };  // School station → school
const TRAIN_MINS = 12;                           // Train journey time
const BUF = 5;                                   // Buffer minutes

// ── TERM DATES ───────────────────────────────────────────────
const TERM_START = new Date(2026, 0, 5);   // 5 Jan 2026
const TERM_END = new Date(2026, 6, 17);    // 17 Jul 2026

// ═══════════════════════════════════════════════════════════════
// TIMETABLE — Sample school timetable for Tom
// Edit sessions, subjects, teachers and rooms to match
// ═══════════════════════════════════════════════════════════════
const TT = {
  1: {
    label: "Monday",
    sessions: [
      { time: "08:45-09:45", subj: "English", teacher: "Mrs Smith", room: "B12" },
      { time: "09:45-10:45", subj: "Maths", teacher: "Mr Jones", room: "C04" },
      { time: "11:00-12:00", subj: "Science", teacher: "Dr Patel", room: "L01" },
      { time: "13:00-14:00", subj: "PE — Football", teacher: "Mr Williams", room: "Field", pe: true, activity: "Football", outdoor: true },
      { time: "14:15-15:15", subj: "Geography", teacher: "Ms Taylor", room: "A08" },
    ],
    start: "08:45", end: "15:15",
  },
  2: {
    label: "Tuesday",
    sessions: [
      { time: "08:45-09:45", subj: "History", teacher: "Mr Brown", room: "A10" },
      { time: "09:45-10:45", subj: "French", teacher: "Mme Dupont", room: "D02" },
      { time: "11:00-12:00", subj: "Art", teacher: "Mrs Green", room: "Art 1" },
      { time: "13:00-14:00", subj: "Computing", teacher: "Mr Shah", room: "IT1" },
      { time: "14:15-15:15", subj: "Music", teacher: "Ms Clarke", room: "Mu1" },
    ],
    start: "08:45", end: "15:15",
  },
  3: {
    label: "Wednesday",
    sessions: [
      { time: "08:45-09:45", subj: "Maths", teacher: "Mr Jones", room: "C04" },
      { time: "09:45-10:45", subj: "English", teacher: "Mrs Smith", room: "B12" },
      { time: "11:00-12:00", subj: "PE — Swimming", teacher: "Mr Williams", room: "Pool", pe: true, activity: "Swimming", outdoor: false },
      { time: "13:00-14:00", subj: "Design Tech", teacher: "Mr Reid", room: "DT1" },
      { time: "14:15-15:15", subj: "Science", teacher: "Dr Patel", room: "L01" },
    ],
    start: "08:45", end: "15:15",
  },
  4: {
    label: "Thursday",
    sessions: [
      { time: "08:45-09:45", subj: "French", teacher: "Mme Dupont", room: "D02" },
      { time: "09:45-10:45", subj: "Science", teacher: "Dr Patel", room: "L02" },
      { time: "11:00-12:00", subj: "History", teacher: "Mr Brown", room: "A10" },
      { time: "13:00-14:00", subj: "PE — Rugby", teacher: "Mr Williams", room: "Field", pe: true, activity: "Rugby", outdoor: true },
      { time: "14:15-15:15", subj: "PSHE", teacher: "Mrs Adams", room: "B03" },
    ],
    start: "08:45", end: "15:15",
  },
  5: {
    label: "Friday",
    sessions: [
      { time: "08:45-09:45", subj: "Maths", teacher: "Mr Jones", room: "C04" },
      { time: "09:45-10:45", subj: "Geography", teacher: "Ms Taylor", room: "A08" },
      { time: "11:00-12:00", subj: "English", teacher: "Mrs Smith", room: "B12" },
      { time: "13:00-14:00", subj: "Computing", teacher: "Mr Shah", room: "IT1" },
      { time: "14:15-15:15", subj: "PE — Athletics", teacher: "Mr Williams", room: "Track / Gym", pe: true, activity: "Athletics", outdoor: true },
    ],
    start: "08:45", end: "15:15",
  },
  6: { label: "Saturday", sessions: [], start: null, end: null },
  0: { label: "Sunday", sessions: [], start: null, end: null },
};

// ═══════════════════════════════════════════════════════════════
// AFTER-SCHOOL ACTIVITIES (optional — toggle on/off in app)
// ═══════════════════════════════════════════════════════════════
const AFTER_SCHOOL = {
  1: { name: "Football Club", time: "15:30-16:30", location: "School Field", outdoor: true, activity: "Football" },
  2: null,
  3: { name: "Swimming Squad", time: "15:30-16:30", location: "Pool", outdoor: false, activity: "Swimming" },
  4: null,
  5: { name: "Athletics Club", time: "15:30-16:30", location: "Track", outdoor: true, activity: "Athletics" },
  6: null,
  0: null,
};

// ═══════════════════════════════════════════════════════════════
// EXERCISE CALORIE ESTIMATES (cal/min)
// ═══════════════════════════════════════════════════════════════
const EX_CAL = {
  Cycling: 8, Football: 10, Rugby: 12, Swimming: 11, Athletics: 10, Walking: 5, General: 7,
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
// FITNESS LOG — localStorage persistence
// ═══════════════════════════════════════════════════════════════
const LS_KEY = "tom_fitness_log";
const loadFitnessLog = () => { try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; } catch { return []; } };
const saveFitnessLog = (log) => { try { localStorage.setItem(LS_KEY, JSON.stringify(log)); } catch {} };
const todayKey = (d) => d.toISOString().slice(0, 10);

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
const HUXLEY = "https://national-rail-api.davwheat.dev";
const fmt = d => d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
const fmtShort = d => d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
const fmtLong = d => d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const addM = (d, m) => new Date(d.getTime() + m * 60000);
const diffM = (a, b) => Math.round((a - b) / 60000);
const hm = s => { const [h, m] = s.split(":").map(Number); return { h, m }; };
const makeT = (d, h, m) => { const x = new Date(d); x.setHours(h, m, 0, 0); return x; };
const parseTT = (s, ref) => { if (!s || s === "On time" || s === "Cancelled" || s === "Delayed") return null; const p = s.split(":").map(Number); if (p.length < 2 || isNaN(p[0]) || isNaN(p[1])) return null; const d = new Date(ref || new Date()); d.setHours(p[0], p[1], 0, 0); return d; };
const dayClone = (d, off = 0) => { const x = new Date(d); x.setDate(x.getDate() + off); x.setHours(0, 0, 0, 0); return x; };
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

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

// ═══════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════
export default function App() {
  const [now, setNow] = useState(new Date());
  const [wx, setWx] = useState(null);
  const [toSchool, setToSchool] = useState([]);
  const [toHome, setToHome] = useState([]);
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
  const [showFitness, setShowFitness] = useState(true);
  const [showNutrition, setShowNutrition] = useState(true);

  // Fitness log (localStorage-backed)
  const [fitnessLog, setFitnessLog] = useState(loadFitnessLog);
  const logExercise = (entry) => {
    const updated = [...fitnessLog, { ...entry, id: Date.now(), date: todayKey(new Date()) }];
    setFitnessLog(updated);
    saveFitnessLog(updated);
  };
  const removeExercise = (id) => {
    const updated = fitnessLog.filter(e => e.id !== id);
    setFitnessLog(updated);
    saveFitnessLog(updated);
  };

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

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
      const actualEndMins = (showAfterSchool && as) ? hm(as.time.split("-")[1]).h * 60 + hm(as.time.split("-")[1]).m : endMins;

      if (nowMins < startMins + 30) {
        return { planDate: today, dir: manualDir || "to", modeLabel: "Morning \u2014 time to head to school", modeIcon: "\uD83C\uDF05" };
      }
      if (nowMins < actualEndMins) {
        return { planDate: today, dir: manualDir || "from", modeLabel: "At school \u2014 planning your trip home", modeIcon: "\uD83D\uDCDA" };
      }
      const nxt = nextSchoolDay(dayClone(now, 1));
      if (nxt) {
        const daysAway = Math.round((nxt - today) / 864e5);
        const when = daysAway === 1 ? "tomorrow" : `in ${daysAway} days`;
        return { planDate: nxt, dir: manualDir || "to", modeLabel: `Evening \u2014 next school ${when} (${DAYS[nxt.getDay()]})`, modeIcon: "\uD83C\uDF19" };
      }
    }

    const nxt = nextSchoolDay(dayClone(now, hasClassToday ? 1 : 0));
    if (nxt) {
      const daysAway = Math.round((nxt - today) / 864e5);
      const when = daysAway === 0 ? "today" : daysAway === 1 ? "tomorrow" : `in ${daysAway} days`;
      const timeOfDay = now.getHours() >= 17 ? "Evening" : now.getHours() >= 12 ? "Afternoon" : "Morning";
      return { planDate: nxt, dir: manualDir || "to", modeLabel: `${timeOfDay} \u2014 next school ${when} (${DAYS[nxt.getDay()]})`, modeIcon: "\uD83C\uDF19" };
    }
    return { planDate: today, dir: manualDir || "to", modeLabel: "Outside term dates", modeIcon: "\uD83C\uDFD6\uFE0F" };
  }, [now, manualDate, manualDir, showAfterSchool]);

  const isToday = planDate.toDateString() === new Date().toDateString();
  const isFuture = !isToday;
  const tt = TT[planDate.getDay()];
  const hasClass = tt.sessions.length > 0;
  const inTerm = planDate >= TERM_START && planDate <= TERM_END;
  const afterSchool = AFTER_SCHOOL[planDate.getDay()];
  const peSession = tt.sessions.find(s => s.pe);
  const dayActivities = [peSession, showAfterSchool ? afterSchool : null].filter(Boolean);

  // Effective end time (accounting for after-school if toggled on)
  const effectiveEnd = (showAfterSchool && afterSchool) ? afterSchool.time.split("-")[1] : tt.end;

  // ═══════════════════════════════════════════════════════════
  // WEATHER + BIKE ADJUSTMENTS
  // ═══════════════════════════════════════════════════════════
  const fetchWx = useCallback(async () => {
    try { const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${WX_LAT}&longitude=${WX_LON}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_gusts_10m&hourly=temperature_2m,precipitation_probability,weather_code&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max,weather_code&timezone=Europe/London&forecast_days=7`); setWx(await r.json()); } catch (e) { console.error(e); }
  }, []);

  const fetchTrains = useCallback(async () => {
    try {
      const [a, b] = await Promise.all([
        fetch(`${HUXLEY}/departures/${HOME_STATION_CODE}/to/${SCHOOL_STATION_CODE}/15`),
        fetch(`${HUXLEY}/departures/${SCHOOL_STATION_CODE}/to/${HOME_STATION_CODE}/15`),
      ]);
      const [ad, bd] = await Promise.all([a.json(), b.json()]);
      setToSchool(ad.trainServices || []);
      setToHome(bd.trainServices || []);
      setAlerts(ad.nrccMessages ? ad.nrccMessages.map(m => typeof m === "string" ? m : m.value || "") : []);
      setLastRef(new Date());
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    (async () => { setLoading(true); await Promise.all([fetchWx(), fetchTrains()]); setLoading(false); })();
    const t1 = setInterval(fetchTrains, 60000), t2 = setInterval(fetchWx, 600000);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, [fetchWx, fetchTrains]);

  useEffect(() => setSelTrain(null), [planDate, dir]);

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
  const bHS = BIKE_HOME_STN.mins + bikeAdj;
  const bSS = BIKE_STN_SCHOOL.mins + Math.ceil(bikeAdj / 2);
  const bSS2 = BIKE_STN_SCHOOL.mins + Math.ceil(bikeAdj / 2);
  const bSH = BIKE_HOME_STN.mins + bikeAdj;
  const clothing = clothe(pTemp, pRain, curWind, pDark);

  // Safety calculations
  const tSafety = travelSafety(pTemp, pRain, curWind, pDark, pWxCode);
  const aSafety = peSession ? actSafety(peSession.activity, peSession.outdoor, pTemp, pRain, curWind, pWxCode) : { tips: [], warnings: [] };
  const asAfterSafety = (showAfterSchool && afterSchool) ? actSafety(afterSchool.activity, afterSchool.outdoor, pTemp, pRain, curWind, pWxCode) : { tips: [], warnings: [] };

  // ═══════════════════════════════════════════════════════════
  // JOURNEY CALCULATIONS
  // ═══════════════════════════════════════════════════════════
  const trains = dir === "to" ? toSchool : toHome;
  const arriveByStr = tt.start || "08:45";
  const finishStr = effectiveEnd || "15:15";
  const arriveBy = (() => { const p = hm(arriveByStr); return makeT(planDate, p.h, p.m); })();
  const finishAt = (() => { const p = hm(finishStr); return makeT(planDate, p.h, p.m); })();

  const idealTrainDepTo = addM(arriveBy, -(bSS + BUF + TRAIN_MINS));
  const idealLeaveHome = addM(idealTrainDepTo, -(bHS + BUF));
  const idealTrainDepFrom = addM(finishAt, bSS2 + BUF);

  const autoTrain = useMemo(() => {
    const target = dir === "to" ? idealTrainDepTo : idealTrainDepFrom;
    return trains.find(t => {
      const dep = parseTT(t.std, planDate);
      if (!dep || t.etd === "Cancelled") return false;
      return dep >= addM(target, -12) && dep <= addM(target, 30);
    });
  }, [dir, trains, idealTrainDepTo, idealTrainDepFrom, planDate]);

  const activeTrain = selTrain ? trains.find(t => t.std === selTrain) : autoTrain;

  const J = useMemo(() => {
    if (dir === "to") {
      const tDep = activeTrain ? (parseTT(activeTrain.etd === "On time" ? activeTrain.std : activeTrain.etd, planDate) || parseTT(activeTrain.std, planDate)) : idealTrainDepTo;
      const leave = addM(tDep, -(bHS + BUF));
      const arrStn = addM(tDep, TRAIN_MINS);
      const arrSchool = addM(arrStn, bSS + BUF);
      const late = arrSchool > arriveBy;
      const spare = diffM(arriveBy, arrSchool);
      return { leave, tDep, arrStn, arrSchool, late, spare, tStr: activeTrain?.std || fmt(idealTrainDepTo) };
    }
    const tDep = activeTrain ? (parseTT(activeTrain.etd === "On time" ? activeTrain.std : activeTrain.etd, planDate) || parseTT(activeTrain.std, planDate)) : idealTrainDepFrom;
    const leaveSchool = addM(tDep, -(bSS2 + BUF));
    const arrStn = addM(tDep, TRAIN_MINS);
    const arrHome = addM(arrStn, bSH);
    return { leaveSchool, tDep, arrStn, arrHome, tStr: activeTrain?.std || fmt(idealTrainDepFrom) };
  }, [dir, activeTrain, planDate, idealTrainDepTo, idealTrainDepFrom, bHS, bSS, bSS2, bSH, arriveBy]);

  const countdown = isToday ? diffM(dir === "to" ? J.leave : J.leaveSchool, now) : null;
  const sts = trains.some(t => t.etd === "Cancelled") ? "danger" : trains.some(t => t.etd !== "On time" && t.etd !== t.std && t.etd !== "\u2014") ? "warning" : "good";

  const dateBtns = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 7; i++) {
      const d = dayClone(now, i);
      const t = TT[d.getDay()];
      arr.push({ date: d, label: i === 0 ? "Today" : i === 1 ? "Tmrw" : DAYS[d.getDay()].slice(0, 3), hasClass: t.sessions.length > 0 && d >= TERM_START && d <= TERM_END, dateStr: `${d.getDate()}/${d.getMonth() + 1}`, isAuto: manualDate === null && d.toDateString() === planDate.toDateString() });
    }
    return arr;
  }, [now, manualDate, planDate]);

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
      `}</style>

      <div style={{ maxWidth: 920, margin: "0 auto", padding: "16px 16px 40px" }}>

        {/* HEADER */}
        <div style={{ textAlign: "center", marginBottom: 12, animation: "slideIn .4s" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 4, color: "#818cf8", textTransform: "uppercase" }}>{"\uD83D\uDEB2"} Tom's Travel Companion {"\uD83D\uDE82"}</div>
          <div style={{ fontSize: 42, fontWeight: 900, letterSpacing: -1, fontFamily: "'JetBrains Mono',monospace", background: "linear-gradient(135deg,#e2e8f0,#818cf8,#6ee7b7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{fmt(now)}</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>{fmtLong(now)}</div>
        </div>

        {/* OPTIONAL FEATURE TOGGLES */}
        <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 12, flexWrap: "wrap", animation: "slideIn .42s" }}>
          <Toggle on={showAfterSchool} onToggle={() => setShowAfterSchool(p => !p)} label="After-school" />
          <Toggle on={showActivitySafety} onToggle={() => setShowActivitySafety(p => !p)} label="Activity safety" />
          <Toggle on={showTravelSafety} onToggle={() => setShowTravelSafety(p => !p)} label="Travel safety" />
          <Toggle on={showFitness} onToggle={() => setShowFitness(p => !p)} label="Fitness" />
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
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {[{ v: null, l: "Auto" }, { v: "to", l: `\u2192 School` }, { v: "from", l: `\u2192 Home` }].map(o => (
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
        {(!hasClass || !inTerm) && (
          <Card style={{ marginBottom: 14, borderColor: "rgba(139,92,246,.2)" }}>
            <div style={{ textAlign: "center", padding: 10 }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{!inTerm ? "\uD83C\uDFD6\uFE0F" : "\uD83D\uDE34"}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#a78bfa" }}>{!inTerm ? "Outside Term Dates" : `No School on ${tt.label}s`}</div>
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
            <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", color: countdown <= 0 ? "#fca5a5" : countdown <= 15 ? "#fcd34d" : "#6ee7b7" }}>
              {countdown <= 0 ? `${Math.abs(countdown)} min overdue` : `${countdown} min until you leave`}
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
              {dir === "to"
                ? <>Leave by <strong style={{ color: "#e2e8f0" }}>{fmt(J.leave)}</strong> {"\u2192"} school starts <strong style={{ color: J.late ? "#fca5a5" : "#e2e8f0" }}>{arriveByStr}</strong></>
                : <>Leave school {"\u2192"} home by <strong style={{ color: "#e2e8f0" }}>{fmt(J.arrHome)}</strong></>}
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
            </div>
            {dir === "to" ? (
              <>
                <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", color: "#c7d2fe" }}>Leave home at {fmt(J.leave)}</div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 6, lineHeight: 1.6 }}>
                  {"\uD83D\uDEB2"} Bike {bHS}min to {HOME_STATION} {"\u2192"} {"\uD83D\uDE82"} {J.tStr} train {"\u2192"} {"\uD83D\uDEB2"} Bike {bSS}min to school
                </div>
                {J.late ? <div style={{ fontSize: 13, color: "#fca5a5", marginTop: 6, fontWeight: 700 }}>{"\u26A0\uFE0F"} Arrive {fmt(J.arrSchool)} {"\u2014"} LATE for {arriveByStr} start!</div>
                  : <div style={{ fontSize: 12, color: "#6ee7b7", marginTop: 6 }}>{"\u2705"} Arrive {fmt(J.arrSchool)} {"\u2014"} {J.spare} minutes spare</div>}
              </>
            ) : (
              <>
                <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", color: "#c7d2fe" }}>Home by ~{fmt(J.arrHome)}</div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 6, lineHeight: 1.6 }}>
                  {"\uD83C\uDF93"} Finishes {finishStr} {"\u2192"} {"\uD83D\uDEB2"} {bSS2}min to station {"\u2192"} {"\uD83D\uDE82"} {J.tStr} train {"\u2192"} {"\uD83D\uDEB2"} {bSH}min home
                </div>
              </>
            )}
          </div>
        )}

        {/* JOURNEY TIMELINE */}
        {hasClass && inTerm && (
          <Card style={{ marginBottom: 14, animation: "slideIn .55s" }}>
            <Lbl icon={"\uD83D\uDCCD"}>{dir === "to" ? "Journey to School" : "Journey Home"}</Lbl>
            <div style={{ display: "flex", alignItems: "center", gap: 0, flexWrap: "wrap", justifyContent: "center" }}>
              {(dir === "to" ? [
                { icon: "\uD83C\uDFE0", lbl: "Home", time: fmt(J.leave), sub: HOME_POSTCODE },
                { icon: "\uD83D\uDEB2", lbl: `${bHS}m`, sub: `${BIKE_HOME_STN.mi}mi`, tr: true },
                { icon: "\uD83D\uDE89", lbl: HOME_STATION, time: J.tStr, sub: HOME_STATION_CODE },
                { icon: "\uD83D\uDE82", lbl: `${TRAIN_MINS}m`, sub: "Train", tr: true },
                { icon: "\uD83D\uDE89", lbl: SCHOOL_STATION, time: fmt(J.arrStn), sub: SCHOOL_STATION_CODE },
                { icon: "\uD83D\uDEB2", lbl: `${bSS}m`, sub: `${BIKE_STN_SCHOOL.mi}mi`, tr: true },
                { icon: "\uD83C\uDFEB", lbl: "School", time: fmt(J.arrSchool), sub: J.late ? "LATE!" : "\u2713", late: J.late },
              ] : [
                { icon: "\uD83C\uDFEB", lbl: "School", time: finishStr, sub: "Finish" },
                { icon: "\uD83D\uDEB2", lbl: `${bSS2}m`, sub: `${BIKE_STN_SCHOOL.mi}mi`, tr: true },
                { icon: "\uD83D\uDE89", lbl: SCHOOL_STATION, time: J.tStr, sub: SCHOOL_STATION_CODE },
                { icon: "\uD83D\uDE82", lbl: `${TRAIN_MINS}m`, sub: "Train", tr: true },
                { icon: "\uD83D\uDE89", lbl: HOME_STATION, time: fmt(J.arrStn), sub: HOME_STATION_CODE },
                { icon: "\uD83D\uDEB2", lbl: `${bSH}m`, sub: `${BIKE_HOME_STN.mi}mi`, tr: true },
                { icon: "\uD83C\uDFE0", lbl: "Home", time: fmt(J.arrHome), sub: HOME_POSTCODE },
              ]).map((s, i, a) => (
                <div key={i} style={{ display: "flex", alignItems: "center" }}>
                  <div style={{ textAlign: "center", minWidth: s.tr ? 50 : 64, padding: "5px 3px", borderRadius: 10, backgroundColor: s.tr ? "transparent" : s.late ? "rgba(239,68,68,.1)" : "rgba(99,102,241,.08)" }}>
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
          </Card>
        )}

        {/* MAIN GRID: TIMETABLE / WEATHER / CLOTHING */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
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
            {hasClass && <div style={{ marginTop: 6, fontSize: 10, color: "#64748b", textAlign: "center" }}>School: <strong style={{ color: "#e2e8f0" }}>{tt.start}</strong> {"\u2013"} <strong style={{ color: "#e2e8f0" }}>{tt.end}</strong>{showAfterSchool && afterSchool && <> + club until <strong style={{ color: "#fcd34d" }}>{afterSchool.time.split("-")[1]}</strong></>}</div>}
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

        {/* TODAY'S ACTIVITIES — what Tom is doing */}
        {hasClass && inTerm && dayActivities.length > 0 && (
          <Card style={{ marginTop: 14, animation: "slideIn .72s" }} glow="rgba(16,185,129,.08)">
            <Lbl icon={"\u26BD"}>{isToday ? "Today's Activities" : `${tt.label}'s Activities`}</Lbl>
            <div style={{ display: "grid", gridTemplateColumns: dayActivities.length > 1 ? "1fr 1fr" : "1fr", gap: 10 }}>
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
          <div style={{ display: "grid", gridTemplateColumns: showActivitySafety && showTravelSafety ? "1fr 1fr" : "1fr", gap: 14, marginTop: 14 }}>
            {/* Activity Safety */}
            {showActivitySafety && (aSafety.tips.length > 0 || asAfterSafety.tips.length > 0) && (
              <Card style={{ animation: "slideIn .75s" }} glow={aSafety.warnings.length > 0 || asAfterSafety.warnings.length > 0 ? "rgba(245,158,11,.08)" : undefined}>
                <Lbl icon={"\uD83D\uDEE1\uFE0F"}>Activity Safety</Lbl>
                {/* PE warnings */}
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

        {/* ═══ FITNESS TRACKER ═══ */}
        {showFitness && (
          <Card style={{ marginTop: 14, animation: "slideIn .82s" }} glow="rgba(168,85,247,.08)">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <Lbl icon={"\uD83C\uDFCB\uFE0F"}>Fitness Tracker</Lbl>
              <a href="https://apps.apple.com/app/apple-fitness/id1208224953" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 12, backgroundColor: "rgba(16,185,129,.1)", border: "1px solid rgba(16,185,129,.2)", textDecoration: "none", fontSize: 10, fontWeight: 700, color: "#6ee7b7" }}>
                {"\uF8FF"} Open Apple Fitness
              </a>
            </div>

            <div style={{ fontSize: 11, color: "#a78bfa", marginBottom: 10, padding: "5px 10px", borderRadius: 8, backgroundColor: "rgba(139,92,246,.06)", border: "1px solid rgba(139,92,246,.1)" }}>
              Log workouts here and track in Apple Fitness for full health data. Cycling commute auto-estimates below.
            </div>

            {/* Today's auto-estimated activity */}
            {(() => {
              const todayStr = todayKey(new Date());
              const todayLogs = fitnessLog.filter(e => e.date === todayStr);
              const todayCal = todayLogs.reduce((s, e) => s + (e.calories || 0), 0);
              const todayMins = todayLogs.reduce((s, e) => s + (e.mins || 0), 0);

              // Auto-estimate from today's commute cycling
              const cycleToday = isToday && hasClass && inTerm;
              const cycleMins = cycleToday ? (bHS + bSS + bSS2 + bSH) : 0;
              const cycleCal = cycleMins * (EX_CAL.Cycling || 8);
              const cycleKm = cycleToday ? ((BIKE_HOME_STN.mi + BIKE_STN_SCHOOL.mi) * 2 * 1.61).toFixed(1) : 0;

              // PE estimate
              const peMins = peSession ? 60 : 0;
              const peCal = peSession ? 60 * (EX_CAL[peSession.activity] || 7) : 0;

              // After-school estimate
              const asMins = (showAfterSchool && afterSchool) ? 60 : 0;
              const asCal = (showAfterSchool && afterSchool) ? 60 * (EX_CAL[afterSchool.activity] || 7) : 0;

              const totalMins = todayMins + cycleMins + peMins + asMins;
              const totalCal = todayCal + cycleCal + peCal + asCal;

              // Weekly summary
              const weekStart = dayClone(new Date(), -new Date().getDay() + 1);
              const weekLogs = fitnessLog.filter(e => e.date >= todayKey(weekStart));
              const weekCal = weekLogs.reduce((s, e) => s + (e.calories || 0), 0);
              const weekMins = weekLogs.reduce((s, e) => s + (e.mins || 0), 0);

              return <>
                {/* Today's summary */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                  <div style={{ textAlign: "center", padding: "10px 6px", borderRadius: 10, backgroundColor: "rgba(168,85,247,.08)", border: "1px solid rgba(168,85,247,.15)" }}>
                    <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", color: "#c084fc" }}>{totalMins}</div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", letterSpacing: 1 }}>MINS TODAY</div>
                  </div>
                  <div style={{ textAlign: "center", padding: "10px 6px", borderRadius: 10, backgroundColor: "rgba(239,68,68,.06)", border: "1px solid rgba(239,68,68,.12)" }}>
                    <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", color: "#f87171" }}>{totalCal}</div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", letterSpacing: 1 }}>CALS TODAY</div>
                  </div>
                  <div style={{ textAlign: "center", padding: "10px 6px", borderRadius: 10, backgroundColor: "rgba(16,185,129,.06)", border: "1px solid rgba(16,185,129,.12)" }}>
                    <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", color: "#6ee7b7" }}>{weekCal + totalCal}</div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", letterSpacing: 1 }}>CALS THIS WEEK</div>
                  </div>
                </div>

                {/* Auto-estimated activities */}
                {cycleToday && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10, backgroundColor: "rgba(99,102,241,.06)", border: "1px solid rgba(99,102,241,.1)", marginBottom: 6 }}>
                    <span style={{ fontSize: 20 }}>{"\uD83D\uDEB4"}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#e2e8f0" }}>Cycling Commute (est.)</div>
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>{cycleMins} min {"\u00B7"} {cycleKm} km {"\u00B7"} ~{cycleCal} cal</div>
                    </div>
                    <Badge s="info">Auto</Badge>
                  </div>
                )}
                {peSession && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10, backgroundColor: "rgba(16,185,129,.06)", border: "1px solid rgba(16,185,129,.1)", marginBottom: 6 }}>
                    <span style={{ fontSize: 20 }}>{"\u26BD"}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#e2e8f0" }}>PE {"\u2014"} {peSession.activity} (est.)</div>
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>{peMins} min {"\u00B7"} ~{peCal} cal</div>
                    </div>
                    <Badge s="good">PE</Badge>
                  </div>
                )}
                {showAfterSchool && afterSchool && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10, backgroundColor: "rgba(245,158,11,.06)", border: "1px solid rgba(245,158,11,.1)", marginBottom: 6 }}>
                    <span style={{ fontSize: 20 }}>{"\uD83C\uDFC6"}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#e2e8f0" }}>{afterSchool.name} (est.)</div>
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>{asMins} min {"\u00B7"} ~{asCal} cal</div>
                    </div>
                    <Badge s="warning">Club</Badge>
                  </div>
                )}

                {/* Manual logged exercises */}
                {todayLogs.length > 0 && (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#c084fc", letterSpacing: 1, marginBottom: 4 }}>LOGGED TODAY</div>
                    {todayLogs.map(e => (
                      <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 12px", borderRadius: 8, backgroundColor: "rgba(168,85,247,.05)", marginBottom: 3 }}>
                        <span style={{ fontSize: 14 }}>{e.icon || "\uD83C\uDFCB\uFE0F"}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "#e2e8f0" }}>{e.name}</div>
                          <div style={{ fontSize: 10, color: "#94a3b8" }}>{e.mins} min {"\u00B7"} ~{e.calories} cal</div>
                        </div>
                        <button onClick={() => removeExercise(e.id)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 12, padding: 4 }}>{"\u2715"}</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick-log buttons */}
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(148,163,184,.06)" }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "#818cf8", letterSpacing: 1, marginBottom: 6 }}>QUICK LOG</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {[
                      { name: "Push-ups", mins: 10, cal: 70, icon: "\uD83D\uDCAA" },
                      { name: "Sit-ups", mins: 10, cal: 60, icon: "\uD83E\uDDBE" },
                      { name: "Running (20min)", mins: 20, cal: 200, icon: "\uD83C\uDFC3" },
                      { name: "Weights (30min)", mins: 30, cal: 180, icon: "\uD83C\uDFCB\uFE0F" },
                      { name: "Home Workout", mins: 20, cal: 140, icon: "\uD83C\uDFE0" },
                      { name: "Stretching", mins: 15, cal: 45, icon: "\uD83E\uDDD8" },
                    ].map((ex, i) => (
                      <button key={i} onClick={() => logExercise({ name: ex.name, mins: ex.mins, calories: ex.cal, icon: ex.icon })} style={{
                        padding: "5px 10px", borderRadius: 8, border: "1px solid rgba(168,85,247,.2)", backgroundColor: "rgba(168,85,247,.08)",
                        color: "#c084fc", fontSize: 10, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, transition: "all .15s",
                      }}>{ex.icon} {ex.name}</button>
                    ))}
                  </div>
                </div>

                {/* Weekly bar chart */}
                {(() => {
                  const bars = [];
                  for (let i = 0; i < 7; i++) {
                    const d = dayClone(weekStart, i);
                    const dk = todayKey(d);
                    const dayLogs = fitnessLog.filter(e => e.date === dk);
                    const dayCal = dayLogs.reduce((s, e) => s + (e.calories || 0), 0);
                    const isT = dk === todayKey(new Date());
                    // Add auto-estimates for today
                    const autoEst = isT ? (cycleCal + peCal + asCal) : 0;
                    bars.push({ day: DAYS[d.getDay()].slice(0, 1), cal: dayCal + autoEst, isToday: isT });
                  }
                  const maxCal = Math.max(...bars.map(b => b.cal), 1);
                  return (
                    <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid rgba(148,163,184,.06)" }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: "#818cf8", letterSpacing: 1, marginBottom: 8 }}>THIS WEEK ({weekMins + totalMins} min total)</div>
                      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 60 }}>
                        {bars.map((b, i) => (
                          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                            <div style={{ fontSize: 8, fontWeight: 700, color: "#94a3b8", fontFamily: "'JetBrains Mono',monospace" }}>{b.cal > 0 ? b.cal : ""}</div>
                            <div style={{ width: "100%", height: Math.max(b.cal / maxCal * 40, 2), borderRadius: 4, backgroundColor: b.isToday ? "#c084fc" : "rgba(168,85,247,.3)", transition: "all .3s" }} />
                            <div style={{ fontSize: 9, fontWeight: 700, color: b.isToday ? "#c084fc" : "#64748b" }}>{b.day}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </>;
            })()}
          </Card>
        )}

        {/* ═══ NUTRITION & RECIPES ═══ */}
        {showNutrition && (
          <Card style={{ marginTop: 14, animation: "slideIn .84s" }} glow="rgba(245,158,11,.06)">
            <Lbl icon={"\uD83C\uDF57"}>Muscle Fuel & Nutrition</Lbl>

            {/* Pre-workout (if PE day, morning direction) */}
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
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
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
              <Lbl icon={dir === "to" ? "\uD83C\uDFEB" : "\uD83C\uDFE0"}>{dir === "to" ? `Trains ${HOME_STATION_CODE} \u2192 ${SCHOOL_STATION_CODE}` : `Trains ${SCHOOL_STATION_CODE} \u2192 ${HOME_STATION_CODE}`}</Lbl>
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

          <div style={{ display: "grid", gridTemplateColumns: "65px 72px 44px 1fr 100px", gap: 8, padding: "4px 12px", marginBottom: 2 }}>
            {["Sched.", "Status", "Plat.", "Destination", ""].map((h, i) => <span key={i} style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: "#475569", textTransform: "uppercase" }}>{h}</span>)}
          </div>

          {trains.length === 0 ? <div style={{ textAlign: "center", padding: 20, color: "#64748b" }}><div style={{ fontSize: 22, marginBottom: 4 }}>{"\uD83D\uDE82"}</div><div style={{ fontSize: 12 }}>{isFuture ? "Live trains show today's schedule as a guide" : "No trains listed"}</div></div>
            : trains.map((t, i) => {
              const sc = t.std || "\u2014"; const es = t.etd || "\u2014";
              const dly = es !== "On time" && es !== sc && es !== "\u2014" && es !== "Cancelled"; const cnc = es === "Cancelled";
              const act = activeTrain && t.std === activeTrain.std;
              return (
                <div key={i} className="ts" onClick={() => setSelTrain(t.std === selTrain ? null : t.std)} style={{ display: "grid", gridTemplateColumns: "65px 72px 44px 1fr 100px", alignItems: "center", gap: 8, padding: "8px 12px", backgroundColor: act ? "rgba(99,102,241,.12)" : "transparent", border: act ? "1px solid rgba(99,102,241,.3)" : "1px solid transparent" }}>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 15, fontWeight: 700, color: "#e2e8f0" }}>{sc}</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 600, color: cnc ? "#ef4444" : dly ? "#f59e0b" : "#22c55e" }}>{cnc ? "CANC" : dly ? es : "On time"}</span>
                  <span style={{ fontSize: 12, color: "#94a3b8", textAlign: "center" }}>{t.platform ? `P${t.platform}` : "\u2014"}</span>
                  <span style={{ fontSize: 12, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.destination?.[0]?.locationName || "\u2014"}</span>
                  {act && <Badge s={cnc ? "danger" : dly ? "warning" : "good"}>{selTrain ? "Selected" : "Best"}</Badge>}
                </div>
              );
            })}

          {activeTrain && (
            <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 10, background: "linear-gradient(135deg,rgba(99,102,241,.1),rgba(16,185,129,.06))", border: "1px solid rgba(99,102,241,.2)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#818cf8" }}>
                {dir === "to" ? (
                  <>{"\uD83D\uDE82"} <span style={{ fontFamily: "'JetBrains Mono',monospace", color: "#6ee7b7" }}>{activeTrain.std}</span> {HOME_STATION_CODE} {"\u2192"} Leave home <span style={{ fontFamily: "'JetBrains Mono',monospace", color: "#6ee7b7" }}>{fmt(J.leave)}</span> {"\u2192"} {"\uD83D\uDEB2"}{bHS}m {"\u2192"} train {"\u2192"} {"\uD83D\uDEB2"}{bSS}m {"\u2192"} {J.late ? <span style={{ color: "#fca5a5" }}>{"\u26A0\uFE0F"} LATE {fmt(J.arrSchool)}</span> : <span style={{ color: "#6ee7b7" }}>{"\u2705"} {fmt(J.arrSchool)} ({J.spare}m spare)</span>}</>
                ) : (
                  <>{"\uD83D\uDE82"} <span style={{ fontFamily: "'JetBrains Mono',monospace", color: "#6ee7b7" }}>{activeTrain.std}</span> {SCHOOL_STATION_CODE} {"\u2192"} Leave school <span style={{ fontFamily: "'JetBrains Mono',monospace", color: "#6ee7b7" }}>{fmt(J.leaveSchool)}</span> {"\u2192"} {"\uD83D\uDEB2"}{bSS2}m {"\u2192"} train {"\u2192"} {"\uD83D\uDEB2"}{bSH}m {"\u2192"} <span style={{ color: "#6ee7b7" }}>{"\uD83C\uDFE0"} {fmt(J.arrHome)}</span></>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* QUICK LINKS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginTop: 14 }}>
          {[
            { e: "\uD83D\uDE82", l: "Trains", u: `https://www.nationalrail.co.uk/live-trains/departures/${HOME_STATION_CODE}/${SCHOOL_STATION_CODE}` },
            { e: "\u26A0\uFE0F", l: "Alerts", u: "https://www.nationalrail.co.uk/status-and-disruptions/" },
            { e: "\uD83D\uDCDE", l: "School", u: "#" },
            { e: "\uD83D\uDE8C", l: "Buses", u: "https://www.stagecoachbus.com/plan-a-journey" },
          ].map((l, i) => (
            <a key={i} href={l.u} target="_blank" rel="noopener noreferrer" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "10px 6px", borderRadius: 12, textDecoration: "none", backgroundColor: "rgba(15,23,42,.5)", border: "1px solid rgba(148,163,184,.06)" }}>
              <span style={{ fontSize: 18 }}>{l.e}</span><span style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8" }}>{l.l}</span>
            </a>
          ))}
        </div>

        {/* CHECKLIST */}
        <Card style={{ marginTop: 14 }}>
          <Lbl icon={"\uD83D\uDCCB"}>Tom's Checklist</Lbl>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
            {[
              { t: "Bike lights charged", s: pDark },
              { t: "Waterproof packed", s: pRain },
              { t: "Mudguards on", s: pRain },
              { t: "Train ticket / railcard", s: true },
              { t: "Phone charged", s: true },
              { t: "School bag packed", s: hasClass },
              { t: "Water bottle", s: pTemp > 15 || dayActivities.length > 0 },
              { t: "Hi-vis for cycling", s: pDark },
              { t: "Spare socks", s: pRain },
              { t: "PE kit", s: !!peSession },
              { t: "Football boots / shin pads", s: peSession?.activity === "Football" || (showAfterSchool && afterSchool?.activity === "Football") },
              { t: "Rugby boots / gumshield", s: peSession?.activity === "Rugby" },
              { t: "Swim kit & towel", s: peSession?.activity === "Swimming" || (showAfterSchool && afterSchool?.activity === "Swimming") },
              { t: "Running trainers", s: peSession?.activity === "Athletics" || (showAfterSchool && afterSchool?.activity === "Athletics") },
              { t: "Sun cream", s: pTemp > 20 && dayActivities.some(a => a.outdoor) },
              { t: "After-school kit", s: showAfterSchool && !!afterSchool },
            ].filter(x => x.s).map((x, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#cbd5e1", padding: "5px 8px", borderRadius: 8, backgroundColor: "rgba(99,102,241,.04)" }}>{"\u2610"} {x.t}</div>)}
          </div>
        </Card>

        {/* FOOTER */}
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 10, color: "#475569" }}>
          <div>{HOME_POSTCODE} {"\uD83D\uDEB2"} {HOME_STATION} {"\uD83D\uDE82"} {SCHOOL_STATION} {"\uD83D\uDEB2"} {SCHOOL_NAME}</div>
          <div style={{ marginTop: 3 }}>National Rail Darwin {"\u00B7"} Open-Meteo {"\u00B7"} Term: {TERM_START.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} {"\u2013"} {TERM_END.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</div>
          <div style={{ marginTop: 6 }}><button onClick={() => { fetchTrains(); fetchWx(); }} style={{ padding: "5px 14px", borderRadius: 8, border: "1px solid rgba(99,102,241,.3)", backgroundColor: "rgba(99,102,241,.1)", color: "#818cf8", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>{"\uD83D\uDD04"} Refresh</button></div>
        </div>
      </div>
    </div>
  );
}
