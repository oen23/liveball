import { useState } from "react";
import { useNavigate } from "react-router";
import { Play } from "lucide-react";

// Временная заглушка — удали после подключения FastAPI
const ADMIN_EMAILS = ["admin@toporfoot.com", "admin@admin.com"];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ЗАМЕНИТЬ НА → POST /api/auth/login
    //
    // const res = await fetch("/api/auth/login", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ email, password }),
    // });
    // if (!res.ok) {
    //   setError("Неверный email или пароль");
    //   return;
    // }
    // const data = await res.json();
    // // Ожидаемый ответ от FastAPI:
    // // { access_token: string, token_type: "bearer", role: "admin" | "user", email: string }
    // localStorage.setItem("token", data.access_token);  // JWT — добавляй в заголовок Authorization: Bearer <token>
    // localStorage.setItem("userRole", data.role);
    // localStorage.setItem("userEmail", data.email);
    // navigate("/matches");
    // ═══════════════════════════════════════════════════════════════════════

    // Временная заглушка — удали блок ниже после подключения бэкенда:
    const role = ADMIN_EMAILS.includes(email.toLowerCase()) ? "admin" : "user";
    localStorage.setItem("userRole", role);
    localStorage.setItem("userEmail", email);
    navigate("/matches");
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8">

          <div className="flex justify-center mb-6">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
              <Play className="w-10 h-10 text-white fill-white" />
            </div>
          </div>

          <h1 className="text-center text-white text-2xl mb-1">ToporFootball</h1>
          <p className="text-center text-slate-400 mb-8 text-sm">Watch live football matches</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm text-slate-300 mb-2">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600 transition-colors"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm text-slate-300 mb-2">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600 transition-colors"
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg transition-colors mt-2"
            >
              Sign In
            </button>
          </form>

          <p className="text-center text-slate-400 mt-6 text-sm">
            Don't have an account?{" "}
            <a href="/register" className="text-green-400 hover:text-green-300 transition-colors">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
