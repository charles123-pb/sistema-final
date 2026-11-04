# Revisión técnica del módulo de atención

## Alcance y resultado

Se revisaron la jornada clínica, la apertura con cita y sin cita, la historia clínica,
el guardado de borradores, la aprobación, los permisos locales y los editores asociados
(odontograma, tratamientos y presupuesto). No se eliminaron funcionalidades ni se
modificaron rutas públicas, roles, contratos RPC o tablas.

La revisión del frontend y sus pruebas no certifica los procedimientos almacenados,
RLS, transacciones o auditoría completas: el backend no está disponible en este
repositorio. La persistencia de los flujos descritos sí fue comprobada posteriormente
con una sesión autorizada y registros sintéticos en el entorno de prueba.

## Hallazgos corregidos

| Nivel | Archivo y ubicación aproximada | Problema y consecuencia | Corrección y riesgo |
| --- | --- | --- | --- |
| Alto | `src/app/features/clinical/pages/clinical-workspace/clinical-workspace.ts`, `ngOnInit`, apertura y cierre | La URL se leía solo al iniciar el componente. Un cambio de parámetros conservaba otra atención; una petición anterior podía intentar abrir un paciente después de una selección manual. | Suscripción a parámetros de consulta y generación de peticiones para ignorar respuestas y errores anteriores. Se conserva la confirmación de borradores y el bloqueo durante guardados. Riesgo bajo; pruebas de cambio de URL, respuesta tardía, selección manual, cierre y cancelación. |
| Medio | Mismo archivo, carga inicial de enlaces | Las lecturas de cita y atención no tenían tiempo límite, y se aceptaban identificadores de cita fraccionarios. | Tiempo límite para lecturas y validación de entero positivo seguro. No se aplican reintentos automáticos a escrituras. Riesgo bajo. |
| Medio | Mismo archivo, `loadWorkday` | Los errores de una petición anterior podían mostrar una advertencia después de una actualización exitosa. | Las advertencias también comprueban la generación de carga. Riesgo bajo; prueba con error tardío. |
| Medio | `src/app/features/clinical/pages/clinical-workspace/clinical-workspace.html`, contexto del paciente | Cuando la ficha no se había cargado, no había una indicación específica de que alergias, antecedentes y medicamentos aún no estaban verificados. | Aviso explícito mientras la ficha no está disponible. No se bloquean ni cambian las reglas de atención. Riesgo bajo. |

## Comportamientos comprobados en pruebas

- Retomar un borrador sin cita sin crear otro desde la interfaz.
- Abrir la atención exacta por enlace y una cita enviada desde la jornada.
- Conservar un borrador si se cancela el cambio de paciente.
- Bloquear el cierre durante el procesamiento del servidor.
- Mantener la atención disponible aunque falle la agenda.
- Guardar la historia antes de abrir el presupuesto.
- Conservar la historia si falla ese guardado.
- Impedir guardados con valores clínicos fuera de los rangos configurados.
- Solicitar los campos esenciales antes de aprobar.
- Guardar y aprobar usando la versión actualizada.
- Los tests existentes de odontograma y tratamiento cubren edición, cambios pendientes,
  carga fallida, validaciones de procedimientos, presupuesto y errores de saldo.

## Pendientes

1. **Navegación entre rutas independientes: corregida.** Odontograma y tratamiento
   observan los cambios de `encounterId`, limpian el contexto anterior e ignoran lecturas
   tardías. El guard existente se comprobó con el router real: cancelar conserva URL y
   borrador; confirmar cambia de paciente una sola vez; un guardado bloquea la salida.
   Los editores de firmas se recrean por identidad de plan/cuenta. Una firma pendiente
   también bloquea la actualización del catálogo hasta guardar o cerrar el editor.
2. **Auditoría del backend pendiente.** La cuenta de prueba confirmó acceso con roles
   ADMINISTRADOR y ODONTOLOGO; la lectura de atención sin sesión fue rechazada. Falta
   auditar completamente permisos/RLS y validación de versión
   en `iniciar_atencion`, `actualizar_atencion` y `finalizar_atencion`, junto con el
   cierre transaccional y la relación con la cita. Los nombres y parámetros RPC
   existentes se conservaron. Las escrituras remotas de esta validación se limitaron
   a dos pacientes creados y marcados expresamente como prueba.
3. **Medio: jornada y duplicados.** Verificar con datos de prueba la zona horaria de
   la jornada y el comportamiento del backend cuando ya existe un borrador fuera
   del listado diario o se pierde la respuesta de una creación.
4. **Cobertura conectada.** Se validó login, contexto de permisos, guardado y recarga
   del borrador, creación y recarga de odontogramas/observaciones y presupuestos, y
   navegación con confirmación/cancelación en Chromium. También se comprobó el
   guardado de la historia desde el navegador, la aprobación del odontograma y el
   cierre persistido con historia de solo lectura tras recargar. No se certificaron todos los
   roles ni WhatsApp. Firma, cobro, agenda, control y anulación se comprobaron
   posteriormente; véase `VALIDACION_FLUJO_COMPLETO.md`.

## Verificación ejecutada

- `npm run lint`: correcto.
- `npm run typecheck`: correcto.
- `npm run build`: correcto; paquete inicial 530,15 kB, dentro del presupuesto configurado.
- Suite completa: **226 tests aprobados en 40 archivos**. Se agregaron 20 pruebas
  de navegación y respuestas tardías en odontograma/tratamiento, además de las siete
  pruebas previas del módulo principal.
- `git diff --check`: correcto.

Se ejecutaron pruebas autenticadas en Chromium sobre el build de producción local,
con Supabase real en el entorno que el usuario confirmó como de prueba. No hubo
excepciones de página ni errores de consola en las comprobaciones realizadas.
No se desplegaron cambios en un servidor externo.

Registros creados y conservados, sin eliminaciones: pacientes 4 y 5, atenciones 5 y 6,
odontogramas 6 y 7, planes 5 y 6. Marca: `PRUEBA-ATENCION-1791206682301`.
Los pacientes de prueba no tienen teléfonos, correos de contacto ni consentimiento
para WhatsApp.

## Archivos cambiados en esta revisión

- `clinical-workspace.ts`: contexto de URL, protección contra respuestas tardías,
  tiempos límite y advertencias de jornada coherentes.
- `clinical-workspace.html`: estado visible del contexto clínico no disponible.
- `clinical-workspace.spec.ts`: siete pruebas de regresión.
- Este informe: resultados, alcance y pendientes.

### Corrección de navegación en editores independientes

- `odontogram-editor.ts`: suscripción a parámetros, validación del identificador,
  reinicio del contexto y protección de las dos etapas de lectura contra respuestas tardías.
- `treatment-plan.ts`: suscripción a parámetros, reinicio de formularios y cuenta,
  invalidación de lecturas de saldos y presupuestos firmados, protección de firmas al reintentar.
- `treatment-plan.html`: identidad explícita de los componentes de presupuesto firmado y pago.
- Specs de odontograma y tratamiento: mocks de rutas observables.
- `attention-navigation.spec.ts`: router real, borradores, firmas, guardados,
  fallos de carga, saldos y respuestas tardías. Las APIs se simulan en esta suite;
  las comprobaciones contra Supabase y Chromium se ejecutaron aparte.

### Validación funcional conectada

- Login desde el formulario del navegador: correcto, redirige al inicio.
- Cambios de paciente en rutas independientes: cancelar conserva el borrador y URL;
  confirmar cambia de paciente sin arrastrar texto.
- Historia clínica: guardar desde la interfaz y recargar conserva el texto.
- Regla de cierre: Supabase rechaza finalizar si hay odontogramas sin aprobar.
  Se comprobó ese rechazo; después de aprobar el odontograma desde la interfaz,
  el cierre funcionó y persistió como historia de solo lectura.
- Atención 5: finalizada; odontograma 6: aprobado. Atención 6: borrador de prueba.
- Presupuesto de la atención 6: guardar observaciones desde la interfaz y recargar
  conserva el texto. Sin errores de consola o excepciones de página.
- El flujo de cobro se comprobó posteriormente en `VALIDACION_FLUJO_COMPLETO.md`.
  Las restricciones del servidor para todos los roles siguen sin certificarse.
