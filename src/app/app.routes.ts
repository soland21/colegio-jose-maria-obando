import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { RecuperarPassword } from './pages/recuperar-password/recuperar-password';


export const routes: Routes = [{
path: '',
component: Login
},
{
    path:'recuperar-password',
    component: RecuperarPassword
},
{
    path: '**',
    redirectTo: ''
}

];
