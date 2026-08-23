import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Bot, User, Lock, Eye, EyeOff, AlertCircle, LogIn } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await login(username, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تسجيل الدخول");
    }
  }

  return (
    <div className="login-page">
      <div className="card login-card">
        <div className="login-logo">
          <span className="login-logo-badge">
            <Bot size={26} strokeWidth={1.75} />
          </span>
          <h2>لوحة تحكم المتجر</h2>
          <span className="text-secondary">سجّل الدخول لإدارة البوت</span>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="login-error">
              <AlertCircle size={16} strokeWidth={1.75} />
              <span>{error}</span>
            </div>
          )}

          <div className="field">
            <label htmlFor="username">اسم المستخدم</label>
            <div className="input-wrap">
              <User size={16} strokeWidth={1.75} />
              <input
                id="username"
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                required
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="password">كلمة المرور</label>
            <div className="input-wrap">
              <Lock size={16} strokeWidth={1.75} />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="input"
                style={{ paddingLeft: 36 }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="input-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              >
                {showPassword ? <EyeOff size={16} strokeWidth={1.75} /> : <Eye size={16} strokeWidth={1.75} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
            <LogIn size={16} strokeWidth={1.75} />
            {loading ? "جاري الدخول..." : "تسجيل الدخول"}
          </button>
        </form>
      </div>
    </div>
  );
}
