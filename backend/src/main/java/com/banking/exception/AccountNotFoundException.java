package com.banking.exception;

public class AccountNotFoundException extends BankingException {
    public AccountNotFoundException(String identifier) {
        super("Conta não encontrada: " + identifier);
    }
}
