# WhatsApp con un número — 6 de octubre de 2026

## Estado actual — 29 de octubre de 2026

DentalIA fue retirado tanto de Seguimientos como del módulo copiloto. El webhook publicado ya no
enruta mensajes al bot, el endpoint antiguo responde HTTP 410 y se retiraron los endpoints remotos
del copiloto. El consultorio conserva una única conexión de WhatsApp para conversaciones, citas y
seguimientos. Se mantienen los datos y tablas históricas de DentalIA; no se borraron registros.

El teléfono todavía debe vincularse desde **Seguimientos → Configuración → Conectar WhatsApp**.
Escanea el QR en el WhatsApp de la clínica, en **Dispositivos vinculados**. Hasta hacerlo, no se
puede afirmar que el envío y la recepción reales estén operativos.

El registro siguiente documenta el estado anterior al retiro de DentalIA. Sus pasos y resultados
son históricos; no describen la configuración actual.

Por solicitud del usuario, se retiró el acceso al chatbot DentalIA de Seguimientos. El doctor utiliza una única conexión de WhatsApp para conversaciones con pacientes, citas y seguimientos. DentalIA permanecía en `/sistema/copiloto`.

## Cambios

- `follow-up-center.html` y `.ts`: se retiró el panel del bot y su import. Configuración conserva una sola entrada para conectar el número de la clínica.
- `whatsapp-webhook/handler.ts`: con el bot desactivado, la recepción de pacientes no consulta ni intercepta contactos de DentalIA.
- `dentalia-whatsapp-session/index.ts`: bloquea las solicitudes de conexión del bot con HTTP 403 cuando está desactivado.
- `whatsapp-webhook/handler_test.ts`: verifica que el flujo de pacientes continúe sin consultar ni responder DentalIA.
- README y documentos históricos: indican la desactivación actual.

Se desplegaron las dos funciones afectadas y se estableció `DENTALIA_WHATSAPP_ENABLED=false`. No se borraron tablas, registros, roles, rutas ni el módulo de DentalIA dentro de la aplicación. Se conservaron las fuentes históricas del bot.

## Verificación

Lint, comprobación de tipos, 266 pruebas del frontend y compilación correctos. Las pruebas del backend pasaron: 16, sin fallos. Se comprobó el estado remoto desactivado y el bloqueo HTTP 403 del endpoint de conexión del bot. La compilación conserva un aviso de tamaño CSS en Seguimientos: 23,51 kB frente al objetivo de 22 kB.

Vista local actualizada: http://localhost:4173/sistema/seguimientos. Imagen `dental-americana:whatsapp-un-numero`; versión anterior conservada para recuperación. La vinculación física del WhatsApp de la clínica requiere escanear el QR desde el teléfono del doctor. No se enviaron mensajes ni se reintentaron envíos durante estas comprobaciones.
