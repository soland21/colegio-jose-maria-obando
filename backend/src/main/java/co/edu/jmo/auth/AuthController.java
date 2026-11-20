package co.edu.jmo.auth;

import java.time.Instant;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthenticationManager authenticationManager;
    private final JwtEncoder jwtEncoder;
    private final JdbcTemplate jdbc;

    public AuthController(AuthenticationManager authenticationManager, JwtEncoder jwtEncoder, JdbcTemplate jdbc) {
        this.authenticationManager = authenticationManager; this.jwtEncoder = jwtEncoder; this.jdbc = jdbc;
    }

    public record LoginRequest(@NotBlank String documento, @NotBlank String password) {}
    public record LoginResponse(String accessToken, String tokenType, long expiresIn, UserInfo usuario) {}
    public record UserInfo(long id, String documento, String nombre, String rol, String grado) {}

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(
            request.documento().trim(), request.password()));
        UserInfo user = jdbc.queryForObject("""
            SELECT u.id, u.login, u.first_name, u.last_name, u.role,
                   (SELECT g.grade_level FROM enrollments e
                    JOIN class_groups g ON g.id = e.class_group_id
                    JOIN academic_years y ON y.id = g.academic_year_id
                    WHERE e.student_id = u.id AND e.status = 'active'
                      AND g.is_active = TRUE AND y.is_active = TRUE LIMIT 1) AS grade_level
            FROM users u WHERE u.login = ?
            """,
            (rs, row) -> new UserInfo(rs.getLong("id"), rs.getString("login"),
                rs.getString("first_name") + " " + rs.getString("last_name"),
                rs.getString("role").equals("teacher") ? "profesor" : "estudiante",
                rs.getString("grade_level")), request.documento().trim());
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder().issuer("colegio-jmo").issuedAt(now).expiresAt(now.plusSeconds(3600))
            .subject(user.documento()).claim("uid", user.id())
            .claim("role", user.rol().equals("profesor") ? "TEACHER" : "STUDENT").build();
        String token = jwtEncoder.encode(JwtEncoderParameters.from(
            JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
        return new LoginResponse(token, "Bearer", 3600, user);
    }

    @ExceptionHandler({BadCredentialsException.class, DisabledException.class})
    public org.springframework.http.ResponseEntity<Map<String, String>> credentialsError(Exception ignored) {
        return org.springframework.http.ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(Map.of("message", "Documento o contraseña incorrectos."));
    }
}
