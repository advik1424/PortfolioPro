import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { authApi, API_BASE_URL } from "../api";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const resetSuccess = location.state?.resetSuccess;
  const registered = location.state?.registered;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { data } = await authApi.login(form);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data));
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Sign in" subtitle="Access your WealthEdge financial account">
      {resetSuccess && (
        <div
          style={{
            padding: "10px 14px",
            backgroundColor: "rgba(16, 185, 129, 0.12)",
            border: "1px solid var(--profit)",
            borderRadius: "var(--radius-sm)",
            color: "var(--profit)",
            fontSize: "12px",
            marginBottom: "16px"
          }}
        >
          Password updated successfully! Please sign in with your new password.
        </div>
      )}

      {registered && (
        <div
          style={{
            padding: "10px 14px",
            backgroundColor: "rgba(16, 185, 129, 0.12)",
            border: "1px solid var(--profit)",
            borderRadius: "var(--radius-sm)",
            color: "var(--profit)",
            fontSize: "12px",
            marginBottom: "16px"
          }}
        >
          Account created successfully! Please sign in below.
        </div>
      )}

      <form className="auth-form" onSubmit={submit}>
        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            disabled={busy}
          />
        </label>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>Password</span>
            <Link to="/forgot-password" style={{ fontSize: "11px", color: "var(--accent)", textDecoration: "none" }}>
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            disabled={busy}
          />
        </div>

        {error && <div className="form-error">{error}</div>}
        <button className="primary full" disabled={busy} style={{ marginTop: "12px" }}>
          {busy ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="auth-divider"><span>or</span></div>
      <a className="google-login" href={`${API_BASE_URL}/oauth2/authorization/google`}>
        Continue with Google
      </a>

      <p className="auth-bottom">New to WealthEdge? <Link to="/register">Create an account</Link></p>
    </AuthShell>
  );
}

function AuthShell({title,subtitle,children}) {
  return <div className="auth-page">
    <div className="auth-card">
      <div className="auth-logo"><span className="logo-box">W</span><span>WealthEdge</span></div>
      <h1>{title}</h1>
      <p>{subtitle}</p>
      {children}
    </div>
  </div>;
}