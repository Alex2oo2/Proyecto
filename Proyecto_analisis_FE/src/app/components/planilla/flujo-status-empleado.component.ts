import { Component } from '@angular/core';
import { CrudPlanillaComponent } from './crud-planilla.component';
import { ConfigCrud } from './crud-config';

@Component({
  selector: 'app-flujo-status-empleado',
  standalone: true,
  imports: [CrudPlanillaComponent],
  template: '<app-crud-planilla [config]="config"></app-crud-planilla>'
})
export class FlujoStatusEmpleadoComponent {
  config: ConfigCrud = {
    titulo: 'Flujos de Status de Empleado',
    descripcion: 'Administra las transiciones permitidas entre los status de un empleado',
    recurso: 'flujos-status-empleado',
    opcion: 'Flujos Status Empleado',
    singular: 'flujo de status',
    claves: ['IdStatusActual', 'IdStatusNuevo'],
    campos: [
      { nombre: 'IdStatusActual', etiqueta: 'Status actual', tipo: 'select', requerido: true, catalogo: 'statusEmpleados', soloLecturaAlEditar: true },
      { nombre: 'IdStatusNuevo', etiqueta: 'Status nuevo', tipo: 'select', requerido: true, catalogo: 'statusEmpleados', soloLecturaAlEditar: true },
      { nombre: 'NombreEvento', etiqueta: 'Evento que origina el cambio', tipo: 'texto', requerido: true, longitudMaxima: 50 }
    ],
    columnas: [
      { campo: 'NombreStatusActual', titulo: 'Status actual' },
      { campo: 'NombreStatusNuevo', titulo: 'Status nuevo' },
      { campo: 'NombreEvento', titulo: 'Evento' }
    ],
    descripcionRegistro: (registro) => `el flujo "${registro.NombreStatusActual} → ${registro.NombreStatusNuevo}"`
  };
}
