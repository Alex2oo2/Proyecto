import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ApiService } from '../services/api.service';
import { PermisosService } from '../services/permisos.service';
import { Genero } from '../models/index';

@Component({
  selector: 'app-genero',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './genero.component.html'
})
export class GeneroComponent implements OnInit, OnDestroy {
  generos: Genero[] = [];
  isLoading = false;
  isSubmitting = false;
  error: string | null = null;
  success: string | null = null;
  showForm = false;
  editingId: number | null = null;
  form: FormGroup;
  private destroy$ = new Subject<void>();

  constructor(private apiService: ApiService, public permisosService: PermisosService, private fb: FormBuilder) {
    this.form = this.fb.group({
      Nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]]
    });
  }

  ngOnInit(): void {
    this.loadGeneros();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadGeneros(): void {
    this.isLoading = true;
    this.error = null;
    this.apiService.getGeneros().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.generos = data || [];
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err.error?.mensaje || 'Error al cargar los generos';
      }
    });
  }

  openForm(genero?: Genero): void {
    this.showForm = true;
    this.error = null;
    this.success = null;
    this.editingId = genero?.IdGenero || null;
    genero ? this.form.patchValue(genero) : this.form.reset();
  }

  closeForm(): void {
    this.showForm = false;
    this.editingId = null;
    this.form.reset();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.error = null;
    const request = this.editingId
      ? this.apiService.actualizarGenero(this.editingId, this.form.value)
      : this.apiService.crearGenero(this.form.value);

    request.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.success = this.editingId ? 'Genero actualizado exitosamente' : 'Genero creado exitosamente';
        this.closeForm();
        this.loadGeneros();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.error = err.error?.mensaje || 'Error al guardar el genero';
      }
    });
  }

  deleteGenero(id: number | undefined): void {
    if (!id || !confirm('¿Estas seguro de que deseas eliminar este genero?')) return;

    this.apiService.eliminarGenero(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.success = 'Genero eliminado exitosamente';
        this.loadGeneros();
      },
      error: (err) => {
        this.error = err.error?.mensaje || err.error?.error || 'Error al eliminar el genero';
      }
    });
  }
}