import { FormControl } from '@angular/forms';
import { dateNotInFuture } from './date.validators';

describe('Fecha de nacimiento', () => {
  afterEach(() => vi.useRealTimers());

  it('admite fechas válidas y rechaza fechas futuras o inexistentes', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 5, 12));
    const validate = (value: string) => dateNotInFuture(new FormControl(value));
    expect(validate('2026-10-05')).toBeNull();
    expect(validate('2000-02-29')).toBeNull();
    expect(validate('2026-10-06')).toEqual({ futureDate: true });
    expect(validate('2026-02-29')).toEqual({ invalidDate: true });
    expect(validate('incorrecta')).toEqual({ invalidDate: true });
    expect(validate('')).toBeNull();
  });
});
