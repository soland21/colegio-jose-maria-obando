
import { Routes } from '@angular/router';

import { Login } from './pages/login/login';
import { RecuperarPassword } from './pages/recuperar-password/recuperar-password';

import { Dashboard } from './pages/estudiante/dashboard/dashboard';
import { Dashboard as DashboardProfesor } from './pages/profesor/dashboard/dashboard';

import { MisMaterias } from './pages/profesor/mis-materias/mis-materias';
import { SeleccionarGrado } from './pages/profesor/seleccionar-grado/seleccionar-grado';

import { Calificaciones } from './pages/profesor/calificaciones/calificaciones';
import { Calendario } from './pages/profesor/calendario/calendario';
import { authGuard, roleGuard } from './core/auth/auth.guards';

export const routes: Routes = [

  {
    path: '',
    component: Login
  },

  {
    path: 'recuperar-password',
    component: RecuperarPassword
  },

  {
    path: 'estudiante/inicio',
    component: Dashboard,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['estudiante'] }
  },

  {
    path: 'profesor/inicio',
    component: DashboardProfesor,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['profesor'] }
  },

  {
    path: 'profesor/materias',
    component: MisMaterias,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['profesor'] }
  },

  {
    path: 'profesor/seleccionar-grado',
    component: SeleccionarGrado,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['profesor'] }
  },

  {
    path: 'profesor/calificaciones',
    component: Calificaciones,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['profesor'] }
  },

  {
    path: 'profesor/calendario',
    component: Calendario,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['profesor'] }
  },

  {
    path: '**',
    redirectTo: ''
  }

];
