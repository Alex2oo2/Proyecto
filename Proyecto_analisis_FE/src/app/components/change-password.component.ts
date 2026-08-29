import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-900 p-8">
      <div class="max-w-md mx-auto">
        <div class="bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 class="text-3xl font-bold text-white mb-2">Change Password</h1>
          <p class="text-gray-400 mb-6">Update your account password</p>

          <form [formGroup]="passwordForm" (ngSubmit)="onSubmit()">
            <!-- Current Password -->
            <div class="mb-4">
              <label class="block text-gray-300 text-sm font-semibold mb-2">
                Current Password
              </label>
              <input
                type="password"
                formControlName="currentPassword"
                class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                placeholder="Enter your current password"
              />
              <div *ngIf="passwordForm.get('currentPassword')?.touched && passwordForm.get('currentPassword')?.hasError('required')" 
                   class="text-red-400 text-xs mt-1">
                Current password is required
              </div>
            </div>

            <!-- New Password -->
            <div class="mb-4">
              <label class="block text-gray-300 text-sm font-semibold mb-2">
                New Password
              </label>
              <input
                type="password"
                formControlName="newPassword"
                class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                placeholder="Enter new password"
              />
              <div *ngIf="passwordForm.get('newPassword')?.touched && passwordForm.get('newPassword')?.hasError('required')" 
                   class="text-red-400 text-xs mt-1">
                New password is required
              </div>
              <div *ngIf="passwordForm.get('newPassword')?.touched && passwordForm.get('newPassword')?.hasError('minlength')" 
                   class="text-red-400 text-xs mt-1">
                Password must be at least 6 characters
              </div>
            </div>

            <!-- Confirm New Password -->
            <div class="mb-6">
              <label class="block text-gray-300 text-sm font-semibold mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                formControlName="confirmPassword"
                class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                placeholder="Confirm new password"
              />
              <div *ngIf="passwordForm.get('confirmPassword')?.touched && passwordForm.get('confirmPassword')?.hasError('required')" 
                   class="text-red-400 text-xs mt-1">
                Password confirmation is required
              </div>
              <div *ngIf="passwordForm.touched && passwordForm.hasError('passwordMismatch')" 
                   class="text-red-400 text-xs mt-1">
                Passwords do not match
              </div>
            </div>

            <!-- Success Message -->
            <div *ngIf="successMessage" class="mb-4 p-4 bg-green-700 rounded text-green-100 text-sm">
              {{ successMessage }}
            </div>

            <!-- Error Message -->
            <div *ngIf="errorMessage" class="mb-4 p-4 bg-red-700 rounded text-red-100 text-sm">
              {{ errorMessage }}
            </div>

            <!-- Buttons -->
            <div class="flex gap-4">
              <button
                type="submit"
                [disabled]="loading || passwordForm.invalid"
                class="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold rounded transition"
              >
                {{ loading ? 'Updating...' : 'Change Password' }}
              </button>
              <a
                routerLink="/dashboard"
                class="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded transition text-center"
              >
                Cancel
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class ChangePasswordComponent implements OnDestroy {
  passwordForm: FormGroup;
  loading = false;
  successMessage = '';
  errorMessage = '';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {
    this.passwordForm = this.fb.group(
      {
        currentPassword: ['', Validators.required],
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required]
      },
      { validators: this.passwordMatchValidator }
    );
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');

    if (!newPassword || !confirmPassword) return null;
    
    return newPassword.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    if (this.passwordForm.invalid) {
      this.errorMessage = 'Please fill all fields correctly';
      return;
    }

    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';

    const { currentPassword, newPassword } = this.passwordForm.value;
    const currentUser = this.authService.getCurrentUser();

    const changePasswordData = {
      IdUsuario: currentUser?.IdUsuario,
      currentPassword,
      newPassword
    };

    this.apiService.cambiarContraseña(changePasswordData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading = false;
          this.successMessage = 'Password changed successfully!';
          this.passwordForm.reset();
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 2000);
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error?.error?.mensaje || 'Failed to change password';
          console.error('Error changing password:', error);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
