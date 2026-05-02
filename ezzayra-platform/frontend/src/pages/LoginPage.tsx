import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Leaf, AlertCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err: unknown) {
      const msg = (err as { code?: string })?.code;
      if (msg === "auth/invalid-credential" || msg === "auth/wrong-password") {
        setError("Email ou mot de passe incorrect.");
      } else if (msg === "auth/user-not-found") {
        setError("Aucun compte trouvé avec cet email.");
      } else {
        setError("Une erreur est survenue. Réessaie.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-olive-mid to-olive-dark shadow-lg">
            <Leaf className="h-8 w-8 text-sand" />
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-olive-mid">
              EZZAYRA
            </p>
            <h1 className="mt-1 font-fraunces text-3xl font-bold text-olive-dark">
              Bienvenue
            </h1>
            <p className="mt-1 text-sm text-olive-dark/60">
              Connecte-toi à ta plateforme agricole
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-white/70 bg-white/80 p-8 shadow-xl backdrop-blur">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
                <AlertCircle size={16} className="shrink-0" />
                {error}
              </div>
            )}

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-olive-dark/60">
                Email
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-olive-mid/60"
                />
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ton@email.com"
                  className="w-full rounded-2xl border border-olive-mid/20 bg-white/70 py-3 pl-11 pr-4 text-sm text-olive-dark outline-none transition placeholder:text-olive-dark/30 focus:border-olive-mid focus:ring-2 focus:ring-olive-mid/20"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-olive-dark/60">
                Mot de passe
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-olive-mid/60"
                />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-olive-mid/20 bg-white/70 py-3 pl-11 pr-12 text-sm text-olive-dark outline-none transition placeholder:text-olive-dark/30 focus:border-olive-mid focus:ring-2 focus:ring-olive-mid/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-olive-dark/40 transition hover:text-olive-dark"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="mt-2 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-olive-mid to-olive-dark py-3.5 text-sm font-semibold text-sand shadow-md transition hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-sand/30 border-t-sand" />
              ) : null}
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-olive-dark/60">
            Pas encore de compte ?{" "}
            <Link
              to="/signup"
              className="font-semibold text-olive-mid underline-offset-2 hover:underline"
            >
              S'inscrire
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-olive-dark/40">
          Plateforme d'analyse agricole intelligente · Tunisie 🇹🇳
        </p>
      </div>
    </div>
  );
}
