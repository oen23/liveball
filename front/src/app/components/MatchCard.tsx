import { MapPin, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";

interface Match {
  id: number;
  homeTeam: string;
  awayTeam: string;
  league: string;
  stadium: string;
  startTime: string | Date;
  isLive: boolean;
  viewers?: number;
  homeScore?: number;
  awayScore?: number;
}

interface MatchCardProps {
  match: Match;
}

function toDate(v: string | Date): Date {
  return v instanceof Date ? v : new Date(v);
}

function useMatchTime(startTime: string | Date) {
  const [display, setDisplay] = useState("");

  useEffect(() => {
    const update = () => {
      const now = Date.now();
      const diff = toDate(startTime).getTime() - now;
      if (diff <= 0) {
        setDisplay("Now");
        return;
      }
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      if (h > 0) {
        setDisplay(`${h}h ${m}m`);
      } else {
        setDisplay(`${m}m`);
      }
    };
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, [startTime]);

  return display;
}

export default function MatchCard({ match }: MatchCardProps) {
  const navigate = useNavigate();
  const timeUntil = useMatchTime(match.startTime);
  const isLive = (match as any).isLive;
  const homeScore = (match as any).homeScore;
  const awayScore = (match as any).awayScore;

  const startHHMM = toDate(match.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div
      onClick={() => navigate(`/match/${match.id}`)}
      className={`rounded-xl p-5 transition-all duration-200 border cursor-pointer group
        ${isLive
          ? "bg-slate-800 border-green-600/40 hover:border-green-500/70 hover:shadow-lg hover:shadow-green-500/10"
          : "bg-slate-800 border-slate-700 hover:border-green-500/40 hover:shadow-lg hover:shadow-green-500/5"
        }`}
    >
      <div className="flex items-center gap-4">
        {/* League + Live badge */}
        <div className="flex flex-col items-center justify-center min-w-[80px]">
          {isLive ? (
            <div className="flex items-center gap-1.5 bg-red-600/20 border border-red-500/40 rounded-full px-2.5 py-1 mb-2">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-400 text-xs font-medium tracking-wider">LIVE</span>
            </div>
          ) : (
            <div className="text-slate-500 text-xs mb-2">{startHHMM}</div>
          )}
          <div className="text-slate-500 text-[10px] uppercase tracking-wider text-center leading-tight">
            {match.league.replace("UEFA ", "").replace(" League", "").replace("Premier", "EPL")}
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-12 bg-slate-700 shrink-0" />

        {/* Teams + Score */}
        <div className="flex-1 flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="text-white mb-2 truncate">{match.homeTeam}</div>
            <div className="text-white truncate">{match.awayTeam}</div>
          </div>

          <div className="shrink-0 text-center">
            {isLive && homeScore !== undefined ? (
              <div className="flex flex-col items-center">
                <div className="text-2xl text-white tabular-nums">
                  {homeScore}
                </div>
                <div className="w-4 h-px bg-slate-600 my-1" />
                <div className="text-2xl text-white tabular-nums">
                  {awayScore}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="text-slate-500 text-xs">starts in</div>
                <div className="text-slate-300 text-sm mt-1">{timeUntil}</div>
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-12 bg-slate-700 shrink-0" />

        {/* Meta */}
        <div className="flex flex-col gap-1.5 min-w-[100px] items-end">
          {match.viewers && (
            <div className="flex items-center gap-1.5 text-slate-400 text-xs">
              <Users className="w-3 h-3" />
              <span>{match.viewers.toLocaleString()}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-slate-500 text-xs">
            <MapPin className="w-3 h-3" />
            <span className="truncate max-w-[90px]">{match.stadium}</span>
          </div>
          <div
            className={`text-xs px-2 py-0.5 rounded mt-1 transition-colors
              ${isLive
                ? "bg-green-600/20 text-green-400 group-hover:bg-green-600/30"
                : "bg-slate-700 text-slate-400 group-hover:bg-slate-600"
              }`}
          >
            {isLive ? "Watch Live" : "Watch"}
          </div>
        </div>
      </div>
    </div>
  );
}
