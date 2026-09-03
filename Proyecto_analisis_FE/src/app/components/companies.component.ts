import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { Empresa } from '../models/index';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-companies',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './companies.component.html',
  styleUrls: ['./companies.component.css']
})
export class CompaniesComponent implements OnInit, OnDestroy {
  empresas: Empresa[] = [];
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
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      Nombre: ['', [Validators.required, Validators.minLength(3)]],
      Nit: ['', [Validators.required, Validators.maxLength(20)]],
      Descripcion: [''],
      Direccion: [''],
      Telefono: [''],
      CorreoElectronico: ['', Validators.email]
    });
  }

  ngOnInit(): void {
    this.loadEmpresas();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadEmpresas(): void {
    this.isLoading = true;
    this.error = null;

    this.apiService.getEmpresas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.empresas = data || [];
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
          this.error = 'Error al cargar las empresas. Intenta nuevamente.';
          console.error('Error:', err);
        }
      });
  }

  openForm(empresa?: Empresa): void {
    this.showForm = true;
    this.success = null;
    this.error = null;

    if (empresa) {
      this.editingId = empresa.IdEmpresa || null;
      this.form.patchValue(empresa);
    } else {
      this.editingId = null;
      this.form.reset();
    }
  }

  closeForm(): void {
    this.showForm = false;
    this.editingId = null;
    this.form.reset();
  }

  onSubmit(): void {
    if (!this.form.valid) return;

    this.isSubmitting = true;
    this.error = null;
    this.success = null;

    const formData = this.form.value;

    if (this.editingId) {
      this.apiService.actualizarEmpresa(this.editingId, formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.isSubmitting = false;
            this.success = 'Empresa actualizada exitosamente';
            this.closeForm();
            setTimeout(() => this.loadEmpresas(), 500);
          },
          error: (err) => {
            this.isSubmitting = false;
            this.error = err.error?.mensaje || 'Error al actualizar la empresa';
          }
        });
    } else {
      this.apiService.crearEmpresa(formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.isSubmitting = false;
            this.success = 'Empresa creada exitosamente';
            this.closeForm();
            setTimeout(() => this.loadEmpresas(), 500);
          },
          error: (err) => {
            this.isSubmitting = false;
            this.error = err.error?.mensaje || 'Error al crear la empresa';
          }
        });
    }
  }

  deleteEmpresa(id: number | undefined): void {
    if (!id) return;

    if (!confirm('¿Estás seguro de que deseas eliminar esta empresa?')) return;

    this.apiService.eliminarEmpresa(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.success = 'Empresa eliminada exitosamente';
          setTimeout(() => this.loadEmpresas(), 500);
        },
        error: (err) => {
          this.error = err.error?.mensaje || 'Error al eliminar la empresa';
        }
      });
  }
}
