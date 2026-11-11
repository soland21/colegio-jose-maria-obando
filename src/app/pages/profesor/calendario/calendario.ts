
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

interface TareaCalendario {
  id: string;
  titulo: string;
  contenido?: string;
  asignatura?: string;
  grado?: string;
  fechaEntrega: string;
  profesorDocumento: string;
  nombreProfesor?: string;
}

interface AnuncioCalendario {
  id: string;
  titulo: string;
  mensaje: string;
  grado: string;
  profesorDocumento: string;
  nombreProfesor?: string;
  fecha: string;
}

type TipoEvento = 'tarea' | 'anuncio';

interface EventoCalendario {
  id: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  tipo: TipoEvento;
  grado: string;
  asignatura: string;
}

interface DiaCalendario {
  fecha: Date;
  numero: number;
  esMesActual: boolean;
  esHoy: boolean;
  seleccionado: boolean;
  eventos: EventoCalendario[];
}

@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './calendario.html',
  styleUrl: './calendario.css'
})
export class Calendario implements OnInit {

  nombreProfesor = 'Profesor';
  documentoProfesor = '';

  fechaActual = new Date();
  mesActual = new Date(this.fechaActual.getFullYear(), this.fechaActual.getMonth(), 1);

  diasCalendario: DiaCalendario[] = [];
  eventos: EventoCalendario[] = [];
  eventosDelDia: EventoCalendario[] = [];

  fechaSeleccionada = new Date();

  mostrarTareas = true;
  mostrarAnuncios = true;

  readonly nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril',
    'Mayo', 'Junio', 'Julio', 'Agosto',
    'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  readonly nombresDias = [
    'Lunes', 'Martes', 'Miércoles',
    'Jueves', 'Viernes', 'Sábado', 'Domingo'
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.cargarProfesor();
    this.cargarEventos();
    this.generarCalendario();
    this.actualizarEventosDelDia();
  }

  get nombreMes(): string {
    return `${this.nombresMeses[this.mesActual.getMonth()]} ${this.mesActual.getFullYear()}`;
  }

  get eventosFiltrados(): EventoCalendario[] {
    return this.eventos.filter(evento => {
      if (evento.tipo === 'tarea' && !this.mostrarTareas) {
        return false;
      }

      if (evento.tipo === 'anuncio' && !this.mostrarAnuncios) {
        return false;
      }

      return true;
    });
  }

  get eventosDelDiaFiltrados(): EventoCalendario[] {
    return this.eventosDelDia.filter(evento => {
      if (evento.tipo === 'tarea' && !this.mostrarTareas) {
        return false;
      }

      if (evento.tipo === 'anuncio' && !this.mostrarAnuncios) {
        return false;
      }

      return true;
    });
  }

  cargarProfesor(): void {
    const usuarioGuardado = localStorage.getItem('usuarioActual');

    if (!usuarioGuardado) {
      return;
    }

    try {
      const usuario = JSON.parse(usuarioGuardado);

      this.nombreProfesor = usuario.nombre || 'Profesor';
      this.documentoProfesor = String(usuario.documento || '').trim();
    } catch {
      console.error('No fue posible leer los datos del profesor.');
    }
  }

  cargarEventos(): void {
    this.eventos = [];

    if (!this.documentoProfesor) {
      return;
    }

    this.cargarTareas();
    this.cargarAnuncios();

    this.eventos.sort((a, b) =>
      this.convertirFecha(a.fecha).getTime() -
      this.convertirFecha(b.fecha).getTime()
    );
  }

  cargarTareas(): void {
    const tareasGuardadas = localStorage.getItem('tareasColegio');

    if (!tareasGuardadas) {
      return;
    }

    try {
      const tareas: TareaCalendario[] = JSON.parse(tareasGuardadas);

      tareas.forEach(tarea => {
        if (
          String(tarea.profesorDocumento || '').trim() !==
          this.documentoProfesor
        ) {
          return;
        }

        if (!tarea.fechaEntrega) {
          return;
        }

        this.eventos.push({
          id: `tarea-${tarea.id}`,
          titulo: tarea.titulo || 'Tarea sin título',
          descripcion: tarea.contenido || 'Fecha límite de entrega de la tarea.',
          fecha: this.normalizarFecha(tarea.fechaEntrega),
          tipo: 'tarea',
          grado: tarea.grado || '',
          asignatura: tarea.asignatura || ''
        });
      });

    } catch {
      console.error('No fue posible cargar las tareas del calendario.');
    }
  }

  cargarAnuncios(): void {
    const anunciosGuardados = localStorage.getItem('anunciosColegio');

    if (!anunciosGuardados) {
      return;
    }

    try {
      const anuncios: AnuncioCalendario[] = JSON.parse(anunciosGuardados);

      anuncios.forEach(anuncio => {
        if (
          String(anuncio.profesorDocumento || '').trim() !==
          this.documentoProfesor
        ) {
          return;
        }

        if (!anuncio.fecha) {
          return;
        }

        this.eventos.push({
          id: `anuncio-${anuncio.id}`,
          titulo: anuncio.titulo || 'Anuncio del profesor',
          descripcion: anuncio.mensaje || 'Anuncio publicado para el grupo.',
          fecha: this.normalizarFecha(anuncio.fecha),
          tipo: 'anuncio',
          grado: anuncio.grado || '',
          asignatura: ''
        });
      });

    } catch {
      console.error('No fue posible cargar los anuncios del calendario.');
    }
  }

  normalizarFecha(valor: string): string {
    if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
      return valor;
    }

    const fecha = new Date(valor);

    if (Number.isNaN(fecha.getTime())) {
      return '';
    }

    return this.formatoFecha(fecha);
  }

  convertirFecha(valor: string): Date {
    const [anio, mes, dia] = valor.split('-').map(Number);

    return new Date(anio, mes - 1, dia);
  }

  formatoFecha(fecha: Date): string {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
  }

  generarCalendario(): void {
    const primerDiaMes = new Date(
      this.mesActual.getFullYear(),
      this.mesActual.getMonth(),
      1
    );

    const ultimoDiaMes = new Date(
      this.mesActual.getFullYear(),
      this.mesActual.getMonth() + 1,
      0
    );

    // La semana comienza en lunes.
    const desplazamiento = (primerDiaMes.getDay() + 6) % 7;

    const fechaInicio = new Date(primerDiaMes);
    fechaInicio.setDate(primerDiaMes.getDate() - desplazamiento);

    const totalCeldas = Math.ceil(
      (desplazamiento + ultimoDiaMes.getDate()) / 7
    ) * 7;

    const hoy = this.formatoFecha(new Date());
    const seleccionada = this.formatoFecha(this.fechaSeleccionada);

    this.diasCalendario = [];

    for (let i = 0; i < totalCeldas; i++) {
      const fecha = new Date(fechaInicio);
      fecha.setDate(fechaInicio.getDate() + i);

      const fechaTexto = this.formatoFecha(fecha);

      this.diasCalendario.push({
        fecha,
        numero: fecha.getDate(),
        esMesActual: fecha.getMonth() === this.mesActual.getMonth(),
        esHoy: fechaTexto === hoy,
        seleccionado: fechaTexto === seleccionada,
        eventos: this.eventosFiltrados.filter(
          evento => evento.fecha === fechaTexto
        )
      });
    }
  }

  seleccionarDia(dia: DiaCalendario): void {
    this.fechaSeleccionada = new Date(dia.fecha);
    this.actualizarEventosDelDia();
    this.generarCalendario();
  }

  actualizarEventosDelDia(): void {
    const fecha = this.formatoFecha(this.fechaSeleccionada);

    this.eventosDelDia = this.eventosFiltrados.filter(
      evento => evento.fecha === fecha
    );
  }

  cambiarMes(direccion: number): void {
    this.mesActual = new Date(
      this.mesActual.getFullYear(),
      this.mesActual.getMonth() + direccion,
      1
    );

    this.generarCalendario();
  }

  irAHoy(): void {
    this.fechaActual = new Date();
    this.mesActual = new Date(
      this.fechaActual.getFullYear(),
      this.fechaActual.getMonth(),
      1
    );

    this.fechaSeleccionada = new Date(this.fechaActual);

    this.generarCalendario();
    this.actualizarEventosDelDia();
  }

  cambiarFiltro(tipo: TipoEvento): void {
    if (tipo === 'tarea') {
      this.mostrarTareas = !this.mostrarTareas;
    } else {
      this.mostrarAnuncios = !this.mostrarAnuncios;
    }

    this.generarCalendario();
    this.actualizarEventosDelDia();
  }

  nombreDiaSeleccionado(): string {
    return this.fechaSeleccionada.toLocaleDateString('es-CO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  cerrarSesion(): void {
    localStorage.removeItem('usuarioActual');
    this.router.navigate(['/']);
  }
}
