package com.banking.repository;

import com.banking.entity.Account;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AccountRepository extends JpaRepository<Account, UUID> {

    Optional<Account> findByUserId(UUID userId);

    Optional<Account> findByAccountNumber(String accountNumber);

    @Lock(LockModeType.OPTIMISTIC_FORCE_INCREMENT)
    @Query("SELECT a FROM Account a WHERE a.id = :id")
    Optional<Account> findByIdWithLock(UUID id);

    boolean existsByAccountNumber(String accountNumber);
}
