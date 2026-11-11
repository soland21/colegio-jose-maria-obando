
import { Routes } from '@angular/router';

import { Login } from './pages/login/login';
import { RecuperarPassword } from './pages/recuperar-password/recuperar-password';

import { Dashboard } from './pages/estudiante/dashboard/dashboard';
import { Dashboard as DashboardProfesor } from './pages/profesor/dashboard/dashboard';

import { MisMaterias } from './pages/profesor/mis-materias/mis-materias';
import { SeleccionarGrado } from './pages/profesor/seleccionar-grado/seleccionar-grado';

import { Calificaciones } from './pages/profesor/calificaciones/calificaciones';
import { Calendario } from './pages/profesor/calendario/calendario';

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
    component: Dashboard
  },

  {
    path: 'profesor/inicio',
    component: DashboardProfesor
  },

  {
    path: 'profesor/materias',
    component: MisMaterias
  },

  // NUEVA RUTA: SELECCIÓN DE GRADO

  {
    path: 'profesor/seleccionar-grado',
    component: SeleccionarGrado
  },

  {
    path: 'profesor/calificaciones',
    component: Calificaciones
  },

  {
    path: 'profesor/calendario',
    component: Calendario
  },

  {
    path: '**',
    redirectTo: ''
  }

];
