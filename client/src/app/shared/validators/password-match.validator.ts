import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

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
