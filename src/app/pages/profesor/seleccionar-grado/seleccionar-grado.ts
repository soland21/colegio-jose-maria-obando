
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive} from '@angular/router';

interface Grado {
  nombre: string;
  numero: number;
  descripcion: string;
}

@Component({
  selector: 'app-seleccionar-grado',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './seleccionar-grado.html',
  styleUrl: './seleccionar-grado.css'
})
export class SeleccionarGrado {

  private router = inject(Router);

  nombreProfesor = 'Carlos Ramírez';

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

  seleccionarGrado(grado: Grado): void {

    // Guardar el grado seleccionado
    localStorage.setItem(
      'gradoSeleccionado',
      JSON.stringify(grado)
    );

    // Ir a Mis materias
    this.router.navigate(['/profesor/materias'], {
      queryParams: {
        grado: grado.numero
      }
    });

  }

  cerrarSesion(): void {
    localStorage.removeItem('usuarioActual');
    localStorage.removeItem('gradoSeleccionado');

    this.router.navigate(['/']);
  }

}
