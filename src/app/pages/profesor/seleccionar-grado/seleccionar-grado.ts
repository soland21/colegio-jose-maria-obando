
import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

interface Grado {
  nombre: string;
  numero: number;
  descripcion: string;
}

interface UsuarioActual {
  documento: string;
  nombre: string;
  rol: 'profesor' | 'estudiante';
}

@Component({
  selector: 'app-seleccionar-grado',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './seleccionar-grado.html',
  styleUrl: './seleccionar-grado.css'
})
export class SeleccionarGrado implements OnInit {

  private router = inject(Router);

  nombreProfesor = '';
  profesorDocumento = '';

  ngOnInit(): void {
    this.cargarProfesor();
  }

  // =====================================
  // RECUPERAR EL PROFESOR AUTENTICADO
  // =====================================

  cargarProfesor(): void {

    const usuarioGuardado = localStorage.getItem('usuarioActual');

    if (!usuarioGuardado) {
      this.router.navigate(['/']);
      return;
    }

    try {

      const usuario: UsuarioActual = JSON.parse(usuarioGuardado);

      if (usuario.rol !== 'profesor') {
        this.router.navigate(['/']);
        return;
      }

      this.nombreProfesor = usuario.nombre;
      this.profesorDocumento = String(usuario.documento);

    } catch (error) {

      console.error('Error al recuperar el usuario:', error);
      this.router.navigate(['/']);

    }
  }

  // =====================================
  // GRADOS DISPONIBLES
  // =====================================

  grados: Grado[] = [
    {
      nombre: 'Sexto',
      numero: 6,
      descripcion: 'Seleccionar grado sexto'
    },
    {
      nombre: 'Séptimo',
      numero: 7,
      descripcion: 'Seleccionar grado séptimo'
    },
    {
      nombre: 'Octavo',
      numero: 8,
      descripcion: 'Seleccionar grado octavo'
    },
    {
      nombre: 'Noveno',
      numero: 9,
      descripcion: 'Seleccionar grado noveno'
    },
    {
      nombre: 'Décimo',
      numero: 10,
      descripcion: 'Seleccionar grado décimo'
    },
    {
      nombre: 'Undécimo',
      numero: 11,
      descripcion: 'Seleccionar grado undécimo'
    }
  ];

  // =====================================
  // SELECCIONAR GRADO
  // =====================================

  seleccionarGrado(grado: Grado): void {

    // Guardar únicamente el grado seleccionado.
    // No modificar usuarioActual.

    localStorage.setItem(
      'gradoSeleccionado',
      JSON.stringify(grado)
    );

    this.router.navigate(['/profesor/materias'], {
      queryParams: {
        grado: grado.numero
      }
    });

  }

  // =====================================
  // CERRAR SESIÓN
  // =====================================

  cerrarSesion(): void {

    localStorage.removeItem('usuarioActual');
    localStorage.removeItem('gradoSeleccionado');

    this.router.navigate(['/']);

  }

}
