import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LucideCheck, LucideCheckCheck, LucideRefreshCw } from '@lucide/angular';
import { FollowUp } from '../../models/messaging.models';

export type FollowupFilter = 'all' | 'review' | 'scheduled' | 'closed';
@Component({
  selector: 'app-followup-queue',
  imports: [DatePipe, LucideCheck, LucideCheckCheck, LucideRefreshCw],
  templateUrl: './followup-queue.html',
  styleUrl: './followup-queue.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FollowupQueue {
  readonly items = input.required<FollowUp[]>();
  readonly pendingReviewCount = input(0);
  readonly followupFilter = input<FollowupFilter>('all');
  readonly loading = input(false);
  readonly refreshing = input(false);
  readonly canReview = input(false);
  readonly filterChange = output<FollowupFilter>();
  readonly review = output<FollowUp>();
  readonly refresh = output<void>();
  statusLabel(value: string) {
    return value.replaceAll('_', ' ').toLowerCase();
  }
  initials(name: string) {
    return name
      .split(' ')
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }
}
