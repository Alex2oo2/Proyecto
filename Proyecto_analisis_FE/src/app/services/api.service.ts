import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import {
  Empresa,
  Sucursal,
  Genero,
  StatusUsuario,
  Usuario
} from '../models/index';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:3000';

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

  private handleError(error: any): Observable<never> {
    console.error('API Error:', error);
    return throwError(() => error);
  }

  // ============ EMPRESAS ============
  getEmpresas(): Observable<Empresa[]> {
    return this.http.get<Empresa[]>(
      `${this.apiUrl}/catalogos/empresas`,
      { headers: this.getHeaders() }
    ).pipe(catchError(error => this.handleError(error)));
  }

  crearEmpresa(empresa: Empresa): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/catalogos/empresas`,
      empresa,
      { headers: this.getHeaders() }
    ).pipe(catchError(error => this.handleError(error)));
  }

  actualizarEmpresa(id: number, empresa: Empresa): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/catalogos/empresas/${id}`,
      empresa,
      { headers: this.getHeaders() }
    ).pipe(catchError(error => this.handleError(error)));
  }

  eliminarEmpresa(id: number): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/catalogos/empresas/${id}`,
      { headers: this.getHeaders() }
    ).pipe(catchError(error => this.handleError(error)));
  }

  // ============ SUCURSALES ============
  getSucursales(idEmpresa?: number): Observable<Sucursal[]> {
    let url = `${this.apiUrl}/catalogos/sucursales`;
    if (idEmpresa) {
      url += `?idEmpresa=${idEmpresa}`;
    }
    return this.http.get<Sucursal[]>(
      url,
      { headers: this.getHeaders() }
    ).pipe(catchError(error => this.handleError(error)));
  }

  crearSucursal(sucursal: Sucursal): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/catalogos/sucursales`,
      sucursal,
      { headers: this.getHeaders() }
    ).pipe(catchError(error => this.handleError(error)));
  }

  actualizarSucursal(id: number, sucursal: Sucursal): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/catalogos/sucursales/${id}`,
      sucursal,
      { headers: this.getHeaders() }
    ).pipe(catchError(error => this.handleError(error)));
  }

  eliminarSucursal(id: number): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/catalogos/sucursales/${id}`,
      { headers: this.getHeaders() }
    ).pipe(catchError(error => this.handleError(error)));
  }

  // ============ GENEROS ============
  getGeneros(): Observable<Genero[]> {
    return this.http.get<Genero[]>(
      `${this.apiUrl}/catalogos/generos`,
      { headers: this.getHeaders() }
    ).pipe(catchError(error => this.handleError(error)));
  }

  crearGenero(genero: Genero): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/catalogos/generos`,
      genero,
      { headers: this.getHeaders() }
    ).pipe(catchError(error => this.handleError(error)));
  }

  actualizarGenero(id: number, genero: Genero): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/catalogos/generos/${id}`,
      genero,
      { headers: this.getHeaders() }
    ).pipe(catchError(error => this.handleError(error)));
  }

  eliminarGenero(id: number): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/catalogos/generos/${id}`,
      { headers: this.getHeaders() }
    ).pipe(catchError(error => this.handleError(error)));
  }

  // ============ STATUS USUARIOS ============
  getStatusUsuarios(): Observable<StatusUsuario[]> {
    return this.http.get<StatusUsuario[]>(
      `${this.apiUrl}/catalogos/status-usuarios`,
      { headers: this.getHeaders() }
    ).pipe(catchError(error => this.handleError(error)));
  }

  crearStatusUsuario(status: StatusUsuario): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/catalogos/status-usuarios`,
      status,
      { headers: this.getHeaders() }
    ).pipe(catchError(error => this.handleError(error)));
  }

  actualizarStatusUsuario(id: number, status: StatusUsuario): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/catalogos/status-usuarios/${id}`,
      status,
      { headers: this.getHeaders() }
    ).pipe(catchError(error => this.handleError(error)));
  }

  eliminarStatusUsuario(id: number): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/catalogos/status-usuarios/${id}`,
      { headers: this.getHeaders() }
    ).pipe(catchError(error => this.handleError(error)));
  }

  // ============ ROLES ============
  getRoles(): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/seguridad/roles`,
      { headers: this.getHeaders() }
    ).pipe(catchError(error => this.handleError(error)));
  }

  // ============ USUARIOS ============
  crearUsuario(usuario: Usuario): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/usuario/usuarios`,
      usuario,
      { headers: this.getHeaders() }
    ).pipe(catchError(error => this.handleError(error)));
  }
}
