package com.stoneledger.server.api.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import com.stoneledger.server.api.models.ErrorMessageModel;

import java.util.Optional;

public interface ErrorMessageRepository extends JpaRepository<ErrorMessageModel, Integer> {
    Optional<ErrorMessageModel> findByErrorKey(String errorKey);
}
