import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { Sucursal, Empresa } from '../models/index';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-branches',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './branches.component.html',
  styleUrls: ['./branches.component.css']
})
export class BranchesComponent implements OnInit, OnDestroy {
  sucursales: Sucursal[] = [];
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
      IdEmpresa: ['', [Validators.required]],
      Nombre: ['', [Validators.required, Validators.minLength(3)]],
      Descripcion: [''],
      Direccion: ['']
    });
  }

  ngOnInit(): void {
    this.loadEmpresas();
    this.loadSucursales();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadEmpresas(): void {
    this.apiService.getEmpresas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.empresas = data || [];
        },
        error: (err) => {
          console.error('Error al cargar empresas:', err);
        }
      });
  }

  loadSucursales(): void {
    this.isLoading = true;
    this.error = null;

    this.apiService.getSucursales()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.sucursales = data || [];
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
          this.error = 'Error al cargar las sucursales. Intenta nuevamente.';
          console.error('Error:', err);
        }
      });
  }

  getEmpresaNombre(idEmpresa: number | undefined): string {
    if (!idEmpresa) return '-';
    const empresa = this.empresas.find(e => e.IdEmpresa === idEmpresa);
    return empresa?.Nombre || '-';
  }

  openForm(sucursal?: Sucursal): void {
    this.showForm = true;
    this.success = null;
    this.error = null;

    if (sucursal) {
      this.editingId = sucursal.IdSucursal || null;
      this.form.patchValue(sucursal);
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
      this.apiService.actualizarSucursal(this.editingId, formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.isSubmitting = false;
            this.success = 'Sucursal actualizada exitosamente';
            this.closeForm();
            setTimeout(() => this.loadSucursales(), 500);
          },
          error: (err) => {
            this.isSubmitting = false;
            this.error = err.error?.mensaje || 'Error al actualizar la sucursal';
          }
        });
    } else {
      this.apiService.crearSucursal(formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.isSubmitting = false;
            this.success = 'Sucursal creada exitosamente';
            this.closeForm();
            setTimeout(() => this.loadSucursales(), 500);
          },
          error: (err) => {
            this.isSubmitting = false;
            this.error = err.error?.mensaje || 'Error al crear la sucursal';
          }
        });
    }
  }

  deleteSucursal(id: number | undefined): void {
    if (!id) return;

    if (!confirm('¿Estás seguro de que deseas eliminar esta sucursal?')) return;

    this.apiService.eliminarSucursal(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.success = 'Sucursal eliminada exitosamente';
          setTimeout(() => this.loadSucursales(), 500);
        },
        error: (err) => {
          this.error = err.error?.mensaje || 'Error al eliminar la sucursal';
        }
      });
  }
}
