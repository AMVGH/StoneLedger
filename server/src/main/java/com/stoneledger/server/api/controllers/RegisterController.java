package com.stoneledger.server.api.controllers;

import com.stoneledger.server.api.models.UserModel;
import com.stoneledger.server.services.RegisterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/registration")
public class RegisterController {
    @Autowired
    public RegisterService registerService;

    @PostMapping
    public ResponseEntity<UserModel> registerUser(@RequestBody UserModel user){
        System.out.println("Creating new user: " + user.getUsername());
        UserModel createdUser = registerService.registerUser(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdUser);
    }

}
