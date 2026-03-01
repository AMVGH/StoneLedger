package com.stoneledger.server.services;

import com.stoneledger.server.api.repositories.UserRepository;
import com.stoneledger.server.utils.EncryptionUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class PasswordService {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private EncryptionUtil encryptionUtil;
}
