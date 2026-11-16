"use client";

import { useEffect, useState, useCallback } from "react";
import { AdminStats, CreationSource, ProfileRecord, ProfileStatus } from "@/types/profile";
import { VastSessionUser } from "@/types/user";
import { ProfileForm } from "@/components/profile/ProfileForm";
import styles from "./AdminDashboard.module.css";
import {
  CheckCircle,
  Clock,
  Edit2,
  Eye,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Trash2,
  XCircle,
} from "lucide-react";

interface AdminDashboardProps {
  currentUser: VastSessionUser;
  initialStats?: AdminStats | null;
}

export function AdminDashboard({ currentUser, initialStats }: AdminDashboardProps) {
  const [stats, setStats] = useState<AdminStats | null>(initialStats || null);
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters & Pagination State
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [sourceFilter, setSourceFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<ProfileRecord | null>(null);
  const [viewingProfile, setViewingProfile] = useState<ProfileRecord | null>(null);
  const [moderatingProfile, setModeratingProfile] = useState<ProfileRecord | null>(null);

  // Moderation form state
  const [modTargetStatus, setModTargetStatus] = useState<ProfileStatus>("VERIFIED");
  const [modReason, setModReason] = useState("");
  const [isSubmittingMod, setIsSubmittingMod] = useState(false);

  // Fetch Dashboard Stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to load admin stats:", err);
    }
  }, []);

  // Fetch Profiles with filters & pagination
  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (sourceFilter) params.set("creationSource", sourceFilter);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      params.set("page", page.toString());
      params.set("limit", "10");

      const res = await fetch(`/api/admin/profiles?${params.toString()}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to load profiles");
      }

      const data = await res.json();
      setProfiles(data.profiles || []);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.total || 0);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, sourceFilter, searchQuery, page]);

  useEffect(() => {
    fetchStats();
    fetchProfiles();
  }, [fetchStats, fetchProfiles]);

  // Handle Quick Moderation (Verify or Ignore)
  const handleQuickModerate = async (profileId: string, action: "VERIFY" | "IGNORE") => {
    try {
      const res = await fetch("/api/admin/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, action }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Moderation action failed");
      }
      fetchStats();
      fetchProfiles();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  // Submit Detailed Moderation Modal
  const handleSubmitModeration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moderatingProfile) return;

    setIsSubmittingMod(true);
    try {
      const res = await fetch("/api/admin/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: moderatingProfile.profileId,
          action: "STATUS_CHANGE",
          newStatus: modTargetStatus,
          reason: modReason.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Status update failed");
      }

      setModeratingProfile(null);
      setModReason("");
      fetchStats();
      fetchProfiles();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsSubmittingMod(false);
    }
  };

  // Handle Profile Deletion
  const handleDelete = async (profile: ProfileRecord) => {
    if (!confirm(`Are you sure you want to delete profile ${profile.profileId} (${profile.name})?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/profiles/${profile.profileId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete profile");
      }
      fetchStats();
      fetchProfiles();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* Header Area */}
      <div className={styles.headerArea}>
        <div className={styles.titleArea}>
          <h1>Admin Moderation Dashboard</h1>
          <p>Review, verify, manage, and moderate all candidate bio-data profiles across VastAlliance.</p>
        </div>

        <button
          className={styles.addProfileButton}
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={18} /> Add Profile (Admin)
        </button>
      </div>

      {/* Overview Stats Cards */}
      {stats && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{stats.totalProfiles}</span>
            <span className={styles.statLabel}>Total Profiles</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue} style={{ color: "var(--warning)" }}>
              {stats.pendingProfiles}
            </span>
            <span className={styles.statLabel}>Pending Review</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue} style={{ color: "var(--success)" }}>
              {stats.verifiedProfiles}
            </span>
            <span className={styles.statLabel}>Verified</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue} style={{ color: "var(--destructive)" }}>
              {stats.ignoredProfiles}
            </span>
            <span className={styles.statLabel}>Ignored</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue} style={{ color: "var(--primary)" }}>
              {stats.addedByAdmin}
            </span>
            <span className={styles.statLabel}>Added by Admin</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>
              {stats.addedBySeeker}
            </span>
            <span className={styles.statLabel}>Match Seekers</span>
          </div>
        </div>
      )}

      {/* Filters and Search Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={18} color="var(--muted-foreground)" />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by candidate name or profile ID..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className={styles.filterGroup}>
          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="VERIFIED">Verified</option>
            <option value="IGNORED">Ignored</option>
          </select>

          <select
            className={styles.filterSelect}
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Creation Sources</option>
            <option value="ADMIN">Added by Admin</option>
            <option value="MATCH_SEEKER">Added by Match Seeker</option>
          </select>

          <button
            className={styles.iconBtn}
            title="Refresh list"
            onClick={() => {
              fetchStats();
              fetchProfiles();
            }}
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {error && (
        <div style={{ color: "var(--destructive)", padding: "1rem", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      {/* Profiles Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Profile ID</th>
              <th>Name</th>
              <th>Source</th>
              <th>Created</th>
              <th>Status</th>
              <th>Tags</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "2rem" }}>
                  Loading profiles...
                </td>
              </tr>
            ) : profiles.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "2.5rem" }}>
                  No profiles found matching your criteria.
                </td>
              </tr>
            ) : (
              profiles.map((p) => (
                <tr key={p.profileId}>
                  <td>
                    <span className={styles.profileIdText}>{p.profileId}</span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td>
                    <span style={{ fontSize: "0.8rem", color: "var(--muted-foreground)" }}>
                      {p.creationSource === "ADMIN" ? "Admin" : "Seeker"}
                    </span>
                  </td>
                  <td style={{ fontSize: "0.8rem" }}>
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        p.status === "VERIFIED"
                          ? styles.badgeVerified
                          : p.status === "IGNORED"
                          ? styles.badgeIgnored
                          : styles.badgePending
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td>
                    <div className={styles.tagsCell}>
                      {p.tags.includes("Verified by Admin") && (
                        <span className={`${styles.tagPill} ${styles.tagVerified}`}>
                          Verified
                        </span>
                      )}
                      {p.tags.includes("Added by Admin") && (
                        <span className={`${styles.tagPill} ${styles.tagAdmin}`}>
                          Admin
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className={styles.actionButtons}>
                      {/* View Details */}
                      <button
                        className={styles.iconBtn}
                        title="View Full Profile"
                        onClick={() => setViewingProfile(p)}
                      >
                        <Eye size={15} />
                      </button>

                      {/* Edit Profile */}
                      <button
                        className={styles.iconBtn}
                        title="Edit Profile"
                        onClick={() => setEditingProfile(p)}
                      >
                        <Edit2 size={15} />
                      </button>

                      {/* Quick Verify */}
                      {p.status !== "VERIFIED" && (
                        <button
                          className={`${styles.iconBtn} ${styles.iconBtnVerify}`}
                          title="Verify Profile"
                          onClick={() => handleQuickModerate(p.profileId, "VERIFY")}
                        >
                          <CheckCircle size={15} />
                        </button>
                      )}

                      {/* Quick Ignore */}
                      {p.status !== "IGNORED" && (
                        <button
                          className={`${styles.iconBtn} ${styles.iconBtnIgnore}`}
                          title="Ignore Profile"
                          onClick={() => handleQuickModerate(p.profileId, "IGNORE")}
                        >
                          <XCircle size={15} />
                        </button>
                      )}

                      {/* Detailed Moderation / Change Status */}
                      <button
                        className={styles.iconBtn}
                        title="Moderation Controls & Audit History"
                        onClick={() => {
                          setModeratingProfile(p);
                          setModTargetStatus(p.status);
                          setModReason("");
                        }}
                      >
                        <SlidersHorizontal size={15} />
                      </button>

                      {/* Delete */}
                      <button
                        className={styles.iconBtn}
                        title="Delete Profile"
                        onClick={() => handleDelete(p)}
                      >
                        <Trash2 size={15} color="var(--destructive)" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className={styles.pagination}>
        <span className={styles.pageInfo}>
          Showing {profiles.length} of {totalCount} profiles (Page {page} of {totalPages})
        </span>

        <div className={styles.pageControls}>
          <button
            className={styles.pageBtn}
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <button
            className={styles.pageBtn}
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      </div>

      {/* Add Profile Modal */}
      {showAddModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: "800px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 className={styles.modalTitle}>Add Profile as Admin</h2>
              <button
                className={styles.secondaryBtn}
                style={{ padding: "0.3rem 0.6rem" }}
                onClick={() => setShowAddModal(false)}
              >
                Close
              </button>
            </div>
            <ProfileForm
              currentUser={currentUser}
              isAdminCreatingForOther={true}
              onSuccess={() => {
                setShowAddModal(false);
                fetchStats();
                fetchProfiles();
              }}
            />
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {editingProfile && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: "800px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 className={styles.modalTitle}>Edit Profile: {editingProfile.profileId}</h2>
              <button
                className={styles.secondaryBtn}
                style={{ padding: "0.3rem 0.6rem" }}
                onClick={() => setEditingProfile(null)}
              >
                Close
              </button>
            </div>
            <ProfileForm
              initialProfile={editingProfile}
              currentUser={currentUser}
              onSuccess={() => {
                setEditingProfile(null);
                fetchStats();
                fetchProfiles();
              }}
              onDeleteSuccess={() => {
                setEditingProfile(null);
                fetchStats();
                fetchProfiles();
              }}
            />
          </div>
        </div>
      )}

      {/* View Profile Read-Only Modal */}
      {viewingProfile && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>{viewingProfile.name}</h2>
            <p className={styles.modalSubtitle}>Profile ID: {viewingProfile.profileId}</p>

            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
              <span
                className={`${styles.badge} ${
                  viewingProfile.status === "VERIFIED"
                    ? styles.badgeVerified
                    : viewingProfile.status === "IGNORED"
                    ? styles.badgeIgnored
                    : styles.badgePending
                }`}
              >
                {viewingProfile.status}
              </span>
              {viewingProfile.tags.map((t) => (
                <span key={t} className={`${styles.tagPill} ${styles.tagAdmin}`}>
                  {t}
                </span>
              ))}
            </div>

            <h4 style={{ margin: "1rem 0 0.5rem 0", fontSize: "0.95rem" }}>Bio-Data Details</h4>
            {viewingProfile.details.length === 0 ? (
              <p style={{ color: "var(--muted-foreground)", fontSize: "0.85rem" }}>No details entered.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
                {viewingProfile.details.map((d) => (
                  <div
                    key={d.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "0.5rem 0.75rem",
                      backgroundColor: "var(--secondary)",
                      borderRadius: "var(--radius-sm)",
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{d.label}:</span>
                    <span style={{ fontSize: "0.85rem" }}>{d.value}</span>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.modalActions}>
              <button className={styles.secondaryBtn} onClick={() => setViewingProfile(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Moderation / Audit Modal */}
      {moderatingProfile && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>Moderate Profile</h2>
            <p className={styles.modalSubtitle}>
              Candidate: <strong>{moderatingProfile.name}</strong> ({moderatingProfile.profileId})
            </p>

            <form onSubmit={handleSubmitModeration}>
              <div className={styles.modalFormGroup}>
                <label className={styles.modalLabel}>Change Moderation Status</label>
                <select
                  className={styles.modalSelect}
                  value={modTargetStatus}
                  onChange={(e) => setModTargetStatus(e.target.value as ProfileStatus)}
                >
                  <option value="PENDING">PENDING</option>
                  <option value="VERIFIED">VERIFIED (Sets &ldquo;Verified by Admin&rdquo; tag)</option>
                  <option value="IGNORED">IGNORED (Removes &ldquo;Verified by Admin&rdquo; tag)</option>
                </select>
              </div>

              <div className={styles.modalFormGroup}>
                <label className={styles.modalLabel}>Reason / Audit Note (Optional)</label>
                <textarea
                  className={styles.modalTextarea}
                  placeholder="Explain why this status was changed or verified..."
                  value={modReason}
                  onChange={(e) => setModReason(e.target.value)}
                />
              </div>

              {/* Moderation Audit History */}
              <div className={styles.auditHistoryArea}>
                <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.9rem" }}>Moderation Audit Trail</h4>
                {moderatingProfile.moderationHistory.length === 0 ? (
                  <p style={{ fontSize: "0.8rem", color: "var(--muted-foreground)", margin: 0 }}>
                    No prior moderation actions recorded.
                  </p>
                ) : (
                  <div>
                    {moderatingProfile.moderationHistory.map((item, idx) => (
                      <div key={idx} className={styles.auditItem}>
                        <div className={styles.auditMeta}>
                          <span>
                            {item.action}: {item.fromStatus} → {item.toStatus}
                          </span>
                          <span style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
                            {new Date(item.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div>
                          by <strong>{item.actorDisplayName || item.actorId}</strong>
                        </div>
                        {item.reason && (
                          <div style={{ marginTop: "0.2rem", fontStyle: "italic" }}>
                            &ldquo;{item.reason}&rdquo;
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  disabled={isSubmittingMod}
                  onClick={() => setModeratingProfile(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.primaryBtn}
                  disabled={isSubmittingMod}
                >
                  {isSubmittingMod ? "Updating..." : "Save Status"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
