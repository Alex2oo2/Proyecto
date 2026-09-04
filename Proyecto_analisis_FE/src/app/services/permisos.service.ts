import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from './auth.service';

export interface PermisoOpcion {
  Alta: boolean;
  Baja: boolean;
  Cambio: boolean;
  Imprimir: boolean;
  Exportar: boolean;
}

export type MapaPermisos = { [nombreOpcion: string]: PermisoOpcion };

const PERMISO_VACIO: PermisoOpcion = {
  Alta: false, Baja: false, Cambio: false, Imprimir: false, Exportar: false
};

// Nombre de la clave usada para persistir los permisos en localStorage,
// de forma que sobrevivan a un refresh de página (igual que auth_token).
const STORAGE_KEY = 'permisos_usuario';

@Injectable({
  providedIn: 'root'
})
export class PermisosService {
  private apiUrl = 'http://localhost:3000/seguridad';
  private permisosSubject = new BehaviorSubject<MapaPermisos>(this.getPermisosGuardados());
  public permisos$ = this.permisosSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  private getPermisosGuardados(): MapaPermisos {
    if (typeof localStorage !== 'undefined') {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    }
    return {};
  }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : ''
    });
  }

  // Consulta al backend los permisos del rol del usuario autenticado
  // y los deja disponibles para toda la app (memoria + localStorage).
  cargarPermisos() {
    return this.http.get<MapaPermisos>(`${this.apiUrl}/mis-permisos`, {
      headers: this.getHeaders()
    }).pipe(
      tap(permisos => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(permisos));
        this.permisosSubject.next(permisos);
      }),
      catchError(error => {
        console.error('Error al cargar permisos:', error);
        return of({} as MapaPermisos);
      })
    );
  }

  limpiarPermisos(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.permisosSubject.next({});
  }

  private obtenerPermisoOpcion(nombreOpcion: string): PermisoOpcion {
    return this.permisosSubject.value[nombreOpcion] || PERMISO_VACIO;
  }

  // Métodos de conveniencia usados directamente en los *ngIf de los templates.
  puedeCrear(nombreOpcion: string): boolean {
    return this.obtenerPermisoOpcion(nombreOpcion).Alta;
  }

  puedeEditar(nombreOpcion: string): boolean {
    return this.obtenerPermisoOpcion(nombreOpcion).Cambio;
  }

  puedeEliminar(nombreOpcion: string): boolean {
    return this.obtenerPermisoOpcion(nombreOpcion).Baja;
  }

  puedeImprimir(nombreOpcion: string): boolean {
    return this.obtenerPermisoOpcion(nombreOpcion).Imprimir;
  }

  puedeExportar(nombreOpcion: string): boolean {
    return this.obtenerPermisoOpcion(nombreOpcion).Exportar;
  }
}
