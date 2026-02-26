package com.stoneledger.server.api.repositories;

import com.stoneledger.server.api.enums.UserRole;
import com.stoneledger.server.api.models.UserModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<UserModel, Long> {
    Optional<UserModel> findByUsername(String username);
    Optional<UserModel> findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    List<UserModel> findEmailByUserRole(UserRole userRole);
}