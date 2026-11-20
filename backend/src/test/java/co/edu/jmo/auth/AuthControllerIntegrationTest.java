package co.edu.jmo.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class AuthControllerIntegrationTest {
    private static final String DOCUMENTO = "1234567890";
    private static final String PASSWORD = "ClaveTemporal123!";

    private final HttpClient http = HttpClient.newHttpClient();
    @Autowired private JdbcTemplate jdbc;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtDecoder jwtDecoder;
    @Autowired private JwtAuthenticationConverter jwtAuthenticationConverter;
    @Autowired private Environment environment;

    @BeforeEach
    void createTestAccount() {
        jdbc.update("DELETE FROM users");
        jdbc.update("INSERT INTO users (login, password_hash, role, first_name, last_name, is_active) VALUES (?, ?, ?, ?, ?, ?)",
            DOCUMENTO, passwordEncoder.encode(PASSWORD), "teacher", "Docente", "Prueba", true);
    }

    @Test
    void validCredentialsReturnUserAndSignedJwt() throws Exception {
        HttpResponse<String> response = login(DOCUMENTO, PASSWORD);

        assertEquals(200, response.statusCode());
        String body = response.body();
        assertNotNull(body);
        assertTrue(body.contains("\"tokenType\":\"Bearer\""));
        assertTrue(body.contains("\"expiresIn\":3600"));
        assertTrue(body.contains("\"documento\":\"" + DOCUMENTO + "\""));
        assertTrue(body.contains("\"rol\":\"profesor\""));
        Matcher tokenMatcher = Pattern.compile("\"accessToken\":\"([^\"]+)\"").matcher(body);
        assertTrue(tokenMatcher.find());
        var jwt = jwtDecoder.decode(tokenMatcher.group(1));
        assertEquals(DOCUMENTO, jwt.getSubject());
        assertEquals("TEACHER", jwt.getClaimAsString("role"));
        assertTrue(jwtAuthenticationConverter.convert(jwt).getAuthorities()
            .contains(new SimpleGrantedAuthority("ROLE_TEACHER")));
    }

    @Test
    void wrongPasswordReturnsGenericUnauthorizedResponse() throws Exception {
        HttpResponse<String> response = login(DOCUMENTO, "incorrecta");

        assertEquals(401, response.statusCode());
        assertTrue(response.body().contains("Documento o contraseña incorrectos."));
    }

    @Test
    void inactiveAccountCannotSignIn() throws Exception {
        jdbc.update("UPDATE users SET is_active = FALSE WHERE login = ?", DOCUMENTO);

        HttpResponse<String> response = login(DOCUMENTO, PASSWORD);

        assertEquals(401, response.statusCode());
        assertTrue(response.body().contains("Documento o contraseña incorrectos."));
    }

    private HttpResponse<String> login(String documento, String password) throws Exception {
        String json = "{\"documento\":\"" + documento + "\",\"password\":\"" + password + "\"}";
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("http://localhost:" + environment.getProperty("local.server.port") + "/api/auth/login"))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(json))
            .build();
        return http.send(request, HttpResponse.BodyHandlers.ofString());
    }
}
