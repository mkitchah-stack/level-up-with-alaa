import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const PROTECTED = ['/dashboard', '/today', '/days', '/progress', '/catch-up', '/reviews', '/resources', '/account', '/pending', '/admin'];
const AUTH_PAGES = ['/login', '/signup'];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // getUser() validates the JWT with Supabase Auth (do not trust getSession() on the server).
  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  const isProtected = PROTECTED.some((p) => path === p || path.startsWith(p + '/'));
  if (!user && isProtected) {
    const to = request.nextUrl.clone();
    to.pathname = '/login';
    to.search = `?next=${encodeURIComponent(path)}`;
    return NextResponse.redirect(to);
  }
  if (user && AUTH_PAGES.includes(path)) {
    const to = request.nextUrl.clone();
    to.pathname = '/dashboard';
    to.search = '';
    return NextResponse.redirect(to);
  }
  return response;
}
