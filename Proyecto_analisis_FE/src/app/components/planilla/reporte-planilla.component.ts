import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { PlanillaService } from '../../services/planilla.service';
import { PermisosService } from '../../services/permisos.service';
import { PeriodoPlanilla, ReportePlanilla } from '../../models/index';
import { descripcionPeriodo, formatearFecha, formatearFechaHora, formatearMoneda, mensajeError } from '../../utils/formato';

@Component({
  selector: 'app-reporte-planilla',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reporte-planilla.component.html'
})
export class ReportePlanillaComponent implements OnInit, OnDestroy {
  readonly opcion = 'Reporte de Planilla';
  periodos: PeriodoPlanilla[] = [];
  periodoSeleccionado = '';
  reporte: ReportePlanilla | null = null;
  isLoading = false;
  isLoadingReporte = false;
  exportando = false;
  error: string | null = null;
  moneda = formatearMoneda;
  fecha = formatearFecha;
  fechaHora = formatearFechaHora;
  private destroy$ = new Subject<void>();

  constructor(private planillaService: PlanillaService, public permisosService: PermisosService) { }

  ngOnInit(): void {
    this.isLoading = true;
    this.planillaService.obtenerPeriodosReporte().pipe(takeUntil(this.destroy$)).subscribe({
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

  consultar(): void {
    const periodo = this.periodo;
    this.reporte = null;
    this.error = null;
    if (!periodo) return;

    this.isLoadingReporte = true;
    this.planillaService.obtenerReporte(periodo.Anio, periodo.Mes).pipe(takeUntil(this.destroy$)).subscribe({
      next: (reporte) => {
        this.reporte = reporte;
        this.isLoadingReporte = false;
      },
      error: (err) => {
        this.isLoadingReporte = false;
        this.error = mensajeError(err, 'Error al consultar el reporte');
      }
    });
  }

  imprimir(): void {
    const periodo = this.periodo;
    if (!periodo) return;
    this.exportando = true;
    this.error = null;
    const ventana = window.open('', '_blank');
    this.planillaService.abrirPdf(`reporte/${periodo.Anio}/${periodo.Mes}/pdf`, ventana).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => (this.exportando = false),
      error: (err) => {
        this.exportando = false;
        this.error = mensajeError(err, 'Error al generar el PDF');
      }
    });
  }

  exportar(): void {
    const periodo = this.periodo;
    if (!periodo) return;
    this.exportando = true;
    this.error = null;
    this.planillaService.descargarExcel(
      `reporte/${periodo.Anio}/${periodo.Mes}/excel`,
      `planilla-${periodo.Anio}-${String(periodo.Mes).padStart(2, '0')}`
    ).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => (this.exportando = false),
      error: (err) => {
        this.exportando = false;
        this.error = mensajeError(err, 'Error al generar el archivo de Excel');
      }
    });
  }
}
