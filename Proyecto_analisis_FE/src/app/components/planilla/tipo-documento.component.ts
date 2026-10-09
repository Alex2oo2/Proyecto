import { Component } from '@angular/core';
import { CrudPlanillaComponent } from './crud-planilla.component';
import { ConfigCrud } from './crud-config';

@Component({
  selector: 'app-tipo-documento',
  standalone: true,
  imports: [CrudPlanillaComponent],
  template: '<app-crud-planilla [config]="config"></app-crud-planilla>'
})
export class TipoDocumentoComponent {
  config: ConfigCrud = {
    titulo: 'Tipos de Documentos',
    descripcion: 'Administra los tipos de documentos que pueden asociarse a una persona',
    recurso: 'tipos-documento',
    opcion: 'Tipos de Documentos',
    singular: 'tipo de documento',
    claves: ['IdTipoDocumento'],
    campos: [
      { nombre: 'Nombre', etiqueta: 'Nombre del tipo de documento', tipo: 'texto', requerido: true, longitudMaxima: 50 }
    ],
    columnas: [
      { campo: 'IdTipoDocumento', titulo: 'Código', tipo: 'numero' },
      { campo: 'Nombre', titulo: 'Nombre' }
    ],
    descripcionRegistro: (registro) => `el tipo de documento "${registro.Nombre}"`
  };
}
