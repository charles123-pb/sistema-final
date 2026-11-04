import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { SupabaseErrorService } from '../../../../core/supabase/supabase-error.service';
import { AdminApiService } from '../../data-access/admin-api.service';
import { AdminCenter } from './admin-center';

describe('AdminCenter: perfiles de acceso', () => {
  let page: AdminCenter;
  let createUser: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    createUser = vi.fn(() => of({ id: 1 }));
    const api = {
      createUser,
      users: () => of([]),
      roles: () => of([]),
      settings: () => of([]),
      audit: () => of({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 50 }),
      summary: () => of({}),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: AdminApiService, useValue: api },
        { provide: AuthService, useValue: { logout: vi.fn() } },
        { provide: Router, useValue: { navigate: vi.fn() } },
        {
          provide: SupabaseErrorService,
          useValue: { toUserMessage: (_: unknown, fallback: string) => fallback },
        },
      ],
    });
    page = TestBed.runInInjectionContext(() => new AdminCenter());
  });

  afterEach(() => vi.restoreAllMocks());

  it('conserva el formulario de usuario al cancelar su cierre', () => {
    page.openCreateUser(); page.userForm.controls.fullName.setValue('Usuario en preparación');
    page.userForm.markAsDirty();
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    page.closeCreateUser(); page.openCreateUser();
    expect(page.createOpen()).toBe(true);
    expect(page.userForm.controls.fullName.value).toBe('Usuario en preparación');
  });

  it('protege cambios de configuración y contraseña ante la recarga', () => {
    page.settings.set([{ key: 'nombre', value: 'Original', description: '', updatedAt: '', version: 0 }]);
    page.draft('nombre', 'Pendiente');
    expect(page.hasUnsavedChanges()).toBe(true);
    const event = new Event('beforeunload', { cancelable: true });
    page.beforeUnload(event); expect(event.defaultPrevented).toBe(true);
    page.draft('nombre', 'Original'); expect(page.hasUnsavedChanges()).toBe(false);
    page.passwordForm.markAsDirty(); expect(page.hasUnsavedChanges()).toBe(true);
  });

  it('no pierde valores de configuración pendientes cuando actualiza otros datos', () => {
    page.settings.set([{ key: 'nombre', value: 'Original', description: '', updatedAt: '', version: 0 }]);
    page.draft('nombre', 'Pendiente');
    const api = TestBed.inject(AdminApiService);
    vi.spyOn(api, 'settings').mockReturnValue(of([{ key: 'nombre', value: 'Original', description: '', updatedAt: '', version: 0 }]));
    page.load();
    expect(page.settingDrafts()['nombre']).toBe('Pendiente');
    expect(page.hasUnsavedChanges()).toBe(true);
  });

  it('crea por defecto al propietario con roles Administrador y Odontólogo', () => {
    page.userForm.setValue({
      fullName: 'Dra. Ana Torres',
      username: 'ana.torres',
      email: 'ana@example.com',
      password: 'Dental2026!',
      profile: 'PROPIETARIO_ODONTOLOGO',
    });

    page.createUser();

    expect(createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        roles: ['ADMINISTRADOR', 'ODONTOLOGO'],
      }),
    );
  });

  it('mantiene perfiles limitados para personal futuro', () => {
    page.userForm.setValue({
      fullName: 'María Recepción',
      username: 'maria.recepcion',
      email: '',
      password: 'Dental2026!',
      profile: 'RECEPCION',
    });

    page.createUser();

    expect(createUser).toHaveBeenCalledWith(expect.objectContaining({ roles: ['RECEPCION'] }));
  });

  it('muestra un nombre claro para la cuenta con ambos roles', () => {
    expect(page.profileName(['ADMINISTRADOR', 'ODONTOLOGO'])).toBe('Propietario odontólogo');
  });
});
