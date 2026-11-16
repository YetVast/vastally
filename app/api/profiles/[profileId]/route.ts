import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { profileService } from "@/services/profile.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { profileId } = await params;
  try {
    const profile = await profileService.getProfileById(profileId, user);
    return NextResponse.json({ profile }, { status: 200 });
  } catch (error) {
    const status = (error as { status?: number }).status || 500;
    return NextResponse.json({ error: (error as Error).message }, { status });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { profileId } = await params;
  try {
    const body = await request.json();
    const profile = await profileService.updateProfile(profileId, user, body);
    return NextResponse.json({ profile }, { status: 200 });
  } catch (error) {
    const status = (error as { status?: number }).status || 500;
    return NextResponse.json({ error: (error as Error).message }, { status });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { profileId } = await params;
  try {
    await profileService.deleteProfile(profileId, user);
    return NextResponse.json({ success: true, message: "Profile deleted successfully" }, { status: 200 });
  } catch (error) {
    const status = (error as { status?: number }).status || 500;
    return NextResponse.json({ error: (error as Error).message }, { status });
  }
}
