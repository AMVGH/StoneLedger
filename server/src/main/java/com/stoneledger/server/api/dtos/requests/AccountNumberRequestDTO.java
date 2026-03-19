package com.stoneledger.server.api.dtos.requests;

import com.stoneledger.server.api.enums.AccountCategory;
import com.stoneledger.server.api.enums.AccountSubcategory;
import lombok.Data;

@Data
public class AccountNumberRequestDTO {
    private AccountCategory accountCategory;
}
