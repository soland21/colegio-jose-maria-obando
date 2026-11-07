
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { EntregaService } from '../../services/entrega.service';

// ==========================================
// 1. INTERFACES
// ==========================================

interface Tarea {
  titulo: string;
  asignatura: string;
  fecha: string;
  estado: 'Pendiente' | 'Entregada';
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

export class Dashboard {

  // ==========================================
  // 3. SERVICIO DE ENTREGAS
  // ==========================================

  private entregaService = inject(EntregaService);


  // ==========================================
  // 4. INFORMACIÓN DEL ESTUDIANTE
  // ==========================================

  nombreEstudiante = 'Nicolas';
  grado = 'Noveno';


  // ==========================================
  // 5. CONTROL DEL MENÚ DE OPCIONES
  // ==========================================

  mostrarMasOpciones = false;

  alternarOpciones(): void {

    this.mostrarMasOpciones = !this.mostrarMasOpciones;

  }


  // ==========================================
  // 6. LISTA DE TAREAS
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
  // 7. CONTADORES AUTOMÁTICOS
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
  // 8. CONTROL DEL FORMULARIO DE ENTREGA
  // ==========================================

  mostrarFormularioEntrega = false;

  tareaSeleccionada: Tarea | null = null;

  archivoSeleccionado: File | null = null;

  mensajeEntrega = '';


  // ==========================================
  // 9. ABRIR FORMULARIO DE ENTREGA
  // ==========================================

  entregarTarea(tarea: Tarea): void {

    // Evitar entregar una tarea dos veces.

    if (tarea.estado === 'Entregada') {
      return;
    }

    this.tareaSeleccionada = tarea;

    this.archivoSeleccionado = null;

    this.mensajeEntrega = '';

    this.mostrarFormularioEntrega = true;

  }


  // ==========================================
  // 10. SELECCIONAR ARCHIVO PDF
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

    // Guardar archivo seleccionado.

    this.archivoSeleccionado = archivo;

  }


  // ==========================================
  // 11. MOSTRAR TAMAÑO DEL ARCHIVO
  // ==========================================

  obtenerTamanoArchivo(tamano: number): string {

    const tamanoEnMB = tamano / (1024 * 1024);

    return `${tamanoEnMB.toFixed(2)} MB`;

  }


  // ==========================================
  // 12. QUITAR ARCHIVO SELECCIONADO
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
  // 13. CONFIRMAR ENTREGA DE TAREA
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

      // Cerrar formulario.

      this.cerrarFormularioEntrega();

    } catch (error) {

  console.error('Error al registrar la entrega:', error);

  this.mensajeEntrega =
    error instanceof Error
      ? error.message
      : 'Ocurrió un error al registrar la entrega.';

}

  }


  // ==========================================
  // 14. CERRAR FORMULARIO
  // ==========================================

  cerrarFormularioEntrega(): void {

    this.mostrarFormularioEntrega = false;

    this.tareaSeleccionada = null;

    this.archivoSeleccionado = null;

    this.mensajeEntrega = '';

  }


  // ==========================================
  // 15. LISTA DE ANUNCIOS
  // ==========================================

  anuncios = [

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
