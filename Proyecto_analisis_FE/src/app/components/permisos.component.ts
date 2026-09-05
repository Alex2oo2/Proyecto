import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { PermisosService } from '../services/permisos.service';
import { MatrizPermisos, Modulo, Role } from '../models/index';

@Component({
  selector: 'app-permisos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './permisos.component.html'
})
export class PermisosComponent implements OnInit {
  readonly permissionTypes: Array<'Alta' | 'Baja' | 'Cambio' | 'Imprimir' | 'Exportar'> = [
    'Alta', 'Baja', 'Cambio', 'Imprimir', 'Exportar'
  ];
  roles: Role[] = [];
  modulos: Modulo[] = [];
  matrizPermisos: MatrizPermisos[] = [];
  selectedRoleId: number | null = null;
  selectedModuloId: number | null = null;
  loading = false;
  error: string | null = null;
  success: string | null = null;

  constructor(
    private apiService: ApiService,
    public permisosService: PermisosService
  ) {}

  ngOnInit(): void {
    this.loadRoles();
    this.loadModulos();
  }

  loadRoles(): void {
    this.apiService.getRoles().subscribe({
      next: (data) => {
        this.roles = data;
        this.selectedRoleId = this.roles[0]?.IdRole || null;
        this.loadPermissions();
      },
      error: () => this.error = 'Error al cargar roles'
    });
  }

  loadModulos(): void {
    this.apiService.getModulos().subscribe({
      next: (data) => {
        this.modulos = data;
        this.selectedModuloId = this.modulos[0]?.IdModulo || null;
        this.loadPermissions();
      },
      error: () => this.error = 'Error al cargar módulos'
    });
  }

  loadPermissions(): void {
    if (!this.selectedRoleId || !this.selectedModuloId) return;

    this.loading = true;
    this.apiService.obtenerMatrizPermisos(this.selectedRoleId, this.selectedModuloId).subscribe({
      next: (data) => {
        this.matrizPermisos = data.map(permiso => ({
          ...permiso,
          Alta: permiso.Alta ? 1 : 0,
          Baja: permiso.Baja ? 1 : 0,
          Cambio: permiso.Cambio ? 1 : 0,
          Imprimir: permiso.Imprimir ? 1 : 0,
          Exportar: permiso.Exportar ? 1 : 0
        }));
        this.loading = false;
      },
      error: () => {
        this.error = 'Error al cargar matriz de permisos';
        this.loading = false;
      }
    });
  }

  togglePermiso(permiso: MatrizPermisos, tipo: 'Alta' | 'Baja' | 'Cambio' | 'Imprimir' | 'Exportar'): void {
    permiso[tipo] = permiso[tipo] === 1 ? 0 : 1;
  }

  savePermisos(): void {
    if (!this.selectedRoleId) return;

    const permisosActualizados = this.matrizPermisos.map(permiso => ({
      IdRole: this.selectedRoleId,
      IdOpcion: permiso.IdOpcion,
      Alta: permiso.Alta ? 1 : 0,
      Baja: permiso.Baja ? 1 : 0,
      Cambio: permiso.Cambio ? 1 : 0,
      Imprimir: permiso.Imprimir ? 1 : 0,
      Exportar: permiso.Exportar ? 1 : 0
    }));

    this.apiService.guardarMatrizPermisos(permisosActualizados).subscribe({
      next: () => {
        this.success = 'Permisos guardados exitosamente';
        setTimeout(() => this.success = null, 1500);
      },
      error: (err) => this.error = 'Error al guardar permisos: ' + (err.error?.error || err.message)
    });
  }
}
