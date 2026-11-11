
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type PeriodoAcademico =
  | 'Primer periodo'
  | 'Segundo periodo'
  | 'Tercer periodo'
  | 'Cuarto periodo';

export const PERIODOS_ACADEMICOS: PeriodoAcademico[] = [
  'Primer periodo',
  'Segundo periodo',
  'Tercer periodo',
  'Cuarto periodo'
];

export interface AsignacionDocente {
  grado: string;
  asignatura: string;
  documentoProfesor: string;
}

export interface Entrega {
  id: string;
  tareaId?: string;
  titulo: string;
  asignatura: string;
  fechaTarea: string;
  nombreEstudiante: string;
  documentoEstudiante: string;
  grado: string;
  profesorDocumento: string;
  nombreArchivo: string;
  fechaEntrega: string;
  estado: 'Pendiente de revisión' | 'Revisada';
  retroalimentacion?: string;
  calificacion?: number | null;
  periodo?: PeriodoAcademico;
  numeroNota?: number | null;
}

export interface TareaPublicada {
  id: string;
  titulo: string;
  contenido: string;
  asignatura: string;
  grado: string;
  fechaEntrega: string;
  profesorDocumento: string;
  nombreProfesor: string;
  nombreArchivo: string;
  fechaPublicacion: string;
  periodo?: PeriodoAcademico;
}

export interface AnuncioPublicado {
  id: string;
  titulo: string;
  mensaje: string;
  grado: string;
  profesorDocumento: string;
  nombreProfesor: string;
  fecha: string;
}

@Injectable({
  providedIn: 'root'
})
export class EntregaService {

  private readonly STORAGE_KEY = 'entregasColegio';
  private readonly TAREAS_STORAGE_KEY = 'tareasColegio';
  private readonly ANUNCIOS_STORAGE_KEY = 'anunciosColegio';

  // ==========================================
  // ASIGNACIONES DE LOS PROFESORES
  // ==========================================

  asignacionesDocentes: AsignacionDocente[] = [
    { grado: 'Sexto', asignatura: 'Matemáticas', documentoProfesor: '1234567890' },
    { grado: 'Sexto', asignatura: 'Español', documentoProfesor: '1020304050' },
    { grado: 'Séptimo', asignatura: 'Matemáticas', documentoProfesor: '1020304050' },
    { grado: 'Octavo', asignatura: 'Biología', documentoProfesor: '5060708090' },
    { grado: 'Noveno', asignatura: 'Matemáticas', documentoProfesor: '1234567890' },
    { grado: 'Noveno', asignatura: 'Español', documentoProfesor: '1020304050' },
    { grado: 'Noveno', asignatura: 'Biología', documentoProfesor: '5060708090' },
    { grado: 'Noveno', asignatura: 'Estadística', documentoProfesor: '1234567890' },
    { grado: 'Décimo', asignatura: 'Matemáticas', documentoProfesor: '1234567890' },
    { grado: 'Undécimo', asignatura: 'Español', documentoProfesor: '1020304050' }
  ];

  private archivos = new Map<string, File>();
  private archivosTareas = new Map<string, File>();

  // ==========================================
  // OBSERVABLES
  // ==========================================

  private entregasSubject = new BehaviorSubject<Entrega[]>(
    this.obtenerEntregasGuardadas()
  );

  entregas$ = this.entregasSubject.asObservable();

  private tareasSubject = new BehaviorSubject<TareaPublicada[]>(
    this.obtenerTareasGuardadas()
  );

  tareas$ = this.tareasSubject.asObservable();

  private anunciosSubject = new BehaviorSubject<AnuncioPublicado[]>(
    this.obtenerAnunciosGuardados()
  );

  anuncios$ = this.anunciosSubject.asObservable();

  // ==========================================
  // NORMALIZAR TEXTO
  // ==========================================

  private normalizarTexto(texto: string): string {
    return String(texto || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }

  private normalizarPeriodo(periodo?: string | null): PeriodoAcademico {
    return PERIODOS_ACADEMICOS.includes(periodo as PeriodoAcademico)
      ? periodo as PeriodoAcademico
      : 'Primer periodo';
  }

  // ==========================================
  // CONSULTAR PROFESOR ASIGNADO
  // ==========================================

  obtenerProfesorAsignado(grado: string, asignatura: string): string | null {
    const asignacion = this.asignacionesDocentes.find(a =>
      this.normalizarTexto(a.grado) === this.normalizarTexto(grado) &&
      this.normalizarTexto(a.asignatura) === this.normalizarTexto(asignatura)
    );

    return asignacion?.documentoProfesor || null;
  }

  // ==========================================
  // OBTENER GRADOS POR ASIGNATURA
  // ==========================================

  obtenerGradosProfesor(documentoProfesor: string, asignatura: string): string[] {
    const documento = String(documentoProfesor || '').trim();

    const grados = this.asignacionesDocentes
      .filter(a =>
        a.documentoProfesor.trim() === documento &&
        this.normalizarTexto(a.asignatura) === this.normalizarTexto(asignatura)
      )
      .map(a => a.grado);

    return [...new Set(grados)];
  }

  // ==========================================
  // OBTENER TODOS LOS GRADOS DE UN PROFESOR
  // ==========================================

  obtenerGradosAsignados(documentoProfesor: string): string[] {
    const documento = String(documentoProfesor || '').trim();

    const grados = this.asignacionesDocentes
      .filter(asignacion =>
        asignacion.documentoProfesor.trim() === documento
      )
      .map(asignacion => asignacion.grado);

    return [...new Set(grados)].sort((a, b) =>
      a.localeCompare(b, 'es')
    );
  }

  // ==========================================
  // PUBLICAR TAREA
  // ==========================================

  publicarTarea(
    datos: Omit<TareaPublicada, 'id' | 'fechaPublicacion' | 'nombreArchivo'>,
    archivo?: File | null
  ): TareaPublicada {

    const documento = String(datos.profesorDocumento || '').trim();

    const asignacionValida = this.asignacionesDocentes.some(a =>
      a.documentoProfesor.trim() === documento &&
      this.normalizarTexto(a.grado) === this.normalizarTexto(datos.grado) &&
      this.normalizarTexto(a.asignatura) === this.normalizarTexto(datos.asignatura)
    );

    if (!asignacionValida) {
      throw new Error('No tienes asignada esta materia para el grado seleccionado.');
    }

    this.validarArchivoTarea(archivo);

    const nuevaTarea: TareaPublicada = {
      ...datos,
      periodo: this.normalizarPeriodo(datos.periodo),
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      profesorDocumento: documento,
      nombreArchivo: archivo?.name || '',
      fechaPublicacion: new Date().toISOString()
    };

    if (archivo) {
      this.archivosTareas.set(nuevaTarea.id, archivo);
    }

    this.guardarTareas([
      nuevaTarea,
      ...this.obtenerTareasGuardadas()
    ]);

    return nuevaTarea;
  }

  // ==========================================
  // VALIDAR PDF
  // ==========================================

  private validarArchivoTarea(archivo?: File | null): void {
    if (!archivo) return;

    const esPDF =
      archivo.type === 'application/pdf' ||
      archivo.name.toLowerCase().endsWith('.pdf');

    if (!esPDF) {
      throw new Error('El archivo debe estar en formato PDF.');
    }

    if (archivo.size > 10 * 1024 * 1024) {
      throw new Error('El archivo PDF no puede superar los 10 MB.');
    }
  }

  // ==========================================
  // ACTUALIZAR TAREA EXISTENTE
  // ==========================================

  actualizarTarea(
    id: string,
    datos: Omit<TareaPublicada, 'id' | 'fechaPublicacion' | 'nombreArchivo'>,
    archivo?: File | null
  ): TareaPublicada {

    const tareas = this.obtenerTareasGuardadas();
    const tareaActual = tareas.find(tarea => tarea.id === id);

    if (!tareaActual) {
      throw new Error('No se encontró la tarea que deseas editar.');
    }

    const documento = String(datos.profesorDocumento || '').trim();

    if (String(tareaActual.profesorDocumento).trim() !== documento) {
      throw new Error('No tienes permiso para editar esta tarea.');
    }

    const asignacionValida = this.asignacionesDocentes.some(a =>
      a.documentoProfesor.trim() === documento &&
      this.normalizarTexto(a.grado) === this.normalizarTexto(datos.grado) &&
      this.normalizarTexto(a.asignatura) === this.normalizarTexto(datos.asignatura)
    );

    if (!asignacionValida) {
      throw new Error('No tienes asignada esta materia para el grado seleccionado.');
    }

    this.validarArchivoTarea(archivo);

    const tareaActualizada: TareaPublicada = {
      ...tareaActual,
      ...datos,
      id: tareaActual.id,
      profesorDocumento: documento,
      periodo: this.normalizarPeriodo(datos.periodo),
      nombreArchivo: archivo
        ? archivo.name
        : tareaActual.nombreArchivo,
      fechaPublicacion: tareaActual.fechaPublicacion
    };

    if (archivo) {
      this.archivosTareas.set(id, archivo);
    }

    const tareasActualizadas = tareas.map(tarea =>
      tarea.id === id ? tareaActualizada : tarea
    );

    this.guardarTareas(tareasActualizadas);

    // Actualizar los datos descriptivos de las entregas existentes.
    // No se modifican notas, retroalimentaciones ni estados.
    const entregasActualizadas = this.entregasSubject.value.map(entrega => {
      if (entrega.tareaId !== id) return entrega;

      return {
        ...entrega,
        titulo: tareaActualizada.titulo,
        asignatura: tareaActualizada.asignatura,
        fechaTarea: tareaActualizada.fechaEntrega,
        grado: tareaActualizada.grado,
        profesorDocumento: tareaActualizada.profesorDocumento,
        periodo: tareaActualizada.periodo
      };
    });

    if (entregasActualizadas.some(entrega => entrega.tareaId === id)) {
      this.guardarEntregas(entregasActualizadas);
    }

    return tareaActualizada;
  }

  // ==========================================
  // CONSULTAR TAREAS DEL PROFESOR
  // ==========================================

  obtenerTareasProfesor(documentoProfesor: string, asignatura?: string): TareaPublicada[] {
    const documento = String(documentoProfesor || '').trim();

    return this.obtenerTareasGuardadas().filter(tarea =>
      String(tarea.profesorDocumento || '').trim() === documento &&
      (
        !asignatura ||
        this.normalizarTexto(tarea.asignatura) === this.normalizarTexto(asignatura)
      )
    );
  }

  sincronizarTareasDesdeStorage(): void {
    this.tareasSubject.next(this.obtenerTareasGuardadas());
  }

  // ==========================================
  // CONSULTAR TAREAS DEL ESTUDIANTE
  // ==========================================

  obtenerTareasEstudiante(grado: string, asignatura?: string): TareaPublicada[] {
    return this.obtenerTareasGuardadas().filter(tarea =>
      this.normalizarTexto(tarea.grado) === this.normalizarTexto(grado) &&
      (
        !asignatura ||
        this.normalizarTexto(tarea.asignatura) === this.normalizarTexto(asignatura)
      )
    );
  }

  obtenerArchivoTarea(id: string): File | null {
    return this.archivosTareas.get(id) || null;
  }

  private guardarTareas(tareas: TareaPublicada[]): void {
    localStorage.setItem(this.TAREAS_STORAGE_KEY, JSON.stringify(tareas));
    this.tareasSubject.next(tareas);
  }

  private obtenerTareasGuardadas(): TareaPublicada[] {
    const datos = localStorage.getItem(this.TAREAS_STORAGE_KEY);

    if (!datos) return [];

    try {
      const tareas = JSON.parse(datos);

      if (!Array.isArray(tareas)) return [];

      return tareas.map((tarea: TareaPublicada) => ({
        ...tarea,
        periodo: this.normalizarPeriodo(tarea.periodo)
      }));
    } catch (error) {
      console.error('Error al recuperar las tareas:', error);
      return [];
    }
  }

  // ==========================================
  // ANUNCIOS
  // ==========================================

  publicarAnuncio(datos: Omit<AnuncioPublicado, 'id' | 'fecha'>): AnuncioPublicado {
    const documento = String(datos.profesorDocumento || '').trim();
    const grado = String(datos.grado || '').trim();

    if (!documento || !grado) {
      throw new Error('No se encontró el profesor o el grado del anuncio.');
    }

    if (!datos.titulo.trim() || !datos.mensaje.trim()) {
      throw new Error('Completa el título y el mensaje del anuncio.');
    }

    const tieneAsignacion = this.asignacionesDocentes.some(asignacion =>
      asignacion.documentoProfesor.trim() === documento &&
      this.normalizarTexto(asignacion.grado) === this.normalizarTexto(grado)
    );

    if (!tieneAsignacion) {
      throw new Error('No tienes asignaciones para publicar anuncios en este grado.');
    }

    const nuevoAnuncio: AnuncioPublicado = {
      ...datos,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      titulo: datos.titulo.trim(),
      mensaje: datos.mensaje.trim(),
      grado,
      profesorDocumento: documento,
      fecha: new Date().toISOString()
    };

    this.guardarAnuncios([
      nuevoAnuncio,
      ...this.obtenerAnunciosGuardados()
    ]);

    return nuevoAnuncio;
  }

  obtenerAnunciosProfesor(documentoProfesor: string): AnuncioPublicado[] {
    const documento = String(documentoProfesor || '').trim();

    return this.obtenerAnunciosGuardados().filter(anuncio =>
      String(anuncio.profesorDocumento || '').trim() === documento
    );
  }

  obtenerAnunciosGrado(grado: string): AnuncioPublicado[] {
    return this.obtenerAnunciosGuardados().filter(anuncio =>
      this.normalizarTexto(anuncio.grado) === this.normalizarTexto(grado)
    );
  }

  sincronizarAnunciosDesdeStorage(): void {
    this.anunciosSubject.next(this.obtenerAnunciosGuardados());
  }

  private guardarAnuncios(anuncios: AnuncioPublicado[]): void {
    localStorage.setItem(this.ANUNCIOS_STORAGE_KEY, JSON.stringify(anuncios));
    this.anunciosSubject.next(anuncios);
  }

  private obtenerAnunciosGuardados(): AnuncioPublicado[] {
    const datos = localStorage.getItem(this.ANUNCIOS_STORAGE_KEY);

    if (!datos) return [];

    try {
      const anuncios = JSON.parse(datos);
      return Array.isArray(anuncios) ? anuncios : [];
    } catch (error) {
      console.error('Error al recuperar los anuncios:', error);
      return [];
    }
  }

  // ==========================================
  // REGISTRAR ENTREGA
  // ==========================================

  registrarEntrega(tarea: TareaPublicada, archivo: File): void {
    const usuarioGuardado = localStorage.getItem('usuarioActual');

    if (!usuarioGuardado) {
      throw new Error('No se encontró la sesión del estudiante.');
    }

    let usuario: any;

    try {
      usuario = JSON.parse(usuarioGuardado);
    } catch {
      throw new Error('La información del estudiante no es válida.');
    }

    if (!usuario || typeof usuario !== 'object') {
      throw new Error('Los datos del estudiante no son válidos.');
    }

    const gradoEstudiante = String(
      usuario.grado ??
      usuario.gradoEstudiante ??
      usuario.curso ??
      usuario.nivel ??
      ''
    ).trim();

    const documentoEstudiante = String(
      usuario.documento ??
      usuario.documentoEstudiante ??
      usuario.numeroDocumento ??
      usuario.identificacion ??
      ''
    ).trim();

    const nombreEstudiante = String(
      usuario.nombre ??
      usuario.nombreEstudiante ??
      usuario.nombres ??
      usuario.nombreCompleto ??
      'Estudiante'
    ).trim();

    if (!documentoEstudiante || !gradoEstudiante) {
      throw new Error('Faltan datos del estudiante. Verifica su documento y grado.');
    }

    if (this.normalizarTexto(gradoEstudiante) !== this.normalizarTexto(tarea.grado)) {
      throw new Error('Esta actividad no corresponde a tu grado.');
    }

    const tareaGuardada = this.obtenerTareasGuardadas().find(t => t.id === tarea.id);

    if (!tareaGuardada) {
      throw new Error('No se encontró la actividad seleccionada.');
    }

    if (!archivo) {
      throw new Error('Debes seleccionar un archivo PDF.');
    }

    if (
      archivo.type !== 'application/pdf' &&
      !archivo.name.toLowerCase().endsWith('.pdf')
    ) {
      throw new Error('El archivo debe ser un PDF.');
    }

    if (archivo.size > 10 * 1024 * 1024) {
      throw new Error('El archivo supera el límite de 10 MB.');
    }

    const entregasActuales = this.entregasSubject.value;

    const duplicada = entregasActuales.some(entrega =>
      entrega.tareaId === tarea.id &&
      entrega.documentoEstudiante === documentoEstudiante
    );

    if (duplicada) {
      throw new Error('Ya has entregado esta actividad.');
    }

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const nuevaEntrega: Entrega = {
      id,
      tareaId: tarea.id,
      titulo: tarea.titulo,
      asignatura: tarea.asignatura,
      fechaTarea: tarea.fechaEntrega,
      nombreEstudiante,
      documentoEstudiante,
      grado: tarea.grado,
      profesorDocumento: tarea.profesorDocumento,
      nombreArchivo: archivo.name,
      fechaEntrega: new Date().toISOString(),
      estado: 'Pendiente de revisión',
      retroalimentacion: '',
      calificacion: null,
      periodo: this.normalizarPeriodo(tareaGuardada.periodo),
      numeroNota: null
    };

    this.archivos.set(id, archivo);

    this.guardarEntregas([
      nuevaEntrega,
      ...entregasActuales
    ]);
  }

  // ==========================================
  // CONSULTAR ENTREGAS
  // ==========================================

  obtenerEntregasProfesor(documentoProfesor: string): Entrega[] {
    const documento = String(documentoProfesor || '').trim();

    return this.entregasSubject.value.filter(entrega =>
      String(entrega.profesorDocumento || '').trim() === documento
    );
  }

  obtenerEntregasEstudiante(documentoEstudiante: string): Entrega[] {
    const documento = String(documentoEstudiante || '').trim();

    return this.entregasSubject.value.filter(entrega =>
      String(entrega.documentoEstudiante || '').trim() === documento
    );
  }

  obtenerEntregasPorTarea(
    documentoProfesor: string,
    titulo: string,
    asignatura: string,
    grado: string
  ): Entrega[] {
    return this.obtenerEntregasProfesor(documentoProfesor).filter(entrega =>
      entrega.titulo === titulo &&
      entrega.asignatura === asignatura &&
      this.normalizarTexto(entrega.grado) === this.normalizarTexto(grado)
    );
  }

  obtenerArchivo(id: string): File | null {
    return this.archivos.get(id) || null;
  }

  marcarRevisada(id: string): void {
    const actualizadas = this.entregasSubject.value.map(entrega =>
      entrega.id === id
        ? { ...entrega, estado: 'Revisada' as const }
        : entrega
    );

    this.guardarEntregas(actualizadas);
  }

  // ==========================================
  // GUARDAR CALIFICACIÓN
  // ==========================================

  guardarCalificacion(
    id: string,
    calificacion: number,
    comentario: string = ''
  ): void {
    const nota = Number(calificacion);

    if (!Number.isFinite(nota) || nota < 1 || nota > 5) {
      throw new Error('La calificación debe estar entre 1.0 y 5.0.');
    }

    const notaRedondeada = Math.round(nota * 10) / 10;
    const entregas = this.entregasSubject.value;
    const entregaActual = entregas.find(e => e.id === id);

    if (!entregaActual) {
      throw new Error('No se encontró la entrega.');
    }

    const periodo = this.normalizarPeriodo(entregaActual.periodo);

    const perteneceAlMismoGrupo = (entrega: Entrega) =>
      entrega.documentoEstudiante === entregaActual.documentoEstudiante &&
      this.normalizarTexto(entrega.asignatura) === this.normalizarTexto(entregaActual.asignatura) &&
      this.normalizarTexto(entrega.grado) === this.normalizarTexto(entregaActual.grado) &&
      this.normalizarPeriodo(entrega.periodo) === periodo &&
      entrega.id !== id &&
      entrega.calificacion !== null &&
      entrega.calificacion !== undefined;

    const notasDelGrupo = entregas
      .filter(perteneceAlMismoGrupo)
      .sort((a, b) =>
        new Date(a.fechaEntrega).getTime() - new Date(b.fechaEntrega).getTime()
      );

    let numeroNota = entregaActual.numeroNota || null;

    if (!numeroNota) {
      const ocupadas = new Set(
        notasDelGrupo.map(entrega => entrega.numeroNota).filter(Boolean)
      );

      notasDelGrupo.forEach((entrega, index) => {
        if (!entrega.numeroNota) ocupadas.add(index + 1);
      });

      numeroNota = [1, 2, 3, 4].find(numero => !ocupadas.has(numero)) || null;
    }

    if (!numeroNota || numeroNota < 1 || numeroNota > 4) {
      throw new Error(
        'Este estudiante ya tiene cuatro calificaciones registradas en este periodo para esta materia y grado.'
      );
    }

    const actualizadas = entregas.map(entrega =>
      entrega.id === id
        ? {
            ...entrega,
            periodo,
            numeroNota,
            calificacion: notaRedondeada,
            retroalimentacion: comentario.trim(),
            estado: 'Revisada' as const
          }
        : entrega
    );

    this.guardarEntregas(actualizadas);
  }

  // ==========================================
  // GUARDAR RETROALIMENTACIÓN
  // ==========================================

  guardarRetroalimentacion(id: string, comentario: string): void {
    const existe = this.entregasSubject.value.some(e => e.id === id);

    if (!existe) {
      console.error('No se encontró la entrega:', id);
      return;
    }

    const actualizadas = this.entregasSubject.value.map(entrega =>
      entrega.id === id
        ? { ...entrega, retroalimentacion: comentario.trim() }
        : entrega
    );

    this.guardarEntregas(actualizadas);
  }

  obtenerEntregaPorId(id: string): Entrega | undefined {
    return this.entregasSubject.value.find(e => e.id === id);
  }

  obtenerCalificaciones(): Entrega[] {
    return this.entregasSubject.value.filter(entrega =>
      entrega.calificacion !== null &&
      entrega.calificacion !== undefined
    );
  }

  // ==========================================
  // GUARDAR ENTREGAS
  // ==========================================

  private guardarEntregas(entregas: Entrega[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(entregas));
    this.entregasSubject.next(entregas);
  }

  // ==========================================
  // RECUPERAR ENTREGAS
  // ==========================================

  private obtenerEntregasGuardadas(): Entrega[] {
    const datos = localStorage.getItem(this.STORAGE_KEY);

    if (!datos) return [];

    try {
      const entregas = JSON.parse(datos);

      if (!Array.isArray(entregas)) return [];

      const tareas = this.obtenerTareasGuardadas();

      const entregasNormalizadas: Entrega[] = entregas.map((entrega: Entrega) => {
        const tareaRelacionada = tareas.find(tarea =>
          tarea.id === entrega.tareaId
        );

        return {
          ...entrega,
          periodo: this.normalizarPeriodo(
            entrega.periodo || tareaRelacionada?.periodo
          ),
          numeroNota: entrega.numeroNota ?? null,
          retroalimentacion: entrega.retroalimentacion || '',
          calificacion:
            typeof entrega.calificacion === 'number'
              ? entrega.calificacion
              : null
        };
      });

      const grupos = new Map<string, Entrega[]>();

      entregasNormalizadas
        .filter(entrega => entrega.calificacion !== null)
        .forEach(entrega => {
          const llave = [
            entrega.documentoEstudiante,
            this.normalizarTexto(entrega.asignatura),
            this.normalizarTexto(entrega.grado),
            this.normalizarPeriodo(entrega.periodo)
          ].join('|');

          if (!grupos.has(llave)) grupos.set(llave, []);
          grupos.get(llave)!.push(entrega);
        });

      grupos.forEach(grupo => {
        grupo.sort((a, b) =>
          new Date(a.fechaEntrega).getTime() - new Date(b.fechaEntrega).getTime()
        );

        grupo.forEach((entrega, index) => {
          if (!entrega.numeroNota) {
            entrega.numeroNota = index + 1 <= 4 ? index + 1 : null;
          }
        });
      });

      return entregasNormalizadas;

    } catch (error) {
      console.error('Error al recuperar las entregas:', error);
      return [];
    }
  }

}
