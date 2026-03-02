package com.stoneledger.server.api.repositories;

import com.stoneledger.server.api.models.PasswordModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PasswordRepository extends JpaRepository <PasswordModel, Long> {
    List<PasswordModel> findByUser_Id(Long userId);
}
