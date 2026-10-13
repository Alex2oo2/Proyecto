import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../services/api.service';

// Pantalla de relleno que se muestra cuando el sidebar dinámico enlaza a una
// OPCION que ya existe en la base de datos (creada desde "Opciones") pero
// todavía no tiene un componente Angular real. Evita una ruta rota / 404
// mientras se construye la pantalla definitiva.
@Component({
  selector: 'app-pagina-generica',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-gray-800 border border-gray-700 rounded-lg p-10 text-center">
      <h2 class="text-2xl font-bold text-white mb-2">{{ nombre }}</h2>
      <p class="text-gray-400">Esta pantalla todavía no ha sido implementada.</p>
      <p class="text-gray-500 text-sm mt-2">
        La opción "{{ nombre }}" ya existe en el sistema de permisos (ROLE_OPCION),
        pero le falta su componente Angular. Avísale al equipo de desarrollo para crearlo.
      </p>
    </div>
  `
})
export class PaginaGenericaComponent implements OnInit {
  nombre = 'Cargando...';

  constructor(private route: ActivatedRoute, private apiService: ApiService) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.nombre = 'Opción';
      return;
    }
    this.apiService.obtenerNombreOpcion(+id).subscribe({
      next: (data) => (this.nombre = data?.Nombre || 'Opción'),
      error: () => (this.nombre = 'Opción')
    });
  }
}
