import { evaluatePasswordStrength } from '@core/authentication/validators/auth.validators';

describe('auth validators', () => {
  it('should evaluate strong password', () => {
    const result = evaluatePasswordStrength('StrongPass1!');
    expect(result.label).toBe('Strong');
    expect(result.score).toBe(5);
  });

  it('should evaluate weak password', () => {
    const result = evaluatePasswordStrength('abc');
    expect(result.label).toBe('Weak');
  });
});
