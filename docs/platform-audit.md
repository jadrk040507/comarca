# La Comarca · auditoría de plataforma y plan incremental

Fecha: 2026-09-15. Alcance: repositorio `web`, incluida la aplicación pública, el Worker y el panel `/cms`.

## 1. Mapa de arquitectura actual

- **Frontend público:** HTML estático generado por `scripts/build.mjs` y `scripts/pages.mjs`; JavaScript progresivo en `public/*.js`; estilos compartidos en `public/styles.css`.
- **Backend:** un Cloudflare Worker (`api/worker.mjs`) que agrupa publicación pública, formularios, `/cms` y el legado `/equipo`.
- **Persistencia:** Notion Data Sources para Agenda, materiales, catecismo, traslados e inscripciones; D1 para Better Auth, sesiones, límites, invitaciones, permisos y novedades del panel.
- **Auth:** Better Auth con email/contraseña y cookies seguras para `/cms`; Cloudflare Access/JWT para bootstrap y compatibilidad con `/equipo`.
- **Entrega:** GitHub Actions publica Pages; el Worker tiene un workflow manual separado con dry-run y despliegue opt-in.
- **Calidad actual:** nueve suites, 46 pruebas iniciales y cobertura ampliada para archivos, registros, exportaciones públicas y panel; sintaxis y build comprobables desde `npm run check`.

## 2. Mapa de producto y dominio

El producto ya contiene un eje operativo real: una actividad de Agenda puede relacionar materiales, solicitudes, transporte, turnos, temas, asistencia y lecciones. Catecismo añade alumnos, calificaciones y seguimiento privado. Las invitaciones y permisos son un dominio independiente en D1.

No hay evidencia suficiente para introducir todavía habitaciones, mantenimiento, incidencias, notificaciones operativas o un catálogo de “personas” separado. Son hipótesis de producto, no tablas justificadas. La siguiente investigación debe identificar responsable, estado, transición y necesidad transaccional antes de modelarlas.

## 3. Problemas arquitectónicos principales

1. Notion concentra demasiadas operaciones privadas y no ofrece por sí solo garantías adecuadas para disponibilidad, concurrencia, auditoría completa o aislamiento por grupo.
2. El Worker todavía mezcla routing, autorización, adaptación a Notion y respuestas HTTP; conviene separar módulos de aplicación sin introducir microservicios.
3. El panel venía organizado como listas/formularios. Ya tiene shell, dashboard, novedades y detalle relacionado, pero faltan calendario, búsqueda transversal, acciones contextuales y workflows de operaciones.
4. Los permisos son módulos amplios; catecismo no tiene aislamiento por grupo y no debe presentarse como autorización granular.
5. No existe aún lint, type-check ni prueba E2E de navegador. El pipeline debe añadirlos gradualmente.

## 4. Evaluación de seguridad

Fortalezas observadas: sesión server-side, cookies HttpOnly/SameSite/Secure, comprobación de origen, límites de cuerpo y frecuencia, validación de entradas, verificación de pertenencia a Data Source, control de versiones, allowlist de exportación pública, filtrado de URLs de archivos y errores no verbosos.

Riesgos/prioridades: revisar configuración real de producción y secretos fuera del repositorio; definir una política de archivos privados; añadir pruebas de revocación, acceso a objetos, registros malformados y reintentos; completar auditoría de dependencias cuando haya conectividad al registry; diseñar permisos por grupo antes de exponer expedientes de menores a más usuarios.

El escaneo de seguridad disponible terminó sin hallazgos reportables en cobertura parcial. No equivale a certificación: no hubo workers delegados, no se concedió acceso Daybreak y `npm audit` no pudo consultar el registry por DNS.

## 5. Notion y fuentes de verdad

| Categoría | Fuente recomendada | Regla |
|---|---|---|
| Agenda y materiales públicos | Notion | Notion editorial; el sitio recibe únicamente campos allowlisted mediante sincronización unidireccional. |
| Auth, sesiones, grants, invitaciones y límites | D1 | Operación propia de la aplicación; nunca se publica. |
| Novedades y auditoría | D1 | Actor, operación, módulo, registro y metadatos mínimos. |
| Inscripciones y catecismo | Pendiente de decisión, preferentemente aplicación/D1 cuando haya workflows transaccionales | Privado; no exportar a GitHub ni al sitio. |
| Información externa de solo lectura | Notion u otro adapter | Declarar explícitamente que no se edita desde el panel. |

No se debe implantar sincronización bidireccional genérica. Cada relación nueva necesita dueño, dirección, resolución de conflictos y estrategia de reintento.

## 6. Arquitectura objetivo

Mantener un monolito modular: rutas finas, servicios de dominio/aplicación, adapters para Notion/D1/notificaciones y una única shell CMS. Incorporar una base operativa propia sólo para flujos que necesiten transacciones, privacidad, disponibilidad o auditoría que Notion no pueda garantizar. Mantener contratos de respuesta pequeños y validación centralizada.

## 7. Navegación propuesta

`Inicio` · `Agenda` · `Calendario` · `Espacios de organización` · `Personas` (cuando exista un modelo justificado) · `Operaciones` · `Novedades` · `Administración` · `Cuenta`.

La navegación debe ser capability-based: una sección sólo aparece si existe un módulo conectado y el usuario puede leerlo, pero cada endpoint debe volver a comprobarlo. La actividad es el hub de detalle; sus relaciones se muestran en contexto y no como copias desconectadas.

## 8. Modelo de datos propuesto

Primera etapa: conservar las Data Sources existentes y formalizar sus definiciones, relaciones, estados y permisos. Segunda etapa: introducir sólo las entidades operativas que un workflow demuestre necesarias: `activity`, `reservation/request`, `participant/contact` con clasificación de sensibilidad, `task`, `incident`, `audit_event` y `notification_delivery`. Separar series recurrentes de sesiones concretas y solicitudes de reservas confirmadas.

Cada entidad nueva debe declarar propietario, visibilidad, estados válidos, transiciones permitidas, claves de idempotencia y fuente de verdad.

## 9. Permisos propuestos

Conservar `admin`, `editor`, `reader` como roles base, pero derivar autorización de permisos centralizados: `agenda.read/write`, `materials.read/write`, `catechism.read/write`, `registrations.read/write`, `transport.read/write`, `operations.read/write`, `users.manage`, `settings.manage`, `audit.read`. Añadir scope por grupo o programa antes de conceder acceso amplio a datos de menores. El servidor debe aplicar autorización a lectura, escritura, relaciones, archivos y exportaciones.

## 10. Deuda técnica priorizada

**Alta:** aislar servicios del Worker; decidir qué operaciones privadas migran de Notion; diseñar scopes de catecismo; probar archivos y objetos; verificar producción y rollback del Worker.

**Media:** añadir type-check/lint, contratos de API, calendario del panel, búsqueda/filtros consistentes, auditoría consultable y observabilidad estructurada.

**Baja:** consolidar nombres históricos `/equipo`, reducir duplicación de presentación y completar componentes visuales sólo después de validar workflows.

## 11. Roadmap reversible

1. **Fundación (actual):** AGENTS.md, skill de proyecto, auditoría, migración de metadata de novedades, dashboard, shell y detalle relacionado.
2. **Contratos:** extraer módulos de aplicación, validadores y permisos; añadir tests de autorización y errores; no cambiar fuentes de verdad.
3. **Agenda operativa:** calendario, disponibilidad y estados explícitos; primero lectura y acciones reversibles.
4. **Operaciones:** tareas/incidencias sólo con un caso de uso y owner confirmados; auditar cada transición.
5. **Privacidad y datos:** migrar workflows transaccionales seleccionados a D1; migración por backfill verificable y fallback de lectura.
6. **Madurez:** E2E de workflows críticos, observabilidad, lint/type-check, revisión de dependencias y despliegue controlado.

Cada hito debe poder desplegarse sin reescribir el sitio público, tener migración/rollback documentados y pasar `npm run check`.

## 12. Riesgos y migración

Los riesgos principales son duplicar datos entre Notion y D1, confundir permisos de edición con publicación, exponer datos de menores por relaciones, convertir enlaces temporales de Notion en almacenamiento público y crear workflows sin dueño. Mitigaciones: ownership explícito, adapters aislados, allowlists, scopes server-side, optimistic concurrency, logs mínimos y migraciones expand/contract.

Este documento es una base de decisión, no una autorización para crear todos los dominios enumerados. Cada módulo futuro debe aportar evidencia del workflow real y una prueba de aceptación operativa.
