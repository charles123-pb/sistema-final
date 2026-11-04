import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { FinanceApiService } from '../../data-access/finance-api.service';
import { Account, Payment } from '../../models/finance.models';
import { FinanceDashboardPage } from './finance-dashboard';

describe('Finanzas: contexto de atención', () => {
  const accounts = [
    { id: 1, patientId: 8, patientName: 'Paciente de prueba', balance: 80, status: 'PARCIAL' },
    { id: 2, patientId: 9, patientName: 'Otro paciente', balance: 200, status: 'PENDIENTE' },
    { id: 3, patientId: 8, patientName: 'Paciente de prueba', balance: 30, status: 'ANULADA' },
  ] as Account[];
  it('filtra las cuentas y pagos del paciente sin realizar cobros automáticos', () => {
    const pay = vi.fn();
    TestBed.configureTestingModule({ providers: [
      { provide: AuthService, useValue: { hasPermission: () => true } },
      { provide: ActivatedRoute, useValue: { queryParamMap: of(convertToParamMap({ patientId: '8', encounterId: '3' })) } },
      { provide: FinanceApiService, useValue: {
        pay, dashboard: () => of({}), accounts: () => of(accounts), methods: () => of([]),
        payments: () => of([{ id: 1, patientId: 8 }, { id: 2, patientId: 9 }] as Payment[]),
        expenses: () => of([]), currentCash: () => of(null),
      } },
    ] });
    const page = TestBed.runInInjectionContext(() => new FinanceDashboardPage());
    page.ngOnInit();
    expect(page.contextAccounts().map((account) => account.id)).toEqual([1, 3]);
    expect(page.contextPayments().map((payment) => payment.id)).toEqual([1]);
    expect(page.contextBalance()).toBe(80);
    expect(page.returnEncounterId()).toBe(3);
    expect(pay).not.toHaveBeenCalled();
    expect(page.modal()).toBeNull();
  });
});


describe('Finanzas: reintentos de gastos', () => {
  it('reutiliza la operación tras una respuesta perdida y la renueva al cambiar datos', () => {
    const expense = vi.fn((_payload: unknown, _operationId: string) => throwError(() => new Error('Respuesta perdida')));
    TestBed.configureTestingModule({ providers: [
      { provide: AuthService, useValue: { hasPermission: () => true } },
      { provide: ActivatedRoute, useValue: {} },
      { provide: FinanceApiService, useValue: { expense } },
    ] });
    const page = TestBed.runInInjectionContext(() => new FinanceDashboardPage());
    page.cash.set({ id: 2 } as never);
    page.methods.set([{ id: 1, referenceRequired: false } as never]);
    page.expenseForm.setValue({ category: 'Insumos', description: 'Guantes', provider: '', documentReference: '', methodId: 1, amount: 20 });
    page.saveExpense();
    page.saveExpense();
    expect(expense.mock.calls[0][1]).toBe(expense.mock.calls[1][1]);
    page.expenseForm.controls.amount.setValue(30);
    page.saveExpense();
    expect(expense.mock.calls[2][1]).not.toBe(expense.mock.calls[0][1]);
  });
});
