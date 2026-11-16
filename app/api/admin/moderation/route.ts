import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { moderationService } from "@/services/moderation.service";
import { ProfileStatus } from "@/types/profile";

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { profileId, action, reason, newStatus } = body;

    if (!profileId || !action) {
      return NextResponse.json({ error: "profileId and action are required." }, { status: 400 });
    }

    let updated;
    if (action === "VERIFY") {
      updated = await moderationService.verifyProfile(profileId, user, reason);
    } else if (action === "IGNORE") {
      updated = await moderationService.ignoreProfile(profileId, user, reason);
    } else if (action === "STATUS_CHANGE") {
      if (!newStatus || !["PENDING", "VERIFIED", "IGNORED"].includes(newStatus)) {
        return NextResponse.json({ error: "Valid newStatus is required for STATUS_CHANGE." }, { status: 400 });
      }
      updated = await moderationService.changeStatus(profileId, user, newStatus as ProfileStatus, reason);
    } else {
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    return NextResponse.json({ profile: updated }, { status: 200 });
  } catch (error) {
    const status = (error as { status?: number }).status || 500;
    return NextResponse.json({ error: (error as Error).message }, { status });
  }
}
