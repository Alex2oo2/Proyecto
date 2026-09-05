import { Routes } from '@angular/router';
import { LoginComponent } from './components/login.component';
import { DashboardComponent } from './components/dashboard.component';
import { ChangePasswordComponent } from './components/change-password.component';
import { ForgotPasswordComponent } from './components/forgot-password.component';
import { UsersComponent } from './components/users.component';
import { RolesComponent } from './components/roles.component';
import { PermisosComponent } from './components/permisos.component';
import { ModulosComponent } from './components/modulos.component';
import { MenusComponent } from './components/menus.component';
import { OpcionesComponent } from './components/opciones.component';
import { CompaniesComponent } from './components/companies.component';
import { BranchesComponent } from './components/branches.component';
import { GeneroComponent } from './components/genero.component';
import { StatusUsuarioComponent } from './components/status-usuario.component';
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
      { path: 'status-usuarios', component: StatusUsuarioComponent },
      { path: 'usuarios', component: UsersComponent },
      { path: 'modulos', component: ModulosComponent },
      { path: 'menus', component: MenusComponent },
      { path: 'opciones', component: OpcionesComponent },
      { path: 'roles', component: RolesComponent },
      { path: 'permisos', component: PermisosComponent }
    ]
  },
  
  { path: '**', redirectTo: '/dashboard' }
];
