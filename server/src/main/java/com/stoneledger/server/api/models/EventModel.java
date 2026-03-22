package com.stoneledger.server.api.models;

import com.stoneledger.server.api.enums.LoggingEvents;
import com.stoneledger.server.api.enums.LoggingTables;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name="event_log")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EventModel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="id", nullable = false, updatable = false)
    private long id;
    @Column(name="user_id", nullable = false)
    private Long userId;
    @Column(name="timestamp", nullable = false)
    private LocalDateTime timestamp;
    @Enumerated(EnumType.STRING)
    @Column(name="table_affected", nullable = false)
    private LoggingTables tableAffected;
    @Enumerated(EnumType.STRING)
    @Column(name="event_action", nullable = false)
    private LoggingEvents eventAction;
    @Column(name="before_image", columnDefinition = "TEXT")
    private String beforeImage;
    @Column(name="after_image", columnDefinition = "TEXT")
    private String afterImage;
}
