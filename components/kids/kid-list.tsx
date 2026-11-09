"use client";

import { useMemo, useState } from "react";
import { KidCard } from "@/components/kids/kid-card";
import { SectionDivider } from "@/components/shared/section-divider";
import { ROOMS, type Kid } from "@/lib/kids-data";

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

// Groups rendering their own divider per room (SPEC 02 separators, now over
// real DB rows): rooms follow the seed order and unlisted rooms append at the
// end sorted alphabetically.
function groupByRoom(kids: Kid[]): Array<[string, Kid[]]> {
  const groups = new Map<string, Kid[]>();
  for (const kid of kids) {
    const room = kid.room || "Sin sala";
    groups.set(room, [...(groups.get(room) ?? []), kid]);
  }
  const orderedRooms = [...ROOMS, ...[...groups.keys()]
    .filter((room) => !(ROOMS as readonly string[]).includes(room))
    .sort((a, b) => a.localeCompare(b))];
  return orderedRooms
    .flatMap((room): Array<[string, Kid[]]> => {
      const group = groups.get(room);
      return group ? [[room, group]] : [];
    });
}

export function KidList({ kids, navigable = true }: { kids: Kid[]; navigable?: boolean }) {
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase();
  const filteredKids = useMemo(
    () =>
      kids.filter((kid) => kid.name.toLowerCase().includes(normalizedQuery)),
    [kids, normalizedQuery],
  );
  const roomGroups = useMemo(() => groupByRoom(filteredKids), [filteredKids]);

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

      {roomGroups.map(([room, group]) => (
        <section key={room}>
          <SectionDivider
            label={`SALA ${room.toUpperCase()}`}
            count={countLabel(group.length)}
          />
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
            {group.map((kid) => (
              // In the real mode every card links to its own profile
              // (/kids/{uuid}); in the mock fallback the cards are informative
              // only — mock profiles live in the dev:mock environment (SPEC 14).
              <KidCard key={kid.id} kid={kid} interactive={navigable} />
            ))}
          </div>
        </section>
      ))}

      {filteredKids.length === 0 && (
        <div className="rounded-[18px] border border-line bg-panel py-10 text-center text-[15px] text-muted">
          {`Sin resultados para “${query.trim()}”`}
        </div>
      )}
    </>
  );
}
