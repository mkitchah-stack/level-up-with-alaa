import { NextResponse, type NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

// POST only (a GET link could be triggered by prefetch or a malicious <img>).
export async function POST(request: NextRequest) {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL('/', request.url), { status: 303 });
}
