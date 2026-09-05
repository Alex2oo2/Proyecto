import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { PermisosService } from '../services/permisos.service';
import { Role } from '../models/index';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.css']
})
export class RolesComponent implements OnInit {
  roles: Role[] = [];
  
  showForm = false;
  isEditMode = false;
  roleForm: FormGroup;
  selectedRoleId: number | null = null;
  
  loading = false;
  error: string | null = null;
  success: string | null = null;

  constructor(
    private apiService: ApiService,
    public permisosService: PermisosService,
    private fb: FormBuilder
  ) {
    this.roleForm = this.fb.group({
      Nombre: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.loadRoles();
  }

  loadRoles() {
    this.loading = true;
    this.apiService.getRoles().subscribe({
      next: (data) => {
        this.roles = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar roles';
        this.loading = false;
      }
    });
  }

  editRole(role: Role) {
    this.isEditMode = true;
    this.selectedRoleId = role.IdRole || null;
    this.roleForm.patchValue(role);
    this.showForm = true;
  }

  deleteRole(id: number | undefined) {
    if (!id) return;
    if (confirm(`¿Estás seguro de que deseas eliminar este rol?`)) {
      this.apiService.eliminarRole(id).subscribe({
        next: () => {
          this.success = 'Rol eliminado exitosamente';
          this.loadRoles();
        },
        error: (err) => {
          this.error = err.error?.mensaje || err.error?.error || 'Error al eliminar rol';
        }
      });
    }
  }

  onSubmit() {
    if (this.roleForm.invalid) {
      this.error = 'Por favor completa los campos requeridos';
      return;
    }

    const formData = this.roleForm.value;

    if (this.isEditMode && this.selectedRoleId) {
      this.apiService.actualizarRole(this.selectedRoleId, formData).subscribe({
        next: () => {
          this.success = 'Rol actualizado exitosamente';
          this.resetForm();
          this.loadRoles();
        },
        error: (err) => {
          this.error = err.error?.error || 'Error al actualizar rol';
        }
      });
    } else {
      this.apiService.crearRole(formData).subscribe({
        next: () => {
          this.success = 'Rol creado exitosamente';
          this.resetForm();
          this.loadRoles();
        },
        error: (err) => {
          this.error = err.error?.error || 'Error al crear rol';
        }
      });
    }
  }

  resetForm() {
    this.roleForm.reset();
    this.showForm = false;
    this.isEditMode = false;
    this.selectedRoleId = null;
    this.error = null;
    this.success = null;
  }

  toggleForm() {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.resetForm();
    }
  }

}
