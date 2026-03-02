package com.stoneledger.server.api.dtos.requests;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UserActivityDTO {
    private Long id;
    private Boolean activityStatus;
    private LocalDateTime activityEndDate; // Optional, null = indefinite
}
