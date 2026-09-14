# La Comarca: administración desde la web

Decisión del 13 de septiembre de 2026: la interfaz principal es la web de La Comarca. Notion es la fuente de datos y una vía alternativa de edición para el equipo. Cloudflare valida las sesiones, los permisos y las operaciones. GitHub mantiene el diseño y publica el sitio; no debe ser necesario editar código para mantener la agenda ni la biblioteca.

## Flujo acordado

1. La persona autorizada entra al panel de La Comarca con su cuenta.
2. La API identifica su rol, valida los campos y guarda la actividad o material en la base correspondiente de Notion.
3. La consulta pública recibe solo contenido expresamente publicado, nunca la respuesta completa de Notion ni las relaciones internas.
4. Las ediciones directas en Notion se consultan por la misma API. No hay dos bases independientes que deban conciliarse.
5. El calendario de suscripción consulta esa misma agenda con los filtros del usuario. Las aplicaciones de calendario deciden cuándo actualizarla.

## Accesos propuestos, pendientes de activar

| Rol | Alcance |
| --- | --- |
| Consulta | Agenda y recursos publicados; sin acceso a expedientes |
| Coordinación | Crear y editar actividades, materiales y logística asignada |
| Catequista | Clases, recursos, asistencia y seguimiento del grupo asignado |
| Administración | Gestión de accesos y publicación; revisión de la organización |

La autenticación y cada permiso deben comprobarse en la API, no solo ocultando botones. El usuario confirmó el correo de la primera cuenta de administrador; falta configurarlo en el proveedor de acceso. Usar Cloudflare Access con identidad verificada; validar firma, emisor, destinatario y caducidad del token. El servidor debe denegar por defecto. La administración de catecismo debe permanecer separada de los endpoints públicos.

## Edición y mantenimiento

- Formularios propios para actividades y recursos, con borrador y publicación explícita.
- Usar el ID de Notion como identificador estable, también para las series de círculos y los eventos del calendario.
- Mostrar fecha de última edición; si otra persona cambió el registro después de abrirlo, pedir recargar y revisar antes de guardar. No sobrescribir silenciosamente.
- Los permisos del panel no sustituyen los permisos de Notion: quien edite directamente allí debe tener el acceso correspondiente en Notion.
- Registrar autor, momento y operación administrativa sin incluir asuntos de conciencia ni datos privados en logs públicos.
- Para cancelar, conservar la actividad y su identificador con estado Cancelada. Borrar un registro puede producir resultados distintos según el calendario del suscriptor.
- Archivos y fotografías de menores requieren almacenamiento y acceso privados. No incorporar sus enlaces a la exportación pública.

## Estado real de esta entrega

- Activo: formulario propio de solicitudes que inserta en Inscripciones.
- Implementado: página Mi calendario, selección de tipos y círculos y endpoint de suscripción de Cloudflare. Consulta directamente los eventos publicados de Agenda en Notion, con caché de cinco minutos.
- Activo: lector directo de Agenda, autorizado expresamente por el usuario, con publicación explícita, exclusión de borradores y selección de campos públicos. La API no consulta respuestas de Inscripciones.
- Pendiente: panel autenticado para altas y edición, roles por grupo, acceso de catequistas y edición de la biblioteca desde la web. No existe aún un panel funcional de administración.
- Pendiente: conectar la biblioteca editorial a Materiales. Las 40 fichas actuales siguen mantenidas en el repositorio.

Mantener la publicación explícita y comprobar los registros al cambiar el esquema. Si Notion falla, la API debe responder error temporal y no un calendario vacío, para evitar que un suscriptor interprete una caída como retirada de todos los eventos.

## Suscripción y preferencias

El enlace mantiene filtros por tipo y por ID de círculo. Las nuevas actividades de los tipos seleccionados entran sin volver a descargar nada. Seleccionar todo incluye tipos futuros. Elegir un círculo concreto sigue su mismo registro aunque cambie su nombre u horario.

La selección está en el enlace, no en una cuenta personal. Cambiarla genera otra URL y requiere reemplazar la suscripción anterior. Una preferencia editable conservando la misma URL requerirá posteriormente guardar una configuración por cuenta o token revocable. Nunca usar el correo o un identificador de alumno en una URL pública.

La suscripción es de lectura: no otorga a La Comarca acceso al calendario privado de la persona. No es una conexión bidireccional con Google Calendar ni un sistema de notificaciones instantáneas. Los eventos importados antes desde un archivo ICS no se convierten automáticamente en una suscripción.
