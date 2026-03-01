package com.stoneledger.server.api.dtos.requests;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UserSuspensionDTO {
    private Long id;
    private LocalDateTime suspensionStartDate;
    private LocalDateTime suspensionEndDate;
}
