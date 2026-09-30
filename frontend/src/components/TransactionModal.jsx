import React, { useState, useEffect } from "react";
import { tradingApi, formatINR, formatNumber } from "../api";

export default function TransactionModal({
  isOpen,
  onClose,
  stock,
  initialType = "BUY",
  availableQuantity = 0,
  onSuccess
}) {
  const [type, setType] = useState(initialType);
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Sync state when modal opens or props change
  useEffect(() => {
    if (isOpen && stock) {
      setType(initialType);
      setQuantity(1);
      setPrice(stock.currentPrice || stock.price || "");
      setError("");
      setSuccessMsg("");
    }
  }, [isOpen, stock, initialType]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !submitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, submitting, onClose]);

  if (!isOpen || !stock) return null;

  const numQty = Number(quantity) || 0;
  const numPrice = Number(price) || 0;
  const totalAmount = numQty * numPrice;
  const isSell = type === "SELL";
  const maxSellQty = Number(availableQuantity) || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (numQty <= 0) {
      setError("Quantity must be greater than 0.");
      return;
    }

    if (numPrice <= 0) {
      setError("Price per share must be greater than ₹0.00.");
      return;
    }

    if (isSell && numQty > maxSellQty) {
      setError(`Insufficient holdings! You only own ${maxSellQty} shares of ${stock.symbol}.`);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        stockId: stock.id,
        quantity: numQty,
        price: numPrice
      };

      const res = isSell
        ? await tradingApi.sell(payload)
        : await tradingApi.buy(payload);

      setSuccessMsg(
        `Order executed successfully! ${type} ${numQty} shares of ${stock.symbol} @ ${formatINR(numPrice)}.`
      );

      setTimeout(() => {
        if (onSuccess) onSuccess(res.data);
        onClose();
      }, 900);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Transaction failed. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => !submitting && onClose()}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ width: "420px" }}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h3 style={{ margin: 0 }}>Record Transaction</h3>
              <span className="symbol-badge">{stock.symbol}</span>
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
              {stock.companyName} {stock.exchange ? `· ${stock.exchange}` : ""}
            </div>
          </div>
          <button
            className="modal-close"
            onClick={onClose}
            disabled={submitting}
            title="Close dialog (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Order Type Selector: BUY vs SELL */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            padding: "12px 20px 0",
            gap: "8px"
          }}
        >
          <button
            type="button"
            onClick={() => {
              setType("BUY");
              setError("");
            }}
            style={{
              padding: "9px 0",
              fontSize: "12px",
              fontWeight: 700,
              borderRadius: "var(--radius-sm)",
              border: type === "BUY" ? "2px solid #16a34a" : "1px solid var(--border)",
              backgroundColor: type === "BUY" ? "#dcfce7" : "#ffffff",
              color: type === "BUY" ? "#15803d" : "var(--text-secondary)",
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
          >
            BUY / ACQUIRE
          </button>
          <button
            type="button"
            onClick={() => {
              setType("SELL");
              setError("");
            }}
            style={{
              padding: "9px 0",
              fontSize: "12px",
              fontWeight: 700,
              borderRadius: "var(--radius-sm)",
              border: type === "SELL" ? "2px solid #dc2626" : "1px solid var(--border)",
              backgroundColor: type === "SELL" ? "#fee2e2" : "#ffffff",
              color: type === "SELL" ? "#b91c1c" : "var(--text-secondary)",
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
          >
            SELL / DISPOSE
          </button>
        </div>

        {/* Holding info banner for SELL */}
        {isSell && (
          <div
            style={{
              margin: "12px 20px 0",
              padding: "8px 12px",
              borderRadius: "var(--radius-sm)",
              backgroundColor: maxSellQty > 0 ? "var(--bg-subtle)" : "var(--loss-bg)",
              border: `1px solid ${maxSellQty > 0 ? "var(--border)" : "var(--loss-border)"}`,
              fontSize: "11px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <span>
              Available Holding: <b>{formatNumber(maxSellQty, 0)} shares</b>
            </span>
            {maxSellQty > 0 && (
              <button
                type="button"
                className="secondary"
                style={{ padding: "2px 6px", fontSize: "10px" }}
                onClick={() => setQuantity(maxSellQty)}
              >
                Sell All
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ padding: "16px 20px" }}>
            {error && (
              <div className="form-error" style={{ marginBottom: "14px" }}>
                {error}
              </div>
            )}

            {successMsg && (
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "var(--profit-bg)",
                  color: "var(--profit)",
                  border: "1px solid var(--profit-border)",
                  fontSize: "12px",
                  fontWeight: 600,
                  marginBottom: "14px"
                }}
              >
                ✓ {successMsg}
              </div>
            )}

            {/* Quantity Input */}
            <div className="form-group">
              <label>
                Quantity (Number of Shares)
              </label>
              <input
                type="number"
                min="0.0001"
                step="any"
                className="form-input num"
                placeholder="e.g. 10"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                disabled={submitting}
              />
            </div>

            {/* Execution Price Input */}
            <div className="form-group" style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ margin: 0 }}>
                  Execution Price per Share (₹)
                </label>
                {stock.currentPrice && (
                  <span
                    style={{
                      fontSize: "10px",
                      color: "var(--accent)",
                      cursor: "pointer",
                      fontWeight: 600
                    }}
                    onClick={() => setPrice(stock.currentPrice)}
                  >
                    Use CMP ({formatINR(stock.currentPrice)})
                  </span>
                )}
              </div>
              <input
                type="number"
                min="0.01"
                step="any"
                className="form-input num"
                placeholder="e.g. 2450.50"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                style={{ marginTop: "6px" }}
                required
                disabled={submitting}
              />
            </div>

            {/* Real-time Order Summary Card */}
            <div
              style={{
                backgroundColor: "var(--bg-subtle)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                padding: "10px 14px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  Estimated Order Value
                </div>
                <div style={{ fontSize: "10px", color: "var(--text-secondary)" }}>
                  {numQty} × {formatINR(numPrice)}
                </div>
              </div>
              <div
                className="num font-bold"
                style={{ fontSize: "16px", color: "var(--text-primary)" }}
              >
                {formatINR(totalAmount)}
              </div>
            </div>
          </div>

          {/* Modal Footer with Actions */}
          <div className="modal-footer">
            <button
              type="button"
              className="secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={isSell ? "danger-btn" : "primary"}
              disabled={submitting || (isSell && maxSellQty <= 0)}
              style={{ minWidth: "120px" }}
            >
              {submitting
                ? "Processing..."
                : isSell
                ? `Confirm SELL`
                : `Confirm BUY`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
