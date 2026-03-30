package com.banking.exception;

import java.math.BigDecimal;

public class DailyLimitExceededException extends BankingException {
    public DailyLimitExceededException(BigDecimal limit) {
        super(String.format("Limite diário de R$ %.2f excedido.", limit));
    }
}
