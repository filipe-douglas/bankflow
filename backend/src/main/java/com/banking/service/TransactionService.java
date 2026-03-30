package com.banking.service;

import com.banking.dto.request.DepositWithdrawRequest;
import com.banking.dto.request.TransferRequest;
import com.banking.dto.response.AccountResponse;
import com.banking.dto.response.TransactionResponse;
import com.banking.entity.Account;
import com.banking.entity.Transaction;
import com.banking.entity.User;
import com.banking.exception.AccountNotFoundException;
import com.banking.exception.BankingException;
import com.banking.exception.DailyLimitExceededException;
import com.banking.exception.InsufficientFundsException;
import com.banking.repository.AccountRepository;
import com.banking.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TransactionService {

    private static final List<Transaction.TransactionType> DEBIT_TYPES = List.of(
            Transaction.TransactionType.TRANSFERENCIA_ENVIADA,
            Transaction.TransactionType.SAQUE
    );

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;

    @Value("${banking.transfer.daily-limit}")
    private BigDecimal transferDailyLimit;

    @Value("${banking.transfer.single-limit}")
    private BigDecimal transferSingleLimit;

    @Value("${banking.withdraw.daily-limit}")
    private BigDecimal withdrawDailyLimit;

    @Value("${banking.withdraw.single-limit}")
    private BigDecimal withdrawSingleLimit;

    // ─── Transferência ────────────────────────────────────────────────────────

    /**
     * Realiza uma transferência entre duas contas.
     * Valida: valor positivo, limite por operação, conta destino existente,
     * não transferir para si mesmo, ambas as contas ativas, limite diário e saldo.
     * Registra dois lançamentos: ENVIADA (origem) e RECEBIDA (destino).
     */
    @Transactional
    public TransactionResponse transfer(User currentUser, TransferRequest request) {
        if (request.getAmount().compareTo(BigDecimal.ZERO) <= 0)
            throw new BankingException("O valor da transferência deve ser positivo.");
        if (request.getAmount().compareTo(transferSingleLimit) > 0)
            throw new BankingException("Valor excede o limite por transferência de R$ " + transferSingleLimit);

        Account source = getAccountByUser(currentUser);
        Account target = accountRepository.findByAccountNumber(request.getTargetAccountNumber())
                .orElseThrow(() -> new AccountNotFoundException(request.getTargetAccountNumber()));

        if (source.getId().equals(target.getId()))
            throw new BankingException("Não é possível transferir para a própria conta.");
        if (!source.isActive() || !target.isActive())
            throw new BankingException("Conta inativa.");

        checkDailyLimit(source, request.getAmount(), transferDailyLimit);

        if (source.getBalance().compareTo(request.getAmount()) < 0)
            throw new InsufficientFundsException();

        BigDecimal sourceBalanceBefore = source.getBalance();
        BigDecimal targetBalanceBefore = target.getBalance();

        source.debit(request.getAmount());
        target.credit(request.getAmount());
        accountRepository.save(source);
        accountRepository.save(target);

        // Lançamento na conta origem
        Transaction sent = Transaction.builder()
                .sourceAccount(source).targetAccount(target)
                .type(Transaction.TransactionType.TRANSFERENCIA_ENVIADA)
                .amount(request.getAmount()).description(request.getDescription())
                .balanceBefore(sourceBalanceBefore).balanceAfter(source.getBalance())
                .build();

        // Lançamento na conta destino
        Transaction received = Transaction.builder()
                .sourceAccount(source).targetAccount(target)
                .type(Transaction.TransactionType.TRANSFERENCIA_RECEBIDA)
                .amount(request.getAmount()).description(request.getDescription())
                .balanceBefore(targetBalanceBefore).balanceAfter(target.getBalance())
                .build();

        transactionRepository.save(sent);
        transactionRepository.save(received);

        log.info("Transferência: {} → {} | R$ {}",
                source.getAccountNumber(), target.getAccountNumber(), request.getAmount());
        return toResponse(sent);
    }

    // ─── Depósito ─────────────────────────────────────────────────────────────

    /**
     * Credita um valor na conta do usuário autenticado.
     * Limite máximo por depósito: R$ 100.000,00.
     */
    @Transactional
    public TransactionResponse deposit(User currentUser, DepositWithdrawRequest request) {
        if (request.getAmount().compareTo(BigDecimal.ZERO) <= 0)
            throw new BankingException("O valor do depósito deve ser positivo.");
        if (request.getAmount().compareTo(new BigDecimal("100000.00")) > 0)
            throw new BankingException("Depósito único não pode exceder R$ 100.000,00.");

        Account account = getAccountByUser(currentUser);
        if (!account.isActive()) throw new BankingException("Conta inativa.");

        BigDecimal balanceBefore = account.getBalance();
        account.credit(request.getAmount());
        accountRepository.save(account);

        Transaction tx = Transaction.builder()
                .targetAccount(account)
                .type(Transaction.TransactionType.DEPOSITO)
                .amount(request.getAmount())
                .description(request.getDescription() != null ? request.getDescription() : "Depósito")
                .balanceBefore(balanceBefore).balanceAfter(account.getBalance())
                .build();
        transactionRepository.save(tx);

        log.info("Depósito: conta {} | R$ {}", account.getAccountNumber(), request.getAmount());
        return toResponse(tx);
    }

    // ─── Saque ────────────────────────────────────────────────────────────────

    /**
     * Debita um valor da conta do usuário autenticado.
     * Valida: limite por operação, limite diário e saldo suficiente.
     */
    @Transactional
    public TransactionResponse withdraw(User currentUser, DepositWithdrawRequest request) {
        if (request.getAmount().compareTo(BigDecimal.ZERO) <= 0)
            throw new BankingException("O valor do saque deve ser positivo.");
        if (request.getAmount().compareTo(withdrawSingleLimit) > 0)
            throw new BankingException("Valor excede o limite de saque por operação de R$ " + withdrawSingleLimit);

        Account account = getAccountByUser(currentUser);
        if (!account.isActive()) throw new BankingException("Conta inativa.");

        checkDailyLimit(account, request.getAmount(), withdrawDailyLimit);

        if (account.getBalance().compareTo(request.getAmount()) < 0)
            throw new InsufficientFundsException();

        BigDecimal balanceBefore = account.getBalance();
        account.debit(request.getAmount());
        accountRepository.save(account);

        Transaction tx = Transaction.builder()
                .sourceAccount(account)
                .type(Transaction.TransactionType.SAQUE)
                .amount(request.getAmount())
                .description(request.getDescription() != null ? request.getDescription() : "Saque")
                .balanceBefore(balanceBefore).balanceAfter(account.getBalance())
                .build();
        transactionRepository.save(tx);

        log.info("Saque: conta {} | R$ {}", account.getAccountNumber(), request.getAmount());
        return toResponse(tx);
    }

    // ─── Extrato ──────────────────────────────────────────────────────────────

    /**
     * Retorna o extrato paginado da conta do usuário.
     * Suporta filtros opcionais de período (startDate/endDate) e tipo de transação.
     */
    @Transactional(readOnly = true)
    public Page<TransactionResponse> getStatement(
            User currentUser, LocalDate startDate, LocalDate endDate,
            String type, Pageable pageable) {

        Account account = getAccountByUser(currentUser);
        LocalDateTime start = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime end   = endDate   != null ? endDate.atTime(LocalTime.MAX) : null;

        Page<Transaction> page;
        if (type != null && !type.isBlank()) {
            Transaction.TransactionType txType = Transaction.TransactionType.valueOf(type);
            page = transactionRepository.findStatementWithType(account.getId(), start, end, txType, pageable);
        } else {
            page = transactionRepository.findStatementNoType(account.getId(), start, end, pageable);
        }

        return page.map(this::toResponse);
    }

    // ─── Conta ────────────────────────────────────────────────────────────────

    /**
     * Retorna os dados da conta bancária do usuário autenticado.
     */
    @Transactional(readOnly = true)
    public AccountResponse getMyAccount(User currentUser) {
        Account account = getAccountByUser(currentUser);
        return AccountResponse.builder()
                .id(account.getId())
                .accountNumber(account.getAccountNumber())
                .accountType(account.getAccountType().name())
                .balance(account.getBalance())
                .dailyLimit(account.getDailyLimit())
                .active(account.isActive())
                .createdAt(account.getCreatedAt())
                .build();
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Busca a conta pelo ID do usuário. Lança AccountNotFoundException se não encontrar.
     */
    private Account getAccountByUser(User user) {
        return accountRepository.findByUserId(user.getId())
                .orElseThrow(() -> new AccountNotFoundException("usuário " + user.getEmail()));
    }

    /**
     * Verifica se o total debitado hoje mais o novo valor ultrapassa o limite diário informado.
     * Considera apenas transações com status COMPLETED do dia corrente.
     */
    private void checkDailyLimit(Account account, BigDecimal amount, BigDecimal dailyLimit) {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        BigDecimal dailyUsed = transactionRepository.sumDailyDebitsByAccountId(
                account.getId(),
                startOfDay,
                DEBIT_TYPES,
                Transaction.TransactionStatus.COMPLETED
        );
        if (dailyUsed.add(amount).compareTo(dailyLimit) > 0)
            throw new DailyLimitExceededException(dailyLimit);
    }

    /**
     * Converte uma entidade Transaction para o DTO de resposta.
     * Carrega os números de conta das partes envolvidas se existirem.
     */
    private TransactionResponse toResponse(Transaction tx) {
        return TransactionResponse.builder()
                .id(tx.getId())
                .type(tx.getType().name())
                .amount(tx.getAmount())
                .description(tx.getDescription())
                .status(tx.getStatus().name())
                .balanceBefore(tx.getBalanceBefore())
                .balanceAfter(tx.getBalanceAfter())
                .sourceAccountNumber(
                        tx.getSourceAccount() != null ? tx.getSourceAccount().getAccountNumber() : null)
                .targetAccountNumber(
                        tx.getTargetAccount() != null ? tx.getTargetAccount().getAccountNumber() : null)
                .createdAt(tx.getCreatedAt())
                .build();
    }
}
