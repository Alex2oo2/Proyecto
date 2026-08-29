import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../services/api.service';
import { Usuario, Empresa, Genero, StatusUsuario } from '../models/index';

@Component({
  selector: 'app-create-user',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-900 p-8">
      <div class="max-w-2xl mx-auto">
        <div class="bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 class="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p class="text-gray-400 mb-6">Register a new user account</p>

          <form [formGroup]="userForm" (ngSubmit)="onSubmit()">
            <div class="grid grid-cols-2 gap-6">
              <!-- User ID -->
              <div>
                <label class="block text-gray-300 text-sm font-semibold mb-2">User ID</label>
                <input
                  type="text"
                  formControlName="IdUsuario"
                  class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                  placeholder="testuser"
                />
                <div *ngIf="userForm.get('IdUsuario')?.touched && userForm.get('IdUsuario')?.hasError('required')" class="text-red-400 text-xs mt-1">
                  User ID is required
                </div>
              </div>

              <!-- First Name -->
              <div>
                <label class="block text-gray-300 text-sm font-semibold mb-2">First Name</label>
                <input
                  type="text"
                  formControlName="Nombre"
                  class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                  placeholder="John"
                />
                <div *ngIf="userForm.get('Nombre')?.touched && userForm.get('Nombre')?.hasError('required')" class="text-red-400 text-xs mt-1">
                  First name is required
                </div>
              </div>

              <!-- Last Name -->
              <div>
                <label class="block text-gray-300 text-sm font-semibold mb-2">Last Name</label>
                <input
                  type="text"
                  formControlName="Apellido"
                  class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                  placeholder="Doe"
                />
                <div *ngIf="userForm.get('Apellido')?.touched && userForm.get('Apellido')?.hasError('required')" class="text-red-400 text-xs mt-1">
                  Last name is required
                </div>
              </div>

              <!-- Password -->
              <div>
                <label class="block text-gray-300 text-sm font-semibold mb-2">Password</label>
                <input
                  type="password"
                  formControlName="Password"
                  class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                  placeholder="password123"
                />
                <div *ngIf="userForm.get('Password')?.touched && userForm.get('Password')?.hasError('required')" class="text-red-400 text-xs mt-1">
                  Password is required
                </div>
              </div>

              <!-- Birth Date -->
              <div>
                <label class="block text-gray-300 text-sm font-semibold mb-2">Birth Date</label>
                <input
                  type="date"
                  formControlName="FechaNacimiento"
                  class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                />
                <div *ngIf="userForm.get('FechaNacimiento')?.touched && userForm.get('FechaNacimiento')?.hasError('required')" class="text-red-400 text-xs mt-1">
                  Birth date is required
                </div>
              </div>

              <!-- Email -->
              <div>
                <label class="block text-gray-300 text-sm font-semibold mb-2">Email</label>
                <input
                  type="email"
                  formControlName="CorreoElectronico"
                  class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                  placeholder="test@example.com"
                />
                <div *ngIf="userForm.get('CorreoElectronico')?.touched && userForm.get('CorreoElectronico')?.hasError('email')" class="text-red-400 text-xs mt-1">
                  Valid email is required
                </div>
              </div>

              <!-- Phone -->
              <div>
                <label class="block text-gray-300 text-sm font-semibold mb-2">Phone</label>
                <input
                  type="tel"
                  formControlName="TelefonoMovil"
                  class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                  placeholder="1234567890"
                />
              </div>

              <!-- Gender -->
              <div>
                <label class="block text-gray-300 text-sm font-semibold mb-2">Gender</label>
                <select
                  formControlName="IdGenero"
                  class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Select Gender --</option>
                  <option *ngFor="let g of generos" [value]="g.IdGenero">{{ g.Nombre }}</option>
                </select>
                <div *ngIf="userForm.get('IdGenero')?.touched && userForm.get('IdGenero')?.hasError('required')" class="text-red-400 text-xs mt-1">
                  Gender is required
                </div>
              </div>

              <!-- Branch -->
              <div>
                <label class="block text-gray-300 text-sm font-semibold mb-2">Branch (Sucursal)</label>
                <select
                  formControlName="IdSucursal"
                  class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Select Branch --</option>
                  <option *ngFor="let branch of branches" [value]="branch.IdSucursal">{{ branch.Nombre }}</option>
                </select>
                <div *ngIf="userForm.get('IdSucursal')?.touched && userForm.get('IdSucursal')?.hasError('required')" class="text-red-400 text-xs mt-1">
                  Branch is required
                </div>
              </div>

              <!-- Role -->
              <div>
                <label class="block text-gray-300 text-sm font-semibold mb-2">Role</label>
                <select
                  formControlName="IdRole"
                  class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Select Role --</option>
                  <option *ngFor="let role of roles" [value]="role.IdRole">{{ role.Nombre }}</option>
                </select>
                <div *ngIf="userForm.get('IdRole')?.touched && userForm.get('IdRole')?.hasError('required')" class="text-red-400 text-xs mt-1">
                  Role is required
                </div>
              </div>

              <!-- Status -->
              <div>
                <label class="block text-gray-300 text-sm font-semibold mb-2">Status</label>
                <select
                  formControlName="IdStatusUsuario"
                  class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Select Status --</option>
                  <option *ngFor="let status of statuses" [value]="status.IdStatusUsuario">{{ status.Nombre }}</option>
                </select>
                <div *ngIf="userForm.get('IdStatusUsuario')?.touched && userForm.get('IdStatusUsuario')?.hasError('required')" class="text-red-400 text-xs mt-1">
                  Status is required
                </div>
              </div>
            </div>

            <!-- Success/Error Messages -->
            <div *ngIf="successMessage" class="mt-6 p-4 bg-green-700 rounded text-green-100">
              {{ successMessage }}
            </div>
            <div *ngIf="errorMessage" class="mt-6 p-4 bg-red-700 rounded text-red-100">
              {{ errorMessage }}
            </div>

            <!-- Buttons -->
            <div class="flex gap-4 mt-8">
              <button
                type="submit"
                [disabled]="loading || userForm.invalid"
                class="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold rounded transition"
              >
                {{ loading ? 'Creating...' : 'Register' }}
              </button>
              <button
                type="button"
                (click)="resetForm()"
                class="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded transition"
              >
                Clear Form
              </button>
              <a
                routerLink="/login"
                class="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded transition text-center"
              >
                Back to Login
              </a>
            </div>
          </form>

          <!-- Login Link -->
          <div class="mt-6 text-center">
            <p class="text-gray-400 text-sm">
              Already have an account? 
              <a routerLink="/login" class="text-blue-400 hover:text-blue-300 font-semibold transition">
                Log in here
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CreateUserComponent implements OnInit, OnDestroy {
  userForm: FormGroup;
  loading = false;
  successMessage = '';
  errorMessage = '';

  branches: any[] = [];
  generos: any[] = [];
  roles: any[] = [];
  statuses: any[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService
  ) {
    this.userForm = this.fb.group({
      IdUsuario: ['', Validators.required],
      Nombre: ['', Validators.required],
      Apellido: ['', Validators.required],
      Password: ['', Validators.required],
      FechaNacimiento: ['', Validators.required],
      CorreoElectronico: ['', [Validators.required, Validators.email]],
      TelefonoMovil: [''],
      IdGenero: ['', Validators.required],
      IdSucursal: ['', Validators.required],
      IdRole: ['', Validators.required],
      IdStatusUsuario: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadDropdownData();
  }

  loadDropdownData(): void {
    // Load genders
    this.apiService.getGeneros()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => this.generos = data,
        error: (error) => console.error('Error loading genders:', error)
      });

    // Load branches
    this.apiService.getSucursales()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => this.branches = data,
        error: (error) => console.error('Error loading branches:', error)
      });

    // Load roles
    this.apiService.getRoles()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => this.roles = data,
        error: (error) => console.error('Error loading roles:', error)
      });

    // Load statuses
    this.apiService.getStatusUsuarios()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => this.statuses = data,
        error: (error) => console.error('Error loading statuses:', error)
      });
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      this.errorMessage = 'Please fill all required fields correctly';
      return;
    }

    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';

    const formValue = this.userForm.value;
    const usuario: Usuario = {
      IdUsuario: formValue.IdUsuario,
      Nombre: formValue.Nombre,
      Apellido: formValue.Apellido,
      Password: formValue.Password,
      FechaNacimiento: formValue.FechaNacimiento,
      CorreoElectronico: formValue.CorreoElectronico,
      TelefonoMovil: formValue.TelefonoMovil || null,
      IdGenero: parseInt(formValue.IdGenero),
      IdSucursal: parseInt(formValue.IdSucursal),
      IdRole: parseInt(formValue.IdRole),
      IdStatusUsuario: parseInt(formValue.IdStatusUsuario)
    };

    this.apiService.registroPublico(usuario)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading = false;
          this.successMessage = `¡Usuario "${usuario.IdUsuario}" registrado exitosamente! Ahora puedes iniciar sesión.`;
          this.resetForm();
          setTimeout(() => {
            this.successMessage = '';
          }, 5000);
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error?.error?.mensaje || 'Error al registrar usuario';
          console.error('Error creating user:', error);
        }
      });
  }

  resetForm(): void {
    this.userForm.reset();
    this.successMessage = '';
    this.errorMessage = '';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
