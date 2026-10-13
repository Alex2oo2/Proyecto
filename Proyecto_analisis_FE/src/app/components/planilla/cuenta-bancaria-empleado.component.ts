import { Component } from '@angular/core';
import { CrudPlanillaComponent } from './crud-planilla.component';
import { ConfigCrud } from './crud-config';

@Component({
  selector: 'app-cuenta-bancaria-empleado',
  standalone: true,
  imports: [CrudPlanillaComponent],
  template: '<app-crud-planilla [config]="config"></app-crud-planilla>'
})
export class CuentaBancariaEmpleadoComponent {
  config: ConfigCrud = {
    titulo: 'Cuentas Bancarias de Empleados',
    descripcion: 'Administra las cuentas bancarias utilizadas para el pago a los empleados',
    recurso: 'cuentas-bancarias',
    opcion: 'Cuentas Bancarias Empleados',
    singular: 'cuenta bancaria',
    claves: ['IdCuentaBancaria'],
    campos: [
      { nombre: 'IdEmpleado', etiqueta: 'Empleado', tipo: 'select', requerido: true, catalogo: 'empleados' },
      { nombre: 'IdBanco', etiqueta: 'Banco', tipo: 'select', requerido: true, catalogo: 'bancos' },
      { nombre: 'NumeroDeCuenta', etiqueta: 'Número de cuenta', tipo: 'texto', requerido: true, longitudMaxima: 50 },
      { nombre: 'Activa', etiqueta: 'Cuenta activa', tipo: 'booleano' }
    ],
    columnas: [
      { campo: 'IdCuentaBancaria', titulo: 'Código', tipo: 'numero' },
      { campo: 'NombreEmpleado', titulo: 'Empleado' },
      { campo: 'NombreBanco', titulo: 'Banco' },
      { campo: 'NumeroDeCuenta', titulo: 'Número de cuenta' },
      { campo: 'Activa', titulo: 'Activa', tipo: 'booleano' }
    ],
    descripcionRegistro: (registro) => `la cuenta ${registro.NumeroDeCuenta} de ${registro.NombreEmpleado}`
  };
}
