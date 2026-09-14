# Panel de La Comarca

El panel propio vive en `/cms/` del Worker. La web pública enlaza desde «Acceso del equipo». Notion conserva los datos de Agenda; D1 guarda exclusivamente cuentas, sesiones, límites de autenticación, invitaciones y permisos.

## Acceso

- Better Auth 1.7.4 gestiona contraseñas, sesiones y cambio de contraseña. No hay registro público.
- La primera cuenta se activa en `/equipo/activar`, validando el JWT de Cloudflare Access y el correo administrador guardado como secreto. El usuario introduce personalmente su contraseña.
- Después se entra directamente en `/cms/`, sin pantalla de Cloudflare Access.
- Las invitaciones se generan por administración, expiran a las 48 horas y se consumen una vez. El enlace se comparte manualmente, no se envía ningún mensaje automático.
- Consulta permite leer Agenda. Edición permite crear, editar y publicar Agenda. Administración también invita y revoca accesos. Revocar invalida el permiso en la siguiente consulta y cancela invitaciones pendientes.
- El acceso anterior de `/equipo/` se conserva como respaldo. La recuperación de una contraseña olvidada todavía no tiene un flujo propio; no retirar el respaldo hasta implementarla.

## Agenda

Lectura en vivo con paginación; búsqueda en registros cargados; filtro de publicación; creación de actividades; edición de nombre, tipo, fecha, lugar, resumen, estado, visibilidad y recurrencia semanal/anual. Las fechas de todo el día se conservan sin convertirlas a una hora.

La actualización requiere habilitar `Update content` en la conexión de Notion y `CMS_AGENDA_EDIT_ENABLED=true` en el Worker. Hasta entonces se puede consultar y crear, y la edición de registros existentes permanece deshabilitada.

Antes de editar se valida que el registro pertenezca a Agenda y que su fecha de última modificación coincida. Es una comprobación optimista; Notion no ofrece actualización condicional atómica y dos escrituras exactamente simultáneas aún pueden competir. No usarla como control de plazas de transporte o cobros.

La web pública mantiene su selección de campos y filtros. Guardar cambios no exporta relaciones privadas ni participantes. Su caché puede retrasar la actualización varios minutos.

## Configuración y comprobaciones

- `CMS_DB`: D1. Aplicar las migraciones de `api/migrations` antes del despliegue.
- `CMS_AUTH_SECRET`: secreto aleatorio del Worker, nunca en el repositorio.
- `TEAM_ADMIN_ACCOUNT`, `TEAM_ACCESS_ISSUER`, `TEAM_ACCESS_AUDIENCE`: secretos ya existentes para la activación inicial.
- Cookies de sesión seguras y HttpOnly, comprobación de origen, registro público no montado y permisos aplicados en el servidor.
- Las pruebas cubren inicio/cierre de sesión, activación verificada, rechazo de acceso anónimo, acciones de lectores, origen cruzado, pertenencia de registros y conflicto de edición.

## Trabajo pendiente

Los módulos de catecismo (alumnos, asistencia, evaluaciones y clases), materiales, retiros, traslados, presupuestos y notificaciones todavía no están conectados al CMS. El panel los identifica como pendientes, sin exponer datos de menores. Faltan permisos por grupo, importación revisada de los Sheets, excepciones por fecha en eventos recurrentes, historial de cambios y recuperación de cuenta.
