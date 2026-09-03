import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';import { FormsModule } from '@angular/forms';import { ApiService } from '../services/api.service';
import { Usuario, Genero, StatusUsuario, Sucursal, Role } from '../models/index';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  usuarios: Usuario[] = [];
  generos: Genero[] = [];
  statusUsuarios: StatusUsuario[] = [];
  sucursales: Sucursal[] = [];
  roles: Role[] = [];
  
  showForm = false;
  isEditMode = false;
  userForm: FormGroup;
  selectedUserId: string | null = null;
  
  loading = false;
  error: string | null = null;
  success: string | null = null;

  constructor(
    private apiService: ApiService,
    private fb: FormBuilder
  ) {
    this.userForm = this.fb.group({
      IdUsuario: ['', Validators.required],
      Nombre: ['', Validators.required],
      Apellido: ['', Validators.required],
      FechaNacimiento: ['', Validators.required],
      Password: ['', Validators.required],
      CorreoElectronico: ['', [Validators.required, Validators.email]],
      TelefonoMovil: [''],
      IdGenero: ['', Validators.required],
      IdSucursal: ['', Validators.required],
      IdRole: ['', Validators.required],
      IdStatusUsuario: ['', Validators.required],
      Pregunta: ['', Validators.required],
      Respuesta: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.loadUsers();
    this.loadDropdowns();
  }

  loadUsers() {
    this.loading = true;
    this.apiService.getUsuarios().subscribe({
      next: (data) => {
        this.usuarios = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar usuarios';
        this.loading = false;
      }
    });
  }

  loadDropdowns() {
    this.apiService.getGeneros().subscribe(data => this.generos = data);
    this.apiService.getStatusUsuarios().subscribe(data => this.statusUsuarios = data);
    this.apiService.getSucursales().subscribe(data => this.sucursales = data);
    this.apiService.getRoles().subscribe(data => this.roles = data);
  }

  editUser(usuario: Usuario) {
    this.isEditMode = true;
    this.selectedUserId = usuario.IdUsuario;
    ['IdUsuario', 'FechaNacimiento', 'Password', 'Pregunta', 'Respuesta'].forEach(field => {
      this.userForm.get(field)?.clearValidators();
      this.userForm.get(field)?.updateValueAndValidity();
    });
    this.userForm.patchValue({
      IdUsuario: usuario.IdUsuario,
      Nombre: usuario.Nombre,
      Apellido: usuario.Apellido,
      FechaNacimiento: usuario.FechaNacimiento,
      CorreoElectronico: usuario.CorreoElectronico,
      TelefonoMovil: usuario.TelefonoMovil,
      IdGenero: usuario.IdGenero,
      IdSucursal: usuario.IdSucursal,
      IdRole: usuario.IdRole,
      IdStatusUsuario: usuario.IdStatusUsuario,
      Pregunta: usuario.Pregunta,
      Respuesta: usuario.Respuesta
    });
    this.userForm.get('IdUsuario')?.disable();
    this.showForm = true;
  }

  deleteUser(id: string) {
    if (confirm(`¿Estás seguro de que deseas eliminar al usuario ${id}?`)) {
      this.apiService.eliminarUsuario(id).subscribe({
        next: () => {
          this.success = 'Usuario eliminado exitosamente';
          this.loadUsers();
        },
        error: (err) => {
          this.error = err.error?.error || 'Error al eliminar usuario';
        }
      });
    }
  }

  onSubmit() {
    if (this.userForm.invalid) {
      this.error = 'Por favor completa todos los campos requeridos';
      return;
    }

    const formData = this.userForm.getRawValue();

    if (this.isEditMode) {
      this.apiService.actualizarUsuario(formData.IdUsuario, formData).subscribe({
        next: () => {
          this.success = 'Usuario actualizado exitosamente';
          this.resetForm();
          this.loadUsers();
        },
        error: (err) => {
          this.error = err.error?.error || 'Error al actualizar usuario';
        }
      });
    } else {
      this.apiService.crearUsuario(formData).subscribe({
        next: () => {
          this.success = 'Usuario creado exitosamente';
          this.resetForm();
          this.loadUsers();
        },
        error: (err) => {
          this.error = err.error?.error || 'Error al crear usuario';
        }
      });
    }
  }

  resetForm() {
    this.userForm.reset();
    this.userForm.get('IdUsuario')?.setValidators(Validators.required);
    ['FechaNacimiento', 'Password', 'Pregunta', 'Respuesta'].forEach(field => {
      this.userForm.get(field)?.setValidators(Validators.required);
    });
    Object.keys(this.userForm.controls).forEach(field => {
      this.userForm.get(field)?.updateValueAndValidity();
    });
    this.showForm = false;
    this.isEditMode = false;
    this.selectedUserId = null;
    this.error = null;
    this.success = null;
  }

  toggleForm() {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.resetForm();
    }
  }

  getNombreGenero(idGenero: number): string {
    return this.generos.find(g => g.IdGenero === idGenero)?.Nombre || '-';
  }

  getNombreStatus(idStatus: number): string {
    return this.statusUsuarios.find(s => s.IdStatusUsuario === idStatus)?.Nombre || '-';
  }

  getNombreSucursal(idSucursal: number): string {
    return this.sucursales.find(s => s.IdSucursal === idSucursal)?.Nombre || '-';
  }
}
