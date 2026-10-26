export function PageSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-4" aria-busy aria-label="Carregando">
      <div className="h-10 w-72 rounded-xl bg-brand-100/60" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-brand-100/60" />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-brand-100/60" />
    </div>
  );
}
