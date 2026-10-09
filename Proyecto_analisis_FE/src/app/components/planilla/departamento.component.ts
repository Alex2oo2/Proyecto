import { Component } from '@angular/core';
import { CrudPlanillaComponent } from './crud-planilla.component';
import { ConfigCrud } from './crud-config';

@Component({
  selector: 'app-departamento',
  standalone: true,
  imports: [CrudPlanillaComponent],
  template: '<app-crud-planilla [config]="config"></app-crud-planilla>'
})
export class DepartamentoComponent {
  config: ConfigCrud = {
    titulo: 'Departamentos',
    descripcion: 'Administra los departamentos de la estructura organizacional de la empresa',
    recurso: 'departamentos',
    opcion: 'Departamentos',
    singular: 'departamento',
    claves: ['IdDepartamento'],
    campos: [
      { nombre: 'Nombre', etiqueta: 'Nombre del departamento', tipo: 'texto', requerido: true, longitudMaxima: 50 },
      { nombre: 'IdEmpresa', etiqueta: 'Empresa', tipo: 'select', requerido: true, catalogo: 'empresas' }
    ],
    columnas: [
      { campo: 'IdDepartamento', titulo: 'Código', tipo: 'numero' },
      { campo: 'Nombre', titulo: 'Nombre' },
      { campo: 'NombreEmpresa', titulo: 'Empresa' }
    ],
    descripcionRegistro: (registro) => `el departamento "${registro.Nombre}"`
  };
}
