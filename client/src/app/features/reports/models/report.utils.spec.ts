import { breakdownTotal, chartToSeries } from '@features/reports/models/report.utils';

describe('report.utils', () => {
  it('should sum breakdown values', () => {
    expect(breakdownTotal({ Todo: 2, Done: 3 })).toBe(5);
  });

  it('should map chart data to series', () => {
    const series = chartToSeries({
      chartType: 'bar',
      items: [
        { label: 'Todo', value: 2 },
        { label: 'Done', value: 1 },
      ],
    });
    expect(series.labels).toEqual(['Todo', 'Done']);
    expect(series.values).toEqual([2, 1]);
  });
});
