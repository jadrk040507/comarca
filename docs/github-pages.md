# Publicación con GitHub Pages

## Decisión y alcance

La web pública se publica con GitHub Pages para no depender de una credencial de Cloudflare en cada cambio. Se conserva el diseño y el código de la aplicación. Esta decisión no convierte Pages en un servidor de aplicaciones ni migra automáticamente el CMS.

| Componente | Destino y estado |
| --- | --- |
| Portada, páginas, estilos, JavaScript y assets públicos | GitHub Pages; workflow `portal.yml` automático al hacer push a `main` |
| Acceso al CMS, sesiones, permisos, escrituras privadas y base D1 | Worker existente; despliegue independiente, manual |
| `comarca.kipadmon.com` | Sigue vinculado al Worker; su migración pública a Pages está pendiente |

La URL de Pages de este repositorio es `https://jadrk040507.github.io/comarca/`. Confirmar siempre la URL efectiva mostrada por el paso de despliegue: un dominio personalizado configurado en Pages puede cambiarla. No confundir este repositorio con `la-comarca/la-comarca.github.io` ni asumir que publicar uno actualiza el otro.

## Flujo habitual

1. Agrupar el cambio y ejecutar las comprobaciones desde la raíz: `npm ci --prefix api` y `npm run check`.
2. Incorporar la entrega revisada a `main`. `portal.yml` obtiene la configuración de Pages, prueba el código, sincroniza sólo datos públicos si está habilitado, construye y publica únicamente `dist`.
3. Revisar que finalicen correctamente tanto el despliegue como su verificación. `deployment.json` debe contener el commit esperado, el identificador de ejecución y `target: github-pages`. También se comprueban `config.json`, portada, agenda, recursos, participación, CSS y JavaScript bajo la ruta efectiva.
4. Informar la URL publicada y las verificaciones realizadas. No decir que se actualizó el backend o el dominio de Cloudflare con esta operación.

Para publicar la web en Pages no se necesita `CLOUDFLARE_API_TOKEN`: Actions utiliza su autorización de GitHub Pages. Las integraciones siguen necesitando sus propias configuraciones. No desactivar Turnstile, eliminar autenticación ni publicar claves privadas para evitarlas.

`PLATFORM_ORIGIN` sigue apuntando al backend existente. El CMS se abre en su propio origen y conserva allí sus cookies y controles del servidor; no se incrusta un falso login estático. Los formularios conservan `REGISTRATION_API` y la configuración pública de Turnstile. El éxito de la publicación estática no verifica una inscripción ni una sesión autenticada.

La sincronización programada continúa condicionada a `NOTION_SYNC_ENABLED`. Cuando está desactivada se publica la copia revisada; no describirla como sincronización nueva en tiempo real. Una consulta pública del navegador a una API externa sigue dependiendo de esa API.

## Cambios del backend

`worker.yml` ya no se ejecuta por cada push. Para cambios del Worker/CMS/D1, revisar compatibilidad y migraciones y ejecutar explícitamente el workflow desde `main` con `deploy=true`, usando la credencial autorizada de Cloudflare. Sin esa credencial no se puede actualizar ese backend por este workflow, aunque la web pública sí se haya publicado en Pages.

No se ha eliminado el Worker ni se han modificado rutas, bases de datos, DNS o sesiones con este cambio. No presentar la versión en vivo del CMS como equivalente al último commit sin comprobar el despliegue correspondiente.

## Mantener el dominio propio: migración pendiente

Pages admite un dominio propio, pero no conserva por sí solo las rutas dinámicas del Worker que actualmente usa ese mismo hostname. No cambiar el DNS de `comarca.kipadmon.com` antes de completar este orden:

1. Disponer de un hostname independiente para el backend. Verificar el CMS completo en ese origen: cookies, `CMS_ORIGIN`, orígenes permitidos, acceso de administrador, API de solicitudes, Turnstile y calendario. La disponibilidad de una URL `workers.dev` no demuestra que el login funcione allí sin ajustes.
2. Actualizar y desplegar los enlaces y la configuración pública para que el CMS y las APIs usen el hostname verificado. Probar desde el origen de Pages las funciones que dependan de peticiones entre orígenes.
3. Verificar la propiedad del dominio y configurarlo en GitHub, Settings > Pages > Custom domain. Coordinar la retirada del Custom Domain del Worker y el cambio DNS; no eliminar registros ajenos ni modificar la zona completa. El CNAME de un subdominio de Pages apunta al hostname `jadrk040507.github.io`, no a una URL con `/comarca/`.
4. Reconstruir para la ruta real obtenida por `actions/configure-pages`, verificar HTTPS, assets, redirecciones y los flujos públicos y privados. Con un dominio propio en la raíz, `BASE_PATH` debe ser `/`.
5. Confirmar la versión en `https://comarca.kipadmon.com` antes de marcar la migración terminada. Mantener un plan de reversión y no desproteger el backend para resolver errores de acceso.

El workflow usa un build personalizado de Actions: añadir un archivo `CNAME` al repositorio por sí solo no configura el dominio de Pages. GitHub indica que esos archivos se ignoran en publicaciones mediante workflows personalizados.

## Referencias oficiales

- https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
- https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/troubleshooting-custom-domains-and-github-pages
