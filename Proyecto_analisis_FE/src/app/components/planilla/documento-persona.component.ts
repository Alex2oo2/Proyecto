import { Component } from '@angular/core';
import { CrudPlanillaComponent } from './crud-planilla.component';
import { ConfigCrud } from './crud-config';

@Component({
  selector: 'app-documento-persona',
  standalone: true,
  imports: [CrudPlanillaComponent],
  template: '<app-crud-planilla [config]="config"></app-crud-planilla>'
})
export class DocumentoPersonaComponent {
  config: ConfigCrud = {
    titulo: 'Documentos de Personas',
    descripcion: 'Administra los documentos de identificación asociados a cada persona',
    recurso: 'documentos-persona',
    opcion: 'Documentos de Personas',
    singular: 'documento de persona',
    claves: ['IdTipoDocumento', 'IdPersona'],
    campos: [
      { nombre: 'IdPersona', etiqueta: 'Persona', tipo: 'select', requerido: true, catalogo: 'personas', soloLecturaAlEditar: true },
      { nombre: 'IdTipoDocumento', etiqueta: 'Tipo de documento', tipo: 'select', requerido: true, catalogo: 'tiposDocumento', soloLecturaAlEditar: true },
      { nombre: 'NoDocumento', etiqueta: 'Número de documento', tipo: 'texto', requerido: true, longitudMaxima: 50 }
    ],
    columnas: [
      { campo: 'NombrePersona', titulo: 'Persona' },
      { campo: 'NombreTipoDocumento', titulo: 'Tipo de documento' },
      { campo: 'NoDocumento', titulo: 'Número' }
    ],
    descripcionRegistro: (registro) => `el documento "${registro.NombreTipoDocumento}" de ${registro.NombrePersona}`
  };
}
