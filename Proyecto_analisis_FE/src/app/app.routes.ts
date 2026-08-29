import { Routes } from '@angular/router';
import { LoginComponent } from './components/login.component';
import { DashboardComponent } from './components/dashboard.component';
import { CreateUserComponent } from './components/create-user.component';
import { ChangePasswordComponent } from './components/change-password.component';
import { ForgotPasswordComponent } from './components/forgot-password.component';
import { UsersComponent } from './components/users.component';
import { RolesComponent } from './components/roles.component';
import { ModulosComponent } from './components/modulos.component';
import { MenusComponent } from './components/menus.component';
import { OpcionesComponent } from './components/opciones.component';
import { CompaniesComponent } from './components/companies.component';
import { BranchesComponent } from './components/branches.component';
import { authGuard } from './services/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'create-user', component: CreateUserComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'change-password', component: ChangePasswordComponent, canActivate: [authGuard] },
  
  // Catalog Management
  { path: 'empresas', component: CompaniesComponent, canActivate: [authGuard] },
  { path: 'sucursales', component: BranchesComponent, canActivate: [authGuard] },
  
  // User Management
  { path: 'usuarios', component: UsersComponent, canActivate: [authGuard] },
  
  // Security Management
  { path: 'modulos', component: ModulosComponent, canActivate: [authGuard] },
  { path: 'menus', component: MenusComponent, canActivate: [authGuard] },
  { path: 'opciones', component: OpcionesComponent, canActivate: [authGuard] },
  { path: 'roles', component: RolesComponent, canActivate: [authGuard] },
  
  { path: '**', redirectTo: '/dashboard' }
];
