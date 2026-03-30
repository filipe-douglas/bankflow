package com.banking.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class AccountResponse {
    private UUID id;
    private String accountNumber;
    private String accountType;
    private BigDecimal balance;
    private BigDecimal dailyLimit;
    private boolean active;
    private LocalDateTime createdAt;
}
