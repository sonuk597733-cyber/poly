import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  CreditCard, CheckCircle2, ShieldCheck, Loader2, RefreshCw, Printer, X,
  QrCode, PieChart, Wallet, Receipt, Search, Clock, AlertCircle
} from "lucide-react";
import { authApi } from "../../services/authApi";
import { assetUrl } from "../../utils/assetUrl";
import "./StudentTheme.css";
import "./StudentFees.css";

/* ════════════════════════════════════════════════════════════════
   HELPERS & HOOKS
   ════════════════════════════════════════════════════════════════ */
const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const fmtDate = (d) =>
  new Date(d || Date.now()).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Smoothly counts from the previous value to the new target. */
function useCountUp(target, duration = 1100) {
  const [val, setVal] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setVal(target);
      prev.current = target;
      return undefined;
    }
    const from = prev.current;
    let raf;
    let start;
    const tick = (t) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 4); // easeOutQuart
      setVal(Math.round(from + (target - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else prev.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return val;
}

function AnimatedMoney({ value, className = "" }) {
  const n = useCountUp(Number(value) || 0);
  return <span className={className}>{inr(n)}</span>;
}

/** Escape-to-close + body scroll lock for modals. */
function useModal(open, onClose) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);
}

/** Circular progress ring for the collection rate. */
function ProgressRing({ percent = 0, size = 104, stroke = 9 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(Math.min(100, Math.max(0, percent))));
    return () => cancelAnimationFrame(id);
  }, [percent]);

  const count = useCountUp(Math.round(percent), 1200);

  return (
    <div className="std-fx-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <defs>
          <linearGradient id="fxRingGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#60A5FA" />
          </linearGradient>
        </defs>
        <circle className="std-fx-ring-track" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} fill="none" />
        <circle
          className="std-fx-ring-bar"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          stroke="url(#fxRingGrad)"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - shown / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="std-fx-ring-label">
        <strong>{count}%</strong>
        <span>settled</span>
      </div>
    </div>
  );
}

/** Animated tick drawn with stroke-dashoffset. */
function SuccessTick() {
  return (
    <div className="std-fx-success-tick" aria-hidden="true">
      <svg viewBox="0 0 52 52">
        <circle className="std-fx-tick-circle" cx="26" cy="26" r="23" fill="none" />
        <path className="std-fx-tick-check" fill="none" d="M15 27l8 8 14-16" />
      </svg>
    </div>
  );
}

/** Skeleton rows while loading. */
function SkeletonRows({ cols, rows = 4 }) {
  return Array.from({ length: rows }).map((_, r) => (
    <tr key={r} className="std-fx-skel-row">
      {Array.from({ length: cols }).map((__, c) => (
        <td key={c}>
          <span className="std-fx-skel" style={{ width: `${55 + ((r + c) % 4) * 11}%` }} />
        </td>
      ))}
    </tr>
  ));
}

/* ════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════════ */
export default function StudentFees({ currentUser, showToast }) {
  const [feeRecords, setFeeRecords] = useState([]);
  const [summary, setSummary] = useState({
    totalExpected: 0,
    totalCollected: 0,
    totalPending: 0,
    collectionRate: 100
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("due-date");

  const [payingRecord, setPayingRecord] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [paymentChannel, setPaymentChannel] = useState("UPI");
  const [payStage, setPayStage] = useState("form"); // form | processing | success
  const [payResult, setPayResult] = useState(null);
  const [viewingReceipt, setViewingReceipt] = useState(null);

  /* ───────── data ───────── */
  const fetchFees = useCallback(() => {
    setLoading(true);
    authApi
      .getFees()
      .then((res) => {
        const recs = res?.records || [];
        setFeeRecords(recs);
        if (res?.summary) {
          setSummary(res.summary);
        } else if (recs.length > 0) {
          const totalExpected = recs.reduce((a, r) => a + (Number(r.amount || r.totalAmount) || 0), 0);
          const totalCollected = recs.reduce((a, r) => a + (Number(r.paidAmount) || 0), 0);
          const totalPending = recs.reduce((a, r) => a + (Number(r.dueAmount) || 0), 0);
          const rate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 100;
          setSummary({ totalExpected, totalCollected, totalPending, collectionRate: rate });
        } else {
          setSummary({ totalExpected: 0, totalCollected: 0, totalPending: 0, collectionRate: 100 });
        }
        setLoading(false);
      })
      .catch((err) => {
        showToast?.(err.message || "Failed to load fee ledger.", true);
        setLoading(false);
      });
  }, [showToast]);

  useEffect(() => {
    fetchFees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ───────── payment flow ───────── */
  const closePay = useCallback(() => {
    if (payStage === "processing") return; // don't close mid-transaction
    setPayingRecord(null);
    setPayStage("form");
    setPayResult(null);
  }, [payStage]);

  const closeReceipt = useCallback(() => setViewingReceipt(null), []);

  useModal(!!payingRecord, closePay);
  useModal(!!viewingReceipt, closeReceipt);

  const handleOpenPay = (rec) => {
    setPayingRecord(rec);
    setPayAmount(String(rec.dueAmount || 0));
    setPayStage("form");
    setPayResult(null);
  };

  const dueOfPaying = Number(payingRecord?.dueAmount || 0);
  const payNum = Number(payAmount || 0);
  const payInvalid = !payNum || payNum <= 0 || payNum > dueOfPaying;

  const handleAmountChange = (e) => {
    const v = e.target.value;
    if (v === "") return setPayAmount("");
    setPayAmount(String(Math.min(Number(v), dueOfPaying)));
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!payingRecord || payInvalid) {
      showToast?.("Please specify a valid payment amount.", true);
      return;
    }
    setPayStage("processing");
    try {
      const res = await authApi.payFee({
        feeId: payingRecord.id || payingRecord._id,
        amount: payNum,
        paymentMethod: `Online ${paymentChannel}`
      });
      setPayResult({
        message: res?.message || "Fee payment recorded and verified successfully!",
        amount: payNum,
        remaining: Math.max(0, dueOfPaying - payNum)
      });
      setPayStage("success");
      showToast?.(res?.message || "Fee payment recorded and verified successfully!");
      fetchFees();
    } catch (err) {
      setPayStage("form");
      showToast?.(err.message || "Payment transaction failed.", true);
    }
  };

  /* ───────── derived data ───────── */
  const allReceipts = useMemo(() => {
    const list = [];
    feeRecords.forEach((rec) => {
      (rec.paymentHistory || []).forEach((p, idx) => {
        const key = rec.id || rec._id || "X";
        list.push({
          receiptNo: p.receiptNo || `SVSU-REC-${idx + 101}`,
          rawDate: p.paidAt || null,
          date: fmtDate(p.paidAt),
          channel: p.paymentMethod || "Online Gateway (UPI)",
          // stable fallback (no Math.random → no flicker between renders)
          txnId: p.transactionId || `TXN_${String(key).slice(-4).toUpperCase()}${idx + 1}`,
          amount: Number(p.amount || 0),
          feeType: rec.feeType || "Semester Tuition & Lab Fee",
          semester: rec.semester || currentUser?.semester || "5th Semester",
          academicYear: rec.academicYear || "2024–2025"
        });
      });
    });
    return list;
  }, [feeRecords, currentUser]);

  const counts = useMemo(() => {
    const pending = feeRecords.filter((r) => (r.dueAmount || 0) > 0).length;
    return { all: feeRecords.length, pending, paid: feeRecords.length - pending };
  }, [feeRecords]);

  const filteredRecords = useMemo(() => {
    let list = feeRecords;
    if (statusFilter === "pending") list = list.filter((r) => (r.dueAmount || 0) > 0);
    if (statusFilter === "paid") list = list.filter((r) => (r.dueAmount || 0) === 0);

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((r) =>
        `${r.feeType || ""} ${r.semester || ""} ${r.academicYear || ""}`.toLowerCase().includes(q)
      );
    }

    const sorted = [...list];
    if (sortBy === "due-date") sorted.sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0));
    if (sortBy === "amount-high") sorted.sort((a, b) => (b.dueAmount || 0) - (a.dueAmount || 0));
    if (sortBy === "name") sorted.sort((a, b) => String(a.feeType).localeCompare(String(b.feeType)));
    return sorted;
  }, [feeRecords, statusFilter, query, sortBy]);

  const feeAnalytics = useMemo(() => {
    const total = summary.totalExpected || 0;
    return [
      { label: "Tuition & Academics", pct: 60, amount: Math.round(total * 0.6) },
      { label: "Lab & Practical Immersion", pct: 20, amount: Math.round(total * 0.2) },
      { label: "Examination & Assessment", pct: 10, amount: Math.round(total * 0.1) },
      { label: "Library & Digital Campus", pct: 10, amount: Math.round(total * 0.1) }
    ];
  }, [summary.totalExpected]);

  /** Days until due; negative = overdue. */
  const dueMeta = (rec) => {
    if (!rec.dueDate || (rec.dueAmount || 0) === 0) return null;
    const days = Math.ceil((new Date(rec.dueDate) - new Date()) / 86400000);
    if (days < 0) return { tone: "overdue", text: `${Math.abs(days)}d overdue` };
    if (days <= 7) return { tone: "soon", text: days === 0 ? "Due today" : `Due in ${days}d` };
    return null;
  };

  const statusOf = (rec) => {
    const isPaid = (rec.dueAmount || 0) === 0;
    const isPartial = (rec.paidAmount || 0) > 0 && !isPaid;
    return {
      isPaid,
      isPartial,
      tone: isPaid ? "emerald" : isPartial ? "amber" : "cyan",
      label: isPaid ? "PAID" : isPartial ? "PARTIAL" : "PENDING"
    };
  };

  const paidPct = (rec) => {
    const total = Number(rec.totalAmount || rec.amount || 0);
    return total > 0 ? Math.min(100, Math.round(((rec.paidAmount || 0) / total) * 100)) : 0;
  };

  /* ════════════════════════ RENDER ════════════════════════ */
  return (
    <div className="student-role-view std-fees-page">
      {/* ───────────── HEADER ───────────── */}
      <div className="std-pane-header std-fx-in" style={{ "--i": 0 }}>
        <div className="std-pane-title-group">
          <div className="std-title-icon-badge std-fx-badge-glow">
            <CreditCard size={22} />
          </div>
          <div>
            <h2>Institutional Fee &amp; Accounts Ledger</h2>
            <p>
              Polytechnic Diploma Academic Session 2024–2025 itemized fee reconciliation &amp; verified payment receipts.
            </p>
          </div>
        </div>

        <div className="std-pane-actions">
          <button
            type="button"
            className="std-res-download-btn std-fx-press"
            onClick={fetchFees}
            disabled={loading}
            title="Refresh fee records from accounts database"
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} />
            <span>{loading ? "Syncing…" : "Sync Ledger"}</span>
          </button>
        </div>
      </div>

      {/* ───────────── KPI GRID ───────────── */}
      <div className="std-fees-kpi-grid">
        <div className="std-fee-kpi-card highlight-royal std-fx-in" style={{ "--i": 1 }}>
          <div className="std-fx-kpi-sheen" aria-hidden="true" />
          <div className="std-fee-kpi-top">
            <span className="std-fee-kpi-label">Total Annual Fees</span>
            <span className="std-fee-kpi-badge royal">AICTE Norms</span>
          </div>
          <div className="std-fee-kpi-val-row">
            <AnimatedMoney className="std-fee-kpi-val royal" value={summary.totalExpected} />
          </div>
          <span className="std-fee-kpi-hint">Sanctioned for Diploma in Engineering</span>
        </div>

        <div className="std-fee-kpi-card std-fx-in" style={{ "--i": 2 }}>
          <div className="std-fee-kpi-top">
            <span className="std-fee-kpi-label">Total Paid Amount</span>
            <span className="std-fee-kpi-badge emerald">{summary.collectionRate}% Settled</span>
          </div>
          <div className="std-fee-kpi-val-row">
            <AnimatedMoney className="std-fee-kpi-val paid" value={summary.totalCollected} />
          </div>
          <div className="std-fee-kpi-progress-bar">
            <div
              className="std-fee-kpi-progress-fill emerald std-fx-bar"
              style={{ width: `${Math.min(100, summary.collectionRate)}%` }}
            />
          </div>
          <span className="std-fee-kpi-hint">Reconciled with University Bank Gateway</span>
        </div>

        <div
          className={`std-fee-kpi-card std-fx-in ${summary.totalPending > 0 ? "std-fx-attention" : ""}`}
          style={{ "--i": 3 }}
        >
          <div className="std-fee-kpi-top">
            <span className="std-fee-kpi-label">Outstanding Balance</span>
            <span className={`std-fee-kpi-badge ${summary.totalPending > 0 ? "amber" : "emerald"}`}>
              {summary.totalPending > 0 ? "Pending Payment" : "All Clear"}
            </span>
          </div>
          <div className="std-fee-kpi-val-row">
            <AnimatedMoney
              className={`std-fee-kpi-val ${summary.totalPending > 0 ? "dues" : "paid"}`}
              value={summary.totalPending}
            />
          </div>
          <span className="std-fee-kpi-hint">
            {summary.totalPending === 0 ? "No outstanding arrears on record" : "Immediate clearance recommended"}
          </span>
        </div>

        <div className="std-fee-kpi-card std-fx-in std-fx-ring-card" style={{ "--i": 4 }}>
          <div className="std-fx-ring-wrap">
            <ProgressRing percent={summary.collectionRate} />
            <div className="std-fx-ring-meta">
              <div className="std-fee-kpi-top">
                <span className="std-fee-kpi-label">Scholar Roster</span>
              </div>
              <span className="std-fee-kpi-val-sm">{currentUser?.enrollmentNo || "SPU20240123"}</span>
              <span className="std-fee-kpi-badge blue">{currentUser?.branch || "CSE"}</span>
              <span className="std-fee-kpi-hint">{currentUser?.semester || "5th Semester"} • Regular Diploma</span>
            </div>
          </div>
        </div>
      </div>

      {/* ───────────── FEE ALLOCATION ───────────── */}
      <div className="std-fees-analytics-card std-fx-in" style={{ "--i": 5 }}>
        <div className="std-fees-analytics-header">
          <div className="std-res-header-title-row">
            <PieChart size={18} className="text-royal" />
            <h3>Fee Structure &amp; Component Allocation</h3>
          </div>
          <span className="std-fees-analytics-sub">Institutional fee distribution schedule</span>
        </div>

        {/* stacked overview bar */}
        <div className="std-fx-stack" role="img" aria-label="Fee allocation overview">
          {feeAnalytics.map((item, idx) => (
            <div
              key={item.label}
              className={`std-fx-stack-seg col-${idx % 4}`}
              style={{ width: `${item.pct}%`, "--d": `${idx * 120}ms` }}
              title={`${item.label} — ${item.pct}%`}
            />
          ))}
        </div>

        <div className="std-fees-breakdown-row">
          {feeAnalytics.map((item, idx) => (
            <div key={item.label} className="std-fee-alloc-item">
              <div className="std-fee-alloc-top">
                <span className="std-fee-alloc-name">{item.label}</span>
                <strong className="std-fee-alloc-pct">{item.pct}%</strong>
              </div>
              <div className="std-fee-alloc-bar">
                <div
                  className={`std-fee-alloc-fill std-fx-bar col-${idx % 4}`}
                  style={{ width: `${item.pct}%`, "--d": `${300 + idx * 120}ms` }}
                />
              </div>
              <span className="std-fee-alloc-val">{inr(item.amount)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ───────────── INVOICES LEDGER ───────────── */}
      <div className="std-fees-ledger-card std-fx-in" style={{ "--i": 6 }}>
        <div className="std-fees-ledger-header">
          <div>
            <h3>Semester Coursework Invoices &amp; Billing Heads</h3>
            <p>Official itemized invoice schedule sanctioned by University Accounts Division.</p>
          </div>
        </div>

        {/* toolbar */}
        <div className="std-fx-toolbar">
          <div className="std-fx-search">
            <Search size={15} />
            <input
              type="search"
              placeholder="Search fee head or semester"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search invoices"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} aria-label="Clear search">
                <X size={13} />
              </button>
            )}
          </div>

          <div className="std-fx-sort">
            <label htmlFor="fx-sort">Sort</label>
            <select id="fx-sort" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="due-date">Earliest due date</option>
              <option value="amount-high">Highest balance</option>
              <option value="name">Fee head (A–Z)</option>
            </select>
          </div>

          <div className="std-res-filter-pills std-fx-pills" role="tablist">
            {[
              ["all", `All (${counts.all})`],
              ["pending", `Pending (${counts.pending})`],
              ["paid", `Paid (${counts.paid})`]
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={statusFilter === key}
                className={`std-filter-pill ${statusFilter === key ? "active" : ""}`}
                onClick={() => setStatusFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* desktop table */}
        <div className="std-fees-table-wrap">
          <table className="std-fees-table">
            <thead>
              <tr>
                <th>Invoice / Fee Head</th>
                <th>Due Date</th>
                <th>Total Sanctioned</th>
                <th>Amount Paid</th>
                <th>Pending Balance</th>
                <th>Status</th>
                <th>Payment Action</th>
              </tr>
            </thead>
            <tbody key={`${statusFilter}-${sortBy}-${query}`}>
              {loading ? (
                <SkeletonRows cols={7} />
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="std-fx-empty-cell">
                    <div className="std-fx-empty">
                      <CheckCircle2 size={38} color="var(--std-emerald, #10B981)" />
                      <p>No fee invoices found</p>
                      <small>Nothing matches the current filter or search.</small>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec, i) => {
                  const st = statusOf(rec);
                  const due = dueMeta(rec);
                  return (
                    <tr key={rec.id || rec._id} className="std-fx-row" style={{ "--i": i }}>
                      <td>
                        <strong className="std-fee-head-title">{rec.feeType}</strong>
                        <div className="std-fee-head-sub">
                          {rec.semester} ({rec.academicYear})
                        </div>
                      </td>
                      <td>
                        <div>{fmtDate(rec.dueDate)}</div>
                        {due && (
                          <span className={`std-fx-due ${due.tone}`}>
                            {due.tone === "overdue" ? <AlertCircle size={11} /> : <Clock size={11} />}
                            {due.text}
                          </span>
                        )}
                      </td>
                      <td>
                        <strong>{inr(rec.totalAmount || rec.amount)}</strong>
                      </td>
                      <td>
                        <strong className="text-emerald">{inr(rec.paidAmount)}</strong>
                        <div className="std-fx-mini-bar">
                          <span style={{ width: `${paidPct(rec)}%` }} />
                        </div>
                      </td>
                      <td>
                        <strong className={rec.dueAmount > 0 ? "text-amber" : "text-muted"}>
                          {inr(rec.dueAmount)}
                        </strong>
                      </td>
                      <td>
                        <span className={`std-pill ${st.tone}`}>{st.label}</span>
                      </td>
                      <td>
                        {rec.dueAmount > 0 ? (
                          <button
                            type="button"
                            className="std-btn-primary std-fx-press std-fx-pay-btn"
                            onClick={() => handleOpenPay(rec)}
                          >
                            <CreditCard size={13} />
                            <span>Pay Online</span>
                          </button>
                        ) : (
                          <span className="std-settled-badge">
                            <CheckCircle2 size={13} /> Settled
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* mobile cards */}
        <div className="std-fees-mobile-grid">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="std-fee-mobile-card">
                <span className="std-fx-skel" style={{ width: "40%" }} />
                <span className="std-fx-skel" style={{ width: "75%", height: 16 }} />
                <span className="std-fx-skel" style={{ width: "100%", height: 34 }} />
              </div>
            ))
          ) : filteredRecords.length === 0 ? (
            <div className="std-fx-empty">
              <CheckCircle2 size={34} color="var(--std-emerald, #10B981)" />
              <p>No fee invoices found</p>
            </div>
          ) : (
            filteredRecords.map((rec, i) => {
              const st = statusOf(rec);
              const due = dueMeta(rec);
              return (
                <div key={rec.id || rec._id} className="std-fee-mobile-card std-fx-row" style={{ "--i": i }}>
                  <div className="std-fee-mob-top">
                    <div>
                      <span className="std-cycle-pill">{rec.semester}</span>
                      <h4 className="std-fee-mob-title">{rec.feeType}</h4>
                    </div>
                    <span className={`std-pill ${st.tone}`}>{st.label}</span>
                  </div>

                  {due && (
                    <span className={`std-fx-due ${due.tone}`}>
                      {due.tone === "overdue" ? <AlertCircle size={11} /> : <Clock size={11} />}
                      {due.text}
                    </span>
                  )}

                  <div className="std-fx-mini-bar wide">
                    <span style={{ width: `${paidPct(rec)}%` }} />
                  </div>

                  <div className="std-fee-mob-stats">
                    <div className="std-res-mob-stat">
                      <span>Total</span>
                      <strong>{inr(rec.totalAmount || rec.amount)}</strong>
                    </div>
                    <div className="std-res-mob-stat">
                      <span>Paid</span>
                      <strong className="text-emerald">{inr(rec.paidAmount)}</strong>
                    </div>
                    <div className="std-res-mob-stat">
                      <span>Due</span>
                      <strong className={rec.dueAmount > 0 ? "text-amber" : "text-muted"}>{inr(rec.dueAmount)}</strong>
                    </div>
                  </div>

                  <div className="std-fee-mob-action">
                    {rec.dueAmount > 0 ? (
                      <button
                        type="button"
                        className="std-btn-primary std-fx-press w-full"
                        onClick={() => handleOpenPay(rec)}
                      >
                        <CreditCard size={14} />
                        <span>Pay balance {inr(rec.dueAmount)}</span>
                      </button>
                    ) : (
                      <div className="std-settled-banner">
                        <CheckCircle2 size={15} /> All dues fully paid &amp; verified
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ───────────── RECEIPTS LEDGER ───────────── */}
      <div className="std-fees-ledger-card std-fx-in" style={{ "--i": 7 }}>
        <div className="std-fees-ledger-header">
          <div>
            <h3>Verified University Money Receipts</h3>
            <p>Official digitally signed money receipts provisioned by Accounts Department.</p>
          </div>
          <span className="std-pill cyan">Subharti Accounts Portal</span>
        </div>

        <div className="std-fees-table-wrap">
          <table className="std-fees-table">
            <thead>
              <tr>
                <th>Receipt No</th>
                <th>Fee Head</th>
                <th>Payment Date</th>
                <th>Payment Channel</th>
                <th>Transaction Reference</th>
                <th>Amount Paid</th>
                <th>Status</th>
                <th>Receipt Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows cols={8} rows={3} />
              ) : allReceipts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="std-fx-empty-cell">
                    <div className="std-fx-empty">
                      <Receipt size={34} />
                      <p>No payment transactions yet</p>
                      <small>Receipts appear here right after you pay a fee.</small>
                    </div>
                  </td>
                </tr>
              ) : (
                allReceipts.map((rec, i) => (
                  <tr key={`${rec.receiptNo}-${i}`} className="std-fx-row" style={{ "--i": i }}>
                    <td><span className="std-fee-rec-code">{rec.receiptNo}</span></td>
                    <td><strong>{rec.feeType}</strong></td>
                    <td>{rec.date}</td>
                    <td>{rec.channel}</td>
                    <td><code>{rec.txnId}</code></td>
                    <td><strong className="text-emerald">{inr(rec.amount)}</strong></td>
                    <td><span className="std-pill emerald">Cleared</span></td>
                    <td>
                      <button
                        type="button"
                        className="std-res-download-btn std-fx-press"
                        style={{ height: 32, padding: "0 12px", fontSize: 12 }}
                        onClick={() => setViewingReceipt(rec)}
                        title="View official SVSU stamped money receipt"
                      >
                        <Receipt size={13} />
                        <span>View Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="std-fees-mobile-grid">
          {allReceipts.length === 0 && !loading && (
            <div className="std-fx-empty">
              <Receipt size={30} />
              <p>No payment transactions yet</p>
            </div>
          )}
          {allReceipts.map((rec, i) => (
            <div key={`${rec.receiptNo}-m-${i}`} className="std-fee-mobile-card std-fx-row" style={{ "--i": i }}>
              <div className="std-fee-mob-top">
                <div>
                  <span className="std-fee-rec-code">{rec.receiptNo}</span>
                  <h4 className="std-fee-mob-title">{rec.feeType}</h4>
                </div>
                <strong className="text-emerald">{inr(rec.amount)}</strong>
              </div>
              <div className="std-fee-mob-stats">
                <div className="std-res-mob-stat">
                  <span>Paid on</span>
                  <strong>{rec.date}</strong>
                </div>
                <div className="std-res-mob-stat">
                  <span>Mode</span>
                  <strong>{rec.channel}</strong>
                </div>
                <div className="std-res-mob-stat">
                  <span>Txn ID</span>
                  <code>{rec.txnId?.slice(0, 8)}…</code>
                </div>
              </div>
              <button
                type="button"
                className="std-res-download-btn std-fx-press w-full"
                onClick={() => setViewingReceipt(rec)}
              >
                <Receipt size={14} />
                <span>View verified receipt</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ───────────── PAYMENT MODAL ───────────── */}
      {payingRecord && (
        <div className="std-modal-scrim std-fx-scrim" onClick={closePay}>
          <div
            className="std-pay-modal std-fx-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Pay semester fee online"
          >
            <div className="std-pay-modal-top">
              <div className="std-pay-title-group">
                <Wallet size={20} className="text-royal" />
                <div>
                  <h3>Pay Semester Fee Online</h3>
                  <p>Subharti University Secure Payment Gateway</p>
                </div>
              </div>
              <button
                type="button"
                className="std-modal-close-btn"
                onClick={closePay}
                disabled={payStage === "processing"}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* stage: form */}
            {payStage === "form" && (
              <div className="std-pay-modal-body std-fx-stage">
                <div className="std-pay-summary-box">
                  <div className="std-pay-summary-row">
                    <span>Fee Category:</span>
                    <strong>{payingRecord.feeType}</strong>
                  </div>
                  <div className="std-pay-summary-row">
                    <span>Semester / Year:</span>
                    <strong>{payingRecord.semester} ({payingRecord.academicYear})</strong>
                  </div>
                  <div className="std-pay-summary-row">
                    <span>Current Outstanding Due:</span>
                    <strong className="text-amber">{inr(dueOfPaying)}</strong>
                  </div>
                </div>

                <form onSubmit={handleProcessPayment}>
                  <div className="std-pay-form-group">
                    <label htmlFor="fx-amount">Payment Amount (₹)</label>
                    <div className="std-fx-amount-wrap">
                      <span>₹</span>
                      <input
                        id="fx-amount"
                        type="number"
                        inputMode="numeric"
                        max={dueOfPaying}
                        min={1}
                        value={payAmount}
                        onChange={handleAmountChange}
                        className="std-pay-input"
                        autoFocus
                        required
                      />
                    </div>

                    <div className="std-fx-chips">
                      {[
                        ["25%", Math.round(dueOfPaying * 0.25)],
                        ["50%", Math.round(dueOfPaying * 0.5)],
                        ["Full due", dueOfPaying]
                      ].map(([label, val]) => (
                        <button
                          key={label}
                          type="button"
                          className={`std-fx-chip ${payNum === val ? "active" : ""}`}
                          onClick={() => setPayAmount(String(val))}
                        >
                          {label} · {inr(val)}
                        </button>
                      ))}
                    </div>
                    <small className={payNum > dueOfPaying ? "std-fx-err" : ""}>
                      You may pay in full or in parts, up to {inr(dueOfPaying)}.
                    </small>
                  </div>

                  <div className="std-pay-form-group">
                    <label>Select Payment Channel</label>
                    <div className="std-pay-channel-options">
                      {["UPI", "NetBanking", "Debit Card", "NEFT / RTGS"].map((ch) => (
                        <button
                          key={ch}
                          type="button"
                          className={`std-pay-channel-btn ${paymentChannel === ch ? "active" : ""}`}
                          onClick={() => setPaymentChannel(ch)}
                          aria-pressed={paymentChannel === ch}
                        >
                          {ch}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="std-pay-modal-actions">
                    <button type="button" className="std-res-download-btn std-fx-press" onClick={closePay}>
                      Cancel
                    </button>
                    <button type="submit" className="std-btn-primary std-fx-press" disabled={payInvalid}>
                      <CreditCard size={15} />
                      <span>Pay {inr(payNum)}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* stage: processing */}
            {payStage === "processing" && (
              <div className="std-pay-modal-body std-fx-stage std-fx-processing" aria-live="polite">
                <div className="std-fx-orbit">
                  <Loader2 size={30} className="spin" />
                </div>
                <h4>Verifying your payment</h4>
                <p>Please keep this window open while we confirm with the bank.</p>
                <div className="std-fx-indeterminate"><span /></div>
              </div>
            )}

            {/* stage: success */}
            {payStage === "success" && payResult && (
              <div className="std-pay-modal-body std-fx-stage std-fx-success" aria-live="polite">
                <SuccessTick />
                <h4>Payment received</h4>
                <p className="std-fx-success-amt">{inr(payResult.amount)}</p>
                <p>{payResult.message}</p>
                <div className="std-pay-summary-box">
                  <div className="std-pay-summary-row">
                    <span>Paid via</span>
                    <strong>{paymentChannel}</strong>
                  </div>
                  <div className="std-pay-summary-row">
                    <span>Remaining on this invoice</span>
                    <strong className={payResult.remaining > 0 ? "text-amber" : "text-emerald"}>
                      {inr(payResult.remaining)}
                    </strong>
                  </div>
                </div>
                <div className="std-pay-modal-actions">
                  <button type="button" className="std-btn-primary std-fx-press" onClick={closePay}>
                    <CheckCircle2 size={15} />
                    <span>Done</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ───────────── RECEIPT MODAL ───────────── */}
      {viewingReceipt && (
        <div className="std-modal-scrim std-fx-scrim" onClick={closeReceipt}>
          <div
            className="std-receipt-modal std-fx-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Official fee receipt"
          >
            <div className="std-transcript-ctrl-bar no-print">
              <div className="std-transcript-ctrl-title">
                <Receipt size={18} className="text-emerald" />
                <span>Official SVSU Digitally Stamped Fee Receipt</span>
              </div>
              <div className="std-transcript-ctrl-actions">
                <button type="button" className="std-btn-primary std-fx-press" onClick={() => window.print()}>
                  <Printer size={15} />
                  <span>Print Receipt</span>
                </button>
                <button type="button" className="std-modal-close-btn" onClick={closeReceipt} aria-label="Close modal">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="std-receipt-document" id="std-print-area">
              <div className="std-fx-watermark" aria-hidden="true">PAID</div>

              <div className="std-trans-header">
                <img src={assetUrl("/svsu-logo-whiten.webp")} alt="SVSU Crest" className="std-trans-crest" />
                <div className="std-trans-header-text">
                  <h3>SWAMI VIVEKANAND SUBHARTI UNIVERSITY</h3>
                  <h4>SUBHARTI POLYTECHNIC COLLEGE — ACCOUNTS DIVISION</h4>
                  <p className="std-trans-sub">
                    Subhartipuram, NH-58, Delhi-Haridwar Bypass Road, Meerut-250005
                  </p>
                  <div className="std-trans-title-band">OFFICIAL TUITION &amp; ACADEMIC FEE MONEY RECEIPT</div>
                </div>
              </div>

              <div className="std-trans-meta-grid">
                <div className="std-trans-meta-col">
                  <div className="std-trans-meta-row">
                    <span className="meta-label">Receipt Number:</span>
                    <strong className="meta-val">{viewingReceipt.receiptNo}</strong>
                  </div>
                  <div className="std-trans-meta-row">
                    <span className="meta-label">Payment Date:</span>
                    <strong className="meta-val">{viewingReceipt.date}</strong>
                  </div>
                  <div className="std-trans-meta-row">
                    <span className="meta-label">Transaction ID:</span>
                    <code className="meta-val">{viewingReceipt.txnId}</code>
                  </div>
                </div>
                <div className="std-trans-meta-col">
                  <div className="std-trans-meta-row">
                    <span className="meta-label">Student Name:</span>
                    <strong className="meta-val">{currentUser?.fullName || "Scholar"}</strong>
                  </div>
                  <div className="std-trans-meta-row">
                    <span className="meta-label">Enrollment No:</span>
                    <strong className="meta-val">{currentUser?.enrollmentNo || "SPU20240123"}</strong>
                  </div>
                  <div className="std-trans-meta-row">
                    <span className="meta-label">Branch &amp; Sem:</span>
                    <strong className="meta-val">
                      {currentUser?.branch || "CSE"} • {viewingReceipt.semester}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="std-fx-table-scroll">
                <table className="std-trans-table">
                  <thead>
                    <tr>
                      <th>S.No.</th>
                      <th>Particulars / Fee Head</th>
                      <th>Academic Session</th>
                      <th>Payment Mode</th>
                      <th style={{ textAlign: "right" }}>Amount Settled (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ textAlign: "center" }}>1</td>
                      <td><strong>{viewingReceipt.feeType}</strong></td>
                      <td>{viewingReceipt.academicYear}</td>
                      <td>{viewingReceipt.channel}</td>
                      <td style={{ textAlign: "right", fontWeight: 800 }}>{inr(viewingReceipt.amount)}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="std-trans-tfoot">
                      <td colSpan={4} style={{ textAlign: "right", fontWeight: 700 }}>
                        Net Amount Paid &amp; Cleared:
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 900, color: "#059669", fontSize: 15 }}>
                        {inr(viewingReceipt.amount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="std-trans-signatures">
                <div className="std-trans-qr-block">
                  <div className="std-trans-qr-box">
                    <QrCode size={56} />
                  </div>
                  <small>Scan to verify accounts transaction on CollegeOS Portal</small>
                </div>
                <div className="std-receipt-stamp std-fx-stamp">
                  <ShieldCheck size={28} className="text-emerald" />
                  <strong>FEE PAID &amp; CLEARED</strong>
                  <small>Accounts Officer, SVSU</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────── NOTICE ───────────── */}
      <div className="std-fees-notice-box std-fx-in" style={{ "--i": 8 }}>
        <ShieldCheck size={26} className="text-emerald" />
        <div>
          <strong>Subharti Accounts &amp; Financial Security:</strong> Fee records are directly reconciled with the
          University Central Accounts Office. Any tuition fee concession under UP Government Post-Matric Scholarship is
          directly credited upon state verification.
        </div>
      </div>
    </div>
  );
}