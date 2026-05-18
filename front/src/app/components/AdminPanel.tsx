import { useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router";
import { Play, ChevronLeft, Plus, Edit2, Trash2, Star } from "lucide-react";
interface Match {
  id: number;
  homeTeam: string;
  awayTeam: string;
  league: string;
  stadium: string;
  startTime: string;
  isLive: boolean;
  viewers: number;
  isMainMatch: boolean;
  homeScore?: number;
  awayScore?: number;
  possession?: { home: number; away: number };
  shots?: { home: number; away: number };
}

const SEED_MATCHES: Match[] = [
  { id: 1,  homeTeam: "Manchester United", awayTeam: "Liverpool",         league: "Premier League",         stadium: "Old Trafford",         startTime: new Date(Date.now() + 2.0 * 3600_000).toISOString(), isLive: false, viewers: 45230, isMainMatch: true  },
  { id: 2,  homeTeam: "Barcelona",         awayTeam: "Real Madrid",        league: "La Liga",                stadium: "Camp Nou",              startTime: new Date(Date.now() + 3.5 * 3600_000).toISOString(), isLive: true,  viewers: 38420, isMainMatch: false, homeScore: 1, awayScore: 2, possession: { home: 48, away: 52 }, shots: { home: 7,  away: 11 } },
  { id: 3,  homeTeam: "Bayern Munich",     awayTeam: "Borussia Dortmund",  league: "Bundesliga",             stadium: "Allianz Arena",         startTime: new Date(Date.now() + 5.0 * 3600_000).toISOString(), isLive: false, viewers: 29150, isMainMatch: false },
  { id: 4,  homeTeam: "PSG",               awayTeam: "Marseille",          league: "Ligue 1",                stadium: "Parc des Princes",      startTime: new Date(Date.now() + 1.5 * 3600_000).toISOString(), isLive: true,  viewers: 22340, isMainMatch: false, homeScore: 0, awayScore: 0, possession: { home: 61, away: 39 }, shots: { home: 4,  away: 2  } },
  { id: 5,  homeTeam: "Juventus",          awayTeam: "Inter Milan",        league: "Serie A",                stadium: "Allianz Stadium",       startTime: new Date(Date.now() + 4.0 * 3600_000).toISOString(), isLive: false, viewers: 31200, isMainMatch: false },
  { id: 6,  homeTeam: "Real Madrid",       awayTeam: "Man City",           league: "UEFA Champions League",  stadium: "Santiago Bernabéu",     startTime: new Date(Date.now() + 6.0 * 3600_000).toISOString(), isLive: false, viewers: 52800, isMainMatch: false },
  { id: 7,  homeTeam: "Arsenal",           awayTeam: "Chelsea",            league: "Premier League",         stadium: "Emirates Stadium",      startTime: new Date(Date.now() + 0.5 * 3600_000).toISOString(), isLive: true,  viewers: 40100, isMainMatch: false, homeScore: 2, awayScore: 1, possession: { home: 55, away: 45 }, shots: { home: 9,  away: 6  } },
  { id: 8,  homeTeam: "Atletico Madrid",   awayTeam: "Sevilla",            league: "La Liga",                stadium: "Wanda Metropolitano",   startTime: new Date(Date.now() + 7.0 * 3600_000).toISOString(), isLive: false, viewers: 18500, isMainMatch: false },
  { id: 9,  homeTeam: "AC Milan",          awayTeam: "Napoli",             league: "Serie A",                stadium: "San Siro",              startTime: new Date(Date.now() + 3.0 * 3600_000).toISOString(), isLive: false, viewers: 25700, isMainMatch: false },
  { id: 10, homeTeam: "Fiorentina",        awayTeam: "Olympiacos",         league: "UEFA Conference League", stadium: "Artemio Franchi",       startTime: new Date(Date.now() + 2.5 * 3600_000).toISOString(), isLive: false, viewers: 12400, isMainMatch: false },
  { id: 11, homeTeam: "Bayer Leverkusen",  awayTeam: "RB Leipzig",         league: "Bundesliga",             stadium: "BayArena",              startTime: new Date(Date.now() + 4.5 * 3600_000).toISOString(), isLive: false, viewers: 19800, isMainMatch: false },
  { id: 12, homeTeam: "Monaco",            awayTeam: "Lyon",               league: "Ligue 1",                stadium: "Stade Louis II",        startTime: new Date(Date.now() + 8.0 * 3600_000).toISOString(), isLive: false, viewers: 14200, isMainMatch: false },
  { id: 13, homeTeam: "Barcelona",         awayTeam: "Benfica",            league: "UEFA Champions League",  stadium: "Camp Nou",              startTime: new Date(Date.now() + 9.0 * 3600_000).toISOString(), isLive: false, viewers: 47300, isMainMatch: false },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadMatches(): Match[] {
  // ═══════════════════════════════════════════════════════════════════════
  // ЗАМЕНИТЬ НА → GET /api/matches (с токеном админа)
  //
  // const token = localStorage.getItem("token");
  // const res = await fetch("/api/matches", {
  //   headers: { Authorization: `Bearer ${token}` },
  // });
  // return await res.json();
  // ═══════════════════════════════════════════════════════════════════════
  try {
    const raw = localStorage.getItem("adminMatches");
    if (raw) return JSON.parse(raw) as Match[];
  } catch {}
  return SEED_MATCHES;
}

function persist(matches: Match[]): void {
  // Временная синхронная запись — заменяется отдельными fetch-вызовами в CRUD ниже
  localStorage.setItem("adminMatches", JSON.stringify(matches));
}

// ─── Form state type ──────────────────────────────────────────────────────────

interface FormState {
  homeTeam: string;
  awayTeam: string;
  league: string;
  stadium: string;
  startTime: string;
  isLive: boolean;
  viewers: number;
  homeScore: number;
  awayScore: number;
  possessionHome: number;
  shotsHome: number;
  shotsAway: number;
}

const EMPTY_FORM: FormState = {
  homeTeam: "", awayTeam: "", league: "Premier League", stadium: "",
  startTime: "", isLive: false, viewers: 0,
  homeScore: 0, awayScore: 0, possessionHome: 50, shotsHome: 0, shotsAway: 0,
};

// ЗАМЕНИТЬ НА: данные из GET /api/leagues — список лиг из твоей БД
// Модель League в PostgreSQL: id, name, country, logo_url, season
const ALL_LEAGUES = [
  "UEFA Champions League", "Premier League", "La Liga",
  "Serie A", "Bundesliga", "Ligue 1",
  "UEFA Europa League", "UEFA Conference League",
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminPanel() {
  const navigate = useNavigate();
  const [matches, setMatches]         = useState<Match[]>([]);
  const [form, setForm]               = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId]     = useState<number | null>(null);
  const [showForm, setShowForm]       = useState(false);

  useEffect(() => {
    if (localStorage.getItem("userRole") !== "admin") {
      navigate("/matches");
      return;
    }
    setMatches(loadMatches());
  }, [navigate]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const save = (updated: Match[]) => { setMatches(updated); persist(updated); };

  const resetForm = () => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(false); };

  const formToMatch = (id: number, extra: Partial<Match> = {}): Match => ({
    id,
    homeTeam:   form.homeTeam,
    awayTeam:   form.awayTeam,
    league:     form.league,
    stadium:    form.stadium,
    startTime:  form.startTime ? new Date(form.startTime).toISOString() : new Date().toISOString(),
    isLive:     form.isLive,
    viewers:    form.viewers,
    isMainMatch: false,
    homeScore:  form.homeScore,
    awayScore:  form.awayScore,
    possession: { home: form.possessionHome, away: 100 - form.possessionHome },
    shots:      { home: form.shotsHome, away: form.shotsAway },
    ...extra,
  });

  // ── CRUD ───────────────────────────────────────────────────────────────────

  const handleAdd = () => {
    if (!form.homeTeam || !form.awayTeam || !form.stadium) return;
    // ═══════════════════════════════════════════════════════════════════════
    // ЗАМЕНИТЬ НА → POST /api/matches
    // Тело запроса: { home_team_id, away_team_id, league_id, stadium, start_time,
    //                 is_live, viewers, home_score, away_score, possession_home,
    //                 shots_home, shots_away }
    // Команды и лиги должны приходить из твоей БД через:
    //   GET /api/teams  → список команд для выпадающего списка
    //   GET /api/leagues → список лиг для выпадающего списка
    // const token = localStorage.getItem("token");
    // const res = await fetch("/api/matches", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    //   body: JSON.stringify({ home_team_id: ..., away_team_id: ..., ... }),
    // });
    // const newMatch = await res.json();
    // setMatches(prev => [...prev, newMatch]);
    // ═══════════════════════════════════════════════════════════════════════
    save([...matches, formToMatch(Date.now(), { isMainMatch: false })]);
    resetForm();
  };

  const handleUpdate = () => {
    if (editingId === null) return;
    // ═══════════════════════════════════════════════════════════════════════
    // ЗАМЕНИТЬ НА → PATCH /api/matches/{editingId}
    // const token = localStorage.getItem("token");
    // const res = await fetch(`/api/matches/${editingId}`, {
    //   method: "PATCH",
    //   headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    //   body: JSON.stringify({ home_score, away_score, is_live, possession_home, ... }),
    // });
    // const updated = await res.json();
    // setMatches(prev => prev.map(m => m.id === editingId ? updated : m));
    // ═══════════════════════════════════════════════════════════════════════
    const existing = matches.find(m => m.id === editingId)!;
    save(matches.map(m => m.id === editingId ? formToMatch(editingId, { isMainMatch: existing.isMainMatch }) : m));
    resetForm();
  };

  const handleDelete = (id: number) => {
    // ═══════════════════════════════════════════════════════════════════════
    // ЗАМЕНИТЬ НА → DELETE /api/matches/{id}
    // const token = localStorage.getItem("token");
    // await fetch(`/api/matches/${id}`, {
    //   method: "DELETE",
    //   headers: { Authorization: `Bearer ${token}` },
    // });
    // setMatches(prev => prev.filter(m => m.id !== id));
    // ═══════════════════════════════════════════════════════════════════════
    save(matches.filter(m => m.id !== id));
  };

  const handleSetMain = (id: number) => {
    // ═══════════════════════════════════════════════════════════════════════
    // ЗАМЕНИТЬ НА → PATCH /api/matches/{id}  с телом { is_main_match: true }
    // (и сбрасывать is_main_match у всех остальных на бэкенде)
    // const token = localStorage.getItem("token");
    // await fetch(`/api/matches/${id}/set-main`, {
    //   method: "POST",
    //   headers: { Authorization: `Bearer ${token}` },
    // });
    // setMatches(prev => prev.map(m => ({ ...m, isMainMatch: m.id === id })));
    // ═══════════════════════════════════════════════════════════════════════
    save(matches.map(m => ({ ...m, isMainMatch: m.id === id })));
  };

  const handleToggleLive = (id: number) => {
    // ═══════════════════════════════════════════════════════════════════════
    // ЗАМЕНИТЬ НА → PATCH /api/matches/{id}  с телом { is_live: !currentIsLive }
    // const match = matches.find(m => m.id === id)!;
    // const token = localStorage.getItem("token");
    // await fetch(`/api/matches/${id}`, {
    //   method: "PATCH",
    //   headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    //   body: JSON.stringify({ is_live: !match.isLive }),
    // });
    // setMatches(prev => prev.map(m => m.id === id ? { ...m, isLive: !m.isLive } : m));
    // ═══════════════════════════════════════════════════════════════════════
    save(matches.map(m => m.id === id ? { ...m, isLive: !m.isLive } : m));
  };

  const startEdit = (m: Match) => {
    setForm({
      homeTeam: m.homeTeam, awayTeam: m.awayTeam, league: m.league,
      stadium: m.stadium,
      startTime: m.startTime ? new Date(m.startTime).toISOString().slice(0, 16) : "",
      isLive: m.isLive, viewers: m.viewers,
      homeScore: m.homeScore ?? 0, awayScore: m.awayScore ?? 0,
      possessionHome: m.possession?.home ?? 50,
      shotsHome: m.shots?.home ?? 0, shotsAway: m.shots?.away ?? 0,
    });
    setEditingId(m.id);
    setShowForm(true);
  };

  // ── Field helpers ──────────────────────────────────────────────────────────

  const field = (label: string, node: ReactNode) => (
    <div>
      <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">{label}</label>
      {node}
    </div>
  );

  const input = (key: keyof FormState, type = "text", placeholder = "") => (
    <input
      type={type}
      value={form[key] as string | number}
      onChange={e => setForm(f => ({ ...f, [key]: type === "number" ? Number(e.target.value) : e.target.value }))}
      className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-green-600 text-sm"
      placeholder={placeholder}
      min={type === "number" ? 0 : undefined}
    />
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-950">

      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/matches")} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex items-center gap-3">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-2.5">
                <Play className="w-5 h-5 text-white fill-white" />
              </div>
              <span className="text-white text-lg">Admin Panel</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { localStorage.setItem("adminMatches", JSON.stringify(SEED_MATCHES)); setMatches(SEED_MATCHES); }}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors text-sm"
            >
              Reset Data
            </button>
            <button
              onClick={() => { setShowForm(v => !v); setEditingId(null); setForm(EMPTY_FORM); }}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Match
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        {/* ── Add / Edit Form ──────────────────────────────────────────────── */}
        {showForm && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-white mb-5">{editingId ? "Edit Match" : "Add Match"}</h2>

            <div className="grid grid-cols-2 gap-4 mb-4">
              {field("Home Team",  input("homeTeam",  "text", "Manchester United"))}
              {field("Away Team",  input("awayTeam",  "text", "Liverpool"))}
              {field("Stadium",    input("stadium",   "text", "Old Trafford"))}
              {field("Viewers",    input("viewers",   "number"))}
              {field("Start Time", input("startTime", "datetime-local"))}
              {field("League",
                <select
                  value={form.league}
                  onChange={e => setForm(f => ({ ...f, league: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-green-600 text-sm"
                >
                  {ALL_LEAGUES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              )}
            </div>

            {/* Live toggle */}
            <div className="flex items-center gap-3 mb-4 p-3 bg-slate-800 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, isLive: !f.isLive }))}
                className={`relative w-10 h-5 rounded-full transition-colors ${form.isLive ? "bg-red-500" : "bg-slate-600"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isLive ? "translate-x-5" : ""}`} />
              </button>
              <span className="text-slate-300 text-sm">Live match</span>
            </div>

            {/* Live stats — only shown when isLive */}
            {form.isLive && (
              <div className="grid grid-cols-2 gap-4 mb-4 pt-4 border-t border-slate-700">
                {field("Home Score",       input("homeScore",       "number"))}
                {field("Away Score",       input("awayScore",       "number"))}
                {field("Home Possession %",input("possessionHome",  "number"))}
                {field("Away Possession %",
                  <input
                    readOnly value={100 - form.possessionHome}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-700 border border-slate-600 text-slate-400 text-sm"
                  />
                )}
                {field("Home Shots",       input("shotsHome",       "number"))}
                {field("Away Shots",       input("shotsAway",       "number"))}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={editingId ? handleUpdate : handleAdd}
                className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
              >
                {editingId ? "Save Changes" : "Add Match"}
              </button>
              <button
                onClick={resetForm}
                className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── Match List ───────────────────────────────────────────────────── */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-white">All Matches</h2>
            <span className="text-slate-500 text-sm">{matches.length} total</span>
          </div>

          {matches.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No matches yet. Click "Add Match" to create one.</div>
          ) : (
            <div className="divide-y divide-slate-800">
              {matches.map(m => (
                <div key={m.id} className="px-6 py-4 hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center justify-between gap-4">

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {m.isMainMatch && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 shrink-0" />}
                        {m.isLive && (
                          <div className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-red-400 text-xs">LIVE</span>
                          </div>
                        )}
                        <span className="text-slate-400 text-xs">{m.league}</span>
                      </div>
                      <p className="text-white truncate">
                        {m.homeTeam}
                        {m.isLive && m.homeScore !== undefined ? ` ${m.homeScore} – ${m.awayScore} ` : " vs "}
                        {m.awayTeam}
                      </p>
                      <p className="text-slate-500 text-xs mt-0.5">
                        {m.stadium} · {new Date(m.startTime).toLocaleString()} · {m.viewers.toLocaleString()} viewers
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleSetMain(m.id)}
                        title="Set as Match of the Day"
                        className={`p-2 rounded-lg transition-colors ${m.isMainMatch ? "bg-yellow-500/20 text-yellow-400" : "bg-slate-700 hover:bg-slate-600 text-slate-400"}`}
                      >
                        <Star className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleLive(m.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${m.isLive ? "bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30" : "bg-slate-700 hover:bg-slate-600 text-slate-300"}`}
                      >
                        {m.isLive ? "Stop Live" : "Go Live"}
                      </button>
                      <button
                        onClick={() => startEdit(m)}
                        className="p-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-colors border border-blue-500/20"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors border border-red-500/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
