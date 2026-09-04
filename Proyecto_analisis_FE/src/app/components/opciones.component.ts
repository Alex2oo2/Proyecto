import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { PermisosService } from '../services/permisos.service';
import { Opcion, Menu } from '../models/index';

@Component({
  selector: 'app-opciones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './opciones.component.html'
})
export class OpcionesComponent implements OnInit {
  opciones: Opcion[] = [];
  menus: Menu[] = [];
  showForm = false;
  isEditMode = false;
  form: FormGroup;
  selectedId: number | null = null;
  loading = false;
  error: string | null = null;
  success: string | null = null;

  constructor(private apiService: ApiService, public permisosService: PermisosService, private fb: FormBuilder) {
    this.form = this.fb.group({
      IdMenu: ['', Validators.required],
      Nombre: ['', Validators.required],
      OrdenMenu: [''],
      Pagina: ['']
    });
  }

  ngOnInit() {
    this.loadMenus();
    this.loadOpciones();
  }

  loadMenus() {
    this.apiService.getMenus().subscribe(data => this.menus = data);
  }

  loadOpciones() {
    this.loading = true;
    this.apiService.getOpciones().subscribe({
      next: (data) => {
        this.opciones = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar opciones';
        this.loading = false;
      }
    });
  }

  editItem(item: Opcion) {
    this.isEditMode = true;
    this.selectedId = item.IdOpcion || null;
    this.form.patchValue(item);
    this.showForm = true;
  }

  deleteItem(id: number | undefined) {
    if (!id || !confirm('¿Eliminar esta opción?')) return;
    this.apiService.eliminarOpcion(id).subscribe({
      next: () => {
        this.success = 'Opción eliminada';
        this.loadOpciones();
      },
      error: (err) => {
        this.error = err.error?.mensaje || err.error?.error || 'Error al eliminar la opción';
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) return;
    const data = this.form.value;

    if (this.isEditMode && this.selectedId) {
      this.apiService.actualizarOpcion(this.selectedId, data).subscribe({
        next: () => {
          this.success = 'Opción actualizada';
          this.resetForm();
          this.loadOpciones();
        },
        error: (err) => {
          this.error = 'Error al actualizar';
        }
      });
    } else {
      this.apiService.crearOpcion(data).subscribe({
        next: () => {
          this.success = 'Opción creada';
          this.resetForm();
          this.loadOpciones();
        },
        error: (err) => {
          this.error = 'Error al crear';
        }
      });
    }
  }

  getNombreMenu(id: number): string {
    return this.menus.find(m => m.IdMenu === id)?.Nombre || '-';
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
