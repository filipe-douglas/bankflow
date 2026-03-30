package com.banking.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class DepositWithdrawRequest {

    @NotNull(message = "Valor é obrigatório")
    @DecimalMin(value = "0.01", message = "Valor mínimo de R$ 0,01")
    @Digits(integer = 13, fraction = 2, message = "Valor inválido")
    private BigDecimal amount;

    @Size(max = 255)
    private String description;
}
