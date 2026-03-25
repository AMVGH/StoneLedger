package com.stoneledger.server.api.dtos.responses;

import com.stoneledger.server.api.enums.LoggingEvents;
import com.stoneledger.server.api.enums.LoggingTables;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EventLoggingDTO {
    private Long id;
    private Long userId;
    private LocalDateTime timestamp;
    private LoggingTables tableAffected;
    private LoggingEvents eventAction;
    private String beforeImage;
    private String afterImage;
}
