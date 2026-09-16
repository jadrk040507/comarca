# Panel de La Comarca

El despliegue del Worker se verifica y se puede iniciar manualmente desde el workflow **Verificar y desplegar Worker de La Comarca**. El workflow no despliega automáticamente: requiere seleccionar explícitamente `deploy=true` después de pasar las pruebas. Para desplegar, el repositorio necesita el secreto de Actions `CLOUDFLARE_API_TOKEN`, con permisos mínimos para editar ese Worker y aplicar migraciones D1. El flujo conserva las variables y secretos existentes del Worker y aplica las migraciones antes del despliegue.

El panel propio vive en `/cms/` del Worker. La web pública enlaza desde «Acceso del equipo». Notion conserva los datos de organización; D1 guarda cuentas, sesiones, límites de autenticación, invitaciones, permisos y un registro mínimo de novedades. El sitio público sigue alojado en GitHub Pages.

`la-comarca.github.io` es un dominio administrado por GitHub Pages y no puede servir el Worker bajo una ruta propia. Para evitar el subdominio técnico `workers.dev`, configurar un dominio propio en Cloudflare —por ejemplo `equipo.<dominio-de-la-comarca>`— como Custom Domain del Worker y usarlo como enlace de equipo. Esto requiere controlar un dominio de La Comarca y su DNS; no se soluciona de forma segura con una redirección de GitHub Pages.

El inicio del panel presenta próximas actividades, acciones pendientes, disponibilidad y novedades. Al abrir una actividad de Agenda, el panel consulta los registros relacionados autorizados —por ejemplo materiales, inscripciones, turnos o traslados— sin copiar sus propiedades privadas ni sustituir la ficha operativa original.

## Acceso y permisos

- Better Auth gestiona contraseñas, sesiones y cambio de contraseña. No hay registro público.
- La primera cuenta se activa en `/equipo/activar`, validando Cloudflare Access y el correo administrador guardado como secreto. El usuario introduce personalmente su contraseña.
- Después se entra directamente en `/cms/`, sin pantalla de Cloudflare Access.
- Administración genera invitaciones privadas que caducan en 48 horas. Se comparten manualmente; no se envía ningún mensaje automático.
- Cada invitación define consulta o edición y las secciones autorizadas: Agenda, Materiales, Catecismo, Traslados e Inscripciones. Administración puede revocar accesos.
- Catecismo da acceso a todos los grupos de esas bases. Todavía no hay permisos limitados a un grupo: invitar únicamente a responsables que deban ver todos esos registros.
- El acceso anterior de `/equipo/` se conserva como respaldo. La recuperación de una contraseña olvidada todavía no tiene un flujo propio.

## Módulos implementados

Los formularios guardan directamente en las bases existentes, sin copiar datos de alumnos a GitHub. Los cambios hechos directamente en Notion aparecen al actualizar la lista del panel.

| Sección | Uso |
| --- | --- |
| Agenda | Crear actividades y editar fecha, lugar, estado, publicación y recurrencia semanal/anual. |
| Alumnos | Ficha, grupo, estatus, tutor y seguimiento educativo privado. |
| Pase de lista | Relacionar un alumno con una sesión concreta y registrar presencia, falta o retardo. |
| Clases y actividades | Preparar instrucciones, fechas, temas y materiales. |
| Entregas y calificaciones | Relacionar alumno y actividad, registrar avance, entrega, retroalimentación y nota opcional de 0 a 10. Una nota vacía no equivale a cero. |
| Temas | Ordenar contenidos y vincular recursos. |
| Turnos de catequistas | Organizar quién participa en cada sesión. |
| Materiales | Guardar enlaces, PDFs e imágenes; vincularlos a actividades. |
| Traslados | Un coche y trayecto por registro, con conductor, salida, capacidad, casetas y estado. |
| Inscripciones | Revisar solicitudes, vincularlas a Agenda y actualizar su estado. |

Las relaciones se seleccionan desde el mismo formulario. Los archivos se adjuntan después de guardar el registro, con un máximo de 5 MB, en formato PDF, JPG, PNG o WebP. Para conservar versiones, la subida no reemplaza archivos existentes: crear otro material cuando corresponda.

## Estado de conexión

Las diez bases fueron añadidas a la conexión: Agenda, Inscripciones, Materiales, Traslados, Alumnos, Pase de lista, Actividades, Calificaciones, Temas y Turnos. La conexión tiene lectura, inserción y actualización de contenido. Se mantiene el acceso limitado a estas bases, sin compartir públicamente la gestión interna.

`CMS_CONNECTED_MODULES` activa `materials,transport,students,attendance,lessons,grades,topics,shifts,registrations`; `CMS_AGENDA_EDIT_ENABLED=true` habilita la actualización de registros y subida de archivos.

Administración dispone de «Comprobar conexiones con Notion», que revisa acceso de lectura y nombres de campos. Esta comprobación no escribe registros ni confirma por sí sola permisos de actualización.

## Publicación, solicitudes y novedades

- La agenda pública y la suscripción de calendario consultan la misma Agenda, con una selección de campos y filtros de publicación. La caché puede retrasar cambios unos minutos; cada aplicación de calendario decide cuándo refrescar una suscripción.
- El formulario público puede vincular una solicitud a un evento de Agenda. La API verifica que pertenezca a la base pública, esté publicado y disponible antes de crear la relación. El envío es una solicitud, no una confirmación automática de plaza.
- `/public/materials` publica únicamente materiales marcados «Publicar en web» y con vigencia «Vigente». Exporta título, categoría, resumen y enlace, sin participantes ni relaciones privadas. Si Notion no está disponible, la web conserva los recursos de su última publicación.
- «Novedades» muestra cambios guardados desde el panel y solo en las secciones autorizadas. No registra el contenido de fichas de alumnos. Los cambios hechos directamente en Notion no generan aún una novedad.
- No hay envíos automáticos por correo, WhatsApp ni notificaciones push activados.

## Verificación y límites

Aplicar las migraciones de `api/migrations` antes de desplegar. Los secretos de cuentas y conexión permanecen en el Worker, nunca en GitHub. El servidor verifica sesión, permisos, origen, campos permitidos y pertenencia de registros antes de escribir.

La comprobación de versión evita sobrescribir un registro que ya cambió. Notion no ofrece una escritura condicional atómica: cambios exactamente simultáneos aún pueden competir. El pase de lista y las evaluaciones consultan duplicados antes de crear, sin garantizar exclusión entre escrituras simultáneas. No usar estos controles como reservas de plazas o contabilidad de cobros.

Las pruebas cubren autenticación, acceso anónimo, lectores, permisos por sección, origen cruzado, relaciones, conflictos de edición, notas vacías, filtrado público y subida de archivos. La revisión visual utiliza datos ficticios, sin importar alumnos reales.

Pendiente: verificar un recorrido con sesión del usuario, importación revisada de Sheets, permisos por grupo, excepciones de recurrencia por fecha, reservas de transporte, presupuestos, recuperación de cuenta y avisos automáticos.
