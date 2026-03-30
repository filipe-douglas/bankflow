package com.banking.config;

import com.banking.security.JwtAuthenticationFilter;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;
import java.util.Map;

/**
 * Configuração central do Spring Security.
 *
 * <ul>
 *   <li>CSRF desabilitado — API REST stateless não precisa de proteção CSRF
 *   <li>Sessões stateless — autenticação via JWT, sem HttpSession
 *   <li>CORS configurado para localhost:5173 (frontend Vite) e localhost:3000
 *   <li>Rotas públicas: POST /api/auth/** e OPTIONS /**
 *   <li>Rotas admin: /api/admin/** exige role ADMIN
 *   <li>Demais rotas: qualquer usuário autenticado
 *   <li>AuthenticationEntryPoint customizado: retorna 401 JSON (não 302/404)
 *   <li>AccessDeniedHandler customizado: retorna 403 JSON
 *   <li>Senha com BCrypt strength 12 (~300ms por hash)
 * </ul>
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final UserDetailsService userDetailsService;

    /**
     * Cadeia de filtros de segurança principal.
     * O JwtAuthenticationFilter é inserido antes do UsernamePasswordAuthenticationFilter.
     * AuthenticationEntryPoint customizado garante respostas JSON para erros de autenticação/autorização.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // Desabilita CSRF pois usamos JWT (stateless)
            .csrf(AbstractHttpConfigurer::disable)

            // Configuração de CORS
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // Define política stateless (sem sessão)
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // Tratamento de exceções (ESSENCIAL para APIs REST)
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpStatus.UNAUTHORIZED.value());
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    response.getWriter().write(
                        new ObjectMapper().writeValueAsString(Map.of(
                            "status", 401,
                            "error", "Unauthorized",
                            "detail", "Token ausente ou inválido. Faça login novamente."
                        ))
                    );
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setStatus(HttpStatus.FORBIDDEN.value());
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    response.getWriter().write(
                        new ObjectMapper().writeValueAsString(Map.of(
                            "status", 403,
                            "error", "Forbidden",
                            "detail", "Você não tem permissão para acessar este recurso."
                        ))
                    );
                })
            )

            // Regras de autorização
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.POST, "/api/auth/**").permitAll()
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )

            // Provider de autenticação
            .authenticationProvider(authenticationProvider())

            // Filtro JWT antes do filtro padrão de login
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * Provider de autenticação que usa UserDetailsService + BCrypt.
     * Consultado pelo AuthenticationManager durante o login.
     */
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    /** AuthenticationManager exposto como Bean para injeção no AuthService. */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    /** BCrypt com strength 12 — balanceia segurança e performance. */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    /**
     * Configuração de CORS.
     * Permite credenciais (cookies/headers de auth) para as origens do frontend.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:5173", "http://localhost:3000"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}