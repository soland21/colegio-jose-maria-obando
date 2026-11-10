
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
        this.profesorDocumento = String(
          usuario.documento || ''
        ).trim();

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

    this.entregaService.entregas$.subscribe(entregas => {

      console.log('Entregas actualizadas:', entregas);

    });

    // ==========================================
    // ESCUCHAR CAMBIOS EN LAS TAREAS PUBLICADAS
    // ==========================================

    this.entregaService.tareas$.subscribe(tareas => {

      this.tareasCambio = tareas;

      console.log('Tareas publicadas actualizadas:', tareas);

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
  // 8. TAREAS PUBLICADAS
  // ==========================================

  tareasCambio: TareaPublicada[] = [];

  // ==========================================
  // 9. FILTRAR TAREAS DEL PROFESOR
  // ==========================================

  get tareas(): Tarea[] {

    return this.tareasCambio

      // Mostrar únicamente tareas del profesor actual.

      .filter(tarea =>
        tarea.profesorDocumento.trim() ===
        this.profesorDocumento
      )

      // Filtrar por materia seleccionada.

      .filter(tarea => {

        if (!this.materiaSeleccionada) {
          return true;
        }

        return this.normalizarTexto(tarea.asignatura) ===
          this.normalizarTexto(this.materiaSeleccionada);

      })

      // Calcular entregas y pendientes.

      .map(tarea => {

        const entregasTarea = this.obtenerEntregasDeTarea({
          id: tarea.id,
          titulo: tarea.titulo,
          asignatura: tarea.asignatura,
          grado: tarea.grado,
          fecha: tarea.fechaEntrega,
          pendientes: 0,
          entregas: 0
        });

        return {
          id: tarea.id,
          titulo: tarea.titulo,
          asignatura: tarea.asignatura,
          grado: tarea.grado,
          fecha: tarea.fechaEntrega,
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

    // Liberar la URL después de un tiempo.

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 60000);

  }

  // ==========================================
  // 14. MARCAR ENTREGA COMO REVISADA
  // ==========================================

  marcarComoRevisada(entrega: Entrega): void {

    this.entregaService.marcarRevisada(entrega.id);

  }

  // ==========================================
  // 15. GUARDAR RETROALIMENTACIÓN
  // ==========================================

  guardarRetroalimentacion(
    entrega: Entrega,
    comentario: string
  ): void {

    const comentarioLimpio = comentario.trim();

    if (!comentarioLimpio) {

      alert('Escribe una retroalimentación antes de guardarla.');

      return;

    }

    this.entregaService.guardarRetroalimentacion(
      entrega.id,
      comentarioLimpio
    );

    alert('La retroalimentación se guardó correctamente.');

  }

  // ==========================================
  // 16. CONTROL DE INTERFAZ
  // ==========================================

  mostrarFormularioAnuncio = false;

  mostrarMasOpciones = false;

  alternarOpciones(): void {

    this.mostrarMasOpciones = !this.mostrarMasOpciones;

  }

  // ==========================================
  // 17. PUBLICAR TAREAS
  // ==========================================

  mostrarModalTarea = false;

  materiaTareaSeleccionada = '';

  gradoTareaSeleccionado = '';

  gradosDisponibles: string[] = [];

  archivoTareaSeleccionado: File | null = null;

  // Abrir modal.

  abrirModalTarea(): void {

    if (this.materias.length === 0) {

      alert('No tienes materias asignadas para publicar tareas.');

      return;

    }

    this.materiaTareaSeleccionada =
      this.materiaSeleccionada || this.materias[0];

    this.actualizarGradosTarea(this.materiaTareaSeleccionada);

    this.archivoTareaSeleccionado = null;

    this.mostrarModalTarea = true;

  }

  // Cerrar modal.

  cerrarModalTarea(): void {

    this.mostrarModalTarea = false;

    this.archivoTareaSeleccionado = null;

  }

  // Actualizar grados según la materia.

  actualizarGradosTarea(asignatura: string): void {

    this.materiaTareaSeleccionada = asignatura;

    this.gradosDisponibles =
      this.entregaService.obtenerGradosProfesor(
        this.profesorDocumento,
        asignatura
      );

    this.gradoTareaSeleccionado =
      this.gradosDisponibles[0] || '';

  }

  // Seleccionar archivo PDF.

  seleccionarArchivoTarea(event: Event): void {

    const input = event.target as HTMLInputElement;

    const archivo = input.files?.[0];

    if (!archivo) {

      this.archivoTareaSeleccionado = null;

      return;

    }

    if (
      archivo.type !== 'application/pdf' &&
      !archivo.name.toLowerCase().endsWith('.pdf')
    ) {

      alert('Solo puedes adjuntar archivos PDF.');

      input.value = '';

      this.archivoTareaSeleccionado = null;

      return;

    }

    if (archivo.size > 10 * 1024 * 1024) {

      alert('El archivo no puede superar los 10 MB.');

      input.value = '';

      this.archivoTareaSeleccionado = null;

      return;

    }

    this.archivoTareaSeleccionado = archivo;

  }

  // Quitar archivo seleccionado.

  quitarArchivoTarea(input: HTMLInputElement): void {

    this.archivoTareaSeleccionado = null;

    input.value = '';

  }

  // ==========================================
  // 18. GUARDAR Y PUBLICAR TAREA
  // ==========================================

  publicarTarea(
    titulo: string,
    contenido: string,
    asignatura: string,
    grado: string,
    fechaEntrega: string
  ): void {

    const tituloLimpio = titulo.trim();

    const contenidoLimpio = contenido.trim();

    // Validar campos obligatorios.

    if (
      !tituloLimpio ||
      !contenidoLimpio ||
      !asignatura ||
      !grado ||
      !fechaEntrega
    ) {

      alert('Completa todos los campos obligatorios.');

      return;

    }

    // Comprobar que la materia está asignada al profesor.

    const materiaPermitida = this.materias.some(
      materia =>
        this.normalizarTexto(materia) ===
        this.normalizarTexto(asignatura)
    );

    if (!materiaPermitida) {

      alert('No tienes asignada esta materia.');

      return;

    }

    // Comprobar que el grado corresponde a esa materia.

    const gradosPermitidos =
      this.entregaService.obtenerGradosProfesor(
        this.profesorDocumento,
        asignatura
      );

    if (!gradosPermitidos.includes(grado)) {

      alert('El grado seleccionado no está asignado a esta materia.');

      return;

    }

    // Publicar tarea.

    try {

      this.entregaService.publicarTarea({

        titulo: tituloLimpio,

        contenido: contenidoLimpio,

        asignatura,

        grado,

        fechaEntrega,

        profesorDocumento: this.profesorDocumento,

        nombreProfesor: this.nombreProfesor

      }, this.archivoTareaSeleccionado);

      this.cerrarModalTarea();

      alert('¡La tarea se publicó correctamente!');

    } catch (error) {

      console.error('Error al publicar tarea:', error);

      alert(
        error instanceof Error
          ? error.message
          : 'No fue posible publicar la tarea.'
      );

    }

  }

  // ==========================================
  // 19. ANUNCIOS
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
  // 20. CREAR ANUNCIO
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
  // 21. GENERAR ID DE ANUNCIO
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
  // 22. CERRAR SESIÓN
  // ==========================================

  cerrarSesion(): void {

    localStorage.removeItem('usuarioActual');

    this.router.navigate(['/']);

  }

}
