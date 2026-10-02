// Turns an admin-entered https link into a safe embed URL (or null → plain link).
export function safeHttpsUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw.trim());
    return u.protocol === 'https:' ? u.toString() : null;
  } catch {
    return null;
  }
}

export function youtubeId(raw: string): string | null {
  try {
    const u = new URL(raw);
    const host = u.hostname.replace(/^www\.|^m\./, '');
    if (host === 'youtu.be') return u.pathname.slice(1).split('/')[0] || null;
    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      if (u.pathname === '/watch') return u.searchParams.get('v');
      const m = u.pathname.match(/^\/(embed|shorts|live)\/([\w-]{6,})/);
      if (m) return m[2];
    }
  } catch {}
  return null;
}

export function embedUrl(raw: string | null | undefined): string | null {
  const url = safeHttpsUrl(raw);
  if (!url) return null;
  const yt = youtubeId(url);
  if (yt && /^[\w-]{6,20}$/.test(yt)) return `https://www.youtube-nocookie.com/embed/${yt}?rel=0`;
  try {
    const u = new URL(url);
    if (u.hostname.endsWith('vimeo.com')) {
      const id = u.pathname.split('/').filter(Boolean).pop();
      if (id && /^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`;
    }
    if (u.hostname === 'drive.google.com') {
      const m = u.pathname.match(/\/file\/d\/([\w-]+)/);
      if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
    }
  } catch {}
  return null;
}

export function thumbnailFor(videoUrl: string | null, thumb: string | null): string | null {
  const t = safeHttpsUrl(thumb);
  if (t) return t;
  const url = safeHttpsUrl(videoUrl);
  const yt = url ? youtubeId(url) : null;
  return yt ? `https://i.ytimg.com/vi/${yt}/hqdefault.jpg` : null;
}
