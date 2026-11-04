import { AbstractControl, ValidationErrors } from '@angular/forms';

export function dateNotInFuture(control: AbstractControl): ValidationErrors | null {
  const value: unknown = control.value;
  if (value === '' || value == null) return null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return { invalidDate: true };
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(`${value}T00:00:00`);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return { invalidDate: true };
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date > today ? { futureDate: true } : null;
}
