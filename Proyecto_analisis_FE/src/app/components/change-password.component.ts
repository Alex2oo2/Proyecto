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
          <h1 class="text-3xl font-bold text-white mb-2">Cambiar Contraseña</h1>
          <p class="text-gray-400 mb-6">Actualiza la contraseña de tu cuenta</p>

          <form [formGroup]="passwordForm" (ngSubmit)="onSubmit()">
            <!-- Current Password -->
            <div class="mb-4">
              <label class="block text-gray-300 text-sm font-semibold mb-2">
                Contraseña Actual
              </label>
              <input
                type="password"
                formControlName="currentPassword"
                class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                placeholder="Ingrese su contraseña actual"
              />
              <div *ngIf="passwordForm.get('currentPassword')?.touched && passwordForm.get('currentPassword')?.hasError('required')" 
                   class="text-red-400 text-xs mt-1">
                Contraseña actual es requerida
              </div>
            </div>

            <!-- New Password -->
            <div class="mb-4">
              <label class="block text-gray-300 text-sm font-semibold mb-2">
                Nueva Contraseña
              </label>
              <input
                type="password"
                formControlName="newPassword"
                class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                placeholder="Ingrese su nueva contraseña"
              />
              <div *ngIf="passwordForm.get('newPassword')?.touched && passwordForm.get('newPassword')?.hasError('required')" 
                   class="text-red-400 text-xs mt-1">
                Nueva contraseña es requerida
              </div>
              <div *ngIf="passwordForm.get('newPassword')?.touched && passwordForm.get('newPassword')?.hasError('minlength')" 
                   class="text-red-400 text-xs mt-1">
                La contraseña debe tener al menos 6 caracteres
              </div>
            </div>

            <!-- Confirm New Password -->
            <div class="mb-6">
              <label class="block text-gray-300 text-sm font-semibold mb-2">
                Confirmar Nueva Contraseña
              </label>
              <input
                type="password"
                formControlName="confirmPassword"
                class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                placeholder="Confirmar nueva contraseña"
              />
              <div *ngIf="passwordForm.get('confirmPassword')?.touched && passwordForm.get('confirmPassword')?.hasError('required')" 
                   class="text-red-400 text-xs mt-1">
                La confirmación de la contraseña es requerida
              </div>
              <div *ngIf="passwordForm.touched && passwordForm.hasError('passwordMismatch')" 
                   class="text-red-400 text-xs mt-1">
                Las contraseñas no coinciden
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
                {{ loading ? 'Actualizando...' : 'Cambiar Contraseña' }}
              </button>
              <a
                routerLink="/dashboard"
                class="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded transition text-center"
              >
                Cancelar
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
      this.errorMessage = 'Por favor, complete todos los campos correctamente';
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
          this.successMessage = 'Contraseña cambiada exitosamente!';
          this.passwordForm.reset();
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error?.error?.mensaje || 'Error al cambiar la contraseña';
          console.error('Error changing password:', error);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
