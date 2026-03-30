package com.banking.service;

import com.banking.dto.request.LoginRequest;
import com.banking.dto.request.RefreshTokenRequest;
import com.banking.dto.request.RegisterRequest;
import com.banking.dto.response.AccountResponse;
import com.banking.dto.response.AuthResponse;
import com.banking.dto.response.UserResponse;
import com.banking.entity.Account;
import com.banking.entity.RefreshToken;
import com.banking.entity.User;
import com.banking.exception.BankingException;
import com.banking.repository.AccountRepository;
import com.banking.repository.RefreshTokenRepository;
import com.banking.repository.UserRepository;
import com.banking.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Serviço de autenticação: registro, login, refresh e logout de usuários.
 *
 * <p>Fluxo de autenticação:
 * <ol>
 *   <li>register / login → gera accessToken (JWT curto) + refreshToken (UUID longo)
 *   <li>O accessToken expira em {@code jwt.expiration} ms (padrão 15min)
 *   <li>Ao expirar, o frontend chama /auth/refresh com o refreshToken
 *   <li>O refreshToken antigo é revogado e um novo par de tokens é emitido
 *   <li>Logout revoga o refreshToken no banco
 * </ol>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final AccountNumberGenerator accountNumberGenerator;

    @Value("${jwt.refresh-expiration}")
    private long refreshExpiration;

    /**
     * Registra um novo usuário e abre sua conta bancária.
     * Verifica unicidade de email e CPF antes de persistir.
     * Salva User e Account separadamente (cascade não opera no lado mappedBy).
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail()))
            throw new BankingException("E-mail já cadastrado.");
        if (userRepository.existsByCpf(request.getCpf()))
            throw new BankingException("CPF já cadastrado.");

        Account.AccountType accountType = "POUPANCA".equalsIgnoreCase(request.getAccountType())
                ? Account.AccountType.POUPANCA : Account.AccountType.CORRENTE;

        User user = User.builder()
                .fullName(request.getFullName())
                .cpf(request.getCpf())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .build();
        userRepository.save(user);

        Account account = Account.builder()
                .user(user)
                .accountNumber(accountNumberGenerator.generate())
                .accountType(accountType)
                .build();
        accountRepository.save(account);

        // Associa em memória para o response (sem nova query)
        user.setAccount(account);

        log.info("Novo usuário registrado: {} | conta: {}", user.getEmail(), account.getAccountNumber());
        return buildAuthResponse(user);
    }

    /**
     * Autentica o usuário via email/senha usando o AuthenticationManager do Spring Security.
     * Lança BadCredentialsException se as credenciais forem inválidas (tratado pelo GlobalExceptionHandler).
     */
    @Transactional
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BankingException("Usuário não encontrado."));
        return buildAuthResponse(user);
    }

    /**
     * Renova o par de tokens usando um refreshToken válido (não revogado e não expirado).
     * O refreshToken antigo é imediatamente revogado (rotação de token).
     */
    @Transactional
    public AuthResponse refresh(RefreshTokenRequest request) {
        RefreshToken stored = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new BankingException("Refresh token inválido."));
        if (!stored.isValid())
            throw new BankingException("Refresh token expirado ou revogado.");
        stored.setRevoked(true);
        refreshTokenRepository.save(stored);
        return buildAuthResponse(stored.getUser());
    }

    /**
     * Revoga o refreshToken informado, efetivando o logout do dispositivo.
     * Silencioso se o token não existir (idempotente).
     */
    @Transactional
    public void logout(String refreshToken) {
        refreshTokenRepository.findByToken(refreshToken).ifPresent(t -> {
            t.setRevoked(true);
            refreshTokenRepository.save(t);
        });
    }

    /**
     * Monta o AuthResponse com accessToken JWT, refreshToken UUID,
     * dados do usuário e dados da conta bancária.
     */
    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtService.generateToken(user);
        String rawRefresh = UUID.randomUUID().toString();

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user).token(rawRefresh)
                .expiresAt(LocalDateTime.now().plusSeconds(refreshExpiration / 1000))
                .build();
        refreshTokenRepository.save(refreshToken);

        Account acc = user.getAccount();
        AccountResponse accountResponse = acc == null ? null : AccountResponse.builder()
                .id(acc.getId()).accountNumber(acc.getAccountNumber())
                .accountType(acc.getAccountType().name()).balance(acc.getBalance())
                .dailyLimit(acc.getDailyLimit()).active(acc.isActive())
                .createdAt(acc.getCreatedAt()).build();

        UserResponse userResponse = UserResponse.builder()
                .id(user.getId()).fullName(user.getFullName())
                .cpf(user.getCpf()).email(user.getEmail())
                .role(user.getRole().name()).createdAt(user.getCreatedAt())
                .account(accountResponse).build();

        return AuthResponse.builder()
                .accessToken(accessToken).refreshToken(rawRefresh)
                .tokenType("Bearer").expiresIn(refreshExpiration / 1000)
                .user(userResponse).build();
    }
}
