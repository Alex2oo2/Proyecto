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
    titulo: 'Flujos de estados del empleado',
    descripcion: 'Administra las transiciones permitidas entre los estados laborales de un empleado',
    recurso: 'flujos-status-empleado',
    opcion: 'Flujos Status Empleado',
    singular: 'flujo de estados laborales',
    claves: ['IdStatusActual', 'IdStatusNuevo'],
    campos: [
      { nombre: 'IdStatusActual', etiqueta: 'Estado actual', tipo: 'select', requerido: true, catalogo: 'statusEmpleados', soloLecturaAlEditar: true },
      { nombre: 'IdStatusNuevo', etiqueta: 'Estado nuevo', tipo: 'select', requerido: true, catalogo: 'statusEmpleados', soloLecturaAlEditar: true },
      { nombre: 'NombreEvento', etiqueta: 'Evento que origina el cambio', tipo: 'texto', requerido: true, longitudMaxima: 50 }
    ],
    columnas: [
      { campo: 'NombreStatusActual', titulo: 'Estado actual' },
      { campo: 'NombreStatusNuevo', titulo: 'Estado nuevo' },
      { campo: 'NombreEvento', titulo: 'Evento' }
    ],
    descripcionRegistro: (registro) => `el flujo "${registro.NombreStatusActual} → ${registro.NombreStatusNuevo}"`
  };
}
