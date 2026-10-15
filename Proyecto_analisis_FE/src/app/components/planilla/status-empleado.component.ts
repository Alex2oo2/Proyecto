import { Component } from '@angular/core';
import { CrudPlanillaComponent } from './crud-planilla.component';
import { ConfigCrud } from './crud-config';

@Component({
  selector: 'app-status-empleado',
  standalone: true,
  imports: [CrudPlanillaComponent],
  template: '<app-crud-planilla [config]="config"></app-crud-planilla>'
})
export class StatusEmpleadoComponent {
  config: ConfigCrud = {
    titulo: 'Estatus del empleado',
    descripcion: 'Administra los estados laborales que puede tener un empleado',
    recurso: 'status-empleados',
    opcion: 'Status Empleado',
    singular: 'estatus del empleado',
    claves: ['IdStatusEmpleado'],
    campos: [
      { nombre: 'Nombre', etiqueta: 'Nombre del estatus', tipo: 'texto', requerido: true, longitudMaxima: 50 }
    ],
    columnas: [
      { campo: 'IdStatusEmpleado', titulo: 'Código', tipo: 'numero' },
      { campo: 'Nombre', titulo: 'Nombre' }
    ],
    descripcionRegistro: (registro) => `el estatus "${registro.Nombre}"`
  };
}
