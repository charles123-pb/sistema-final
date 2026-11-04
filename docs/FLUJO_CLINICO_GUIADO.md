# Atención: recorrido clínico guiado

## Cambio realizado

Se implementó un recorrido de siete pasos conservando las pantallas, controles, permisos,
rutas y contratos existentes. Se puede acceder directamente a cualquier paso según la
consulta; no se agregó una secuencia obligatoria que impida atender urgencias.

1. Identificación, motivo y anamnesis: confirmar identidad, registrar el motivo y valorar prioridad.
2. Antecedentes y riesgos: consultar la ficha y documentar la revisión efectivamente realizada.
3. Evaluación clínica: signos vitales y antropometría, examen general/odontológico,
   estudios cuando estén indicados y acceso directo al odontograma.
4. Diagnóstico y plan: diagnóstico, propuesta, pronóstico y acceso al presupuesto/pagos.
5. Información y consentimiento: explicación, alternativas, riesgos, preguntas y decisión;
   acceso a los documentos de consentimiento en la ficha.
6. Procedimiento realizado: evolución y registro opcional de intervención quirúrgica.
7. Indicaciones y cierre: seguimiento, cierre de la consulta y alta del tratamiento diferenciados.

Los siete controles originales de signos vitales/antropometría siguen disponibles dentro
de evaluación. El identificador interno `vitals` mantiene compatibilidad y muestra ese paso.

## Persistencia y protección

Las ayudas de documentación incorporan textos identificados en los campos clínicos que
el backend ya guarda, sin sustituir el contenido previo:

| Registro preparado | Campo persistente existente |
| --- | --- |
| Revisión de antecedentes y riesgos | `chronologicalStory` |
| Conversación y decisión del paciente | `workPlan` |
| Evaluación preoperatoria, anestesia, intervención, incidencias y posoperatorio | `evolution` |

Preparar una nota no equivale a guardarla: la interfaz indica que debe incorporarse y
luego guardarse. El guard protege tanto el borrador clínico como las notas preparadas.
El guardado y el cambio hacia odontograma/presupuesto solicitan incorporar o descartar
las notas pendientes. Una incorporación que exceda 4000 caracteres conserva ambos
textos y muestra el motivo; no trunca ni sobrescribe información.

La conversación puede registrar aceptación, rechazo o decisión pendiente. Incorporarla
no marca automáticamente `patientConsent`. Para incorporar la conversación debe
existir primero el texto del plan propuesto; la preparación se conserva si falta. Ese campo conserva su contrato de conformidad
con la información registrada. La firma del presupuesto y esa casilla no se presentan
como sustitutos del consentimiento informado del procedimiento. Los documentos siguen
utilizando la integración y la ficha de archivos existentes.

No se añadieron campos clínicos que el backend ignoraría ni columnas/tablas nuevas.
Estos registros son narrativos, no una nueva estructura de datos quirúrgicos ni una
certificación legal de consentimiento. Las reglas específicas por procedimiento y
formatos institucionales necesitan validación del odontólogo responsable y soporte
explícito del backend antes de introducir nuevas obligaciones automáticas.

## Archivos modificados o añadidos

- `clinical-workspace.ts`: pasos, preparación/incorporación de notas, protección de borradores
  y retorno al paso correspondiente desde odontograma/presupuesto.
- `clinical-workspace.html`: recorrido, enlaces clínicos y distinción entre cierre y alta.
- `clinical-workspace.css`: presentación de accesos y navegación adaptable.
- `clinical-workflow.ts`: pasos, campos y formato narrativo compartidos.
- `clinical-note-builder.ts`, `.html` y `.css`: componente reutilizable para preparar registros.
- `clinical-workspace.spec.ts`: once pruebas adicionales de navegación, incorporación,
  persistencia en payload, rechazo sin conformidad automática, límites y protección de notas.

## Verificación

- Build, linter y type checking: correctos.
- Suite completa: **237 tests aprobados en 40 archivos**.
- Comparación de controles con la versión original: todos conservados, ninguno perdido.
- `git diff --check`: correcto.

## Referencias para el diseño

- [ADA: antecedentes médicos y odontológicos](https://www.ada.org/resources/practice/practice-management/medical-dental-health-history).
- [ADA: consentimiento informado](https://www.ada.org/resources/practice/practice-management/types-of-consent).
- [ADA: documentación de la atención](https://www.ada.org/resources/practice/practice-management/writing-in-the-dental-record).

Son referencias generales para el diseño del registro; no certifican cumplimiento de
requisitos locales o institucionales. No se modificaron protocolos terapéuticos.

### Prueba funcional con Supabase y Chromium

Se utilizó el proyecto que el usuario confirmó como entorno de prueba y la cuenta
facilitada para validar el recorrido sobre el build de producción local.

- Siete pasos visibles; los siete campos de signos vitales/antropometría permanecen disponibles.
- Odontograma accesible desde evaluación y regreso al mismo paso.
- Presupuesto accesible desde diagnóstico/plan y regreso al paso de información/consentimiento.
- Preparar e incorporar una conversación no cambia automáticamente la conformidad del paciente.
- Notas de riesgos, conversación y procedimiento quirúrgico guardadas y recuperadas tras recargar.
- Cancelar un cambio de paciente conserva las notas preparadas.
- Ayuda quirúrgica deshabilitada en una historia finalizada.
- Cierre y alta diferenciados; vista móvil de 390 píxeles sin desbordamiento horizontal.
- Sin errores de consola ni excepciones de página en esas comprobaciones.

Se reutilizó exclusivamente la atención 6 del paciente 5, creado previamente con la
marca `PRUEBA-ATENCION-1791206682301`. Los textos indican simulación técnica, sin
intervención clínica real. No se crearon pacientes adicionales ni se eliminaron
registros. La atención finalizada 5 se utilizó para comprobar el modo de solo lectura.

No se desplegó el sistema en un servidor externo. Los documentos de consentimiento
continúan gestionándose en la ficha existente; esta implementación no añade una nueva
firma clínica ni modifica la firma del presupuesto.
