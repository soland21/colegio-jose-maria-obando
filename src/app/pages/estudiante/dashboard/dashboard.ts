
import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  HostListener
} from '@angular/core';

import {
  RouterLink,
  RouterLinkActive
} from '@angular/router';

import { Subscription } from 'rxjs';

import {
  Entrega,
  EntregaService,
  TareaPublicada
} from '../../services/entrega.service';

// ==========================================
// 1. INTERFACES
// ==========================================

interface Tarea extends TareaPublicada {
  fecha: string;
  estado: 'Pendiente' | 'Entregada';
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
  selector: 'app-dashboard-estudiante',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})

export class Dashboard implements OnInit, OnDestroy {

  // ==========================================
  // 3. SERVICIO
  // ==========================================

  private entregaService = inject(EntregaService);

  private suscripciones = new Subscription();

  private readonly ANUNCIOS_STORAGE_KEY = 'anunciosColegio';

  // ==========================================
  // 4. INFORMACIÓN DEL ESTUDIANTE
  // ==========================================

  nombreEstudiante = 'Estudiante';

  grado = '';

  documentoEstudiante = '';

  // ==========================================
  // 5. TAREAS Y ENTREGAS
  // ==========================================

  tareas: Tarea[] = [];

  entregasEstudiante: Entrega[] = [];

  // ==========================================
  // 6. ANUNCIOS
  // ==========================================

  anuncios: Anuncio[] = [];

  // ==========================================
  // 7. INICIALIZACIÓN
  // ==========================================

  ngOnInit(): void {

    this.cargarUsuario();

    // Escuchar cambios en las tareas.

    this.suscripciones.add(
      this.entregaService.tareas$.subscribe(() => {
        this.cargarTareasEstudiante();
      })
    );

    // Escuchar cambios en las entregas.

    this.suscripciones.add(
      this.entregaService.entregas$.subscribe(() => {
        this.cargarEntregasEstudiante();
      })
    );

    // Cargar información inicial.

    this.cargarTareasEstudiante();

    this.cargarEntregasEstudiante();

    this.cargarAnunciosEstudiante();

  }

  // ==========================================
  // 8. DETECTAR CAMBIOS EN OTRAS PESTAÑAS
  // ==========================================

  @HostListener('window:storage', ['$event'])
  detectarCambiosStorage(event: StorageEvent): void {

    if (
      event.key === 'tareasColegio' ||
      event.key === null
    ) {

      this.entregaService.sincronizarTareasDesdeStorage();

    }

    if (
      event.key === 'entregasColegio' ||
      event.key === null
    ) {

      this.cargarEntregasEstudiante();

    }

    // Actualizar anuncios cuando el profesor publique
    // uno nuevo desde otra pestaña.

    if (
      event.key === this.ANUNCIOS_STORAGE_KEY ||
      event.key === null
    ) {

      this.cargarAnunciosEstudiante();

    }

  }

  // ==========================================
  // 9. DESTRUIR SUSCRIPCIONES
  // ==========================================

  ngOnDestroy(): void {
    this.suscripciones.unsubscribe();
  }

  // ==========================================
  // 10. CARGAR USUARIO ACTUAL
  // ==========================================

  cargarUsuario(): void {

    const usuarioGuardado =
      localStorage.getItem('usuarioActual');

    if (!usuarioGuardado) {

      this.tareas = [];

      this.entregasEstudiante = [];

      this.anuncios = [];

      console.warn('No se encontró usuarioActual.');

      return;
    }

    try {

      const usuario = JSON.parse(usuarioGuardado);

      this.nombreEstudiante =
        usuario.nombre ||
        usuario.nombreEstudiante ||
        usuario.nombreCompleto ||
        'Estudiante';

      this.grado =
        String(
          usuario.grado ??
          usuario.gradoEstudiante ??
          usuario.curso ??
          usuario.nivel ??
          ''
        ).trim();

      this.documentoEstudiante =
        String(
          usuario.documento ??
          usuario.documentoEstudiante ??
          usuario.numeroDocumento ??
          usuario.identificacion ??
          ''
        ).trim();

      console.log('Estudiante cargado:', this.nombreEstudiante);

      console.log('Grado cargado:', this.grado);

      console.log('Documento cargado:', this.documentoEstudiante);

    } catch (error) {

      console.error('Error al cargar el usuario:', error);

      this.tareas = [];

      this.entregasEstudiante = [];

      this.anuncios = [];

    }

  }

  // ==========================================
  // 11. CARGAR TAREAS DEL ESTUDIANTE
  // ==========================================

  cargarTareasEstudiante(): void {

    if (!this.grado) {

      this.tareas = [];

      return;
    }

    const tareasPublicadas =
      this.entregaService.obtenerTareasEstudiante(
        this.grado
      );

    this.tareas = tareasPublicadas.map(tarea => ({

      ...tarea,

      fecha: this.formatearFecha(tarea.fechaEntrega),

      estado: 'Pendiente' as const

    }));

    this.actualizarEstadoTareas();

    console.log('Tareas del estudiante:', this.tareas);

    console.log('Tareas pendientes:', this.tareasPendientes);

    console.log('Tareas entregadas:', this.tareasEntregadas);

  }

  // ==========================================
  // 12. FORMATEAR FECHA
  // ==========================================

  formatearFecha(fecha: string): string {

    if (!fecha) {
      return 'Sin fecha definida';
    }

    const partes = fecha.substring(0, 10).split('-');

    if (partes.length !== 3) {
      return fecha;
    }

    const [anio, mes, dia] = partes;

    return `${dia}/${mes}/${anio}`;

  }

  // ==========================================
  // 13. FORMATEAR FECHA Y HORA DE ENTREGA
  // ==========================================

  formatearFechaHora(fecha: string): string {

    if (!fecha) {
      return 'Sin fecha registrada';
    }

    const fechaConvertida = new Date(fecha);

    if (isNaN(fechaConvertida.getTime())) {
      return fecha;
    }

    return fechaConvertida.toLocaleString('es-CO', {

      day: '2-digit',

      month: '2-digit',

      year: 'numeric',

      hour: '2-digit',

      minute: '2-digit'

    });

  }

  // ==========================================
  // 14. CARGAR ENTREGAS DEL ESTUDIANTE
  // ==========================================

  cargarEntregasEstudiante(): void {

    if (!this.documentoEstudiante) {

      this.entregasEstudiante = [];

      this.actualizarEstadoTareas();

      return;
    }

    this.entregasEstudiante =
      this.entregaService.obtenerEntregasEstudiante(
        this.documentoEstudiante
      );

    this.actualizarEstadoTareas();

  }

  // ==========================================
  // 15. ACTUALIZAR ESTADOS DE LAS TAREAS
  // ==========================================

  actualizarEstadoTareas(): void {

    this.tareas = this.tareas.map(tarea => {

      const entregaEncontrada =
        this.entregasEstudiante.find(entrega =>
          entrega.tareaId === tarea.id
        );

      const entregaAnterior = !entregaEncontrada
        ? this.entregasEstudiante.find(entrega =>

            !entrega.tareaId &&

            entrega.titulo === tarea.titulo &&

            entrega.asignatura === tarea.asignatura &&

            this.normalizarTexto(entrega.grado) ===
            this.normalizarTexto(tarea.grado)

          )
        : undefined;

      const entrega = entregaEncontrada || entregaAnterior;

      return {

        ...tarea,

        estado: entrega ? 'Entregada' : 'Pendiente'

      };

    });

  }

  // ==========================================
  // 16. NORMALIZAR TEXTOS
  // ==========================================

  private normalizarTexto(texto: string): string {

    return String(texto || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();

  }

  // ==========================================
  // 17. CARGAR ANUNCIOS DEL GRADO
  // ==========================================

  cargarAnunciosEstudiante(): void {

    if (!this.grado) {

      this.anuncios = [];

      return;
    }

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

      // Mostrar únicamente los anuncios dirigidos
      // al grado del estudiante actual.

      this.anuncios = anunciosGuardados.filter(anuncio =>

        this.normalizarTexto(anuncio.grado) ===
        this.normalizarTexto(this.grado)

      );

      console.log(
        'Anuncios disponibles para:',
        this.grado,
        this.anuncios
      );

    } catch (error) {

      console.error('Error al cargar anuncios:', error);

      this.anuncios = [];

    }

  }

  // ==========================================
  // 18. LISTADO DE TAREAS PENDIENTES
  // ==========================================

  get tareasPendientesLista(): Tarea[] {

    return this.tareas.filter(
      tarea => tarea.estado === 'Pendiente'
    );

  }

  // ==========================================
  // 19. LISTADO DE TAREAS ENTREGADAS
  // ==========================================

  get tareasEntregadasLista(): Tarea[] {

    return this.tareas.filter(
      tarea => tarea.estado === 'Entregada'
    );

  }

  // ==========================================
  // 20. CONTADORES
  // ==========================================

  get tareasPendientes(): number {
    return this.tareasPendientesLista.length;
  }

  get tareasEntregadas(): number {
    return this.tareasEntregadasLista.length;
  }

  // ==========================================
  // 21. VENTANA DE TAREAS ENTREGADAS
  // ==========================================

  mostrarModalEntregadas = false;

  abrirModalEntregadas(): void {
    this.mostrarModalEntregadas = true;
  }

  cerrarModalEntregadas(): void {
    this.mostrarModalEntregadas = false;
  }

  // ==========================================
  // 22. BUSCAR ENTREGA ASOCIADA A UNA TAREA
  // ==========================================

  obtenerEntregaDeTarea(tareaId: string): Entrega | undefined {

    return this.entregasEstudiante.find(
      entrega => entrega.tareaId === tareaId
    );

  }

  // ==========================================
  // 23. MENÚ DE OPCIONES
  // ==========================================

  mostrarMasOpciones = false;

  alternarOpciones(): void {
    this.mostrarMasOpciones = !this.mostrarMasOpciones;
  }

  // ==========================================
  // 24. FORMULARIO DE ENTREGA
  // ==========================================

  mostrarFormularioEntrega = false;

  tareaSeleccionada: Tarea | null = null;

  archivoSeleccionado: File | null = null;

  mensajeEntrega = '';

  // ==========================================
  // 25. ABRIR FORMULARIO
  // ==========================================

  entregarTarea(tarea: Tarea): void {

    if (tarea.estado === 'Entregada') {
      return;
    }

    this.tareaSeleccionada = tarea;

    this.archivoSeleccionado = null;

    this.mensajeEntrega = '';

    this.mostrarFormularioEntrega = true;

  }

  // ==========================================
  // 26. SELECCIONAR ARCHIVO PDF
  // ==========================================

  seleccionarArchivo(event: Event): void {

    const input = event.target as HTMLInputElement;

    const archivo = input.files?.[0];

    this.mensajeEntrega = '';

    if (!archivo) {
      return;
    }

    const esPDF =
      archivo.type === 'application/pdf' ||
      archivo.name.toLowerCase().endsWith('.pdf');

    if (!esPDF) {

      this.mensajeEntrega =
        'Solo se permiten archivos en formato PDF.';

      this.archivoSeleccionado = null;

      input.value = '';

      return;
    }

    const tamanoMaximo = 10 * 1024 * 1024;

    if (archivo.size > tamanoMaximo) {

      this.mensajeEntrega =
        'El archivo supera el tamaño máximo permitido de 10 MB.';

      this.archivoSeleccionado = null;

      input.value = '';

      return;
    }

    this.archivoSeleccionado = archivo;

  }

  // ==========================================
  // 27. TAMAÑO DEL ARCHIVO
  // ==========================================

  obtenerTamanoArchivo(tamano: number): string {

    const tamanoEnMB = tamano / (1024 * 1024);

    return `${tamanoEnMB.toFixed(2)} MB`;

  }

  // ==========================================
  // 28. QUITAR ARCHIVO
  // ==========================================

  quitarArchivo(): void {

    this.archivoSeleccionado = null;

    this.mensajeEntrega = '';

    const input = document.getElementById(
      'archivoTarea'
    ) as HTMLInputElement | null;

    if (input) {
      input.value = '';
    }

  }

  // ==========================================
  // 29. CONFIRMAR ENTREGA
  // ==========================================

  confirmarEntrega(): void {

    if (!this.tareaSeleccionada) {
      return;
    }

    if (!this.archivoSeleccionado) {

      this.mensajeEntrega =
        'Debes seleccionar un archivo PDF para continuar.';

      return;
    }

    try {

      this.entregaService.registrarEntrega(
        this.tareaSeleccionada,
        this.archivoSeleccionado
      );

      this.cargarEntregasEstudiante();

      this.cargarTareasEstudiante();

      this.cerrarFormularioEntrega();

    } catch (error) {

      console.error(
        'Error al registrar la entrega:',
        error
      );

      this.mensajeEntrega =
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al registrar la entrega.';

    }

  }

  // ==========================================
  // 30. CERRAR FORMULARIO
  // ==========================================

  cerrarFormularioEntrega(): void {

    this.mostrarFormularioEntrega = false;

    this.tareaSeleccionada = null;

    this.archivoSeleccionado = null;

    this.mensajeEntrega = '';

  }

}
