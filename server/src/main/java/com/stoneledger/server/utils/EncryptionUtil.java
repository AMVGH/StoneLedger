package com.stoneledger.server.utils;


import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.util.Base64;

@Service
public class EncryptionUtil {
    /**
     * Source: https://www.baeldung.com/java-jca-blowfish-implementation
     * */
    @Value("${encryption.secret-key}")
    private String secretKey;

    private SecretKeySpec buildSecretKeySpec() {
        return new SecretKeySpec(secretKey.getBytes(), "Blowfish");
    }

    public String encrypt(String plainText) throws GeneralSecurityException {
        SecretKeySpec secretKeySpec = buildSecretKeySpec();
        Cipher cipher = Cipher.getInstance("Blowfish");
        cipher.init(Cipher.ENCRYPT_MODE, secretKeySpec);
        byte[] encryptedBytes = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));
        return Base64.getEncoder().encodeToString(encryptedBytes);
    }

    public String decrypt(String encryptedText) throws GeneralSecurityException {
        SecretKeySpec secretKeySpec = buildSecretKeySpec();
        Cipher cipher = Cipher.getInstance("Blowfish");
        cipher.init(Cipher.DECRYPT_MODE, secretKeySpec);
        byte[] decryptedBytes = cipher.doFinal(Base64.getDecoder().decode(encryptedText));
        return new String(decryptedBytes, StandardCharsets.UTF_8);
    }
}
