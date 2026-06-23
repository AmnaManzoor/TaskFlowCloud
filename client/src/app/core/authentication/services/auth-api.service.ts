import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiBaseService } from '@core/services/api-base.service';
import type {
  AuthResponse,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  LogoutRequest,
  MessageResponse,
  RefreshTokenRequest,
  RegisterRequest,
  ResendVerificationRequest,
  ResetPasswordRequest,
  UpdateUserProfileRequest,
  UserDetailResponse,
  UserProfile,
  VerifyEmailRequest,
} from '@core/authentication/models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthApiService extends ApiBaseService {
  login(request: LoginRequest): Observable<AuthResponse> {
    return this.post<AuthResponse>('/auth/login', request);
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.post<AuthResponse>('/auth/register', request);
  }

  logout(request: LogoutRequest): Observable<MessageResponse> {
    return this.post<MessageResponse>('/auth/logout', request);
  }

  refreshToken(request: RefreshTokenRequest): Observable<AuthResponse> {
    return this.post<AuthResponse>('/auth/refresh-token', request);
  }

  changePassword(request: ChangePasswordRequest): Observable<MessageResponse> {
    return this.post<MessageResponse>('/auth/change-password', request);
  }

  forgotPassword(request: ForgotPasswordRequest): Observable<MessageResponse> {
    return this.post<MessageResponse>('/auth/forgot-password', request);
  }

  resetPassword(request: ResetPasswordRequest): Observable<MessageResponse> {
    return this.post<MessageResponse>('/auth/reset-password', request);
  }

  verifyEmail(request: VerifyEmailRequest): Observable<MessageResponse> {
    return this.post<MessageResponse>('/auth/verify-email', request);
  }

  resendVerification(request: ResendVerificationRequest): Observable<MessageResponse> {
    return this.post<MessageResponse>('/auth/resend-verification', request);
  }

  getCurrentUser(): Observable<UserProfile> {
    return this.get<UserProfile>('/auth/me');
  }

  updateProfile(userId: string, request: UpdateUserProfileRequest): Observable<UserProfile> {
    return this.put<UserDetailResponse>(`/users/${userId}`, request).pipe(
      map((detail) => mapUserDetailToProfile(detail)),
    );
  }
}

function mapUserDetailToProfile(detail: UserDetailResponse): UserProfile {
  return {
    id: detail.id,
    email: detail.email,
    firstName: detail.firstName,
    lastName: detail.lastName,
    profileImageUrl: detail.profileImageUrl,
    isActive: detail.isActive,
    emailConfirmed: detail.emailConfirmed,
    roles: detail.systemRoles,
    createdAt: detail.createdAt,
    lastLoginAt: detail.lastLoginAt,
  };
}
