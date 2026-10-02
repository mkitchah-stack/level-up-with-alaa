export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="جارٍ التحميل">
      <div className="h-36 animate-pulse rounded-card bg-forest/20" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-card bg-sand" />)}</div>
    </div>
  );
}
