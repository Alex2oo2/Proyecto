const { db } = require('../Config/db.js');

const consultas = {
  empresas: 'SELECT IdEmpresa AS Id, Nombre AS Texto FROM EMPRESA ORDER BY Nombre',
  sucursales: 'SELECT IdSucursal AS Id, Nombre AS Texto FROM SUCURSAL ORDER BY Nombre',
  generos: 'SELECT IdGenero AS Id, Nombre AS Texto FROM GENERO ORDER BY Nombre',
  estadosCiviles: 'SELECT IdEstadoCivil AS Id, Nombre AS Texto FROM ESTADO_CIVIL ORDER BY Nombre',
  statusEmpleados: 'SELECT IdStatusEmpleado AS Id, Nombre AS Texto FROM STATUS_EMPLEADO ORDER BY IdStatusEmpleado',
  tiposDocumento: 'SELECT IdTipoDocumento AS Id, Nombre AS Texto FROM TIPO_DOCUMENTO ORDER BY Nombre',
  departamentos: 'SELECT IdDepartamento AS Id, Nombre AS Texto FROM DEPARTAMENTO ORDER BY Nombre',
  bancos: 'SELECT IdBanco AS Id, Nombre AS Texto FROM BANCO ORDER BY Nombre',
  puestos: `
    SELECT p.IdPuesto AS Id, CONCAT(p.Nombre, ' (', d.Nombre, ')') AS Texto
    FROM PUESTO p
    INNER JOIN DEPARTAMENTO d ON p.IdDepartamento = d.IdDepartamento
    ORDER BY p.Nombre
  `,
  personas: `
    SELECT IdPersona AS Id, CONCAT(Nombre, ' ', Apellido) AS Texto
    FROM PERSONA
    ORDER BY Nombre, Apellido
  `,
  empleados: `
    SELECT e.IdEmpleado AS Id, CONCAT(p.Nombre, ' ', p.Apellido) AS Texto
    FROM EMPLEADO e
    INNER JOIN PERSONA p ON e.IdPersona = p.IdPersona
    ORDER BY p.Nombre, p.Apellido
  `
};

async function obtener(nombres) {
  const resultado = {};
  for (const nombre of nombres) {
    const consulta = consultas[nombre];
    if (consulta) {
      const [rows] = await db.query(consulta);
      resultado[nombre] = rows;
    }
  }
  return resultado;
}

module.exports = { obtener };
