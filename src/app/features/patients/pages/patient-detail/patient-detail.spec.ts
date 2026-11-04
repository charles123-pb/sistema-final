import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { PatientApiService } from '../../data-access/patient-api.service';
import { PatientDetail } from '../../models/patient.models';
import { PatientDetailPage } from './patient-detail';

describe('Ficha de paciente: cambios de ruta', () => {
  it('ignora respuestas del paciente anterior al cambiar de ficha', () => {
    const params = new BehaviorSubject(convertToParamMap({ id: '8' }));
    const first = new Subject<PatientDetail>();
    const second = new Subject<PatientDetail>();
    const get = vi.fn().mockReturnValueOnce(first).mockReturnValueOnce(second);
    TestBed.configureTestingModule({ providers: [
      { provide: AuthService, useValue: { hasPermission: () => true } },
      { provide: PatientApiService, useValue: { get } },
      { provide: ActivatedRoute, useValue: { paramMap: params } },
      { provide: Router, useValue: { navigate: vi.fn() } },
    ] });
    const page = TestBed.runInInjectionContext(() => new PatientDetailPage());
    page.ngOnInit();
    params.next(convertToParamMap({ id: '9' }));
    second.next({ id: 9 } as PatientDetail);
    first.next({ id: 8 } as PatientDetail);
    expect(get.mock.calls).toEqual([[8], [9]]);
    expect(page.patient()?.id).toBe(9);
  });
});
