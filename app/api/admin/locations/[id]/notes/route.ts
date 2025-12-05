import { NextRequest, NextResponse } from "next/server";
import { getNotesByLocation } from "@/lib/supabase/notes";
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

    const notes = await getNotesByLocation(id, user.id);
    return NextResponse.json(notes);
  } catch (error) {
    console.error("Error fetching location notes:", error);
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 }
    );
  }
}

