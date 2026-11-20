
import { Component, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  FormBuilder,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

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
  private auth = inject(AuthService);

  formulario = this.fb.group({
    documento: ['', Validators.required],
    password: ['', Validators.required]
  });

  mensajeError = '';
  cargando = false;


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

    if (!documento || !password) return;
    this.cargando = true;
    this.auth.login({ documento, password }).subscribe({
      next: ({ usuario }) => {
        this.cargando = false;
        this.router.navigate([usuario.rol === 'profesor' ? '/profesor/seleccionar-grado' : '/estudiante/inicio']);
      },
      error: (error: HttpErrorResponse) => {
        this.cargando = false;
        this.mensajeError = error.status === 0
          ? 'No fue posible conectar con el servidor. Intenta de nuevo.'
          : error.error?.message || 'Documento o contraseña incorrectos.';
      }
    });
  }

}
