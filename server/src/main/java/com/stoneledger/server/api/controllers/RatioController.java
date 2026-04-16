package com.stoneledger.server.api.controllers;

import com.stoneledger.server.api.dtos.ApiResponseDTO;
import com.stoneledger.server.api.dtos.responses.RatioInformationDTO;
import com.stoneledger.server.services.RatioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ratios")
public class RatioController {
    @Autowired
    private RatioService ratioService;
    @GetMapping("/gather-finance-ratios")
    public ResponseEntity<ApiResponseDTO<?>> gatherFinanceRatiosForDashboard() {
        RatioInformationDTO ratioInformation = ratioService.generateRatioInformation();
        return ResponseEntity.ok(ApiResponseDTO.success(ratioInformation));
    }
}
