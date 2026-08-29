import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { Role, Modulo, MatrizPermisos } from '../models/index';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.css']
})
export class RolesComponent implements OnInit {
  roles: Role[] = [];
  modulos: Modulo[] = [];
  matrizPermisos: MatrizPermisos[] = [];
  
  showForm = false;
  isEditMode = false;
  showPermisosModal = false;
  roleForm: FormGroup;
  selectedRoleId: number | null = null;
  selectedModuloId: number | null = null;
  
  loading = false;
  error: string | null = null;
  success: string | null = null;

  constructor(
    private apiService: ApiService,
    private fb: FormBuilder
  ) {
    this.roleForm = this.fb.group({
      Nombre: ['', Validators.required],
      Descripcion: ['']
    });
  }

  ngOnInit() {
    this.loadRoles();
    this.loadModulos();
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

  loadModulos() {
    this.apiService.getModulos().subscribe(data => this.modulos = data);
  }

  loadMatrizPermisos(idRole: number, idModulo: number) {
    this.apiService.obtenerMatrizPermisos(idRole, idModulo).subscribe({
      next: (data) => {
        this.matrizPermisos = data;
      },
      error: (err) => {
        this.error = 'Error al cargar matriz de permisos';
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
          this.error = err.error?.error || 'Error al eliminar rol';
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

  openPermisosModal(role: Role) {
    this.selectedRoleId = role.IdRole || null;
    if (this.selectedRoleId && this.modulos.length > 0) {
      this.selectedModuloId = this.modulos[0].IdModulo || null;
      if (this.selectedModuloId) {
        this.loadMatrizPermisos(this.selectedRoleId, this.selectedModuloId);
      }
    }
    this.showPermisosModal = true;
  }

  savePermisos() {
    if (!this.selectedRoleId) return;
    
    const permisosActualizados = this.matrizPermisos.map(p => ({
      IdRole: this.selectedRoleId,
      IdOpcion: p.IdOpcion,
      Alta: p.Alta,
      Baja: p.Baja,
      Cambio: p.Cambio,
      Imprimir: p.Imprimir,
      Exportar: p.Exportar
    }));

    this.apiService.guardarMatrizPermisos(permisosActualizados).subscribe({
      next: () => {
        this.success = 'Permisos guardados exitosamente';
        this.showPermisosModal = false;
      },
      error: (err) => {
        this.error = 'Error al guardar permisos';
      }
    });
  }

  togglePermiso(permiso: MatrizPermisos, tipo: 'Alta' | 'Baja' | 'Cambio' | 'Imprimir' | 'Exportar') {
    permiso[tipo] = permiso[tipo] === 1 ? 0 : 1;
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
