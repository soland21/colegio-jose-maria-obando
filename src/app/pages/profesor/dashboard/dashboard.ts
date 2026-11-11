
import { Component, HostListener } from '@angular/core';

import {
  ActivatedRoute,
  Router,
  RouterLink,
  RouterLinkActive
} from '@angular/router';

import {
  Entrega,
  EntregaService,
  TareaPublicada,
  PeriodoAcademico,
  PERIODOS_ACADEMICOS
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
  grado: string;
  profesorDocumento: string;
  nombreProfesor: string;
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

  private readonly ANUNCIOS_STORAGE_KEY = 'anunciosColegio';

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

        this.nombreProfesor =
          usuario.nombre || 'Profesor';

        this.profesorDocumento =
          String(
            usuario.documento ??
            usuario.documentoProfesor ??
            usuario.numeroDocumento ??
            ''
          ).trim();

      } catch (error) {

        console.error(
          'Error al recuperar el profesor:',
          error
        );

      }

    }

    console.log('Profesor actual:', this.nombreProfesor);
    console.log('Documento:', this.profesorDocumento);

    // ==========================================
    // ESCUCHAR MATERIA SELECCIONADA
    // ==========================================

    this.route.queryParamMap.subscribe(params => {

      this.materiaSeleccionada =
        params.get('materia') || '';

    });

    // ==========================================
    // ESCUCHAR CAMBIOS EN LAS ENTREGAS
    // ==========================================

    this.entregaService.entregas$.subscribe(entregas => {

      this.entregasCambio = entregas;

      console.log('Entregas actualizadas:', entregas);

    });

    // ==========================================
    // ESCUCHAR CAMBIOS EN LAS TAREAS
    // ==========================================

    this.entregaService.tareas$.subscribe(tareas => {

      this.tareasCambio = tareas;

    });

    // ==========================================
    // CARGAR ANUNCIOS GUARDADOS
    // ==========================================

    this.cargarAnuncios();

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
        String(asignacion.documentoProfesor).trim() ===
        String(this.profesorDocumento).trim()
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

  entregasCambio: Entrega[] = [];

  // ==========================================
  // 7. TAREAS PUBLICADAS
  // ==========================================

  get tareas(): Tarea[] {

    return this.tareasCambio

      // Mostrar únicamente las tareas del profesor actual.

      .filter(tarea =>
        String(tarea.profesorDocumento).trim() ===
        String(this.profesorDocumento).trim()
      )

      // Filtrar por materia seleccionada.

      .filter(tarea => {

        if (!this.materiaSeleccionada) {
          return true;
        }

        return this.normalizarTexto(tarea.asignatura) ===
          this.normalizarTexto(this.materiaSeleccionada);

      })

      // IMPORTANTE:
      // No se excluyen tareas que ya tienen entregas.
      // Así también se pueden editar las actividades
      // que los estudiantes ya enviaron.

      .map(tarea => {

        const entregasTarea =
          this.obtenerEntregasDeTarea(tarea);

        return {

          id: tarea.id,

          titulo: tarea.titulo,

          asignatura: tarea.asignatura,

          grado: tarea.grado,

          fecha: tarea.fechaEntrega,

          entregas: entregasTarea.length,

          pendientes: Math.max(
            this.totalEstudiantes - entregasTarea.length,
            0
          )

        };

      });

  }

  // ==========================================
  // 8. TAREAS VISIBLES
  // ==========================================

  get tareasVisibles(): Tarea[] {

    return this.tareas;

  }

  get tareasPublicadas(): number {

    return this.tareas.length;

  }

  // ==========================================
  // 9. ENTREGAS RECIBIDAS
  // ==========================================

  get entregasRecibidas(): Entrega[] {

    const entregas = this.entregasCambio.filter(entrega =>

      String(entrega.profesorDocumento).trim() ===
      String(this.profesorDocumento).trim()

    );

    if (!this.materiaSeleccionada) {

      return entregas;

    }

    return entregas.filter(entrega =>

      this.normalizarTexto(entrega.asignatura) ===
      this.normalizarTexto(this.materiaSeleccionada)

    );

  }

  // ==========================================
  // 10. ENTREGAS PENDIENTES DE REVISIÓN
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
  // 11. MODAL DE ENTREGAS PENDIENTES
  // ==========================================

  mostrarModalEntregasPendientes = false;

  abrirModalEntregasPendientes(): void {

    this.mostrarModalEntregasPendientes = true;

  }

  cerrarModalEntregasPendientes(): void {

    this.mostrarModalEntregasPendientes = false;

  }

  // ==========================================
  // 12. OBTENER ENTREGAS DE UNA TAREA
  // ==========================================

  obtenerEntregasDeTarea(tarea: TareaPublicada): Entrega[] {

    return this.entregasCambio.filter(entrega => {

      if (
        String(entrega.profesorDocumento).trim() !==
        String(this.profesorDocumento).trim()
      ) {

        return false;

      }

      if (entrega.tareaId) {

        return entrega.tareaId === tarea.id;

      }

      return (

        this.normalizarTexto(entrega.titulo) ===
        this.normalizarTexto(tarea.titulo) &&

        this.normalizarTexto(entrega.asignatura) ===
        this.normalizarTexto(tarea.asignatura) &&

        this.normalizarTexto(entrega.grado) ===
        this.normalizarTexto(tarea.grado)

      );

    });

  }

  // ==========================================
  // 13. ABRIR ARCHIVO PDF
  // ==========================================

  abrirArchivo(entrega: Entrega): void {

    const archivo =
      this.entregaService.obtenerArchivo(entrega.id);

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
  // 14. GUARDAR CALIFICACIÓN
  // ==========================================

  guardarCalificacionEntrega(
    entrega: Entrega,
    nota: string | number,
    comentario: string
  ): void {

    const calificacion = Number(nota);

    if (nota === '' || nota === null || nota === undefined) {

      alert('Ingresa una calificación.');

      return;

    }

    if (
      !Number.isFinite(calificacion) ||
      calificacion < 1 ||
      calificacion > 5
    ) {

      alert('La calificación debe estar entre 1.0 y 5.0.');

      return;

    }

    try {

      this.entregaService.guardarCalificacion(
        entrega.id,
        calificacion,
        comentario || ''
      );

      alert('Calificación guardada correctamente.');

    } catch (error) {

      alert(
        error instanceof Error
          ? error.message
          : 'No se pudo guardar la calificación.'
      );

    }

  }

  // ==========================================
  // 15. MARCAR ENTREGA COMO REVISADA
  // ==========================================

  marcarComoRevisada(entrega: Entrega): void {

    this.entregaService.marcarRevisada(entrega.id);

    alert('La entrega se marcó como revisada.');

  }

  // ==========================================
  // 16. GUARDAR RETROALIMENTACIÓN
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
  // 17. OPCIONES DEL DASHBOARD
  // ==========================================

  mostrarModalAnuncio = false;

  mostrarMasOpciones = false;

  alternarOpciones(): void {

    this.mostrarMasOpciones = !this.mostrarMasOpciones;

  }

  // ==========================================
  // 18. MODAL PUBLICAR / EDITAR TAREA
  // ==========================================

  mostrarModalTarea = false;

  // ID de la tarea que se está editando.
  // Si es null, se está creando una tarea nueva.

  tareaEditandoId: string | null = null;

  // Datos del formulario.

  tituloTareaModal = '';

  contenidoTareaModal = '';

  fechaEntregaTareaModal = '';

  materiaTareaSeleccionada = '';

  gradoTareaSeleccionado = '';

  gradosDisponibles: string[] = [];

  archivoTareaSeleccionado: File | null = null;

  readonly periodosAcademicos = PERIODOS_ACADEMICOS;

  periodoTareaSeleccionado: PeriodoAcademico = 'Primer periodo';

  // ==========================================
  // 19. ABRIR MODAL PARA PUBLICAR TAREA
  // ==========================================

  abrirModalTarea(): void {

    this.limpiarFormularioTarea();

    this.tareaEditandoId = null;

    this.tituloTareaModal = '';

    this.contenidoTareaModal = '';

    this.fechaEntregaTareaModal = '';

    this.periodoTareaSeleccionado = 'Primer periodo';

    this.materiaTareaSeleccionada =
      this.materiaSeleccionada || this.materias[0] || '';

    this.actualizarGradosDisponibles();

    this.mostrarModalTarea = true;

  }

  // ==========================================
  // 20. ABRIR MODAL PARA EDITAR TAREA
  // ==========================================

  editarTarea(tareaResumen: Tarea): void {

    // Buscar la tarea original en el servicio.

    const tarea = this.tareasCambio.find(
      item => item.id === tareaResumen.id
    );

    if (!tarea) {

      alert('No se encontró la tarea que deseas editar.');

      return;

    }

    // Comprobar que la tarea pertenezca al profesor actual.

    if (
      String(tarea.profesorDocumento).trim() !==
      String(this.profesorDocumento).trim()
    ) {

      alert('No tienes permiso para editar esta tarea.');

      return;

    }

    // Limpiar los datos de una edición anterior.

    this.limpiarFormularioTarea();

    // Guardar el ID original.
    // Esto permite actualizar el registro y no crear otro.

    this.tareaEditandoId = tarea.id;

    // Precargar información.

    this.tituloTareaModal = tarea.titulo || '';

    this.contenidoTareaModal = tarea.contenido || '';

    this.fechaEntregaTareaModal =
      String(tarea.fechaEntrega || '').substring(0, 10);

    this.materiaTareaSeleccionada = tarea.asignatura;

    // Cargar los grados disponibles para esa materia.

    this.actualizarGradosDisponibles();

    // Mantener el grado original si continúa asignado.

    if (
      this.gradosDisponibles.includes(tarea.grado)
    ) {

      this.gradoTareaSeleccionado = tarea.grado;

    }

    // Recuperar el periodo original.

    this.periodoTareaSeleccionado =
      tarea.periodo || 'Primer periodo';

    // Abrir el modal.

    this.mostrarModalTarea = true;

  }

  // ==========================================
  // 21. LIMPIAR FORMULARIO DE TAREA
  // ==========================================

  private limpiarFormularioTarea(): void {

    this.archivoTareaSeleccionado = null;

    this.tituloTareaModal = '';

    this.contenidoTareaModal = '';

    this.fechaEntregaTareaModal = '';

    this.gradoTareaSeleccionado = '';

    this.gradosDisponibles = [];

  }

  // ==========================================
  // 22. CERRAR MODAL DE TAREA
  // ==========================================

  cerrarModalTarea(): void {

    this.mostrarModalTarea = false;

    this.tareaEditandoId = null;

    this.limpiarFormularioTarea();

  }

  // ==========================================
  // 23. ACTUALIZAR GRADOS DISPONIBLES
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
  // 24. SELECCIONAR ARCHIVO PDF
  // ==========================================

  seleccionarArchivo(event: Event): void {

    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {

      return;

    }

    const archivo = input.files[0];

    if (
      archivo.type !== 'application/pdf' &&
      !archivo.name.toLowerCase().endsWith('.pdf')
    ) {

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
  // 25. PUBLICAR O ACTUALIZAR TAREA
  // ==========================================

  publicarTarea(
    titulo: string,
    contenido: string,
    fechaEntrega: string
  ): void {

    // ==========================================
    // VALIDACIONES
    // ==========================================

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

    if (!this.periodoTareaSeleccionado) {

      alert('Selecciona un periodo académico.');

      return;

    }

    if (!this.profesorDocumento) {

      alert('No se pudo identificar al profesor.');

      return;

    }

    try {

      // ==========================================
      // DATOS DE LA TAREA
      // ==========================================

      const datosTarea = {

        titulo: titulo.trim(),

        contenido: contenido.trim(),

        asignatura: this.materiaTareaSeleccionada,

        grado: this.gradoTareaSeleccionado,

        fechaEntrega: fechaEntrega,

        profesorDocumento: this.profesorDocumento,

        nombreProfesor: this.nombreProfesor,

        periodo: this.periodoTareaSeleccionado

      };

      // ==========================================
      // SI EXISTE ID, ACTUALIZAR TAREA
      // ==========================================

      if (this.tareaEditandoId) {

        this.entregaService.actualizarTarea(

          this.tareaEditandoId,

          datosTarea,

          this.archivoTareaSeleccionado || undefined

        );

        this.entregaService.sincronizarTareasDesdeStorage();

        alert('La tarea se actualizó correctamente.');

      }

      // ==========================================
      // SI NO EXISTE ID, PUBLICAR TAREA NUEVA
      // ==========================================

      else {

        this.entregaService.publicarTarea(

          datosTarea,

          this.archivoTareaSeleccionado || undefined

        );

        this.entregaService.sincronizarTareasDesdeStorage();

        alert('Tarea publicada correctamente.');

      }

      // ==========================================
      // CERRAR MODAL
      // ==========================================

      this.cerrarModalTarea();

    } catch (error) {

      console.error(
        'Error al guardar la tarea:',
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : 'No se pudo guardar la tarea.'
      );

    }

  }

  // ==========================================
  // 26. ANUNCIOS
  // ==========================================

  anuncios: Anuncio[] = [];

  gradoAnuncioSeleccionado = '';

  // ==========================================
  // 27. GRADOS DISPONIBLES PARA ANUNCIOS
  // ==========================================

  get gradosAnuncioDisponibles(): string[] {

    const documentoActual =
      String(this.profesorDocumento).trim();

    const grados = this.entregaService.asignacionesDocentes

      .filter(asignacion =>
        String(asignacion.documentoProfesor).trim() ===
        documentoActual
      )

      .map(asignacion =>
        String(asignacion.grado || '').trim()
      )

      .filter(grado => grado !== '');

    return [...new Set(grados)];

  }

  // ==========================================
  // 28. CARGAR ANUNCIOS
  // ==========================================

  cargarAnuncios(): void {

    try {

      const datos = localStorage.getItem(
        this.ANUNCIOS_STORAGE_KEY
      );

      if (!datos) {

        this.anuncios = [];

        return;

      }

      const anunciosGuardados: Anuncio[] = JSON.parse(datos);

      if (!Array.isArray(anunciosGuardados)) {

        this.anuncios = [];

        return;

      }

      this.anuncios = anunciosGuardados.filter(anuncio =>

        String(anuncio.profesorDocumento).trim() ===
        String(this.profesorDocumento).trim()

      );

      console.log('Anuncios del profesor:', this.anuncios);

    } catch (error) {

      console.error('Error al cargar anuncios:', error);

      this.anuncios = [];

    }

  }

  // ==========================================
  // 29. SINCRONIZAR ANUNCIOS ENTRE PESTAÑAS
  // ==========================================

  @HostListener('window:storage', ['$event'])
  detectarCambiosAnuncios(event: StorageEvent): void {

    if (
      event.key === this.ANUNCIOS_STORAGE_KEY ||
      event.key === null
    ) {

      this.cargarAnuncios();

    }

  }

  // ==========================================
  // 30. ABRIR MODAL DE ANUNCIO
  // ==========================================

  abrirModalAnuncio(): void {

    console.log('========== ANUNCIOS ==========');

    console.log('Profesor:', this.nombreProfesor);

    console.log('Documento:', this.profesorDocumento);

    console.log(
      'Asignaciones:',
      this.entregaService.asignacionesDocentes
    );

    console.log(
      'Grados disponibles:',
      this.gradosAnuncioDisponibles
    );

    this.gradoAnuncioSeleccionado =
      this.gradosAnuncioDisponibles[0] || '';

    this.mostrarModalAnuncio = true;

  }

  // ==========================================
  // 31. CERRAR MODAL DE ANUNCIO
  // ==========================================

  cerrarModalAnuncio(): void {

    this.mostrarModalAnuncio = false;

  }

  // ==========================================
  // 32. CREAR ANUNCIO
  // ==========================================

  crearAnuncio(
    titulo: string,
    mensaje: string,
    grado: string
  ): void {

    if (!titulo.trim() || !mensaje.trim()) {

      alert('Completa el título y el mensaje del anuncio.');

      return;

    }

    if (!this.profesorDocumento) {

      alert(
        'No se pudo identificar al profesor que publica el anuncio.'
      );

      return;

    }

    if (!grado || !grado.trim()) {

      alert('Selecciona el grado al que va dirigido el anuncio.');

      return;

    }

    // Verificar que el profesor tenga asignado ese grado.

    const gradoValido = this.gradosAnuncioDisponibles.some(
      gradoDisponible =>

        this.normalizarTexto(gradoDisponible) ===
        this.normalizarTexto(grado)

    );

    if (!gradoValido) {

      alert('No tienes asignado el grado seleccionado.');

      return;

    }

    const nuevoAnuncio: Anuncio = {

      id: this.generarIdAnuncio(),

      titulo: titulo.trim(),

      mensaje: mensaje.trim(),

      grado: grado.trim(),

      profesorDocumento: String(this.profesorDocumento).trim(),

      nombreProfesor: this.nombreProfesor,

      fecha: new Date().toISOString()

    };

    try {

      const datos = localStorage.getItem(
        this.ANUNCIOS_STORAGE_KEY
      );

      const anunciosGuardados: Anuncio[] = datos
        ? JSON.parse(datos)
        : [];

      if (!Array.isArray(anunciosGuardados)) {

        throw new Error(
          'Los anuncios almacenados tienen un formato incorrecto.'
        );

      }

      anunciosGuardados.unshift(nuevoAnuncio);

      localStorage.setItem(
        this.ANUNCIOS_STORAGE_KEY,
        JSON.stringify(anunciosGuardados)
      );

      console.log('Anuncio guardado:', nuevoAnuncio);

      console.log(
        'Anuncios almacenados:',
        JSON.parse(
          localStorage.getItem(this.ANUNCIOS_STORAGE_KEY) || '[]'
        )
      );

      this.cargarAnuncios();

      this.cerrarModalAnuncio();

      alert(`Anuncio publicado correctamente para ${grado}.`);

    } catch (error) {

      console.error('Error al publicar anuncio:', error);

      alert('No se pudo guardar el anuncio.');

    }

  }

  // ==========================================
  // 33. GENERAR ID DEL ANUNCIO
  // ==========================================

  generarIdAnuncio(): number {

    return Date.now() + Math.floor(Math.random() * 1000);

  }

  // ==========================================
// 34. NAVEGAR A LA VISTA DE ESTUDIANTES
// ==========================================

irAEstudiantes(): void {

  this.router.navigate(['/profesor/estudiantes']);

}

  // ==========================================
  // 35. CERRAR SESIÓN
  // ==========================================

  cerrarSesion(): void {

    localStorage.removeItem('usuarioActual');

    this.router.navigate(['/']);

  }
  

}
