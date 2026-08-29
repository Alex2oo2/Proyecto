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
      icon: '🏠',
      route: '/dashboard'
    },
    {
      label: 'Administración',
      icon: '⚙️',
      children: [
        { label: 'Usuarios', icon: '👥', route: '/usuarios' },
        { label: 'Roles', icon: '🔑', route: '/roles' },
        { label: 'Módulos', icon: '📦', route: '/modulos' },
        { label: 'Menús', icon: '📋', route: '/menus' },
        { label: 'Opciones', icon: '✨', route: '/opciones' }
      ]
    },
    {
      label: 'Catálogos',
      icon: '📚',
      children: [
        { label: 'Empresas', icon: '🏢', route: '/empresas' },
        { label: 'Sucursales', icon: '🏭', route: '/sucursales' }
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
