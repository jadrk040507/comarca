# La Comarca

Portal público: https://jadrk040507.github.io/comarca/

Una web estática para celular y escritorio, administrada desde Notion. Incluye agenda con filtros y búsqueda, fichas de eventos, formulario de participación, recursos, calendarios ICS, manifiesto instalable e integración opcional de notificaciones OneSignal.

## Editar contenido sin tocar código

En **Agenda → 🌐 Publicar en web**, completa:

- **Name**: nombre que verá la gente.
- **Fecha**: fecha y hora, con zona Ciudad de México. En eventos de varios días, la fecha final es inclusiva.
- **Lugar**, **Tipo**, **Resumen público**: solo información que quieras publicar.
- **Repetición web**: No repetir, Semanal o Anual. Semanal muestra la próxima sesión, no crea registros nuevos en Notion. Define **Repetir hasta** al terminar el curso. Los horarios recurrentes son orientativos; para una excepción, pausa la serie y crea la sesión con su fecha real.
- **Imagen pública**: sube un JPG, PNG, WebP o GIF de hasta 10 MB directamente a Notion. No se exportan otras imágenes ni adjuntos privados. El flyer del 1 de octubre está incluido como imagen inicial.
- Marca **Publicar en web** cuando esté revisado. Desmárcala para retirar el evento en la siguiente actualización. Si ya hubo inscripciones, avisa al equipo por separado.

En **Materiales → 🌐 Publicar en web**, completa Name, Resumen público y Enlace (HTTPS), y marca Publicar en web. Se enlaza la fuente original; no se copia su artículo. No se publica el cuerpo de las páginas.

Cambiar la casilla no cambia los permisos de Notion: la web recibe únicamente una selección de campos. Personas, alumnos, asistencia, calificaciones, teléfonos, correos, inscripciones, relaciones, presupuestos y comprobantes no forman parte de la exportación.

## Activar la sincronización (una sola vez)

La integración de Notion de este chat no es una clave reutilizable por GitHub Actions. Hace falta una integración interna propia:

1. Crea `La Comarca · Web` en https://www.notion.so/profile/integrations, con capacidad **Read content**. No necesita escritura ni acceso a datos de usuarios.
2. En Notion, conecta esa integración únicamente a **Agenda** y **Materiales**. No conectes la raíz del espacio privado.
3. Guarda la clave en GitHub → Settings → Secrets and variables → Actions → **New repository secret**, nombre `NOTION_TOKEN`. Nunca la pegues en código, un issue o un chat.
4. Las variables `NOTION_AGENDA_ID` y `NOTION_MATERIALS_ID` ya están configuradas con los IDs de las fuentes de datos, que son distintos a los de las páginas de base de datos.
5. Establece `NOTION_SYNC_ENABLED=true` y ejecuta **Actions → Actualizar y publicar La Comarca → Run workflow**. Confirma que termina correctamente y que la web refleja una edición de prueba antes de confiar en el horario automático.

La actualización se programa cada hora, al minuto 23. GitHub puede retrasarla; no es un servicio de avisos urgente. Los cron de repositorios públicos pueden desactivarse tras 60 días sin actividad: revisa el estado periódicamente y reactívalos desde Actions si sucede. El flujo no añade commits de relleno.

Con la sincronización desactivada, se publica la edición inicial revisada (`public/data.json`). Una vez activada, un fallo de Notion o una fila pública incompleta detiene la publicación y conserva el despliegue anterior. Un resultado vacío válido sí retira todo el contenido de esa fuente. Los JSON crudos de Notion y sus enlaces temporales de archivos nunca se suben a GitHub.

## Notificaciones reales (configuración independiente)

La actualización de la web no envía notificaciones por sí sola. Los avisos están desactivados hasta conectar OneSignal y probar una entrega.

1. Crea una aplicación **Web Push → Custom Code** en OneSignal, con origen `https://jadrk040507.github.io` y URL de la web `https://jadrk040507.github.io/comarca/`. Revisa el plan vigente antes de contratar; el código no compra servicios.
2. Añade la variable de repositorio `ONESIGNAL_APP_ID` (identificador público).
3. Añade el secreto `ONESIGNAL_REST_API_KEY` (App API Key, nunca una clave de organización ni código público).
4. Ejecuta el flujo de publicación. El worker está en `/comarca/push/OneSignalSDKWorker.js` y su scope es `/comarca/push/`; la inicialización **Custom Code** configura ambas rutas, sin exigir acceso a la raíz del dominio.
5. Desde la web, abre Avisos → Activar notificaciones y acepta el permiso en un dispositivo de prueba. En iPhone/iPad, añade la web a la pantalla de inicio y ábrela desde su icono (iOS/iPadOS 16.4+).
6. Establece `PUSH_ENABLED=true`. En Actions → **Enviar aviso a suscriptores**, escribe título y mensaje de prueba y ejecuta el flujo. Comprueba entrega en el dispositivo y en OneSignal antes de invitar a suscriptores.

Los avisos se dirigen a quienes aceptaron recibir avisos generales. El permiso es voluntario; hay botón de baja. No se copia a OneSignal la lista de alumnos, miembros o inscritos. El script usa un UUID estable por ejecución para evitar duplicados cuando se reintenta el mismo envío. Un nuevo Run workflow es un envío nuevo. No se envían avisos por cada edición del contenido ni se activan recordatorios automáticos sin definir destinatarios y reglas.

Los datos de suscripción de dispositivos se gestionan en OneSignal. El equipo deberá indicar un contacto público para atender solicitudes. Si no se configura OneSignal, el sitio muestra honestamente que los avisos están en preparación y permite descargar el calendario.

## Calendario

Cada ficha permite descargar su evento. El archivo `agenda.ics` contiene toda la agenda publicada. Los IDs estables ayudan a las aplicaciones compatibles a reconocer eventos repetidos. Importar un archivo no es una suscripción automática: vuelve a importarlo para actualizar y configura los recordatorios en tu calendario. Las series semanales se calculan para Ciudad de México (UTC−6); no aplicar esta lógica a otras zonas con horario de verano sin adaptarla.

## Desarrollo y publicación

Node 22+, sin dependencias de npm:

```sh
npm test
BASE_PATH=/ npm run build
npm run preview
```

Para GitHub Pages: `BASE_PATH=/comarca/ npm run build`. El flujo ejecuta pruebas, consulta Notion, genera `dist` y despliega solo esos archivos mediante GitHub Pages. No sirve archivos privados del directorio de trabajo. No hay dominio comprado.

La conexión remota requiere una clave de Notion; las pruebas sin ella verifican el filtrado de datos, las fechas, las recurrencias y el formato del calendario, pero no sustituyen una prueba de sincronización real.

## Imágenes y diseño

- Faro: imagen original generada para este portal, de una costa imaginaria inspirada en el Báltico. No representa la ubicación física de La Comarca.
- Flyer: invitación del 1 de octubre aportada por el equipo.
- Icono provisional de faro: reemplazar con el manual de marca oficial cuando esté disponible.
- Las animaciones respetan la preferencia del dispositivo de reducir movimiento.

## Referencias

- https://developers.notion.com/reference/query-a-data-source
- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule
- https://documentation.onesignal.com/docs/en/web-sdk-reference
- https://documentation.onesignal.com/docs/en/onesignal-service-worker


## Sitio completo

La portada es una entrada breve. Hay rutas independientes para `/agenda/`, `/actividades/`, `/recursos/`, `/participar/`, `/nosotros/`, `/ayuda/` y `/avisos/`. Las cinco actividades tienen páginas propias bajo `/actividades/`. Cada registro público genera una ficha estable en `/eventos/ID/`; comparte ese enlace para invitar.

`scripts/pages.mjs` genera todas las páginas durante el build a partir de la plantilla editorial y los datos públicos. Fechas, fichas, imágenes y recursos salen de `public/data.json`, que será actualizado por la sincronización de Notion cuando se active. Las explicaciones generales de cada actividad se mantienen en `scripts/pages.mjs`. La portada selecciona el próximo retiro mensual disponible; no requiere editar su fecha por separado.

`scripts/check-site.mjs` se ejecuta en cada build: revisa enlaces y archivos internos, un título principal por página e identificadores únicos. La agenda y los recursos incluyen contenido estático como respaldo si JavaScript no carga. Los filtros y las opciones de avisos usan JavaScript.

## Aportaciones, calendario y formularios

El sitio incorpora `/apoyar/`, `/proponer/`, `/actividades/despensas/` y `/actividades/hikes/`. Las aportaciones son voluntarias; no se publican cuentas, importes ni promesas de recepción sin confirmar. Las propuestas pueden prepararse como borradores locales.

La agenda permite alternar lista/calendario mensual. Expande las recurrencias y los eventos de varios días. La inscripción utiliza un formulario propio en `/participar/#inscripcion`, sin insertar páginas de Notion.

Para activar el formulario propio se necesitan las variables de GitHub `REGISTRATION_API` (URL HTTPS terminada en `/solicitudes`) y `TURNSTILE_SITE_KEY`. Sin ambas se muestra el formulario propio con el envío desactivado y un aviso explícito. La API vive en `api/worker.mjs`; las claves `NOTION_TOKEN` y `TURNSTILE_SECRET_KEY` se guardan exclusivamente como secretos de Cloudflare. El origen, los campos, el consentimiento y la verificación Turnstile se validan en servidor. Ningún campo del cliente puede confirmar inscripciones, registrar asistencia ni validar pagos. Los errores no exponen respuestas de Notion ni datos personales.

La organización de publicación es `la-comarca` y su repositorio `la-comarca.github.io`. El workflow usa la raíz `/` en ese repositorio y `/comarca/` en el repositorio anterior. Las credenciales y variables de cada repositorio se configuran por separado.
