
import { Component } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  ActivatedRoute
} from '@angular/router';

import { EntregaService } from '../../services/entrega.service';

// ==========================================
// INTERFACES
// ==========================================

interface Materia {
  nombre: string;
  descripcion: string;
  icono: string;
  estudiantes: number;
  tareasPublicadas: number;
  promedio: number;
}

interface Anuncio {
  id: number;
  titulo: string;
  mensaje: string;
  asignatura: string;
  fecha: string;
}

interface Calificacion {
  id: number;
  estudiante: string;
  asignatura: string;
  nota: number;
}

interface Estudiante {
  id: number;
  nombre: string;
  grado: string;
}

// ==========================================
// COMPONENTE
// ==========================================

@Component({
  selector: 'app-mis-materias',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    DecimalPipe
  ],
  templateUrl: './mis-materias.html',
  styleUrl: './mis-materias.css'
})

export class MisMaterias {

  // ==========================================
  // INFORMACIÓN DEL PROFESOR
  // ==========================================

  nombreProfesor = 'Profesor';
  documentoProfesor = '';

  // ==========================================
  // GRADO SELECCIONADO
  // ==========================================

  gradoSeleccionado = '';
  gradoNumero = 0;

  // ==========================================
  // MATERIA SELECCIONADA
  // ==========================================

  materiaSeleccionada = '';

  // ==========================================
  // CONTROL DE INTERFACES
  // ==========================================

  mostrarMaterias = false;
  mostrarMasOpciones = false;

  alternarOpciones(): void {
    this.mostrarMasOpciones = !this.mostrarMasOpciones;
  }

  alternarMaterias(): void {
    this.mostrarMaterias = !this.mostrarMaterias;
  }

  // ==========================================
  // CONFIGURACIÓN DE MATERIAS
  // ==========================================

  private configuracionMaterias: Record<string, {
    icono: string;
    tareasPublicadas: number;
    promedio: number;
  }> = {
    'Matemáticas': {
      icono: '∑',
      tareasPublicadas: 4,
      promedio: 4.2
    },
    'Español': {
      icono: 'Aa',
      tareasPublicadas: 3,
      promedio: 4.5
    },
    'Biología': {
      icono: '♧',
      tareasPublicadas: 2,
      promedio: 4.0
    },
    'Estadística': {
      icono: '％',
      tareasPublicadas: 3,
      promedio: 3.9
    },
    'Religión': {
      icono: '✧',
      tareasPublicadas: 0,
      promedio: 0
    },
    'Ética': {
      icono: '◇',
      tareasPublicadas: 0,
      promedio: 0
    },
    'Cátedra de paz': {
      icono: '☮',
      tareasPublicadas: 0,
      promedio: 0
    },
    'Sociales': {
      icono: '◎',
      tareasPublicadas: 0,
      promedio: 0
    },
    'Artística': {
      icono: '✎',
      tareasPublicadas: 0,
      promedio: 0
    },
    'Lectoescritura': {
      icono: 'Aa',
      tareasPublicadas: 0,
      promedio: 0
    },
    'Historia': {
      icono: '⌛',
      tareasPublicadas: 0,
      promedio: 0
    },
    'Geografía': {
      icono: '🌎',
      tareasPublicadas: 0,
      promedio: 0
    }
  };

  // ==========================================
  // MATERIAS ASIGNADAS AL PROFESOR
  // ==========================================

  get materias(): Materia[] {

    // Si no hay profesor o grado seleccionado,
    // no se muestran materias.
    if (!this.documentoProfesor || !this.gradoSeleccionado) {
      return [];
    }

    // Consultar las asignaciones del profesor
    const asignaciones = this.entregaService.asignacionesDocentes;

    const materiasAsignadas = asignaciones
      .filter(asignacion =>
        String(asignacion.documentoProfesor).trim() ===
          this.documentoProfesor.trim() &&
        this.normalizarTexto(asignacion.grado) ===
          this.normalizarTexto(this.gradoSeleccionado)
      )
      .map(asignacion => asignacion.asignatura.trim());

    // Eliminar materias repetidas
    const materiasUnicas = [...new Set(materiasAsignadas)];

    // Construir las tarjetas de las materias
    return materiasUnicas.map(nombre => {

      const configuracion = this.configuracionMaterias[nombre];

      return {
        nombre,
        descripcion: 'Gestiona notas, actividades y asistencia.',
        icono: configuracion?.icono || '📚',
        estudiantes: 28,
        tareasPublicadas: configuracion?.tareasPublicadas || 0,
        promedio: configuracion?.promedio || 0
      };

    });

  }

  // ==========================================
  // NORMALIZAR TEXTO
  // ==========================================

  private normalizarTexto(texto: string): string {

    return texto
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  }

  // ==========================================
  // RESUMEN GENERAL
  // ==========================================

  get totalMaterias(): number {
    return this.materias.length;
  }

  get totalEstudiantes(): number {
    return this.estudiantes.length;
  }

  get totalTareas(): number {

    return this.materias.reduce(
      (total, materia) => total + materia.tareasPublicadas,
      0
    );

  }

  get promedioGeneral(): number {

    if (this.materias.length === 0) {
      return 0;
    }

    const suma = this.materias.reduce(
      (total, materia) => total + materia.promedio,
      0
    );

    return Number((suma / this.materias.length).toFixed(2));

  }

  // ==========================================
  // ENTREGAS PENDIENTES
  // ==========================================

  entregasPorRevisar = 7;

  // ==========================================
  // ANUNCIOS
  // ==========================================

  anuncios: Anuncio[] = [
    {
      id: 1,
      titulo: 'Taller de operaciones',
      mensaje: 'Recuerden desarrollar los ejercicios de la actividad asignada.',
      asignatura: 'Matemáticas',
      fecha: 'Hoy'
    },
    {
      id: 2,
      titulo: 'Actividad de lectura',
      mensaje: 'Realizar la lectura y responder las preguntas del documento.',
      asignatura: 'Español',
      fecha: 'Ayer'
    },
    {
      id: 3,
      titulo: 'Trabajo sobre ecosistemas',
      mensaje: 'Consultar los diferentes tipos de ecosistemas.',
      asignatura: 'Biología',
      fecha: 'Hace 2 días'
    },
    {
      id: 4,
      titulo: 'Ejercicios estadísticos',
      mensaje: 'Resolver los ejercicios sobre medidas de tendencia central.',
      asignatura: 'Estadística',
      fecha: 'Hace 3 días'
    }
  ];

  // ==========================================
  // CALIFICACIONES RECIENTES
  // ==========================================

  calificacionesRecientes: Calificacion[] = [
    {
      id: 1,
      estudiante: 'Nicolás Rodríguez',
      asignatura: 'Matemáticas',
      nota: 4.5
    },
    {
      id: 2,
      estudiante: 'Laura Martínez',
      asignatura: 'Español',
      nota: 4.8
    },
    {
      id: 3,
      estudiante: 'Daniel Gómez',
      asignatura: 'Biología',
      nota: 3.9
    },
    {
      id: 4,
      estudiante: 'María López',
      asignatura: 'Estadística',
      nota: 4.2
    }
  ];

  // ==========================================
  // ESTUDIANTES DEL CURSO
  // ==========================================

  estudiantes: Estudiante[] = [
    { id: 1, nombre: 'Nicolás Rodríguez', grado: 'Noveno' },
    { id: 2, nombre: 'Laura Martínez', grado: 'Noveno' },
    { id: 3, nombre: 'Daniel Gómez', grado: 'Noveno' },
    { id: 4, nombre: 'Alex Jimenez', grado: 'Noveno' },
    { id: 5, nombre: 'María Sanchez', grado: 'Noveno' },
    { id: 6, nombre: 'María Narvaez', grado: 'Noveno' },
    { id: 7, nombre: 'Luis Narvaez', grado: 'Noveno' },
    { id: 8, nombre: 'Jesus Ruiz', grado: 'Noveno' },
    { id: 9, nombre: 'Sofia Sanchez', grado: 'Noveno' },
    { id: 10, nombre: 'Santiago Pérez', grado: 'Noveno' }
  ];

  // ==========================================
  // CONSTRUCTOR
  // ==========================================

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private entregaService: EntregaService
  ) {

    // Recuperar información del profesor
    const usuarioGuardado = localStorage.getItem('usuarioActual');

    if (usuarioGuardado) {

      try {

        const usuario = JSON.parse(usuarioGuardado);

        this.nombreProfesor = usuario.nombre || 'Profesor';

        this.documentoProfesor = String(
          usuario.documento ?? ''
        ).trim();

      } catch {

        localStorage.removeItem('usuarioActual');

      }

    }

    // Recuperar grado seleccionado
    this.route.queryParams.subscribe(params => {

      let numeroGrado = Number(params['grado']);

      if (!numeroGrado) {

        const gradoGuardado = localStorage.getItem('gradoSeleccionado');

        if (gradoGuardado) {

          try {

            const grado = JSON.parse(gradoGuardado);

            numeroGrado = Number(grado.numero);

          } catch {

            localStorage.removeItem('gradoSeleccionado');

          }

        }

      }

      // Validar grado
      if (numeroGrado >= 6 && numeroGrado <= 11) {

        this.gradoNumero = numeroGrado;

        this.gradoSeleccionado =
          this.obtenerNombreGrado(numeroGrado);

        // Mostrar información para verificar las asignaciones
        console.log('========== MIS MATERIAS ==========');
        console.log('Profesor:', this.nombreProfesor);
        console.log('Documento:', this.documentoProfesor);
        console.log('Grado seleccionado:', this.gradoSeleccionado);
        console.log('Materias asignadas:', this.materias);
        console.log('==================================');

      } else {

        this.gradoNumero = 0;
        this.gradoSeleccionado = '';

        this.router.navigate(['/profesor/inicio']);

      }

    });

  }

  // ==========================================
  // OBTENER NOMBRE DEL GRADO
  // ==========================================

  obtenerNombreGrado(numero: number): string {

    const nombres: Record<number, string> = {
      6: 'Sexto',
      7: 'Séptimo',
      8: 'Octavo',
      9: 'Noveno',
      10: 'Décimo',
      11: 'Undécimo'
    };

    return nombres[numero] || '';

  }

  // ==========================================
  // SELECCIONAR MATERIA
  // ==========================================

  seleccionarMateria(nombreMateria: string): void {

    this.mostrarMaterias = false;
    this.mostrarMasOpciones = false;

    this.materiaSeleccionada = nombreMateria;

    localStorage.setItem('materiaSeleccionada', nombreMateria);

    localStorage.setItem(
      'gradoSeleccionado',
      JSON.stringify({
        numero: this.gradoNumero,
        nombre: this.gradoSeleccionado
      })
    );

    this.router.navigate(['/profesor/inicio'], {

      queryParams: {
        grado: this.gradoNumero,
        materia: nombreMateria
      }

    });

  }

  // ==========================================
  // CONSULTAR ANUNCIOS POR MATERIA
  // ==========================================

  obtenerAnunciosPorMateria(nombreMateria: string): Anuncio[] {

    return this.anuncios.filter(
      anuncio => anuncio.asignatura === nombreMateria
    );

  }

  // ==========================================
  // CONSULTAR CALIFICACIONES POR MATERIA
  // ==========================================

  obtenerCalificacionesPorMateria(
    nombreMateria: string
  ): Calificacion[] {

    return this.calificacionesRecientes.filter(
      calificacion => calificacion.asignatura === nombreMateria
    );

  }

  // ==========================================
  // CERRAR SESIÓN
  // ==========================================

  cerrarSesion(): void {

    localStorage.removeItem('usuarioActual');
    localStorage.removeItem('gradoSeleccionado');
    localStorage.removeItem('materiaSeleccionada');

    this.router.navigate(['/']);

  }

}
