// Models for API responses
export interface LoginRequest {
  Username: string;
  Password: string;
}

export interface LoginResponse {
  token: string;
  mensaje: string;
  requiereCambiarPassword: boolean;
  usuario: {
    IdUsuario: string;
    Nombre: string;
    Apellido: string;
    IdRole: number;
    NombreRole: string;
    CorreoElectronico?: string;
  };
}

export interface Empresa {
  IdEmpresa?: number;
  Nombre: string;
  Nit: string;
  Direccion: string;
  PasswordCantidadMayusculas: number;
  PasswordCantidadMinusculas: number;
  PasswordCantidadCaracteresEspeciales: number;
  PasswordCantidadCaducidadDias: number;
  PasswordLargo: number;
  PasswordIntentosAntesDeBloquear: number;
  PasswordCantidadNumeros: number;
  PasswordCantidadPreguntasValidar: number;
}

export interface Sucursal {
  IdSucursal?: number;
  IdEmpresa: number;
  Nombre: string;
  Direccion: string;
}

export interface Genero {
  IdGenero?: number;
  Nombre: string;
}

export interface StatusUsuario {
  IdStatusUsuario?: number;
  Nombre: string;
}

export interface Usuario {
  IdUsuario: string;
  Nombre: string;
  Apellido: string;
  FechaNacimiento: string;
  Password: string;
  IdGenero: number;
  CorreoElectronico?: string;
  TelefonoMovil?: string | null;
  IdSucursal: number;
  IdRole: number;
  IdStatusUsuario?: number;
  Pregunta: string;
  Respuesta: string;
  RequiereCambiarPassword?: number | boolean;
  Fotografia?: string | null;
}

export interface Modulo {
  IdModulo?: number;
  Nombre: string;
  OrdenMenu: number;
}

export interface Menu {
  IdMenu?: number;
  IdModulo: number;
  Nombre: string;
  OrdenMenu: number;
}

export interface Opcion {
  IdOpcion?: number;
  IdMenu: number;
  Nombre: string;
  OrdenMenu: number;
  Pagina: string;
}

export interface Role {
  IdRole?: number;
  Nombre: string;
}

export interface RoleOpcion {
  IdRole: number;
  IdOpcion: number;
  Alta: number;
  Baja: number;
  Cambio: number;
  Imprimir: number;
  Exportar: number;
}

export interface MatrizPermisos {
  IdOpcion: number;
  Nombre: string;
  NombreOpcion: string;
  NombreMenu: string;
  Alta: number;
  Baja: number;
  Cambio: number;
  Imprimir: number;
  Exportar: number;
}

// Árbol de navegación dinámico (Modulo -> Menu -> Opcion), ya filtrado por
// el backend según lo que el rol del usuario puede consultar. Lo usa el
// sidebar para armar sus enlaces automáticamente, incluyendo módulos nuevos
// creados por el administrador (ej. Contaduria) sin tocar código.
export interface OpcionArbol {
  idOpcion: number;
  nombre: string;
  pagina: string;
}

export interface MenuArbol {
  idMenu: number;
  nombre: string;
  opciones: OpcionArbol[];
}

export interface ModuloArbol {
  idModulo: number;
  nombre: string;
  menus: MenuArbol[];
}

export interface OpcionCatalogo {
  Id: number;
  Texto: string;
  [campo: string]: any;
}

export interface CatalogosPlanilla {
  [nombre: string]: OpcionCatalogo[];
}

export interface PeriodoPlanilla {
  Anio: number;
  Mes: number;
  FechaInicio: string;
  FechaFin: string;
  TotalIngresos: string | number | null;
  TotalDescuentos: string | number | null;
  SalarioNeto: string | number | null;
  FechaHoraProcesada: string | null;
  Calculada: number;
}

export interface ResultadoCalculoPlanilla {
  Anio: number;
  Mes: number;
  TotalIngresos: string | number;
  TotalDescuentos: string | number;
  SalarioNeto: string | number;
  FechaHoraProcesada: string;
  TotalEmpleados: number;
}

export interface DetallePlanilla {
  IdPlanillaDetalle: number;
  Anio: number;
  Mes: number;
  IdEmpleado: number;
  NombreEmpleado: string;
  FechaContratacion: string;
  NombrePuesto: string;
  NombreDepartamento: string;
  NombreStatus: string;
  IngresoSueldoBase: string | number;
  IngresoBonificacionDecreto: string | number;
  IngresoOtrosIngresos: string | number;
  DescuentoIgss: string | number;
  DescuentoIsr: string | number;
  DescuentoInasistencias: string | number;
  TotalIngresos: string | number;
  TotalDescuentos: string | number;
  SalarioNeto: string | number;
}

export interface CabeceraPlanilla {
  Anio: number;
  Mes: number;
  TotalIngresos: string | number;
  TotalDescuentos: string | number;
  SalarioNeto: string | number;
  FechaHoraProcesada: string;
  FechaInicio: string;
  FechaFin: string;
  TotalEmpleados: number;
}

export interface ReportePlanilla {
  Cabecera: CabeceraPlanilla;
  Detalle: DetallePlanilla[];
}

export interface BoletaPago {
  Empresa: { Nombre: string; Direccion: string; Nit: string };
  Periodo: {
    Anio: number;
    Mes: number;
    Descripcion: string;
    FechaInicio: string;
    FechaFin: string;
    FechaHoraProcesada: string;
  };
  Detalle: DetallePlanilla;
  Documentos: { TipoDocumento: string; NoDocumento: string }[];
  CuentaBancaria: { NombreBanco: string; NumeroDeCuenta: string } | null;
}

export interface MotivoEgreso {
  Nombre: string;
  Indemnizacion: boolean;
  StatusDestino: string;
}

export interface EmpleadoLiquidable extends OpcionCatalogo {
  IdPuesto: number;
  FechaContratacion: string;
  IngresoSueldoBase: string | number;
  IngresoBonificacionDecreto: string | number;
  IngresoOtrosIngresos: string | number;
  DescuentoIgss: string | number;
  DescuentoIsr: string | number;
  DescuentoInasistencias: string | number;
  NombreStatus: string;
}

export interface CatalogosLiquidacion {
  empleados: EmpleadoLiquidable[];
  puestos: OpcionCatalogo[];
  motivos: MotivoEgreso[];
}

export interface Liquidacion {
  IdLiquidacion?: number;
  IdEmpleado: number;
  NombreEmpleado?: string;
  NombrePuesto?: string;
  FechaContratacion: string;
  FechaEgreso: string;
  FechaLiquidacion: string;
  MotivoEgreso: string;
  IdPuesto: number;
  IngresoSueldoBase: string | number;
  IngresoBonificacionDecreto: string | number;
  IngresoOtrosIngresos: string | number;
  DescuentoIgss: string | number;
  DescuentoIsr: string | number;
  DescuentoInasistencias: string | number;
  SalarioNeto?: string | number;
  IngresoIndemnizacion?: string | number;
  IngresoAguinaldo?: string | number;
  IngresoBono14?: string | number;
  IngresoVacaciones?: string | number;
  TotalIngresos?: string | number;
  TotalDescuentos?: string | number;
  TotalNeto?: string | number;
  FechaCreacion?: string;
  UsuarioCreacion?: string;
  FechaModificacion?: string | null;
  UsuarioModificacion?: string | null;
}

export interface CalculoLiquidacion {
  SalarioNeto: number;
  IngresoIndemnizacion: number;
  IngresoAguinaldo: number;
  IngresoBono14: number;
  IngresoVacaciones: number;
  TotalIngresos: number;
  TotalDescuentos: number;
  TotalNeto: number;
  DiasServicio: number;
  DiasAguinaldo: number;
  DiasBono14: number;
  DiasVacaciones: number;
}
