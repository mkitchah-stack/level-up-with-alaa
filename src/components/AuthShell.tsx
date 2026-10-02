import { Brand } from '@/components/Brand';

export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col bg-cream">
      <div className="bg-forest px-5 pb-16 pt-6">
        <div className="mx-auto max-w-md"><Brand light /></div>
      </div>
      <div className="-mt-10 flex-1 px-4 pb-10">
        <div className="card mx-auto max-w-md p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-forest">{title}</h1>
          {subtitle && <p className="mt-1 text-[15px] text-ink-muted">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </main>
  );
}

export function FormMessage({ kind, children }: { kind: 'error' | 'ok'; children: React.ReactNode }) {
  return (
    <p role={kind === 'error' ? 'alert' : 'status'}
      className={`rounded-xl px-4 py-3 text-sm ${kind === 'error' ? 'bg-rose-pale text-rose' : 'bg-forest-mist text-forest'}`}>
      {children}
    </p>
  );
}
