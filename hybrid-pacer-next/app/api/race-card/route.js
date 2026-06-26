import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ---- self-contained model (kept in sync with pacer-core) ---- */
const ORDER = [
  { type: "run", n: 1 },
  { type: "station", key: "ski", name: "SkiErg" },
  { type: "run", n: 2 },
  { type: "station", key: "push", name: "Sled Push" },
  { type: "run", n: 3 },
  { type: "station", key: "pull", name: "Sled Pull" },
  { type: "run", n: 4 },
  { type: "station", key: "burpee", name: "Burpee Broad Jumps" },
  { type: "run", n: 5 },
  { type: "station", key: "row", name: "Rowing" },
  { type: "run", n: 6 },
  { type: "station", key: "farmer", name: "Farmers Carry" },
  { type: "run", n: 7 },
  { type: "station", key: "lunge", name: "Sandbag Lunges" },
  { type: "run", n: 8 },
  { type: "station", key: "wall", name: "Wall Balls" },
];
const DEFAULTS = {
  open: { men: 88 * 60, women: 100 * 60 },
  pro: { men: 75 * 60, women: 85 * 60 },
  doubles: { men: 62 * 60, women: 72 * 60, mixed: 66 * 60 },
};
function fmt(sec) {
  if (sec == null || isNaN(sec) || sec < 0) return "-";
  sec = Math.round(sec);
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  const p = (x) => String(x).padStart(2, "0");
  return h > 0 ? `${h}:${p(m)}:${p(s)}` : `${m}:${p(s)}`;
}
function parseTime(str) {
  if (typeof str !== "string") return null;
  const p = str.trim().split(":").map((x) => x.trim());
  if (p.some((x) => x === "" || isNaN(Number(x)))) return null;
  if (p.length === 3) return +p[0] * 3600 + +p[1] * 60 + +p[2];
  if (p.length === 2) return +p[0] * 60 + +p[1];
  if (p.length === 1) return +p[0] * 60;
  return null;
}
function computeReference(finishSec, format, gender, bias) {
  const rox = Math.max(finishSec * 0.06, 180);
  const work = finishSec - rox;
  const runW = 0.47 + 0.1 * bias, stW = 0.47 - 0.1 * bias;
  const runningTotal = work * (runW / (runW + stW));
  const stationsTotal = work - runningTotal;
  const rf = []; for (let i = 0; i < 8; i++) rf.push(0.93 + 0.14 * (i / 7));
  const rfSum = rf.reduce((a, b) => a + b, 0);
  const w = { ski: 1.0, push: 1.2, pull: 1.05, burpee: 1.15, row: 1.05, farmer: 0.8, lunge: 1.0, wall: 1.3 };
  if (format === "pro") { w.push += 0.2; w.pull += 0.1; }
  const wSum = Object.values(w).reduce((a, b) => a + b, 0);
  let ri = 0;
  const segs = ORDER.map((seg) => {
    if (seg.type === "run") { const sec = runningTotal * (rf[ri] / rfSum); ri++; return { ...seg, sec }; }
    return { ...seg, sec: stationsTotal * (w[seg.key] / wSum) };
  });
  return { segs, rox, runningTotal, stationsTotal };
}
function decodeState(str) {
  try { return JSON.parse(decodeURIComponent(atob(str))); } catch { return null; }
}

const COL = { bg: "#0F1419", panel: "#161C26", line: "#2A3543", text: "#E9EEF3", muted: "#8593A3", run: "#4EA8DE", station: "#FF5A36" };

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const size = searchParams.get("size") === "story" ? "story" : "landscape";
  const o = decodeState(searchParams.get("p") || "") || {};
  let format = ["open", "pro", "doubles"].includes(o.f) ? o.f : "pro";
  let gender = o.g || "men";
  const valid = format === "doubles" ? ["men", "women", "mixed"] : ["men", "women"];
  if (!valid.includes(gender)) gender = "men";
  let target = parseTime(o.t);
  if (target == null) target = DEFAULTS[format][gender] || DEFAULTS[format].men;
  const bias = typeof o.b === "number" ? o.b : 0;

  const { segs, rox, runningTotal, stationsTotal } = computeReference(target, format, gender, bias);
  const items = segs.map((s, i) => ({
    idx: String(i + 1).padStart(2, "0"),
    name: s.type === "run" ? `RUN ${s.n}` : s.name,
    val: s.type === "run" ? `${fmt(s.sec)}/km` : fmt(s.sec),
    color: s.type === "run" ? COL.run : COL.station,
  }));
  const col1 = items.slice(0, 8), col2 = items.slice(8);

  const Chip = (label, value, color) => (
    <div style={{ display: "flex", flexDirection: "column", background: COL.panel, border: `1px solid ${COL.line}`, borderRadius: 10, padding: "10px 16px", marginRight: 14 }}>
      <span style={{ color: COL.muted, fontSize: 15, letterSpacing: 2 }}>{label}</span>
      <span style={{ color, fontSize: 26, fontWeight: 700 }}>{value}</span>
    </div>
  );

  const Row = (it) => (
    <div key={it.idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: `1px solid ${COL.panel}` }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <span style={{ color: COL.muted, fontSize: 16, width: 30 }}>{it.idx}</span>
        <span style={{ color: COL.text, fontSize: 20 }}>{it.name}</span>
      </div>
      <span style={{ color: it.color, fontSize: 20, fontWeight: 700 }}>{it.val}</span>
    </div>
  );

  const SChip = (label, value, color) => (
    <div style={{ display: "flex", flexDirection: "column", background: COL.panel, border: `1px solid ${COL.line}`, borderRadius: 14, padding: "16px 22px", flex: 1, marginRight: 16 }}>
      <span style={{ color: COL.muted, fontSize: 22, letterSpacing: 2 }}>{label}</span>
      <span style={{ color, fontSize: 40, fontWeight: 700 }}>{value}</span>
    </div>
  );

  const StoryRow = (it) => (
    <div key={it.idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: `1px solid ${COL.panel}` }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <span style={{ color: COL.muted, fontSize: 28, width: 56 }}>{it.idx}</span>
        <span style={{ color: COL.text, fontSize: 34 }}>{it.name}</span>
      </div>
      <span style={{ color: it.color, fontSize: 34, fontWeight: 700 }}>{it.val}</span>
    </div>
  );

  const landscape = (
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: COL.bg, padding: 48, color: COL.text }}>
        {/* header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 42, fontWeight: 800, letterSpacing: 1 }}>
              HYBRID <span style={{ color: COL.station }}>PACER</span>
            </span>
            <span style={{ color: COL.muted, fontSize: 20, marginTop: 4 }}>HYROX RACE PLAN</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <span style={{ color: COL.muted, fontSize: 18, letterSpacing: 2 }}>TARGET</span>
            <span style={{ fontSize: 56, fontWeight: 800 }}>{fmt(target)}</span>
            <span style={{ color: COL.muted, fontSize: 20, letterSpacing: 2 }}>{`${format.toUpperCase()} · ${gender.toUpperCase()}`}</span>
          </div>
        </div>

        {/* chips */}
        <div style={{ display: "flex", marginTop: 18 }}>
          {Chip("RUN", fmt(runningTotal), COL.run)}
          {Chip("STATIONS", fmt(stationsTotal), COL.station)}
          {Chip("ROXZONE", fmt(rox), COL.muted)}
        </div>

        {/* split columns */}
        <div style={{ display: "flex", marginTop: 18 }}>
          <div style={{ display: "flex", flexDirection: "column", flex: 1, marginRight: 40 }}>
            {col1.map(Row)}
          </div>
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            {col2.map(Row)}
          </div>
        </div>

        <span style={{ color: COL.muted, fontSize: 16, marginTop: 18 }}>HYROX &amp; Hybrid · Race plan &amp; split analysis</span>
      </div>
  );

  const story = (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: COL.bg, padding: "72px 64px", color: COL.text }}>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: 66, fontWeight: 800, letterSpacing: 1 }}>HYBRID <span style={{ color: COL.station }}>PACER</span></span>
        <span style={{ color: COL.muted, fontSize: 30, marginTop: 8 }}>HYROX RACE PLAN</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 56 }}>
        <span style={{ color: COL.muted, fontSize: 30, letterSpacing: 4 }}>TARGET</span>
        <span style={{ fontSize: 150, fontWeight: 800, lineHeight: 1 }}>{fmt(target)}</span>
        <span style={{ color: COL.muted, fontSize: 32, letterSpacing: 4, marginTop: 10 }}>{`${format.toUpperCase()} · ${gender.toUpperCase()}`}</span>
      </div>
      <div style={{ display: "flex", marginTop: 50 }}>
        {SChip("RUN", fmt(runningTotal), COL.run)}
        {SChip("STATIONS", fmt(stationsTotal), COL.station)}
        {SChip("ROXZONE", fmt(rox), COL.muted)}
      </div>
      <div style={{ display: "flex", flexDirection: "column", marginTop: 44 }}>
        {items.map(StoryRow)}
      </div>
      <span style={{ color: COL.muted, fontSize: 26, marginTop: 28 }}>HYROX &amp; Hybrid · Race plan &amp; split analysis</span>
    </div>
  );

  return new ImageResponse(
    size === "story" ? story : landscape,
    size === "story" ? { width: 1080, height: 1920 } : { width: 1200, height: 630 }
  );
}
