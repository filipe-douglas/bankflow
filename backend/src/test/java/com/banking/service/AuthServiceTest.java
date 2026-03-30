package com.banking.service;

import com.banking.dto.request.LoginRequest;
import com.banking.dto.request.RegisterRequest;
import com.banking.dto.response.AuthResponse;
import com.banking.entity.Account;
import com.banking.entity.User;
import com.banking.exception.BankingException;
import com.banking.repository.AccountRepository;
import com.banking.repository.RefreshTokenRepository;
import com.banking.repository.UserRepository;
import com.banking.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService — Testes Unitários")
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private AccountRepository accountRepository;
    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtService jwtService;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private AccountNumberGenerator accountNumberGenerator;

    @InjectMocks private AuthService authService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "refreshExpiration", 604800000L);
    }

    @Test
    @DisplayName("Registro com email duplicado deve lançar BankingException")
    void register_duplicateEmail_shouldThrow() {
        when(userRepository.existsByEmail("test@test.com")).thenReturn(true);

        RegisterRequest req = new RegisterRequest();
        req.setEmail("test@test.com");
        req.setCpf("123.456.789-00");
        req.setFullName("Test User");
        req.setPassword("Senha@123");

        assertThatThrownBy(() -> authService.register(req))
                .isInstanceOf(BankingException.class)
                .hasMessageContaining("E-mail");
    }

    @Test
    @DisplayName("Registro com CPF duplicado deve lançar BankingException")
    void register_duplicateCpf_shouldThrow() {
        when(userRepository.existsByEmail(any())).thenReturn(false);
        when(userRepository.existsByCpf("123.456.789-00")).thenReturn(true);

        RegisterRequest req = new RegisterRequest();
        req.setEmail("novo@test.com");
        req.setCpf("123.456.789-00");
        req.setFullName("Test User");
        req.setPassword("Senha@123");

        assertThatThrownBy(() -> authService.register(req))
                .isInstanceOf(BankingException.class)
                .hasMessageContaining("CPF");
    }

    @Test
    @DisplayName("Registro válido deve criar usuário e conta")
    void register_valid_shouldCreateUserAndAccount() {
        when(userRepository.existsByEmail(any())).thenReturn(false);
        when(userRepository.existsByCpf(any())).thenReturn(false);
        when(passwordEncoder.encode(any())).thenReturn("hashed");
        when(accountNumberGenerator.generate()).thenReturn("0001.00001-0");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            ReflectionTestUtils.setField(u, "id", UUID.randomUUID());
            return u;
        });
        when(accountRepository.save(any(Account.class))).thenAnswer(inv -> inv.getArgument(0));
        when(jwtService.generateToken(any())).thenReturn("access-token");
        when(refreshTokenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        RegisterRequest req = new RegisterRequest();
        req.setEmail("novo@test.com");
        req.setCpf("123.456.789-00");
        req.setFullName("Novo Usuario");
        req.setPassword("Senha@123");
        req.setAccountType("CORRENTE");

        AuthResponse response = authService.register(req);

        assertThat(response.getAccessToken()).isEqualTo("access-token");
        assertThat(response.getUser().getEmail()).isEqualTo("novo@test.com");
        verify(accountRepository, times(1)).save(any(Account.class));
    }

    @Test
    @DisplayName("Login válido deve retornar AuthResponse com tokens")
    void login_valid_shouldReturnTokens() {
        LoginRequest req = new LoginRequest();
        req.setEmail("user@test.com");
        req.setPassword("Senha@123");

        Account acc = Account.builder()
                .id(UUID.randomUUID()).accountNumber("0001.00001-0")
                .accountType(Account.AccountType.CORRENTE).build();

        User user = User.builder()
                .id(UUID.randomUUID()).email("user@test.com")
                .fullName("Test User").role(User.Role.USER)
                .account(acc).build();

        when(authenticationManager.authenticate(any())).thenReturn(
                new UsernamePasswordAuthenticationToken("user@test.com", null));
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(jwtService.generateToken(user)).thenReturn("access-token-mock");
        when(refreshTokenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        AuthResponse response = authService.login(req);

        assertThat(response.getAccessToken()).isEqualTo("access-token-mock");
        assertThat(response.getRefreshToken()).isNotBlank();
        assertThat(response.getUser().getEmail()).isEqualTo("user@test.com");
    }
}
