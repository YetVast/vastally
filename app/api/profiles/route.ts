import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { profileService } from "@/services/profile.service";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const profile = await profileService.getOwnProfile(user);
    return NextResponse.json({ profile }, { status: 200 });
  } catch (error) {
    const status = (error as { status?: number }).status || 500;
    return NextResponse.json({ error: (error as Error).message }, { status });
  }
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const profile = await profileService.createProfile(user, body);
    return NextResponse.json({ profile }, { status: 201 });
  } catch (error) {
    const status = (error as { status?: number }).status || 500;
    return NextResponse.json({ error: (error as Error).message }, { status });
  }
}
