import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi, API_BASE_URL } from "../api";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

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
    <AuthShell title="Sign in" subtitle="Access your PortfolioPro account">
      <form className="auth-form" onSubmit={submit}>
        <label>Email<input type="email" value={form.email} onChange={e => setForm({...form,email:e.target.value})} required /></label>
        <label>Password<input type="password" value={form.password} onChange={e => setForm({...form,password:e.target.value})} required /></label>
        {error && <div className="form-error">{error}</div>}
        <button className="primary full" disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button>
      </form>

      <div className="auth-divider"><span>or</span></div>
      <a className="google-login" href={`${API_BASE_URL}/oauth2/authorization/google`}>
        Continue with Google
      </a>

      <p className="auth-bottom">New to PortfolioPro? <Link to="/register">Create an account</Link></p>
    </AuthShell>
  );
}

function AuthShell({title,subtitle,children}) {
  return <div className="auth-page">
    <div className="auth-card">
      <div className="auth-logo"><span className="logo-box">P</span><span>PortfolioPro</span></div>
      <h1>{title}</h1>
      <p>{subtitle}</p>
      {children}
    </div>
  </div>;
}