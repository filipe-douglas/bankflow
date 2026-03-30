-- V1__init_schema.sql
-- Criação do schema inicial do BankFlow

CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name   VARCHAR(150)        NOT NULL,
    cpf         VARCHAR(14)         NOT NULL UNIQUE,
    email       VARCHAR(255)        NOT NULL UNIQUE,
    password    VARCHAR(255)        NOT NULL,
    role        VARCHAR(20)         NOT NULL DEFAULT 'USER',
    enabled     BOOLEAN             NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP           NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP           NOT NULL DEFAULT NOW()
);

CREATE TABLE accounts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID            NOT NULL REFERENCES users(id),
    account_number  VARCHAR(20)     NOT NULL UNIQUE,
    account_type    VARCHAR(20)     NOT NULL DEFAULT 'CORRENTE',
    balance         NUMERIC(15,2)   NOT NULL DEFAULT 0.00,
    daily_limit     NUMERIC(15,2)   NOT NULL DEFAULT 5000.00,
    active          BOOLEAN         NOT NULL DEFAULT TRUE,
    version         BIGINT          NOT NULL DEFAULT 0,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE TABLE transactions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_account_id   UUID            REFERENCES accounts(id),
    target_account_id   UUID            REFERENCES accounts(id),
    type                VARCHAR(30)     NOT NULL,
    amount              NUMERIC(15,2)   NOT NULL,
    description         VARCHAR(255),
    status              VARCHAR(20)     NOT NULL DEFAULT 'COMPLETED',
    balance_before      NUMERIC(15,2),
    balance_after       NUMERIC(15,2),
    created_at          TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID            NOT NULL REFERENCES users(id),
    token       VARCHAR(512)    NOT NULL UNIQUE,
    expires_at  TIMESTAMP       NOT NULL,
    revoked     BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP       NOT NULL DEFAULT NOW()
);

-- Índices de performance
CREATE INDEX idx_accounts_user_id     ON accounts(user_id);
CREATE INDEX idx_accounts_number      ON accounts(account_number);
CREATE INDEX idx_transactions_source  ON transactions(source_account_id);
CREATE INDEX idx_transactions_target  ON transactions(target_account_id);
CREATE INDEX idx_transactions_date    ON transactions(created_at DESC);
CREATE INDEX idx_refresh_tokens_user  ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);

-- Admin padrão (senha: Admin@123)
INSERT INTO users (id, full_name, cpf, email, password, role)
VALUES (
    gen_random_uuid(),
    'Administrador',
    '000.000.000-00',
    'admin@bankflow.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq9YNLq',
    'ADMIN'
);
