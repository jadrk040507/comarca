# La Comarca repository guidance

This repository contains the public La Comarca site and its Cloudflare Worker-backed team platform. Read `.codex/skills/la-comarca-platform/SKILL.md` for project-specific rules and load only the linked references relevant to the change.

## Regla obligatoria: toda edición debe llegar a producción

**SIEMPRE que se edite algo en este repositorio, hay que actualizar y verificar `https://comarca.kipadmon.com`. Esto aplica a cambios pequeños y grandes, cambios FULL, diseño, contenido, CMS, API, configuración, pruebas, documentación y este mismo AGENTS.md.**

- Una entrega no está terminada con guardar archivos, hacer un commit, abrir un PR, pasar las pruebas o publicar únicamente GitHub Pages. El dominio canónico de producción es `https://comarca.kipadmon.com`.
- Agrupar las ediciones de una misma tarea en una entrega coherente y comprobada. Publicar la versión aprobada de `main`; no desplegar ramas de trabajo ni estados intermedios que rompan la aplicación.
- Ejecutar desde la **raíz del repositorio** (no existe un directorio `web` en esta estructura): `npm ci --prefix api` y `BASE_PATH=/ PLATFORM_ORIGIN=https://comarca.kipadmon.com npm run check`. El check incluye sintaxis, pruebas y construcción del sitio público.
- Usar `.github/workflows/worker.yml` para desplegar el Worker **junto con los assets recién construidos de `dist`**. `api/wrangler.jsonc` vincula ambos con `comarca.kipadmon.com`. El flujo de GitHub Pages en `portal.yml` no sustituye este despliegue.
- Comprobar que el workflow correspondiente al commit entregado termina correctamente, que el paso de despliegue realmente se ejecutó (no omitido) y que el dominio sirve esa versión. Verificar portada, assets, acceso al CMS y las rutas o flujos afectados; HTTP 200 por sí solo no demuestra que esté publicado el último cambio.
- Si se necesita el procedimiento manual autorizado: construir primero desde la raíz y, desde `api`, revisar/aplicar las migraciones pendientes con `npx wrangler d1 migrations apply la-comarca-cms --remote` y desplegar con `npx wrangler deploy --keep-vars`. Nunca desplegar un `dist` antiguo ni reemplazar secretos o variables remotas a ciegas.
- Revisar compatibilidad, respaldo y reversión de cualquier nueva migración antes de incorporarla a `main`. Esta regla de publicación no autoriza migraciones destructivas, cambios de DNS, exposición de datos ni saltarse autenticación, permisos o pruebas.
- Si faltan credenciales, permisos, conectividad o falla una verificación: conservar la última versión sana, indicar el bloqueo concreto y distinguir **código guardado**, **despliegue ejecutado** y **producción verificada**. No afirmar que el sitio está actualizado sin evidencia ni dar la tarea por completamente terminada.
- En la entrega final indicar commit, verificaciones ejecutadas y resultado real de la publicación en el dominio. No asumir que otro agente publicará después.

## Recuperar y preservar el diseño existente

- Recuperar el contexto desde el código y el historial antes de modificar la interfaz. Leer `.codex/skills/la-comarca-platform/references/ux.md`, `public/styles.css`, `public/index.html`, `scripts/pages.mjs` y los módulos visuales afectados. No depender de la memoria de una conversación o de un modelo específico.
- Referencia de código inspeccionada al establecer esta regla: commit `92aeee7570957bba1bc9bf19e5fef9194e0c9b49`. Es una referencia histórica, **no** una orden de reset ni de revertir mejoras posteriores.
- Conservar la línea editorial, la composición, los recursos visuales, la navegación, la adaptación móvil y el movimiento accesible. Los tokens actuales incluyen azul `#133b58`, tinta `#111519`, papel `#fafafa`, texto secundario `#65686d` y líneas `#d9dbde`; la tipografía pública usa DM Sans y Barlow Condensed. Reutilizar los tokens del código, no duplicarlos arbitrariamente.
- Preservar el faro y los recursos editoriales existentes salvo petición explícita de reemplazo. La documentación describe el faro como una costa imaginaria: no presentarlo como fotografía del lugar.
- Evolucionar el CMS de forma incremental, con flujos operativos y registros relacionados; no convertirlo en una copia de la portada ni en una colección de formularios desconectados. No presentar módulos planeados o desconectados como funciones operativas.
- Al restaurar una parte del diseño, comparar el historial y recuperar sólo lo necesario. No sobrescribir cambios ajenos, eliminar funciones ni rehacer toda la interfaz sin una necesidad demostrada.

## Security and architecture

- Keep public publishing fail-closed: export only explicitly approved public fields from Notion.
- Keep participant, student/minor, tutor, attendance, transport, budget, and operational notes out of public exports.
- Treat server-side authentication and authorization as the source of access decisions; do not rely on UI visibility.
- Preserve the existing static-site and Worker architecture unless an audited change proves a smaller incremental design cannot meet the requirement.
- Use Notion as an integration boundary, not as an excuse to couple every UI component directly to its API.
- Run `npm test` from the repository root, and `BASE_PATH=/ npm run build` for public build verification when applicable; the full delivery gate is `npm run check` plus production deployment and verification as specified above.
- Do not print or commit secrets, `.dev.vars`, `.env*`, tokens, private Notion payloads, or personal data.
