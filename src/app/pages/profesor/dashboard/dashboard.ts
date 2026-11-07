
import { Component } from '@angular/core';
import {
  ActivatedRoute,
  Router,
  RouterLink,
  RouterLinkActive
} from '@angular/router';

import {
  Entrega,
  EntregaService
} from '../../services/entrega.service';

// ==========================================
// 1. INTERFACES
// ==========================================

interface Tarea {
  id: number;
  titulo: string;
  asignatura: string;
  grado: string;
  fecha: string;
  pendientes: number;
  entregas: number;
}

interface Anuncio {
  id: number;
  titulo: string;
  mensaje: string;
  fecha: string;
}

// ==========================================
// 2. COMPONENTE
// ==========================================

@Component({
  selector: 'app-dashboard-profesor',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private entregaService: EntregaService
  ) {

    // ==========================================
    // RECUPERAR PROFESOR ACTUAL
    // ==========================================

    const usuarioGuardado = localStorage.getItem('usuarioActual');

    if (usuarioGuardado) {
      try {
        const usuario = JSON.parse(usuarioGuardado);

        this.nombreProfesor = usuario.nombre || 'Profesor';
        this.profesorDocumento = String(usuario.documento || '').trim();

      } catch (error) {
        console.error('Error al recuperar el usuario:', error);
      }
    }

    // ==========================================
    // COMPROBAR ASIGNACIONES DEL PROFESOR
    // ==========================================

    console.log('========== DATOS DEL PROFESOR ==========');

    console.log('Nombre:', this.nombreProfesor);

    console.log('Documento:', this.profesorDocumento);

    console.log(
      'Asignaciones encontradas:',
      this.entregaService.asignacionesDocentes.filter(
        a => a.documentoProfesor.trim() === this.profesorDocumento
      )
    );

    console.log('Materias asignadas:', this.materias);

    console.log('========================================');

    // ==========================================
    // RECUPERAR MATERIA DE LA URL
    // ==========================================

    this.route.queryParamMap.subscribe(params => {

      const materiaUrl = params.get('materia') || '';

      const materiaValida = this.materias.find(
        materia =>
          this.normalizarTexto(materia) ===
          this.normalizarTexto(materiaUrl)
      );

      this.materiaSeleccionada = materiaValida || '';

    });

    // ==========================================
    // ESCUCHAR CAMBIOS EN LAS ENTREGAS
    // ==========================================

    this.entregaService.entregas$.subscribe(() => {

      console.log('Se actualizaron las entregas del profesor.');

    });

  }

  // ==========================================
  // 3. INFORMACIÓN DEL PROFESOR
  // ==========================================

  nombreProfesor = 'Profesor';

  profesorDocumento = '';

  // ==========================================
  // 4. NORMALIZAR TEXTOS
  // ==========================================

  private normalizarTexto(texto: string): string {

    return (texto || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();

  }

  // ==========================================
  // 5. MATERIAS ASIGNADAS AL PROFESOR
  // ==========================================

  get materias(): string[] {

    if (!this.profesorDocumento) {
      return [];
    }

    const materiasProfesor =
      this.entregaService.asignacionesDocentes

        .filter(asignacion =>
          asignacion.documentoProfesor.trim() ===
          this.profesorDocumento
        )

        .map(asignacion => asignacion.asignatura.trim());

    // Eliminar materias repetidas.

    return [...new Set(materiasProfesor)];

  }

  materiaSeleccionada = '';

  mostrarMaterias = false;

  alternarMaterias(): void {

    this.mostrarMaterias = !this.mostrarMaterias;

  }

  // ==========================================
  // 6. SELECCIONAR MATERIA
  // ==========================================

  seleccionarMateria(materia: string): void {

    const materiaPermitida = this.materias.find(
      m =>
        this.normalizarTexto(m) ===
        this.normalizarTexto(materia)
    );

    if (!materiaPermitida) {

      console.warn('Materia no asignada al profesor:', materia);

      return;

    }

    this.materiaSeleccionada = materiaPermitida;

    this.mostrarMaterias = false;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        materia: materiaPermitida
      },
      queryParamsHandling: 'merge'
    });

  }

  // ==========================================
  // 7. DATOS GENERALES
  // ==========================================

  totalEstudiantes = 28;

  // ==========================================
  // 8. TAREAS DE PRUEBA
  // ==========================================

  private tareasTodas: Tarea[] = [

    {
      id: 1,
      titulo: 'Taller de matemáticas',
      asignatura: 'Matemáticas',
      grado: 'Noveno',
      fecha: '15 de noviembre',
      pendientes: 28,
      entregas: 0
    },

    {
      id: 2,
      titulo: 'Trabajo sobre los ecosistemas',
      asignatura: 'Biología',
      grado: 'Octavo',
      fecha: '20 de noviembre',
      pendientes: 28,
      entregas: 0
    },

    {
      id: 3,
      titulo: 'Actividad de lectura',
      asignatura: 'Español',
      grado: 'Sexto',
      fecha: '18 de noviembre',
      pendientes: 28,
      entregas: 0
    },

    {
      id: 4,
      titulo: 'Ejercicios de matemáticas',
      asignatura: 'Matemáticas',
      grado: 'Séptimo',
      fecha: '22 de noviembre',
      pendientes: 28,
      entregas: 0
    },

    {
      id: 5,
      titulo: 'Comprensión lectora',
      asignatura: 'Español',
      grado: 'Noveno',
      fecha: '25 de noviembre',
      pendientes: 28,
      entregas: 0
    }

  ];

  // ==========================================
  // 9. FILTRAR TAREAS DEL PROFESOR
  // ==========================================

  get tareas(): Tarea[] {

    return this.tareasTodas

      // Comprobar profesor asignado al grado y materia.

      .filter(tarea => {

        const profesorAsignado =
          this.entregaService.obtenerProfesorAsignado(
            tarea.grado,
            tarea.asignatura
          );

        return profesorAsignado === this.profesorDocumento;

      })

      // Filtrar materia seleccionada.

      .filter(tarea => {

        if (!this.materiaSeleccionada) {
          return true;
        }

        return this.normalizarTexto(tarea.asignatura) ===
          this.normalizarTexto(this.materiaSeleccionada);

      })

      // Calcular entregas y pendientes.

      .map(tarea => {

        const entregasTarea = this.obtenerEntregasDeTarea(tarea);

        return {
          ...tarea,
          entregas: entregasTarea.length,
          pendientes: Math.max(
            0,
            this.totalEstudiantes - entregasTarea.length
          )
        };

      });

  }

  // ==========================================
  // 10. CONTADORES
  // ==========================================

  get tareasPublicadas(): number {

    return this.tareas.length;

  }

  get entregasPorRevisar(): number {

    return this.entregasRecibidas.filter(
      entrega => entrega.estado === 'Pendiente de revisión'
    ).length;

  }

  // ==========================================
  // 11. ENTREGAS RECIBIDAS DEL PROFESOR
  // ==========================================

  get entregasRecibidas(): Entrega[] {

    if (!this.profesorDocumento) {
      return [];
    }

    return this.entregaService

      .obtenerEntregasProfesor(this.profesorDocumento)

      .filter(entrega => {

        if (!this.materiaSeleccionada) {
          return true;
        }

        return this.normalizarTexto(entrega.asignatura) ===
          this.normalizarTexto(this.materiaSeleccionada);

      });

  }

  // ==========================================
  // 12. OBTENER ENTREGAS DE UNA TAREA
  // ==========================================

  obtenerEntregasDeTarea(tarea: Tarea): Entrega[] {

    return this.entregaService

      .obtenerEntregasProfesor(this.profesorDocumento)

      .filter(entrega =>

        this.normalizarTexto(entrega.titulo) ===
          this.normalizarTexto(tarea.titulo) &&

        this.normalizarTexto(entrega.asignatura) ===
          this.normalizarTexto(tarea.asignatura) &&

        this.normalizarTexto(entrega.grado) ===
          this.normalizarTexto(tarea.grado)

      );

  }

  // ==========================================
  // 13. ABRIR DOCUMENTO PDF
  // ==========================================

  abrirArchivo(entrega: Entrega): void {

    const archivo = this.entregaService.obtenerArchivo(entrega.id);

    if (!archivo) {

      alert(
        'El archivo ya no está disponible en memoria. ' +
        'El estudiante debe volver a cargarlo.'
      );

      return;

    }

    const url = URL.createObjectURL(archivo);

    window.open(url, '_blank');

  }

  // ==========================================
  // 14. MARCAR ENTREGA COMO REVISADA
  // ==========================================

  marcarComoRevisada(entrega: Entrega): void {

    this.entregaService.marcarRevisada(entrega.id);

  }

  // ==========================================
  // 15. CONTROL DE INTERFAZ
  // ==========================================

  mostrarFormularioAnuncio = false;

  mostrarMasOpciones = false;

  alternarOpciones(): void {

    this.mostrarMasOpciones = !this.mostrarMasOpciones;

  }

  // ==========================================
  // 16. ANUNCIOS
  // ==========================================

  anuncios: Anuncio[] = [

    {
      id: 1,
      titulo: 'Recordatorio de actividades',
      mensaje: 'Recuerda revisar las actividades pendientes de esta semana.',
      fecha: 'Hoy'
    },

    {
      id: 2,
      titulo: 'Información de clase',
      mensaje: 'Se recuerda a los estudiantes revisar las indicaciones de la próxima clase.',
      fecha: 'Ayer'
    }

  ];

  abrirFormularioAnuncio(): void {

    this.mostrarFormularioAnuncio = true;

  }

  cancelarAnuncio(): void {

    this.mostrarFormularioAnuncio = false;

  }

  // ==========================================
  // 17. CREAR ANUNCIO
  // ==========================================

  crearAnuncio(titulo: string, mensaje: string): void {

    const tituloLimpio = titulo.trim();

    const mensajeLimpio = mensaje.trim();

    if (!tituloLimpio || !mensajeLimpio) {
      return;
    }

    const nuevoAnuncio: Anuncio = {

      id: this.generarIdAnuncio(),

      titulo: tituloLimpio,

      mensaje: mensajeLimpio,

      fecha: 'Ahora'

    };

    this.anuncios.unshift(nuevoAnuncio);

    this.cancelarAnuncio();

  }

  // ==========================================
  // 18. GENERAR ID DE ANUNCIO
  // ==========================================

  private generarIdAnuncio(): number {

    if (this.anuncios.length === 0) {
      return 1;
    }

    const ultimoId = Math.max(
      ...this.anuncios.map(anuncio => anuncio.id)
    );

    return ultimoId + 1;

  }

  // ==========================================
  // 19. CERRAR SESIÓN
  // ==========================================

  cerrarSesion(): void {

    localStorage.removeItem('usuarioActual');

    this.router.navigate(['/']);

  }

}
