import { KidsScreen } from "@/components/kids/kids-screen";
import { KidsLoading } from "@/components/kids/kids-loading";
import {
  kidFromDbRow,
  kids as mockKids,
  ROOMS,
  type RoomOption,
} from "@/lib/kids-data";
import { isMockEnv } from "@/lib/dev-environment";
import { createAdminClient } from "@/utils/supabase/admin";
import { Suspense } from "react";

type LoadedKidsData = {
  kids: ReturnType<typeof kidFromDbRow>[];
  rooms: RoomOption[];
};

async function loadKidsData(): Promise<LoadedKidsData> {
  // rooms/children have no RLS policies yet (SPEC 11), so this read uses the
  // server admin client. Never import this from a Client Component.
  const admin = createAdminClient();

  const [roomsResult, childrenResult] = await Promise.all([
    admin.from("rooms").select("id, name"),
    admin
      .from("children")
      .select(
        "id, full_name, birth_date, enrolled_at, allergy_tags, medical_notes, status, rooms ( name )",
      )
      .eq("status", "active")
      .order("full_name"),
  ]);

  if (roomsResult.error || !roomsResult.data) {
    throw roomsResult.error ?? new Error("rooms read failed");
  }
  if (childrenResult.error || !childrenResult.data) {
    throw childrenResult.error ?? new Error("children read failed");
  }

  return {
    rooms: roomsResult.data,
    kids: childrenResult.data.map((row, index) => kidFromDbRow(row, index)),
  };
}

// Server loader: fetches the real rooms + children. On any failure (DB down,
// forced `?fail=1` in dev) it degrades to the mock list; the client screen
// raises the connection-lost toast on mount.
async function KidsDataLoader({
  searchParams,
}: {
  searchParams: Promise<{ fail?: string }>;
}) {
  const { fail } = await searchParams;
  const forcedFailure =
    process.env.NODE_ENV === "development" && fail === "1";

  let data: LoadedKidsData | null = null;
  let readFailed = false;
  try {
    data = forcedFailure ? null : await loadKidsData();
  } catch (error) {
    console.error("kids page: remote read failed", error);
    readFailed = true;
  }

  const connectionLost = readFailed || forcedFailure;

  if (connectionLost) {
    return <KidsScreen connectionLost />;
  }

  return <KidsScreen kids={data?.kids ?? []} rooms={data?.rooms ?? []} />;
}

export default function KidsPage({
  searchParams,
}: {
  searchParams: Promise<{ fail?: string }>;
}) {
  if (isMockEnv()) {
    // Mock environment (SPEC 14): static render of the example data — no DB
    // reads, no data Suspense needed, and `?fail=1` is irrelevant here.
    return (
      <KidsScreen
        kids={mockKids}
        rooms={ROOMS.map((name): RoomOption => ({ id: "", name }))}
        mockMode
      />
    );
  }

  // The spinner is the Suspense fallback: the DB read streams in behind it.
  return (
    <Suspense fallback={<KidsLoading />}>
      <KidsDataLoader searchParams={searchParams} />
    </Suspense>
  );
}
