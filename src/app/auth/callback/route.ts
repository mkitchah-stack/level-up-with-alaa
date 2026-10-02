import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { supabaseServer } from '@/lib/supabase/server';
import { safeNext } from '@/lib/authErrors';

// Handles both Supabase email-link styles: ?code=... (PKCE) and ?token_hash=...&type=...
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const next = safeNext(url.searchParams.get('next'), '/dashboard');
  const code = url.searchParams.get('code');
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as EmailOtpType | null;
  const supabase = await supabaseServer();

  let ok = false;
  if (code) ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  else if (tokenHash && type) ok = !(await supabase.auth.verifyOtp({ token_hash: tokenHash, type })).error;

  const target = ok
    ? (type === 'recovery' ? '/reset-password' : next)
    : '/login?error=link';
  return NextResponse.redirect(new URL(target, url.origin));
}
