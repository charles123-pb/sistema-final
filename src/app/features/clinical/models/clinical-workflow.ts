import type { ClinicalNoteField } from '../components/clinical-note-builder/clinical-note-builder';

export type ClinicalTab = 'anamnesis' | 'risks' | 'vitals' | 'exam' | 'assessment' | 'consent' | 'procedure' | 'closure';
export type ClinicalNoteKind = 'risks' | 'consent' | 'procedure';
export const CLINICAL_STEPS: { tab: Exclude<ClinicalTab, 'vitals'>; label: string }[] = [
  { tab: 'anamnesis', label: 'Identificación y motivo' },
  { tab: 'risks', label: 'Antecedentes y riesgos' },
  { tab: 'exam', label: 'Evaluación clínica' },
  { tab: 'assessment', label: 'Diagnóstico y plan' },
  { tab: 'consent', label: 'Información y consentimiento' },
  { tab: 'procedure', label: 'Procedimiento realizado' },
  { tab: 'closure', label: 'Indicaciones y cierre' },
];
export const CLINICAL_NOTE_FIELDS: Record<ClinicalNoteKind, readonly ClinicalNoteField[]> = {
  risks: [
    { name: 'review', label: 'Antecedentes, alergias y medicamentos revisados', placeholder: 'Documenta qué confirmó el paciente y qué información se actualizó.' },
    { name: 'assessment', label: 'Valoración de riesgos y decisiones', placeholder: 'Riesgos relevantes, precauciones o necesidad de interconsulta según tu evaluación.' },
  ],
  consent: [
    { name: 'procedure', label: 'Procedimiento explicado', placeholder: 'Tratamiento propuesto y alcance de la explicación.' },
    { name: 'alternatives', label: 'Alternativas explicadas', placeholder: 'Opciones discutidas, incluida la posibilidad de no realizar el tratamiento.' },
    { name: 'risks', label: 'Riesgos y beneficios explicados', placeholder: 'Información específica del procedimiento y del paciente.' },
    { name: 'decision', label: 'Preguntas y decisión del paciente', placeholder: 'Aceptación, rechazo o decisión pendiente; documenta la conversación.' },
  ],
  procedure: [
    { name: 'preoperative', label: 'Evaluación preoperatoria', placeholder: 'Evaluación y comprobaciones realizadas antes de la intervención.' },
    { name: 'anesthesia', label: 'Anestesia', placeholder: 'Técnica, medicamento, concentración, cantidad y respuesta, cuando corresponda.' },
    { name: 'technique', label: 'Intervención y piezas tratadas', placeholder: 'Procedimiento realmente realizado, localización y técnica.' },
    { name: 'incidents', label: 'Incidencias y evolución inmediata', placeholder: 'Hallazgos, incidencias, complicaciones y medidas tomadas, o su ausencia si se verificó.' },
    { name: 'postoperative', label: 'Indicaciones posoperatorias', placeholder: 'Cuidados, prescripción cuando corresponda, signos de alarma y seguimiento.' },
  ],
};
export const CLINICAL_NOTE_TITLES: Record<ClinicalNoteKind, string> = {
  risks: 'Revisión de antecedentes y valoración de riesgos',
  consent: 'Información y decisión del paciente sobre el tratamiento',
  procedure: 'Registro de procedimiento quirúrgico',
};

export function buildClinicalNote(kind: ClinicalNoteKind, values: Record<string, unknown>): string {
  const lines = CLINICAL_NOTE_FIELDS[kind].flatMap((field) => {
    const value = values[field.name];
    return typeof value === 'string' && value.trim() ? [`${field.label}: ${value.trim()}`] : [];
  });
  return lines.length ? `${CLINICAL_NOTE_TITLES[kind]}\n${lines.join('\n')}` : '';
}
