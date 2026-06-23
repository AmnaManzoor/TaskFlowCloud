import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  input,
  viewChild,
} from '@angular/core';
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  ChartConfiguration,
  DoughnutController,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';

Chart.register(
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  ArcElement,
  DoughnutController,
  Title,
  Tooltip,
  Legend,
);

export type ChartKind = 'bar' | 'line' | 'doughnut' | 'pie' | 'area';

@Component({
  selector: 'app-chart-canvas',
  template: `<div class="chart-canvas" #canvasHost role="img" [attr.aria-label]="ariaLabel()"><canvas #canvas></canvas></div>`,
  styles: `
    .chart-canvas {
      position: relative;
      width: 100%;
      min-height: 12rem;
    }

    canvas {
      width: 100% !important;
      height: 100% !important;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartCanvasComponent implements AfterViewInit, OnDestroy {
  readonly kind = input<ChartKind>('bar');
  readonly labels = input<string[]>([]);
  readonly values = input<number[]>([]);
  readonly colors = input<string[]>([
    '#2563eb',
    '#7c3aed',
    '#0891b2',
    '#059669',
    '#d97706',
    '#dc2626',
    '#64748b',
  ]);
  readonly ariaLabel = input('Chart');

  private readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private chart: Chart | null = null;
  private viewReady = false;

  constructor() {
    effect(() => {
      this.labels();
      this.values();
      this.kind();
      if (this.viewReady) {
        this.renderChart();
      }
    });
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.renderChart();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private renderChart(): void {
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) {
      return;
    }

    const config = this.buildConfig();
    if (!config) {
      return;
    }

    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(canvas, config);
  }

  private buildConfig(): ChartConfiguration | null {
    const labels = this.labels();
    const values = this.values();
    const palette = this.colors();

    if (labels.length === 0 || values.length === 0) {
      return null;
    }

    const backgroundColor = labels.map((_, index) => palette[index % palette.length]);
    const kind = this.kind();

    if (kind === 'line') {
      return {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              data: values,
              borderColor: palette[0],
              backgroundColor: `${palette[0]}33`,
              fill: true,
              tension: 0.35,
              pointRadius: 3,
            },
          ],
        },
        options: this.baseOptions(false),
      };
    }

    if (kind === 'doughnut' || kind === 'pie') {
      return {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{ data: values, backgroundColor, borderWidth: 0 }],
        },
        options: {
          ...this.baseOptions(true),
          ...(kind === 'pie' ? { cutout: '0%' } : { cutout: '62%' }),
        } as ChartConfiguration['options'],
      };
    }

    if (kind === 'area') {
      return {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              data: values,
              borderColor: palette[0],
              backgroundColor: `${palette[0]}55`,
              fill: true,
              tension: 0.35,
              pointRadius: 2,
            },
          ],
        },
        options: this.baseOptions(false),
      };
    }

    return {
      type: 'bar',
      data: {
        labels,
        datasets: [{ data: values, backgroundColor, borderRadius: 6, maxBarThickness: 40 }],
      },
      options: this.baseOptions(false),
    };
  }

  private baseOptions(maintainAspectRatio: boolean) {
    return {
      responsive: true,
      maintainAspectRatio,
      plugins: {
        legend: {
          display: maintainAspectRatio,
          position: 'bottom' as const,
          labels: { boxWidth: 12, padding: 16 },
        },
      },
      scales: maintainAspectRatio
        ? undefined
        : {
            x: { grid: { display: false } },
            y: { beginAtZero: true, ticks: { precision: 0 } },
          },
    };
  }
}
