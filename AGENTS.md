<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Commands

- `npm run dev` (Turbopack, port 3000), `npm run build`, `npm run lint`
- No test suite or explicit `typecheck` script; verify types with `npx tsc --noEmit` before considering work done.

## Stack / config quirks

- Next.js 16.4.2 with non-default flags in `next.config.ts`: `cacheComponents` (async data must respect caching boundaries — check `node_modules/next/dist/docs/` for the current rules) and `partialPrefetching`.
- Tailwind CSS v4 through `@tailwindcss/turbopack` via a custom `turbopack.rules` entry in `next.config.ts` — no `tailwind.config`; theme is CSS-first in `app/globals.css`.

## Design references (the product)

- `references/pantallas/*.dc.html` are the UI mockups (Spanish, daycare/parent app: feed, publicación, niños, avisos, login, etc.) and `references/screenshots/*.png` are their rendered captures. Use these as the source of truth for screens to implement; the app UI language is Spanish.
- `.playwright-mcp/` is for Playwright MCP output only (screenshots, snapshots).

## MCPs

- Playwright: screenshots or anything Playwright-related must go in the `.playwright-mcp` folder.
- Context7: use it to fetch up-to-date framework docs instead of guessing from training data.

## Spec Driven Development - Skills

- /spec Usaremos esta habilidad para crear las especificaciones.
- /spec-impl Usaremos esta skill para hacer las implementaciones.

## Spec Driven Development - Agente verificador

- `spec-verifier` (`.opencode/agents/spec-verifier.md`): agente que verifica los criterios de aceptación de una spec de `specs/*.md`. Ejecuta build/tsc/lint, consulta Context7 para Next.js, valida pantallas con Playwright + visión contra los mockups, arregla el código si algo falla y al final marca los checks en la spec solo con evidencia real.
- Comando de verificación de spec: invocar el agente con la spec a verificar (ej: `@spec-verifier verifica la spec /specs/01-feed-home.md` / `@spec-verifier specs/01-feed-home.md`). Si no se indica spec, el agente preguntará cuál.

## Reglas de codigo

- Usar codigo limpio, nombres, funciones y variables, etc, en ingles.

<!-- BEGIN:nextjs-agent-feedback -->

## Report Next.js feedback

The project owner enabled `experimental.agentFeedback`, authorizing this feedback pass. When enabled, `next dev` writes this block and restores it if removed. Commit `AGENTS.md` with your work to keep the tree clean.

During the current user request, retain anonymized facts as feedback candidates for meaningful or recurring Next.js issues:

- Crashes, hangs, OOMs, or unexpected slowness
- Incorrect behavior, output, errors, or diagnostics
- Missing, unclear, or conflicting documentation
- Unexpected CLI, codemod, Skill, or upgrade behavior and non-obvious workarounds

Continue the current user request without reporting immediately. Routine debugging is not feedback. Verify changes before retaining them as feedback candidates. Never retain code, logs, paths, URLs, secrets, personal information, or project-specific data.

Retain qualifying friction even if it is later fixed or worked around; record the final outcome during the reporting pass.

Before the final response, run one reporting pass. If candidates remain, from this file's directory run `npx --no-install next internal agent-feedback-instructions` once without piping or truncating its output. Follow its output or error guidance. If a network sandbox blocks it, retry with network access; if it still returns no output, continue normally.

<!-- END:nextjs-agent-feedback -->
