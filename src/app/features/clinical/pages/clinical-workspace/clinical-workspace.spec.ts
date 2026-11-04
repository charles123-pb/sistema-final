import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, ParamMap } from '@angular/router';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { AppointmentApiService } from '../../../appointments/data-access/appointment-api.service';
import { Appointment } from '../../../appointments/models/appointment.models';
import { PatientApiService } from '../../../patients/data-access/patient-api.service';
import { ClinicalApiService } from '../../data-access/clinical-api.service';
import { ClinicalEncounter } from '../../models/clinical.models';
import { ClinicalWorkspace } from './clinical-workspace';

describe('Atención: continuidad y protección del paciente', () => {
  const encounter = { id: 3, patientId: 8, appointmentId: 42, status: 'BORRADOR', version: 1 } as ClinicalEncounter;
  let page: ClinicalWorkspace;
  let context: Record<string, string>;
  let queryParams: BehaviorSubject<ParamMap>;
  let start: ReturnType<typeof vi.fn>;
  let get: ReturnType<typeof vi.fn>;
  let update: ReturnType<typeof vi.fn>;
  let finalize: ReturnType<typeof vi.fn>;
  let getAppointment: ReturnType<typeof vi.fn>;
  let listAppointments: ReturnType<typeof vi.fn>;
  let response: Subject<ClinicalEncounter>;

  beforeEach(() => {
    context = {};
    queryParams = new BehaviorSubject(convertToParamMap(context));
    response = new Subject();
    start = vi.fn(() => response.asObservable());
    get = vi.fn(() => of(encounter));
    update = vi.fn((_id, payload) => of({ ...encounter, ...payload, version: 2 }));
    finalize = vi.fn(() => of({ ...encounter, status: 'FINALIZADA', version: 3 }));
    getAppointment = vi.fn(() => of({ id: 42, patientId: 8 } as Appointment));
    listAppointments = vi.fn(() => of([] as Appointment[]));
    TestBed.configureTestingModule({ providers: [
      { provide: ActivatedRoute, useValue: { get queryParamMap() { queryParams.next(convertToParamMap(context)); return queryParams.asObservable(); } } },
      { provide: AuthService, useValue: { hasPermission: () => true } },
      { provide: ClinicalApiService, useValue: { get, start, update, finalize, search: () => of([]) } },
      { provide: AppointmentApiService, useValue: { get: getAppointment, list: listAppointments } },
      { provide: PatientApiService, useValue: { get: () => of({ id: 8, allergies: [] }) } },
    ] });
    page = TestBed.runInInjectionContext(() => new ClinicalWorkspace());
  });
  afterEach(() => vi.restoreAllMocks());

  it('permite retomar una consulta sin cita sin crear otro borrador', () => {
    const walkIn = { ...encounter, appointmentId: undefined };
    page.encounters.set([walkIn]);
    page.startWalkIn({ id: 8 } as never);
    expect(page.walkInEncounters().map((item) => item.id)).toEqual([3]);
    expect(page.current()?.id).toBe(3);
    expect(start).not.toHaveBeenCalled();
  });

  it('retoma la atención exacta al volver desde odontograma, tratamiento o caja', () => {
    context = { encounterId: '3', appointmentId: '42' };
    page.ngOnInit();
    expect(get).toHaveBeenCalledWith(3);
    expect(page.current()?.id).toBe(3);
    expect(start).not.toHaveBeenCalled();
    expect(getAppointment).not.toHaveBeenCalled();
  });
  it('abre la cita enviada por Mi jornada', () => {
    context = { appointmentId: '42' };
    page.ngOnInit();
    expect(getAppointment).toHaveBeenCalledWith(42);
    expect(start).toHaveBeenCalledWith(8, 42);
    response.next(encounter);
    expect(page.current()?.appointmentId).toBe(42);
  });
  it('no pierde un borrador al cancelar el cambio de paciente', () => {
    page.open(encounter);
    page.form.controls.diagnosis.setValue('Texto pendiente');
    page.form.markAsDirty();
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    page.open({ ...encounter, id: 4, patientId: 9 });
    page.close();
    page.openAppointment({ id: 43, patientId: 9 } as Appointment);
    expect(page.current()?.id).toBe(3);
    expect(page.form.controls.diagnosis.value).toBe('Texto pendiente');
    expect(start).not.toHaveBeenCalled();
  });
  it('bloquea el cierre mientras el servidor procesa la atención', () => {
    page.open(encounter);
    page.saving.set(true);
    page.close();
    expect(page.current()?.id).toBe(3);
  });
  it('no reinicia la ficha al pulsar otra vez la cita actual', () => {
    page.open(encounter);
    page.form.controls.diagnosis.setValue('Texto pendiente');
    page.form.markAsDirty();
    page.openAppointment({ id: 42, patientId: 8 } as Appointment);
    expect(page.form.controls.diagnosis.value).toBe('Texto pendiente');
    expect(start).not.toHaveBeenCalled();
  });
  it('mantiene disponible la atención cuando falla la carga de las citas', () => {
    listAppointments.mockReturnValue(throwError(() => new Error('Agenda sin respuesta')));
    page.ngOnInit();
    expect(page.loading()).toBe(false);
    expect(page.workdayWarning()).toContain('No se pudieron cargar las citas');
    page.open(encounter);
    expect(page.current()?.id).toBe(3);
  });
  it('guarda la historia antes de abrir el presupuesto', () => {
    page.open(encounter);
    page.form.controls.diagnosis.setValue('Cambio pendiente');
    page.form.markAsDirty();
    page.setSection('plan');
    expect(update).toHaveBeenCalledWith(3, expect.objectContaining({ diagnosis: 'Cambio pendiente', version: 1 }));
    expect(page.section()).toBe('plan');
    expect(page.form.dirty).toBe(false);
  });
  it('no cambia de sección cuando el borrador contiene un valor inválido', () => {
    page.open(encounter);
    page.form.controls.temperature.setValue(70);
    page.form.markAsDirty();
    page.setSection('odontogram');
    expect(update).not.toHaveBeenCalled();
    expect(page.section()).toBe('history');
    expect(page.tab()).toBe('vitals');
    expect(page.error()).toContain('fuera de rango');
  });
  it('conserva la historia en pantalla si falla el guardado al cambiar de sección', () => {
    page.open(encounter);
    page.form.controls.diagnosis.setValue('Cambio pendiente');
    page.form.markAsDirty();
    update.mockReturnValue(throwError(() => new Error('Red sin respuesta')));
    page.setSection('plan');
    expect(page.section()).toBe('history');
    expect(page.form.dirty).toBe(true);
    expect(page.form.controls.diagnosis.value).toBe('Cambio pendiente');
  });
  it('lleva al primer campo pendiente al finalizar', () => {
    page.open(encounter);
    page.tab.set('closure');
    page.finalize();
    expect(page.tab()).toBe('anamnesis');
    expect(page.error()).toContain('Motivo de consulta');
    expect(finalize).not.toHaveBeenCalled();
  });
  it('guarda los cambios y finaliza con la versión actualizada en un solo paso', () => {
    page.open(encounter);
    page.form.patchValue({ consultationReason: 'Dolor', dentalExam: 'Caries', diagnosis: 'Caries dental', workPlan: 'Restauración', patientConsent: true });
    page.form.markAsDirty();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    page.finalize();
    expect(update).toHaveBeenCalledOnce();
    expect(finalize).toHaveBeenCalledWith(3, 2);
    expect(page.current()?.status).toBe('FINALIZADA');
  });
  it('abre otra atención cuando cambia la URL sin recrear la pantalla', () => {
    context = { encounterId: '3' };
    page.ngOnInit();
    get.mockReturnValue(of({ ...encounter, id: 4, patientId: 9 }));
    queryParams.next(convertToParamMap({ encounterId: '4' }));
    expect(get).toHaveBeenLastCalledWith(4);
    expect(page.current()?.id).toBe(4);
  });
  it('ignora una atención anterior que responde después de la nueva URL', () => {
    const oldResponse = new Subject<ClinicalEncounter>();
    context = { encounterId: '3' };
    get.mockReturnValueOnce(oldResponse.asObservable());
    page.ngOnInit();
    get.mockReturnValue(of({ ...encounter, id: 4, patientId: 9 }));
    queryParams.next(convertToParamMap({ encounterId: '4' }));
    oldResponse.next(encounter);
    expect(page.current()?.id).toBe(4);
  });
  it('una respuesta del enlace no reemplaza al paciente elegido manualmente', () => {
    const oldResponse = new Subject<ClinicalEncounter>();
    context = { encounterId: '3' };
    get.mockReturnValueOnce(oldResponse.asObservable());
    page.ngOnInit();
    page.open({ ...encounter, id: 4, patientId: 9 });
    oldResponse.next(encounter);
    expect(page.current()?.id).toBe(4);
  });
  it('no reabre una atención cerrada cuando llega tarde la respuesta del enlace', () => {
    const oldResponse = new Subject<ClinicalEncounter>();
    context = { encounterId: '3' };
    get.mockReturnValueOnce(oldResponse.asObservable());
    page.ngOnInit();
    page.close();
    oldResponse.next(encounter);
    expect(page.current()).toBeNull();
  });
  it('conserva el borrador si se cancela el cambio de atención desde la URL', () => {
    context = { encounterId: '3' };
    page.ngOnInit();
    page.form.controls.diagnosis.setValue('Pendiente');
    page.form.markAsDirty();
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    get.mockReturnValue(of({ ...encounter, id: 4 }));
    queryParams.next(convertToParamMap({ encounterId: '4' }));
    expect(page.current()?.id).toBe(3);
    expect(page.form.controls.diagnosis.value).toBe('Pendiente');
  });
  it('rechaza identificadores de cita fraccionarios', () => {
    context = { appointmentId: '42.5' };
    page.ngOnInit();
    expect(getAppointment).not.toHaveBeenCalled();
    expect(start).not.toHaveBeenCalled();
  });
  it('ignora errores de una carga de jornada reemplazada', () => {
    const oldResponse = new Subject<Appointment[]>();
    listAppointments.mockReturnValueOnce(oldResponse.asObservable());
    page.loadWorkday();
    page.loadWorkday();
    oldResponse.error(new Error('Error tardío'));
    expect(page.workdayWarning()).toBe('');
    expect(page.loading()).toBe(false);
  });

  it('presenta siete pasos conservando signos vitales dentro de evaluación', () => {
    expect(page.steps.map((step) => step.tab)).toEqual([
      'anamnesis', 'risks', 'exam', 'assessment', 'consent', 'procedure', 'closure',
    ]);
    page.setTab('vitals');
    expect(page.activeTab()).toBe('exam');
    expect(page.tabNumber()).toBe(3);
  });
  it('separa consentimiento, procedimiento y cierre en la navegación', () => {
    page.setTab('assessment');
    page.moveTab(1);
    expect(page.tab()).toBe('consent');
    page.moveTab(1);
    expect(page.tab()).toBe('procedure');
    page.moveTab(1);
    expect(page.tab()).toBe('closure');
  });
  it('incorpora la revisión al relato sin reemplazar lo existente y la envía al backend', () => {
    page.open(encounter);
    page.form.controls.chronologicalStory.setValue('Relato previo');
    page.noteDrafts.risks.patchValue({ review: 'Medicamentos confirmados', assessment: 'Interconsulta solicitada' });
    page.incorporateNote('risks');
    expect(page.form.controls.chronologicalStory.value).toContain('Relato previo');
    expect(page.form.controls.chronologicalStory.value).toContain('Medicamentos confirmados');
    expect(page.hasUnsavedChanges()).toBe(true);
    expect(page.noteDrafts.risks.controls.review.value).toBe('');
    page.save();
    expect(update).toHaveBeenCalledWith(3, expect.objectContaining({ chronologicalStory: expect.stringContaining('Interconsulta solicitada') }));
  });
  it('documentar rechazo no marca automáticamente conformidad ni cambia el plan anterior', () => {
    page.open(encounter);
    page.form.controls.workPlan.setValue('Plan anterior');
    page.form.controls.patientConsent.setValue(false);
    page.noteDrafts.consent.patchValue({ procedure: 'Tratamiento explicado', decision: 'Paciente decide posponer' });
    page.incorporateNote('consent');
    expect(page.form.controls.workPlan.value).toContain('Plan anterior');
    expect(page.form.controls.workPlan.value).toContain('Paciente decide posponer');
    expect(page.form.controls.patientConsent.value).toBe(false);
  });
  it('incorpora el registro quirúrgico a la evolución, sin confundirlo con el plan', () => {
    page.open(encounter);
    page.form.controls.evolution.setValue('Evolución previa');
    page.form.controls.workPlan.setValue('Plan propuesto');
    page.noteDrafts.procedure.patchValue({ anesthesia: 'Anestesia documentada', technique: 'Procedimiento de prueba', incidents: 'Incidencia registrada' });
    page.incorporateNote('procedure');
    expect(page.form.controls.evolution.value).toContain('Evolución previa');
    expect(page.form.controls.evolution.value).toContain('Registro de procedimiento quirúrgico');
    expect(page.form.controls.evolution.value).toContain('Incidencia registrada');
    expect(page.form.controls.workPlan.value).toBe('Plan propuesto');
  });
  it('conserva el texto preparado si el registro completo excede el límite', () => {
    page.open(encounter);
    page.form.controls.evolution.setValue('x'.repeat(3990));
    page.noteDrafts.procedure.controls.technique.setValue('Texto pendiente');
    page.incorporateNote('procedure');
    expect(page.form.controls.evolution.value).toBe('x'.repeat(3990));
    expect(page.noteDrafts.procedure.controls.technique.value).toBe('Texto pendiente');
    expect(page.error()).toContain('4000');
  });
  it('protege notas preparadas al cambiar de paciente y al guardar', () => {
    page.open(encounter);
    page.noteDrafts.consent.controls.decision.setValue('Texto pendiente');
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    page.open({ ...encounter, id: 4 });
    expect(page.current()?.id).toBe(3);
    page.setSection('plan');
    expect(update).not.toHaveBeenCalled();
    expect(page.section()).toBe('history');
    expect(page.tab()).toBe('consent');
    expect(page.noteDrafts.consent.controls.decision.value).toBe('Texto pendiente');
  });
  it('respeta la cancelación del descarte de una nota preparada', () => {
    page.open(encounter);
    page.noteDrafts.risks.controls.review.setValue('Revisión pendiente');
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    page.discardNote('risks');
    expect(page.noteDrafts.risks.controls.review.value).toBe('Revisión pendiente');
  });
  it('no permite registrar revisión si no se recuperó la ficha', () => {
    page.open(encounter);
    page.patient.set(null);
    page.noteDrafts.risks.controls.review.setValue('Revisión');
    page.incorporateNote('risks');
    expect(page.form.controls.chronologicalStory.value).toBe('');
    expect(page.noteDrafts.risks.controls.review.value).toBe('Revisión');
  });
  it('respeta el modo de solo lectura al preparar notas', () => {
    page.open({ ...encounter, status: 'FINALIZADA' });
    page.noteDrafts.procedure.controls.technique.setValue('Texto');
    page.incorporateNote('procedure');
    expect(page.form.controls.evolution.value).toBe('');
  });

  it('la conversación no sustituye un plan propuesto que todavía está vacío', () => {
    page.open(encounter);
    page.noteDrafts.consent.controls.decision.setValue('Decisión pendiente');
    page.incorporateNote('consent');
    expect(page.form.controls.workPlan.value).toBe('');
    expect(page.noteDrafts.consent.controls.decision.value).toBe('Decisión pendiente');
    expect(page.tab()).toBe('assessment');
    expect(page.error()).toContain('plan propuesto');
  });

});
