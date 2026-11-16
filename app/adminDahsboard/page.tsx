import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { profileService } from "@/services/profile.service";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default async function AdminDashboardPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/?auth_error=Please+sign+in+to+access+the+admin+dashboard.");
  }

  if (user.role !== "ADMIN") {
    return (
      <div
        style={{
          maxWidth: "600px",
          margin: "4rem auto",
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "2.5rem",
          textAlign: "center",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            backgroundColor: "rgba(198, 40, 40, 0.12)",
            color: "var(--destructive)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.25rem auto",
          }}
        >
          <ShieldAlert size={28} />
        </div>

        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "var(--foreground)",
            margin: "0 0 0.5rem 0",
          }}
        >
          403 — Unauthorized Access
        </h1>
        <p
          style={{
            fontSize: "0.95rem",
            color: "var(--muted-foreground)",
            lineHeight: 1.6,
            marginBottom: "1.5rem",
          }}
        >
          Your account (<strong>{user.yvUserId}</strong>) is registered as a{" "}
          <strong>Match Seeker</strong>. The Admin Dashboard is restricted strictly to
          authorized administrators designated via the server configuration.
        </p>

        <Link
          href="/"
          style={{
            display: "inline-block",
            padding: "0.65rem 1.25rem",
            backgroundColor: "var(--primary)",
            color: "var(--primary-foreground)",
            borderRadius: "var(--radius-md)",
            fontSize: "0.9rem",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          ← Return to My Profile
        </Link>
      </div>
    );
  }

  const stats = await profileService.getAdminStats(user);

  return <AdminDashboard currentUser={user} initialStats={stats} />;
}
