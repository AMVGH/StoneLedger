package com.stoneledger.server.api.controllers;

import com.stoneledger.server.api.dtos.ApiResponseDTO;
import com.stoneledger.server.api.dtos.responses.AccountInformationDTO;
import com.stoneledger.server.api.dtos.responses.EventLoggingDTO;
import com.stoneledger.server.services.EventLoggingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/events")
public class EventController {
    @Autowired
    private EventLoggingService eventLoggingService;

    @GetMapping("/get-events")
    public ResponseEntity<ApiResponseDTO<?>> getUsers() {
        List<EventLoggingDTO> events = eventLoggingService.getEvents();
        return ResponseEntity.ok(ApiResponseDTO.success(events));
    }
}
