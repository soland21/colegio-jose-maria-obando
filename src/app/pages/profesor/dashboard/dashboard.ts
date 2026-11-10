
import { Component } from '@angular/core';

import {
  ActivatedRoute,
  Router,
  RouterLink,
  RouterLinkActive
} from '@angular/router';

import {
  Entrega,
  EntregaService,
  TareaPublicada
} from '../../services/entrega.service';

// ==========================================
// 1. INTERFACES
// ==========================================

interface Tarea {
  id: string;
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
  imports: [
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public entregaService: EntregaService
  ) {

    // ==========================================
    // RECUPERAR PROFESOR ACTUAL
    // ==========================================

    const usuarioGuardado = localStorage.getItem('usuarioActual');

    if (usuarioGuardado) {

      try {

        const usuario = JSON.parse(usuarioGuardado);

        this.nombreProfesor = usuario.nombre || 'Profesor';

        this.profesorDocumento = usuario.documento || '';

      } catch (error) {

        console.error('Error al recuperar el profesor:', error);

      }

    }

    console.log('Profesor actual:', this.nombreProfesor);
    console.log('Documento:', this.profesorDocumento);

    // ==========================================
    // ESCUCHAR MATERIA SELECCIONADA
    // ==========================================

    this.route.queryParamMap.subscribe(params => {

      this.materiaSeleccionada = params.get('materia') || '';

    });

    // ==========================================
    // ESCUCHAR CAMBIOS EN LAS ENTREGAS
    // ==========================================

    this.entregaService.entregas$.subscribe(entregas => {

      console.log('Entregas actualizadas:', entregas);

    });

    // ==========================================
    // ESCUCHAR CAMBIOS EN LAS TAREAS
    // ==========================================

    this.entregaService.tareas$.subscribe(tareas => {

      this.tareasCambio = tareas;

    });

  }

  // ==========================================
  // 3. DATOS DEL PROFESOR
  // ==========================================

  nombreProfesor = 'Profesor';

  profesorDocumento = '';

  // ==========================================
  // 4. NORMALIZAR TEXTO
  // ==========================================

  normalizarTexto(texto: string): string {

    return String(texto || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  }

  // ==========================================
  // 5. MATERIAS ASIGNADAS AL PROFESOR
  // ==========================================

  get materias(): string[] {

    return this.entregaService.asignacionesDocentes

      .filter(asignacion =>
        asignacion.documentoProfesor === this.profesorDocumento
      )

      .map(asignacion => asignacion.asignatura)

      .filter((materia, index, array) =>
        array.indexOf(materia) === index
      );

  }

  materiaSeleccionada = '';

  mostrarMaterias = false;

  alternarMaterias(): void {

    this.mostrarMaterias = !this.mostrarMaterias;

  }

  seleccionarMateria(materia: string): void {

    this.materiaSeleccionada = materia;

    this.mostrarMaterias = false;

    this.router.navigate([], {

      relativeTo: this.route,

      queryParams: {
        materia: materia
      },

      queryParamsHandling: 'merge'

    });

  }

  // ==========================================
  // 6. INFORMACIÓN GENERAL
  // ==========================================

  totalEstudiantes = 28;

  tareasCambio: TareaPublicada[] = [];

  // ==========================================
  // 7. TAREAS PUBLICADAS
  // ==========================================

  get tareas(): Tarea[] {

    return this.tareasCambio

      // Solo tareas del profesor actual
      .filter(tarea =>
        tarea.profesorDocumento === this.profesorDocumento
      )

      // Filtrar por materia seleccionada
      .filter(tarea => {

        if (!this.materiaSeleccionada) {
          return true;
        }

        return this.normalizarTexto(tarea.asignatura) ===
          this.normalizarTexto(this.materiaSeleccionada);

      })

      // Preparar información para el HTML
      .map(tarea => {

        const entregas = this.obtenerEntregasDeTarea(tarea);

        return {

          id: tarea.id,

          titulo: tarea.titulo,

          asignatura: tarea.asignatura,

          grado: tarea.grado,

          fecha: tarea.fechaEntrega,

          entregas: entregas.length,

          pendientes: Math.max(
            this.totalEstudiantes - entregas.length,
            0
          )

        };

      });

  }

  // Todas las tareas se mantienen disponibles.
  // El CSS controla que se vean cuatro y el resto tenga scroll.

  get tareasVisibles(): Tarea[] {

    return this.tareas;

  }

  get tareasPublicadas(): number {

    return this.tareas.length;

  }

  // ==========================================
  // 8. ENTREGAS RECIBIDAS
  // ==========================================

  get entregasRecibidas(): Entrega[] {

    const entregas = this.entregaService
      .obtenerEntregasProfesor(this.profesorDocumento);

    if (!this.materiaSeleccionada) {

      return entregas;

    }

    return entregas.filter(entrega =>

      this.normalizarTexto(entrega.asignatura) ===
      this.normalizarTexto(this.materiaSeleccionada)

    );

  }

  // ==========================================
  // 9. ENTREGAS PENDIENTES DE REVISIÓN
  // ==========================================

  get entregasPendientesRevision(): Entrega[] {

    return this.entregasRecibidas.filter(entrega =>

      entrega.estado === 'Pendiente de revisión'

    );

  }

  get entregasPorRevisar(): number {

    return this.entregasPendientesRevision.length;

  }

  // ==========================================
  // 10. MODAL DE ENTREGAS PENDIENTES
  // ==========================================

  mostrarModalEntregasPendientes = false;

  abrirModalEntregasPendientes(): void {

    this.mostrarModalEntregasPendientes = true;

  }

  cerrarModalEntregasPendientes(): void {

    this.mostrarModalEntregasPendientes = false;

  }

  // ==========================================
  // 11. OBTENER ENTREGAS DE UNA TAREA
  // ==========================================

  obtenerEntregasDeTarea(tarea: TareaPublicada): Entrega[] {

    return this.entregaService

      .obtenerEntregasProfesor(this.profesorDocumento)

      .filter(entrega =>

        this.normalizarTexto(entrega.titulo) ===
        this.normalizarTexto(tarea.titulo)

        &&

        this.normalizarTexto(entrega.asignatura) ===
        this.normalizarTexto(tarea.asignatura)

        &&

        this.normalizarTexto(entrega.grado) ===
        this.normalizarTexto(tarea.grado)

      );

  }

  // ==========================================
  // 12. ABRIR ARCHIVO PDF
  // ==========================================

  abrirArchivo(entrega: Entrega): void {

    const archivo = this.entregaService.obtenerArchivo(entrega.id);

    if (!archivo) {

      alert(
        'No se encontró el archivo PDF. Es posible que debas volver a cargar la entrega.'
      );

      return;

    }

    const url = URL.createObjectURL(archivo);

    window.open(url, '_blank');

    setTimeout(() => {

      URL.revokeObjectURL(url);

    }, 60000);

  }

  // ==========================================
  // 13. MARCAR ENTREGA COMO REVISADA
  // ==========================================

  marcarComoRevisada(entrega: Entrega): void {

    this.entregaService.marcarRevisada(entrega.id);

    alert('La entrega se marcó como revisada.');

  }

  // ==========================================
  // 14. GUARDAR RETROALIMENTACIÓN
  // ==========================================

  guardarRetroalimentacion(
    entrega: Entrega,
    comentario: string
  ): void {

    if (!comentario || !comentario.trim()) {

      alert('Escribe una retroalimentación antes de guardar.');

      return;

    }

    this.entregaService.guardarRetroalimentacion(
      entrega.id,
      comentario.trim()
    );

    alert('Retroalimentación guardada correctamente.');

  }

  // ==========================================
  // 15. OPCIONES DEL DASHBOARD
  // ==========================================

  mostrarFormularioAnuncio = false;

  mostrarMasOpciones = false;

  alternarOpciones(): void {

    this.mostrarMasOpciones = !this.mostrarMasOpciones;

  }

  // ==========================================
  // 16. MODAL PUBLICAR TAREA
  // ==========================================

  mostrarModalTarea = false;

  materiaTareaSeleccionada = '';

  gradoTareaSeleccionado = '';

  gradosDisponibles: string[] = [];

  archivoTareaSeleccionado: File | null = null;

  abrirModalTarea(): void {

    this.mostrarModalTarea = true;

    this.materiaTareaSeleccionada =
      this.materiaSeleccionada || this.materias[0] || '';

    this.actualizarGradosDisponibles();

  }

  cerrarModalTarea(): void {

    this.mostrarModalTarea = false;

    this.archivoTareaSeleccionado = null;

  }

  // ==========================================
  // 17. ACTUALIZAR GRADOS DISPONIBLES
  // ==========================================

  actualizarGradosDisponibles(): void {

    if (!this.materiaTareaSeleccionada) {

      this.gradosDisponibles = [];

      this.gradoTareaSeleccionado = '';

      return;

    }

    this.gradosDisponibles =
      this.entregaService.obtenerGradosProfesor(
        this.profesorDocumento,
        this.materiaTareaSeleccionada
      );

    this.gradoTareaSeleccionado =
      this.gradosDisponibles[0] || '';

  }

  // ==========================================
  // 18. SELECCIONAR ARCHIVO PDF
  // ==========================================

  seleccionarArchivo(event: Event): void {

    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {

      return;

    }

    const archivo = input.files[0];

    if (archivo.type !== 'application/pdf') {

      alert('Solo se permiten archivos PDF.');

      input.value = '';

      this.archivoTareaSeleccionado = null;

      return;

    }

    const tamanioMaximo = 10 * 1024 * 1024;

    if (archivo.size > tamanioMaximo) {

      alert('El archivo no puede superar los 10 MB.');

      input.value = '';

      this.archivoTareaSeleccionado = null;

      return;

    }

    this.archivoTareaSeleccionado = archivo;

  }

  quitarArchivo(): void {

    this.archivoTareaSeleccionado = null;

  }

  // ==========================================
  // 19. PUBLICAR TAREA
  // ==========================================

  publicarTarea(
    titulo: string,
    contenido: string,
    fechaEntrega: string
  ): void {

    if (!titulo.trim()) {

      alert('Escribe el título de la tarea.');

      return;

    }

    if (!contenido.trim()) {

      alert('Escribe las instrucciones de la tarea.');

      return;

    }

    if (!this.materiaTareaSeleccionada) {

      alert('Selecciona una materia.');

      return;

    }

    if (!this.gradoTareaSeleccionado) {

      alert('Selecciona un grado.');

      return;

    }

    if (!fechaEntrega) {

      alert('Selecciona una fecha de entrega.');

      return;

    }

    try {

      this.entregaService.publicarTarea({

        titulo: titulo.trim(),

        contenido: contenido.trim(),

        asignatura: this.materiaTareaSeleccionada,

        grado: this.gradoTareaSeleccionado,

        fechaEntrega: fechaEntrega,

        profesorDocumento: this.profesorDocumento,

        nombreProfesor: this.nombreProfesor

      }, this.archivoTareaSeleccionado);

      this.entregaService.sincronizarTareasDesdeStorage();

      alert('Tarea publicada correctamente.');

      this.cerrarModalTarea();

    } catch (error) {

      console.error('Error al publicar la tarea:', error);

      alert(
        error instanceof Error
          ? error.message
          : 'No se pudo publicar la tarea.'
      );

    }

  }

  // ==========================================
  // 20. ANUNCIOS
  // ==========================================

  anuncios: Anuncio[] = [

    {
      id: 1,
      titulo: 'Bienvenidos a la plataforma',
      mensaje: 'Recuerda mantener actualizadas tus actividades.',
      fecha: new Date().toISOString()
    },

    {
      id: 2,
      titulo: 'Organización de actividades',
      mensaje: 'Revisa las fechas de entrega de tus estudiantes.',
      fecha: new Date().toISOString()
    }

  ];

  // ABRIR FORMULARIO INLINE DEL HTML

  abrirFormularioAnuncio(): void {

    this.mostrarFormularioAnuncio = true;

  }

  // CANCELAR Y OCULTAR FORMULARIO

  cancelarAnuncio(): void {

    this.mostrarFormularioAnuncio = false;

  }

  // CREAR ANUNCIO

  crearAnuncio(titulo: string, mensaje: string): void {

    if (!titulo.trim() || !mensaje.trim()) {

      alert('Completa el título y el mensaje del anuncio.');

      return;

    }

    const nuevoAnuncio: Anuncio = {

      id: this.generarIdAnuncio(),

      titulo: titulo.trim(),

      mensaje: mensaje.trim(),

      fecha: new Date().toISOString()

    };

    this.anuncios.unshift(nuevoAnuncio);

    // Cerrar el formulario después de publicar
    this.mostrarFormularioAnuncio = false;

    alert('Anuncio publicado correctamente.');

  }

  generarIdAnuncio(): number {

    return Date.now();

  }

  // ==========================================
  // 21. CERRAR SESIÓN
  // ==========================================

  cerrarSesion(): void {

    localStorage.removeItem('usuarioActual');

    this.router.navigate(['/']);

  }

}
