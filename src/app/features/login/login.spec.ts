import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { Login } from './login';

describe('Acceso al sistema', () => {
  it('impide inicios de sesión simultáneos y permite reintentar tras un error', () => {
    const response = new Subject();
    const login = vi.fn(() => response);
    TestBed.configureTestingModule({ providers: [
      { provide: AuthService, useValue: { login, whenReady: () => Promise.resolve(), authenticated: () => false } },
      { provide: Router, useValue: { navigateByUrl: vi.fn() } },
      { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({}) } } },
    ] });
    const page = TestBed.runInInjectionContext(() => new Login());
    page.form.setValue({ username: 'dental', password: 'contraseña de prueba' });
    page.submit();
    page.submit();
    expect(login).toHaveBeenCalledOnce();
    response.error(new Error('Sin conexión'));
    expect(page.loading()).toBe(false);
    page.submit();
    expect(login).toHaveBeenCalledTimes(2);
  });
});
