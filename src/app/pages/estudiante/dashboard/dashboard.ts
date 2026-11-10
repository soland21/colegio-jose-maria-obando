
import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Entrega, EntregaService } from '../../services/entrega.service';

// ==========================================
// 1. INTERFACES
// ==========================================

interface Tarea {
  titulo: string;
  asignatura: string;
  fecha: string;
  estado: 'Pendiente' | 'Entregada';
}

interface Anuncio {
  titulo: string;
  mensaje: string;
  fecha: string;
}


// ==========================================
// 2. CONFIGURACIÓN DEL COMPONENTE
// ==========================================

@Component({
  selector: 'app-dashboard-estudiante',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})

export class Dashboard implements OnInit {

  // ==========================================
  // 3. SERVICIO DE ENTREGAS
  // ==========================================

  private entregaService = inject(EntregaService);


  // ==========================================
  // 4. INFORMACIÓN DEL ESTUDIANTE
  // ==========================================

  nombreEstudiante = 'Nicolás';
  grado = 'Noveno';
  documentoEstudiante = '';


  // ==========================================
  // 5. ENTREGAS Y RETROALIMENTACIONES
  // ==========================================

  entregasEstudiante: Entrega[] = [];


  // ==========================================
  // 6. INICIALIZACIÓN
  // ==========================================

  ngOnInit(): void {

    this.cargarUsuario();

    this.cargarEntregasEstudiante();

  }


  // ==========================================
  // 7. CARGAR USUARIO ACTUAL
  // ==========================================

  cargarUsuario(): void {

    const usuarioGuardado = localStorage.getItem('usuarioActual');

    if (!usuarioGuardado) {
      return;
    }

    try {

      const usuario = JSON.parse(usuarioGuardado);

      this.nombreEstudiante =
        usuario.nombre || this.nombreEstudiante;

      this.grado =
        usuario.grado || this.grado;

      this.documentoEstudiante = String(
        usuario.documento || ''
      ).trim();

    } catch (error) {

      console.error(
        'Error al cargar el usuario:',
        error
      );

    }

  }


  // ==========================================
  // 8. CARGAR ENTREGAS DEL ESTUDIANTE
  // ==========================================

  cargarEntregasEstudiante(): void {

    if (!this.documentoEstudiante) {

      this.entregasEstudiante = [];

      return;

    }

    // Consultar las entregas del estudiante actual.

    const entregas =
      this.entregaService.obtenerEntregasEstudiante(
        this.documentoEstudiante
      );

    // Guardar las entregas para mostrarlas
    // en el recuadro de retroalimentaciones.

    this.entregasEstudiante = entregas;


    // Actualizar el estado y los comentarios
    // de las tareas que aparecen en el dashboard.

    this.tareas.forEach(tarea => {

      const entregaEncontrada = entregas.find(entrega =>

        entrega.titulo === tarea.titulo &&
        entrega.asignatura === tarea.asignatura

      );

      if (entregaEncontrada) {

        tarea.estado = 'Entregada';

      }

    });

  }


  // ==========================================
  // 9. CONTROL DEL MENÚ DE OPCIONES
  // ==========================================

  mostrarMasOpciones = false;

  alternarOpciones(): void {

    this.mostrarMasOpciones = !this.mostrarMasOpciones;

  }


  // ==========================================
  // 10. LISTA DE TAREAS
  // ==========================================

  tareas: Tarea[] = [

    {
      titulo: 'Taller de matemáticas',
      asignatura: 'Matemáticas',
      fecha: '15 de noviembre',
      estado: 'Pendiente'
    },

    {
      titulo: 'Actividad de lectura',
      asignatura: 'Español',
      fecha: '18 de noviembre',
      estado: 'Pendiente'
    },

    {
      titulo: 'Trabajo sobre los ecosistemas',
      asignatura: 'Biología',
      fecha: '20 de noviembre',
      estado: 'Pendiente'
    },

    {
      titulo: 'Ejercicios de estadística',
      asignatura: 'Estadística',
      fecha: '22 de noviembre',
      estado: 'Entregada'
    }

  ];


  // ==========================================
  // 11. CONTADORES AUTOMÁTICOS
  // ==========================================

  get tareasPendientes(): number {

    return this.tareas.filter(
      tarea => tarea.estado === 'Pendiente'
    ).length;

  }


  get tareasEntregadas(): number {

    return this.tareas.filter(
      tarea => tarea.estado === 'Entregada'
    ).length;

  }


  // ==========================================
  // 12. CONTROL DEL FORMULARIO DE ENTREGA
  // ==========================================

  mostrarFormularioEntrega = false;

  tareaSeleccionada: Tarea | null = null;

  archivoSeleccionado: File | null = null;

  mensajeEntrega = '';


  // ==========================================
  // 13. ABRIR FORMULARIO DE ENTREGA
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
  // 14. SELECCIONAR ARCHIVO PDF
  // ==========================================

  seleccionarArchivo(event: Event): void {

    const input = event.target as HTMLInputElement;

    const archivo = input.files?.[0];

    this.mensajeEntrega = '';

    if (!archivo) {
      return;
    }

    // Validar extensión y tipo de archivo.

    const esPDF =
      archivo.type === 'application/pdf' ||
      archivo.name.toLowerCase().endsWith('.pdf');

    if (!esPDF || !archivo.name.toLowerCase().endsWith('.pdf')) {

      this.mensajeEntrega =
        'Solo se permiten archivos en formato PDF.';

      this.archivoSeleccionado = null;

      input.value = '';

      return;

    }

    // Validar tamaño máximo de 10 MB.

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
  // 15. MOSTRAR TAMAÑO DEL ARCHIVO
  // ==========================================

  obtenerTamanoArchivo(tamano: number): string {

    const tamanoEnMB = tamano / (1024 * 1024);

    return `${tamanoEnMB.toFixed(2)} MB`;

  }


  // ==========================================
  // 16. QUITAR ARCHIVO SELECCIONADO
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
  // 17. CONFIRMAR ENTREGA DE TAREA
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

      // Registrar la entrega en el servicio compartido.

      this.entregaService.registrarEntrega(
        this.tareaSeleccionada.titulo,
        this.tareaSeleccionada.asignatura,
        this.tareaSeleccionada.fecha,
        this.archivoSeleccionado
      );

      // Cambiar estado de la tarea.

      this.tareaSeleccionada.estado = 'Entregada';

      console.log(
        'Tarea entregada:',
        this.tareaSeleccionada.titulo
      );

      console.log(
        'Archivo seleccionado:',
        this.archivoSeleccionado.name
      );

      // Actualizar la información de entregas.

      this.cargarEntregasEstudiante();

      // Cerrar formulario.

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
  // 18. CERRAR FORMULARIO
  // ==========================================

  cerrarFormularioEntrega(): void {

    this.mostrarFormularioEntrega = false;

    this.tareaSeleccionada = null;

    this.archivoSeleccionado = null;

    this.mensajeEntrega = '';

  }


  // ==========================================
  // 19. LISTA DE ANUNCIOS
  // ==========================================

  anuncios: Anuncio[] = [

    {
      titulo: 'Recordatorio de actividades',
      mensaje: 'Recuerda revisar las actividades pendientes de esta semana.',
      fecha: 'Hoy'
    },

    {
      titulo: 'Información de clase',
      mensaje: 'Consulta las indicaciones de tu profesor para la próxima clase.',
      fecha: 'Ayer'
    }

  ];

}
