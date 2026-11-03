import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-recuperar-password',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './recuperar-password.html',
  styleUrl: './recuperar-password.css'
})
export class RecuperarPassword {

  private fb = inject(FormBuilder);

  formulario = this.fb.group({
    documento: ['', Validators.required]
  });

  mensaje = '';
  cargando = false;

  enviarSolicitud() {

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    // Más adelante conectaremos este método con Spring Boot.
    console.log('Documento ingresado:', this.formulario.value.documento);

    this.mensaje = 'Si el documento corresponde a una cuenta registrada, recibirás instrucciones en el correo asociado.';
  }

}