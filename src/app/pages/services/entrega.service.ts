
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

// ==========================================
// 1. INTERFACES
// ==========================================

export interface AsignacionDocente {
  grado: string;
  asignatura: string;
  documentoProfesor: string;
}

export interface Entrega {
  id: string;
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
}

// Nueva interfaz para tareas publicadas por los profesores.
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
}

// ==========================================
// 2. SERVICIO
// ==========================================

@Injectable({
  providedIn: 'root'
})
export class EntregaService {

  private readonly STORAGE_KEY = 'entregasColegio';
  private readonly TAREAS_STORAGE_KEY = 'tareasColegio';

  // ==========================================
  // 3. ASIGNACIONES DOCENTES
  // ==========================================

  asignacionesDocentes: AsignacionDocente[] = [

    {
      grado: 'Sexto',
      asignatura: 'Matemáticas',
      documentoProfesor: '1234567890'
    },
    {
      grado: 'Sexto',
      asignatura: 'Español',
      documentoProfesor: '1020304050'
    },
    {
      grado: 'Séptimo',
      asignatura: 'Matemáticas',
      documentoProfesor: '1020304050'
    },
    {
      grado: 'Octavo',
      asignatura: 'Biología',
      documentoProfesor: '5060708090'
    },
    {
      grado: 'Noveno',
      asignatura: 'Matemáticas',
      documentoProfesor: '1234567890'
    },
    {
      grado: 'Noveno',
      asignatura: 'Español',
      documentoProfesor: '1020304050'
    },
    {
      grado: 'Noveno',
      asignatura: 'Biología',
      documentoProfesor: '5060708090'
    },
    {
      grado: 'Noveno',
      asignatura: 'Estadística',
      documentoProfesor: '1234567890'
    },
    {
      grado: 'Décimo',
      asignatura: 'Matemáticas',
      documentoProfesor: '1234567890'
    },
    {
      grado: 'Undécimo',
      asignatura: 'Español',
      documentoProfesor: '1020304050'
    }

  ];

  // ==========================================
  // 4. ARCHIVOS EN MEMORIA
  // ==========================================

  private archivos = new Map<string, File>();

  // Archivos PDF adjuntos a las tareas.
  private archivosTareas = new Map<string, File>();

  // ==========================================
  // 5. ENTREGAS COMPARTIDAS
  // ==========================================

  private entregasSubject = new BehaviorSubject<Entrega[]>(
    this.obtenerEntregasGuardadas()
  );

  entregas$ = this.entregasSubject.asObservable();

  // ==========================================
  // 6. TAREAS PUBLICADAS COMPARTIDAS
  // ==========================================

  private tareasSubject = new BehaviorSubject<TareaPublicada[]>(
    this.obtenerTareasGuardadas()
  );

  tareas$ = this.tareasSubject.asObservable();

  // ==========================================
  // 7. NORMALIZAR TEXTOS
  // ==========================================

  private normalizarTexto(texto: string): string {

    return (texto || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();

  }

  // ==========================================
  // 8. BUSCAR PROFESOR ASIGNADO
  // ==========================================

  obtenerProfesorAsignado(
    grado: string,
    asignatura: string
  ): string | null {

    const gradoBuscado = this.normalizarTexto(grado);
    const asignaturaBuscada = this.normalizarTexto(asignatura);

    const asignacion = this.asignacionesDocentes.find(
      a =>
        this.normalizarTexto(a.grado) === gradoBuscado &&
        this.normalizarTexto(a.asignatura) === asignaturaBuscada
    );

    return asignacion?.documentoProfesor || null;

  }

  // ==========================================
  // 9. OBTENER GRADOS DE UNA MATERIA
  // ==========================================

  obtenerGradosProfesor(
    documentoProfesor: string,
    asignatura: string
  ): string[] {

    const documento = String(documentoProfesor || '').trim();

    const grados = this.asignacionesDocentes
      .filter(a =>
        a.documentoProfesor.trim() === documento &&
        this.normalizarTexto(a.asignatura) ===
        this.normalizarTexto(asignatura)
      )
      .map(a => a.grado);

    return [...new Set(grados)];

  }

  // ==========================================
  // 10. PUBLICAR TAREA
  // ==========================================

  publicarTarea(
    datos: Omit<TareaPublicada, 'id' | 'fechaPublicacion' | 'nombreArchivo'>,
    archivo?: File | null
  ): TareaPublicada {

    const documento = String(datos.profesorDocumento || '').trim();

    // Comprobar que el profesor tenga asignada esa materia y grado.
    const asignacionValida = this.asignacionesDocentes.some(a =>
      a.documentoProfesor.trim() === documento &&
      this.normalizarTexto(a.grado) ===
      this.normalizarTexto(datos.grado) &&
      this.normalizarTexto(a.asignatura) ===
      this.normalizarTexto(datos.asignatura)
    );

    if (!asignacionValida) {
      throw new Error(
        'No tienes asignada esta materia para el grado seleccionado.'
      );
    }

    if (archivo && archivo.type !== 'application/pdf') {
      throw new Error('El archivo debe estar en formato PDF.');
    }

    if (archivo && archivo.size > 10 * 1024 * 1024) {
      throw new Error('El archivo PDF no puede superar los 10 MB.');
    }

    const nuevaTarea: TareaPublicada = {

      ...datos,

      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,

      profesorDocumento: documento,

      nombreArchivo: archivo?.name || '',

      fechaPublicacion: new Date().toISOString()

    };

    // Guardar el archivo en memoria.
    if (archivo) {
      this.archivosTareas.set(nuevaTarea.id, archivo);
    }

    // Guardar la nueva tarea.
    const tareasActualizadas = [
      nuevaTarea,
      ...this.tareasSubject.value
    ];

    this.guardarTareas(tareasActualizadas);

    return nuevaTarea;

  }

  // ==========================================
  // 11. OBTENER TAREAS DE UN PROFESOR
  // ==========================================

  obtenerTareasProfesor(
    documentoProfesor: string,
    asignatura?: string
  ): TareaPublicada[] {

    const documento = String(documentoProfesor || '').trim();

    return this.tareasSubject.value.filter(tarea => {

      const perteneceProfesor =
        tarea.profesorDocumento.trim() === documento;

      const perteneceMateria = !asignatura ||
        this.normalizarTexto(tarea.asignatura) ===
        this.normalizarTexto(asignatura);

      return perteneceProfesor && perteneceMateria;

    });

  }

  // ==========================================
  // 12. OBTENER TAREAS DE UN ESTUDIANTE
  // ==========================================

  obtenerTareasEstudiante(
    grado: string,
    asignatura?: string
  ): TareaPublicada[] {

    return this.tareasSubject.value.filter(tarea => {

      const perteneceGrado =
        this.normalizarTexto(tarea.grado) ===
        this.normalizarTexto(grado);

      const perteneceMateria = !asignatura ||
        this.normalizarTexto(tarea.asignatura) ===
        this.normalizarTexto(asignatura);

      return perteneceGrado && perteneceMateria;

    });

  }

  // ==========================================
  // 13. OBTENER PDF DE UNA TAREA
  // ==========================================

  obtenerArchivoTarea(id: string): File | null {

    return this.archivosTareas.get(id) || null;

  }

  // ==========================================
  // 14. GUARDAR TAREAS
  // ==========================================

  private guardarTareas(tareas: TareaPublicada[]): void {

    localStorage.setItem(
      this.TAREAS_STORAGE_KEY,
      JSON.stringify(tareas)
    );

    this.tareasSubject.next(tareas);

  }

  // ==========================================
  // 15. RECUPERAR TAREAS
  // ==========================================

  private obtenerTareasGuardadas(): TareaPublicada[] {

    const datos = localStorage.getItem(this.TAREAS_STORAGE_KEY);

    if (!datos) {
      return [];
    }

    try {

      return JSON.parse(datos) as TareaPublicada[];

    } catch (error) {

      console.error('Error al recuperar las tareas:', error);

      return [];

    }

  }

  // ==========================================
  // 16. REGISTRAR ENTREGA DEL ESTUDIANTE
  // ==========================================

  registrarEntrega(
    titulo: string,
    asignatura: string,
    fechaTarea: string,
    archivo: File
  ): void {

    const usuarioGuardado = localStorage.getItem('usuarioActual');

    if (!usuarioGuardado) {
      throw new Error('No se encontró la sesión del estudiante.');
    }

    const usuario = JSON.parse(usuarioGuardado);

    const grado = usuario.grado;

    if (!grado) {
      throw new Error('El estudiante no tiene un grado asignado.');
    }

    const profesorDocumento = this.obtenerProfesorAsignado(
      grado,
      asignatura
    );

    if (!profesorDocumento) {
      throw new Error(
        `No hay un profesor asignado a ${asignatura} en ${grado}.`
      );
    }

    const id =
      `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const nuevaEntrega: Entrega = {

      id,
      titulo,
      asignatura,
      fechaTarea,

      nombreEstudiante: usuario.nombre || 'Estudiante',

      documentoEstudiante: String(usuario.documento || '').trim(),

      grado,

      profesorDocumento,

      nombreArchivo: archivo.name,

      fechaEntrega: new Date().toISOString(),

      estado: 'Pendiente de revisión',

      retroalimentacion: ''

    };

    this.archivos.set(id, archivo);

    const entregasActualizadas = [
      nuevaEntrega,
      ...this.entregasSubject.value
    ];

    this.guardarEntregas(entregasActualizadas);

  }

  // ==========================================
  // 17. OBTENER ENTREGAS DE UN PROFESOR
  // ==========================================

  obtenerEntregasProfesor(
    documentoProfesor: string
  ): Entrega[] {

    const documento = String(documentoProfesor || '').trim();

    return this.entregasSubject.value.filter(
      entrega =>
        String(entrega.profesorDocumento || '').trim() === documento
    );

  }

  // ==========================================
  // 18. OBTENER ENTREGAS DE UN ESTUDIANTE
  // ==========================================

  obtenerEntregasEstudiante(
    documentoEstudiante: string
  ): Entrega[] {

    const documento = String(documentoEstudiante || '').trim();

    return this.entregasSubject.value.filter(
      entrega =>
        String(entrega.documentoEstudiante || '').trim() === documento
    );

  }

  // ==========================================
  // 19. OBTENER ENTREGAS DE UNA TAREA
  // ==========================================

  obtenerEntregasPorTarea(
    documentoProfesor: string,
    titulo: string,
    asignatura: string,
    grado: string
  ): Entrega[] {

    return this.obtenerEntregasProfesor(documentoProfesor).filter(
      entrega =>
        entrega.titulo === titulo &&
        entrega.asignatura === asignatura &&
        entrega.grado === grado
    );

  }

  // ==========================================
  // 20. OBTENER ARCHIVO DE ENTREGA
  // ==========================================

  obtenerArchivo(id: string): File | null {

    return this.archivos.get(id) || null;

  }

  // ==========================================
  // 21. MARCAR ENTREGA COMO REVISADA
  // ==========================================

  marcarRevisada(id: string): void {

    const entregasActualizadas = this.entregasSubject.value.map(
      entrega =>
        entrega.id === id
          ? {
              ...entrega,
              estado: 'Revisada' as const
            }
          : entrega
    );

    this.guardarEntregas(entregasActualizadas);

  }

  // ==========================================
  // 22. GUARDAR RETROALIMENTACIÓN
  // ==========================================

  guardarRetroalimentacion(
    id: string,
    comentario: string
  ): void {

    const entregaExiste = this.entregasSubject.value.some(
      entrega => entrega.id === id
    );

    if (!entregaExiste) {
      console.error('No se encontró la entrega:', id);
      return;
    }

    const entregasActualizadas = this.entregasSubject.value.map(
      entrega =>
        entrega.id === id
          ? {
              ...entrega,
              retroalimentacion: comentario.trim()
            }
          : entrega
    );

    this.guardarEntregas(entregasActualizadas);

  }

  // ==========================================
  // 23. OBTENER ENTREGA POR ID
  // ==========================================

  obtenerEntregaPorId(id: string): Entrega | undefined {

    return this.entregasSubject.value.find(
      entrega => entrega.id === id
    );

  }

  // ==========================================
  // 24. GUARDAR ENTREGAS
  // ==========================================

  private guardarEntregas(entregas: Entrega[]): void {

    localStorage.setItem(
      this.STORAGE_KEY,
      JSON.stringify(entregas)
    );

    this.entregasSubject.next(entregas);

  }

  // ==========================================
  // 25. RECUPERAR ENTREGAS
  // ==========================================

  private obtenerEntregasGuardadas(): Entrega[] {

    const datos = localStorage.getItem(this.STORAGE_KEY);

    if (!datos) {
      return [];
    }

    try {

      const entregas = JSON.parse(datos) as Entrega[];

      return entregas.map(entrega => ({
        ...entrega,
        retroalimentacion: entrega.retroalimentacion || ''
      }));

    } catch (error) {

      console.error('Error al recuperar las entregas:', error);

      return [];

    }

  }

}
