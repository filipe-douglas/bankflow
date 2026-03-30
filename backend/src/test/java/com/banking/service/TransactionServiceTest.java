package com.banking.service;

import com.banking.dto.request.DepositWithdrawRequest;
import com.banking.dto.request.TransferRequest;
import com.banking.dto.response.TransactionResponse;
import com.banking.entity.Account;
import com.banking.entity.Transaction;
import com.banking.entity.User;
import com.banking.exception.BankingException;
import com.banking.exception.DailyLimitExceededException;
import com.banking.exception.InsufficientFundsException;
import com.banking.repository.AccountRepository;
import com.banking.repository.TransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("TransactionService — Testes Unitários")
class TransactionServiceTest {

    @Mock private AccountRepository accountRepository;
    @Mock private TransactionRepository transactionRepository;

    @InjectMocks private TransactionService transactionService;

    private User user;
    private Account sourceAccount;
    private Account targetAccount;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(transactionService, "transferDailyLimit",  new BigDecimal("50000.00"));
        ReflectionTestUtils.setField(transactionService, "transferSingleLimit", new BigDecimal("10000.00"));
        ReflectionTestUtils.setField(transactionService, "withdrawDailyLimit",  new BigDecimal("5000.00"));
        ReflectionTestUtils.setField(transactionService, "withdrawSingleLimit", new BigDecimal("2000.00"));

        user = User.builder().id(UUID.randomUUID()).email("user@test.com").build();

        sourceAccount = Account.builder()
                .id(UUID.randomUUID()).user(user)
                .accountNumber("0001.00001-0")
                .balance(new BigDecimal("1000.00")).active(true).build();

        targetAccount = Account.builder()
                .id(UUID.randomUUID())
                .accountNumber("0002.00002-0")
                .balance(new BigDecimal("500.00")).active(true).build();

        when(accountRepository.findByUserId(user.getId())).thenReturn(Optional.of(sourceAccount));
        when(accountRepository.save(any(Account.class))).thenAnswer(inv -> inv.getArgument(0));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(inv -> inv.getArgument(0));
        when(transactionRepository.sumDailyDebitsByAccountId(any(), any(), any(), any())).thenReturn(BigDecimal.ZERO);
    }

    // ─── Depósito ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Depósito válido deve creditar na conta")
    void deposit_valid_shouldCreditAccount() {
        DepositWithdrawRequest req = new DepositWithdrawRequest();
        req.setAmount(new BigDecimal("200.00"));

        TransactionResponse response = transactionService.deposit(user, req);

        assertThat(sourceAccount.getBalance()).isEqualByComparingTo("1200.00");
        assertThat(response.getType()).isEqualTo("DEPOSITO");
        assertThat(response.getAmount()).isEqualByComparingTo("200.00");
    }

    @Test
    @DisplayName("Depósito com valor zero deve lançar BankingException")
    void deposit_zeroAmount_shouldThrow() {
        DepositWithdrawRequest req = new DepositWithdrawRequest();
        req.setAmount(BigDecimal.ZERO);

        assertThatThrownBy(() -> transactionService.deposit(user, req))
                .isInstanceOf(BankingException.class)
                .hasMessageContaining("positivo");
    }

    @Test
    @DisplayName("Depósito acima de R$100.000 deve lançar BankingException")
    void deposit_overLimit_shouldThrow() {
        DepositWithdrawRequest req = new DepositWithdrawRequest();
        req.setAmount(new BigDecimal("100001.00"));

        assertThatThrownBy(() -> transactionService.deposit(user, req))
                .isInstanceOf(BankingException.class)
                .hasMessageContaining("100.000");
    }

    // ─── Saque ────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Saque válido deve debitar na conta")
    void withdraw_valid_shouldDebitAccount() {
        DepositWithdrawRequest req = new DepositWithdrawRequest();
        req.setAmount(new BigDecimal("300.00"));

        TransactionResponse response = transactionService.withdraw(user, req);

        assertThat(sourceAccount.getBalance()).isEqualByComparingTo("700.00");
        assertThat(response.getType()).isEqualTo("SAQUE");
    }

    @Test
    @DisplayName("Saque com saldo insuficiente deve lançar InsufficientFundsException")
    void withdraw_insufficientBalance_shouldThrow() {
        DepositWithdrawRequest req = new DepositWithdrawRequest();
        req.setAmount(new BigDecimal("1500.00"));

        assertThatThrownBy(() -> transactionService.withdraw(user, req))
                .isInstanceOf(InsufficientFundsException.class);
    }

    @Test
    @DisplayName("Saque acima do limite por operação deve lançar BankingException")
    void withdraw_overSingleLimit_shouldThrow() {
        DepositWithdrawRequest req = new DepositWithdrawRequest();
        req.setAmount(new BigDecimal("2500.00"));

        assertThatThrownBy(() -> transactionService.withdraw(user, req))
                .isInstanceOf(BankingException.class)
                .hasMessageContaining("limite");
    }

    @Test
    @DisplayName("Saque que excede limite diário deve lançar DailyLimitExceededException")
    void withdraw_overDailyLimit_shouldThrow() {
        when(transactionRepository.sumDailyDebitsByAccountId(any(), any(), any(), any()))
                .thenReturn(new BigDecimal("4800.00"));

        DepositWithdrawRequest req = new DepositWithdrawRequest();
        req.setAmount(new BigDecimal("300.00"));

        assertThatThrownBy(() -> transactionService.withdraw(user, req))
                .isInstanceOf(DailyLimitExceededException.class);
    }

    // ─── Transferência ────────────────────────────────────────────────────────

    @Test
    @DisplayName("Transferência válida deve debitar origem e creditar destino")
    void transfer_valid_shouldUpdateBothAccounts() {
        when(accountRepository.findByAccountNumber("0002.00002-0")).thenReturn(Optional.of(targetAccount));

        TransferRequest req = new TransferRequest();
        req.setTargetAccountNumber("0002.00002-0");
        req.setAmount(new BigDecimal("400.00"));
        req.setDescription("Pagamento");

        TransactionResponse response = transactionService.transfer(user, req);

        assertThat(sourceAccount.getBalance()).isEqualByComparingTo("600.00");
        assertThat(targetAccount.getBalance()).isEqualByComparingTo("900.00");
        assertThat(response.getType()).isEqualTo("TRANSFERENCIA_ENVIADA");
    }

    @Test
    @DisplayName("Transferência para a própria conta deve lançar BankingException")
    void transfer_toSameAccount_shouldThrow() {
        when(accountRepository.findByAccountNumber("0001.00001-0")).thenReturn(Optional.of(sourceAccount));

        TransferRequest req = new TransferRequest();
        req.setTargetAccountNumber("0001.00001-0");
        req.setAmount(new BigDecimal("100.00"));

        assertThatThrownBy(() -> transactionService.transfer(user, req))
                .isInstanceOf(BankingException.class)
                .hasMessageContaining("própria conta");
    }

    @Test
    @DisplayName("Transferência sem saldo deve lançar InsufficientFundsException")
    void transfer_insufficientBalance_shouldThrow() {
        when(accountRepository.findByAccountNumber("0002.00002-0")).thenReturn(Optional.of(targetAccount));

        TransferRequest req = new TransferRequest();
        req.setTargetAccountNumber("0002.00002-0");
        req.setAmount(new BigDecimal("9999.00"));

        assertThatThrownBy(() -> transactionService.transfer(user, req))
                .isInstanceOf(InsufficientFundsException.class);
    }
}
