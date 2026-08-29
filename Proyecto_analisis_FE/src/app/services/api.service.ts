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
  Usuario,
  Modulo,
  Menu,
  Opcion,
  Role,
  RoleOpcion,
  MatrizPermisos
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

  // Public registration endpoint (no auth required)
  registroPublico(usuario: Usuario): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/auth/register`,
      usuario
    ).pipe(catchError(error => this.handleError(error)));
  }

  // ============ PASSWORD ============
  cambiarContraseña(data: { IdUsuario: string; currentPassword: string; newPassword: string }): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/auth/change-password`,
      data,
      { headers: this.getHeaders() }
    ).pipe(catchError(error => this.handleError(error)));
  }

  // Forgot password - get security question
  obtenerPreguntaSeguridad(idUsuario: string): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/auth/security-question/${idUsuario}`
    ).pipe(catchError(error => this.handleError(error)));
  }

  // Verify security answer
  verificarRespuestaSeguridad(idUsuario: string, answer: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/auth/verify-answer`,
      { IdUsuario: idUsuario, Respuesta: answer }
    ).pipe(catchError(error => this.handleError(error)));
  }

  // Reset password after security question verification
  resetearContraseña(data: { IdUsuario: string; newPassword: string }): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/auth/reset-password`,
      data
    ).pipe(catchError(error => this.handleError(error)));
  }

  // Logout
  logout(): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/auth/logout`,
      {},
      { headers: this.getHeaders() }
    ).pipe(catchError(error => this.handleError(error)));
  }

  // ============ USUARIOS ============
  getUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(
      `${this.apiUrl}/usuario/usuarios`,
      { headers: this.getHeaders() }
    ).pipe(catchError(error => this.handleError(error)));
  }

  getUsuarioById(id: string): Observable<Usuario> {
    return this.http.get<Usuario>(
      `${this.apiUrl}/usuario/usuarios/${id}`,
      { headers: this.getHeaders() }
    ).pipe(catchError(error => this.handleError(error)));
  }

  actualizarUsuario(id: string, usuario: Partial<Usuario>): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/usuario/usuarios/${id}`,
      usuario,
      { headers: this.getHeaders() }
    ).pipe(catchError(error => this.handleError(error)));
  }

  eliminarUsuario(id: string): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/usuario/usuarios/${id}`,
      { headers: this.getHeaders() }
    ).pipe(catchError(error => this.handleError(error)));
  }

  // ============ MODULOS ============
  getModulos(): Observable<Modulo[]> {
    return this.http.get<Modulo[]>(
      `${this.apiUrl}/seguridad/modulos`,
      { headers: this.getHeaders() }
    ).pipe(catchError(error => this.handleError(error)));
  }

  crearModulo(modulo: Modulo): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/seguridad/modulos`,
      modulo,
      { headers: this.getHeaders() }
    ).pipe(catchError(error => this.handleError(error)));
  }

  actualizarModulo(id: number, modulo: Modulo): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/seguridad/modulos/${id}`,
      modulo,
      { headers: this.getHeaders() }
    ).pipe(catchError(error => this.handleError(error)));
  }

  eliminarModulo(id: number): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/seguridad/modulos/${id}`,
      { headers: this.getHeaders() }
    ).pipe(catchError(error => this.handleError(error)));
  }

  // ============ MENUS ============
  getMenus(idModulo?: number): Observable<Menu[]> {
    let url = `${this.apiUrl}/seguridad/menus`;
    if (idModulo) {
      url += `?idModulo=${idModulo}`;
    }
    return this.http.get<Menu[]>(
      url,
      { headers: this.getHeaders() }
    ).pipe(catchError(error => this.handleError(error)));
  }

  crearMenu(menu: Menu): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/seguridad/menus`,
      menu,
      { headers: this.getHeaders() }
    ).pipe(catchError(error => this.handleError(error)));
  }

  actualizarMenu(id: number, menu: Menu): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/seguridad/menus/${id}`,
      menu,
      { headers: this.getHeaders() }
    ).pipe(catchError(error => this.handleError(error)));
  }

  eliminarMenu(id: number): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/seguridad/menus/${id}`,
      { headers: this.getHeaders() }
    ).pipe(catchError(error => this.handleError(error)));
  }

  // ============ OPCIONES ============
  getOpciones(idMenu?: number): Observable<Opcion[]> {
    let url = `${this.apiUrl}/seguridad/opciones`;
    if (idMenu) {
      url += `?idMenu=${idMenu}`;
    }
    return this.http.get<Opcion[]>(
      url,
      { headers: this.getHeaders() }
    ).pipe(catchError(error => this.handleError(error)));
  }

  crearOpcion(opcion: Opcion): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/seguridad/opciones`,
      opcion,
      { headers: this.getHeaders() }
    ).pipe(catchError(error => this.handleError(error)));
  }

  actualizarOpcion(id: number, opcion: Opcion): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/seguridad/opciones/${id}`,
      opcion,
      { headers: this.getHeaders() }
    ).pipe(catchError(error => this.handleError(error)));
  }

  eliminarOpcion(id: number): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/seguridad/opciones/${id}`,
      { headers: this.getHeaders() }
    ).pipe(catchError(error => this.handleError(error)));
  }

  // ============ ROLES ============
  crearRole(role: Role): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/seguridad/roles`,
      role,
      { headers: this.getHeaders() }
    ).pipe(catchError(error => this.handleError(error)));
  }

  actualizarRole(id: number, role: Role): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/seguridad/roles/${id}`,
      role,
      { headers: this.getHeaders() }
    ).pipe(catchError(error => this.handleError(error)));
  }

  eliminarRole(id: number): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/seguridad/roles/${id}`,
      { headers: this.getHeaders() }
    ).pipe(catchError(error => this.handleError(error)));
  }

  // ============ PERMISOS (MATRIZ) ============
  obtenerMatrizPermisos(idRole: number, idModulo: number): Observable<MatrizPermisos[]> {
    return this.http.get<MatrizPermisos[]>(
      `${this.apiUrl}/seguridad/permisos/${idRole}/${idModulo}`,
      { headers: this.getHeaders() }
    ).pipe(catchError(error => this.handleError(error)));
  }

  guardarMatrizPermisos(permisos: any[]): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/seguridad/permisos`,
      permisos,
      { headers: this.getHeaders() }
    ).pipe(catchError(error => this.handleError(error)));
  }
}
