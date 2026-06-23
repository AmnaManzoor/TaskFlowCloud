import { InitialsPipe } from '@shared/pipes/initials.pipe';
import { TruncatePipe } from '@shared/pipes/truncate.pipe';

describe('Shared pipes', () => {
  it('initials pipe should return uppercase initials', () => {
    const pipe = new InitialsPipe();
    expect(pipe.transform('Jane Doe')).toBe('JD');
  });

  it('truncate pipe should shorten long strings', () => {
    const pipe = new TruncatePipe();
    expect(pipe.transform('abcdefghijklmnopqrstuvwxyz', 10)).toBe('abcdefghij...');
  });
});
