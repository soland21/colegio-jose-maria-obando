# Base de datos del Colegio José María Obando

`schema.sql` crea el esquema inicial para MySQL 8.0. Está pensado para el MVP descrito en los requisitos: clases por grupo, materia y periodo; tareas y archivos; entregas con historial de versiones; notas e historial de cambios; anuncios, eventos y notificaciones.

## Crear la base

Con MySQL instalado y el servicio activo, ejecutar desde la raíz del proyecto:

```sh
mysql -u root -p < db/schema.sql
```

El script crea `colegio_jose_maria_obando` si todavía no existe. No crea cuentas de ejemplo ni contraseñas predeterminadas.

## Relaciones principales

- `users` contiene las credenciales y el rol. `teacher_profiles` y `student_profiles` guardan los datos específicos de cada perfil.
- `academic_years`, `academic_periods`, `class_groups`, `subjects` y `classes` describen la oferta académica.
- `class_teachers` asigna profesores a clases; `enrollments` asigna estudiantes a grupos.
- `tasks` pertenece a una clase y a su profesor creador. `task_attachments` guarda los metadatos de archivos.
- `submissions` limita a una entrega vigente por estudiante y tarea. `submission_versions` y `submission_attachments` conservan reemplazos.
- `grades` guarda una nota por tarea y estudiante; `grade_change_history` permite auditar correcciones.
- `announcements` puede dirigirse a todo el colegio o a grupos seleccionados. `calendar_events` guarda las fechas de eventos y cambios de horario.
- `notifications` almacena novedades por usuario. `audit_logs` ofrece un registro adicional de cambios relevantes.

## Consideraciones de implementación

- Los archivos no se almacenan como BLOB en MySQL. Guarda el binario en almacenamiento privado y el identificador seguro, nombre original, tipo y tamaño en las tablas de adjuntos.
- Las consultas y escrituras del backend deben verificar el rol, que el docente esté asignado a la clase y que el estudiante pertenezca al grupo. El esquema no reemplaza esa autorización.
- Guarda en `password_hash` únicamente hashes producidos por el backend con un algoritmo seguro; nunca contraseñas en texto plano.
- El esquema deja `max_score` y `score` como valores relativos. Antes de habilitar notas, el colegio debe acordar escala, fórmula de promedio y reglas para entregas tardías y reemplazos.
- Para anunciar a grupos seleccionados, crea filas en `announcement_classes`; para alcance escolar, usa `audience = 'school'`. La lógica de publicación debe comprobar que el profesor esté autorizado para esa audiencia.
- La creación de usuarios, la asignación de grupos y la recuperación de contraseñas siguen pendientes de definición institucional.

Este repositorio actualmente contiene el frontend Angular; el backend Spring Boot y su integración con MySQL son una fase separada.
