import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { profileService } from "@/services/profile.service";
import { CreationSource, ProfileStatus } from "@/types/profile";

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = (searchParams.get("status") || undefined) as ProfileStatus | undefined;
  const creationSource = (searchParams.get("creationSource") || undefined) as CreationSource | undefined;
  const search = searchParams.get("search") || undefined;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);

  try {
    const result = await profileService.listProfiles(user, {
      status,
      creationSource,
      search,
      page,
      limit,
    });
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const errStatus = (error as { status?: number }).status || 500;
    return NextResponse.json({ error: (error as Error).message }, { status: errStatus });
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
    const errStatus = (error as { status?: number }).status || 500;
    return NextResponse.json({ error: (error as Error).message }, { status: errStatus });
  }
}
