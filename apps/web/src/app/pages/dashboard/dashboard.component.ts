import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { YardStats } from '../../core/models';

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

  readonly pipeline = computed(() => {
    const s = this.stats();
    if (!s) return [];
    return s.carsByStatus.filter((r) =>
      ['arrived', 'dismantling', 'complete', 'sold', 'crushed'].includes(r.status),
    );
  });

  readonly topCategories = computed(() => {
    const s = this.stats();
    if (!s) return [];
    return [...s.partsByCategory]
      .filter((c) => c.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  });

  readonly maxCategory = computed(() => {
    const rows = this.topCategories();
    return rows.reduce((m, r) => Math.max(m, r.count), 1);
  });

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

  barPct(count: number): number {
    const s = this.stats();
    if (!s?.totalCars) return 0;
    return Math.round((count / s.totalCars) * 100);
  }
}
