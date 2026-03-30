package com.banking.config;

import com.banking.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

/**
 * Beans de infraestrutura da aplicação separados do SecurityConfig
 * para evitar dependências circulares.
 *
 * <p>O UserDetailsService é usado pelo DaoAuthenticationProvider
 * para carregar o usuário pelo email durante o login.
 */
@Configuration
@RequiredArgsConstructor
public class AppConfig {

    private final UserRepository userRepository;

    /**
     * Carrega o UserDetails (implementado pela entidade User) pelo email.
     * Lança UsernameNotFoundException se o email não existir no banco.
     */
    @Bean
    public UserDetailsService userDetailsService() {
        return email -> userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado: " + email));
    }
}
