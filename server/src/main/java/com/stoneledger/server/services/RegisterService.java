package com.stoneledger.server.services;

import com.stoneledger.server.api.models.UserModel;
import com.stoneledger.server.api.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class RegisterService {
    @Autowired
    public UserRepository userRepository;

    public UserModel registerUser(UserModel user){
        if (userRepository.existsByUsername(user.getUsername())){
            throw new IllegalArgumentException("Username already exits: " + user.getUsername());
        }

        if (userRepository.existsByEmail(user.getEmail())){
            throw new IllegalArgumentException("Email already exists: " + user.getEmail());
        }

        //Encrypt pass

        if(user.getActive() == null){
            user.setActive(true);
        }

        UserModel savedUser = userRepository.save(user);
        return savedUser;
    }
}
