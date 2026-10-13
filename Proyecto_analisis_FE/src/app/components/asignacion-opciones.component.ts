import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { PermisosService } from '../services/permisos.service';
import { Role, Modulo, MatrizPermisos } from '../models/index';

// Nombre de la columna/permiso, usado para tipar el checkbox que se está togglenado.
// "Consultar" NO se envía al backend: no existe como columna en ROLE_OPCION
// (no se modifica el esquema de BD), así que se calcula en pantalla como
// "tiene algún otro permiso" y se muestra de solo lectura.
type TipoPermisoEditable = 'Alta' | 'Baja' | 'Cambio' | 'Imprimir' | 'Exportar';

// Estructura que se envía al backend: un registro por cada Opción del módulo,
// con el estado (0/1) de cada checkbox editable de la cuadrícula.
interface PermisoAGuardar {
  IdRole: number;
  IdOpcion: number;
  Alta: number;
  Baja: number;
  Cambio: number;
  Imprimir: number;
  Exportar: number;
}

@Component({
  selector: 'app-asignacion-opciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './asignacion-opciones.component.html'
})
export class AsignacionOpcionesComponent implements OnInit {
  // Combos
  roles: Role[] = [];
  modulos: Modulo[] = [];
  selectedRoleId: number | null = null;
  selectedModuloId: number | null = null;

  // Cuadrícula (filas = opciones del módulo seleccionado)
  matriz: MatrizPermisos[] = [];

  isLoading = false;
  isSaving = false;
  error: string | null = null;
  success: string | null = null;

  // Nombres de columnas EDITABLES de la cuadrícula (Consultar se agrega aparte, de solo lectura).
  readonly columnas: { key: TipoPermisoEditable; label: string }[] = [
    { key: 'Alta', label: 'Alta' },
    { key: 'Baja', label: 'Baja' },
    { key: 'Cambio', label: 'Cambio' },
    { key: 'Imprimir', label: 'Imprimir' },
    { key: 'Exportar', label: 'Exportar' }
  ];

  constructor(
    private apiService: ApiService,
    public permisosService: PermisosService
  ) { }

  ngOnInit(): void {
    this.cargarRoles();
    this.cargarModulos();
  }

  cargarRoles(): void {
    this.apiService.getRoles().subscribe({
      next: (data) => (this.roles = data || []),
      error: () => (this.error = 'Error al cargar los roles')
    });
  }

  cargarModulos(): void {
    this.apiService.getModulos().subscribe({
      next: (data) => (this.modulos = data || []),
      error: () => (this.error = 'Error al cargar los módulos')
    });
  }

  // Se dispara cuando cambia cualquiera de los dos combos. Solo cuando AMBOS
  // tienen valor se consulta la cuadrícula al backend.
  onSeleccionCambio(): void {
    this.matriz = [];
    this.success = null;
    this.error = null;

    if (!this.selectedRoleId || !this.selectedModuloId) {
      return;
    }

    this.isLoading = true;
    this.apiService.obtenerMatrizPermisos(this.selectedRoleId, this.selectedModuloId).subscribe({
      next: (data) => {
        // Se normaliza cada bandera a 0/1 por si el backend regresa boolean/null.
        this.matriz = (data || []).map(p => ({
          ...p,
          Alta: p.Alta ? 1 : 0,
          Baja: p.Baja ? 1 : 0,
          Cambio: p.Cambio ? 1 : 0,
          Imprimir: p.Imprimir ? 1 : 0,
          Exportar: p.Exportar ? 1 : 0
        }));
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err.error?.mensaje || 'Error al cargar la matriz de permisos';
      }
    });
  }

  // Alterna un checkbox EDITABLE de la cuadrícula (Alta/Baja/Cambio/Imprimir/Exportar).
  // "Consultar" no se toggla directamente: se recalcula sola con consultarDe().
  toggle(fila: MatrizPermisos, columna: TipoPermisoEditable): void {
    fila[columna] = fila[columna] ? 0 : 1;
  }

  // Valor de solo lectura para la columna "Consultar": true si el rol tiene
  // cualquier otro permiso sobre esa opción. No se persiste como columna aparte
  // porque ROLE_OPCION no la tiene (no se modifica el esquema de BD).
  consultarDe(fila: MatrizPermisos): boolean {
    return !!(fila.Alta || fila.Baja || fila.Cambio || fila.Imprimir || fila.Exportar);
  }

  // Recolecta el estado actual de todos los checkboxes editables de la cuadrícula
  // y los envía en un solo POST (JSON) al backend.
  guardar(): void {
    if (!this.selectedRoleId || this.matriz.length === 0) return;

    const payload: PermisoAGuardar[] = this.matriz.map(fila => ({
      IdRole: this.selectedRoleId as number,
      IdOpcion: fila.IdOpcion,
      Alta: fila.Alta ? 1 : 0,
      Baja: fila.Baja ? 1 : 0,
      Cambio: fila.Cambio ? 1 : 0,
      Imprimir: fila.Imprimir ? 1 : 0,
      Exportar: fila.Exportar ? 1 : 0
    }));

    this.isSaving = true;
    this.error = null;
    this.success = null;

    this.apiService.guardarMatrizPermisos(payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.success = 'Permisos guardados exitosamente.';
      },
      error: (err) => {
        this.isSaving = false;
        this.error = err.error?.mensaje || err.error?.error || 'Error al guardar los permisos';
      }
    });
  }
}
