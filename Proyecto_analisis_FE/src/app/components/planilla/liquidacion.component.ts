import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { PlanillaService } from '../../services/planilla.service';
import { PermisosService } from '../../services/permisos.service';
import { CalculoLiquidacion, CatalogosLiquidacion, Liquidacion } from '../../models/index';
import { formatearFecha, formatearFechaHora, formatearMoneda, mensajeError } from '../../utils/formato';

@Component({
  selector: 'app-liquidacion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './liquidacion.component.html'
})
export class LiquidacionComponent implements OnInit, OnDestroy {
  readonly opcion = 'Liquidacion de Empleado';
  liquidaciones: Liquidacion[] = [];
  catalogos: CatalogosLiquidacion = { empleados: [], puestos: [], motivos: [] };
  form: FormGroup;
  calculo: CalculoLiquidacion | null = null;
  errorCalculo: string | null = null;
  editando: Liquidacion | null = null;
  mostrarFormulario = false;
  isLoading = false;
  isSubmitting = false;
  exportando = false;
  error: string | null = null;
  success: string | null = null;
  moneda = formatearMoneda;
  fecha = formatearFecha;
  fechaHora = formatearFechaHora;
  private destroy$ = new Subject<void>();

  constructor(private planillaService: PlanillaService, public permisosService: PermisosService) {
    this.form = new FormGroup({
      IdEmpleado: new FormControl<number | null>(null, Validators.required),
      IdPuesto: new FormControl<number | null>(null, Validators.required),
      FechaContratacion: new FormControl('', Validators.required),
      FechaEgreso: new FormControl('', Validators.required),
      FechaLiquidacion: new FormControl('', Validators.required),
      MotivoEgreso: new FormControl<string | null>(null, Validators.required),
      IngresoSueldoBase: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
      IngresoBonificacionDecreto: new FormControl<number | null>(250, [Validators.required, Validators.min(0)]),
      IngresoOtrosIngresos: new FormControl<number | null>(0, [Validators.required, Validators.min(0)]),
      DescuentoIgss: new FormControl<number | null>(0, [Validators.required, Validators.min(0)]),
      DescuentoIsr: new FormControl<number | null>(0, [Validators.required, Validators.min(0)]),
      DescuentoInasistencias: new FormControl<number | null>(0, [Validators.required, Validators.min(0)])
    });
  }

  ngOnInit(): void {
    this.cargarCatalogos();
    this.cargarLiquidaciones();

    this.form.get('IdEmpleado')!.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((idEmpleado) => this.precargarEmpleado(idEmpleado));
    this.form.valueChanges.pipe(debounceTime(400), takeUntil(this.destroy$)).subscribe(() => this.recalcular());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private cargarCatalogos(): void {
    this.planillaService.obtenerCatalogosLiquidacion().pipe(takeUntil(this.destroy$)).subscribe({
      next: (catalogos) => (this.catalogos = catalogos),
      error: (err) => (this.error = mensajeError(err, 'Error al cargar los catálogos'))
    });
  }

  cargarLiquidaciones(): void {
    this.isLoading = true;
    this.planillaService.listar<Liquidacion>('liquidaciones').pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.liquidaciones = data || [];
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.error = mensajeError(err, 'Error al cargar las liquidaciones');
      }
    });
  }

  private hoy(): string {
    const ahora = new Date();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');
    return `${ahora.getFullYear()}-${mes}-${dia}`;
  }

  private precargarEmpleado(idEmpleado: number | null): void {
    const empleado = this.catalogos.empleados.find(item => item.Id === Number(idEmpleado));
    if (!empleado || this.editando) return;
    this.form.patchValue({
      IdPuesto: empleado.IdPuesto,
      FechaContratacion: empleado.FechaContratacion,
      IngresoSueldoBase: Number(empleado.IngresoSueldoBase),
      IngresoBonificacionDecreto: Number(empleado.IngresoBonificacionDecreto),
      IngresoOtrosIngresos: Number(empleado.IngresoOtrosIngresos),
      DescuentoIgss: Number(empleado.DescuentoIgss),
      DescuentoIsr: Number(empleado.DescuentoIsr),
      DescuentoInasistencias: Number(empleado.DescuentoInasistencias)
    });
  }

  abrirFormulario(liquidacion?: Liquidacion): void {
    this.mostrarFormulario = true;
    this.error = null;
    this.success = null;
    this.calculo = null;
    this.errorCalculo = null;
    this.editando = liquidacion || null;

    if (liquidacion) {
      this.form.reset({
        IdEmpleado: liquidacion.IdEmpleado,
        IdPuesto: liquidacion.IdPuesto,
        FechaContratacion: liquidacion.FechaContratacion,
        FechaEgreso: liquidacion.FechaEgreso,
        FechaLiquidacion: liquidacion.FechaLiquidacion,
        MotivoEgreso: liquidacion.MotivoEgreso,
        IngresoSueldoBase: Number(liquidacion.IngresoSueldoBase),
        IngresoBonificacionDecreto: Number(liquidacion.IngresoBonificacionDecreto),
        IngresoOtrosIngresos: Number(liquidacion.IngresoOtrosIngresos),
        DescuentoIgss: Number(liquidacion.DescuentoIgss),
        DescuentoIsr: Number(liquidacion.DescuentoIsr),
        DescuentoInasistencias: Number(liquidacion.DescuentoInasistencias)
      }, { emitEvent: false });
      this.form.get('IdEmpleado')!.disable({ emitEvent: false });
      this.recalcular();
    } else {
      const hoy = this.hoy();
      this.form.reset({
        IdEmpleado: null,
        IdPuesto: null,
        FechaContratacion: '',
        FechaEgreso: hoy,
        FechaLiquidacion: hoy,
        MotivoEgreso: null,
        IngresoSueldoBase: null,
        IngresoBonificacionDecreto: 250,
        IngresoOtrosIngresos: 0,
        DescuentoIgss: 0,
        DescuentoIsr: 0,
        DescuentoInasistencias: 0
      }, { emitEvent: false });
      this.form.get('IdEmpleado')!.enable({ emitEvent: false });
    }
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.editando = null;
    this.calculo = null;
    this.errorCalculo = null;
  }

  private armarPayload(): Partial<Liquidacion> {
    const valores = this.form.getRawValue();
    return {
      IdEmpleado: Number(valores.IdEmpleado),
      IdPuesto: Number(valores.IdPuesto),
      FechaContratacion: valores.FechaContratacion,
      FechaEgreso: valores.FechaEgreso,
      FechaLiquidacion: valores.FechaLiquidacion,
      MotivoEgreso: valores.MotivoEgreso,
      IngresoSueldoBase: Number(valores.IngresoSueldoBase),
      IngresoBonificacionDecreto: Number(valores.IngresoBonificacionDecreto),
      IngresoOtrosIngresos: Number(valores.IngresoOtrosIngresos),
      DescuentoIgss: Number(valores.DescuentoIgss),
      DescuentoIsr: Number(valores.DescuentoIsr),
      DescuentoInasistencias: Number(valores.DescuentoInasistencias)
    };
  }

  private recalcular(): void {
    if (!this.mostrarFormulario) return;
    if (this.form.invalid) {
      this.calculo = null;
      this.errorCalculo = null;
      return;
    }
    this.planillaService.calcularLiquidacion(this.armarPayload()).pipe(takeUntil(this.destroy$)).subscribe({
      next: (calculo) => {
        this.calculo = calculo;
        this.errorCalculo = null;
      },
      error: (err) => {
        this.calculo = null;
        this.errorCalculo = mensajeError(err, 'No se pudo calcular la liquidación');
      }
    });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.error = null;
    const payload = this.armarPayload();
    const peticion = this.editando?.IdLiquidacion
      ? this.planillaService.actualizarLiquidacion(this.editando.IdLiquidacion, payload)
      : this.planillaService.registrarLiquidacion(payload);

    peticion.pipe(takeUntil(this.destroy$)).subscribe({
      next: (respuesta) => {
        this.isSubmitting = false;
        const aviso = respuesta?.statusActualizado ? ` El empleado pasó al status ${respuesta.statusActualizado}.` : '';
        this.success = `${respuesta?.mensaje || 'Liquidación guardada exitosamente'}.${aviso}`;
        this.cerrarFormulario();
        this.cargarLiquidaciones();
        this.cargarCatalogos();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.error = mensajeError(err, 'Error al guardar la liquidación');
      }
    });
  }

  invalido(campo: string): boolean {
    const control = this.form.get(campo);
    return !!control && control.invalid && control.touched;
  }

  imprimirListado(): void {
    this.abrirPdf('liquidaciones/pdf');
  }

  imprimirDocumento(liquidacion: Liquidacion): void {
    this.abrirPdf(`liquidaciones/${liquidacion.IdLiquidacion}/pdf`);
  }

  exportarListado(): void {
    this.descargarExcel('liquidaciones/excel', 'liquidaciones-empleados');
  }

  exportarDocumento(liquidacion: Liquidacion): void {
    this.descargarExcel(`liquidaciones/${liquidacion.IdLiquidacion}/excel`, `liquidacion-${liquidacion.IdLiquidacion}`);
  }

  private abrirPdf(ruta: string): void {
    this.exportando = true;
    this.error = null;
    const ventana = window.open('', '_blank');
    this.planillaService.abrirPdf(ruta, ventana).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => (this.exportando = false),
      error: (err) => {
        this.exportando = false;
        this.error = mensajeError(err, 'Error al generar el PDF');
      }
    });
  }

  private descargarExcel(ruta: string, nombre: string): void {
    this.exportando = true;
    this.error = null;
    this.planillaService.descargarExcel(ruta, nombre).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => (this.exportando = false),
      error: (err) => {
        this.exportando = false;
        this.error = mensajeError(err, 'Error al generar el archivo de Excel');
      }
    });
  }
}
