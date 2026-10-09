import { FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { PlanillaService } from '../../services/planilla.service';
import { TipoValor } from '../../utils/formato';

export interface CampoCrud {
  nombre: string;
  etiqueta: string;
  tipo: 'texto' | 'numero' | 'moneda' | 'fecha' | 'correo' | 'select' | 'booleano';
  requerido?: boolean;
  longitudMaxima?: number;
  catalogo?: string;
  soloLecturaAlEditar?: boolean;
  soloLectura?: boolean;
  valorInicial?: any;
  ayuda?: string;
}

export interface ColumnaCrud {
  campo: string;
  titulo: string;
  tipo?: TipoValor;
}

export interface ContextoFormulario {
  planillaService: PlanillaService;
  destroy$: Subject<void>;
}

export interface ConfigCrud {
  titulo: string;
  descripcion: string;
  recurso: string;
  opcion: string;
  singular: string;
  claves: string[];
  campos: CampoCrud[];
  columnas: ColumnaCrud[];
  descripcionRegistro: (registro: any) => string;
  puedeModificar?: (registro: any) => boolean;
  configurarFormulario?: (form: FormGroup, contexto: ContextoFormulario) => void;
}
