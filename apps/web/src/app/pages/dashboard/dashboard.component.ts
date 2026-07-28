import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { YardStats, labelStatus, money } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DatePipe, TitleCasePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly stats = signal<YardStats | null>(null);

  readonly labelStatus = labelStatus;
  readonly money = money;

  ngOnInit() {
    this.reload();
  }

  reload() {
    this.loading.set(true);
    this.error.set(null);
    this.api.getStats().subscribe({
      next: (s) => {
        this.stats.set(s);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load yard stats. Is the API running?');
        this.loading.set(false);
      },
    });
  }
}
