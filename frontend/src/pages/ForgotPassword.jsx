import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Request code, 2: Reset password
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Step 1: Request reset code
  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setBusy(true);

    try {
      const res = await authApi.forgotPassword({ email: email.trim() });
      setSuccess(res.data?.message || "Reset code generated.");
      if (res.data?.resetToken) {
        setToken(res.data.resetToken); // Pre-fill token for ease of use
      }
      setStep(2);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "No account found with this email."
      );
    } finally {
      setBusy(false);
    }
  };

  // Step 2: Confirm new password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const res = await authApi.resetPassword({
        email: email.trim(),
        token: token.trim().toUpperCase(),
        newPassword
      });

      setSuccess(res.data?.message || "Password updated successfully!");
      setTimeout(() => {
        navigate("/login", { state: { resetSuccess: true } });
      }, 1500);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Invalid reset code or request failed."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Brand Logo */}
        <div className="auth-logo">
          <span className="logo-box">P</span>
          <span>PortfolioPro</span>
        </div>

        <h1>Reset Password</h1>
        <p>
          {step === 1
            ? "Enter your account email to receive a password reset code."
            : `Set a new secure password for ${email}.`}
        </p>

        {error && <div className="form-error">{error}</div>}
        {success && (
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
            {success}
          </div>
        )}

        {step === 1 ? (
          <form className="auth-form" onSubmit={handleRequestCode}>
            <label>
              Account Email
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={busy}
              />
            </label>

            <button type="submit" className="primary full" disabled={busy}>
              {busy ? "Sending Code..." : "Send Reset Code"}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleResetPassword}>
            <label>
              Reset Code (Token)
              <input
                type="text"
                placeholder="8-character code"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                disabled={busy}
                style={{ fontFamily: "monospace", letterSpacing: "1px" }}
              />
            </label>

            <label>
              New Password
              <input
                type="password"
                placeholder="At least 6 characters"
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={busy}
              />
            </label>

            <label>
              Confirm New Password
              <input
                type="password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={busy}
              />
            </label>

            <button type="submit" className="primary full" disabled={busy}>
              {busy ? "Updating Password..." : "Update Password"}
            </button>

            <button
              type="button"
              className="secondary full"
              onClick={() => {
                setStep(1);
                setError("");
                setSuccess("");
              }}
              style={{ marginTop: "8px" }}
            >
              ← Use a different email
            </button>
          </form>
        )}

        <p className="auth-bottom" style={{ marginTop: "24px" }}>
          Remember your password? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
