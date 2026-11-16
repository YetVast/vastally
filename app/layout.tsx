import type { Metadata } from "next";
import "@/lib/tokens/tokens.css";
import { Navbar } from "@/components/layout/Navbar";
import { getSessionUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "VastAlliance — Yet Vast Solutions",
  description: "Personal bio-data profile management and administration platform for Yet Vast Solutions",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: "var(--background)",
          color: "var(--foreground)",
          fontFamily: "var(--font-sans)",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Navbar user={user} />
        <main style={{ flex: 1, padding: "2rem 1.5rem" }}>{children}</main>
        <footer
          style={{
            borderTop: "1px solid var(--border)",
            padding: "1.5rem",
            textAlign: "center",
            fontSize: "0.8rem",
            color: "var(--muted-foreground)",
            backgroundColor: "var(--card)",
          }}
        >
          &copy; 2026 Yet Vast Solutions. VastAlliance V0.
        </footer>
      </body>
    </html>
  );
}
