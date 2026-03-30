package com.banking.service;

import com.banking.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Job agendado para limpeza periódica de refresh tokens inválidos.
 * Remove tokens que estão revogados (logout) ou que já expiraram,
 * evitando crescimento ilimitado da tabela refresh_tokens.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TokenCleanupService {

    private final RefreshTokenRepository refreshTokenRepository;

    /**
     * Executa toda madrugada às 3h (cron: segundo, minuto, hora, dia, mês, dia-semana).
     * Deleta em batch todos os tokens com revoked=true ou expiresAt < NOW().
     */
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void cleanupExpiredTokens() {
        log.info("Iniciando limpeza de refresh tokens expirados...");
        refreshTokenRepository.deleteExpiredAndRevoked();
        log.info("Limpeza de tokens concluída.");
    }
}
