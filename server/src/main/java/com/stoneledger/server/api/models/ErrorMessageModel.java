package com.stoneledger.server.api.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name="error_messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ErrorMessageModel {
    @Id
    @Column(name="error_code")
    private int errorCode;
    @Column(name="error_key", nullable = false, unique = true)
    private String errorKey;
    @Column(name="error_message", nullable = false, unique = true)
    private String errorMessage;


}
