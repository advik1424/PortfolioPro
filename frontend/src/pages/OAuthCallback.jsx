import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      // 1. Try parsing from hash: #token=...&id=...&name=...&email=...
      let hash = window.location.hash;
      if (hash.startsWith("#")) {
        hash = hash.substring(1);
      }

      const params = new URLSearchParams(hash || window.location.search);
      const token = params.get("token");
      const id = params.get("id");
      const name = params.get("name");
      const email = params.get("email");

      if (token) {
        localStorage.setItem("token", token);
        localStorage.setItem(
          "user",
          JSON.stringify({
            id: id ? Number(id) : null,
            name: name ? decodeURIComponent(name) : "",
            email: email ? decodeURIComponent(email) : ""
          })
        );

        // Remove token from browser history for security
        window.history.replaceState({}, document.title, "/dashboard");
        navigate("/dashboard", { replace: true });
      } else {
        setError("Google authentication token not found in response.");
      }
    } catch (err) {
      setError("An error occurred while processing Google login.");
    }
  }, [navigate]);

  if (error) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <div className="auth-logo">
            <span className="logo-box">P</span>
            <span>PortfolioPro</span>
          </div>
          <h2 style={{ fontSize: "18px", color: "var(--loss)", margin: "0 0 8px" }}>
            Authentication Failed
          </h2>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "0 0 20px" }}>
            {error}
          </p>
          <button
            className="primary full"
            onClick={() => navigate("/login")}
            type="button"
          >
            Return to Sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: "center", padding: "40px 24px" }}>
        <div className="auth-logo">
          <span className="logo-box">P</span>
          <span>PortfolioPro</span>
        </div>
        <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "6px" }}>
          Completing Google sign in...
        </div>
        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          Please wait while we set up your portfolio session.
        </div>
      </div>
    </div>
  );
}
