"use client";

import { useState } from "react";
import { ProfileRecord } from "@/types/profile";
import { VastSessionUser } from "@/types/user";
import styles from "./ProfileForm.module.css";
import { Check, Edit3, Plus, Trash2 } from "lucide-react";

const STANDARD_LABELS = [
  "Date of Birth",
  "Gender",
  "Occupation",
  "Education",
  "Qualification",
  "College",
  "Company",
  "Location",
  "Native Place",
  "Languages",
  "Interests",
  "Family Background",
  "Personal Description",
  "Other — Add custom label",
];

const CUSTOM_OPTION_KEY = "Other — Add custom label";

interface DetailRowState {
  id: string;
  label: string;
  isCustom: boolean;
  customLabel: string;
  value: string;
  isLocked: boolean;
  error?: string;
}

interface ProfileFormProps {
  initialProfile?: ProfileRecord | null;
  currentUser: VastSessionUser;
  isAdminCreatingForOther?: boolean;
  onSuccess?: (profile: ProfileRecord) => void;
  onDeleteSuccess?: () => void;
}

export function ProfileForm({
  initialProfile,
  currentUser,
  isAdminCreatingForOther = false,
  onSuccess,
  onDeleteSuccess,
}: ProfileFormProps) {
  const [profile, setProfile] = useState<ProfileRecord | null>(initialProfile || null);
  const [name, setName] = useState(initialProfile?.name || "");
  const [nameError, setNameError] = useState("");

  // Map initial details to row states (all initial details start in locked state)
  const [details, setDetails] = useState<DetailRowState[]>(() => {
    if (!initialProfile?.details?.length) return [];
    return initialProfile.details.map((d) => ({
      id: d.id,
      label: d.label,
      isCustom: !STANDARD_LABELS.includes(d.label) || d.label === CUSTOM_OPTION_KEY,
      customLabel: !STANDARD_LABELS.includes(d.label) ? d.label : "",
      value: d.value,
      isLocked: true,
    }));
  });

  const [isSavedState, setIsSavedState] = useState<boolean>(Boolean(initialProfile));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Add another detail row
  const handleAddDetailRow = () => {
    setDetails((prev) => [
      ...prev,
      {
        id: "new-" + Math.random().toString(36).substring(2, 9),
        label: "",
        isCustom: false,
        customLabel: "",
        value: "",
        isLocked: false,
      },
    ]);
  };

  // Update a detail row's label selection
  const handleLabelSelect = (id: string, selectedValue: string) => {
    setDetails((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const isCustom = selectedValue === CUSTOM_OPTION_KEY;
        return {
          ...row,
          label: selectedValue,
          isCustom,
          customLabel: isCustom ? row.customLabel : "",
          error: undefined,
        };
      })
    );
  };

  // Update custom label text
  const handleCustomLabelChange = (id: string, text: string) => {
    setDetails((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        return { ...row, customLabel: text, error: undefined };
      })
    );
  };

  // Update detail value text
  const handleValueChange = (id: string, text: string) => {
    setDetails((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        return { ...row, value: text, error: undefined };
      })
    );
  };

  // Lock individual detail row (tick/save button)
  const handleLockRow = (id: string) => {
    setDetails((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const effectiveLabel = row.isCustom ? row.customLabel.trim() : row.label.trim();
        if (!effectiveLabel) {
          return { ...row, error: "Please choose or enter a label." };
        }
        if (!row.value.trim()) {
          return { ...row, error: "Please enter a value for this detail." };
        }
        return { ...row, isLocked: true, error: undefined };
      })
    );
  };

  // Remove a detail row
  const handleRemoveRow = (id: string) => {
    setDetails((prev) => prev.filter((row) => row.id !== id));
  };

  // Final Form Submission
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError("");
    setErrorMessage("");
    setSuccessMessage("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError("Name is mandatory.");
      return;
    }

    // Prepare details: compile all rows
    const preparedDetails: Array<{ id?: string; label: string; value: string }> = [];
    for (const row of details) {
      const effectiveLabel = row.isCustom ? row.customLabel.trim() : row.label.trim();
      const effectiveValue = row.value.trim();

      // Skip completely empty unsaved rows
      if (!effectiveLabel && !effectiveValue) continue;

      if (!effectiveLabel) {
        setErrorMessage("Please select or specify a label for all entered details.");
        return;
      }
      if (!effectiveValue) {
        setErrorMessage(`Please enter a value for "${effectiveLabel}".`);
        return;
      }

      preparedDetails.push({
        id: row.id.startsWith("new-") ? undefined : row.id,
        label: effectiveLabel,
        value: effectiveValue,
      });
    }

    setIsSubmitting(true);
    try {
      let endpoint = "/api/profiles";
      let method = "POST";

      if (profile) {
        endpoint = `/api/profiles/${profile.profileId}`;
        method = "PUT";
      } else if (isAdminCreatingForOther) {
        endpoint = "/api/admin/profiles";
        method = "POST";
      }

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          details: preparedDetails,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save profile");
      }

      const savedProfile: ProfileRecord = data.profile;
      setProfile(savedProfile);
      setIsSavedState(true);
      setSuccessMessage("Profile saved successfully.");

      // Lock all detail rows in state
      setDetails(
        savedProfile.details.map((d) => ({
          id: d.id,
          label: d.label,
          isCustom: !STANDARD_LABELS.includes(d.label) || d.label === CUSTOM_OPTION_KEY,
          customLabel: !STANDARD_LABELS.includes(d.label) ? d.label : "",
          value: d.value,
          isLocked: true,
        }))
      );

      if (onSuccess) {
        onSuccess(savedProfile);
      }
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Confirmation
  const handleDeleteProfile = async () => {
    if (!profile) return;
    setIsDeleting(true);
    setErrorMessage("");

    try {
      const res = await fetch(`/api/profiles/${profile.profileId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete profile");
      }
      setShowDeleteModal(false);
      setProfile(null);
      setName("");
      setDetails([]);
      setIsSavedState(false);
      setSuccessMessage("Profile has been deleted.");
      if (onDeleteSuccess) {
        onDeleteSuccess();
      }
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <div className={styles.formHeader}>
        <div className={styles.titleArea}>
          <h2 className={styles.title}>
            {profile ? (isSavedState ? "Profile Overview" : "Edit Profile") : "Create Bio-Data Profile"}
          </h2>
          <p className={styles.subtitle}>
            {profile
              ? `Profile ID: ${profile.profileId}`
              : "Enter candidate personal bio-data details below."}
          </p>
        </div>

        {profile && (
          <div className={styles.statusArea}>
            <span
              className={`${styles.badge} ${
                profile.status === "VERIFIED"
                  ? styles.badgeVerified
                  : profile.status === "IGNORED"
                  ? styles.badgeIgnored
                  : styles.badgePending
              }`}
            >
              {profile.status}
            </span>

            {profile.tags.includes("Verified by Admin") && (
              <span className={styles.tagVerified}>Verified by Admin</span>
            )}

            {profile.tags.includes("Added by Admin") && (
              <span className={styles.tagAdmin}>Added by Admin</span>
            )}
          </div>
        )}
      </div>

      {profile && (
        <div className={styles.metaInfo}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Profile ID:</span>
            <span>{profile.profileId}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Source:</span>
            <span>{profile.creationSource === "ADMIN" ? "Added by Admin" : "Match Seeker"}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Created:</span>
            <span>{new Date(profile.createdAt).toLocaleString()}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Last Updated:</span>
            <span>{new Date(profile.updatedAt).toLocaleString()}</span>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className={`${styles.alertBox} ${styles.alertError}`}>{errorMessage}</div>
      )}

      {successMessage && (
        <div className={`${styles.alertBox} ${styles.alertSuccess}`}>{successMessage}</div>
      )}

      <form onSubmit={handleSaveProfile}>
        {/* Name Field (Mandatory) */}
        <div className={styles.section}>
          <label className={styles.fieldLabel} htmlFor="profile-name">
            Candidate Name <span className={styles.required}>*</span>
          </label>
          <input
            id="profile-name"
            type="text"
            className={`${styles.input} ${isSavedState ? styles.inputDisabled : ""}`}
            placeholder="e.g. Yagnik Patel"
            value={name}
            disabled={isSavedState}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError("");
            }}
          />
          {nameError && <div className={styles.fieldError}>{nameError}</div>}
        </div>

        {/* Dynamic Bio-Data Details */}
        <div className={styles.section}>
          <label className={styles.fieldLabel}>Bio-Data Details</label>

          {details.length === 0 && isSavedState && (
            <p style={{ color: "var(--muted-foreground)", fontSize: "0.875rem" }}>
              No additional bio-data details added yet.
            </p>
          )}

          <div className={styles.detailsList}>
            {details.map((row) => {
              const isRowDisabled = isSavedState || row.isLocked;
              const hasSelectedLabel = Boolean(row.isCustom ? row.customLabel.trim() : row.label);

              return (
                <div
                  key={row.id}
                  className={`${styles.detailRow} ${row.isLocked ? styles.detailRowSaved : ""}`}
                >
                  {/* Label selector or custom label input */}
                  {row.isCustom ? (
                    <input
                      type="text"
                      className={styles.detailLabelInput}
                      placeholder="Custom label (e.g. Diet, Hobbies)"
                      value={row.customLabel}
                      disabled={isRowDisabled}
                      onChange={(e) => handleCustomLabelChange(row.id, e.target.value)}
                    />
                  ) : (
                    <select
                      className={styles.detailLabelSelect}
                      value={row.label}
                      disabled={isRowDisabled}
                      onChange={(e) => handleLabelSelect(row.id, e.target.value)}
                    >
                      <option value="" disabled>
                        Select a detail label...
                      </option>
                      {STANDARD_LABELS.map((lbl) => (
                        <option key={lbl} value={lbl}>
                          {lbl}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Value Input (Disabled until label selected) */}
                  <input
                    type="text"
                    className={styles.detailValueInput}
                    placeholder={
                      hasSelectedLabel
                        ? `Enter ${row.isCustom ? row.customLabel || "value" : row.label}`
                        : "Select a label first..."
                    }
                    value={row.value}
                    disabled={isRowDisabled || !hasSelectedLabel}
                    onChange={(e) => handleValueChange(row.id, e.target.value)}
                  />

                  {/* Row Actions */}
                  <div className={styles.rowActions}>
                    {!isSavedState && !row.isLocked && (
                      <button
                        type="button"
                        className={styles.tickButton}
                        title="Lock and save this detail row"
                        onClick={() => handleLockRow(row.id)}
                        disabled={!hasSelectedLabel || !row.value.trim()}
                      >
                        <Check size={16} />
                      </button>
                    )}

                    {!isSavedState && (
                      <button
                        type="button"
                        className={styles.removeButton}
                        title="Remove detail row"
                        onClick={() => handleRemoveRow(row.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  {row.error && <div className={styles.fieldError}>{row.error}</div>}
                </div>
              );
            })}
          </div>

          {!isSavedState && (
            <button
              type="button"
              className={styles.addDetailButton}
              onClick={handleAddDetailRow}
            >
              <Plus size={16} /> Add another detail
            </button>
          )}
        </div>

        {/* Form Footer */}
        <div className={styles.formFooter}>
          {isSavedState ? (
            <>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => {
                  setIsSavedState(false);
                  setSuccessMessage("");
                }}
              >
                <Edit3 size={16} /> Edit Profile
              </button>

              <button
                type="button"
                className={styles.deleteOption}
                onClick={() => setShowDeleteModal(true)}
              >
                <Trash2 size={16} /> Delete Profile
              </button>
            </>
          ) : (
            <>
              <button
                type="submit"
                className={styles.primaryButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Profile"}
              </button>

              {profile && (
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => setIsSavedState(true)}
                >
                  Cancel
                </button>
              )}
            </>
          )}
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>Confirm Profile Deletion</h3>
            <p className={styles.modalBody}>
              Are you sure you want to delete profile{" "}
              <strong>{profile?.profileId}</strong> ({profile?.name})? This will archive the
              profile and mark it as deleted.
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.dangerButton}
                disabled={isDeleting}
                onClick={handleDeleteProfile}
              >
                {isDeleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
