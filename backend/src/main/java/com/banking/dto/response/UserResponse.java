package com.banking.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class UserResponse {
    private UUID id;
    private String fullName;
    private String cpf;
    private String email;
    private String role;
    private LocalDateTime createdAt;
    private AccountResponse account;
}
