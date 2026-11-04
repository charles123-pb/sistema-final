# DentalIA dentro del sistema — 6 de octubre de 2026

**Documento histórico:** el módulo DentalIA se retiró de la aplicación el 29 de octubre de 2026.
Se conservaron los datos y las tablas existentes.

## Cambios

Se agregó el resumen del consultorio mediante consultas de solo lectura a las RPC existentes: `listar_citas`, `resumen_finanzas`, `listar_cuentas` y `listar_seguimientos`. Se consulta al pulsar Ver resumen del día o Actualizar resumen. No hay consultas periódicas adicionales ni cambios de datos desde estas respuestas.

Agenda y cobros corresponden a hoy en hora de Perú. Los saldos y seguimientos son el estado actual de todas las fechas, indicado expresamente. Los ingresos se toman del resumen financiero existente, ajustado por anulaciones; no se presentan como utilidad ni como deuda. Las citas canceladas o no asistidas no se cuentan como citas activas de hoy. Las cuentas anuladas no se suman a saldos pendientes. Los seguimientos ALERTA y RESPONDIDO se presentan para revisión.

Las preguntas rápidas operativas usan estos mismos datos, sin llamar al proveedor de IA. Se muestra período, hora de consulta y enlaces a los módulos fuente. Las listas incluyen identificadores de cita, cuenta o seguimiento y hasta 10 registros, indicando cuándo hay más. No se inventaron rutas a registros que el sistema no admite.

Una consulta fallida o sin permiso se muestra como no disponible, sin sustituirla por cero. Las otras secciones pueden conservar sus resultados verificados. Se consultan por separado; el resumen no pretende ser una transacción simultánea. Las preguntas de otras fechas no se convierten silenciosamente en consultas de hoy: se deriva a Agenda o Finanzas para seleccionar fechas.

Las respuestas conversacionales sin referencias verificables se identifican expresamente. El chat de la atención seleccionada y los borradores clínicos con revisión/aprobación profesional se conservan. No se añadieron decisiones clínicas automáticas ni acciones de guardado o envío desde el resumen. DentalIA por WhatsApp permanece desactivado; el consultorio utiliza un número.

## Archivos principales

- `operational-summary.service.ts`: reconocimiento de consultas operativas, períodos en Perú, permisos, lecturas y manejo de resultados parciales.
- `components/daily-summary.ts`: resumen y presentación de fuentes con estilos independientes.
- `copilot-workspace.ts` y `.html`: preguntas rápidas e integración con el chat existente.
- `copilot.models.ts`: referencias opcionales; se conserva la compatibilidad con respuestas del endpoint existente.
- Especificaciones del servicio y la pantalla: fechas, permisos, datos incompletos, fuentes y conservación del chat clínico.

Se verificaron las cuatro RPC con la sesión del doctor y sus controles de permiso en el servidor. No se modificaron endpoints, tablas, columnas, roles ni integraciones.

## Límites

Las consultas rápidas operativas cubren hoy y el estado actual de la clínica; no son un motor de preguntas arbitrarias por paciente o por fecha. Las acciones nuevas de crear citas o enviar mensajes desde el chat siguen pendientes de un diseño de revisión y confirmación. La preparación y aprobación de borradores clínicos existentes permanece disponible.

## Verificación final

Lint y comprobación de tipos correctos. Pasaron 278 pruebas en 43 archivos y la compilación. Persiste únicamente el aviso previo de tamaño CSS en Seguimientos: 23,51 kB frente al objetivo de 22 kB; no se aumentó el presupuesto.

En navegador, con la sesión del doctor, se comprobó el resumen con las cuatro consultas reales y enlaces a sus fuentes. Las preguntas operativas no llamaron al proveedor de IA. Una consulta de ayer se identificó como no realizada; un fallo de Finanzas simulado apareció como no disponible y conservó las otras tres secciones verificadas. Vista de 390 px sin desbordamiento y cero errores de página. No se guardaron datos clínicos ni se enviaron mensajes de WhatsApp durante estas pruebas.

Nginx y `git diff --check` correctos. Vista local: http://localhost:4173/sistema/copiloto. Imagen `dental-americana:dentalia-resumen-verificable`; la versión previa se conservó para recuperación. No se publicó en un alojamiento externo ni se desplegaron nuevas funciones remotas.
