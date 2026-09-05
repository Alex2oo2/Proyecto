import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface NavItem {
  label: string;
  icon: string;
  route?: string;
  badge?: number;
  children?: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  @Input() isOpen = true;
  @Output() itemClicked = new EventEmitter<void>();
  expandedMenus: Set<string> = new Set();

  navItems: NavItem[] = [
    {
      label: 'Inicio',
      icon: '',
      route: '/dashboard'
    },
    {
      label: 'Administración',
      icon: '',
      children: [
        { label: 'Usuarios', icon: '', route: '/dashboard/usuarios' },
        { label: 'Roles', icon: '', route: '/dashboard/roles' },
        { label: 'Permisos', icon: '', route: '/dashboard/permisos' },
        { label: 'Módulos', icon: '', route: '/dashboard/modulos' },
        { label: 'Menús', icon: '', route: '/dashboard/menus' },
        { label: 'Opciones', icon: '', route: '/dashboard/opciones' },
        { label: 'Genero', icon: '', route: '/dashboard/genero' },
        { label: 'Estatus de usuario', icon: '', route: '/dashboard/status-usuarios' }
      ]
    },
    {
      label: 'Catálogos',
      icon: '',
      children: [
        { label: 'Empresas', icon: '', route: '/dashboard/empresas' },
        { label: 'Sucursales', icon: '', route: '/dashboard/sucursales' }
      ]
    }
  ];

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

  onItemClick(): void {
    this.itemClicked.emit();
  }
}
