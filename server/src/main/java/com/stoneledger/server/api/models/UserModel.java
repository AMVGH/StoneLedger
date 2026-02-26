package com.stoneledger.server.api.models;

import com.stoneledger.server.api.enums.UserRole;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

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
    @Column(name="password_expiry", nullable = false)
    private LocalDateTime passwordExpirationDate;
    @Column(name="user_address", nullable = false)
    private String userAddress;
    @Column(name="date_of_birth", nullable = false, updatable = false)
    private LocalDate dateOfBirth;
    @Column(name="profile_picture_url")
    private String profilePictureUrl;
    @Enumerated(EnumType.STRING)
    @Column(name="user_role", nullable = false)
    private UserRole userRole;
    @Column(name="account_creation_date", nullable = false, updatable = false)
    private LocalDateTime accountCreationDate;
    @Column(name="is_active", nullable = false)
    private boolean active;
    @Column(name="active_from")
    private LocalDateTime activeStartDate;
    @Column(name="active_to")
    private LocalDateTime activeEndDate;
    @Column(name="is_suspended", nullable = false)
    private boolean suspended;
    @Column(name="suspended_from")
    private LocalDateTime suspendStartDate;
    @Column(name="suspended_to")
    private LocalDateTime suspendEndDate;
    @Column(name="last_login")
    private LocalDateTime lastLogin;
    @Column(name="failed_login_attempts", nullable = false)
    private int failedLoginAttempts;
    @Column(name="security_question")
    private String securityQuestion;
    @Column(name="security_answer")
    private String securityAnswer;
}