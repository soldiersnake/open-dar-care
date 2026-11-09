// Dedicated reader of the mock-environment flag (SPEC 14): everything else
// imports this helper instead of touching process.env directly.
//
// Server-only by usage (server pages), never imported from a Client
// Component: the mode travels to the client as props, so no
// DAYCARE_DEV_MODE env var ever reaches the browser bundle.
//
// The flag is dev-only by design: production builds/starts always run the
// real (database) code path regardless of the variable being set.
export function isMockEnv(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.DAYCARE_DEV_MODE === "mock"
  );
}
