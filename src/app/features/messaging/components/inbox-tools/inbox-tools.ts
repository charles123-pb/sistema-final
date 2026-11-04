import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type ConversationFilter = 'all' | 'unread' | 'pending';
export type QuickReply = 'greeting' | 'appointment' | 'reschedule' | 'followup';

@Component({
  selector: 'app-inbox-tools',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (mode() === 'filters') {
      <div class="filters" role="group" aria-label="Filtrar conversaciones">
        @for (item of filters; track item.key) {
          <button
            type="button"
            [attr.aria-pressed]="filter() === item.key"
            (click)="filterChange.emit(item.key)"
          >
            {{ item.label }}
          </button>
        }
      </div>
      <p role="status">
        {{ count() }} conversaciones visibles{{ partial() ? ' · Hay más por cargar' : '' }}
      </p>
    } @else {
      <details>
        <summary>Respuestas rápidas</summary>
        <p>Elige una, revisa el texto y pulsa Enviar. No se envía automáticamente.</p>
        <div class="replies">
          @for (item of replies; track item.key) {
            <button
              type="button"
              [disabled]="disabled() || (item.key === 'appointment' && !hasAppointment())"
              (click)="reply.emit(item.key)"
            >
              {{ item.label }}
            </button>
          }
        </div>
      </details>
    }
  `,
  styles: `
    :host {
      display: block;
      padding: 10px 14px;
      border-bottom: 1px solid #e3edf1;
    }
    .filters,
    .replies {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    button {
      border: 1px solid #d9e7eb;
      border-radius: 8px;
      padding: 7px 10px;
      background: #fff;
      color: #315568;
      cursor: pointer;
      font: inherit;
      font-size: 0.73rem;
    }
    button[aria-pressed='true'] {
      background: #13778a;
      color: #fff;
      border-color: #13778a;
    }
    button:disabled {
      opacity: 0.5;
      cursor: default;
    }
    button:focus-visible,
    summary:focus-visible {
      outline: 2px solid #13778a;
      outline-offset: 2px;
    }
    p {
      margin: 8px 0 0;
      font-size: 0.7rem;
      color: #597484;
    }
    summary {
      cursor: pointer;
      font-size: 0.78rem;
      font-weight: 600;
      color: #13778a;
    }
    .replies {
      margin-top: 8px;
    }
  `,
})
export class InboxTools {
  readonly mode = input<'filters' | 'replies'>('filters');
  readonly filter = input<ConversationFilter>('all');
  readonly count = input(0);
  readonly partial = input(false);
  readonly disabled = input(false);
  readonly hasAppointment = input(false);
  readonly filterChange = output<ConversationFilter>();
  readonly reply = output<QuickReply>();
  readonly filters: { key: ConversationFilter; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'unread', label: 'Sin leer' },
    { key: 'pending', label: 'Pendientes' },
  ];
  readonly replies: { key: QuickReply; label: string }[] = [
    { key: 'greeting', label: 'Saludo' },
    { key: 'appointment', label: 'Confirmar cita' },
    { key: 'reschedule', label: 'Reprogramar' },
    { key: 'followup', label: 'Seguimiento' },
  ];
}
