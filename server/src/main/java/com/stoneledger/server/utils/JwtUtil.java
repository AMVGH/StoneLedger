package com.stoneledger.server.utils;

import com.stoneledger.server.api.exeptions.JWTDecodeException;
import com.stoneledger.server.services.ErrorMessageService;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component
public class JwtUtil {
    private static SecretKey KEY;
    private static ErrorMessageService errorMessageService;

    @Autowired
    public JwtUtil(@Value("${jwt.secret-key}") String secretKey, ErrorMessageService errorMessageService) {
        KEY = Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
        JwtUtil.errorMessageService = errorMessageService;
    }

    public static String createJwt(Long userId, String username) {
        return Jwts.builder()
            .claim("userId", userId)
            .claim("username", username)
            .signWith(KEY)
            .compact();
    }

    public static Claims decodeJwt(String token) {
        try {
            return Jwts.parserBuilder()
                .setSigningKey(KEY)
                .build()
                .parseClaimsJws(token)
                .getBody();
        } catch (Exception e) {
            throw new JWTDecodeException(errorMessageService.getError(105));
        }
    }
}