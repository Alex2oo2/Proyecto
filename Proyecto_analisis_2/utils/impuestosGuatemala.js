const IGSS_LABORAL = 0.0483;
const DEDUCCION_PERSONAL_ANUAL = 48000;
const LIMITE_TARIFA_REDUCIDA = 300000;
const TARIFA_REDUCIDA = 0.05;
const TARIFA_GENERAL = 0.07;
const BONIFICACION_INCENTIVO = 250;
const MESES_ANIO = 12;
const DIAS_MES_COMERCIAL = 30;
const DIAS_ANIO = 365;
const DIAS_VACACIONES_ANUALES = 15;

const MOTIVOS_EGRESO = [
  { Nombre: 'Renuncia', Indemnizacion: false, StatusDestino: 'Baja' },
  { Nombre: 'Mutuo acuerdo', Indemnizacion: false, StatusDestino: 'Baja' },
  { Nombre: 'Fin de contrato', Indemnizacion: false, StatusDestino: 'Baja' },
  { Nombre: 'Despido justificado', Indemnizacion: false, StatusDestino: 'Despedido' },
  { Nombre: 'Despido injustificado', Indemnizacion: true, StatusDestino: 'Despedido' }
];

function redondear(valor) {
  return Math.round((Number(valor) + Number.EPSILON) * 100) / 100;
}

function numero(valor) {
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : 0;
}

function calcularIgss(sueldoBase, otrosIngresos) {
  return redondear((numero(sueldoBase) + numero(otrosIngresos)) * IGSS_LABORAL);
}

function calcularIsrMensual(sueldoBase, otrosIngresos, igssMensual) {
  const rentaBruta = (numero(sueldoBase) + numero(otrosIngresos)) * MESES_ANIO;
  const rentaImponible = Math.max(
    0,
    rentaBruta - DEDUCCION_PERSONAL_ANUAL - numero(igssMensual) * MESES_ANIO
  );
  const isrAnual = rentaImponible <= LIMITE_TARIFA_REDUCIDA
    ? rentaImponible * TARIFA_REDUCIDA
    : LIMITE_TARIFA_REDUCIDA * TARIFA_REDUCIDA + (rentaImponible - LIMITE_TARIFA_REDUCIDA) * TARIFA_GENERAL;
  return redondear(isrAnual / MESES_ANIO);
}

function calcularDescuentos(sueldoBase, otrosIngresos) {
  const DescuentoIgss = calcularIgss(sueldoBase, otrosIngresos);
  const DescuentoIsr = calcularIsrMensual(sueldoBase, otrosIngresos, DescuentoIgss);
  return { DescuentoIgss, DescuentoIsr };
}

function parsearFecha(valor) {
  if (valor instanceof Date) {
    return new Date(Date.UTC(valor.getFullYear(), valor.getMonth(), valor.getDate()));
  }
  const coincidencia = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(String(valor || ''));
  if (!coincidencia) return null;
  const fecha = new Date(Date.UTC(Number(coincidencia[1]), Number(coincidencia[2]) - 1, Number(coincidencia[3])));
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function diasEntre(inicio, fin) {
  return Math.round((fin.getTime() - inicio.getTime()) / 86400000);
}

function fechaUtc(anio, mes, dia) {
  return new Date(Date.UTC(anio, mes, dia));
}

function ultimoAniversario(referencia, hasta) {
  let candidata = fechaUtc(hasta.getUTCFullYear(), referencia.getUTCMonth(), referencia.getUTCDate());
  if (candidata > hasta) {
    candidata = fechaUtc(hasta.getUTCFullYear() - 1, referencia.getUTCMonth(), referencia.getUTCDate());
  }
  return candidata < referencia ? referencia : candidata;
}

function inicioPeriodoAnual(mes, hasta, contratacion) {
  let inicio = fechaUtc(hasta.getUTCFullYear(), mes, 1);
  if (inicio > hasta) {
    inicio = fechaUtc(hasta.getUTCFullYear() - 1, mes, 1);
  }
  return inicio < contratacion ? contratacion : inicio;
}

function obtenerMotivo(nombre) {
  return MOTIVOS_EGRESO.find((motivo) => motivo.Nombre.toLowerCase() === String(nombre || '').trim().toLowerCase());
}

function calcularLiquidacion(datos) {
  const contratacion = parsearFecha(datos.FechaContratacion);
  const egreso = parsearFecha(datos.FechaEgreso);
  const motivo = obtenerMotivo(datos.MotivoEgreso);

  const sueldoBase = redondear(numero(datos.IngresoSueldoBase));
  const bonificacion = redondear(numero(datos.IngresoBonificacionDecreto));
  const otrosIngresos = redondear(numero(datos.IngresoOtrosIngresos));
  const igss = redondear(numero(datos.DescuentoIgss));
  const isr = redondear(numero(datos.DescuentoIsr));
  const inasistencias = redondear(numero(datos.DescuentoInasistencias));

  const promedioMensual = sueldoBase + otrosIngresos;
  const diasServicio = diasEntre(contratacion, egreso) + 1;
  const diasAguinaldo = diasEntre(inicioPeriodoAnual(11, egreso, contratacion), egreso) + 1;
  const diasBono14 = diasEntre(inicioPeriodoAnual(6, egreso, contratacion), egreso) + 1;
  const diasDesdeAniversario = diasEntre(ultimoAniversario(contratacion, egreso), egreso) + 1;
  const diasVacaciones = (DIAS_VACACIONES_ANUALES * diasDesdeAniversario) / DIAS_ANIO;

  const indemnizacion = motivo && motivo.Indemnizacion
    ? redondear((promedioMensual * diasServicio) / DIAS_ANIO)
    : 0;
  const aguinaldo = redondear((promedioMensual * diasAguinaldo) / DIAS_ANIO);
  const bono14 = redondear((promedioMensual * diasBono14) / DIAS_ANIO);
  const vacaciones = redondear((promedioMensual / DIAS_MES_COMERCIAL) * diasVacaciones);

  const totalDescuentos = redondear(igss + isr + inasistencias);
  const totalIngresos = redondear(
    sueldoBase + bonificacion + otrosIngresos + indemnizacion + aguinaldo + bono14 + vacaciones
  );

  return {
    IngresoSueldoBase: sueldoBase,
    IngresoBonificacionDecreto: bonificacion,
    IngresoOtrosIngresos: otrosIngresos,
    DescuentoIgss: igss,
    DescuentoIsr: isr,
    DescuentoInasistencias: inasistencias,
    SalarioNeto: redondear(sueldoBase + bonificacion + otrosIngresos - totalDescuentos),
    IngresoIndemnizacion: indemnizacion,
    IngresoAguinaldo: aguinaldo,
    IngresoBono14: bono14,
    IngresoVacaciones: vacaciones,
    TotalIngresos: totalIngresos,
    TotalDescuentos: totalDescuentos,
    TotalNeto: redondear(totalIngresos - totalDescuentos),
    DiasServicio: diasServicio,
    DiasAguinaldo: diasAguinaldo,
    DiasBono14: diasBono14,
    DiasVacaciones: redondear(diasVacaciones)
  };
}

module.exports = {
  IGSS_LABORAL,
  BONIFICACION_INCENTIVO,
  MOTIVOS_EGRESO,
  redondear,
  numero,
  parsearFecha,
  obtenerMotivo,
  calcularIgss,
  calcularIsrMensual,
  calcularDescuentos,
  calcularLiquidacion
};
