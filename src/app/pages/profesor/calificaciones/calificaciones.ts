
import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import {
  Entrega,
  EntregaService,
  PeriodoAcademico,
  PERIODOS_ACADEMICOS
} from '../../services/entrega.service';

// ==========================================
// 1. INTERFACES
// ==========================================

interface FilaCalificacion {
  documentoEstudiante: string;
  nombreEstudiante: string;
  asignatura: string;
  grado: string;
  notas: Record<PeriodoAcademico, (number | null)[]>;
  promedios: Record<PeriodoAcademico, number | null>;
}

// ==========================================
// 2. COMPONENTE
// ==========================================

@Component({
  selector: 'app-calificaciones-profesor',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './calificaciones.html',
  styleUrl: './calificaciones.css'
})
export class Calificaciones {

  nombreProfesor = 'Profesor';

  profesorDocumento = '';

  readonly periodos = PERIODOS_ACADEMICOS;

  materiaSeleccionada = 'Todas';

  entregas: Entrega[] = [];

  // ==========================================
  // MENÚ DE MÁS OPCIONES
  // ==========================================

  mostrarMasOpciones = false;

  alternarOpciones(): void {
    this.mostrarMasOpciones = !this.mostrarMasOpciones;
  }

  constructor(
    public entregaService: EntregaService,
    private router: Router
  ) {

    // ==========================================
    // RECUPERAR PROFESOR ACTUAL
    // ==========================================

    const usuarioGuardado = localStorage.getItem('usuarioActual');

    if (usuarioGuardado) {

      try {

        const usuario = JSON.parse(usuarioGuardado);

        this.nombreProfesor = usuario.nombre || 'Profesor';

        this.profesorDocumento = usuario.documento || '';

      } catch (error) {

        console.error(
          'Error al recuperar el profesor:',
          error
        );

      }

    }

    // ==========================================
    // ESCUCHAR ACTUALIZACIONES DE CALIFICACIONES
    // ==========================================

    this.entregaService.entregas$.subscribe(entregas => {

      this.entregas = [...entregas];

    });

  }

  // ==========================================
  // 3. MATERIAS DEL PROFESOR
  // ==========================================

  get materias(): string[] {

    const materias = this.entregaService.asignacionesDocentes

      .filter(asignacion =>
        asignacion.documentoProfesor === this.profesorDocumento
      )

      .map(asignacion => asignacion.asignatura);

    return [...new Set(materias)];

  }

  // ==========================================
  // 4. CONSTRUIR TABLA DE CALIFICACIONES
  // ==========================================

  get filas(): FilaCalificacion[] {

    const calificadas = this.entregas

      .filter(entrega =>

        entrega.profesorDocumento === this.profesorDocumento &&

        entrega.calificacion !== null &&

        entrega.calificacion !== undefined &&

        (
          this.materiaSeleccionada === 'Todas' ||

          this.normalizarTexto(entrega.asignatura) ===
          this.normalizarTexto(this.materiaSeleccionada)
        )

      )

      .sort((a, b) => {

        return new Date(a.fechaEntrega).getTime() -
          new Date(b.fechaEntrega).getTime();

      });

    const grupos = new Map<string, FilaCalificacion>();

    calificadas.forEach(entrega => {

      const llave = [

        entrega.documentoEstudiante,

        this.normalizarTexto(entrega.asignatura),

        this.normalizarTexto(entrega.grado)

      ].join('|');

      if (!grupos.has(llave)) {

        grupos.set(llave, {

          documentoEstudiante: entrega.documentoEstudiante,

          nombreEstudiante: entrega.nombreEstudiante,

          asignatura: entrega.asignatura,

          grado: entrega.grado,

          notas: {

            'Primer periodo': [null, null, null, null],

            'Segundo periodo': [null, null, null, null],

            'Tercer periodo': [null, null, null, null],

            'Cuarto periodo': [null, null, null, null]

          },

          promedios: {

            'Primer periodo': null,

            'Segundo periodo': null,

            'Tercer periodo': null,

            'Cuarto periodo': null

          }

        });

      }

      const fila = grupos.get(llave)!;

      const periodo = this.normalizarPeriodo(entrega.periodo);

      const notasPeriodo = fila.notas[periodo];

      let indice = -1;

      const numeroNota = Number(entrega.numeroNota);

      if (
        Number.isInteger(numeroNota) &&
        numeroNota >= 1 &&
        numeroNota <= 4 &&
        notasPeriodo[numeroNota - 1] === null
      ) {

        indice = numeroNota - 1;

      } else {

        indice = notasPeriodo.findIndex(nota => nota === null);

      }

      if (indice !== -1) {

        fila.notas[periodo][indice] = Number(entrega.calificacion);

      }

    });

    // ==========================================
    // 5. CALCULAR PROMEDIOS POR PERIODO
    // ==========================================

    grupos.forEach(fila => {

      this.periodos.forEach(periodo => {

        const notas = fila.notas[periodo].filter(

          (nota): nota is number => nota !== null

        );

        if (notas.length > 0) {

          const suma = notas.reduce(

            (total, nota) => total + nota,

            0

          );

          fila.promedios[periodo] = Math.round(

            (suma / notas.length) * 10

          ) / 10;

        } else {

          fila.promedios[periodo] = null;

        }

      });

    });

    // ==========================================
    // 6. ORDENAR ESTUDIANTES
    // ==========================================

    return Array.from(grupos.values()).sort((a, b) =>

      a.nombreEstudiante.localeCompare(b.nombreEstudiante)

    );

  }

  // ==========================================
  // 7. NORMALIZAR PERIODO
  // ==========================================

  normalizarPeriodo(periodo?: string): PeriodoAcademico {

    return this.periodos.includes(periodo as PeriodoAcademico)

      ? periodo as PeriodoAcademico

      : 'Primer periodo';

  }

  // ==========================================
  // 8. NORMALIZAR TEXTO
  // ==========================================

  normalizarTexto(texto: string): string {

    return String(texto || '')

      .trim()

      .toLowerCase()

      .normalize('NFD')

      .replace(/[\u0300-\u036f]/g, '');

  }

  // ==========================================
  // 9. FORMATO DE NOTAS
  // ==========================================

  formatoNota(nota: number | null): string {

    return nota === null

      ? '—'

      : nota.toFixed(1);

  }

  // ==========================================
  // 10. CERRAR SESIÓN
  // ==========================================

  cerrarSesion(): void {

    localStorage.removeItem('usuarioActual');

    this.router.navigate(['/']);

  }

}
