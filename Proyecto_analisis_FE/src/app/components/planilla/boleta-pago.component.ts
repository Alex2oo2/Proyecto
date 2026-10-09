import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { PlanillaService } from '../../services/planilla.service';
import { PermisosService } from '../../services/permisos.service';
import { BoletaPago, OpcionCatalogo, PeriodoPlanilla } from '../../models/index';
import { descripcionPeriodo, formatearFecha, formatearMoneda, mensajeError } from '../../utils/formato';

@Component({
  selector: 'app-boleta-pago',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './boleta-pago.component.html'
})
export class BoletaPagoComponent implements OnInit, OnDestroy {
  readonly opcion = 'Boletas de Pago';
  periodos: PeriodoPlanilla[] = [];
  empleados: OpcionCatalogo[] = [];
  periodoSeleccionado = '';
  empleadoSeleccionado: number | null = null;
  boleta: BoletaPago | null = null;
  isLoading = false;
  isLoadingBoleta = false;
  exportando = false;
  error: string | null = null;
  moneda = formatearMoneda;
  fecha = formatearFecha;
  private destroy$ = new Subject<void>();

  constructor(private planillaService: PlanillaService, public permisosService: PermisosService) { }

  ngOnInit(): void {
    this.isLoading = true;
    this.planillaService.obtenerPeriodosBoleta().pipe(takeUntil(this.destroy$)).subscribe({
      next: (periodos) => {
        this.periodos = periodos || [];
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.error = mensajeError(err, 'Error al cargar los periodos de planilla');
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  claveDe(periodo: PeriodoPlanilla): string {
    return `${periodo.Anio}-${periodo.Mes}`;
  }

  etiqueta(periodo: PeriodoPlanilla): string {
    return descripcionPeriodo(periodo.Anio, periodo.Mes);
  }

  private get periodo(): PeriodoPlanilla | undefined {
    return this.periodos.find(item => this.claveDe(item) === this.periodoSeleccionado);
  }

  seleccionarPeriodo(): void {
    const periodo = this.periodo;
    this.empleados = [];
    this.empleadoSeleccionado = null;
    this.boleta = null;
    this.error = null;
    if (!periodo) return;

    this.planillaService.obtenerEmpleadosBoleta(periodo.Anio, periodo.Mes).pipe(takeUntil(this.destroy$)).subscribe({
      next: (empleados) => (this.empleados = empleados || []),
      error: (err) => (this.error = mensajeError(err, 'Error al cargar los empleados de la planilla'))
    });
  }

  seleccionarEmpleado(): void {
    const periodo = this.periodo;
    this.boleta = null;
    this.error = null;
    if (!periodo || this.empleadoSeleccionado === null) return;

    this.isLoadingBoleta = true;
    this.planillaService.obtenerBoleta(periodo.Anio, periodo.Mes, this.empleadoSeleccionado).pipe(takeUntil(this.destroy$)).subscribe({
      next: (boleta) => {
        this.boleta = boleta;
        this.isLoadingBoleta = false;
      },
      error: (err) => {
        this.isLoadingBoleta = false;
        this.error = mensajeError(err, 'Error al consultar la boleta');
      }
    });
  }

  imprimir(): void {
    const periodo = this.periodo;
    if (!periodo || this.empleadoSeleccionado === null) return;
    this.exportando = true;
    this.error = null;
    const ventana = window.open('', '_blank');
    this.planillaService.abrirPdf(`boletas/${periodo.Anio}/${periodo.Mes}/${this.empleadoSeleccionado}/pdf`, ventana)
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: () => (this.exportando = false),
        error: (err) => {
          this.exportando = false;
          this.error = mensajeError(err, 'Error al generar el PDF');
        }
      });
  }

  exportar(): void {
    const periodo = this.periodo;
    if (!periodo || this.empleadoSeleccionado === null) return;
    this.exportando = true;
    this.error = null;
    this.planillaService.descargarExcel(
      `boletas/${periodo.Anio}/${periodo.Mes}/${this.empleadoSeleccionado}/excel`,
      `boleta-${periodo.Anio}-${String(periodo.Mes).padStart(2, '0')}-${this.empleadoSeleccionado}`
    ).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => (this.exportando = false),
      error: (err) => {
        this.exportando = false;
        this.error = mensajeError(err, 'Error al generar el archivo de Excel');
      }
    });
  }
}
