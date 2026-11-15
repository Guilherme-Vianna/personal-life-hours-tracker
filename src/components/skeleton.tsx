export function PageSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy aria-label="Carregando">
      <div className="skeleton h-10 w-72 max-w-full rounded-xl" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-28 rounded-2xl" />
        ))}
      </div>
      <div className="skeleton h-64 rounded-2xl" />
    </div>
  );
}
