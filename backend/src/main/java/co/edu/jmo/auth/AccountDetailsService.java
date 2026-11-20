package co.edu.jmo.auth;

import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class AccountDetailsService implements UserDetailsService {
    private final JdbcTemplate jdbc;
    public AccountDetailsService(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    @Override public UserDetails loadUserByUsername(String login) throws UsernameNotFoundException {
        return jdbc.query("SELECT login, password_hash, role, is_active FROM users WHERE login = ?", rs -> {
            if (!rs.next()) throw new UsernameNotFoundException("Invalid credentials");
            String role = rs.getString("role").equals("teacher") ? "TEACHER" : "STUDENT";
            return User.withUsername(rs.getString("login")).password(rs.getString("password_hash"))
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_" + role)))
                .disabled(!rs.getBoolean("is_active")).build();
        }, login);
    }
}
