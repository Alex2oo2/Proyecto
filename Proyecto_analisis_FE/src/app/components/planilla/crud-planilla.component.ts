import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { PlanillaService } from '../../services/planilla.service';
import { PermisosService } from '../../services/permisos.service';
import { CatalogosPlanilla } from '../../models/index';
import { CampoCrud, ColumnaCrud, ConfigCrud } from './crud-config';
import { esVerdadero, formatearFechaHora, formatearValor, mensajeError } from '../../utils/formato';

@Component({
  selector: 'app-crud-planilla',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './crud-planilla.component.html'
})
export class CrudPlanillaComponent implements OnInit, OnDestroy {
  @Input({ required: true }) config!: ConfigCrud;

  registros: any[] = [];
  catalogos: CatalogosPlanilla = {};
  form: FormGroup = new FormGroup({});
  editando: any = null;
  mostrarFormulario = false;
  isLoading = false;
  isSubmitting = false;
  exportando = false;
  error: string | null = null;
  success: string | null = null;
  busqueda = '';
  pagina = 1;
  tamanoPagina = 10;
  tamanosPagina = [10, 25, 50, 100];
  private destroy$ = new Subject<void>();

  constructor(private planillaService: PlanillaService, public permisosService: PermisosService) { }

  ngOnInit(): void {
    this.construirFormulario();
    this.cargarCatalogos();
    this.cargarRegistros();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private construirFormulario(): void {
    const controles: { [nombre: string]: FormControl } = {};
    for (const campo of this.config.campos) {
      const validadores: ValidatorFn[] = [];
      if (campo.requerido) validadores.push(Validators.required);
      if (campo.longitudMaxima) validadores.push(Validators.maxLength(campo.longitudMaxima));
      if (campo.tipo === 'correo') validadores.push(Validators.email);
      if (campo.tipo === 'numero' || campo.tipo === 'moneda') validadores.push(Validators.min(0));
      controles[campo.nombre] = new FormControl(this.valorInicial(campo), validadores);
    }
    this.form = new FormGroup(controles);
    if (this.config.configurarFormulario) {
      this.config.configurarFormulario(this.form, { planillaService: this.planillaService, destroy$: this.destroy$ });
    }
  }

  private valorInicial(campo: CampoCrud): any {
    if (campo.valorInicial !== undefined) return campo.valorInicial;
    if (campo.tipo === 'booleano') return true;
    return campo.tipo === 'select' ? null : '';
  }

  private cargarCatalogos(): void {
    if (!this.config.campos.some(campo => campo.catalogo)) return;
    this.planillaService.obtenerCatalogos(this.config.recurso).pipe(takeUntil(this.destroy$)).subscribe({
      next: (catalogos) => (this.catalogos = catalogos || {}),
      error: (err) => (this.error = mensajeError(err, 'Error al cargar los catálogos'))
    });
  }

  cargarRegistros(): void {
    this.isLoading = true;
    this.error = null;
    this.planillaService.listar(this.config.recurso).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.registros = data || [];
        this.isLoading = false;
        this.ajustarPagina();
      },
      error: (err) => {
        this.isLoading = false;
        this.error = mensajeError(err, 'Error al cargar los registros');
      }
    });
  }

  opcionesDe(campo: CampoCrud) {
    return (campo.catalogo && this.catalogos[campo.catalogo]) || [];
  }

  modificable(registro: any): boolean {
    return this.config.puedeModificar ? this.config.puedeModificar(registro) : true;
  }

  abrirFormulario(registro?: any): void {
    this.mostrarFormulario = true;
    this.error = null;
    this.success = null;
    this.editando = registro || null;

    const valores: { [nombre: string]: any } = {};
    for (const campo of this.config.campos) {
      let valor = registro ? registro[campo.nombre] : this.valorInicial(campo);
      if (campo.tipo === 'booleano') {
        valor = registro ? esVerdadero(valor) : valor;
      } else if (valor === null || valor === undefined) {
        valor = campo.tipo === 'select' ? null : '';
      }
      if (!registro && campo.tipo === 'select' && valor === null && this.opcionesDe(campo).length === 1) {
        valor = this.opcionesDe(campo)[0].Id;
      }
      valores[campo.nombre] = valor;
    }
    this.form.reset(valores, { emitEvent: false });

    for (const campo of this.config.campos) {
      const control = this.form.get(campo.nombre)!;
      const bloquear = campo.soloLectura || (registro && campo.soloLecturaAlEditar);
      if (bloquear) control.disable({ emitEvent: false });
      else control.enable({ emitEvent: false });
    }
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.editando = null;
  }

  private armarPayload(): any {
    const valores = this.form.getRawValue();
    const payload: { [nombre: string]: any } = {};
    for (const campo of this.config.campos) {
      let valor = valores[campo.nombre];
      if (campo.tipo === 'numero' || campo.tipo === 'moneda') {
        valor = valor === '' || valor === null ? null : Number(valor);
      } else if (campo.tipo === 'select') {
        valor = valor === null || valor === '' ? null : Number(valor);
      } else if (typeof valor === 'string') {
        valor = valor.trim();
      }
      payload[campo.nombre] = valor;
    }
    return payload;
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.error = null;
    const payload = this.armarPayload();
    const peticion = this.editando
      ? this.planillaService.actualizar(this.config.recurso, this.config.claves.map(clave => this.editando[clave]), payload)
      : this.planillaService.crear(this.config.recurso, payload);

    peticion.pipe(takeUntil(this.destroy$)).subscribe({
      next: (respuesta) => {
        this.isSubmitting = false;
        this.success = respuesta?.mensaje || 'Operación realizada exitosamente';
        this.cerrarFormulario();
        this.cargarRegistros();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.error = mensajeError(err, `Error al guardar ${this.config.singular}`);
      }
    });
  }

  eliminar(registro: any): void {
    if (!confirm(`¿Estás seguro de que deseas eliminar ${this.config.descripcionRegistro(registro)}?`)) return;
    this.error = null;
    this.success = null;
    this.planillaService.eliminar(this.config.recurso, this.config.claves.map(clave => registro[clave]))
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: (respuesta) => {
          this.success = respuesta?.mensaje || 'Registro eliminado exitosamente';
          this.cargarRegistros();
        },
        error: (err) => (this.error = mensajeError(err, `Error al eliminar ${this.config.singular}`))
      });
  }

  imprimir(): void {
    this.exportando = true;
    this.error = null;
    const ventana = window.open('', '_blank');
    this.planillaService.abrirPdf(`${this.config.recurso}/pdf`, ventana).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => (this.exportando = false),
      error: (err) => {
        this.exportando = false;
        this.error = mensajeError(err, 'Error al generar el PDF');
      }
    });
  }

  exportar(): void {
    this.exportando = true;
    this.error = null;
    this.planillaService.descargarExcel(`${this.config.recurso}/excel`, this.config.recurso).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => (this.exportando = false),
      error: (err) => {
        this.exportando = false;
        this.error = mensajeError(err, 'Error al generar el archivo de Excel');
      }
    });
  }

  valorCelda(registro: any, columna: ColumnaCrud): string {
    return formatearValor(registro[columna.campo], columna.tipo);
  }

  esNumerica(columna: ColumnaCrud): boolean {
    return columna.tipo === 'moneda' || columna.tipo === 'numero';
  }

  get registrosFiltrados(): any[] {
    const termino = this.busqueda.trim().toLowerCase();
    if (!termino) return this.registros;
    return this.registros.filter(registro =>
      this.config.columnas.some(columna => this.valorCelda(registro, columna).toLowerCase().includes(termino))
    );
  }

  get registrosPagina(): any[] {
    const inicio = (this.pagina - 1) * this.tamanoPagina;
    return this.registrosFiltrados.slice(inicio, inicio + this.tamanoPagina);
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.registrosFiltrados.length / this.tamanoPagina));
  }

  get rangoVisible(): string {
    const total = this.registrosFiltrados.length;
    if (!total) return '0 registros';
    const inicio = (this.pagina - 1) * this.tamanoPagina + 1;
    const fin = Math.min(total, this.pagina * this.tamanoPagina);
    return `${inicio} - ${fin} de ${total}`;
  }

  cambiarPagina(delta: number): void {
    this.pagina = Math.min(this.totalPaginas, Math.max(1, this.pagina + delta));
  }

  reiniciarPagina(): void {
    this.pagina = 1;
  }

  private ajustarPagina(): void {
    if (this.pagina > this.totalPaginas) this.pagina = this.totalPaginas;
  }

  get auditoria(): string {
    if (!this.editando) return '';
    const partes = [`Creado por ${this.editando.UsuarioCreacion || '-'} el ${formatearFechaHora(this.editando.FechaCreacion)}`];
    if (this.editando.FechaModificacion) {
      partes.push(`Modificado por ${this.editando.UsuarioModificacion || '-'} el ${formatearFechaHora(this.editando.FechaModificacion)}`);
    }
    return partes.join(' | ');
  }

  invalido(campo: CampoCrud): boolean {
    const control = this.form.get(campo.nombre);
    return !!control && control.invalid && control.touched;
  }
}
