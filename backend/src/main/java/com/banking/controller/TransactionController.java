package com.banking.controller;

import com.banking.dto.request.DepositWithdrawRequest;
import com.banking.dto.request.TransferRequest;
import com.banking.dto.response.AccountResponse;
import com.banking.dto.response.PageResponse;
import com.banking.dto.response.TransactionResponse;
import com.banking.entity.User;
import com.banking.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    @GetMapping("/accounts/me")
    public ResponseEntity<AccountResponse> getMyAccount(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(transactionService.getMyAccount(user));
    }

    @PostMapping("/transactions/transfer")
    public ResponseEntity<TransactionResponse> transfer(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody TransferRequest request) {
        return ResponseEntity.ok(transactionService.transfer(user, request));
    }

    @PostMapping("/transactions/deposit")
    public ResponseEntity<TransactionResponse> deposit(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody DepositWithdrawRequest request) {
        return ResponseEntity.ok(transactionService.deposit(user, request));
    }

    @PostMapping("/transactions/withdraw")
    public ResponseEntity<TransactionResponse> withdraw(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody DepositWithdrawRequest request) {
        return ResponseEntity.ok(transactionService.withdraw(user, request));
    }

    @GetMapping("/transactions/statement")
    public ResponseEntity<PageResponse<TransactionResponse>> getStatement(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<TransactionResponse> result = transactionService.getStatement(user, startDate, endDate, type, pageable);

        return ResponseEntity.ok(PageResponse.<TransactionResponse>builder()
                .content(result.getContent())
                .page(result.getNumber())
                .size(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .last(result.isLast())
                .build());
    }
}
