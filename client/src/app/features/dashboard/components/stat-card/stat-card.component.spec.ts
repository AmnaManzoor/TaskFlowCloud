import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatCardComponent } from '@features/dashboard/components/stat-card/stat-card.component';

describe('StatCardComponent', () => {
  let fixture: ComponentFixture<StatCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StatCardComponent);
    fixture.componentRef.setInput('card', {
      id: 'test',
      icon: 'folder',
      label: 'Total Projects',
      value: 12,
      description: 'Across workspace',
      trendLabel: '2 active',
      trendDirection: 'neutral',
    });
    fixture.detectChanges();
  });

  it('should render stat card value', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Total Projects');
    expect(element.textContent).toContain('12');
  });
});
