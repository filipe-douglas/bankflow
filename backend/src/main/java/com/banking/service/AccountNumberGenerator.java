package com.banking.service;

import com.banking.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Random;

/**
 * Gera números de conta bancária únicos no formato XXXX.XXXXX-X.
 * Verifica no banco se o número já existe antes de retorná-lo,
 * repetindo a geração até encontrar um número disponível.
 */
@Service
@RequiredArgsConstructor
public class AccountNumberGenerator {

    private final AccountRepository accountRepository;
    private final Random random = new Random();

    /**
     * Gera e retorna um número de conta único.
     * Formato: 4 dígitos + ponto + 5 dígitos + hífen + 1 dígito verificador.
     * Ex: "0312.48291-7"
     */
    public String generate() {
        String number;
        do {
            number = String.format("%04d.%05d-%01d",
                    random.nextInt(10000),
                    random.nextInt(100000),
                    random.nextInt(10));
        } while (accountRepository.existsByAccountNumber(number));
        return number;
    }
}
