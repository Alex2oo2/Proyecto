import { Component } from '@angular/core';
import { CrudPlanillaComponent } from './crud-planilla.component';
import { ConfigCrud } from './crud-config';

@Component({
  selector: 'app-inasistencia',
  standalone: true,
  imports: [CrudPlanillaComponent],
  template: '<app-crud-planilla [config]="config"></app-crud-planilla>'
})
export class InasistenciaComponent {
  config: ConfigCrud = {
    titulo: 'Inasistencias de Empleados',
    descripcion: 'Registra las inasistencias que serán consideradas al calcular la planilla',
    recurso: 'inasistencias',
    opcion: 'Inasistencias de Empleados',
    singular: 'inasistencia',
    claves: ['IdInasistencia'],
    campos: [
      { nombre: 'IdEmpleado', etiqueta: 'Empleado', tipo: 'select', requerido: true, catalogo: 'empleados' },
      { nombre: 'FechaInicial', etiqueta: 'Fecha inicial', tipo: 'fecha', requerido: true },
      { nombre: 'FechaFinal', etiqueta: 'Fecha final', tipo: 'fecha', requerido: true },
      { nombre: 'MotivoInasistencia', etiqueta: 'Motivo de la inasistencia', tipo: 'texto', requerido: true, longitudMaxima: 300 },
      { nombre: 'FechaProcesado', etiqueta: 'Fecha de procesamiento', tipo: 'texto', soloLectura: true, ayuda: 'La asigna el proceso de cálculo de planilla' }
    ],
    columnas: [
      { campo: 'NombreEmpleado', titulo: 'Empleado' },
      { campo: 'FechaInicial', titulo: 'Fecha inicial', tipo: 'fecha' },
      { campo: 'FechaFinal', titulo: 'Fecha final', tipo: 'fecha' },
      { campo: 'MotivoInasistencia', titulo: 'Motivo' },
      { campo: 'FechaProcesado', titulo: 'Procesada', tipo: 'fechahora' }
    ],
    descripcionRegistro: (registro) => `la inasistencia de ${registro.NombreEmpleado}`,
    puedeModificar: (registro) => !registro.FechaProcesado
  };
}
