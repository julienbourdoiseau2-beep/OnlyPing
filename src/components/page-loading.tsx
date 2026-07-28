export function PageLoading() {
  return (
    <section className="mx-auto flex max-w-7xl items-center justify-center gap-3 px-3 py-24 text-ink-muted sm:px-4">
      <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      <p className="text-sm">Chargement...</p>
    </section>
  );
}
