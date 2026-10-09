const { crearCrudController, estaVacio } = require('./crudController.js');
const estadoCivilModel = require('../Model/estadoCivilModel.js');
const statusEmpleadoModel = require('../Model/statusEmpleadoModel.js');
const flujoStatusEmpleadoModel = require('../Model/flujoStatusEmpleadoModel.js');
const tipoDocumentoModel = require('../Model/tipoDocumentoModel.js');
const departamentoModel = require('../Model/departamentoModel.js');
const puestoModel = require('../Model/puestoModel.js');
const personaModel = require('../Model/personaModel.js');
const documentoPersonaModel = require('../Model/documentoPersonaModel.js');
const bancoModel = require('../Model/bancoModel.js');
const empleadoModel = require('../Model/empleadoModel.js');
const cuentaBancariaEmpleadoModel = require('../Model/cuentaBancariaEmpleadoModel.js');
const inasistenciaModel = require('../Model/inasistenciaModel.js');
const impuestos = require('../utils/impuestosGuatemala.js');

function esFechaValida(valor) {
  return impuestos.parsearFecha(valor) !== null;
}

function esMontoValido(valor) {
  return valor !== '' && valor !== null && Number.isFinite(Number(valor)) && Number(valor) >= 0;
}

function normalizarActiva(valor) {
  return valor === true || valor === 1 || valor === '1' || valor === 'true' ? '1' : '0';
}

function validarEmpleado(datos) {
  if (!esFechaValida(datos.FechaContratacion)) {
    return { mensaje: 'La fecha de contratación no es válida.' };
  }
  if (!esMontoValido(datos.IngresoSueldoBase) || Number(datos.IngresoSueldoBase) <= 0) {
    return { mensaje: 'El sueldo base debe ser un monto mayor a cero.' };
  }

  if (estaVacio(datos.IngresoBonificacionDecreto)) datos.IngresoBonificacionDecreto = impuestos.BONIFICACION_INCENTIVO;
  if (estaVacio(datos.IngresoOtrosIngresos)) datos.IngresoOtrosIngresos = 0;
  if (estaVacio(datos.DescuentoInasistencias)) datos.DescuentoInasistencias = 0;

  const calculados = impuestos.calcularDescuentos(datos.IngresoSueldoBase, datos.IngresoOtrosIngresos);
  if (estaVacio(datos.DescuentoIgss)) datos.DescuentoIgss = calculados.DescuentoIgss;
  if (estaVacio(datos.DescuentoIsr)) datos.DescuentoIsr = calculados.DescuentoIsr;

  const montos = [
    'IngresoBonificacionDecreto', 'IngresoOtrosIngresos', 'DescuentoIgss', 'DescuentoIsr', 'DescuentoInasistencias'
  ];
  if (montos.some((campo) => !esMontoValido(datos[campo]))) {
    return { mensaje: 'Los montos de ingresos y descuentos deben ser valores numéricos mayores o iguales a cero.' };
  }
  return null;
}

function validarInasistencia(datos) {
  const inicial = impuestos.parsearFecha(datos.FechaInicial);
  const final = impuestos.parsearFecha(datos.FechaFinal);
  if (!inicial || !final) {
    return { mensaje: 'Las fechas de la inasistencia no son válidas.' };
  }
  if (final < inicial) {
    return { mensaje: 'La fecha final no puede ser anterior a la fecha inicial.' };
  }
  return null;
}

async function validarModificacionInasistencia(datos, req) {
  if (await inasistenciaModel.estaProcesada(req.params.IdInasistencia)) {
    return { status: 409, mensaje: 'La inasistencia ya fue procesada en una planilla y no puede modificarse.' };
  }
  return validarInasistencia(datos);
}

const recursos = [
  {
    ruta: 'estados-civiles',
    opcion: 'Estados Civiles',
    entidad: 'estadoCivil',
    nombre: 'estado civil',
    model: estadoCivilModel,
    claves: ['IdEstadoCivil'],
    requeridos: { Nombre: 'Nombre' },
    exportacion: {
      archivo: 'estados-civiles',
      titulo: 'Estados Civiles',
      columnas: [
        { campo: 'IdEstadoCivil', titulo: 'Cód.', tipo: 'numero', ancho: 1 },
        { campo: 'Nombre', titulo: 'Nombre', ancho: 4 },
        { campo: 'FechaCreacion', titulo: 'Fecha creación', tipo: 'fechahora', ancho: 2 },
        { campo: 'UsuarioCreacion', titulo: 'Usuario creación', ancho: 2 },
        { campo: 'FechaModificacion', titulo: 'Fecha modificación', tipo: 'fechahora', ancho: 2 },
        { campo: 'UsuarioModificacion', titulo: 'Usuario modificación', ancho: 2 }
      ]
    }
  },
  {
    ruta: 'status-empleados',
    opcion: 'Status Empleado',
    entidad: 'statusEmpleado',
    nombre: 'status de empleado',
    model: statusEmpleadoModel,
    claves: ['IdStatusEmpleado'],
    requeridos: { Nombre: 'Nombre' },
    exportacion: {
      archivo: 'status-empleado',
      titulo: 'Status de Empleado',
      columnas: [
        { campo: 'IdStatusEmpleado', titulo: 'Cód.', tipo: 'numero', ancho: 1 },
        { campo: 'Nombre', titulo: 'Nombre', ancho: 4 },
        { campo: 'FechaCreacion', titulo: 'Fecha creación', tipo: 'fechahora', ancho: 2 },
        { campo: 'UsuarioCreacion', titulo: 'Usuario creación', ancho: 2 },
        { campo: 'FechaModificacion', titulo: 'Fecha modificación', tipo: 'fechahora', ancho: 2 },
        { campo: 'UsuarioModificacion', titulo: 'Usuario modificación', ancho: 2 }
      ]
    }
  },
  {
    ruta: 'flujos-status-empleado',
    opcion: 'Flujos Status Empleado',
    entidad: 'flujoStatusEmpleado',
    nombre: 'flujo de status',
    model: flujoStatusEmpleadoModel,
    claves: ['IdStatusActual', 'IdStatusNuevo'],
    requeridos: { IdStatusActual: 'Status actual', IdStatusNuevo: 'Status nuevo', NombreEvento: 'Evento' },
    catalogos: ['statusEmpleados'],
    hooks: {
      antesDeCrear: (datos) => (
        String(datos.IdStatusActual) === String(datos.IdStatusNuevo)
          ? { mensaje: 'El status actual y el status nuevo deben ser diferentes.' }
          : null
      )
    },
    exportacion: {
      archivo: 'flujos-status-empleado',
      titulo: 'Flujos de Status de Empleado',
      columnas: [
        { campo: 'NombreStatusActual', titulo: 'Status actual', ancho: 3 },
        { campo: 'NombreStatusNuevo', titulo: 'Status nuevo', ancho: 3 },
        { campo: 'NombreEvento', titulo: 'Evento', ancho: 5 },
        { campo: 'FechaCreacion', titulo: 'Fecha creación', tipo: 'fechahora', ancho: 2 },
        { campo: 'UsuarioCreacion', titulo: 'Usuario creación', ancho: 2 }
      ]
    }
  },
  {
    ruta: 'tipos-documento',
    opcion: 'Tipos de Documentos',
    entidad: 'tipoDocumento',
    nombre: 'tipo de documento',
    model: tipoDocumentoModel,
    claves: ['IdTipoDocumento'],
    requeridos: { Nombre: 'Nombre' },
    exportacion: {
      archivo: 'tipos-documento',
      titulo: 'Tipos de Documentos',
      columnas: [
        { campo: 'IdTipoDocumento', titulo: 'Cód.', tipo: 'numero', ancho: 1 },
        { campo: 'Nombre', titulo: 'Nombre', ancho: 5 },
        { campo: 'FechaCreacion', titulo: 'Fecha creación', tipo: 'fechahora', ancho: 2 },
        { campo: 'UsuarioCreacion', titulo: 'Usuario creación', ancho: 2 }
      ]
    }
  },
  {
    ruta: 'departamentos',
    opcion: 'Departamentos',
    entidad: 'departamento',
    nombre: 'departamento',
    model: departamentoModel,
    claves: ['IdDepartamento'],
    requeridos: { Nombre: 'Nombre', IdEmpresa: 'Empresa' },
    catalogos: ['empresas'],
    exportacion: {
      archivo: 'departamentos',
      titulo: 'Departamentos',
      columnas: [
        { campo: 'IdDepartamento', titulo: 'Cód.', tipo: 'numero', ancho: 1 },
        { campo: 'Nombre', titulo: 'Nombre', ancho: 5 },
        { campo: 'NombreEmpresa', titulo: 'Empresa', ancho: 3 },
        { campo: 'FechaCreacion', titulo: 'Fecha creación', tipo: 'fechahora', ancho: 2 },
        { campo: 'UsuarioCreacion', titulo: 'Usuario creación', ancho: 2 }
      ]
    }
  },
  {
    ruta: 'puestos',
    opcion: 'Puestos',
    entidad: 'puesto',
    nombre: 'puesto',
    model: puestoModel,
    claves: ['IdPuesto'],
    requeridos: { Nombre: 'Nombre', IdDepartamento: 'Departamento' },
    catalogos: ['departamentos'],
    exportacion: {
      archivo: 'puestos',
      titulo: 'Puestos',
      columnas: [
        { campo: 'IdPuesto', titulo: 'Cód.', tipo: 'numero', ancho: 1 },
        { campo: 'Nombre', titulo: 'Nombre', ancho: 5 },
        { campo: 'NombreDepartamento', titulo: 'Departamento', ancho: 4 },
        { campo: 'FechaCreacion', titulo: 'Fecha creación', tipo: 'fechahora', ancho: 2 },
        { campo: 'UsuarioCreacion', titulo: 'Usuario creación', ancho: 2 }
      ]
    }
  },
  {
    ruta: 'personas',
    opcion: 'Personas',
    entidad: 'persona',
    nombre: 'persona',
    genero: 'f',
    model: personaModel,
    claves: ['IdPersona'],
    requeridos: {
      Nombre: 'Nombre',
      Apellido: 'Apellido',
      FechaNacimiento: 'Fecha de nacimiento',
      IdGenero: 'Género',
      Direccion: 'Dirección',
      Telefono: 'Teléfono',
      IdEstadoCivil: 'Estado civil'
    },
    catalogos: ['generos', 'estadosCiviles'],
    hooks: {
      antesDeCrear: (datos) => validarPersona(datos),
      antesDeActualizar: (datos) => validarPersona(datos)
    },
    exportacion: {
      archivo: 'personas',
      titulo: 'Personas',
      columnas: [
        { campo: 'IdPersona', titulo: 'Cód.', tipo: 'numero', ancho: 1 },
        { campo: 'Nombre', titulo: 'Nombre', ancho: 3 },
        { campo: 'Apellido', titulo: 'Apellido', ancho: 3 },
        { campo: 'FechaNacimiento', titulo: 'Nacimiento', tipo: 'fecha', ancho: 2 },
        { campo: 'NombreGenero', titulo: 'Género', ancho: 2 },
        { campo: 'Direccion', titulo: 'Dirección', ancho: 5 },
        { campo: 'Telefono', titulo: 'Teléfono', ancho: 2 },
        { campo: 'CorreoElectronico', titulo: 'Correo', ancho: 4 },
        { campo: 'NombreEstadoCivil', titulo: 'Estado civil', ancho: 2 }
      ]
    }
  },
  {
    ruta: 'documentos-persona',
    opcion: 'Documentos de Personas',
    entidad: 'documentoPersona',
    nombre: 'documento de persona',
    model: documentoPersonaModel,
    claves: ['IdTipoDocumento', 'IdPersona'],
    requeridos: { IdTipoDocumento: 'Tipo de documento', IdPersona: 'Persona', NoDocumento: 'Número de documento' },
    catalogos: ['tiposDocumento', 'personas'],
    exportacion: {
      archivo: 'documentos-persona',
      titulo: 'Documentos de Personas',
      columnas: [
        { campo: 'NombrePersona', titulo: 'Persona', ancho: 5 },
        { campo: 'NombreTipoDocumento', titulo: 'Tipo de documento', ancho: 5 },
        { campo: 'NoDocumento', titulo: 'Número', ancho: 3 },
        { campo: 'FechaCreacion', titulo: 'Fecha creación', tipo: 'fechahora', ancho: 2 },
        { campo: 'UsuarioCreacion', titulo: 'Usuario creación', ancho: 2 }
      ]
    }
  },
  {
    ruta: 'bancos',
    opcion: 'Bancos',
    entidad: 'banco',
    nombre: 'banco',
    model: bancoModel,
    claves: ['IdBanco'],
    requeridos: { Nombre: 'Nombre' },
    exportacion: {
      archivo: 'bancos',
      titulo: 'Bancos',
      columnas: [
        { campo: 'IdBanco', titulo: 'Cód.', tipo: 'numero', ancho: 1 },
        { campo: 'Nombre', titulo: 'Nombre', ancho: 5 },
        { campo: 'FechaCreacion', titulo: 'Fecha creación', tipo: 'fechahora', ancho: 2 },
        { campo: 'UsuarioCreacion', titulo: 'Usuario creación', ancho: 2 }
      ]
    }
  },
  {
    ruta: 'empleados',
    opcion: 'Empleados',
    entidad: 'empleado',
    nombre: 'empleado',
    model: empleadoModel,
    claves: ['IdEmpleado'],
    requeridos: {
      IdPersona: 'Persona',
      IdSucursal: 'Sucursal',
      FechaContratacion: 'Fecha de contratación',
      IdPuesto: 'Puesto',
      IdStatusEmpleado: 'Status',
      IngresoSueldoBase: 'Sueldo base'
    },
    catalogos: ['personas', 'sucursales', 'puestos', 'statusEmpleados'],
    hooks: {
      antesDeCrear: (datos) => validarEmpleado(datos),
      antesDeActualizar: async (datos, req, existente) => {
        const error = validarEmpleado(datos);
        if (error) return error;
        if (Number(datos.IdStatusEmpleado) !== Number(existente.IdStatusEmpleado)) {
          const permitido = await flujoStatusEmpleadoModel.existeTransicion(
            existente.IdStatusEmpleado,
            datos.IdStatusEmpleado
          );
          if (!permitido) {
            return { mensaje: 'El cambio de status no corresponde a un flujo configurado en Flujos Status Empleado.' };
          }
        }
        return null;
      }
    },
    exportacion: {
      archivo: 'empleados',
      titulo: 'Empleados',
      columnas: [
        { campo: 'IdEmpleado', titulo: 'Cód.', tipo: 'numero', ancho: 1.4 },
        { campo: 'NombrePersona', titulo: 'Persona', ancho: 4 },
        { campo: 'NombreSucursal', titulo: 'Sucursal', ancho: 3 },
        { campo: 'FechaContratacion', titulo: 'Contratación', tipo: 'fecha', ancho: 2.8 },
        { campo: 'NombrePuesto', titulo: 'Puesto', ancho: 4 },
        { campo: 'NombreStatus', titulo: 'Status', ancho: 3 },
        { campo: 'IngresoSueldoBase', titulo: 'Sueldo base', tipo: 'moneda', ancho: 3 },
        { campo: 'IngresoBonificacionDecreto', titulo: 'Bonificación', tipo: 'moneda', ancho: 3 },
        { campo: 'IngresoOtrosIngresos', titulo: 'Otros ingresos', tipo: 'moneda', ancho: 3 },
        { campo: 'DescuentoIgss', titulo: 'IGSS', tipo: 'moneda', ancho: 3 },
        { campo: 'DescuentoIsr', titulo: 'ISR', tipo: 'moneda', ancho: 3 },
        { campo: 'DescuentoInasistencias', titulo: 'Inasistencias', tipo: 'moneda', ancho: 3 }
      ]
    }
  },
  {
    ruta: 'cuentas-bancarias',
    opcion: 'Cuentas Bancarias Empleados',
    entidad: 'cuentaBancariaEmpleado',
    nombre: 'cuenta bancaria',
    genero: 'f',
    model: cuentaBancariaEmpleadoModel,
    claves: ['IdCuentaBancaria'],
    requeridos: { IdEmpleado: 'Empleado', IdBanco: 'Banco', NumeroDeCuenta: 'Número de cuenta' },
    catalogos: ['empleados', 'bancos'],
    hooks: {
      antesDeCrear: (datos) => { datos.Activa = normalizarActiva(datos.Activa); },
      antesDeActualizar: (datos) => { datos.Activa = normalizarActiva(datos.Activa); }
    },
    exportacion: {
      archivo: 'cuentas-bancarias-empleados',
      titulo: 'Cuentas Bancarias de Empleados',
      columnas: [
        { campo: 'NombreEmpleado', titulo: 'Empleado', ancho: 5 },
        { campo: 'NombreBanco', titulo: 'Banco', ancho: 4 },
        { campo: 'NumeroDeCuenta', titulo: 'Número de cuenta', ancho: 3 },
        { campo: 'Activa', titulo: 'Activa', tipo: 'booleano', ancho: 1 },
        { campo: 'FechaCreacion', titulo: 'Fecha creación', tipo: 'fechahora', ancho: 2 },
        { campo: 'UsuarioCreacion', titulo: 'Usuario creación', ancho: 2 }
      ]
    }
  },
  {
    ruta: 'inasistencias',
    opcion: 'Inasistencias de Empleados',
    entidad: 'inasistencia',
    nombre: 'inasistencia',
    genero: 'f',
    model: inasistenciaModel,
    claves: ['IdInasistencia'],
    requeridos: {
      IdEmpleado: 'Empleado',
      FechaInicial: 'Fecha inicial',
      FechaFinal: 'Fecha final',
      MotivoInasistencia: 'Motivo'
    },
    catalogos: ['empleados'],
    hooks: {
      antesDeCrear: (datos) => validarInasistencia(datos),
      antesDeActualizar: validarModificacionInasistencia,
      antesDeEliminar: async (existente) => (
        existente.FechaProcesado
          ? { status: 409, mensaje: 'La inasistencia ya fue procesada en una planilla y no puede eliminarse.' }
          : null
      )
    },
    exportacion: {
      archivo: 'inasistencias-empleados',
      titulo: 'Inasistencias de Empleados',
      columnas: [
        { campo: 'NombreEmpleado', titulo: 'Empleado', ancho: 5 },
        { campo: 'FechaInicial', titulo: 'Fecha inicial', tipo: 'fecha', ancho: 2 },
        { campo: 'FechaFinal', titulo: 'Fecha final', tipo: 'fecha', ancho: 2 },
        { campo: 'MotivoInasistencia', titulo: 'Motivo', ancho: 5 },
        { campo: 'FechaProcesado', titulo: 'Fecha procesado', tipo: 'fechahora', ancho: 3 }
      ]
    }
  }
];

function validarPersona(datos) {
  const nacimiento = impuestos.parsearFecha(datos.FechaNacimiento);
  if (!nacimiento || nacimiento > new Date()) {
    return { mensaje: 'La fecha de nacimiento no es válida.' };
  }
  if (!estaVacio(datos.CorreoElectronico) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.CorreoElectronico)) {
    return { mensaje: 'El correo electrónico no tiene un formato válido.' };
  }
  return null;
}

const recursosConControlador = recursos.map((recurso) => ({
  ruta: recurso.ruta,
  opcion: recurso.opcion,
  claves: recurso.claves,
  controller: crearCrudController(recurso)
}));

module.exports = { recursos: recursosConControlador };
