
import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {

  private fb = inject(FormBuilder);

  formulario = this.fb.group({
    documento: ['', Validators.required],
    password: ['', Validators.required]
  });

  iniciarSesion() {

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    console.log('Datos del formulario:', this.formulario.value);

  }

}
