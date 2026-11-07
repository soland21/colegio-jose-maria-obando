
import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

interface Usuario {
  documento: string;
  password: string;
  nombre: string;
  rol: 'profesor' | 'estudiante';
  grado?:string;
}

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {

  private fb = inject(FormBuilder);
  private router = inject(Router);

  // =====================================
  // USUARIOS DE PRUEBA
  // =====================================

  usuarios: Usuario[] = [

    // PROFESORES
    {
      documento: '1234567890',
      password: '123456',
      nombre: 'Carlos Ramírez',
      rol: 'profesor'
    },
    {
      documento: '1020304050',
      password: '654321',
      nombre: 'María Fernanda López',
      rol: 'profesor'
    },

    // ESTUDIANTES
    {
      documento: '9876543210',
      password: '123456',
      nombre: 'Nicolás Gómez',
      rol: 'estudiante',
      grado: 'noveno'
    },
    {
      documento: '5060708090',
      password: '654321',
      nombre: 'Laura Martínez',
      rol: 'estudiante',
      grado:'sexto'
    }

  ];

  // =====================================
  // FORMULARIO
  // =====================================

  formulario = this.fb.group({
    documento: ['', Validators.required],
    password: ['', Validators.required]
  });

  mensajeError = '';
  usuarioEncontrado: Usuario | null = null;

  // =====================================
  // IDENTIFICAR TIPO DE USUARIO
  // =====================================

  identificarUsuario(): void {

    const documento =
      this.formulario.get('documento')?.value?.trim() || '';

    this.usuarioEncontrado = this.usuarios.find(
      usuario => usuario.documento === documento
    ) || null;

    this.mensajeError = '';

  }

  // =====================================
  // INICIAR SESIÓN
  // =====================================

  iniciarSesion(): void {

    this.mensajeError = '';

    // Validar campos obligatorios
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const documento =
      this.formulario.value.documento?.trim();

    const password =
      this.formulario.value.password;

    // Buscar usuario y validar contraseña
    const usuario = this.usuarios.find(
      usuario =>
        usuario.documento === documento &&
        usuario.password === password
    );

    // Si las credenciales son incorrectas
    if (!usuario) {

      this.usuarioEncontrado = null;

      this.mensajeError =
        'Documento o contraseña incorrectos.';

      return;
    }

    // =====================================
    // GUARDAR USUARIO ACTUAL
    // =====================================

    localStorage.setItem(
      'usuarioActual',
      JSON.stringify({
        documento: usuario.documento,
        nombre: usuario.nombre,
        rol: usuario.rol,
        grado: usuario.grado || null
      })
    );

    // =====================================
    // REDIRECCIONAR SEGÚN EL ROL
    // =====================================

    if (usuario.rol === 'profesor') {

      this.router.navigate(['/profesor/seleccionar-grado']);

    } else {

      this.router.navigate(['/estudiante/inicio']);

    }

  }

}
