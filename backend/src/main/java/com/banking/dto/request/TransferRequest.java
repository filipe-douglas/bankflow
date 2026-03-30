package com.banking.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class TransferRequest {

    @NotBlank(message = "Número da conta destino é obrigatório")
    private String targetAccountNumber;

    @NotNull(message = "Valor é obrigatório")
    @DecimalMin(value = "0.01", message = "Valor mínimo de R$ 0,01")
    @DecimalMax(value = "10000.00", message = "Valor máximo por transferência: R$ 10.000,00")
    @Digits(integer = 13, fraction = 2, message = "Valor inválido")
    private BigDecimal amount;

    @Size(max = 255, message = "Descrição muito longa")
    private String description;
}
