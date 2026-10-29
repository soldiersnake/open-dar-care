---
description: Implementa una spec aprobada paso a paso (crea la rama spec-NN-slug y pausa tras cada paso para revisar el diff)
---

Carga el skill con ID `spec-impl` usando la herramienta `skill` y sigue sus 4 fases en orden estricto, sin saltarte ninguna. No improvises el flujo: la skill es la fuente de verdad.

Argumentos del usuario: $ARGUMENTS

Límites absolutos: respeta el filtro de estado ("Aprobado" o equivalente; otro estado → error estándar y stop), crea/cambia a la rama `spec-NN-slug` en la fase 3 según `specs/.spec-config.yml` (`AutoCreateBranch`), y durante la fase 4 NO hagas commits por tu cuenta: el usuario decide cuándo commitear. El paso final del flujo del proyecto es invocar al agente `@spec-verifier`; no lo ejecutes tú.
