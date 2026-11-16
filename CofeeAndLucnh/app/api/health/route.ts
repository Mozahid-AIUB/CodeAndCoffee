import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** Liveness + trivial DB query (also keeps the free Supabase project from pausing). */
export async function GET() {
  const { error } = await createAdminClient().from("app_settings").select("key").limit(1);
  if (error) return NextResponse.json({ ok: false }, { status: 503 });
  return NextResponse.json({ ok: true });
}
