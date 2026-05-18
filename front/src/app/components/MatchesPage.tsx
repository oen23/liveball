import { Play, Settings, MapPin, Users } from "lucide-react";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import MatchCard from "./MatchCard";
import CountdownTimer from "./CountdownTimer";

// ─── Типы данных ──────────────────────────────────────────────────────────────
// Эти типы зеркалят твои PostgreSQL модели.
// Когда подключишь FastAPI — просто замени вызовы localStorage на fetch() ниже.

export interface Match {
  id: number;
  homeTeam: string;
  awayTeam: string;
  league: string;
  stadium: string;
  startTime: string;          // ISO 8601 string from DB
  isLive: boolean;
  viewers: number;
  isMainMatch: boolean;
  homeScore?: number;
  awayScore?: number;
  possession?: { home: number; away: number };
  shots?: { home: number; away: number };
}

// ─── Временные данные (используются пока нет бэкенда) ────────────────────────
// УДАЛИ весь блок SEED_MATCHES после подключения FastAPI — данные будут из PostgreSQL.

export const SEED_MATCHES: Match[] = [
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

// ─── Constants ────────────────────────────────────────────────────────────────

const LEAGUES = [
  { id: "all",        label: "All",        filter: ""                        },
  { id: "ucl",        label: "UCL",        filter: "UEFA Champions League"   },
  { id: "epl",        label: "EPL",        filter: "Premier League"          },
  { id: "laliga",     label: "La Liga",    filter: "La Liga"                 },
  { id: "seriea",     label: "Serie A",    filter: "Serie A"                 },
  { id: "bundesliga", label: "Bundesliga", filter: "Bundesliga"              },
  { id: "ligue1",     label: "Ligue 1",    filter: "Ligue 1"                 },
  { id: "uecl",       label: "UECL",       filter: "UEFA Conference League"  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadMatches(): Match[] {
  // ═══════════════════════════════════════════════════════════════════════
  // ЗАМЕНИТЬ НА → GET /api/matches
  //
  // Ожидаемый ответ от FastAPI (список матчей):
  // [
  //   {
  //     id: number,
  //     home_team: { id, name, country, logo_url },   // связанная модель Team
  //     away_team: { id, name, country, logo_url },
  //     league:    { id, name, country, logo_url },   // связанная модель League
  //     stadium:   string,
  //     start_time: string,   // ISO 8601, например "2026-05-18T20:00:00Z"
  //     is_live:    boolean,
  //     is_main_match: boolean,
  //     viewers:    number,
  //     home_score: number | null,
  //     away_score: number | null,
  //     possession_home: number | null,   // 0-100
  //     shots_home:  number | null,
  //     shots_away:  number | null,
  //   },
  //   ...
  // ]
  //
  // Пример вызова (используй в useEffect ниже):
  // const token = localStorage.getItem("token");
  // const res = await fetch("/api/matches", {
  //   headers: { Authorization: `Bearer ${token}` },
  // });
  // const data = await res.json();
  // // Преобразуй snake_case → camelCase если нужно (или настрой FastAPI через alias)
  // setMatches(data);
  // ═══════════════════════════════════════════════════════════════════════

  // Временная заглушка — localStorage:
  try {
    const raw = localStorage.getItem("adminMatches");
    if (raw) return JSON.parse(raw) as Match[];
  } catch {}
  localStorage.setItem("adminMatches", JSON.stringify(SEED_MATCHES));
  return SEED_MATCHES;
}

function sortMatchList(matches: Match[]): { live: Match[]; upcoming: Match[] } {
  const live     = matches.filter(m =>  m.isLive).sort((a, b) => (b.viewers ?? 0) - (a.viewers ?? 0));
  const upcoming = matches.filter(m => !m.isLive).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  return { live, upcoming };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MatchesPage() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin]         = useState(false);
  const [matches, setMatches]         = useState<Match[]>([]);
  const [activeTab, setActiveTab]     = useState("all");

  useEffect(() => {
    setIsAdmin(localStorage.getItem("userRole") === "admin");
    setMatches(loadMatches());
  }, []);

  // ── Derived lists ──────────────────────────────────────────────────────────

  const mainMatch = matches.find(m => m.isMainMatch) ?? matches[0] ?? null;

  const currentFilter = LEAGUES.find(l => l.id === activeTab)?.filter ?? "";
  const pool = matches.filter(m => !m.isMainMatch && (activeTab === "all" || m.league === currentFilter));
  const { live, upcoming } = sortMatchList(pool);

  const totalLive = matches.filter(m => m.isLive).length;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">

          <div className="flex items-center justify-between mb-4">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="bg-slate-800 rounded-lg p-2.5 border border-slate-700">
                <Play className="w-5 h-5 text-white fill-white" />
              </div>
              <span className="text-xl text-white tracking-tight">ToporFootball</span>
              {totalLive > 0 && (
                <div className="flex items-center gap-1.5 bg-red-600/20 border border-red-500/30 rounded-full px-3 py-1">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-red-400 text-xs">{totalLive} live</span>
                </div>
              )}
            </div>

            {/* Nav */}
            <div className="flex items-center gap-2">
              {isAdmin && (
                <button
                  onClick={() => navigate("/admin")}
                  className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-sm"
                >
                  <Settings className="w-4 h-4" />
                  Admin
                </button>
              )}
              <button
                onClick={() => { localStorage.removeItem("userRole"); localStorage.removeItem("userEmail"); navigate("/"); }}
                className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-sm"
              >
                Sign out
              </button>
            </div>
          </div>

          {/* League tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {LEAGUES.map(l => (
              <button
                key={l.id}
                onClick={() => setActiveTab(l.id)}
                className={`px-4 py-2 border rounded-lg whitespace-nowrap text-sm shrink-0 transition-all ${
                  activeTab === l.id
                    ? "bg-green-600 border-green-500 text-white"
                    : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* ── Match of the Day (only on "All" tab) ───────────────────────── */}
        {activeTab === "all" && mainMatch && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-white">Match of the Day</h2>
              {mainMatch.isLive && (
                <div className="flex items-center gap-1.5 bg-red-600/20 border border-red-500/30 rounded-full px-2.5 py-0.5">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-red-400 text-xs">LIVE</span>
                </div>
              )}
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              <div className="p-8">
                <p className="text-slate-400 text-xs uppercase tracking-wider text-center mb-6">{mainMatch.league}</p>

                {/* Teams */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex-1 text-center">
                    <div className="w-20 h-20 bg-slate-700 border border-slate-600 rounded-xl mx-auto mb-4 flex items-center justify-center text-4xl">🏠</div>
                    <p className="text-white text-xl">{mainMatch.homeTeam}</p>
                  </div>

                  <div className="px-8 text-center">
                    {mainMatch.isLive && mainMatch.homeScore !== undefined ? (
                      <div>
                        <p className="text-6xl text-white tabular-nums">
                          {mainMatch.homeScore} <span className="text-slate-600">–</span> {mainMatch.awayScore}
                        </p>
                        <div className="flex items-center justify-center gap-1.5 mt-3">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                          <span className="text-red-400 text-xs uppercase tracking-wider">Live</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-500 text-3xl">vs</p>
                    )}
                  </div>

                  <div className="flex-1 text-center">
                    <div className="w-20 h-20 bg-slate-700 border border-slate-600 rounded-xl mx-auto mb-4 flex items-center justify-center text-4xl">✈️</div>
                    <p className="text-white text-xl">{mainMatch.awayTeam}</p>
                  </div>
                </div>

                {/* Countdown or live stats */}
                {mainMatch.isLive && mainMatch.possession ? (
                  <div className="bg-slate-900 border border-slate-700 rounded-lg p-5 mb-6 space-y-3">
                    <div>
                      <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                        <span>{mainMatch.homeTeam}</span>
                        <span>Possession</span>
                        <span>{mainMatch.awayTeam}</span>
                      </div>
                      <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden flex">
                        <div className="bg-blue-500 transition-all duration-500" style={{ width: `${mainMatch.possession.home}%` }} />
                        <div className="bg-orange-500 transition-all duration-500" style={{ width: `${mainMatch.possession.away}%` }} />
                      </div>
                    </div>
                    <div className="flex justify-between text-sm text-slate-400">
                      <span>Shots: {mainMatch.shots?.home ?? 0}</span>
                      <span className="text-slate-600 text-xs">on goal</span>
                      <span>Shots: {mainMatch.shots?.away ?? 0}</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 mb-6">
                    <p className="text-center text-slate-400 text-sm mb-4">Starts in</p>
                    <CountdownTimer targetDate={new Date(mainMatch.startTime)} />
                  </div>
                )}

                {/* Footer info */}
                <div className="flex items-center justify-center gap-6 text-slate-400 text-sm mb-6">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{mainMatch.stadium}</span>
                  </div>
                  {mainMatch.viewers > 0 && (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{mainMatch.viewers.toLocaleString()} watching</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => navigate(`/match/${mainMatch.id}`)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>{mainMatch.isLive ? "Watch Live" : "Match Details"}</span>
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ── Match list ─────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-white">
              {activeTab === "all" ? "Popular Today" : LEAGUES.find(l => l.id === activeTab)?.label}
            </h2>
            <span className="text-slate-500 text-sm">{live.length + upcoming.length} matches</span>
          </div>

          {live.length === 0 && upcoming.length === 0 ? (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
              <p className="text-slate-400">No matches scheduled</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Live now */}
              {live.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-red-400 text-xs font-medium uppercase tracking-wider">Live Now</span>
                    <span className="text-slate-600 text-xs">({live.length})</span>
                  </div>
                  <div className="space-y-3">
                    {live.map(m => <MatchCard key={m.id} match={m} />)}
                  </div>
                </div>
              )}

              {/* Upcoming */}
              {upcoming.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full" />
                    <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Upcoming</span>
                    <span className="text-slate-600 text-xs">({upcoming.length})</span>
                  </div>
                  <div className="space-y-3">
                    {upcoming.map(m => <MatchCard key={m.id} match={m} />)}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
