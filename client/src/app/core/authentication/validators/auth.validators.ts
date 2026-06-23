import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

export const emailValidators = [Validators.required, Validators.email];

export const passwordValidators = [
  Validators.required,
  Validators.minLength(8),
  Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/),
];

export function passwordMatchValidator(
  passwordControlName: string,
  confirmControlName: string,
): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const password = group.get(passwordControlName)?.value as string | undefined;
    const confirm = group.get(confirmControlName)?.value as string | undefined;

    if (!password || !confirm || password === confirm) {
      return null;
    }

    return { passwordMismatch: true };
  };
}

export function getControlErrorMessage(control: AbstractControl | null, fieldLabel: string): string | null {
  if (!control || !control.touched || !control.errors) {
    return null;
  }

  if (control.errors['required']) {
    return `${fieldLabel} is required.`;
  }

  if (control.errors['email']) {
    return 'Enter a valid email address.';
  }

  if (control.errors['minlength']) {
    return `${fieldLabel} must be at least ${control.errors['minlength'].requiredLength} characters.`;
  }

  if (control.errors['pattern']) {
    return `${fieldLabel} must include upper, lower, number, and special character.`;
  }

  if (control.errors['passwordMismatch']) {
    return 'Passwords do not match.';
  }

  return `${fieldLabel} is invalid.`;
}

export interface PasswordStrength {
  score: number;
  label: 'Weak' | 'Fair' | 'Good' | 'Strong';
  checks: {
    minLength: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

export function evaluatePasswordStrength(password: string): PasswordStrength {
  const checks = {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;

  const label =
    score <= 2 ? 'Weak' : score === 3 ? 'Fair' : score === 4 ? 'Good' : ('Strong' as const);

  return { score, label, checks };
}
