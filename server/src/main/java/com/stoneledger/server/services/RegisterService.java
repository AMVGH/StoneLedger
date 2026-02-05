package com.stoneledger.server.services;

import com.stoneledger.server.api.dtos.RegistrationRequestDTO;
import com.stoneledger.server.api.enums.ResponseStatus;
import com.stoneledger.server.api.models.UserModel;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.stoneledger.server.api.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Date;

@Service
public class RegisterService {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;



    public void registerUser(RegistrationRequestDTO request) throws IllegalArgumentException{
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already exists.");
        } else if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists.");
        }

        String encryptedPassword = passwordEncoder.encode(request.getPassword());

        UserModel newUser = UserModel.builder()
            .firstName(request.getFirstName())
            .lastName(request.getLastName())
            .username(request.getUsername())
            .email(request.getEmail())
            .password(encryptedPassword)
            .dateOfBirth(request.getDateOfBirth())
            .role(request.getUserRole())
            .active(false)
            .accountCreationDate(LocalDate.now())
            .build();

        userRepository.save(newUser);

        //TODO: Implement email service for admin approval
    }
}
