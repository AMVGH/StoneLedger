package com.stoneledger.server.api.repositories;

import com.stoneledger.server.api.models.AccountModel;
import com.stoneledger.server.api.models.PasswordModel;
import com.stoneledger.server.api.models.UserModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<AccountModel, Long> {
    boolean existsByAccountName(String accountName);
    boolean existsByAccountNumber(long accountNumber);
    @Query("SELECT a FROM AccountModel a JOIN FETCH a.user")
    List<AccountModel> findAllWithUser();
    Optional<AccountModel> findByAccountNumber(long accountNumber);
}
