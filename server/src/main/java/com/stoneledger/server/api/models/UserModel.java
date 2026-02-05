package com.stoneledger.server.api.models;

import com.stoneledger.server.api.enums.UserRole;
import jakarta.persistence.*;
import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserModel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="id", nullable = false, updatable = false)
    private long id;
    @Column(name="first_name", nullable = false)
    private String firstName;
    @Column(name="last_name", nullable = false)
    private String lastName;
    @Column(name="username", nullable = false, unique = true, updatable = false)
    private String username;
    @Column(name="email", nullable = false, unique = true)
    private String email;
    @Column(name="password", nullable = false)
    private String password;
    @Column(name="date_of_birth", nullable = false)
    private LocalDate dateOfBirth;
    @Enumerated(EnumType.STRING)
    @Column(name="role", nullable = false)
    private UserRole role;
    @Column(name="is_active", nullable = false)
    private boolean active;
    @Column(name="account_creation_date", nullable = false, updatable = false)
    private LocalDate accountCreationDate;

    //TODO: Add fields for things like password expiration, last login, failed attempts, etc.
}