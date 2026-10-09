import { Component } from '@angular/core';
import { CrudPlanillaComponent } from './crud-planilla.component';
import { ConfigCrud } from './crud-config';

@Component({
  selector: 'app-estado-civil',
  standalone: true,
  imports: [CrudPlanillaComponent],
  template: '<app-crud-planilla [config]="config"></app-crud-planilla>'
})
export class EstadoCivilComponent {
  config: ConfigCrud = {
    titulo: 'Estados Civiles',
    descripcion: 'Administra el catálogo de estados civiles utilizado en el registro de personas',
    recurso: 'estados-civiles',
    opcion: 'Estados Civiles',
    singular: 'estado civil',
    claves: ['IdEstadoCivil'],
    campos: [
      { nombre: 'Nombre', etiqueta: 'Nombre del estado civil', tipo: 'texto', requerido: true, longitudMaxima: 50 }
    ],
    columnas: [
      { campo: 'IdEstadoCivil', titulo: 'Código', tipo: 'numero' },
      { campo: 'Nombre', titulo: 'Nombre' }
    ],
    descripcionRegistro: (registro) => `el estado civil "${registro.Nombre}"`
  };
}
