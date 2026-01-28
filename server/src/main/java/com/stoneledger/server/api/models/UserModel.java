package com.stoneledger.server.api.models;

import com.stoneledger.server.api.enums.UserRole;
import jakarta.persistence.*;
import java.time.LocalDate;

import lombok.Data;

@Data
@Entity
@Table(name = "users")
public class UserModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private String password;
    private LocalDate dateOfBirth;
    private Boolean active;

    @Enumerated(EnumType.STRING)
    private UserRole userRole;
}
