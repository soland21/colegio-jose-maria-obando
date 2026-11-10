
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
  private archivosTareas = new Map<string, File>();

  // ==========================================
  // 5. OBSERVABLES DE ENTREGAS
  // ==========================================

  private entregasSubject = new BehaviorSubject<Entrega[]>(
    this.obtenerEntregasGuardadas()
  );

  entregas$ = this.entregasSubject.asObservable();

  // ==========================================
  // 6. OBSERVABLES DE TAREAS
  // ==========================================

  private tareasSubject = new BehaviorSubject<TareaPublicada[]>(
    this.obtenerTareasGuardadas()
  );

  tareas$ = this.tareasSubject.asObservable();

  // ==========================================
  // 7. NORMALIZAR TEXTOS
  // ==========================================

  private normalizarTexto(texto: string): string {

    return String(texto || '')
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

    const asignacion = this.asignacionesDocentes.find(a =>
      this.normalizarTexto(a.grado) ===
        this.normalizarTexto(grado) &&
      this.normalizarTexto(a.asignatura) ===
        this.normalizarTexto(asignatura)
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

    const documento = String(
      datos.profesorDocumento || ''
    ).trim();

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

    if (archivo) {
      this.archivosTareas.set(nuevaTarea.id, archivo);
    }

    const tareasActualizadas = [
      nuevaTarea,
      ...this.obtenerTareasGuardadas()
    ];

    this.guardarTareas(tareasActualizadas);

    console.log('Tarea publicada correctamente:', nuevaTarea);

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

    return this.obtenerTareasGuardadas().filter(tarea => {

      const perteneceProfesor =
        String(tarea.profesorDocumento || '').trim() === documento;

      const perteneceMateria = !asignatura ||
        this.normalizarTexto(tarea.asignatura) ===
        this.normalizarTexto(asignatura);

      return perteneceProfesor && perteneceMateria;
    });
  }

  // ==========================================
  // 12. SINCRONIZAR TAREAS DEL ALMACENAMIENTO
  // ==========================================

  sincronizarTareasDesdeStorage(): void {

    const tareasGuardadas = this.obtenerTareasGuardadas();

    this.tareasSubject.next(tareasGuardadas);

    console.log('Tareas sincronizadas:', tareasGuardadas);
  }

  // ==========================================
  // 13. OBTENER TAREAS DE UN ESTUDIANTE
  // ==========================================

  obtenerTareasEstudiante(
    grado: string,
    asignatura?: string
  ): TareaPublicada[] {

    const gradoEstudiante = this.normalizarTexto(grado);

    const tareasGuardadas = this.obtenerTareasGuardadas();

    const resultado = tareasGuardadas.filter(tarea => {

      const perteneceGrado =
        this.normalizarTexto(tarea.grado) === gradoEstudiante;

      const perteneceMateria = !asignatura ||
        this.normalizarTexto(tarea.asignatura) ===
        this.normalizarTexto(asignatura);

      return perteneceGrado && perteneceMateria;
    });

    console.log('Grado consultado:', grado);
    console.log('Tareas encontradas:', resultado);

    return resultado;
  }

  // ==========================================
  // 14. OBTENER PDF ADJUNTO A UNA TAREA
  // ==========================================

  obtenerArchivoTarea(id: string): File | null {

    return this.archivosTareas.get(id) || null;
  }

  // ==========================================
  // 15. GUARDAR TAREAS
  // ==========================================

  private guardarTareas(tareas: TareaPublicada[]): void {

    localStorage.setItem(
      this.TAREAS_STORAGE_KEY,
      JSON.stringify(tareas)
    );

    this.tareasSubject.next(tareas);
  }

  // ==========================================
  // 16. RECUPERAR TAREAS
  // ==========================================

  private obtenerTareasGuardadas(): TareaPublicada[] {

    const datos = localStorage.getItem(this.TAREAS_STORAGE_KEY);

    if (!datos) {
      return [];
    }

    try {

      const tareas = JSON.parse(datos);

      return Array.isArray(tareas) ? tareas : [];

    } catch (error) {

      console.error('Error al recuperar las tareas:', error);

      return [];
    }
  }

  // ==========================================
  // 17. REGISTRAR ENTREGA DEL ESTUDIANTE
  // ==========================================

  registrarEntrega(
    tarea: TareaPublicada,
    archivo: File
  ): void {

    // ------------------------------------------
    // VALIDAR SESIÓN
    // ------------------------------------------

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

    // ------------------------------------------
    // OBTENER DATOS DEL ESTUDIANTE
    // Se admiten nombres alternativos de propiedades.
    // ------------------------------------------

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

    console.log('========== REGISTRO DE ENTREGA ==========');
    console.log('Usuario guardado:', usuario);
    console.log('Grado obtenido:', gradoEstudiante);
    console.log('Documento obtenido:', documentoEstudiante);
    console.log('Nombre obtenido:', nombreEstudiante);
    console.log('Tarea seleccionada:', tarea);
    console.log('Archivo seleccionado:', archivo);

    // ------------------------------------------
    // VALIDAR DATOS OBLIGATORIOS
    // ------------------------------------------

    if (!documentoEstudiante || !gradoEstudiante) {

      console.error('No se pueden registrar los datos:', {
        usuario,
        gradoEstudiante,
        documentoEstudiante,
        propiedades: Object.keys(usuario)
      });

      throw new Error(
        'Faltan datos del estudiante. Verifica su documento y grado en la sesión.'
      );
    }

    // ------------------------------------------
    // VALIDAR GRADO
    // ------------------------------------------

    if (
      this.normalizarTexto(gradoEstudiante) !==
      this.normalizarTexto(tarea.grado)
    ) {
      throw new Error(
        'Esta actividad no corresponde a tu grado.'
      );
    }

    // ------------------------------------------
    // VALIDAR QUE LA TAREA EXISTA
    // ------------------------------------------

    const tareasActuales = this.obtenerTareasGuardadas();

    const tareaExiste = tareasActuales.some(
      t => t.id === tarea.id
    );

    if (!tareaExiste) {
      throw new Error('No se encontró la actividad seleccionada.');
    }

    // ------------------------------------------
    // VALIDAR ARCHIVO
    // ------------------------------------------

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

    // ------------------------------------------
    // VALIDAR ENTREGA DUPLICADA
    // ------------------------------------------

    const entregasActuales = this.entregasSubject.value;

    const entregaDuplicada = entregasActuales.some(
      entrega =>
        entrega.tareaId === tarea.id &&
        entrega.documentoEstudiante === documentoEstudiante
    );

    if (entregaDuplicada) {
      throw new Error('Ya has entregado esta actividad.');
    }

    // ------------------------------------------
    // CREAR ENTREGA
    // ------------------------------------------

    const id =
      `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

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

      retroalimentacion: ''
    };

    // ------------------------------------------
    // GUARDAR ARCHIVO Y REGISTRO
    // ------------------------------------------

    this.archivos.set(id, archivo);

    this.guardarEntregas([
      nuevaEntrega,
      ...entregasActuales
    ]);

    console.log('Entrega registrada correctamente:', nuevaEntrega);
  }

  // ==========================================
  // 18. OBTENER ENTREGAS DE UN PROFESOR
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
  // 19. OBTENER ENTREGAS DE UN ESTUDIANTE
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
  // 20. OBTENER ENTREGAS DE UNA TAREA
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
        this.normalizarTexto(entrega.grado) ===
        this.normalizarTexto(grado)
    );
  }

  // ==========================================
  // 21. OBTENER ARCHIVO DE ENTREGA
  // ==========================================

  obtenerArchivo(id: string): File | null {

    return this.archivos.get(id) || null;
  }

  // ==========================================
  // 22. MARCAR ENTREGA COMO REVISADA
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
  // 23. GUARDAR RETROALIMENTACIÓN
  // ==========================================

  guardarRetroalimentacion(
    id: string,
    comentario: string
  ): void {

    const existe = this.entregasSubject.value.some(
      entrega => entrega.id === id
    );

    if (!existe) {
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
  // 24. OBTENER ENTREGA POR ID
  // ==========================================

  obtenerEntregaPorId(id: string): Entrega | undefined {

    return this.entregasSubject.value.find(
      entrega => entrega.id === id
    );
  }

  // ==========================================
  // 25. GUARDAR ENTREGAS
  // ==========================================

  private guardarEntregas(entregas: Entrega[]): void {

    localStorage.setItem(
      this.STORAGE_KEY,
      JSON.stringify(entregas)
    );

    this.entregasSubject.next(entregas);
  }

  // ==========================================
  // 26. RECUPERAR ENTREGAS
  // ==========================================

  private obtenerEntregasGuardadas(): Entrega[] {

    const datos = localStorage.getItem(this.STORAGE_KEY);

    if (!datos) {
      return [];
    }

    try {

      const entregas = JSON.parse(datos);

      if (!Array.isArray(entregas)) {
        return [];
      }

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
