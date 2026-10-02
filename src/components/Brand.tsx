import Link from 'next/link';

export function Brand({ light = false, href = '/' }: { light?: boolean; href?: string }) {
  return (
    <Link href={href} className="inline-flex flex-col leading-none ltr" aria-label="LEVEL UP WITH ALAA — BAC 2027">
      <span className={`font-display text-[17px] font-bold tracking-[0.06em] ${light ? 'text-white' : 'text-forest'}`}>LEVEL UP WITH ALAA</span>
      <span className="font-display text-[13px] font-bold text-gold">BAC 2027</span>
    </Link>
  );
}
