package com.stoneledger.server.api.repositories;

import com.stoneledger.server.api.enums.UserRole;
import com.stoneledger.server.api.models.UserModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<UserModel, Long> {

    /**
     * Find user by username
     */
    Optional<UserModel> findByUsername(String username);

    /**
     * Find user by email
     */
    Optional<UserModel> findByEmail(String email);

    /**
     * Check if username exists
     */
    boolean existsByUsername(String username);

    /**
     * Check if email exists
     */
    boolean existsByEmail(String email);
}