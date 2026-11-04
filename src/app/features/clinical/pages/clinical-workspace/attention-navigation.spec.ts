import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, Subject } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { pendingChangesGuard } from '../../../../core/navigation/pending-changes.guard';
import { Account } from '../../../finance/models/finance.models';
import { FinanceApiService } from '../../../finance/data-access/finance-api.service';
import { OdontogramApiService } from '../../../odontogram/data-access/odontogram-api.service';
import { Odontogram } from '../../../odontogram/models/odontogram.models';
import { OdontogramEditor } from '../../../odontogram/pages/odontogram-editor/odontogram-editor';
import { TreatmentApiService } from '../../../treatments/data-access/treatment-api.service';
import { TreatmentPlan } from '../../../treatments/models/treatment.models';
import { TreatmentPlanPage } from '../../../treatments/pages/treatment-plan/treatment-plan';
import { BudgetAgreementComponent } from '../../../treatments/components/budget-agreement/budget-agreement';
import { ClinicalApiService } from '../../data-access/clinical-api.service';
import { ClinicalEncounter } from '../../models/clinical.models';

describe.each(['odontograma', 'tratamiento'] as const)('Navegación de atención: %s', (kind) => {
  let harness: RouterTestingHarness;
  let getEncounter: ReturnType<typeof vi.fn>;
  let listOdontograms: ReturnType<typeof vi.fn>;
  let listPlans: ReturnType<typeof vi.fn>;
  let accountsForPatient: ReturnType<typeof vi.fn>;
  let getPlan: ReturnType<typeof vi.fn>;
  const url = (id: number) => `/sistema/atencion/${id}/${kind}`;
  const encounter = (id: number) => ({ id, patientId: id + 100, status: 'BORRADOR' } as ClinicalEncounter);
  const plan = (id: number) => ({ id: id + 10, patientId: id + 100, status: 'BORRADOR', discount: 0, subtotal: 100, total: 100, patientName: 'Paciente de prueba', code: `PLAN-${id}`, patientAccepted: false, createdAt: '2026-10-05T10:00:00Z', updatedAt: '2026-10-05T10:00:00Z', items: [], version: 1 } as TreatmentPlan);
  const odontogram = (id: number) => ({ id: id + 20, encounterId: id, patientId: id + 100, status: 'BORRADOR', dentitionType: 'PERMANENTE', generalObservation: `Nota ${id}`, findings: [], version: 1, createdAt: '2026-10-05T10:00:00Z', updatedAt: '2026-10-05T10:00:00Z' } as Odontogram);
  const page = () => harness.routeDebugElement!.componentInstance as OdontogramEditor | TreatmentPlanPage;
  const makeDirty = () => {
    const editor = page();
    if (editor instanceof TreatmentPlanPage) {
      editor.planForm.controls.observations.setValue('Borrador pendiente');
      editor.planForm.markAsDirty();
    } else editor.observation.setValue('Borrador pendiente');
  };

  beforeEach(async () => {
    getEncounter = vi.fn((id: number) => of(encounter(id)));
    listOdontograms = vi.fn((id: number) => of([odontogram(id)]));
    listPlans = vi.fn((id: number) => of([plan(id)]));
    accountsForPatient = vi.fn(() => of([]));
    getPlan = vi.fn(() => of(plan(3)));
    TestBed.configureTestingModule({ providers: [
      provideRouter([
        { path: 'sistema/atencion/:encounterId/odontograma', component: OdontogramEditor, canDeactivate: [pendingChangesGuard] },
        { path: 'sistema/atencion/:encounterId/tratamiento', component: TreatmentPlanPage, canDeactivate: [pendingChangesGuard] },
      ]),
      { provide: AuthService, useValue: { hasPermission: () => true, authenticated: () => true } },
      { provide: ClinicalApiService, useValue: { get: getEncounter } },
      { provide: OdontogramApiService, useValue: { list: listOdontograms } },
      { provide: TreatmentApiService, useValue: { catalog: () => of([]), listByEncounter: listPlans, get: getPlan } },
      { provide: FinanceApiService, useValue: { accountsForPatient } },
    ] });
    // Real router and lifecycle; isolate rendering from navigation and service responses.
    TestBed.overrideComponent(OdontogramEditor, { set: { template: '' } });
    TestBed.overrideComponent(TreatmentPlanPage, { set: { template: '' } });
    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url(3));
  });
  afterEach(() => vi.restoreAllMocks());

  it('reutiliza la pantalla cargando los datos del nuevo paciente', async () => {
    const original = page();
    await harness.navigateByUrl(url(4));
    expect(page()).toBe(original);
    expect(original.encounter()?.patientId).toBe(104);
    expect(getEncounter).toHaveBeenLastCalledWith(4);
    if (original instanceof TreatmentPlanPage) expect(original.plan()?.id).toBe(14);
    else expect(original.current()?.id).toBe(24);
  });
  it('cancelar conserva la URL, el paciente y el borrador', async () => {
    makeDirty();
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    await harness.navigateByUrl(url(4));
    expect(TestBed.inject(Router).url).toBe(url(3));
    expect(page().encounter()?.patientId).toBe(103);
    expect(page().hasUnsavedChanges()).toBe(true);
    expect(getEncounter).not.toHaveBeenCalledWith(4);
  });
  it('descarta solo tras confirmar y no lleva el texto al nuevo paciente', async () => {
    makeDirty();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    await harness.navigateByUrl(url(4));
    expect(confirm).toHaveBeenCalledOnce();
    expect(page().hasUnsavedChanges()).toBe(false);
    const editor = page();
    if (editor instanceof TreatmentPlanPage) expect(editor.planForm.controls.observations.value).toBe('');
    else expect(editor.observation.value).toBe('Nota 4');
  });
  it('bloquea el cambio mientras se guarda', async () => {
    page().saving.set(true);
    await harness.navigateByUrl(url(4));
    expect(TestBed.inject(Router).url).toBe(url(3));
    expect(getEncounter).not.toHaveBeenCalledWith(4);
  });
  it('ignora una respuesta de ficha de una navegación anterior', async () => {
    const late = new Subject<ClinicalEncounter>();
    getEncounter.mockReturnValueOnce(late.asObservable());
    await harness.navigateByUrl(url(4));
    expect(page().encounter()).toBeNull();
    await harness.navigateByUrl(url(5));
    late.next(encounter(4));
    expect(page().encounter()?.patientId).toBe(105);
  });
  it('ignora un listado anterior que llega después del nuevo paciente', async () => {
    const latePlans = new Subject<TreatmentPlan[]>();
    const lateOdontograms = new Subject<Odontogram[]>();
    if (kind === 'tratamiento') listPlans.mockReturnValueOnce(latePlans.asObservable());
    else listOdontograms.mockReturnValueOnce(lateOdontograms.asObservable());
    await harness.navigateByUrl(url(4));
    await harness.navigateByUrl(url(5));
    latePlans.next([plan(4)]);
    lateOdontograms.next([odontogram(4)]);
    const editor = page();
    expect(editor.encounter()?.patientId).toBe(105);
    if (editor instanceof TreatmentPlanPage) expect(editor.plan()?.id).toBe(15);
    else expect(editor.current()?.id).toBe(25);
  });
  it('no deja visible el paciente anterior si falla la nueva carga', async () => {
    const failed = new Subject<ClinicalEncounter>();
    getEncounter.mockReturnValueOnce(failed.asObservable());
    await harness.navigateByUrl(url(4));
    failed.error(new Error('Fallo de conexión'));
    expect(page().encounter()).toBeNull();
    expect(page().loading()).toBe(false);
    const editor = page();
    if (editor instanceof TreatmentPlanPage) expect(editor.plan()).toBeNull();
    else expect(editor.current()).toBeNull();
    expect(editor.error()).toBeTruthy();
  });
  it('rechaza identificadores inválidos sin consultar datos', async () => {
    await harness.navigateByUrl(url(-4));
    expect(getEncounter).not.toHaveBeenCalledWith(-4);
    expect(page().encounter()).toBeNull();
    expect(page().loading()).toBe(false);
  });
  if (kind === 'tratamiento') {
    it('ignora saldos del paciente anterior', async () => {
      const editor = page() as TreatmentPlanPage;
      const late = new Subject<Account[]>();
      accountsForPatient.mockReturnValueOnce(late.asObservable());
      editor.refreshAccount();
      await harness.navigateByUrl(url(4));
      late.next([{ id: 1, planId: 13, balance: 50 } as Account]);
      expect(editor.account()).toBeNull();
      expect(editor.accountLoading()).toBe(false);
      expect(editor.accountError()).toBe('');
    });
    it('ignora la actualización de una firma del plan anterior', async () => {
      const editor = page() as TreatmentPlanPage;
      const late = new Subject<TreatmentPlan>();
      getPlan.mockReturnValueOnce(late.asObservable());
      editor.refreshSignedPlan();
      await harness.navigateByUrl(url(4));
      late.next({ ...plan(3), status: 'ACEPTADO' });
      expect(editor.plan()?.id).toBe(14);
      expect(editor.success()).toBe('');
    });
    it('no destruye una firma pendiente al actualizar el catálogo', () => {
      const editor = page() as TreatmentPlanPage;
      vi.spyOn(editor, 'budgetEditor').mockReturnValue({
        hasUnsavedChanges: () => true, isSavingChanges: () => false,
      } as BudgetAgreementComponent);
      editor.retry();
      expect(getEncounter).toHaveBeenCalledOnce();
      expect(editor.loading()).toBe(false);
      expect(editor.error()).toContain('firma pendiente');
    });
    it('protege una firma pendiente durante la navegación', async () => {
      const editor = page() as TreatmentPlanPage;
      vi.spyOn(editor, 'budgetEditor').mockReturnValue({
        hasUnsavedChanges: () => true, isSavingChanges: () => false,
      } as BudgetAgreementComponent);
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      await harness.navigateByUrl(url(4));
      expect(TestBed.inject(Router).url).toBe(url(3));
      expect(getEncounter).not.toHaveBeenCalledWith(4);
    });
  }
});
