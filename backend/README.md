# Backend de autenticación

API Spring Boot para autenticar el documento (`users.login`) y contraseña contra MySQL. Emite un JWT HS256 válido durante una hora; solo permite anónimamente `POST /api/auth/login`. Las contraseñas se comparan con BCrypt y las cuentas inactivas no pueden ingresar.

## Requisitos y ejecución

Se requiere Java 17+, Maven 3.6.3+ y MySQL 8. Primero crea la base ejecutando `../db/schema.sql`. Configura `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` y `JWT_SECRET` (Base64 que decodifique a 32 bytes o más), luego ejecuta desde `backend/`:

```sh
mvn spring-boot:run
```

Genera un secreto local con `openssl rand -base64 32`. Crea las cuentas mediante un proceso administrativo que aplique BCrypt y guarde el hash en `users.password_hash`; este MVP no incluye registro ni contraseñas predeterminadas.

## Pruebas

Desde `backend/`, `mvn test` ejecuta pruebas de integración HTTP con H2 en memoria; valida credenciales correctas, contraseña incorrecta y cuenta inactiva sin modificar MySQL ni requerir una cuenta real.

## Contrato de login

`POST http://localhost:8080/api/auth/login`

```json
{"documento":"1234567890","password":"..."}
```

Respuesta exitosa: `accessToken`, `tokenType`, `expiresIn` y `usuario` (`id`, `documento`, `nombre`, `rol`, `grado`). Los roles son `profesor`/`estudiante`; `grado` es el grado del grupo activo en el año académico activo y puede ser `null`. Credenciales incorrectas o cuenta inactiva devuelven 401 con un mensaje genérico.
