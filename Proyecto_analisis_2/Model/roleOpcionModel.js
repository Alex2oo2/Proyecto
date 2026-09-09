const { db } = require('../Config/db.js');

// 1. Obtener la matriz de permisos para la Cuadrícula (DataGrid)
// Hace un LEFT JOIN para traer TODAS las opciones de un módulo, marcando con 1 o 0 si el Rol ya tiene el permiso.
async function obtenerMatrizPermisos(idRole, idModulo) {
  const sql = `
    SELECT 
      o.IdOpcion, 
      o.Nombre AS NombreOpcion, 
      m.Nombre AS NombreMenu,
      COALESCE(ro.Alta, 0) AS Alta,
      COALESCE(ro.Baja, 0) AS Baja,
      COALESCE(ro.Cambio, 0) AS Cambio,
      COALESCE(ro.Imprimir, 0) AS Imprimir,
      COALESCE(ro.Exportar, 0) AS Exportar
    FROM OPCION o
    INNER JOIN MENU m ON o.IdMenu = m.IdMenu
    LEFT JOIN ROLE_OPCION ro ON o.IdOpcion = ro.IdOpcion AND ro.IdRole = ?
    WHERE m.IdModulo = ?
    ORDER BY m.OrdenMenu, o.OrdenMenu ASC
  `;
  const [rows] = await db.query(sql, [idRole, idModulo]);
  return rows;
}

// 2. Guardar/Actualizar permisos desde la pantalla (Bulk Upsert)
// NOTA: no existe columna "Consultar" en ROLE_OPCION (no se modifica el esquema de BD).
// "Consultar" se sigue derivando como (Alta OR Baja OR Cambio OR Imprimir OR Exportar).
async function guardarPermiso(datos) {
  const { IdRole, IdOpcion, Alta, Baja, Cambio, Imprimir, Exportar, Usuario } = datos;
  
  // Utiliza INSERT ... ON DUPLICATE KEY UPDATE para insertar si no existe, o actualizar si ya existe.
  const sql = `
    INSERT INTO ROLE_OPCION (IdRole, IdOpcion, Alta, Baja, Cambio, Imprimir, Exportar, FechaCreacion, UsuarioCreacion)
    VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?)
    ON DUPLICATE KEY UPDATE 
      Alta = VALUES(Alta), 
      Baja = VALUES(Baja), 
      Cambio = VALUES(Cambio), 
      Imprimir = VALUES(Imprimir), 
      Exportar = VALUES(Exportar),
      FechaModificacion = NOW(),
      UsuarioModificacion = ?
  `;
  await db.query(sql, [IdRole, IdOpcion, Alta, Baja, Cambio, Imprimir, Exportar, Usuario, Usuario]);
}

// 3. Obtener TODOS los permisos de un Role, indexados por Nombre de Opción.
// Se usa para que el frontend sepa qué botones (Alta/Baja/Cambio/Imprimir/Exportar) mostrar,
// y qué opciones del sidebar puede ver (Consultar, derivado en el Controller).
async function obtenerPermisosPorRole(idRole) {
  const sql = `
    SELECT
      o.Nombre AS NombreOpcion,
      ro.Alta,
      ro.Baja,
      ro.Cambio,
      ro.Imprimir,
      ro.Exportar
    FROM ROLE_OPCION ro
    INNER JOIN OPCION o ON ro.IdOpcion = o.IdOpcion
    WHERE ro.IdRole = ?
  `;
  const [rows] = await db.query(sql, [idRole]);
  return rows;
}

async function verificarPermiso(idRole, nombreOpcion, tipoPermiso) {
  // "Consultar" no es una columna: se traduce a "tiene ALGUN permiso sobre la opción".
  let sql;
  if (tipoPermiso === 'Consultar') {
    sql = `
      SELECT (ro.Alta OR ro.Baja OR ro.Cambio OR ro.Imprimir OR ro.Exportar) as TienePermiso
      FROM ROLE_OPCION ro
      INNER JOIN OPCION o ON ro.IdOpcion = o.IdOpcion
      WHERE ro.IdRole = ? AND o.Nombre = ?
    `;
  } else {
    sql = `
      SELECT ro.${tipoPermiso} as TienePermiso
      FROM ROLE_OPCION ro
      INNER JOIN OPCION o ON ro.IdOpcion = o.IdOpcion
      WHERE ro.IdRole = ? AND o.Nombre = ?
    `;
  }
  const [rows] = await db.query(sql, [idRole, nombreOpcion]);
  return rows.length > 0 ? rows[0].TienePermiso : 0;
}

// 4. Árbol de navegación (Modulo -> Menu -> Opcion) para el sidebar dinámico.
// Se filtra en el propio SQL por lo que el rol puede "Consultar" (derivado:
// tiene algún permiso sobre esa opción), asi que cualquier usuario autenticado
// puede llamar este endpoint aunque no tenga acceso administrativo a
// Modulos/Menus/Opciones — solo ve lo que su rol puede ver.
async function obtenerArbolMenu(idRole) {
  const sql = `
    SELECT
      mo.IdModulo, mo.Nombre AS ModuloNombre, mo.OrdenMenu AS ModuloOrden,
      m.IdMenu, m.Nombre AS MenuNombre, m.OrdenMenu AS MenuOrden,
      o.IdOpcion, o.Nombre AS OpcionNombre, o.OrdenMenu AS OpcionOrden, o.Pagina
    FROM ROLE_OPCION ro
    INNER JOIN OPCION o ON ro.IdOpcion = o.IdOpcion
    INNER JOIN MENU m ON o.IdMenu = m.IdMenu
    INNER JOIN MODULO mo ON m.IdModulo = mo.IdModulo
    WHERE ro.IdRole = ?
      AND (ro.Alta OR ro.Baja OR ro.Cambio OR ro.Imprimir OR ro.Exportar)
    ORDER BY mo.OrdenMenu, m.OrdenMenu, o.OrdenMenu
  `;
  const [rows] = await db.query(sql, [idRole]);

  // Se arma el árbol anidado Modulo -> Menu -> Opcion a partir de las filas planas.
  const modulos = [];
  const modulosPorId = new Map();
  const menusPorId = new Map();

  for (const row of rows) {
    let modulo = modulosPorId.get(row.IdModulo);
    if (!modulo) {
      modulo = { idModulo: row.IdModulo, nombre: row.ModuloNombre, menus: [] };
      modulosPorId.set(row.IdModulo, modulo);
      modulos.push(modulo);
    }

    let menu = menusPorId.get(row.IdMenu);
    if (!menu) {
      menu = { idMenu: row.IdMenu, nombre: row.MenuNombre, opciones: [] };
      menusPorId.set(row.IdMenu, menu);
      modulo.menus.push(menu);
    }

    menu.opciones.push({ idOpcion: row.IdOpcion, nombre: row.OpcionNombre, pagina: row.Pagina });
  }

  return modulos;
}

module.exports = { obtenerMatrizPermisos, guardarPermiso, verificarPermiso, obtenerPermisosPorRole, obtenerArbolMenu };