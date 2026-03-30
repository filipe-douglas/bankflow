package com.banking.service;

import com.banking.dto.response.AccountResponse;
import com.banking.dto.response.UserResponse;
import com.banking.entity.Account;
import com.banking.entity.User;
import com.banking.exception.BankingException;
import com.banking.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Serviço de administração: operações exclusivas para usuários com role ADMIN.
 * O controle de acesso é feito via @PreAuthorize no AdminController.
 */
@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;

    /**
     * Lista todos os usuários cadastrados com paginação.
     * Inclui os dados da conta bancária de cada usuário.
     */
    @Transactional(readOnly = true)
    public Page<UserResponse> listUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(this::toResponse);
    }

    /**
     * Alterna o status de um usuário entre ativo e bloqueado (enabled = !enabled).
     * Usuários bloqueados não conseguem autenticar (isAccountNonLocked retorna false).
     * Não permite desativar admins (verificado no controller via @PreAuthorize).
     */
    @Transactional
    public void toggleUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BankingException("Usuário não encontrado."));
        user.setEnabled(!user.isEnabled());
        userRepository.save(user);
    }

    /** Converte User + Account para UserResponse DTO. */
    private UserResponse toResponse(User user) {
        Account acc = user.getAccount();
        AccountResponse accountResponse = acc == null ? null : AccountResponse.builder()
                .id(acc.getId()).accountNumber(acc.getAccountNumber())
                .accountType(acc.getAccountType().name()).balance(acc.getBalance())
                .dailyLimit(acc.getDailyLimit()).active(acc.isActive())
                .createdAt(acc.getCreatedAt()).build();

        return UserResponse.builder()
                .id(user.getId()).fullName(user.getFullName())
                .cpf(user.getCpf()).email(user.getEmail())
                .role(user.getRole().name()).enabled(user.isEnabled())
                .createdAt(user.getCreatedAt())
                .account(accountResponse).build();
    }
}