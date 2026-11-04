import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { PatientApiService } from '../../data-access/patient-api.service';
import { PatientList } from './patient-list';

describe('Búsqueda de pacientes desde la navegación', () => {
  it('actualiza la búsqueda al cambiar la URL sin recrear la pantalla', () => {
    const params = new BehaviorSubject(convertToParamMap({ q: 'Ana' }));
    const search = vi.fn(() => of({ content: [], totalPages: 0 }));
    TestBed.configureTestingModule({ providers: [
      { provide: AuthService, useValue: { hasPermission: () => true } },
      { provide: PatientApiService, useValue: { search } },
      { provide: ActivatedRoute, useValue: { queryParamMap: params } },
    ] });
    const page = TestBed.runInInjectionContext(() => new PatientList());
    page.ngOnInit();
    expect(search).toHaveBeenLastCalledWith(expect.objectContaining({ q: 'Ana' }));
    page.page.set(2);
    params.next(convertToParamMap({ q: 'Luis' }));
    expect(search).toHaveBeenLastCalledWith(expect.objectContaining({ q: 'Luis', page: 0 }));
    expect(page.query()).toBe('Luis');
  });
});
