import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { profileService } from "@/services/profile.service";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const stats = await profileService.getAdminStats(user);
    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    const status = (error as { status?: number }).status || 500;
    return NextResponse.json({ error: (error as Error).message }, { status });
  }
}
