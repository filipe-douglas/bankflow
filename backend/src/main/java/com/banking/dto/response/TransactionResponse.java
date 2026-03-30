package com.banking.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class TransactionResponse {
    private UUID id;
    private String type;
    private BigDecimal amount;
    private String description;
    private String status;
    private BigDecimal balanceBefore;
    private BigDecimal balanceAfter;
    private String sourceAccountNumber;
    private String targetAccountNumber;
    private LocalDateTime createdAt;
}
