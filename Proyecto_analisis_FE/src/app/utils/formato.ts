import { formatDate } from '@angular/common';

export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export type TipoValor = 'texto' | 'numero' | 'moneda' | 'fecha' | 'fechahora' | 'booleano';

export function esVerdadero(valor: any): boolean {
  return valor === true || valor === 1 || valor === '1';
}

export function formatearMoneda(valor: any): string {
  const numero = Number(valor);
  if (valor === null || valor === undefined || valor === '' || !Number.isFinite(numero)) return '';
  const signo = numero < 0 ? '-' : '';
  return `${signo}Q ${Math.abs(numero).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatearFecha(valor: any): string {
  if (!valor) return '';
  try {
    return formatDate(valor, 'dd/MM/yyyy', 'en-US');
  } catch {
    return String(valor);
  }
}

export function formatearFechaHora(valor: any): string {
  if (!valor) return '';
  try {
    return formatDate(valor, 'dd/MM/yyyy HH:mm', 'en-US');
  } catch {
    return String(valor);
  }
}

export function formatearValor(valor: any, tipo: TipoValor = 'texto'): string {
  if (valor === null || valor === undefined) return '';
  switch (tipo) {
    case 'moneda':
      return formatearMoneda(valor);
    case 'fecha':
      return formatearFecha(valor);
    case 'fechahora':
      return formatearFechaHora(valor);
    case 'booleano':
      return esVerdadero(valor) ? 'Sí' : 'No';
    default:
      return String(valor);
  }
}

export function descripcionPeriodo(anio: number, mes: number): string {
  return `${MESES[mes - 1]} ${anio}`;
}

export function mensajeError(error: any, predeterminado: string): string {
  return error?.error?.mensaje || error?.error?.error || predeterminado;
}
