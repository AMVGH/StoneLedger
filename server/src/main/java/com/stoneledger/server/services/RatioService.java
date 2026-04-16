package com.stoneledger.server.services;

import com.stoneledger.server.api.dtos.responses.RatioInformationDTO;
import com.stoneledger.server.api.enums.AccountCategory;
import com.stoneledger.server.api.models.AccountModel;
import com.stoneledger.server.api.repositories.AccountRepository;
import org.antlr.v4.runtime.misc.Pair;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class RatioService {
    @Autowired
    private AccountRepository accountRepository;

    public RatioInformationDTO generateRatioInformation() {
        List<AccountModel> financialAccounts = accountRepository.findAllByIsActive(true);

        RatioInformationDTO ratioInfo = new RatioInformationDTO();

        // Build ratio content

        return ratioInfo;
    }
}