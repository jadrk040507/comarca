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
- Pendiente: panel autenticado para altas y edición, roles por grupo, acceso de catequistas y edición de la biblioteca desde la web. Existe una primera versión del panel con acceso restringido al administrador, consulta de Agenda y creación de borradores; los módulos especializados siguen pendientes.
- Pendiente: conectar la biblioteca editorial a Materiales. Las 40 fichas actuales siguen mantenidas en el repositorio.

Mantener la publicación explícita y comprobar los registros al cambiar el esquema. Si Notion falla, la API debe responder error temporal y no un calendario vacío, para evitar que un suscriptor interprete una caída como retirada de todos los eventos.

## Base del módulo de catecismo: revisión de Sheets

Revisión del 13 de septiembre de 2026, mediante Google Drive, de «Programa Catecismo» (Sheet1, A1:L12) y «EXÁMENES DE CATECISMO» (Hoja 1, A1:J4 y A5:H25). Inspección de estructura y muestras; no se ha importado el padrón ni publicado información de alumnos. Las hojas originales se conservan sin modificaciones.

| Estructura encontrada | Uso en el backoffice |
| --- | --- |
| Tema, descripción y fecha de la sesión | Clases relacionadas con un curso, grupo y sesión de Agenda; objetivos, actividad preparada y resumen de lo realizado |
| Asistencia con nombres de catequistas en una celda | Asignaciones individuales de catequistas por sesión, separadas de la asistencia de alumnos |
| Material: Síntesis de la fe católica y Libro | Materiales reutilizables relacionados con temas y clases, con archivo o enlace y permisos propios |
| Evidencia | Adjuntos privados de cada sesión; revisión antes de cualquier publicación |
| Exámenes agrupados visualmente, estado «Listo» y listas de temas | Evaluaciones por alumno, responsable, fecha, estado y temas por revisar; calificación y escala explícitas cuando se definan |

No convertir «Listo» en aprobado ni las listas de temas en calificaciones: las hojas no definen esa equivalencia. Tampoco inferir un año a partir de fechas que solo contienen mes y día. Los encabezados informales de grupos y responsables requieren confirmación durante la migración.

El módulo debe tener alumnos, grupos/cursos, sesiones, turnos de catequistas, asistencia de alumnos, evaluaciones y materiales. La asistencia admite presente, falta, retardo y justificada, y empieza sin registrar; no marcar presentes por defecto. Una sesión puede vincularse a traslados, conservando separados los datos logísticos y los expedientes académicos.

La entrada propuesta será «Acceso del equipo», con una sola sesión y módulos según permisos: coordinación, catecismo, agenda, materiales y logística. El rol catequista queda limitado a sus grupos; coordinación administra su ámbito y administración asigna accesos. Esta es una especificación basada en las hojas: todavía no existe una URL de login operativa.

## Portal del equipo y espacios de organización

Ampliación solicitada el 13 de septiembre de 2026. Un acceso común lleva a «Mi semana»: próximos compromisos, tareas asignadas, cambios relevantes y selector de espacios. Una persona puede colaborar en varios espacios y tener un rol diferente en cada uno. Cambiar de espacio no requiere iniciar sesión otra vez. La pertenencia a un equipo organizativo no registra pertenencia jurídica o vocación religiosa.

Cada espacio tiene Inicio, Calendario, Equipo y turnos, Materiales y Organización. Las funciones específicas se añaden según el trabajo real:

| Espacio | Organización específica |
| --- | --- |
| Catecismo | Grupos, alumnos, clases, asistencia, evaluaciones, temas, turnos y recursos; basado en las Sheets revisadas |
| Retiros mensuales | Fecha de cada edición, meditación, charla, ponentes, programa, preparación de la casa, flyer y lecturas |
| Retiros fuera y convivencias | Confirmaciones, cupos, alojamiento, coches, aportaciones y presupuesto por edición |
| Labor social y despensas | Jornada, necesidades, aportaciones en especie, preparación, reparto, voluntarios y traslados |
| Velas, significado pendiente de confirmar | Propuesta provisional: edición, inicio y fin, franjas horarias, participantes confirmados, plazas libres y traslados de ida y regreso |

Se pidió aclaración sobre «velas», «facturas» y «frenas y tardía» del audio. No crear un módulo contable ni asumir comidas, pernocta o una regla mensual hasta resolver esos términos.

### Recorrido diario

1. La persona entra y ve sus compromisos de todos los espacios en una sola agenda.
2. Abre una edición concreta, consulta lo necesario y se apunta a una franja o tarea disponible.
3. Coordinación ve cobertura, pendientes y solicitudes; confirma responsables y plazas.
4. Un cambio de horario actualiza esa edición, sus turnos afectados y el calendario correspondiente; se solicita revisar los traslados que dejen de encajar.
5. Al concluir, se registra la realización y se conservan los materiales útiles para preparar la siguiente edición.

### Registros compartidos

Una identidad de usuario se relaciona con membresías por espacio, asignaciones, preferencias y suscripciones. Los datos de alumnos son expedientes separados: un alumno no necesita una cuenta web. Eventos, sesiones, tareas, materiales y traslados se relacionan por identificadores estables; no copiar una base completa por usuario o por portal. Los turnos contienen evento, fecha concreta, inicio, fin, cupo y estado; las asignaciones contienen participante y confirmación. Una plaza solicitada no equivale a confirmada.

Los coches tienen conductor, plazas disponibles, punto de encuentro y hora; ida y regreso se asignan por separado. Mostrar conflictos horarios y plazas pendientes sin publicar teléfonos o listados privados. La adjudicación del último lugar debe resolverse en el servidor con control de concurrencia, no mediante dos lecturas y escrituras independientes en Notion.

### Repetición y ediciones

Una serie expresa el horario habitual; cada edición organiza sus personas, tareas, materiales y excepciones. Repetir una actividad no copia asistencias, confirmaciones, calificaciones, pagos ni asignaciones de coche. La periodicidad mensual de las velas queda como propuesta, con fecha y horario de cada edición por confirmar. Ofrecer «solo esta edición» y «esta y las siguientes» al cambiar horarios; conservar excepciones de cancelación y cambios con identificadores estables.

El calendario público muestra solo las actividades publicadas. El calendario del equipo contiene únicamente los compromisos autorizados de la persona. Los enlaces privados deben ser revocables y no incluir nombres, correos o identificadores de alumnos en la URL.

### Avisos y contenido

Preferencias por espacio y canal: asignación, cambio de horario, cancelación, recordatorio y resumen semanal. La bandeja del equipo enlaza al evento o tarea; los avisos externos omiten datos de alumnos y expedientes. Evitar duplicar avisos cuando la persona pertenece a varios espacios. Los canales externos requieren configuración y consentimiento; actualmente no están activos.

Estado: especificación incorporada; autenticación, portal del equipo, módulos privados y avisos aún pendientes de implementación. Notion permanece como fuente de datos con edición alternativa; Cloudflare debe aplicar los permisos en cada consulta y escritura.

## Suscripción y preferencias

El enlace mantiene filtros por tipo y por ID de círculo. Las nuevas actividades de los tipos seleccionados entran sin volver a descargar nada. Seleccionar todo incluye tipos futuros. Elegir un círculo concreto sigue su mismo registro aunque cambie su nombre u horario.

La selección está en el enlace, no en una cuenta personal. Cambiarla genera otra URL y requiere reemplazar la suscripción anterior. Una preferencia editable conservando la misma URL requerirá posteriormente guardar una configuración por cuenta o token revocable. Nunca usar el correo o un identificador de alumno en una URL pública.

La suscripción es de lectura: no otorga a La Comarca acceso al calendario privado de la persona. No es una conexión bidireccional con Google Calendar ni un sistema de notificaciones instantáneas. Los eventos importados antes desde un archivo ICS no se convierten automáticamente en una suscripción.

## Acceso del equipo: primera versión del 14 de septiembre de 2026

Ruta pública de entrada: /equipo/ en GitHub Pages. Botón hacia /equipo/ del Worker existente. Cloudflare Access protege exclusivamente esa ruta y sus subrutas; la agenda pública, el calendario y solicitudes permanecen públicos. Acceso por código al correo del administrador inicial ya autorizado. No cambiar el nombre global de Cloudflare Access, compartido con otras aplicaciones del usuario.

El servidor verifica firma RS256, emisor, audiencia, expiración y correo autorizado; nunca confía solo en el correo de un encabezado. Respuestas privadas sin caché, scripts del mismo origen, y escrituras JSON con comprobación de origen y encabezado propio. No se amplían los permisos de la integración de Notion: usa lectura e inserción existentes en Agenda.

Funciones de esta versión: identificar la sesión, cerrar sesión, consultar Agenda con paginación y crear actividades como Borrador sin publicación pública automática. No incluye edición, publicación, administración de otros usuarios, expedientes ni asistencias. No afirmar que estos módulos están habilitados.

El emisor, audiencia y correo administrador se guardan como secretos TEAM_ACCESS_ISSUER, TEAM_ACCESS_AUDIENCE y TEAM_ADMIN_ACCOUNT en Cloudflare; no se publican en el repositorio.
