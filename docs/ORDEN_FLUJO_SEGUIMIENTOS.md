# Orden del flujo de Seguimientos — 6 de octubre de 2026

**Documento histórico:** describe la interfaz anterior al retiro de DentalIA del 29 de octubre de 2026. No seguir aquí los pasos de DentalIA ni de su conexión dedicada. La conexión clínica de un solo número permanece; véase [WhatsApp con un número](WHATSAPP_UN_NUMERO.md).

## Antes

Había cuatro accesos al mismo diálogo de conexión: encabezado, tarjeta de resumen, cabecera de automatizaciones y aviso de desconexión. El resumen también repetía accesos a la lista y a la revisión de seguimientos. Nuevo mensaje, sincronización y DentalIA se mostraban fuera de su contexto.

En la ficha del paciente, Confirmar cita, Reprogramar y Crear cita apuntaban a la misma ruta de agenda. «Enviar mensaje» solo preparaba un saludo, sin enviarlo.

## Ahora

1. **Conversaciones:** buscar paciente, leer y responder; Nuevo mensaje y Sincronizar chats aparecen únicamente aquí.
2. **Seguimientos:** resumen informativo sin botones, filtros por estado y revisión profesional. La actualización de seguimientos permanece en esta sección.
3. **Configuración:** un único acceso a la conexión del WhatsApp de la clínica, acceso a DentalIA privado y controles de automatización.

El estado de WhatsApp del encabezado es informativo. El aviso de desconexión explica el estado, sin repetir otro botón. La conexión de DentalIA con número propio sigue siendo independiente y se administra dentro de su diálogo.

Las tres entradas idénticas a la agenda se reúnen en Gestionar citas: la agenda conserva crear, confirmar y reprogramar. Preparar saludo describe con precisión su efecto; el envío real sigue en el compositor.

## Conservación y archivos

Se modificaron únicamente `follow-up-center.html` y `follow-up-center.css`, más este informe. Se consolidaron accesos visuales equivalentes; permanecen funciones, filtros, permisos, rutas, endpoints, tablas, integraciones, mensajes y controles. No se cambió código de backend ni se desplegaron funciones remotas en este grupo.

## Verificación

- Linter y tipos: correctos.
- 266 tests aprobados en 42 archivos.
- Build correcto; aviso de CSS de Seguimientos de 23,51 kB frente al objetivo de 22 kB, por debajo del límite de error de 24 kB. No se ampliaron los presupuestos.
- Chromium con cuenta de prueba: un acceso principal de conexión en Configuración, resumen sin botones, una entrada al filtro Por revisar, acciones de chat solo en Conversaciones y DentalIA solo en Configuración. Ambos diálogos abren y cierran correctamente.
- Móvil de 390 px sin desbordamiento; cero errores JavaScript registrados. No se enviaron mensajes, se generaron QR ni se modificaron automatizaciones durante la comprobación.
- Nginx válido; imagen local `dental-americana:seguimientos-ordenados`. El contenedor anterior se conserva detenido como `dental-americana-dentalia-numero-propio-preview-anterior`.

Vista local actualizada: http://localhost:4173/sistema/seguimientos. La vinculación física de WhatsApp y el segundo número para DentalIA siguen pendientes.
