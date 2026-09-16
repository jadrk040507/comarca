# Migración operativa a Supabase

## Estado

La migración está preparada, pero todavía no está activada en producción. La migración SQL inicial vive en `supabase/migrations/0001_platform_foundation.sql`. No se deben crear secretos ni ejecutar un corte hasta completar el dry-run de importación.

## Ownership

Supabase será la fuente de verdad de identidad, permisos, agenda, materiales, inscripciones, catecismo, transporte, operaciones, archivos y auditoría. Notion se conserva temporalmente para importar el histórico y como archivo editorial; no habrá sincronización bidireccional.

## Variables server-only

- `SUPABASE_URL`: URL HTTPS del proyecto.
- `SUPABASE_SERVICE_ROLE_KEY`: secreto exclusivo del Worker; nunca se incluye en `vars`, el navegador ni Git.

El Worker accederá mediante `api/supabase.mjs`. Las rutas públicas usarán consultas allowlisted y nunca expondrán el service role key.

## Corte expand/contract

1. Crear el proyecto y ejecutar migraciones.
2. Importar Notion en una tabla o proceso temporal idempotente.
3. Comparar conteos, IDs, estados, relaciones y campos privados.
4. Activar lectura por módulo con feature flag.
5. Activar escritura por módulo y registrar auditoría.
6. Congelar edición operativa en Notion.
7. Retirar cada adapter únicamente después de validar rollback.

El primer corte debe ser reversible y no debe borrar ni modificar páginas originales de Notion.
