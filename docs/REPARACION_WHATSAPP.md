# Reparación de WhatsApp — 6 de octubre de 2026

## Antes

La conexión devolvía ERROR. El túnel público anterior no resolvía correctamente y sus registros indicaban `Tunnel not found`. La clave configurada en Supabase no coincidía con la del contenedor Evolution activo. Además, el secreto del webhook remoto no coincidía con el token de la URL configurada en Evolution.

## Cambios realizados

- Se recuperó el acceso público a Evolution mediante `dental-cloudflared-recovery`, conservando el contenedor original detenido, sin eliminarlo. El nuevo contenedor tiene reinicio automático.
- Se alinearon únicamente los secretos remotos `EVOLUTION_API_URL`, `EVOLUTION_API_KEY` y `EVOLUTION_WEBHOOK_SECRET` con la instancia existente. No se publicaron claves en Angular.
- Se alinearon URL y clave en el archivo privado `/home/charles/Documentos/dental final/supabase/functions/.env`, con permisos 0600. Este backend está fuera de la copia del frontend auditada.
- Se pausó temporalmente el trabajo `dental-whatsapp-dispatch` y se restauró su estado activo original después de comprobar que los mensajes seguían intactos.
- Se inició `dental-americana-whatsapp-preview` con la imagen existente `dental-americana:flujo-validado`, accesible en http://localhost:4173/sistema/seguimientos.

Se conservaron módulos, rutas, endpoints, instancia Evolution, volúmenes, tablas, mensajes, roles y permisos, incluido el administrador odontólogo. No se enviaron mensajes, se reintentaron fallidos ni se desplegaron nuevas funciones durante esta reparación.

## Comprobaciones

- Evolution mediante el túnel: HTTP 200 con autenticación válida.
- Edge Function de sesión: pasó de ERROR a DESCONECTADO; la acción de conexión devolvió CONECTANDO con QR disponible.
- Webhook: HTTP 200 con el token configurado y HTTP 401 con un token inválido. Se usó un evento de prueba ignorado por el manejador, sin crear mensajes.
- Despachador: restaurado al estado activo previo.
- Mensajes antes y después: 92 ENVIADO, 10 CANCELADO, 9 FALLIDO; ningún PENDIENTE ni EN_PROCESO en la comprobación.
- Vista local: HTTP 200; contenedores de Evolution, túnel de recuperación y frontend en ejecución.

Esta intervención cambió configuración operativa y documentación, sin modificar código de aplicación. No se volvieron a ejecutar build, linter ni tests en este grupo; la validación anterior del frontend queda registrada en `VALIDACION_FLUJO_COMPLETO.md`.

## Pendiente

El usuario decidió vincular el teléfono después. Abrir Seguimientos → Conectar WhatsApp → Conectar y generar QR; en el teléfono, WhatsApp → Dispositivos vinculados → Vincular dispositivo. Generar un QR nuevo si el anterior venció. Hasta vincular el teléfono, no se puede afirmar que el envío y recepción reales estén operativos; todavía no se probaron.

Los 9 mensajes fallidos se conservaron para revisión, sin reintento automático durante la reparación.

El acceso público recuperado utiliza un **Quick Tunnel temporal**. Su URL puede cambiar al reiniciarlo y no tiene garantía de disponibilidad. Para uso permanente hace falta un túnel administrado con dominio estable y actualizar su URL en la configuración del servidor. Véase la [documentación oficial de Cloudflare](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/).

El despachador vuelve a estar activo: los futuros mensajes elegibles seguirán el comportamiento existente cuando el teléfono esté vinculado.
