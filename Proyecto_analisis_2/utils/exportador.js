const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

const COLOR_ENCABEZADO = '#1e3a8a';
const COLOR_FILA_ALTERNA = '#f1f5f9';
const COLOR_TEXTO = '#0f172a';
const COLOR_BORDE = '#cbd5e1';
const COLOR_SECCION = '#e2e8f0';

function dosDigitos(valor) {
  return String(valor).padStart(2, '0');
}

function convertirFecha(valor) {
  if (valor instanceof Date) {
    return Number.isNaN(valor.getTime()) ? null : valor;
  }
  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(String(valor || ''));
  if (!coincidencia) return null;
  return new Date(
    Number(coincidencia[1]),
    Number(coincidencia[2]) - 1,
    Number(coincidencia[3]),
    Number(coincidencia[4] || 0),
    Number(coincidencia[5] || 0),
    Number(coincidencia[6] || 0)
  );
}

function formatearFecha(valor, conHora = false) {
  const fecha = convertirFecha(valor);
  if (!fecha) return valor === null || valor === undefined ? '' : String(valor);
  const texto = `${dosDigitos(fecha.getDate())}/${dosDigitos(fecha.getMonth() + 1)}/${fecha.getFullYear()}`;
  return conHora ? `${texto} ${dosDigitos(fecha.getHours())}:${dosDigitos(fecha.getMinutes())}` : texto;
}

function formatearMoneda(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return '';
  const signo = numero < 0 ? '-' : '';
  return `${signo}Q ${Math.abs(numero).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function esVerdadero(valor) {
  return valor === true || valor === 1 || valor === '1';
}

function formatearValor(valor, tipo) {
  if (valor === null || valor === undefined) return '';
  switch (tipo) {
    case 'moneda':
      return formatearMoneda(valor);
    case 'fecha':
      return formatearFecha(valor);
    case 'fechahora':
      return formatearFecha(valor, true);
    case 'booleano':
      return esVerdadero(valor) ? 'Sí' : 'No';
    default:
      return String(valor);
  }
}

function alinearDerecha(tipo) {
  return tipo === 'moneda' || tipo === 'numero';
}

function nombreSeguro(nombre) {
  return String(nombre).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '-').toLowerCase();
}

function crearPdf(res, nombreArchivo, orientacion) {
  const doc = new PDFDocument({
    size: 'A4',
    layout: orientacion,
    margins: { top: 40, bottom: 50, left: 36, right: 36 },
    bufferPages: true
  });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${nombreSeguro(nombreArchivo)}.pdf"`);
  doc.pipe(res);
  return doc;
}

function encabezadoPdf(doc, { empresa, titulo, subtitulo }) {
  const ancho = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#475569')
    .text(empresa || '', doc.page.margins.left, doc.page.margins.top, { width: ancho });
  doc.font('Helvetica-Bold').fontSize(15).fillColor(COLOR_ENCABEZADO)
    .text(titulo, doc.page.margins.left, doc.y + 2, { width: ancho });
  if (subtitulo) {
    doc.font('Helvetica').fontSize(9).fillColor('#475569').text(subtitulo, doc.page.margins.left, doc.y + 1, { width: ancho });
  }
  doc.moveDown(0.6);
}

function pieDePagina(doc, usuario) {
  const rango = doc.bufferedPageRange();
  const generado = formatearFecha(new Date(), true);
  for (let i = rango.start; i < rango.start + rango.count; i += 1) {
    doc.switchToPage(i);
    const margenInferior = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    const y = doc.page.height - 32;
    const ancho = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    doc.font('Helvetica').fontSize(8).fillColor('#64748b');
    doc.text(`Generado el ${generado}${usuario ? ` por ${usuario}` : ''}`, doc.page.margins.left, y, {
      width: ancho / 2,
      align: 'left',
      lineBreak: false
    });
    doc.text(`Página ${i + 1} de ${rango.count}`, doc.page.margins.left + ancho / 2, y, {
      width: ancho / 2,
      align: 'right',
      lineBreak: false
    });
    doc.page.margins.bottom = margenInferior;
  }
}

function calcularAnchos(columnas, anchoDisponible) {
  const pesos = columnas.map((columna) => columna.ancho || 1);
  const suma = pesos.reduce((total, peso) => total + peso, 0);
  return pesos.map((peso) => (peso / suma) * anchoDisponible);
}

function dibujarFilaTabla(doc, columnas, anchos, valores, y, opciones) {
  const relleno = 4;
  const x0 = doc.page.margins.left;
  doc.font(opciones.negrita ? 'Helvetica-Bold' : 'Helvetica').fontSize(opciones.tamano);
  const alto = Math.max(
    ...valores.map((valor, indice) => doc.heightOfString(valor || ' ', { width: anchos[indice] - relleno * 2 })),
    opciones.tamano
  ) + relleno * 2;

  if (opciones.fondo) {
    doc.rect(x0, y, anchos.reduce((a, b) => a + b, 0), alto).fill(opciones.fondo);
  }

  let x = x0;
  valores.forEach((valor, indice) => {
    doc.fillColor(opciones.color || COLOR_TEXTO).font(opciones.negrita ? 'Helvetica-Bold' : 'Helvetica').fontSize(opciones.tamano)
      .text(valor, x + relleno, y + relleno, {
        width: anchos[indice] - relleno * 2,
        align: opciones.alineaciones[indice]
      });
    x += anchos[indice];
  });

  doc.moveTo(x0, y + alto).lineTo(x0 + anchos.reduce((a, b) => a + b, 0), y + alto)
    .lineWidth(0.5).strokeColor(COLOR_BORDE).stroke();
  return alto;
}

function generarPdfTabla(res, { nombreArchivo, empresa, titulo, subtitulo, columnas, filas, totales, resumen, usuario }) {
  const orientacion = columnas.length > 6 ? 'landscape' : 'portrait';
  const doc = crearPdf(res, nombreArchivo, orientacion);
  const anchoDisponible = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const anchos = calcularAnchos(columnas, anchoDisponible);
  const tamano = columnas.length > 9 ? 7 : columnas.length > 6 ? 8 : 9;
  const alineaciones = columnas.map((columna) => (alinearDerecha(columna.tipo) ? 'right' : 'left'));
  const limiteInferior = () => doc.page.height - doc.page.margins.bottom;

  encabezadoPdf(doc, { empresa, titulo, subtitulo });

  const dibujarEncabezadoTabla = () => {
    const y = doc.y;
    const alto = dibujarFilaTabla(doc, columnas, anchos, columnas.map((c) => c.titulo), y, {
      tamano,
      negrita: true,
      color: '#ffffff',
      fondo: COLOR_ENCABEZADO,
      alineaciones
    });
    doc.y = y + alto;
  };

  dibujarEncabezadoTabla();

  if (!filas.length) {
    doc.font('Helvetica-Oblique').fontSize(10).fillColor('#64748b')
      .text('No hay registros para mostrar.', doc.page.margins.left, doc.y + 8);
  }

  filas.forEach((fila, indice) => {
    const valores = columnas.map((columna) => formatearValor(fila[columna.campo], columna.tipo));
    doc.font('Helvetica').fontSize(tamano);
    const altoEstimado = Math.max(
      ...valores.map((valor, i) => doc.heightOfString(valor || ' ', { width: anchos[i] - 8 })),
      tamano
    ) + 8;
    if (doc.y + altoEstimado > limiteInferior()) {
      doc.addPage();
      dibujarEncabezadoTabla();
    }
    const y = doc.y;
    const alto = dibujarFilaTabla(doc, columnas, anchos, valores, y, {
      tamano,
      fondo: indice % 2 === 1 ? COLOR_FILA_ALTERNA : null,
      alineaciones
    });
    doc.y = y + alto;
  });

  if (totales) {
    const valores = columnas.map((columna, indice) => {
      if (indice === 0 && totales[columna.campo] === undefined) return 'TOTALES';
      return totales[columna.campo] === undefined ? '' : formatearValor(totales[columna.campo], columna.tipo);
    });
    if (doc.y + 24 > limiteInferior()) {
      doc.addPage();
      dibujarEncabezadoTabla();
    }
    const y = doc.y;
    const alto = dibujarFilaTabla(doc, columnas, anchos, valores, y, {
      tamano,
      negrita: true,
      fondo: COLOR_SECCION,
      alineaciones
    });
    doc.y = y + alto;
  }

  if (resumen && resumen.length) {
    const altoResumen = resumen.length * 16 + 16;
    if (doc.y + altoResumen > limiteInferior()) doc.addPage();
    const anchoResumen = 260;
    const xResumen = doc.page.margins.left + anchoDisponible - anchoResumen;
    let yResumen = doc.y + 14;
    resumen.forEach((linea, indice) => {
      const ultima = indice === resumen.length - 1;
      doc.rect(xResumen, yResumen, anchoResumen, 16).fill(ultima ? COLOR_ENCABEZADO : COLOR_SECCION);
      doc.font('Helvetica-Bold').fontSize(9).fillColor(ultima ? '#ffffff' : COLOR_TEXTO)
        .text(linea.etiqueta, xResumen + 6, yResumen + 4, { width: anchoResumen / 2, lineBreak: false });
      doc.text(formatearValor(linea.valor, linea.tipo), xResumen + anchoResumen / 2, yResumen + 4, {
        width: anchoResumen / 2 - 6,
        align: 'right',
        lineBreak: false
      });
      yResumen += 16;
    });
    doc.y = yResumen;
  }

  pieDePagina(doc, usuario);
  doc.end();
}

function generarPdfDocumento(res, { nombreArchivo, empresa, titulo, subtitulo, secciones, firmas, usuario }) {
  const doc = crearPdf(res, nombreArchivo, 'portrait');
  const x0 = doc.page.margins.left;
  const ancho = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const limiteInferior = () => doc.page.height - doc.page.margins.bottom;

  encabezadoPdf(doc, { empresa, titulo, subtitulo });
  doc.moveDown(0.4);

  secciones.forEach((seccion) => {
    const columnas = seccion.columnas || 1;
    const anchoColumna = ancho / columnas;
    const filas = [];
    for (let i = 0; i < seccion.items.length; i += columnas) {
      filas.push(seccion.items.slice(i, i + columnas));
    }

    if (doc.y + 60 > limiteInferior()) doc.addPage();

    const ySeccion = doc.y;
    doc.rect(x0, ySeccion, ancho, 18).fill(COLOR_SECCION);
    doc.font('Helvetica-Bold').fontSize(10).fillColor(COLOR_ENCABEZADO)
      .text(seccion.titulo, x0 + 6, ySeccion + 5, { width: ancho - 12 });
    doc.y = ySeccion + 20;

    filas.forEach((fila) => {
      if (doc.y + 22 > limiteInferior()) doc.addPage();
      const yFila = doc.y;
      let altoFila = 16;
      fila.forEach((item, indice) => {
        const xCelda = x0 + indice * anchoColumna;
        const texto = formatearValor(item.valor, item.tipo);
        const fuente = item.destacado ? 'Helvetica-Bold' : 'Helvetica';
        const anchoEtiqueta = columnas === 1 ? anchoColumna * 0.6 : anchoColumna * 0.42;
        const anchoValor = anchoColumna - anchoEtiqueta - 12;
        doc.font(fuente).fontSize(9).fillColor('#475569')
          .text(item.etiqueta, xCelda + 6, yFila + 4, { width: anchoEtiqueta });
        doc.font(fuente).fontSize(9).fillColor(COLOR_TEXTO)
          .text(texto, xCelda + 6 + anchoEtiqueta, yFila + 4, {
            width: anchoValor,
            align: alinearDerecha(item.tipo) ? 'right' : 'left'
          });
        altoFila = Math.max(
          altoFila,
          doc.heightOfString(item.etiqueta, { width: anchoEtiqueta }) + 8,
          doc.heightOfString(texto || ' ', { width: anchoValor }) + 8
        );
      });
      doc.moveTo(x0, yFila + altoFila).lineTo(x0 + ancho, yFila + altoFila)
        .lineWidth(0.5).strokeColor(COLOR_BORDE).stroke();
      doc.y = yFila + altoFila;
    });
    doc.y += 10;
  });

  if (firmas && firmas.length) {
    if (doc.y + 90 > limiteInferior()) doc.addPage();
    const yFirma = doc.y + 60;
    const anchoFirma = ancho / firmas.length;
    firmas.forEach((firma, indice) => {
      const xFirma = x0 + indice * anchoFirma + 20;
      doc.moveTo(xFirma, yFirma).lineTo(xFirma + anchoFirma - 40, yFirma).lineWidth(0.7).strokeColor('#475569').stroke();
      doc.font('Helvetica').fontSize(9).fillColor('#475569')
        .text(firma, xFirma, yFirma + 4, { width: anchoFirma - 40, align: 'center' });
    });
  }

  pieDePagina(doc, usuario);
  doc.end();
}

function crearLibro(titulo) {
  const libro = new ExcelJS.Workbook();
  libro.creator = 'Sistema de Planilla';
  libro.created = new Date();
  const hoja = libro.addWorksheet(String(titulo).slice(0, 31));
  return { libro, hoja };
}

async function enviarExcel(res, libro, nombreArchivo) {
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${nombreSeguro(nombreArchivo)}.xlsx"`);
  await libro.xlsx.write(res);
  res.end();
}

function valorExcel(valor, tipo) {
  if (valor === null || valor === undefined) return null;
  switch (tipo) {
    case 'moneda':
    case 'numero':
      return Number.isFinite(Number(valor)) ? Number(valor) : null;
    case 'fecha':
    case 'fechahora': {
      const fecha = convertirFecha(valor);
      if (!fecha) return String(valor);
      return new Date(Date.UTC(
        fecha.getFullYear(), fecha.getMonth(), fecha.getDate(),
        fecha.getHours(), fecha.getMinutes(), fecha.getSeconds()
      ));
    }
    case 'booleano':
      return esVerdadero(valor) ? 'Sí' : 'No';
    default:
      return String(valor);
  }
}

function formatoExcel(tipo) {
  switch (tipo) {
    case 'moneda':
      return '"Q"#,##0.00';
    case 'fecha':
      return 'dd/mm/yyyy';
    case 'fechahora':
      return 'dd/mm/yyyy hh:mm';
    default:
      return undefined;
  }
}

function estilarEncabezado(fila) {
  fila.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  fila.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
  fila.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
}

async function generarExcelTabla(res, { nombreArchivo, empresa, titulo, subtitulo, columnas, filas, totales, resumen }) {
  const { libro, hoja } = crearLibro(titulo);
  const ultimaColumna = columnas.length;

  hoja.addRow([empresa || '']);
  hoja.addRow([titulo]);
  hoja.addRow([subtitulo || `Generado el ${formatearFecha(new Date(), true)}`]);
  hoja.addRow([]);
  [1, 2, 3].forEach((numeroFila) => hoja.mergeCells(numeroFila, 1, numeroFila, Math.max(ultimaColumna, 1)));
  hoja.getRow(1).font = { bold: true, color: { argb: 'FF475569' } };
  hoja.getRow(2).font = { bold: true, size: 14, color: { argb: 'FF1E3A8A' } };
  hoja.getRow(3).font = { color: { argb: 'FF475569' } };

  const encabezado = hoja.addRow(columnas.map((columna) => columna.titulo));
  estilarEncabezado(encabezado);

  columnas.forEach((columna, indice) => {
    const objetoColumna = hoja.getColumn(indice + 1);
    objetoColumna.width = Math.max(12, Math.round((columna.ancho || 1) * 10));
    const formato = formatoExcel(columna.tipo);
    if (formato) objetoColumna.numFmt = formato;
  });

  filas.forEach((fila) => {
    const agregada = hoja.addRow(columnas.map((columna) => valorExcel(fila[columna.campo], columna.tipo)));
    columnas.forEach((columna, indice) => {
      const celda = agregada.getCell(indice + 1);
      const formato = formatoExcel(columna.tipo);
      if (formato) celda.numFmt = formato;
      if (alinearDerecha(columna.tipo)) celda.alignment = { horizontal: 'right' };
    });
  });

  if (totales) {
    const filaTotales = hoja.addRow(columnas.map((columna, indice) => {
      if (indice === 0 && totales[columna.campo] === undefined) return 'TOTALES';
      return totales[columna.campo] === undefined ? null : valorExcel(totales[columna.campo], columna.tipo);
    }));
    filaTotales.font = { bold: true };
    columnas.forEach((columna, indice) => {
      const formato = formatoExcel(columna.tipo);
      if (formato) filaTotales.getCell(indice + 1).numFmt = formato;
    });
  }

  if (resumen && resumen.length) {
    hoja.addRow([]);
    resumen.forEach((linea) => {
      const filaResumen = hoja.addRow([]);
      const celdaEtiqueta = filaResumen.getCell(Math.max(ultimaColumna - 1, 1));
      const celdaValor = filaResumen.getCell(ultimaColumna);
      celdaEtiqueta.value = linea.etiqueta;
      celdaEtiqueta.font = { bold: true };
      celdaEtiqueta.alignment = { horizontal: 'right' };
      celdaValor.value = valorExcel(linea.valor, linea.tipo);
      celdaValor.font = { bold: true };
      const formato = formatoExcel(linea.tipo);
      if (formato) celdaValor.numFmt = formato;
    });
  }

  hoja.views = [{ state: 'frozen', ySplit: 5 }];
  if (filas.length) {
    hoja.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5, column: ultimaColumna } };
  }

  await enviarExcel(res, libro, nombreArchivo);
}

async function generarExcelDocumento(res, { nombreArchivo, empresa, titulo, subtitulo, secciones }) {
  const { libro, hoja } = crearLibro(titulo);
  hoja.columns = [{ width: 36 }, { width: 22 }, { width: 36 }, { width: 22 }];

  hoja.addRow([empresa || '']).font = { bold: true, color: { argb: 'FF475569' } };
  const filaTitulo = hoja.addRow([titulo]);
  filaTitulo.font = { bold: true, size: 14, color: { argb: 'FF1E3A8A' } };
  if (subtitulo) hoja.addRow([subtitulo]).font = { color: { argb: 'FF475569' } };
  hoja.addRow([]);

  secciones.forEach((seccion) => {
    const columnas = seccion.columnas || 1;
    const filaSeccion = hoja.addRow([seccion.titulo]);
    hoja.mergeCells(filaSeccion.number, 1, filaSeccion.number, columnas * 2);
    estilarEncabezado(filaSeccion);
    filaSeccion.alignment = { horizontal: 'left' };

    for (let i = 0; i < seccion.items.length; i += columnas) {
      const grupo = seccion.items.slice(i, i + columnas);
      const valores = [];
      grupo.forEach((item) => {
        valores.push(item.etiqueta, valorExcel(item.valor, item.tipo));
      });
      const fila = hoja.addRow(valores);
      grupo.forEach((item, indice) => {
        const celdaEtiqueta = fila.getCell(indice * 2 + 1);
        const celdaValor = fila.getCell(indice * 2 + 2);
        const formato = formatoExcel(item.tipo);
        if (formato) celdaValor.numFmt = formato;
        celdaValor.alignment = { horizontal: alinearDerecha(item.tipo) ? 'right' : 'left' };
        if (item.destacado) {
          celdaEtiqueta.font = { bold: true };
          celdaValor.font = { bold: true };
        }
      });
    }
    hoja.addRow([]);
  });

  await enviarExcel(res, libro, nombreArchivo);
}

module.exports = {
  formatearFecha,
  formatearMoneda,
  formatearValor,
  generarPdfTabla,
  generarPdfDocumento,
  generarExcelTabla,
  generarExcelDocumento
};
