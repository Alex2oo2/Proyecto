import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { PlanillaService } from '../../services/planilla.service';
import { PermisosService } from '../../services/permisos.service';
import { PeriodoPlanilla, ResultadoCalculoPlanilla } from '../../models/index';
import { descripcionPeriodo, formatearFecha, formatearFechaHora, formatearMoneda, mensajeError } from '../../utils/formato';

@Component({
  selector: 'app-calculo-planilla',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './calculo-planilla.component.html'
})
export class CalculoPlanillaComponent implements OnInit, OnDestroy {
  readonly opcion = 'Calcular Planilla';
  periodos: PeriodoPlanilla[] = [];
  periodoSeleccionado = '';
  resultado: ResultadoCalculoPlanilla | null = null;
  isLoading = false;
  isProcessing = false;
  error: string | null = null;
  success: string | null = null;
  moneda = formatearMoneda;
  fecha = formatearFecha;
  fechaHora = formatearFechaHora;
  private destroy$ = new Subject<void>();

  constructor(private planillaService: PlanillaService, public permisosService: PermisosService) { }

  ngOnInit(): void {
    this.cargarPeriodos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private clavePeriodo(periodo: PeriodoPlanilla): string {
    return `${periodo.Anio}-${periodo.Mes}`;
  }

  etiqueta(periodo: PeriodoPlanilla): string {
    return `${descripcionPeriodo(periodo.Anio, periodo.Mes)}${periodo.Calculada ? ' (calculada)' : ''}`;
  }

  get periodo(): PeriodoPlanilla | undefined {
    return this.periodos.find(item => this.clavePeriodo(item) === this.periodoSeleccionado);
  }

  claveDe(periodo: PeriodoPlanilla): string {
    return this.clavePeriodo(periodo);
  }

  seguirPeriodo = (_indice: number, periodo: PeriodoPlanilla): string => this.clavePeriodo(periodo);

  cargarPeriodos(): void {
    this.isLoading = true;
    this.planillaService.obtenerPeriodos().pipe(takeUntil(this.destroy$)).subscribe({
      next: (periodos) => {
        this.periodos = periodos || [];
        this.isLoading = false;
        if (!this.periodo) this.periodoSeleccionado = '';
      },
      error: (err) => {
        this.isLoading = false;
        this.error = mensajeError(err, 'Error al cargar los periodos de planilla');
      }
    });
  }

  seleccionarPeriodo(): void {
    this.resultado = null;
    this.error = null;
    this.success = null;
  }

  calcular(): void {
    const periodo = this.periodo;
    if (!periodo) return;
    const reprocesar = periodo.Calculada === 1;
    const descripcion = descripcionPeriodo(periodo.Anio, periodo.Mes);
    const mensaje = reprocesar
      ? `La planilla de ${descripcion} ya fue calculada. ¿Deseas recalcularla? Se reemplazará el resultado anterior.`
      : `¿Deseas calcular la planilla de ${descripcion}?`;
    if (!confirm(mensaje)) return;

    this.isProcessing = true;
    this.error = null;
    this.success = null;
    this.resultado = null;
    this.planillaService.calcularPlanilla(periodo.Anio, periodo.Mes, reprocesar).pipe(takeUntil(this.destroy$)).subscribe({
      next: (respuesta) => {
        this.isProcessing = false;
        this.success = respuesta.mensaje;
        this.resultado = respuesta.resultado;
        this.cargarPeriodos();
      },
      error: (err) => {
        this.isProcessing = false;
        this.error = mensajeError(err, 'Error al calcular la planilla');
      }
    });
  }
}
