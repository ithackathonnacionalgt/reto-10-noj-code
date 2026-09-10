export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="h-8 w-56 animate-pulse rounded bg-slate-200" />
      <div className="mt-5 h-11 w-full animate-pulse rounded-lg bg-slate-200" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="hidden h-96 animate-pulse rounded-xl bg-slate-200 lg:block" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-56 animate-pulse rounded-xl bg-slate-200"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
