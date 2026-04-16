package com.stoneledger.server.services;

import com.stoneledger.server.api.dtos.responses.RatioInformationDTO;
import com.stoneledger.server.api.enums.AccountCategory;
import com.stoneledger.server.api.enums.AccountSubcategory;
import com.stoneledger.server.api.exeptions.InvalidRequestException;
import com.stoneledger.server.api.models.AccountModel;
import com.stoneledger.server.api.repositories.AccountRepository;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.antlr.v4.runtime.misc.Pair;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
//import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Service
public class RatioService {
    @Autowired
    private AccountRepository accountRepository;
    @Autowired
    private ErrorMessageService errorMessageService;

    public RatioInformationDTO generateRatioInformation() {
        List<AccountModel> financialAccounts = accountRepository.findAllByIsActive(true);

        RatioInformationDTO ratioInfo = new RatioInformationDTO();

        BigDecimal currentAssetFigure = BigDecimal.ZERO;
        BigDecimal longTermAssetFigure = BigDecimal.ZERO;
        BigDecimal equityFigure = BigDecimal.ZERO;
        BigDecimal expenseFigure = BigDecimal.ZERO;
        BigDecimal revenueFigure = BigDecimal.ZERO;
        BigDecimal currentLiabilityFigure = BigDecimal.ZERO;
        BigDecimal longTermLiabilityFigure = BigDecimal.ZERO;

        // Initializes all relevant figures
        for (AccountModel financialAccount:financialAccounts) {
            switch(financialAccount.getAccountCategory()) {
                case ASSET -> {
                    if (financialAccount.getAccountSubcategory().equals(AccountSubcategory.SHORT_TERM)) {
                        currentAssetFigure = currentAssetFigure.add(financialAccount.getBalance());
                    } else longTermAssetFigure = longTermAssetFigure.add(financialAccount.getBalance());
                }
                case EQUITY -> {
                    equityFigure = equityFigure.add(financialAccount.getBalance());
                }
                case EXPENSE -> {
                    expenseFigure = expenseFigure.add(financialAccount.getBalance());
                }
                case REVENUE -> {
                     revenueFigure = revenueFigure.add(financialAccount.getBalance());
                }
                case LIABILITY -> {
                    if (financialAccount.getAccountSubcategory().equals(AccountSubcategory.SHORT_TERM)) {
                        currentLiabilityFigure = currentLiabilityFigure.add(financialAccount.getBalance());
                    } else longTermLiabilityFigure = longTermLiabilityFigure.add(financialAccount.getBalance());
                }
                // TODO: Add specialized error code for invalid Account Category
                default -> throw new InvalidRequestException(errorMessageService.getError(100));
            }
        }

        FigureContainer financialFigures = new FigureContainer();

        financialFigures.setCurrentAssetFigure(currentAssetFigure);
        financialFigures.setLongTermAssetFigure(longTermAssetFigure);
        financialFigures.setEquityFigure(equityFigure);
        financialFigures.setExpenseFigure(expenseFigure);
        financialFigures.setRevenueFigure(revenueFigure);
        financialFigures.setCurrentLiabilityFigure(currentLiabilityFigure);
        financialFigures.setLongTermLiabilityFigure(longTermLiabilityFigure);


        return ratioInfo;
    }

    public List<Pair<String, Float>> generateProfitabilityRatios(FigureContainer figureContainer){
        List<Pair<String, Float>> profitabilityRatios = new ArrayList<>();

        // Gathering relevant figures for calculations
        BigDecimal sales = figureContainer.getRevenueFigure();
        BigDecimal costOfGoodsSold = BigDecimal.ZERO;


        BigDecimal profitsBeforeTaxesAndInterest = figureContainer.getRevenueFigure()
            .subtract(figureContainer.getExpenseFigure());
        BigDecimal profitsAfterTaxes = profitsBeforeTaxesAndInterest;


        BigDecimal totalAssets = figureContainer.getCurrentAssetFigure().add(figureContainer.getLongTermAssetFigure());
        BigDecimal totalEquity = figureContainer.getEquityFigure();

        //Figure manipulation and ratio pair building

        // Gross Profit Margin
        if (sales.compareTo(BigDecimal.ZERO) != 0) {
            BigDecimal grossProfit = sales.subtract(costOfGoodsSold);

        }

        return profitabilityRatios;
    }
}

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class FigureContainer {
    private BigDecimal currentAssetFigure;
    private BigDecimal longTermAssetFigure;
    private BigDecimal equityFigure;
    private BigDecimal expenseFigure;
    private BigDecimal revenueFigure;
    private BigDecimal currentLiabilityFigure;
    private BigDecimal longTermLiabilityFigure;
}