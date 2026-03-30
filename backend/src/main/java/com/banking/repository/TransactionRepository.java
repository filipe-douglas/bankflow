package com.banking.repository;

import com.banking.entity.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID> {

    /**
     * Retorna o extrato paginado de uma conta sem filtro de tipo.
     * Inclui tanto transações enviadas quanto recebidas.
     * Filtros de data são opcionais — passando null ignoram o filtro.
     */
    @Query("""
        SELECT t FROM Transaction t
        WHERE (t.sourceAccount.id = :accountId OR t.targetAccount.id = :accountId)
        AND (CAST(:startDate AS java.time.LocalDateTime) IS NULL OR t.createdAt >= :startDate)
        AND (CAST(:endDate AS java.time.LocalDateTime) IS NULL OR t.createdAt <= :endDate)
        ORDER BY t.createdAt DESC
    """)
    Page<Transaction> findStatementNoType(
            @Param("accountId") UUID accountId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );

    /**
     * Retorna o extrato paginado de uma conta com filtro de tipo de transação.
     * Útil para filtrar apenas saques, depósitos ou transferências.
     */
    @Query("""
        SELECT t FROM Transaction t
        WHERE (t.sourceAccount.id = :accountId OR t.targetAccount.id = :accountId)
        AND (CAST(:startDate AS java.time.LocalDateTime) IS NULL OR t.createdAt >= :startDate)
        AND (CAST(:endDate AS java.time.LocalDateTime) IS NULL OR t.createdAt <= :endDate)
        AND t.type = :type
        ORDER BY t.createdAt DESC
    """)
    Page<Transaction> findStatementWithType(
            @Param("accountId") UUID accountId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("type") Transaction.TransactionType type,
            Pageable pageable
    );

    /**
     * Soma o total debitado (transferências enviadas + saques) de uma conta
     * a partir de uma data/hora de início — usado para validar limite diário.
     * Retorna 0 se não houver débitos no período.
     */
    @Query("""
        SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t
        WHERE t.sourceAccount.id = :accountId
        AND t.type IN :types
        AND t.status = :status
        AND t.createdAt >= :startOfDay
    """)
    BigDecimal sumDailyDebitsByAccountId(
            @Param("accountId") UUID accountId,
            @Param("startOfDay") LocalDateTime startOfDay,
            @Param("types") java.util.List<Transaction.TransactionType> types,
            @Param("status") Transaction.TransactionStatus status
    );
}
