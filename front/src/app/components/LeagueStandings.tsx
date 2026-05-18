import { useParams, useNavigate } from "react-router";
import { Play, ChevronLeft, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface TeamStanding {
  position: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: string[];
}

const leagueData: Record<string, { name: string; standings: TeamStanding[] }> = {
  epl: {
    name: "Premier League",
    standings: [
      { position: 1, team: "Manchester City", played: 34, won: 26, drawn: 5, lost: 3, goalsFor: 89, goalsAgainst: 28, goalDifference: 61, points: 83, form: ["W", "W", "W", "D", "W"] },
      { position: 2, team: "Arsenal", played: 34, won: 25, drawn: 5, lost: 4, goalsFor: 82, goalsAgainst: 32, goalDifference: 50, points: 80, form: ["W", "W", "L", "W", "W"] },
      { position: 3, team: "Liverpool", played: 34, won: 23, drawn: 8, lost: 3, goalsFor: 78, goalsAgainst: 35, goalDifference: 43, points: 77, form: ["D", "W", "W", "W", "D"] },
      { position: 4, team: "Aston Villa", played: 34, won: 20, drawn: 7, lost: 7, goalsFor: 71, goalsAgainst: 52, goalDifference: 19, points: 67, form: ["W", "L", "W", "D", "W"] },
      { position: 5, team: "Tottenham", played: 34, won: 19, drawn: 6, lost: 9, goalsFor: 68, goalsAgainst: 54, goalDifference: 14, points: 63, form: ["L", "W", "W", "L", "W"] },
      { position: 6, team: "Manchester United", played: 34, won: 17, drawn: 8, lost: 9, goalsFor: 54, goalsAgainst: 48, goalDifference: 6, points: 59, form: ["W", "D", "L", "W", "D"] },
      { position: 7, team: "Newcastle", played: 34, won: 17, drawn: 7, lost: 10, goalsFor: 68, goalsAgainst: 56, goalDifference: 12, points: 58, form: ["L", "W", "D", "W", "L"] },
      { position: 8, team: "Chelsea", played: 34, won: 16, drawn: 9, lost: 9, goalsFor: 65, goalsAgainst: 57, goalDifference: 8, points: 57, form: ["D", "W", "W", "D", "L"] },
      { position: 9, team: "West Ham", played: 34, won: 14, drawn: 10, lost: 10, goalsFor: 55, goalsAgainst: 60, goalDifference: -5, points: 52, form: ["L", "D", "W", "L", "D"] },
      { position: 10, team: "Brighton", played: 34, won: 13, drawn: 11, lost: 10, goalsFor: 52, goalsAgainst: 51, goalDifference: 1, points: 50, form: ["D", "D", "W", "L", "D"] },
    ],
  },
  laliga: {
    name: "La Liga",
    standings: [
      { position: 1, team: "Real Madrid", played: 34, won: 27, drawn: 6, lost: 1, goalsFor: 78, goalsAgainst: 23, goalDifference: 55, points: 87, form: ["W", "W", "D", "W", "W"] },
      { position: 2, team: "Barcelona", played: 34, won: 24, drawn: 7, lost: 3, goalsFor: 75, goalsAgainst: 35, goalDifference: 40, points: 79, form: ["W", "W", "W", "D", "W"] },
      { position: 3, team: "Girona", played: 34, won: 22, drawn: 6, lost: 6, goalsFor: 72, goalsAgainst: 42, goalDifference: 30, points: 72, form: ["W", "L", "W", "W", "D"] },
      { position: 4, team: "Atletico Madrid", played: 34, won: 21, drawn: 6, lost: 7, goalsFor: 64, goalsAgainst: 41, goalDifference: 23, points: 69, form: ["W", "W", "L", "W", "W"] },
      { position: 5, team: "Athletic Bilbao", played: 34, won: 17, drawn: 10, lost: 7, goalsFor: 59, goalsAgainst: 38, goalDifference: 21, points: 61, form: ["D", "W", "W", "D", "L"] },
      { position: 6, team: "Real Sociedad", played: 34, won: 15, drawn: 11, lost: 8, goalsFor: 48, goalsAgainst: 37, goalDifference: 11, points: 56, form: ["D", "D", "W", "L", "W"] },
      { position: 7, team: "Valencia", played: 34, won: 14, drawn: 10, lost: 10, goalsFor: 42, goalsAgainst: 41, goalDifference: 1, points: 52, form: ["L", "W", "D", "W", "D"] },
      { position: 8, team: "Villarreal", played: 34, won: 13, drawn: 12, lost: 9, goalsFor: 55, goalsAgainst: 52, goalDifference: 3, points: 51, form: ["D", "D", "W", "L", "D"] },
      { position: 9, team: "Betis", played: 34, won: 12, drawn: 11, lost: 11, goalsFor: 47, goalsAgainst: 48, goalDifference: -1, points: 47, form: ["L", "D", "W", "W", "L"] },
      { position: 10, team: "Osasuna", played: 34, won: 12, drawn: 10, lost: 12, goalsFor: 44, goalsAgainst: 50, goalDifference: -6, points: 46, form: ["W", "L", "D", "L", "W"] },
    ],
  },
  seriea: {
    name: "Serie A",
    standings: [
      { position: 1, team: "Inter Milan", played: 34, won: 28, drawn: 4, lost: 2, goalsFor: 82, goalsAgainst: 22, goalDifference: 60, points: 88, form: ["W", "W", "W", "D", "W"] },
      { position: 2, team: "AC Milan", played: 34, won: 22, drawn: 7, lost: 5, goalsFor: 68, goalsAgainst: 42, goalDifference: 26, points: 73, form: ["W", "W", "L", "W", "D"] },
      { position: 3, team: "Juventus", played: 34, won: 20, drawn: 10, lost: 4, goalsFor: 58, goalsAgainst: 32, goalDifference: 26, points: 70, form: ["D", "W", "W", "D", "W"] },
      { position: 4, team: "Atalanta", played: 34, won: 20, drawn: 7, lost: 7, goalsFor: 71, goalsAgainst: 38, goalDifference: 33, points: 67, form: ["W", "W", "L", "W", "W"] },
      { position: 5, team: "Roma", played: 34, won: 18, drawn: 9, lost: 7, goalsFor: 62, goalsAgainst: 45, goalDifference: 17, points: 63, form: ["W", "D", "W", "L", "W"] },
      { position: 6, team: "Lazio", played: 34, won: 18, drawn: 6, lost: 10, goalsFor: 53, goalsAgainst: 41, goalDifference: 12, points: 60, form: ["L", "W", "W", "D", "L"] },
      { position: 7, team: "Napoli", played: 34, won: 16, drawn: 8, lost: 10, goalsFor: 58, goalsAgainst: 48, goalDifference: 10, points: 56, form: ["D", "L", "W", "W", "D"] },
      { position: 8, team: "Fiorentina", played: 34, won: 14, drawn: 11, lost: 9, goalsFor: 52, goalsAgainst: 47, goalDifference: 5, points: 53, form: ["D", "W", "L", "D", "W"] },
      { position: 9, team: "Bologna", played: 34, won: 13, drawn: 10, lost: 11, goalsFor: 46, goalsAgainst: 45, goalDifference: 1, points: 49, form: ["W", "D", "L", "W", "L"] },
      { position: 10, team: "Torino", played: 34, won: 12, drawn: 9, lost: 13, goalsFor: 41, goalsAgainst: 47, goalDifference: -6, points: 45, form: ["L", "W", "D", "L", "D"] },
    ],
  },
  ucl: {
    name: "UEFA Champions League",
    standings: [
      { position: 1, team: "Bayern Munich", played: 6, won: 5, drawn: 1, lost: 0, goalsFor: 18, goalsAgainst: 5, goalDifference: 13, points: 16, form: ["W", "W", "D", "W", "W"] },
      { position: 2, team: "Real Madrid", played: 6, won: 5, drawn: 0, lost: 1, goalsFor: 16, goalsAgainst: 7, goalDifference: 9, points: 15, form: ["W", "W", "W", "L", "W"] },
      { position: 3, team: "Manchester City", played: 6, won: 4, drawn: 2, lost: 0, goalsFor: 14, goalsAgainst: 6, goalDifference: 8, points: 14, form: ["W", "D", "W", "W", "D"] },
      { position: 4, team: "Inter Milan", played: 6, won: 4, drawn: 1, lost: 1, goalsFor: 12, goalsAgainst: 5, goalDifference: 7, points: 13, form: ["W", "W", "L", "D", "W"] },
      { position: 5, team: "PSG", played: 6, won: 3, drawn: 2, lost: 1, goalsFor: 11, goalsAgainst: 8, goalDifference: 3, points: 11, form: ["D", "W", "W", "L", "D"] },
      { position: 6, team: "Arsenal", played: 6, won: 3, drawn: 1, lost: 2, goalsFor: 10, goalsAgainst: 9, goalDifference: 1, points: 10, form: ["W", "L", "D", "W", "L"] },
      { position: 7, team: "Barcelona", played: 6, won: 3, drawn: 0, lost: 3, goalsFor: 13, goalsAgainst: 11, goalDifference: 2, points: 9, form: ["L", "W", "W", "L", "W"] },
      { position: 8, team: "Atletico Madrid", played: 6, won: 2, drawn: 2, lost: 2, goalsFor: 9, goalsAgainst: 10, goalDifference: -1, points: 8, form: ["D", "L", "W", "D", "L"] },
    ],
  },
  bundesliga: {
    name: "Bundesliga",
    standings: [
      { position: 1, team: "Bayern Munich", played: 30, won: 23, drawn: 5, lost: 2, goalsFor: 85, goalsAgainst: 28, goalDifference: 57, points: 74, form: ["W", "W", "W", "D", "W"] },
      { position: 2, team: "Borussia Dortmund", played: 30, won: 20, drawn: 6, lost: 4, goalsFor: 71, goalsAgainst: 38, goalDifference: 33, points: 66, form: ["W", "D", "W", "W", "L"] },
      { position: 3, team: "RB Leipzig", played: 30, won: 19, drawn: 7, lost: 4, goalsFor: 68, goalsAgainst: 35, goalDifference: 33, points: 64, form: ["W", "W", "D", "W", "W"] },
      { position: 4, team: "Bayer Leverkusen", played: 30, won: 18, drawn: 6, lost: 6, goalsFor: 65, goalsAgainst: 42, goalDifference: 23, points: 60, form: ["W", "L", "W", "D", "W"] },
      { position: 5, team: "Union Berlin", played: 30, won: 15, drawn: 8, lost: 7, goalsFor: 48, goalsAgainst: 39, goalDifference: 9, points: 53, form: ["D", "W", "L", "W", "D"] },
      { position: 6, team: "Freiburg", played: 30, won: 14, drawn: 9, lost: 7, goalsFor: 51, goalsAgainst: 45, goalDifference: 6, points: 51, form: ["D", "W", "W", "L", "D"] },
      { position: 7, team: "Frankfurt", played: 30, won: 13, drawn: 10, lost: 7, goalsFor: 54, goalsAgainst: 48, goalDifference: 6, points: 49, form: ["W", "D", "L", "W", "D"] },
      { position: 8, team: "Wolfsburg", played: 30, won: 12, drawn: 9, lost: 9, goalsFor: 46, goalsAgainst: 45, goalDifference: 1, points: 45, form: ["L", "D", "W", "W", "L"] },
    ],
  },
  ligue1: {
    name: "Ligue 1",
    standings: [
      { position: 1, team: "PSG", played: 32, won: 25, drawn: 5, lost: 2, goalsFor: 78, goalsAgainst: 28, goalDifference: 50, points: 80, form: ["W", "W", "D", "W", "W"] },
      { position: 2, team: "Monaco", played: 32, won: 21, drawn: 6, lost: 5, goalsFor: 64, goalsAgainst: 35, goalDifference: 29, points: 69, form: ["W", "W", "L", "W", "D"] },
      { position: 3, team: "Marseille", played: 32, won: 19, drawn: 7, lost: 6, goalsFor: 58, goalsAgainst: 38, goalDifference: 20, points: 64, form: ["D", "W", "W", "L", "W"] },
      { position: 4, team: "Lille", played: 32, won: 18, drawn: 8, lost: 6, goalsFor: 54, goalsAgainst: 36, goalDifference: 18, points: 62, form: ["W", "D", "W", "W", "D"] },
      { position: 5, team: "Lyon", played: 32, won: 16, drawn: 9, lost: 7, goalsFor: 52, goalsAgainst: 42, goalDifference: 10, points: 57, form: ["W", "L", "D", "W", "W"] },
      { position: 6, team: "Nice", played: 32, won: 15, drawn: 10, lost: 7, goalsFor: 48, goalsAgainst: 38, goalDifference: 10, points: 55, form: ["D", "W", "L", "D", "W"] },
      { position: 7, team: "Rennes", played: 32, won: 14, drawn: 9, lost: 9, goalsFor: 51, goalsAgainst: 45, goalDifference: 6, points: 51, form: ["L", "W", "D", "W", "L"] },
      { position: 8, team: "Lens", played: 32, won: 13, drawn: 10, lost: 9, goalsFor: 46, goalsAgainst: 43, goalDifference: 3, points: 49, form: ["D", "D", "W", "L", "W"] },
    ],
  },
  uecl: {
    name: "UEFA Conference League",
    standings: [
      { position: 1, team: "Aston Villa", played: 6, won: 5, drawn: 1, lost: 0, goalsFor: 14, goalsAgainst: 4, goalDifference: 10, points: 16, form: ["W", "W", "W", "D", "W"] },
      { position: 2, team: "Olympiacos", played: 6, won: 4, drawn: 2, lost: 0, goalsFor: 12, goalsAgainst: 5, goalDifference: 7, points: 14, form: ["W", "D", "W", "W", "D"] },
      { position: 3, team: "Fiorentina", played: 6, won: 4, drawn: 1, lost: 1, goalsFor: 11, goalsAgainst: 6, goalDifference: 5, points: 13, form: ["W", "W", "L", "D", "W"] },
      { position: 4, team: "Club Brugge", played: 6, won: 3, drawn: 2, lost: 1, goalsFor: 10, goalsAgainst: 7, goalDifference: 3, points: 11, form: ["D", "W", "W", "L", "D"] },
      { position: 5, team: "Fenerbahce", played: 6, won: 3, drawn: 1, lost: 2, goalsFor: 9, goalsAgainst: 8, goalDifference: 1, points: 10, form: ["W", "L", "D", "W", "L"] },
      { position: 6, team: "Ajax", played: 6, won: 2, drawn: 2, lost: 2, goalsFor: 8, goalsAgainst: 9, goalDifference: -1, points: 8, form: ["D", "W", "L", "D", "W"] },
      { position: 7, team: "Lille", played: 6, won: 2, drawn: 1, lost: 3, goalsFor: 7, goalsAgainst: 10, goalDifference: -3, points: 7, form: ["L", "W", "D", "L", "W"] },
      { position: 8, team: "Slavia Praha", played: 6, won: 1, drawn: 2, lost: 3, goalsFor: 6, goalsAgainst: 11, goalDifference: -5, points: 5, form: ["D", "L", "W", "L", "D"] },
    ],
  },
};

export default function LeagueStandings() {
  const { leagueId } = useParams<{ leagueId: string }>();
  const navigate = useNavigate();

  const league = leagueData[leagueId || ""];

  if (!league) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white">League not found</div>
      </div>
    );
  }

  const getFormIcon = (result: string) => {
    switch (result) {
      case "W":
        return <div className="w-6 h-6 bg-green-600 rounded flex items-center justify-center text-white text-xs">W</div>;
      case "D":
        return <div className="w-6 h-6 bg-slate-600 rounded flex items-center justify-center text-white text-xs">D</div>;
      case "L":
        return <div className="w-6 h-6 bg-red-600 rounded flex items-center justify-center text-white text-xs">L</div>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/matches")}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex items-center gap-3">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-2.5">
                <Play className="w-5 h-5 text-white fill-white" />
              </div>
              <span className="text-xl text-white tracking-tight">ToporFootball</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-white mb-8">{league.name} - Standings</h1>

        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-800 border-b border-slate-700 text-sm text-slate-400">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-4">Team</div>
            <div className="col-span-1 text-center">P</div>
            <div className="col-span-1 text-center">W</div>
            <div className="col-span-1 text-center">D</div>
            <div className="col-span-1 text-center">L</div>
            <div className="col-span-1 text-center">GD</div>
            <div className="col-span-1 text-center">Pts</div>
            <div className="col-span-1">Form</div>
          </div>

          {/* Table Body */}
          {league.standings.map((team, index) => (
            <div
              key={team.position}
              className={`grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-800 hover:bg-slate-800/50 transition-colors ${
                index < 4 ? "border-l-4 border-l-blue-500" : index >= league.standings.length - 3 ? "border-l-4 border-l-red-500" : ""
              }`}
            >
              <div className="col-span-1 text-center text-slate-300">{team.position}</div>
              <div className="col-span-4 text-white flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-800 border border-slate-700 rounded flex items-center justify-center text-xs">
                  {team.team.substring(0, 3).toUpperCase()}
                </div>
                {team.team}
              </div>
              <div className="col-span-1 text-center text-slate-400">{team.played}</div>
              <div className="col-span-1 text-center text-slate-400">{team.won}</div>
              <div className="col-span-1 text-center text-slate-400">{team.drawn}</div>
              <div className="col-span-1 text-center text-slate-400">{team.lost}</div>
              <div className={`col-span-1 text-center ${team.goalDifference > 0 ? "text-green-400" : team.goalDifference < 0 ? "text-red-400" : "text-slate-400"}`}>
                {team.goalDifference > 0 ? "+" : ""}{team.goalDifference}
              </div>
              <div className="col-span-1 text-center text-white">{team.points}</div>
              <div className="col-span-1 flex gap-1">
                {team.form.map((result, idx) => (
                  <div key={idx}>{getFormIcon(result)}</div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 flex gap-6 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Champions League</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Relegation</span>
          </div>
        </div>
      </div>
    </div>
  );
}
