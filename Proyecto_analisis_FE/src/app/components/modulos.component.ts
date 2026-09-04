import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { Modulo } from '../models/index';

@Component({
  selector: 'app-modulos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './modulos.component.html'
})
export class ModulosComponent implements OnInit {
  items: Modulo[] = [];
  showForm = false;
  isEditMode = false;
  form: FormGroup;
  selectedId: number | null = null;
  loading = false;
  error: string | null = null;
  success: string | null = null;

  constructor(private apiService: ApiService, private fb: FormBuilder) {
    this.form = this.fb.group({
      Nombre: ['', Validators.required],
      OrdenMenu: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.loadItems();
  }

  loadItems() {
    this.loading = true;
    this.apiService.getModulos().subscribe({
      next: (data) => {
        this.items = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar módulos';
        this.loading = false;
      }
    });
  }

  editItem(item: Modulo) {
    this.isEditMode = true;
    this.selectedId = item.IdModulo || null;
    this.form.patchValue(item);
    this.showForm = true;
  }

  deleteItem(id: number | undefined) {
    if (!id || !confirm('¿Eliminar este módulo?')) return;
    this.apiService.eliminarModulo(id).subscribe({
      next: () => {
        this.success = 'Módulo eliminado';
        this.loadItems();
      },
      error: (err) => {
        this.error = err.error?.mensaje || err.error?.error || 'Error al eliminar el módulo';
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) return;
    const data = this.form.value;

    if (this.isEditMode && this.selectedId) {
      this.apiService.actualizarModulo(this.selectedId, data).subscribe({
        next: () => {
          this.success = 'Módulo actualizado';
          this.resetForm();
          this.loadItems();
        },
        error: (err) => {
          this.error = 'Error al actualizar';
        }
      });
    } else {
      this.apiService.crearModulo(data).subscribe({
        next: () => {
          this.success = 'Módulo creado';
          this.resetForm();
          this.loadItems();
        },
        error: (err) => {
          this.error = 'Error al crear';
        }
      });
    }
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
