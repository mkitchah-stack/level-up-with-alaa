export function arAuthError(message: string | undefined | null): string {
  const m = (message || '').toLowerCase();
  if (m.includes('invalid login credentials')) return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
  if (m.includes('email not confirmed')) return 'يجب تأكيد بريدك الإلكتروني أولًا. افتح الرسالة التي أرسلناها لك.';
  if (m.includes('already registered') || m.includes('already been registered')) return 'هذا البريد مسجل مسبقًا. سجّل الدخول بدلًا من ذلك.';
  if (m.includes('password should be') || m.includes('weak')) return 'كلمة المرور ضعيفة. استخدم 8 أحرف على الأقل مع أرقام وحروف.';
  if (m.includes('rate limit') || m.includes('too many')) return 'محاولات كثيرة. انتظر قليلًا ثم أعد المحاولة.';
  if (m.includes('invalid email') || m.includes('unable to validate email')) return 'صيغة البريد الإلكتروني غير صحيحة.';
  if (m.includes('same password')) return 'كلمة المرور الجديدة مطابقة للقديمة.';
  if (m.includes('fetch') || m.includes('network')) return 'تعذر الاتصال بالخادم. تحقق من الإنترنت.';
  return 'حدث خطأ غير متوقع. أعد المحاولة.';
}

/** only allow same-site relative redirects (prevents open redirect via ?next=) */
export function safeNext(next: string | null | undefined, fallback = '/dashboard') {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback;
  return next;
}
