import { Component } from '@angular/core';
import { CrudPlanillaComponent } from './crud-planilla.component';
import { ConfigCrud } from './crud-config';

@Component({
  selector: 'app-banco',
  standalone: true,
  imports: [CrudPlanillaComponent],
  template: '<app-crud-planilla [config]="config"></app-crud-planilla>'
})
export class BancoComponent {
  config: ConfigCrud = {
    titulo: 'Bancos',
    descripcion: 'Administra el catálogo de instituciones bancarias utilizadas por el sistema',
    recurso: 'bancos',
    opcion: 'Bancos',
    singular: 'banco',
    claves: ['IdBanco'],
    campos: [
      { nombre: 'Nombre', etiqueta: 'Nombre del banco', tipo: 'texto', requerido: true, longitudMaxima: 50 }
    ],
    columnas: [
      { campo: 'IdBanco', titulo: 'Código', tipo: 'numero' },
      { campo: 'Nombre', titulo: 'Nombre' }
    ],
    descripcionRegistro: (registro) => `el banco "${registro.Nombre}"`
  };
}
