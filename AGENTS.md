# La Comarca repository guidance

This repository contains the public La Comarca site and its Cloudflare Worker-backed team platform. Read `.codex/skills/la-comarca-platform/SKILL.md` for project-specific rules and load only the linked references relevant to the change.

## Regla obligatoria: publicar y verificar cada entrega

**SIEMPRE que se edite algo, publicar y verificar la entrega correspondiente. Por decisión del usuario, la web pública se publica mediante GitHub Pages; no requiere un token de Cloudflare. Esto incluye cambios pequeños, cambios FULL, diseño, contenido, configuración, pruebas, documentación y este mismo AGENTS.md.**

### Dos destinos distintos; no confundirlos

- **Web pública:** `.github/workflows/portal.yml` construye y publica automáticamente cada push a `main` en GitHub Pages. La dirección actual de este repositorio es `https://jadrk040507.github.io/comarca/`; la URL efectiva de cada publicación es `steps.deployment.outputs.page_url`.
- **Backend y CMS:** siguen en el Worker existente, con entrada `https://comarca.kipadmon.com/cms`. GitHub Pages sólo aloja archivos estáticos: no ejecuta el Worker, autenticación, permisos, operaciones de D1 ni escrituras privadas en Notion. No copiar secretos ni datos privados al sitio para intentar sustituir el backend.
- **Dominio solicitado:** mantener `https://comarca.kipadmon.com` como objetivo de la migración pública, pero no afirmar que se actualiza con Pages mientras siga conectado al Worker. Cambiar de hosting no cambia DNS ni libera un Custom Domain. No mover ese dominio sin separar y verificar primero el hostname y la autenticación del backend. Ver `docs/github-pages.md`.
- Esta distinción sustituye la anterior exigencia de desplegar Cloudflare después de toda edición pública. No elimina la obligación de desplegar cambios reales del backend ni autoriza describir una migración parcial como completa.

### Verificación y publicación

- Agrupar las ediciones de una tarea en una entrega coherente. Publicar la versión revisada de `main`; no desplegar ramas ni estados intermedios que rompan la aplicación.
- Ejecutar desde la **raíz del repositorio**, no desde `web`: `npm ci --prefix api` y `npm run check`. El check incluye sintaxis, pruebas y un build raíz. El workflow también construye con el `BASE_PATH` real que obtiene de `actions/configure-pages`.
- Mantener `PLATFORM_ORIGIN` apuntando al backend existente; no reemplazarlo por el origen estático de Pages. Conservar `REGISTRATION_API`, Turnstile y las demás integraciones públicas ya configuradas. Publicar sólo `dist`, nunca la raíz del repositorio.
- Para cada entrega pública, comprobar que `portal.yml` termina correctamente, que el paso de despliegue se ejecutó y que `deployment.json` en la URL publicada coincide con el commit y la ejecución de Actions. Verificar portada, assets y rutas afectadas; HTTP 200 por sí solo no demuestra que esté publicada la última entrega.
- Si cambia `api/`, autenticación, permisos, esquema o configuración del Worker, ejecutar además el flujo **manual** `.github/workflows/worker.yml` desde `main` con `deploy=true`, después de revisar pruebas y migraciones. Requiere la credencial autorizada de Cloudflare; un despliegue de Pages no publica esos cambios.
- El procedimiento manual autorizado del Worker sigue requiriendo un `dist` recién construido con `BASE_PATH=/`, revisión de migraciones y, desde `api`, `npx wrangler d1 migrations apply la-comarca-cms --remote` y `npx wrangler deploy --keep-vars`. No desplegar assets obsoletos ni reemplazar variables remotas a ciegas.
- Revisar compatibilidad, respaldo y reversión antes de nuevas migraciones. Esta regla no autoriza cambios destructivos, exposición de datos ni omitir controles de acceso o pruebas.
- Si falta una credencial o falla una verificación, conservar la última versión sana y reportar el bloqueo concreto. Distinguir **código guardado**, **web publicada en Pages**, **backend desplegado** y **dominio migrado**. No afirmar que el dominio o el CMS reflejan un commit publicado únicamente en Pages.
- En la entrega final indicar commit, pruebas, URL real publicada y resultado verificado. Los cambios de backend pendientes de despliegue y la migración del dominio deben permanecer explícitamente pendientes.

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
- Run `npm test` from the repository root and verify the public build for the actual deployment base path. Public Pages verification is not evidence of a backend deployment or an authenticated CMS acceptance test.
- Do not print or commit secrets, `.dev.vars`, `.env*`, tokens, private Notion payloads, or personal data.
