import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ApiService } from '../services/api.service';
import { PermisosService } from '../services/permisos.service';
import { StatusUsuario } from '../models/index';

@Component({
  selector: 'app-status-usuario',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './status-usuario.component.html'
})
export class StatusUsuarioComponent implements OnInit, OnDestroy {
  statuses: StatusUsuario[] = [];
  isLoading = false;
  isSubmitting = false;
  error: string | null = null;
  success: string | null = null;
  showForm = false;
  editingId: number | null = null;
  form: FormGroup;
  private destroy$ = new Subject<void>();

  constructor(
    private apiService: ApiService,
    public permisosService: PermisosService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      Nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]]
    });
  }

  ngOnInit(): void {
    this.loadStatuses();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStatuses(): void {
    this.isLoading = true;
    this.error = null;
    this.apiService.getStatusUsuarios().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.statuses = data || [];
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err.error?.mensaje || 'Error al cargar los estatus de usuario';
      }
    });
  }

  openForm(status?: StatusUsuario): void {
    this.showForm = true;
    this.error = null;
    this.success = null;
    this.editingId = status?.IdStatusUsuario || null;
    status ? this.form.patchValue(status) : this.form.reset();
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
      ? this.apiService.actualizarStatusUsuario(this.editingId, this.form.value)
      : this.apiService.crearStatusUsuario(this.form.value);

    request.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        const wasEditing = this.editingId !== null;
        this.isSubmitting = false;
        this.closeForm();
        this.success = wasEditing ? 'Estatus de usuario actualizado exitosamente' : 'Estatus de usuario creado exitosamente';
        this.loadStatuses();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.error = err.error?.mensaje || err.error?.error || 'Error al guardar el estatus de usuario';
      }
    });
  }

  deleteStatus(id: number | undefined): void {
    if (!id || !confirm('¿Estas seguro de que deseas eliminar este estatus de usuario?')) return;

    this.apiService.eliminarStatusUsuario(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.success = 'Estatus de usuario eliminado exitosamente';
        this.loadStatuses();
      },
      error: (err) => {
        this.error = err.error?.mensaje || err.error?.error || 'Error al eliminar el estatus de usuario';
      }
    });
  }
}
