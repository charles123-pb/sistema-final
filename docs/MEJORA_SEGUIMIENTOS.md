# Diseño y flujo de Seguimientos — 6 de octubre de 2026

La pantalla ahora presenta un resumen de pendientes, accesos directos a la revisión postconsulta y el estado de conexión del consultorio. Se mantienen conversaciones, mensajes nuevos, reintentos, sincronización, automatizaciones y vinculación por QR.

El seguimiento postconsulta permite consultar todos los registros o filtrar por revisión pendiente, programados/enviados y revisados/cerrados. Las alertas aparecen antes que las respuestas; después se muestran los estados restantes y la fecha programada. El orden visual no modifica los registros del servidor ni sus estados. Marcar revisado conserva la confirmación profesional y el permiso existente.

Se mejoraron tamaños de texto, tarjetas de estado, búsqueda, foco de teclado y etiquetas accesibles. En móvil, al seleccionar una conversación, la ficha y las acciones del paciente se muestran debajo del chat. No se modificaron rutas, tablas, roles ni contratos de API.

Archivos: `follow-up-center.ts/html/css` implementan resumen, filtros y adaptación de la bandeja; `followup-queue.ts/html/css` separan la presentación postconsulta; `follow-up-center.spec.ts` verifica que el filtro conserva todos los estados y que el orden original no cambia.

La vinculación del teléfono sigue pendiente. Esta mejora de interfaz no activa automatizaciones ni envía mensajes.

## Verificación

- Linter y chequeo de tipos: correctos.
- Tests: 263 aprobados en 41 archivos, incluido el nuevo caso de prioridad y filtros.
- Build: correcto. Permanece un aviso: CSS del contenedor 22,97 kB frente al objetivo de 22 kB, por debajo del límite de error de 24 kB. No se ampliaron los presupuestos de compilación.
- Chromium con cuenta de prueba: login, filtros, cambio de sección y apertura del diálogo de conexión correctos. Vista de 390 px sin desbordamiento horizontal y sin errores JavaScript registrados. No se enviaron mensajes ni se activaron automatizaciones.
- Nginx: configuración válida.

Vista local actualizada: http://localhost:4173/sistema/seguimientos. Imagen `dental-americana:seguimientos-mejorados`. El contenedor previo se conserva detenido como `dental-americana-whatsapp-preview-anterior`, con su reinicio automático desactivado para evitar conflicto en el puerto. No se publicó un frontend externo.
