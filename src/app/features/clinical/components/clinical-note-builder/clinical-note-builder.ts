import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

export interface ClinicalNoteField {
  name: string;
  label: string;
  placeholder: string;
}

@Component({
  selector: 'app-clinical-note-builder',
  imports: [ReactiveFormsModule],
  templateUrl: './clinical-note-builder.html',
  styleUrl: './clinical-note-builder.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClinicalNoteBuilder {
  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly fields = input.required<readonly ClinicalNoteField[]>();
  readonly draftForm = input.required<FormGroup>();
  readonly disabled = input(false);
  readonly incorporate = output<void>();
  readonly discard = output<void>();

  hasContent(): boolean {
    return Object.values(this.draftForm().getRawValue()).some(
      (value) => typeof value === 'string' && !!value.trim(),
    );
  }
}
