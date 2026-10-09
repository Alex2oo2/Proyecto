import { Component } from '@angular/core';
import { CrudPlanillaComponent } from './crud-planilla.component';
import { ConfigCrud } from './crud-config';

@Component({
  selector: 'app-persona',
  standalone: true,
  imports: [CrudPlanillaComponent],
  template: '<app-crud-planilla [config]="config"></app-crud-planilla>'
})
export class PersonaComponent {
  config: ConfigCrud = {
    titulo: 'Personas',
    descripcion: 'Administra la información personal de las personas registradas en el sistema',
    recurso: 'personas',
    opcion: 'Personas',
    singular: 'persona',
    claves: ['IdPersona'],
    campos: [
      { nombre: 'Nombre', etiqueta: 'Nombre', tipo: 'texto', requerido: true, longitudMaxima: 50 },
      { nombre: 'Apellido', etiqueta: 'Apellido', tipo: 'texto', requerido: true, longitudMaxima: 50 },
      { nombre: 'FechaNacimiento', etiqueta: 'Fecha de nacimiento', tipo: 'fecha', requerido: true },
      { nombre: 'IdGenero', etiqueta: 'Género', tipo: 'select', requerido: true, catalogo: 'generos' },
      { nombre: 'Direccion', etiqueta: 'Dirección', tipo: 'texto', requerido: true, longitudMaxima: 100 },
      { nombre: 'Telefono', etiqueta: 'Teléfono', tipo: 'texto', requerido: true, longitudMaxima: 50 },
      { nombre: 'CorreoElectronico', etiqueta: 'Correo electrónico', tipo: 'correo', longitudMaxima: 50 },
      { nombre: 'IdEstadoCivil', etiqueta: 'Estado civil', tipo: 'select', requerido: true, catalogo: 'estadosCiviles' }
    ],
    columnas: [
      { campo: 'IdPersona', titulo: 'Código', tipo: 'numero' },
      { campo: 'Nombre', titulo: 'Nombre' },
      { campo: 'Apellido', titulo: 'Apellido' },
      { campo: 'FechaNacimiento', titulo: 'Nacimiento', tipo: 'fecha' },
      { campo: 'NombreGenero', titulo: 'Género' },
      { campo: 'Direccion', titulo: 'Dirección' },
      { campo: 'Telefono', titulo: 'Teléfono' },
      { campo: 'CorreoElectronico', titulo: 'Correo' },
      { campo: 'NombreEstadoCivil', titulo: 'Estado civil' }
    ],
    descripcionRegistro: (registro) => `a ${registro.Nombre} ${registro.Apellido}`
  };
}
