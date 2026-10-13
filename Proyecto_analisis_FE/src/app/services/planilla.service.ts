import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import {
  BoletaPago,
  CalculoLiquidacion,
  CatalogosLiquidacion,
  CatalogosPlanilla,
  Liquidacion,
  OpcionCatalogo,
  PeriodoPlanilla,
  ReportePlanilla,
  ResultadoCalculoPlanilla
} from '../models/index';

@Injectable({
  providedIn: 'root'
})
export class PlanillaService {
  private apiUrl = 'http://localhost:3000/planilla';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  private rutaRecurso(recurso: string, claves?: (string | number)[]): string {
    const sufijo = claves && claves.length ? `/${claves.map(clave => encodeURIComponent(String(clave))).join('/')}` : '';
    return `${this.apiUrl}/${recurso}${sufijo}`;
  }

  listar<T = any>(recurso: string): Observable<T[]> {
    return this.http.get<T[]>(this.rutaRecurso(recurso), { headers: this.getHeaders() });
  }

  obtenerCatalogos(recurso: string): Observable<CatalogosPlanilla> {
    return this.http.get<CatalogosPlanilla>(`${this.rutaRecurso(recurso)}/catalogos`, { headers: this.getHeaders() });
  }

  crear(recurso: string, datos: any): Observable<any> {
    return this.http.post(this.rutaRecurso(recurso), datos, { headers: this.getHeaders() });
  }

  actualizar(recurso: string, claves: (string | number)[], datos: any): Observable<any> {
    return this.http.put(this.rutaRecurso(recurso, claves), datos, { headers: this.getHeaders() });
  }

  eliminar(recurso: string, claves: (string | number)[]): Observable<any> {
    return this.http.delete(this.rutaRecurso(recurso, claves), { headers: this.getHeaders() });
  }

  calcularDescuentosEmpleado(sueldoBase: number, otrosIngresos: number): Observable<{ DescuentoIgss: number; DescuentoIsr: number; IngresoBonificacionDecreto: number }> {
    return this.http.post<{ DescuentoIgss: number; DescuentoIsr: number; IngresoBonificacionDecreto: number }>(
      `${this.apiUrl}/empleados/descuentos`,
      { IngresoSueldoBase: sueldoBase, IngresoOtrosIngresos: otrosIngresos },
      { headers: this.getHeaders() }
    );
  }

  obtenerPeriodos(): Observable<PeriodoPlanilla[]> {
    return this.http.get<PeriodoPlanilla[]>(`${this.apiUrl}/calculo/periodos`, { headers: this.getHeaders() });
  }

  calcularPlanilla(anio: number, mes: number, reprocesar: boolean): Observable<{ mensaje: string; resultado: ResultadoCalculoPlanilla }> {
    return this.http.post<{ mensaje: string; resultado: ResultadoCalculoPlanilla }>(
      `${this.apiUrl}/calculo`,
      { Anio: anio, Mes: mes, Reprocesar: reprocesar },
      { headers: this.getHeaders() }
    );
  }

  obtenerPeriodosReporte(): Observable<PeriodoPlanilla[]> {
    return this.http.get<PeriodoPlanilla[]>(`${this.apiUrl}/reporte/periodos`, { headers: this.getHeaders() });
  }

  obtenerReporte(anio: number, mes: number): Observable<ReportePlanilla> {
    return this.http.get<ReportePlanilla>(`${this.apiUrl}/reporte/${anio}/${mes}`, { headers: this.getHeaders() });
  }

  obtenerPeriodosBoleta(): Observable<PeriodoPlanilla[]> {
    return this.http.get<PeriodoPlanilla[]>(`${this.apiUrl}/boletas/periodos`, { headers: this.getHeaders() });
  }

  obtenerEmpleadosBoleta(anio: number, mes: number): Observable<OpcionCatalogo[]> {
    return this.http.get<OpcionCatalogo[]>(`${this.apiUrl}/boletas/empleados/${anio}/${mes}`, { headers: this.getHeaders() });
  }

  obtenerBoleta(anio: number, mes: number, idEmpleado: number): Observable<BoletaPago> {
    return this.http.get<BoletaPago>(`${this.apiUrl}/boletas/${anio}/${mes}/${idEmpleado}`, { headers: this.getHeaders() });
  }

  obtenerCatalogosLiquidacion(): Observable<CatalogosLiquidacion> {
    return this.http.get<CatalogosLiquidacion>(`${this.apiUrl}/liquidaciones/catalogos`, { headers: this.getHeaders() });
  }

  calcularLiquidacion(datos: Partial<Liquidacion>): Observable<CalculoLiquidacion> {
    return this.http.post<CalculoLiquidacion>(`${this.apiUrl}/liquidaciones/calcular`, datos, { headers: this.getHeaders() });
  }

  registrarLiquidacion(datos: Partial<Liquidacion>): Observable<any> {
    return this.http.post(`${this.apiUrl}/liquidaciones`, datos, { headers: this.getHeaders() });
  }

  actualizarLiquidacion(id: number, datos: Partial<Liquidacion>): Observable<any> {
    return this.http.put(`${this.apiUrl}/liquidaciones/${id}`, datos, { headers: this.getHeaders() });
  }

  descargar(ruta: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${ruta}`, {
      headers: this.getHeaders(),
      responseType: 'blob'
    }).pipe(
      catchError(error => from(this.normalizarErrorBlob(error)).pipe(switchMap(normalizado => throwError(() => normalizado))))
    );
  }

  private async normalizarErrorBlob(error: any): Promise<any> {
    if (error?.error instanceof Blob) {
      try {
        const contenido = JSON.parse(await error.error.text());
        return { ...error, error: contenido };
      } catch {
        return error;
      }
    }
    return error;
  }

  abrirPdf(ruta: string, ventana: Window | null): Observable<void> {
    return new Observable<void>(observer => {
      this.descargar(ruta).subscribe({
        next: blob => {
          const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
          if (ventana && !ventana.closed) {
            ventana.location.href = url;
          } else {
            this.guardarArchivo(url, `${ruta.replace(/\//g, '-')}.pdf`);
          }
          setTimeout(() => URL.revokeObjectURL(url), 60000);
          observer.next();
          observer.complete();
        },
        error: error => {
          if (ventana && !ventana.closed) ventana.close();
          observer.error(error);
        }
      });
    });
  }

  descargarExcel(ruta: string, nombreArchivo: string): Observable<void> {
    return new Observable<void>(observer => {
      this.descargar(ruta).subscribe({
        next: blob => {
          const url = URL.createObjectURL(blob);
          this.guardarArchivo(url, `${nombreArchivo}.xlsx`);
          setTimeout(() => URL.revokeObjectURL(url), 60000);
          observer.next();
          observer.complete();
        },
        error: error => observer.error(error)
      });
    });
  }

  private guardarArchivo(url: string, nombre: string): void {
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombre;
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
  }
}
