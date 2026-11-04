import { TestBed } from '@angular/core/testing';
import { firstValueFrom, throwError } from 'rxjs';
import { SupabaseApiService } from './supabase-api.service';
import { SupabaseClientService } from './supabase-client.service';

describe('SupabaseApiService', () => {
  let rpc: ReturnType<typeof vi.fn>;
  let invoke: ReturnType<typeof vi.fn>;
  let service: SupabaseApiService;

  beforeEach(() => {
    rpc = vi.fn(() => Promise.resolve({ data: null, error: null }));
    invoke = vi.fn(() => Promise.resolve({ data: { ok: true }, error: null }));
    TestBed.configureTestingModule({
      providers: [{ provide: SupabaseClientService, useValue: { client: { rpc, functions: { invoke } } } }],
    });
    service = TestBed.inject(SupabaseApiService);
  });

  it('no inicia una escritura hasta que hay una suscripción', async () => {
    rpc.mockResolvedValue({ data: 7, error: null });
    const request = service.rpc<number>('crear_paciente', {});
    expect(rpc).not.toHaveBeenCalled();
    expect(await firstValueFrom(request)).toBe(7);
    expect(rpc).toHaveBeenCalledOnce();
  });

  it('no invoca una Edge Function antes de suscribirse', async () => {
    const request = service.invoke<{ ok: boolean }>('health', {});
    expect(invoke).not.toHaveBeenCalled();
    await firstValueFrom(request);
    expect(invoke).toHaveBeenCalledOnce();
  });

  it('informa que la escritura terminó aunque falle la lectura posterior', async () => {
    await expect(firstValueFrom(service.refreshAfterMutation(
      () => throwError(() => new Error('Sin conexión')),
    ))).rejects.toThrow('La operación se guardó');
  });

  it('supports an explicit null fallback', async () => {
    await expect(firstValueFrom(service.rpc<null>('caja_actual', {}, { fallback: null })))
      .resolves.toBeNull();
  });

  it('invokes Edge Functions through one shared adapter', async () => {
    await expect(firstValueFrom(service.invoke<{ ok: boolean }>('health', {})))
      .resolves.toEqual({ ok: true });
    expect(invoke).toHaveBeenCalledWith('health', { body: {} });
  });
});
