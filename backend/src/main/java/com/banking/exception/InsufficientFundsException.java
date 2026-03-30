package com.banking.exception;

public class InsufficientFundsException extends BankingException {
    public InsufficientFundsException() {
        super("Saldo insuficiente para realizar esta operação.");
    }
}
