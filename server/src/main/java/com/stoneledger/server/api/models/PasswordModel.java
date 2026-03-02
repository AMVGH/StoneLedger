package com.stoneledger.server.api.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.cglib.core.Local;

import java.time.LocalDateTime;

@Entity
@Table(name="password_history")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PasswordModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="id", nullable = false, updatable = false)
    private long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private UserModel user;

    @Column(name="password", nullable = false)
    private String password;

    @Column(name="valid_from", nullable = false)
    private LocalDateTime validFrom;

    @Column(name="valid_to")
    private LocalDateTime validTo;
}
