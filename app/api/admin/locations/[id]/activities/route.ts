import { NextRequest, NextResponse } from "next/server";
import { getActivitiesByLocation } from "@/lib/supabase/activities";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const activities = await getActivitiesByLocation(id);
    return NextResponse.json(activities);
  } catch (error) {
    console.error("Error fetching location activities:", error);
    return NextResponse.json(
      { error: "Failed to fetch activities" },
      { status: 500 }
    );
  }
}

