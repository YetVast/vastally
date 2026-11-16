import { getSessionUser } from "@/lib/auth/session";
import { profileService } from "@/services/profile.service";
import { ProfileForm } from "@/components/profile/ProfileForm";
import Link from "next/link";
import { AlertCircle, ShieldAlert, Sparkles, UserCheck } from "lucide-react";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ auth_error?: string }>;
}) {
  const user = await getSessionUser();
  const { auth_error } = await searchParams;

  let initialProfile = null;
  if (user) {
    initialProfile = await profileService.getOwnProfile(user);
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      {auth_error && (
        <div
          style={{
            padding: "1rem",
            backgroundColor: "rgba(198, 40, 40, 0.1)",
            border: "1px solid var(--destructive)",
            borderRadius: "var(--radius-md)",
            color: "var(--destructive)",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.9rem",
          }}
        >
          <AlertCircle size={18} />
          <span>{auth_error}</span>
        </div>
      )}

      {!user ? (
        <div
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            padding: "3rem 2rem",
            textAlign: "center",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              backgroundColor: "var(--secondary)",
              color: "var(--primary)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem auto",
            }}
          >
            <Sparkles size={28} />
          </div>

          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              margin: "0 0 0.75rem 0",
              color: "var(--foreground)",
            }}
          >
            Welcome to VastAlliance
          </h1>
          <p
            style={{
              fontSize: "1.05rem",
              color: "var(--muted-foreground)",
              maxWidth: "520px",
              margin: "0 auto 2rem auto",
              lineHeight: 1.6,
            }}
          >
            A personal bio-data profile platform under the Yet Vast Solutions umbrella.
            Create your comprehensive, flexible text bio-data profile with verified Yet Vast identity.
          </p>

          <a
            href="/api/auth/signin"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.85rem 1.75rem",
              backgroundColor: "var(--primary)",
              color: "var(--primary-foreground)",
              borderRadius: "var(--radius-md)",
              fontSize: "1rem",
              fontWeight: 600,
              textDecoration: "none",
              boxShadow: "var(--shadow-sm)",
              transition: "opacity 0.15s ease",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Sign in with Google via Yet Vast
          </a>

          <div
            style={{
              marginTop: "2.5rem",
              paddingTop: "1.5rem",
              borderTop: "1px solid var(--border)",
              fontSize: "0.825rem",
              color: "var(--muted-foreground)",
            }}
          >
            Google OAuth authentication is powered centrally by{" "}
            <strong>Yet Vast Auth</strong> (auth.yetvast.com).
          </div>
        </div>
      ) : (
        <div>
          {user.role === "ADMIN" && (
            <div
              style={{
                backgroundColor: "var(--secondary)",
                border: "1px solid var(--brand-border)",
                borderRadius: "var(--radius-md)",
                padding: "0.85rem 1.25rem",
                marginBottom: "1.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "0.75rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <UserCheck size={18} color="var(--primary)" />
                <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                  Logged in as Administrator (<strong>{user.yvUserId}</strong>)
                </span>
              </div>
              <Link
                href="/adminDahsboard"
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "var(--primary)",
                  textDecoration: "underline",
                }}
              >
                Go to Admin Dashboard →
              </Link>
            </div>
          )}

          <ProfileForm
            currentUser={user}
            initialProfile={initialProfile}
          />
        </div>
      )}
    </div>
  );
}
