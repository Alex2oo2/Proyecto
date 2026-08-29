import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div class="w-full max-w-md bg-gray-800 rounded-lg shadow-2xl p-8">
        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-white mb-2">Recuperar Contraseña</h1>
          <p class="text-gray-400">Ingresa tu usuario para resetear tu contraseña</p>
        </div>

        <!-- Step 1: Username Input -->
        <form *ngIf="step === 1" [formGroup]="usernameForm" (ngSubmit)="onSubmitUsername()" class="space-y-4">
          <div>
            <label for="username" class="block text-sm font-medium text-gray-300 mb-2">
              Usuario
            </label>
            <input
              id="username"
              type="text"
              formControlName="username"
              placeholder="Ingresa tu usuario"
              class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              [class.border-red-500]="usernameForm.get('username')?.invalid && usernameForm.get('username')?.touched"
            />
            <p *ngIf="usernameForm.get('username')?.invalid && usernameForm.get('username')?.touched" class="text-red-400 text-sm mt-1">
              El usuario es requerido
            </p>
          </div>

          <div *ngIf="errorMessage" class="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-sm">
            {{ errorMessage }}
          </div>

          <button
            type="submit"
            [disabled]="!usernameForm.valid || loading"
            class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-2 rounded-lg transition duration-200"
          >
            {{ loading ? 'Buscando...' : 'Continuar' }}
          </button>
        </form>

        <!-- Step 2: Security Question -->
        <form *ngIf="step === 2" [formGroup]="securityForm" (ngSubmit)="onSubmitSecurity()" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Pregunta de Seguridad
            </label>
            <p class="bg-gray-700 px-4 py-3 rounded-lg text-gray-200 mb-4">
              {{ securityQuestion }}
            </p>
          </div>

          <div>
            <label for="answer" class="block text-sm font-medium text-gray-300 mb-2">
              Tu Respuesta
            </label>
            <input
              id="answer"
              type="text"
              formControlName="answer"
              placeholder="Ingresa tu respuesta"
              class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              [class.border-red-500]="securityForm.get('answer')?.invalid && securityForm.get('answer')?.touched"
            />
            <p *ngIf="securityForm.get('answer')?.invalid && securityForm.get('answer')?.touched" class="text-red-400 text-sm mt-1">
              La respuesta es requerida
            </p>
          </div>

          <div *ngIf="errorMessage" class="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-sm">
            {{ errorMessage }}
          </div>

          <div class="flex gap-3">
            <button
              type="button"
              (click)="goBack()"
              class="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 rounded-lg transition duration-200"
            >
              Atrás
            </button>
            <button
              type="submit"
              [disabled]="!securityForm.valid || loading"
              class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-2 rounded-lg transition duration-200"
            >
              {{ loading ? 'Verificando...' : 'Verificar' }}
            </button>
          </div>
        </form>

        <!-- Step 3: New Password -->
        <form *ngIf="step === 3" [formGroup]="resetForm" (ngSubmit)="onSubmitReset()" class="space-y-4">
          <div>
            <label for="newPassword" class="block text-sm font-medium text-gray-300 mb-2">
              Nueva Contraseña
            </label>
            <input
              id="newPassword"
              type="password"
              formControlName="newPassword"
              placeholder="Ingresa tu nueva contraseña"
              class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              [class.border-red-500]="resetForm.get('newPassword')?.invalid && resetForm.get('newPassword')?.touched"
            />
            <p *ngIf="resetForm.get('newPassword')?.touched && resetForm.get('newPassword')?.hasError('required')" class="text-red-400 text-sm mt-1">
              La contraseña es requerida
            </p>
            <p *ngIf="resetForm.get('newPassword')?.touched && resetForm.get('newPassword')?.hasError('minlength')" class="text-red-400 text-sm mt-1">
              La contraseña debe tener al menos 6 caracteres
            </p>
          </div>

          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-300 mb-2">
              Confirmar Contraseña
            </label>
            <input
              id="confirmPassword"
              type="password"
              formControlName="confirmPassword"
              placeholder="Confirma tu nueva contraseña"
              class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              [class.border-red-500]="resetForm.get('confirmPassword')?.invalid && resetForm.get('confirmPassword')?.touched"
            />
            <p *ngIf="resetForm.get('confirmPassword')?.touched && resetForm.get('confirmPassword')?.hasError('required')" class="text-red-400 text-sm mt-1">
              La confirmación es requerida
            </p>
            <p *ngIf="resetForm.touched && resetForm.hasError('passwordMismatch')" class="text-red-400 text-sm mt-1">
              Las contraseñas no coinciden
            </p>
          </div>

          <div *ngIf="errorMessage" class="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-sm">
            {{ errorMessage }}
          </div>

          <div *ngIf="successMessage" class="bg-green-700 border border-green-600 text-green-100 px-4 py-3 rounded-lg text-sm">
            {{ successMessage }}
          </div>

          <button
            type="submit"
            [disabled]="!resetForm.valid || loading"
            class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-2 rounded-lg transition duration-200"
          >
            {{ loading ? 'Actualizando...' : 'Actualizar Contraseña' }}
          </button>

          <a
            *ngIf="successMessage"
            routerLink="/login"
            class="block w-full text-center px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition"
          >
            Ir al Login
          </a>
        </form>

        <!-- Back to Login -->
        <div class="mt-6 text-center">
          <a routerLink="/login" class="text-blue-400 hover:text-blue-300 font-semibold transition">
            Volver al Login
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class ForgotPasswordComponent implements OnDestroy {
  step = 1; // 1: username, 2: security question, 3: new password
  usernameForm: FormGroup;
  securityForm: FormGroup;
  resetForm: FormGroup;

  loading = false;
  errorMessage = '';
  successMessage = '';
  securityQuestion = '';
  currentUsername = '';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private router: Router
  ) {
    this.usernameForm = this.fb.group({
      username: ['', Validators.required]
    });

    this.securityForm = this.fb.group({
      answer: ['', Validators.required]
    });

    this.resetForm = this.fb.group(
      {
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required]
      },
      { validators: this.passwordMatchValidator.bind(this) }
    );
  }

  onSubmitUsername(): void {
    if (this.usernameForm.invalid) {
      this.errorMessage = 'Por favor ingresa un usuario válido';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    const username = this.usernameForm.get('username')?.value;
    this.currentUsername = username;

    this.apiService.obtenerPreguntaSeguridad(username)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.loading = false;
          this.securityQuestion = response.pregunta;
          this.step = 2;
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error?.error?.mensaje || 'Usuario no encontrado';
        }
      });
  }

  onSubmitSecurity(): void {
    if (this.securityForm.invalid) {
      this.errorMessage = 'Por favor ingresa una respuesta';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    const answer = this.securityForm.get('answer')?.value;

    this.apiService.verificarRespuestaSeguridad(this.currentUsername, answer)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading = false;
          this.step = 3;
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error?.error?.mensaje || 'Respuesta incorrecta';
        }
      });
  }

  onSubmitReset(): void {
    if (this.resetForm.invalid) {
      this.errorMessage = 'Por favor llena todos los campos correctamente';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    const newPassword = this.resetForm.get('newPassword')?.value;

    const resetData = {
      IdUsuario: this.currentUsername,
      newPassword
    };

    this.apiService.resetearContraseña(resetData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading = false;
          this.successMessage = '¡Contraseña actualizada exitosamente! Serás redirigido al login en 3 segundos...';
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 3000);
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error?.error?.mensaje || 'Error al actualizar contraseña';
        }
      });
  }

  goBack(): void {
    this.step = 1;
    this.errorMessage = '';
    this.securityForm.reset();
  }

  private passwordMatchValidator(control: any) {
    const newPassword = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');

    if (!newPassword || !confirmPassword) return null;
    
    return newPassword.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
