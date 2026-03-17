package com.stoneledger.server.api.dtos.requests;

import com.stoneledger.server.api.enums.UserRole;
import lombok.Data;

@Data
public class UpdateUserRoleDTO {
    private Long id;
    private UserRole userRole;
}
