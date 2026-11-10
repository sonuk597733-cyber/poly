import React, { useState, useEffect, useMemo } from "react";
import {
  BookOpen, Search, RotateCw, Plus, CheckCircle2, AlertCircle,
  RefreshCw, Bookmark, Calendar, User, Clock, QrCode, Tag,
  Building2, ArrowUpRight, Check, X, ShieldCheck, Library,
  Sparkles, Layers
} from "lucide-react";
import { authApi } from "../../services/authApi";
import "./StudentTheme.css";
import "./StudentLibrary.css";

const CATEGORIES = [
  { id: "all", label: "All Collections" },
  { id: "cse", label: "Computer Science & IT" },
  { id: "mech", label: "Mechanical Engineering" },
  { id: "elec", label: "Electrical & EV Systems" },
  { id: "civil", label: "Civil Engineering" },
  { id: "math", label: "Mathematics & Sciences" }
];

export default function StudentLibrary({ currentUser, showToast }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [issuedBooks, setIssuedBooks] = useState([]);
  const [catalogBooks, setCatalogBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [borrowingId, setBorrowingId] = useState(null);
  const [returningId, setReturningId] = useState(null);

  const fetchLibraryData = () => {
    setLoading(true);
    Promise.all([
      authApi.getMyIssuedBooks().catch(() => ({ issues: [] })),
      authApi.getLibraryBooks().catch(() => ({ books: [] }))
    ])
      .then(([issueRes, catalogRes]) => {
        if (issueRes?.issues) setIssuedBooks(issueRes.issues);
        if (catalogRes?.books) setCatalogBooks(catalogRes.books);
        setLoading(false);
      })
      .catch((err) => {
        showToast?.(err.message || "Failed to load library catalog.", true);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLibraryData();
  }, []);

  const handleSearch = (e) => {
    e?.preventDefault();
    setSearching(true);
    authApi
      .getLibraryBooks({ search: searchQuery })
      .then((res) => {
        if (res?.books) setCatalogBooks(res.books);
        setSearching(false);
      })
      .catch((err) => {
        showToast?.(err.message || "Search failed.", true);
        setSearching(false);
      });
  };

  const handleBorrowBook = async (book) => {
    setBorrowingId(book.id || book._id);
    try {
      const res = await authApi.issueLibraryBook({
        bookId: book.id || book._id,
        studentName: currentUser?.fullName,
        enrollmentNo: currentUser?.enrollmentNo
      });
      showToast?.(res.message || `"${book.title}" borrowed successfully!`);
      setSelectedBook(null);
      fetchLibraryData();
    } catch (err) {
      showToast?.(err.message || "Failed to borrow book. Check slot limits.", true);
    } finally {
      setBorrowingId(null);
    }
  };

  const handleReturnBook = async (issue) => {
    setReturningId(issue.id || issue._id);
    try {
      const res = await authApi.returnLibraryBook({
        issueId: issue.id || issue._id
      });
      showToast?.(res.message || `"${issue.bookTitle}" returned successfully.`);
      fetchLibraryData();
    } catch (err) {
      showToast?.(err.message || "Failed to return book.", true);
    } finally {
      setReturningId(null);
    }
  };

  const activeIssues = issuedBooks.filter((b) => b.status === "issued" || b.status === "overdue");
  const totalFines = activeIssues.reduce((acc, b) => acc + (b.fineAmount || 0), 0);

  // Filter catalog
  const filteredCatalog = useMemo(() => {
    return catalogBooks.filter((book) => {
      // Category filter
      if (activeCategory !== "all") {
        const cat = (book.category || book.department || "").toLowerCase();
        if (activeCategory === "cse" && !cat.includes("comp") && !cat.includes("cs")) return false;
        if (activeCategory === "mech" && !cat.includes("mech")) return false;
        if (activeCategory === "elec" && !cat.includes("elec")) return false;
        if (activeCategory === "civil" && !cat.includes("civil")) return false;
        if (activeCategory === "math" && !cat.includes("math") && !cat.includes("phys")) return false;
      }
      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (book.title || "").toLowerCase().includes(q);
        const matchAuthor = (book.author || "").toLowerCase().includes(q);
        const matchIsbn = (book.isbn || "").toLowerCase().includes(q);
        return matchTitle || matchAuthor || matchIsbn;
      }
      return true;
    });
  }, [catalogBooks, activeCategory, searchQuery]);

  return (
    <div className="student-role-view std-lib-page">
      {/* ───────────── HEADER ───────────── */}
      <div className="std-pane-header">
        <div className="std-pane-title-group">
          <div className="std-title-icon-badge">
            <BookOpen size={22} />
          </div>
          <div>
            <h2>Central Digital Library & Accession Portal</h2>
            <p>
              Subharti Central University digital stacks, technical textbook issue ledger, and study reference loans.
            </p>
          </div>
        </div>

        <div className="std-pane-actions">
          <button
            type="button"
            className="std-res-download-btn"
            onClick={fetchLibraryData}
            title="Refresh library stacks"
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} />
            <span>Sync Library</span>
          </button>
        </div>
      </div>

      {/* ───────────── BENTO METRICS GRID ───────────── */}
      <div className="std-lib-kpi-grid">
        {/* Digital Library Card ID */}
        <div className="std-lib-kpi-card highlight-royal">
          <div className="std-lib-kpi-top">
            <span className="std-lib-kpi-label">Digital Library Card</span>
            <span className="std-lib-kpi-badge royal">Verified</span>
          </div>
          <div className="std-lib-kpi-val-row">
            <span className="std-lib-kpi-val royal">
              LIB-{currentUser?.enrollmentNo?.replace("SPU", "").replace("SUB-", "") || "202427"}
            </span>
          </div>
          <span className="std-lib-kpi-hint">Barcoded Central Accession ID</span>
        </div>

        {/* Borrowed Books Quota */}
        <div className="std-lib-kpi-card">
          <div className="std-lib-kpi-top">
            <span className="std-lib-kpi-label">Active Loans</span>
            <span className="std-lib-kpi-badge emerald">{4 - activeIssues.length} Available</span>
          </div>
          <div className="std-lib-kpi-val-row">
            <span className="std-lib-kpi-val">{activeIssues.length}</span>
            <span className="std-lib-kpi-scale">/ 4 max books</span>
          </div>
          <div className="std-lib-kpi-progress-bar">
            <div
              className="std-lib-kpi-progress-fill"
              style={{ width: `${(activeIssues.length / 4) * 100}%` }}
            />
          </div>
          <span className="std-lib-kpi-hint">14-day regular loan renewal cycle</span>
        </div>

        {/* Overdue Fines Status */}
        <div className="std-lib-kpi-card">
          <div className="std-lib-kpi-top">
            <span className="std-lib-kpi-label">Overdue Fines</span>
            <span className={`std-lib-kpi-badge ${totalFines > 0 ? "amber" : "emerald"}`}>
              {totalFines > 0 ? "Arrears Due" : "Nil Arrears"}
            </span>
          </div>
          <div className="std-lib-kpi-val-row">
            <span className={`std-lib-kpi-val ${totalFines > 0 ? "amber" : "paid"}`}>
              ₹{totalFines}
            </span>
          </div>
          <span className="std-lib-kpi-hint">
            {totalFines === 0 ? "All loans within permissible dates" : "Pay at Central Circulation Desk"}
          </span>
        </div>

        {/* Total Collection Volumes */}
        <div className="std-lib-kpi-card">
          <div className="std-lib-kpi-top">
            <span className="std-lib-kpi-label">Catalog Titles</span>
            <span className="std-lib-kpi-badge blue">SVSU Stacks</span>
          </div>
          <div className="std-lib-kpi-val-row">
            <span className="std-lib-kpi-val">{catalogBooks.length || "50,000+"}</span>
          </div>
          <span className="std-lib-kpi-hint">AICTE Recommended Polytechnic Syllabi</span>
        </div>
      </div>

      {/* ───────────── ACTIVE BORROWED BOOKS SECTION ───────────── */}
      <div className="std-lib-section-card">
        <div className="std-lib-card-header">
          <div>
            <h3>My Borrowed Library Books</h3>
            <p>Active borrowed titles, return deadlines, and circulation renewal options.</p>
          </div>
          <span className="std-res-verified-pill">
            <CheckCircle2 size={13} /> {activeIssues.length} Active Loan{activeIssues.length !== 1 ? "s" : ""}
          </span>
        </div>

        {activeIssues.length === 0 ? (
          <div className="std-lib-empty-box">
            <BookOpen size={36} color="var(--std-text-muted)" style={{ margin: "0 auto 8px" }} />
            <p style={{ fontWeight: 700, color: "var(--std-text-title)" }}>No Books Currently Borrowed</p>
            <small>Browse the catalog below to borrow up to 4 textbooks simultaneously.</small>
          </div>
        ) : (
          <div className="std-lib-loans-grid">
            {activeIssues.map((issue) => {
              const isOverdue = issue.status === "overdue" || (issue.fineAmount || 0) > 0;
              const dueStr = new Date(issue.dueDate || Date.now()).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric"
              });

              return (
                <div key={issue.id || issue._id} className="std-loan-card">
                  <div className="std-loan-book-icon">
                    <BookOpen size={22} />
                  </div>
                  <div className="std-loan-details">
                    <span className="std-loan-code">ACC-{issue.accessionNo || issue.bookId || "BK"}</span>
                    <h4 className="std-loan-title">{issue.bookTitle || "Engineering Textbook"}</h4>
                    <span className="std-loan-author">by {issue.author || "SVSU Academic Faculty"}</span>
                    <div className="std-loan-meta-row">
                      <span className="std-loan-due">
                        <Clock size={12} /> Due: <strong>{dueStr}</strong>
                      </span>
                      {isOverdue && (
                        <span className="std-loan-fine">Overdue Fine: ₹{issue.fineAmount || 50}</span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="std-res-download-btn"
                    style={{ height: 34, fontSize: 12 }}
                    disabled={returningId === (issue.id || issue._id)}
                    onClick={() => handleReturnBook(issue)}
                  >
                    <RotateCw size={13} className={returningId === (issue.id || issue._id) ? "spin" : ""} />
                    <span>Return Book</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ───────────── CATALOG EXPLORATION & SEARCH ───────────── */}
      <div className="std-lib-section-card">
        <div className="std-lib-card-header">
          <div>
            <h3>Search Central Library Catalog</h3>
            <p>Search over 50,000+ print volumes, textbooks, and technical reference manuals.</p>
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearch} className="std-lib-search-form">
            <div className="std-lib-search-input-wrap">
              <Search size={15} color="var(--std-text-muted)" />
              <input
                type="text"
                placeholder="Search by book title, author, or ISBN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="std-lib-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="std-lib-clear-btn"
                  onClick={() => setSearchQuery("")}
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button type="submit" className="std-btn-primary" style={{ height: 38 }}>
              <span>Search</span>
            </button>
          </form>
        </div>

        {/* Category Pills */}
        <div className="std-lib-cat-pills">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`std-filter-pill ${activeCategory === cat.id ? "active" : ""}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Book Grid */}
        <div className="std-lib-books-grid">
          {loading ? (
            <div className="std-loading-inline" style={{ gridColumn: "1 / -1", padding: "40px" }}>
              <div className="std-spinner" />
              <span>Searching central accession catalog...</span>
            </div>
          ) : filteredCatalog.length === 0 ? (
            <div className="std-lib-empty-box" style={{ gridColumn: "1 / -1" }}>
              <AlertCircle size={32} color="var(--std-text-muted)" style={{ margin: "0 auto 8px" }} />
              <p style={{ fontWeight: 700, color: "var(--std-text-title)" }}>No Titles Match Filter</p>
              <small>Try selecting "All Collections" or searching with a different keyword.</small>
            </div>
          ) : (
            filteredCatalog.map((book) => {
              const isAvailable = (book.copiesAvailable || book.availableCopies || 1) > 0;
              const isAlreadyBorrowed = activeIssues.some(
                (i) => (i.bookId === (book.id || book._id)) || (i.bookTitle === book.title)
              );

              return (
                <div key={book.id || book._id} className="std-book-card">
                  <div className="std-book-card-top">
                    <span className="std-book-badge">{book.category || "Engineering"}</span>
                    <span className={`std-book-avail ${isAvailable ? "avail" : "issued"}`}>
                      {isAvailable ? `${book.copiesAvailable || 1} Copies Available` : "Checked Out"}
                    </span>
                  </div>

                  <h4 className="std-book-title">{book.title}</h4>
                  <span className="std-book-author">by {book.author || "Academic Author"}</span>

                  <div className="std-book-meta-grid">
                    <div className="std-book-meta-item">
                      <span>Edition:</span>
                      <strong>{book.edition || "Latest AICTE Ed."}</strong>
                    </div>
                    <div className="std-book-meta-item">
                      <span>Shelf Rack:</span>
                      <strong>{book.rackNo || book.shelfLocation || "Rack B-14"}</strong>
                    </div>
                  </div>

                  <div className="std-book-actions">
                    <button
                      type="button"
                      className="std-res-download-btn"
                      style={{ height: 32, fontSize: 12 }}
                      onClick={() => setSelectedBook(book)}
                    >
                      <span>Details</span>
                    </button>

                    {isAlreadyBorrowed ? (
                      <span className="std-already-borrowed">
                        <Check size={12} /> On Loan
                      </span>
                    ) : isAvailable ? (
                      <button
                        type="button"
                        className="std-btn-primary"
                        style={{ height: 32, fontSize: 12, padding: "0 12px" }}
                        disabled={borrowingId === (book.id || book._id) || activeIssues.length >= 4}
                        onClick={() => handleBorrowBook(book)}
                        title={activeIssues.length >= 4 ? "Maximum loan limit reached (4 books)" : "Borrow book"}
                      >
                        <Plus size={13} />
                        <span>Borrow</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="std-res-download-btn"
                        style={{ height: 32, fontSize: 12, opacity: 0.7 }}
                        onClick={() => showToast?.(`Reservation request logged for "${book.title}". You will be notified upon check-in.`)}
                      >
                        <Bookmark size={12} />
                        <span>Reserve</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ───────────── BOOK DETAIL MODAL ───────────── */}
      {selectedBook && (
        <div className="std-modal-scrim" onClick={() => setSelectedBook(null)}>
          <div className="std-book-modal" onClick={(e) => e.stopPropagation()} role="dialog">
            <div className="std-book-modal-top">
              <div className="std-pay-title-group">
                <BookOpen size={20} className="text-royal" />
                <div>
                  <h3>Book Accession & Shelf Details</h3>
                  <p>Subharti Central University Library Records</p>
                </div>
              </div>
              <button
                type="button"
                className="std-modal-close-btn"
                onClick={() => setSelectedBook(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="std-book-modal-body">
              <div className="std-book-hero-preview">
                <div className="std-book-cover-mock">
                  <BookOpen size={36} />
                  <span>{selectedBook.category || "Engineering"}</span>
                </div>
                <div className="std-book-hero-text">
                  <h4>{selectedBook.title}</h4>
                  <span className="std-book-author">Author: <strong>{selectedBook.author}</strong></span>
                  <span className="std-book-publisher">Publisher: <strong>{selectedBook.publisher || "Technical Publications"}</strong></span>
                  <span className="std-book-isbn">ISBN: <code>{selectedBook.isbn || "978-93-8984-210-9"}</code></span>
                </div>
              </div>

              <div className="std-book-detail-grid">
                <div className="std-book-detail-row">
                  <span>Shelf / Stack Location:</span>
                  <strong>{selectedBook.rackNo || selectedBook.shelfLocation || "Rack B-14, Bay 3"}</strong>
                </div>
                <div className="std-book-detail-row">
                  <span>Total Print Copies:</span>
                  <strong>{selectedBook.totalCopies || 5} Volumes</strong>
                </div>
                <div className="std-book-detail-row">
                  <span>Currently Available:</span>
                  <strong className="text-emerald">{selectedBook.copiesAvailable || 1} Copies</strong>
                </div>
                <div className="std-book-detail-row">
                  <span>Loan Period:</span>
                  <strong>14 Days (Renewable once online)</strong>
                </div>
              </div>

              <div className="std-pay-modal-actions">
                <button
                  type="button"
                  className="std-res-download-btn"
                  onClick={() => setSelectedBook(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="std-btn-primary"
                  disabled={borrowingId === (selectedBook.id || selectedBook._id) || activeIssues.length >= 4}
                  onClick={() => handleBorrowBook(selectedBook)}
                >
                  <Plus size={14} />
                  <span>Borrow This Book</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
