import { useState, useEffect } from "react";

interface CountdownTimerProps {
  targetDate: Date;
}

export default function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance > 0) {
        setTimeLeft({
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      } else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div className="flex items-center justify-center gap-3">
      <div className="text-center">
        <div className="bg-slate-800 border border-slate-700 rounded-lg px-5 py-3 min-w-[70px]">
          <div className="text-3xl text-white tabular-nums">
            {String(timeLeft.hours).padStart(2, "0")}
          </div>
        </div>
        <p className="text-slate-500 text-xs mt-2">Hours</p>
      </div>

      <div className="text-2xl text-slate-600">:</div>

      <div className="text-center">
        <div className="bg-slate-800 border border-slate-700 rounded-lg px-5 py-3 min-w-[70px]">
          <div className="text-3xl text-white tabular-nums">
            {String(timeLeft.minutes).padStart(2, "0")}
          </div>
        </div>
        <p className="text-slate-500 text-xs mt-2">Minutes</p>
      </div>

      <div className="text-2xl text-slate-600">:</div>

      <div className="text-center">
        <div className="bg-slate-800 border border-slate-700 rounded-lg px-5 py-3 min-w-[70px]">
          <div className="text-3xl text-white tabular-nums">
            {String(timeLeft.seconds).padStart(2, "0")}
          </div>
        </div>
        <p className="text-slate-500 text-xs mt-2">Seconds</p>
      </div>
    </div>
  );
}
