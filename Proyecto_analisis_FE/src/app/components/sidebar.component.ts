import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../services/api.service';
import { ModuloArbol } from '../models/index';

interface NavItem {
  label: string;
  icon: string;
  route?: string;
  badge?: number;
  grupo?: string;
  children?: NavItem[];
}

// Nombres de OPCION para los que ya existe una pantalla Angular real.
// Cualquier opción que NO esté en este mapa (ej. módulos nuevos creados
// desde "Módulos/Menús/Opciones", como Contaduria > Pagos, Impuestos) cae
// automáticamente en la pantalla genérica /dashboard/opcion/:id.
const RUTAS_CONOCIDAS: { [nombreOpcion: string]: string } = {
  'Empresas': '/dashboard/empresas',
  'Sucursales': '/dashboard/sucursales',
  'Generos': '/dashboard/genero',
  'Estatus Usuario': '/dashboard/estatus-usuario',
  'Roles': '/dashboard/roles',
  'Modulos': '/dashboard/modulos',
  'Menus': '/dashboard/menus',
  'Opciones': '/dashboard/opciones',
  'Usuarios': '/dashboard/usuarios',
  'Asignar Opciones a un Role': '/dashboard/asignacion-opciones',
  'Estados Civiles': '/dashboard/estados-civiles',
  'Status Empleado': '/dashboard/status-empleado',
  'Flujos Status Empleado': '/dashboard/flujos-status-empleado',
  'Tipos de Documentos': '/dashboard/tipos-documento',
  'Departamentos': '/dashboard/departamentos',
  'Puestos': '/dashboard/puestos',
  'Personas': '/dashboard/personas',
  'Documentos de Personas': '/dashboard/documentos-persona',
  'Bancos': '/dashboard/bancos',
  'Empleados': '/dashboard/empleados',
  'Cuentas Bancarias Empleados': '/dashboard/cuentas-bancarias',
  'Inasistencias de Empleados': '/dashboard/inasistencias',
  'Calcular Planilla': '/dashboard/calcular-planilla',
  'Reporte de Planilla': '/dashboard/reporte-planilla',
  'Boletas de Pago': '/dashboard/boletas-pago',
  'Liquidacion de Empleado': '/dashboard/liquidacion'
};

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  @Input() isOpen = true;
  @Output() itemClicked = new EventEmitter<void>();
  expandedMenus: Set<string> = new Set();

  // "Inicio" siempre está disponible para cualquier usuario autenticado;
  // el resto del menú se arma dinámicamente desde el árbol Modulo->Menu->Opcion.
  navItems: NavItem[] = [
    { label: 'Inicio', icon: '', route: '/dashboard' }
  ];

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.cargarMenuDinamico();
  }

  // Trae el árbol de navegación (ya filtrado por el backend según lo que el
  // rol del usuario puede consultar) y lo convierte a la estructura del menú.
  // Cada MODULO se muestra como grupo colapsable; cada OPCION es un link.
  private cargarMenuDinamico(): void {
    this.apiService.obtenerArbolMenu().subscribe({
      next: (modulos) => {
        const grupos = modulos.map(modulo => this.mapearModulo(modulo)).filter(g => g.children!.length > 0);
        this.navItems = [{ label: 'Inicio', icon: '', route: '/dashboard' }, ...grupos];
      },
      error: (err) => console.error('Error al cargar el menú dinámico:', err)
    });
  }

  private mapearModulo(modulo: ModuloArbol): NavItem {
    const children: NavItem[] = [];
    for (const menu of modulo.menus) {
      for (const opcion of menu.opciones) {
        children.push({
          label: opcion.nombre,
          icon: '',
          grupo: menu.nombre,
          route: this.resolverRuta(opcion.idOpcion, opcion.nombre)
        });
      }
    }
    return { label: modulo.nombre, icon: '', children };
  }

  // Si ya existe una pantalla Angular real para esa opción, usa esa ruta.
  // Si no, cae en la pantalla genérica "en construcción".
  private resolverRuta(idOpcion: number, nombre: string): string {
    const rutaConocida = RUTAS_CONOCIDAS[nombre];
    if (rutaConocida) return rutaConocida;
    return `/dashboard/opcion/${idOpcion}`;
  }

  toggleMenu(label: string): void {
    if (this.expandedMenus.has(label)) {
      this.expandedMenus.delete(label);
    } else {
      this.expandedMenus.add(label);
    }
  }

  isMenuExpanded(label: string): boolean {
    return this.expandedMenus.has(label);
  }

  mostrarGrupo(hijos: NavItem[], indice: number): boolean {
    return indice === 0 || hijos[indice].grupo !== hijos[indice - 1].grupo;
  }

  onItemClick(): void {
    this.itemClicked.emit();
  }
}
