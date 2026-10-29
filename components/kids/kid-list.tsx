"use client";

import { useMemo, useState } from "react";
import { KidCard } from "@/components/kids/kid-card";
import { SectionDivider } from "@/components/shared/section-divider";
import { kids } from "@/lib/kids-data";

function SearchIcon() {
  return (
    <svg
      className="flex-none"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#B0A290"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function countLabel(count: number): string {
  return `${count} ${count === 1 ? "niño" : "niños"}`;
}

export function KidList() {
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase();
  const filteredKids = useMemo(
    () =>
      kids.filter((kid) => kid.name.toLowerCase().includes(normalizedQuery)),
    [normalizedQuery],
  );

  return (
    <>
      <div className="mb-5.5 flex items-center gap-2.75 rounded-[14px] border border-line bg-panel px-4 py-3">
        <SearchIcon />
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar niño…"
          className="min-w-0 flex-1 border-0 bg-transparent text-[15px] text-ink outline-none"
        />
      </div>

      <SectionDivider
        label="SALA SOLES"
        count={countLabel(filteredKids.length)}
      />

      {filteredKids.length === 0 ? (
        <div className="rounded-[18px] border border-line bg-panel py-10 text-center text-[15px] text-muted">
          {`Sin resultados para “${query.trim()}”`}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
          {filteredKids.map((kid) => (
            <KidCard key={kid.id} kid={kid} />
          ))}
        </div>
      )}
    </>
  );
}
