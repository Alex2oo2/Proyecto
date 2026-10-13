import { Component } from '@angular/core';
import { debounceTime, merge, takeUntil } from 'rxjs';
import { CrudPlanillaComponent } from './crud-planilla.component';
import { ConfigCrud } from './crud-config';

@Component({
  selector: 'app-empleado',
  standalone: true,
  imports: [CrudPlanillaComponent],
  template: '<app-crud-planilla [config]="config"></app-crud-planilla>'
})
export class EmpleadoComponent {
  config: ConfigCrud = {
    titulo: 'Empleados',
    descripcion: 'Administra la información laboral base utilizada en el cálculo de la planilla',
    recurso: 'empleados',
    opcion: 'Empleados',
    singular: 'empleado',
    claves: ['IdEmpleado'],
    campos: [
      { nombre: 'IdPersona', etiqueta: 'Persona', tipo: 'select', requerido: true, catalogo: 'personas' },
      { nombre: 'IdSucursal', etiqueta: 'Sucursal', tipo: 'select', requerido: true, catalogo: 'sucursales' },
      { nombre: 'FechaContratacion', etiqueta: 'Fecha de contratación', tipo: 'fecha', requerido: true },
      { nombre: 'IdPuesto', etiqueta: 'Puesto', tipo: 'select', requerido: true, catalogo: 'puestos' },
      { nombre: 'IdStatusEmpleado', etiqueta: 'Status del empleado', tipo: 'select', requerido: true, catalogo: 'statusEmpleados', valorInicial: 1 },
      { nombre: 'IngresoSueldoBase', etiqueta: 'Sueldo base (Q)', tipo: 'moneda', requerido: true },
      { nombre: 'IngresoBonificacionDecreto', etiqueta: 'Bonificación Decreto 78-89 (Q)', tipo: 'moneda', requerido: true, valorInicial: 250 },
      { nombre: 'IngresoOtrosIngresos', etiqueta: 'Otros ingresos (Q)', tipo: 'moneda', requerido: true, valorInicial: 0 },
      { nombre: 'DescuentoIgss', etiqueta: 'Descuento IGSS (Q)', tipo: 'moneda', requerido: true, valorInicial: 0, ayuda: 'Cuota laboral del 4.83% sobre sueldo base y otros ingresos' },
      { nombre: 'DescuentoIsr', etiqueta: 'Descuento ISR (Q)', tipo: 'moneda', requerido: true, valorInicial: 0, ayuda: 'Retención mensual estimada con la tarifa del ISR de Guatemala (5% / 7%)' },
      { nombre: 'DescuentoInasistencias', etiqueta: 'Descuento por inasistencias (Q)', tipo: 'moneda', requerido: true, valorInicial: 0 }
    ],
    columnas: [
      { campo: 'IdEmpleado', titulo: 'Código', tipo: 'numero' },
      { campo: 'NombrePersona', titulo: 'Persona' },
      { campo: 'NombreSucursal', titulo: 'Sucursal' },
      { campo: 'FechaContratacion', titulo: 'Contratación', tipo: 'fecha' },
      { campo: 'NombrePuesto', titulo: 'Puesto' },
      { campo: 'NombreStatus', titulo: 'Status' },
      { campo: 'IngresoSueldoBase', titulo: 'Sueldo base', tipo: 'moneda' },
      { campo: 'IngresoBonificacionDecreto', titulo: 'Bonificación', tipo: 'moneda' },
      { campo: 'IngresoOtrosIngresos', titulo: 'Otros ingresos', tipo: 'moneda' },
      { campo: 'DescuentoIgss', titulo: 'IGSS', tipo: 'moneda' },
      { campo: 'DescuentoIsr', titulo: 'ISR', tipo: 'moneda' },
      { campo: 'DescuentoInasistencias', titulo: 'Inasistencias', tipo: 'moneda' }
    ],
    descripcionRegistro: (registro) => `al empleado ${registro.NombrePersona}`,
    configurarFormulario: (form, { planillaService, destroy$ }) => {
      merge(form.get('IngresoSueldoBase')!.valueChanges, form.get('IngresoOtrosIngresos')!.valueChanges)
        .pipe(debounceTime(300), takeUntil(destroy$))
        .subscribe(() => {
          const sueldoBase = Number(form.get('IngresoSueldoBase')!.value);
          const otrosIngresos = Number(form.get('IngresoOtrosIngresos')!.value) || 0;
          if (!(sueldoBase > 0) || otrosIngresos < 0) return;
          planillaService.calcularDescuentosEmpleado(sueldoBase, otrosIngresos).subscribe({
            next: (descuentos) => form.patchValue(
              { DescuentoIgss: descuentos.DescuentoIgss, DescuentoIsr: descuentos.DescuentoIsr },
              { emitEvent: false }
            )
          });
        });
    }
  };
}
