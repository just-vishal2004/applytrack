import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  FileText,
  LayoutDashboard,
  LoaderCircle,
  MapPin,
  Menu,
  Plus,
  Search,
  Settings,
  SlidersHorizontal,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import { applicationsApi } from "./lib/api";
import "./App.css";

const STATUSES = ["Applied", "Screening", "Interview", "Offer", "Rejected"];

const EMPTY_FORM = {
  company: "",
  position: "",
  location: "",
  status: "Applied",
  appliedAt: new Date().toISOString().slice(0, 10),
  followUpAt: "",
  jobUrl: "",
  notes: "",
};

const STATUS_STYLES = {
  Applied: "status-applied",
  Screening: "status-screening",
  Interview: "status-interview",
  Offer: "status-offer",
  Rejected: "status-rejected",
};

function formatDate(value) {
  if (!value) return "Not scheduled";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not scheduled";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getInitials(value = "") {
  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function App() {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    Applied: 0,
    Screening: 0,
    Interview: 0,
    Offer: 0,
    Rejected: 0,
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 1,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [applicationResult, statsResult] = await Promise.all([
        applicationsApi.list({
          page,
          limit: 10,
          search,
          status: statusFilter,
        }),
        applicationsApi.stats(),
      ]);

      setApplications(applicationResult.data || []);
      setPagination(
        applicationResult.pagination || {
          page: 1,
          total: 0,
          totalPages: 1,
        }
      );
      setStats(statsResult.data || {});
    } catch (err) {
      setError(
        err.message ||
          "Couldn't load applications. Check that the API server is running."
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadData();
    }, search ? 250 : 0);

    return () => window.clearTimeout(timer);
  }, [loadData, search]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  function openCreateModal() {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      appliedAt: new Date().toISOString().slice(0, 10),
    });
    setFormError("");
    setModalOpen(true);
  }

  async function openEditModal(application) {
    setEditingId(application._id);
    setForm({
      company: application.company || "",
      position: application.position || "",
      location: application.location || "",
      status: application.status || "Applied",
      appliedAt: application.appliedAt
        ? new Date(application.appliedAt).toISOString().slice(0, 10)
        : "",
      followUpAt: application.followUpAt
        ? new Date(application.followUpAt).toISOString().slice(0, 10)
        : "",
      jobUrl: application.jobUrl || "",
      notes: application.notes || "",
    });
    setFormError("");
    setModalOpen(true);
  }

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    if (!form.company.trim() || !form.position.trim()) {
      setFormError("Company and position are required.");
      return;
    }

    setSaving(true);

    const payload = {
      ...form,
      company: form.company.trim(),
      position: form.position.trim(),
      appliedAt: form.appliedAt || undefined,
      followUpAt: form.followUpAt || null,
    };

    try {
      if (editingId) {
        await applicationsApi.update(editingId, payload);
      } else {
        await applicationsApi.create(payload);
        setPage(1);
      }

      setModalOpen(false);
      await loadData();
    } catch (err) {
      setFormError(err.message || "Unable to save this application.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(application) {
    const confirmed = window.confirm(
      `Delete the application for ${application.company}? This cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(application._id);
    setError("");

    try {
      await applicationsApi.remove(application._id);
      await loadData();
    } catch (err) {
      setError(err.message || "Unable to delete this application.");
    } finally {
      setDeletingId(null);
    }
  }

  const responseRate =
    stats.total > 0
      ? Math.round(
          (((stats.Interview || 0) + (stats.Offer || 0)) / stats.total) * 100
        )
      : 0;

  const activeApplications =
    (stats.Applied || 0) + (stats.Screening || 0) + (stats.Interview || 0);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#dashboard" aria-label="ApplyTrack home">
          <span className="brand-mark">
            <BriefcaseBusiness size={21} strokeWidth={2.2} />
          </span>
          <span>
            <strong>applytrack</strong>
            <small>CAREER WORKSPACE</small>
          </span>
        </a>

        <div className="sidebar-label">WORKSPACE</div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <a className="nav-item active" href="#dashboard">
            <LayoutDashboard size={18} />
            <span>Overview</span>
          </a>
          <a
            className="nav-item"
            href="#applications"
            onClick={() => document.getElementById("applications")?.scrollIntoView()}
          >
            <BriefcaseBusiness size={18} />
            <span>Applications</span>
            <span className="nav-count">{stats.total || 0}</span>
          </a>
          <a className="nav-item" href="#follow-ups">
            <CalendarDays size={18} />
            <span>Follow-ups</span>
          </a>
        </nav>

        <div className="sidebar-label sidebar-label-spaced">PREFERENCES</div>

        <nav className="sidebar-nav">
          <button className="nav-item nav-button" type="button" disabled>
            <SlidersHorizontal size={18} />
            <span>Preferences</span>
          </button>
          <button className="nav-item nav-button" type="button" disabled>
            <Settings size={18} />
            <span>Settings</span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <div className="tip-icon">
              <TrendingUp size={18} />
            </div>
            <strong>Small steps add up.</strong>
            <p>Keep your search organised and your next move clear.</p>
          </div>

          <div className="profile-row">
            <div className="avatar">VK</div>
            <div className="profile-copy">
              <strong>My workspace</strong>
              <span>Job seeker</span>
            </div>
            <ChevronDown size={15} />
          </div>
        </div>
      </aside>

      <main className="main-content" id="dashboard">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Workspace</span>
            <span className="breadcrumb-separator">/</span>
            <strong>Overview</strong>
          </div>
          <div className="topbar-right">
            <span className="today-label">
              <CalendarDays size={15} />
              Your job search
            </span>
            <button
              className="primary-button top-add-button"
              onClick={openCreateModal}
            >
              <Plus size={17} />
              Add application
            </button>
          </div>
        </header>

        <div className="page-content">
          <section className="welcome-section">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-dot" />
                YOUR CAREER, ORGANISED
              </div>
              <h1>Good things take <span>follow-through.</span></h1>
              <p>
                One place for every application, conversation, and next step.
              </p>
            </div>
            <div className="welcome-decoration" aria-hidden="true">
              <div className="decoration-circle decoration-circle-one" />
              <div className="decoration-circle decoration-circle-two" />
              <BriefcaseBusiness size={44} strokeWidth={1.2} />
            </div>
          </section>

          {error && (
            <div className="error-banner" role="alert">
              <Activity size={18} />
              <span>{error}</span>
              <button
                className="text-button"
                onClick={loadData}
                type="button"
              >
                Try again
              </button>
            </div>
          )}

          <section className="stats-grid" aria-label="Application statistics">
            <article className="stat-card stat-card-primary">
              <div className="stat-topline">
                <span className="stat-icon stat-icon-blue">
                  <BriefcaseBusiness size={19} />
                </span>
                <span className="stat-caption">ALL TIME</span>
              </div>
              <div className="stat-number">
                {loading ? "—" : stats.total || 0}
              </div>
              <div className="stat-title">Total applications</div>
              <div className="stat-foot">
                <span className="stat-foot-icon">
                  <ArrowUpRight size={14} />
                </span>
                Every opportunity starts here
              </div>
            </article>

            <article className="stat-card">
              <div className="stat-topline">
                <span className="stat-icon stat-icon-purple">
                  <Clock3 size={19} />
                </span>
                <span className="stat-caption">IN PROGRESS</span>
              </div>
              <div className="stat-number">
                {loading ? "—" : activeApplications}
              </div>
              <div className="stat-title">Active applications</div>
              <div className="stat-foot">
                <span className="mini-dot mini-dot-purple" />
                Applied, screening or interview
              </div>
            </article>

            <article className="stat-card">
              <div className="stat-topline">
                <span className="stat-icon stat-icon-green">
                  <Check size={19} />
                </span>
                <span className="stat-caption">POSITIVE SIGNALS</span>
              </div>
              <div className="stat-number">
                {loading ? "—" : stats.Interview || 0}
              </div>
              <div className="stat-title">Interviews</div>
              <div className="stat-foot">
                <span className="mini-dot mini-dot-green" />
                Conversations in progress
              </div>
            </article>

            <article className="stat-card">
              <div className="stat-topline">
                <span className="stat-icon stat-icon-orange">
                  <CircleDollarSign size={19} />
                </span>
                <span className="stat-caption">MILESTONES</span>
              </div>
              <div className="stat-number">
                {loading ? "—" : stats.Offer || 0}
              </div>
              <div className="stat-title">Offers received</div>
              <div className="stat-foot">
                <span className="mini-dot mini-dot-orange" />
                Your work is moving forward
              </div>
            </article>
          </section>

          <section className="insight-row">
            <div className="insight-card">
              <div className="insight-icon">
                <Activity size={18} />
              </div>
              <div className="insight-copy">
                <span>Response progress</span>
                <strong>{responseRate}%</strong>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${responseRate}%` }}
                />
              </div>
              <span className="insight-note">
                Interview or offer stage
              </span>
            </div>

            <div className="insight-card insight-card-followup" id="follow-ups">
              <div className="insight-icon insight-icon-warm">
                <CalendarDays size={18} />
              </div>
              <div className="insight-copy">
                <span>Keep momentum</span>
                <strong>Follow up</strong>
              </div>
              <p>Track your next step for every open opportunity.</p>
              <button
                className="subtle-button"
                onClick={() => {
                  setStatusFilter("");
                  document
                    .getElementById("applications")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                View applications <ArrowUpRight size={14} />
              </button>
            </div>
          </section>

          <section className="applications-section" id="applications">
            <div className="section-heading">
              <div>
                <div className="section-kicker">YOUR PIPELINE</div>
                <h2>Applications <span className="heading-count">{stats.total || 0}</span></h2>
                <p>Every role, from first click to final decision.</p>
              </div>
              <button className="primary-button" onClick={openCreateModal}>
                <Plus size={17} />
                New application
              </button>
            </div>

            <div className="table-toolbar">
              <div className="search-field">
                <Search size={17} />
                <input
                  type="search"
                  placeholder="Search companies or roles..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  aria-label="Search applications"
                />
                {search && (
                  <button
                    className="clear-search"
                    aria-label="Clear search"
                    onClick={() => setSearch("")}
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              <label className="filter-field">
                <SlidersHorizontal size={16} />
                <span className="filter-label">Status</span>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  aria-label="Filter by status"
                >
                  <option value="">All statuses</option>
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="filter-chevron" />
              </label>
            </div>

            <div className="applications-table-wrap">
              <table className="applications-table">
                <thead>
                  <tr>
                    <th>COMPANY / ROLE</th>
                    <th>STATUS</th>
                    <th>APPLIED ON</th>
                    <th>FOLLOW-UP</th>
                    <th className="actions-heading">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="table-message">
                        <LoaderCircle className="spinner" size={22} />
                        Loading your applications...
                      </td>
                    </tr>
                  ) : applications.length === 0 ? (
                    <tr>
                      <td colSpan="5">
                        <div className="empty-state">
                          <div className="empty-icon">
                            <FileText size={25} />
                          </div>
                          <h3>
                            {search || statusFilter
                              ? "No matching applications"
                              : "Your next opportunity starts here"}
                          </h3>
                          <p>
                            {search || statusFilter
                              ? "Try another search or clear your filters."
                              : "Add the roles you've applied for to keep your search organised."}
                          </p>
                          {!search && !statusFilter && (
                            <button
                              className="primary-button"
                              onClick={openCreateModal}
                            >
                              <Plus size={16} />
                              Add your first application
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    applications.map((application) => (
                      <tr key={application._id}>
                        <td>
                          <div className="company-cell">
                            <div className="company-avatar">
                              {getInitials(application.company)}
                            </div>
                            <div className="company-copy">
                              <strong>{application.company}</strong>
                              <span>{application.position}</span>
                              {application.location && (
                                <span className="company-location">
                                  <MapPin size={12} />
                                  {application.location}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`status-pill ${
                              STATUS_STYLES[application.status] || ""
                            }`}
                          >
                            <span className="status-dot" />
                            {application.status}
                          </span>
                        </td>
                        <td className="date-cell">
                          {formatDate(application.appliedAt)}
                        </td>
                        <td className="date-cell">
                          {formatDate(application.followUpAt)}
                        </td>
                        <td>
                          <div className="row-actions">
                            {application.jobUrl && (
                              <a
                                className="icon-button"
                                href={application.jobUrl}
                                target="_blank"
                                rel="noreferrer"
                                aria-label={`Open job posting for ${application.company}`}
                                title="Open job posting"
                              >
                                <ArrowUpRight size={16} />
                              </a>
                            )}
                            <button
                              className="icon-button"
                              onClick={() => openEditModal(application)}
                              aria-label={`Edit ${application.company}`}
                              title="Edit application"
                            >
                              <FileText size={16} />
                            </button>
                            <button
                              className="icon-button icon-button-danger"
                              onClick={() => handleDelete(application)}
                              disabled={deletingId === application._id}
                              aria-label={`Delete ${application.company}`}
                              title="Delete application"
                            >
                              {deletingId === application._id ? (
                                <LoaderCircle className="spinner" size={16} />
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="table-footer">
              <span>
                Showing{" "}
                <strong>{applications.length}</strong> of{" "}
                <strong>{pagination.total || 0}</strong> applications
              </span>
              <div className="pagination-controls">
                <button
                  className="pagination-button"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((current) => current - 1)}
                >
                  Previous
                </button>
                <span>
                  {pagination.page || page} / {pagination.totalPages || 1}
                </span>
                <button
                  className="pagination-button"
                  disabled={
                    loading || page >= (pagination.totalPages || 1)
                  }
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </section>

          <footer className="page-footer">
            <span>ApplyTrack <span className="footer-separator">/</span> Your career, in progress.</span>
            <span><span className="connection-dot" /> Connected to your workspace</span>
          </footer>
        </div>
      </main>

      {modalOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setModalOpen(false);
            }
          }}
        >
          <section
            className="application-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="modal-header">
              <div>
                <div className="section-kicker">
                  {editingId ? "UPDATE YOUR PIPELINE" : "NEW OPPORTUNITY"}
                </div>
                <h2 id="modal-title">
                  {editingId ? "Edit application" : "Add an application"}
                </h2>
                <p>Keep the details handy. You can update them any time.</p>
              </div>
              <button
                className="icon-button modal-close"
                onClick={() => setModalOpen(false)}
                disabled={saving}
                aria-label="Close dialog"
              >
                <X size={19} />
              </button>
            </div>

            <form className="application-form" onSubmit={handleSubmit}>
              <div className="form-grid">
                <label className="form-field">
                  <span>Company name <span className="required">*</span></span>
                  <input
                    name="company"
                    value={form.company}
                    onChange={updateField}
                    placeholder="e.g. Stripe"
                    maxLength={100}
                    required
                    autoFocus
                  />
                </label>

                <label className="form-field">
                  <span>Job title <span className="required">*</span></span>
                  <input
                    name="position"
                    value={form.position}
                    onChange={updateField}
                    placeholder="e.g. Software Engineer"
                    maxLength={100}
                    required
                  />
                </label>

                <label className="form-field">
                  <span>Location</span>
                  <input
                    name="location"
                    value={form.location}
                    onChange={updateField}
                    placeholder="e.g. Remote, Bengaluru"
                    maxLength={100}
                  />
                </label>

                <label className="form-field">
                  <span>Current status</span>
                  <select
                    name="status"
                    value={form.status}
                    onChange={updateField}
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="form-field">
                  <span>Application date</span>
                  <input
                    type="date"
                    name="appliedAt"
                    value={form.appliedAt}
                    onChange={updateField}
                  />
                </label>

                <label className="form-field">
                  <span>Follow-up date</span>
                  <input
                    type="date"
                    name="followUpAt"
                    value={form.followUpAt}
                    onChange={updateField}
                  />
                </label>

                <label className="form-field form-field-full">
                  <span>Job posting URL</span>
                  <input
                    type="url"
                    name="jobUrl"
                    value={form.jobUrl}
                    onChange={updateField}
                    placeholder="https://company.com/careers/role"
                    maxLength={2048}
                  />
                </label>

                <label className="form-field form-field-full">
                  <span>Notes</span>
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={updateField}
                    placeholder="Recruiter details, interview prep, or next steps..."
                    rows={3}
                    maxLength={2000}
                  />
                </label>
              </div>

              {formError && (
                <div className="form-error" role="alert">
                  {formError}
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  disabled={saving}
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <LoaderCircle className="spinner" size={17} />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={17} />
                      {editingId ? "Save changes" : "Save application"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;