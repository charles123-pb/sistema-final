# Conversaciones de WhatsApp — 6 de octubre de 2026

La bandeja conserva la conexión única de la clínica y todos los chats, mensajes, rutas y permisos existentes. DentalIA por WhatsApp fue retirado; sus registros históricos se conservaron.

## Cambios

- Filtros Todos, Sin leer y Pendientes. Pendientes incluye conversaciones no cerradas cuyo último mensaje es entrante o cuyo estado es DERIVADA. Leer el mensaje no equivale a responderlo.
- El filtro se aplica a las conversaciones cargadas y a la búsqueda vigente. Cuando hay páginas adicionales, se indica «Hay más por cargar» y se conserva Mostrar más conversaciones. No se presentan los contadores como totales del servidor.
- La lista muestra fecha y hora, identifica los últimos mensajes salientes con «Tú:» y señala los pendientes de atención.
- Respuestas rápidas de saludo, confirmación de cita, reprogramación y seguimiento. Solo preparan texto editable y lo añaden al borrador sin reemplazarlo. Confirmación requiere una cita existente y usa hora de Perú; reprogramación no altera la agenda. No se añaden instrucciones clínicas automáticas.
- El estado de los mensajes salientes aparece en texto, además de los iconos existentes. Se conservan los reintentos manuales de mensajes fallidos.

## Archivos

`follow-up-center.ts`: filtros calculados y preparación de borradores con protección del límite de 4000 caracteres.

`follow-up-center.html`: integración de controles, fechas, etiquetas y estados; se conserva el espacio del historial y del editor.

`components/inbox-tools/inbox-tools.ts`: controles reutilizables con estilos propios y estados accesibles, sin aumentar el CSS principal.

`follow-up-center.spec.ts`: casos de filtros, conservación de borradores, ausencia de envío automático, fecha peruana y límite de longitud.

No se cambiaron contratos de API ni el esquema de la base de datos. La ubicación no se incluyó en respuestas rápidas: conviene obtenerla de una configuración única del consultorio antes de automatizar ese texto. El cierre de conversaciones permanece con su comportamiento existente; no se agregó una marca de atención que desaparezca al recargar.

## Verificación realizada

- Lint y comprobación de tipos correctos; 269 pruebas en 42 archivos, sin fallos; compilación correcta.
- Navegador con sesión real y conversaciones simuladas: filtros, conservación del borrador, fecha peruana, vista de 390 px sin desbordamiento y cero errores de página. No se enviaron mensajes ni se modificaron pacientes.
- Configuración de nginx y `git diff --check` correctos.
- Persiste el aviso previo de CSS en Seguimientos (23,51 kB frente al objetivo de 22 kB); no se aumentó el presupuesto.

Vista local actualizada en http://localhost:4173/sistema/seguimientos. Imagen `dental-americana:conversaciones-mejoradas`; la imagen y el contenedor anteriores se conservaron para recuperación.
