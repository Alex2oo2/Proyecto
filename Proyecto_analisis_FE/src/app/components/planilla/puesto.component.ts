import { Component } from '@angular/core';
import { CrudPlanillaComponent } from './crud-planilla.component';
import { ConfigCrud } from './crud-config';

@Component({
  selector: 'app-puesto',
  standalone: true,
  imports: [CrudPlanillaComponent],
  template: '<app-crud-planilla [config]="config"></app-crud-planilla>'
})
export class PuestoComponent {
  config: ConfigCrud = {
    titulo: 'Puestos',
    descripcion: 'Administra los puestos de trabajo de cada departamento',
    recurso: 'puestos',
    opcion: 'Puestos',
    singular: 'puesto',
    claves: ['IdPuesto'],
    campos: [
      { nombre: 'Nombre', etiqueta: 'Nombre del puesto', tipo: 'texto', requerido: true, longitudMaxima: 50 },
      { nombre: 'IdDepartamento', etiqueta: 'Departamento', tipo: 'select', requerido: true, catalogo: 'departamentos' }
    ],
    columnas: [
      { campo: 'IdPuesto', titulo: 'Código', tipo: 'numero' },
      { campo: 'Nombre', titulo: 'Nombre' },
      { campo: 'NombreDepartamento', titulo: 'Departamento' }
    ],
    descripcionRegistro: (registro) => `el puesto "${registro.Nombre}"`
  };
}
