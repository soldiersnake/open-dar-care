// Loading state of /kids: Suspense fallback while the server reads the
// real rooms + children from the database (SPEC 12).
export function KidsLoading() {
  return (
    <div className="flex items-center justify-center gap-3 rounded-[18px] border border-line bg-panel py-16">
      <span
        aria-hidden="true"
        className="size-5 inline-block animate-spin rounded-full border-[2.5px] border-[#EADFD0] border-t-[#EE8164]"
      />
      <span className="text-[15px] font-bold text-muted-soft">
        Cargando niños…
      </span>
    </div>
  );
}
