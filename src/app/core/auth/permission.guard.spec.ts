import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';
import { permissionGuard } from './permission.guard';

// Permissions read from the test project's role catalog on 2026-10-06.
const rolePermissions: Record<string, string[]> = {
  ADMINISTRADOR: ['CITA_LEER', 'CLINICA_LEER', 'FINANZA_LEER', 'TRATAMIENTO_LEER', 'USUARIO_LEER'],
  ODONTOLOGO: ['CITA_LEER', 'CLINICA_LEER', 'TRATAMIENTO_LEER'],
  RECEPCION: ['CITA_LEER', 'PACIENTE_LEER', 'SEGUIMIENTO_LEER'],
  CAJA: ['FINANZA_LEER', 'PACIENTE_LEER'],
};

describe('PermissionGuard: matriz de acceso de lectura', () => {
  it.each([
    ['ADMINISTRADOR', 'USUARIO_LEER', true], ['ADMINISTRADOR', 'FINANZA_LEER', true],
    ['ODONTOLOGO', 'CITA_LEER', true], ['ODONTOLOGO', 'CLINICA_LEER', true],
    ['ODONTOLOGO', 'FINANZA_LEER', false], ['ODONTOLOGO', 'USUARIO_LEER', false],
    ['RECEPCION', 'CITA_LEER', true], ['RECEPCION', 'CLINICA_LEER', false],
    ['RECEPCION', 'FINANZA_LEER', false], ['CAJA', 'FINANZA_LEER', true],
    ['CAJA', 'CLINICA_LEER', false], ['CAJA', 'TRATAMIENTO_LEER', false],
  ])('%s: %s → %s', async (role, permission, expected) => {
    let ready = false;
    const hasPermission = vi.fn((value: string) => {
      expect(ready).toBe(true);
      return rolePermissions[role].includes(value);
    });
    TestBed.configureTestingModule({ providers: [provideRouter([]), {
      provide: AuthService, useValue: { whenReady: async () => { ready = true; }, hasPermission },
    }] });
    const result = await TestBed.runInInjectionContext(() => permissionGuard(
      { data: { permission } } as unknown as ActivatedRouteSnapshot,
      {} as RouterStateSnapshot,
    ));
    if (expected) expect(result).toBe(true);
    else {
      expect(result).toBeInstanceOf(UrlTree);
      expect(TestBed.inject(Router).serializeUrl(result as UrlTree))
        .toBe('/sistema/inicio?denied=' + permission);
    }
  });
});
