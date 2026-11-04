import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { pendingChangesGuard } from '../../../../core/navigation/pending-changes.guard';
import { PatientApiService } from '../../data-access/patient-api.service';
import { PatientForm } from './patient-form';

describe('Registro de pacientes: conservación de borradores', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [
      provideRouter([{ path: 'pacientes/:id/editar', component: PatientForm, canDeactivate: [pendingChangesGuard] }]),
      { provide: AuthService, useValue: { authenticated: () => true } },
      { provide: PatientApiService, useValue: { get: (id: number) => of({
        id, documentType: 'SIN_DOCUMENTO', firstNames: 'Ana', paternalSurname: 'Torres',
        birthDate: '1990-05-20', sex: 'FEMENINO', whatsappConsent: false,
      }) } },
    ] });
  });
  afterEach(() => vi.restoreAllMocks());

  it('conserva el paciente y el formulario si se cancela salir hacia otra ficha', async () => {
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl('/pacientes/8/editar', PatientForm);
    page.form.controls.firstNames.setValue('Borrador pendiente');
    page.form.markAsDirty();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    await harness.navigateByUrl('/pacientes/9/editar');
    expect(confirm).toHaveBeenCalledOnce();
    expect(page.patientId()).toBe(8);
    expect(page.form.controls.firstNames.value).toBe('Borrador pendiente');
  });

  it('protege el cierre del navegador cuando hay datos sin guardar', async () => {
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl('/pacientes/8/editar', PatientForm);
    page.form.markAsDirty();
    const event = new Event('beforeunload', { cancelable: true });
    page.beforeUnload(event);
    expect(event.defaultPrevented).toBe(true);
  });
});
