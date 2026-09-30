import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== confirm) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    setBusy(true);
    try {
      await authApi.register(form);
      navigate("/login", { state: { registered: true } });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Unable to create account. Please check your details."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card register-card">
        {/* Brand Logo */}
        <div className="auth-logo">
          <span className="logo-box">P</span>
          <span>PortfolioPro</span>
        </div>

        <h1>Create Account</h1>
        <p>Professional Stock Portfolio Management &amp; Tracking System.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Full Name
            <input
              type="text"
              placeholder="e.g. Advik Sharma"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              disabled={busy}
            />
          </label>

          <label>
            Email Address
            <input
              type="email"
              placeholder="name@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              disabled={busy}
            />
          </label>

          <label>
            Password
            <input
              type="password"
              placeholder="At least 6 characters"
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              disabled={busy}
            />
          </label>

          <label>
            Confirm Password
            <input
              type="password"
              placeholder="Repeat your password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              disabled={busy}
            />
          </label>

          {error && <div className="form-error">{error}</div>}

          <button type="submit" className="primary full" disabled={busy}>
            {busy ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <a
          className="google-login"
          href="http://localhost:8080/oauth2/authorization/google"
        >
          Continue with Google
        </a>

        <p className="auth-bottom">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}