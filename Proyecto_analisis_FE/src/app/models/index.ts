// Models for API responses
export interface LoginRequest {
  Username: string;
  Password: string;
}

export interface LoginResponse {
  token: string;
  usuario: {
    IdUsuario: string;
    Nombre: string;
    Apellido: string;
    IdRole: number;
    NombreRole: string;
  };
  mensaje: string;
}

export interface Empresa {
  IdEmpresa?: number;
  Nombre: string;
  Descripcion?: string;
  Direccion?: string;
  Telefono?: string;
  CorreoElectronico?: string;
}

export interface Sucursal {
  IdSucursal?: number;
  IdEmpresa: number;
  Nombre: string;
  Descripcion?: string;
  Direccion?: string;
}

export interface Genero {
  IdGenero?: number;
  Nombre: string;
  Descripcion?: string;
}

export interface StatusUsuario {
  IdStatusUsuario?: number;
  Nombre: string;
  Descripcion?: string;
}

export interface Usuario {
  IdUsuario: string;
  Nombre: string;
  Apellido: string;
  FechaNacimiento: string;
  Password?: string;
  IdGenero: number;
  CorreoElectronico?: string;
  TelefonoMovil?: string;
  IdSucursal: number;
  IdRole: number;
  IdStatusUsuario?: number;
}
