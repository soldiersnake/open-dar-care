---
description: Crea la especificación de una feature con el método spec-driven (solo definición, sin código)
---

Carga el skill con ID `spec` usando la herramienta `skill` y sigue sus fases exactamente, sin saltarte ninguna. No improvises el flujo: la skill es la fuente de verdad.

Argumentos del usuario: $ARGUMENTS

Límites absolutos: el flujo termina cuando se guarda `specs/NN-slug.md` con Estado Borrador. Después de guardar la spec NO implementes nada, NO ejecutes build/lint, NO hagas capturas, NO propongas testear. Si el usuario pide continuar, recuérdale que el siguiente paso es cambiar el Estado a "Aprobado" y ejecutar `/spec-impl NN-slug`.
