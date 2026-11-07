
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
}

// ==========================================
// 2. SERVICIO
// ==========================================

@Injectable({
  providedIn: 'root'
})
export class EntregaService {

  private readonly STORAGE_KEY = 'entregasColegio';

  // ==========================================
  // 3. ASIGNACIONES DOCENTES DE PRUEBA
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

  // ==========================================
  // 5. ENTREGAS COMPARTIDAS
  // ==========================================

  private entregasSubject = new BehaviorSubject<Entrega[]>(
    this.obtenerEntregasGuardadas()
  );

  entregas$ = this.entregasSubject.asObservable();

  // ==========================================
  // 6. NORMALIZAR TEXTOS
  // ==========================================

  private normalizarTexto(texto: string): string {
    return (texto || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }

  // ==========================================
  // 7. BUSCAR PROFESOR ASIGNADO
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
  // 8. REGISTRAR ENTREGA
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

    // ==========================================
    // COMPROBAR DATOS EN CONSOLA
    // ==========================================

    console.log('========== COMPROBACIÓN DE ENTREGA ==========');

    console.log('Usuario actual:', usuario);

    console.log('Grado del estudiante:', grado);

    console.log('Materia de la tarea:', asignatura);

    console.log('Asignaciones disponibles:', this.asignacionesDocentes);

    // Buscar profesor según grado y materia.

    const profesorDocumento = this.obtenerProfesorAsignado(
      grado,
      asignatura
    );

    console.log('Profesor encontrado:', profesorDocumento);

    console.log('============================================');

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

      documentoEstudiante: usuario.documento || '',

      grado,

      profesorDocumento,

      nombreArchivo: archivo.name,

      fechaEntrega: new Date().toISOString(),

      estado: 'Pendiente de revisión'

    };

    this.archivos.set(id, archivo);

    const entregasActualizadas = [
      nuevaEntrega,
      ...this.entregasSubject.value
    ];

    this.guardarEntregas(entregasActualizadas);

    console.log('Entrega registrada correctamente:', nuevaEntrega);
  }

  // ==========================================
  // 9. OBTENER ENTREGAS DE UN PROFESOR
  // ==========================================

  obtenerEntregasProfesor(
    documentoProfesor: string
  ): Entrega[] {

    return this.entregasSubject.value.filter(
      entrega =>
        entrega.profesorDocumento === documentoProfesor
    );

  }

  // ==========================================
  // 10. OBTENER ENTREGAS DE UNA TAREA
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
  // 11. OBTENER ARCHIVO
  // ==========================================

  obtenerArchivo(id: string): File | null {

    return this.archivos.get(id) || null;

  }

  // ==========================================
  // 12. MARCAR ENTREGA COMO REVISADA
  // ==========================================

  marcarRevisada(id: string): void {

    const entregasActualizadas = this.entregasSubject.value.map(
      entrega =>
        entrega.id === id
          ? { ...entrega, estado: 'Revisada' as const }
          : entrega
    );

    this.guardarEntregas(entregasActualizadas);

  }

  // ==========================================
  // 13. GUARDAR ENTREGAS
  // ==========================================

  private guardarEntregas(entregas: Entrega[]): void {

    localStorage.setItem(
      this.STORAGE_KEY,
      JSON.stringify(entregas)
    );

    this.entregasSubject.next(entregas);

  }

  // ==========================================
  // 14. RECUPERAR ENTREGAS
  // ==========================================

  private obtenerEntregasGuardadas(): Entrega[] {

    const datos = localStorage.getItem(this.STORAGE_KEY);

    if (!datos) {
      return [];
    }

    try {

      return JSON.parse(datos) as Entrega[];

    } catch {

      return [];

    }

  }

}
