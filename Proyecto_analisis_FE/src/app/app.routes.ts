import { Routes } from '@angular/router';
import { LoginComponent } from './components/login.component';
import { DashboardComponent } from './components/dashboard.component';
import { ChangePasswordComponent } from './components/change-password.component';
import { ForgotPasswordComponent } from './components/forgot-password.component';
import { UsersComponent } from './components/users.component';
import { RolesComponent } from './components/roles.component';
import { ModulosComponent } from './components/modulos.component';
import { MenusComponent } from './components/menus.component';
import { OpcionesComponent } from './components/opciones.component';
import { CompaniesComponent } from './components/companies.component';
import { BranchesComponent } from './components/branches.component';
import { GeneroComponent } from './components/genero.component';
import { StatusUsuarioComponent } from './components/status-usuario.component';
import { AsignacionOpcionesComponent } from './components/asignacion-opciones.component';
import { PaginaGenericaComponent } from './components/pagina-generica.component';
import { authGuard } from './services/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  
  // Dashboard with child routes - navbar and sidebar persist
  { 
    path: 'dashboard', 
    component: DashboardComponent,
    canActivate: [authGuard],
    children: [
      { path: '', component: ModulosComponent },
      { path: 'change-password', component: ChangePasswordComponent },
      { path: 'empresas', component: CompaniesComponent },
      { path: 'sucursales', component: BranchesComponent },
      { path: 'genero', component: GeneroComponent },
      { path: 'estatus-usuario', component: StatusUsuarioComponent },
      { path: 'asignacion-opciones', component: AsignacionOpcionesComponent },
      { path: 'opcion/:id', component: PaginaGenericaComponent },
      { path: 'usuarios', component: UsersComponent },
      { path: 'modulos', component: ModulosComponent },
      { path: 'menus', component: MenusComponent },
      { path: 'opciones', component: OpcionesComponent },
      { path: 'roles', component: RolesComponent },
      {
        path: 'estados-civiles',
        loadComponent: () => import('./components/planilla/estado-civil.component').then(m => m.EstadoCivilComponent)
      },
      {
        path: 'status-empleado',
        loadComponent: () => import('./components/planilla/status-empleado.component').then(m => m.StatusEmpleadoComponent)
      },
      {
        path: 'flujos-status-empleado',
        loadComponent: () => import('./components/planilla/flujo-status-empleado.component').then(m => m.FlujoStatusEmpleadoComponent)
      },
      {
        path: 'tipos-documento',
        loadComponent: () => import('./components/planilla/tipo-documento.component').then(m => m.TipoDocumentoComponent)
      },
      {
        path: 'departamentos',
        loadComponent: () => import('./components/planilla/departamento.component').then(m => m.DepartamentoComponent)
      },
      {
        path: 'puestos',
        loadComponent: () => import('./components/planilla/puesto.component').then(m => m.PuestoComponent)
      },
      {
        path: 'personas',
        loadComponent: () => import('./components/planilla/persona.component').then(m => m.PersonaComponent)
      },
      {
        path: 'documentos-persona',
        loadComponent: () => import('./components/planilla/documento-persona.component').then(m => m.DocumentoPersonaComponent)
      },
      {
        path: 'bancos',
        loadComponent: () => import('./components/planilla/banco.component').then(m => m.BancoComponent)
      },
      {
        path: 'empleados',
        loadComponent: () => import('./components/planilla/empleado.component').then(m => m.EmpleadoComponent)
      },
      {
        path: 'cuentas-bancarias',
        loadComponent: () => import('./components/planilla/cuenta-bancaria-empleado.component').then(m => m.CuentaBancariaEmpleadoComponent)
      },
      {
        path: 'inasistencias',
        loadComponent: () => import('./components/planilla/inasistencia.component').then(m => m.InasistenciaComponent)
      },
      {
        path: 'calcular-planilla',
        loadComponent: () => import('./components/planilla/calculo-planilla.component').then(m => m.CalculoPlanillaComponent)
      },
      {
        path: 'reporte-planilla',
        loadComponent: () => import('./components/planilla/reporte-planilla.component').then(m => m.ReportePlanillaComponent)
      },
      {
        path: 'boletas-pago',
        loadComponent: () => import('./components/planilla/boleta-pago.component').then(m => m.BoletaPagoComponent)
      },
      {
        path: 'liquidacion',
        loadComponent: () => import('./components/planilla/liquidacion.component').then(m => m.LiquidacionComponent)
      }
    ]
  },
  
  { path: '**', redirectTo: '/dashboard' }
];
