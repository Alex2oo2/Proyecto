import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { PermisosService } from '../services/permisos.service';
import { Menu, Modulo } from '../models/index';

@Component({
  selector: 'app-menus',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './menus.component.html'
})
export class MenusComponent implements OnInit {
  menus: Menu[] = [];
  modulos: Modulo[] = [];
  showForm = false;
  isEditMode = false;
  form: FormGroup;
  selectedId: number | null = null;
  loading = false;
  error: string | null = null;
  success: string | null = null;

  constructor(private apiService: ApiService, public permisosService: PermisosService, private fb: FormBuilder) {
    this.form = this.fb.group({
      IdModulo: ['', Validators.required],
      Nombre: ['', Validators.required],
      OrdenMenu: ['']
    });
  }

  ngOnInit() {
    this.loadModulos();
    this.loadMenus();
  }

  loadModulos() {
    this.apiService.getModulos().subscribe(data => this.modulos = data);
  }

  loadMenus() {
    this.loading = true;
    this.apiService.getMenus().subscribe({
      next: (data) => {
        this.menus = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar menús';
        this.loading = false;
      }
    });
  }

  editItem(item: Menu) {
    this.isEditMode = true;
    this.selectedId = item.IdMenu || null;
    this.form.patchValue(item);
    this.showForm = true;
  }

  deleteItem(id: number | undefined) {
    if (!id || !confirm('¿Eliminar este menú?')) return;
    this.apiService.eliminarMenu(id).subscribe({
      next: () => {
        this.success = 'Menú eliminado';
        this.loadMenus();
      },
      error: (err) => {
        this.error = err.error?.mensaje || err.error?.error || 'Error al eliminar el menú';
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) return;
    const data = this.form.value;

    if (this.isEditMode && this.selectedId) {
      this.apiService.actualizarMenu(this.selectedId, data).subscribe({
        next: () => {
          this.success = 'Menú actualizado';
          this.resetForm();
          this.loadMenus();
        },
        error: (err) => {
          this.error = 'Error al actualizar';
        }
      });
    } else {
      this.apiService.crearMenu(data).subscribe({
        next: () => {
          this.success = 'Menú creado';
          this.resetForm();
          this.loadMenus();
        },
        error: (err) => {
          this.error = 'Error al crear';
        }
      });
    }
  }

  getNombreModulo(id: number): string {
    return this.modulos.find(m => m.IdModulo === id)?.Nombre || '-';
  }

  resetForm() {
    this.form.reset();
    this.showForm = false;
    this.isEditMode = false;
    this.selectedId = null;
    this.error = null;
    this.success = null;
  }

  toggleForm() {
    this.showForm = !this.showForm;
    if (!this.showForm) this.resetForm();
  }
}
