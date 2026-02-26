package com.stoneledger.server.api.controllers;

import com.stoneledger.server.api.dtos.ApiResponseDTO;
import com.stoneledger.server.api.exeptions.MessagingLookupException;
import com.stoneledger.server.services.UserService;
import jakarta.mail.MessagingException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {
    @Autowired
    private UserService userService;

    //TODO: Write endpoint to return all relevant user info based on a JWT
    @GetMapping("/instanceInfo")
    public ResponseEntity<ApiResponseDTO<?>> userInstanceInfo(@RequestHeader("Authorization") String authHeader){
        //
        return new ResponseEntity<>(null);
    }

    @GetMapping("/approve/{id}")
    public ResponseEntity<ApiResponseDTO<?>> approveUser(@PathVariable Long id) throws MessagingException, MessagingLookupException {
        userService.approveUserById(id);
        return ResponseEntity.ok(ApiResponseDTO.success("User approved successfully."));
    }

    @GetMapping("/reject/{id}")
    public ResponseEntity<ApiResponseDTO<?>> rejectUser(@PathVariable Long id) throws MessagingException, MessagingLookupException{
        userService.rejectUserById(id);
        return ResponseEntity.ok(ApiResponseDTO.success("User rejected successfully."));
    }


}
