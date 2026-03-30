package com.banking.repository;

import com.banking.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    Optional<User> findByCpf(String cpf);
    boolean existsByEmail(String email);
    boolean existsByCpf(String cpf);
}
