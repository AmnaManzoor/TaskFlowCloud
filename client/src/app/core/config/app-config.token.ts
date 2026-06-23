import { InjectionToken } from '@angular/core';
import type { Environment } from '@env/environment.model';

export const APP_CONFIG = new InjectionToken<Environment>('APP_CONFIG');
