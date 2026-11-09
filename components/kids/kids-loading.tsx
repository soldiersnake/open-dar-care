// Loading state of /kids and /kids/[id]: Suspense fallback while the server
// reads the real data from the database (SPEC 12/13).
export function KidsLoading({ label = "Cargando niños…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-[18px] border border-line bg-panel py-16">
      <span
        aria-hidden="true"
        className="size-5 inline-block animate-spin rounded-full border-[2.5px] border-[#EADFD0] border-t-[#EE8164]"
      />
      <span className="text-[15px] font-bold text-muted-soft">
        {label}
      </span>
    </div>
  );
}
