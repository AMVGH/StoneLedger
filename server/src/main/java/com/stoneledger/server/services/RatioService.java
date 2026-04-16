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
import org.springframework.security.core.parameters.P;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Service
public class RatioService {
    @Autowired
    private AccountRepository accountRepository;
    @Autowired
    private ErrorMessageService errorMessageService;


    /**
     * Current Assumptions:
     * 1. Cost Of Goods Sold = 0
     * 2. No Tax Figures Available
     * 3. No Preferred Stock
     * 4. No Common Stock
     * 5. No Inventory Figures
     * 6. No Interest Charges
     * 7. no inventory of finished goods
     * 8. Derivation of market price per share, EPS, ATEPS, ATP, NCO
     */
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

        ratioInfo.setProfitabilityRatios(generateProfitabilityRatios(financialFigures));
        ratioInfo.setLiquidityRatios(generateLiquidityRatios(financialFigures));
        ratioInfo.setLeverageRatios(generateLeverageRatios(financialFigures));
        ratioInfo.setActivityRatios(generateActivityRatios(financialFigures));
        ratioInfo.setOtherRatios(generateOtherRatios(financialFigures));

        return ratioInfo;
    }

    public List<Pair<String, BigDecimal>> generateProfitabilityRatios(FigureContainer figureContainer) {
        List<Pair<String, BigDecimal>> profitabilityRatios = new ArrayList<>();

        // Gathering relevant figures for calculations
        BigDecimal sales = figureContainer.getRevenueFigure();
        BigDecimal costOfGoodsSold = BigDecimal.ZERO; //Service company assumption

        BigDecimal profitsBeforeTaxesAndInterest = figureContainer.getRevenueFigure()
            .subtract(figureContainer.getExpenseFigure());
        BigDecimal profitsAfterTaxes = profitsBeforeTaxesAndInterest; //No tax figures available


        BigDecimal totalAssets = figureContainer.getCurrentAssetFigure().add(figureContainer.getLongTermAssetFigure());
        BigDecimal totalEquity = figureContainer.getEquityFigure();

        if (sales.compareTo(BigDecimal.ZERO) != 0) {
            BigDecimal grossProfitMargin = sales.subtract(costOfGoodsSold)
                    .divide(sales, 4, RoundingMode.HALF_UP);
            profitabilityRatios.add(new Pair<>("Gross Profit Margin", grossProfitMargin));

            BigDecimal operatingProfitMargin = profitsBeforeTaxesAndInterest
                .divide(sales, 4, RoundingMode.HALF_UP);
            profitabilityRatios.add(new Pair<>("Operating Profit Margin", operatingProfitMargin));

            BigDecimal netProfitMargin = profitsAfterTaxes
                .divide(sales, 4, RoundingMode.HALF_UP);
            profitabilityRatios.add(new Pair<>("Net Profit Margin", netProfitMargin));
        }

        if (totalAssets.compareTo(BigDecimal.ZERO) != 0) {
            BigDecimal returnOnTotalAssets = profitsAfterTaxes
                .divide(totalAssets, 4, RoundingMode.HALF_UP);
            profitabilityRatios.add(new Pair<>("Return On Total Assets", returnOnTotalAssets));
        }

        if (totalEquity.compareTo(BigDecimal.ZERO) != 0) {
            BigDecimal returnOnStockholderEquity = profitsAfterTaxes
                .divide(totalEquity,4, RoundingMode.HALF_UP);
            profitabilityRatios.add(new Pair<>("Return on Stockholder Equity", returnOnStockholderEquity));
        }
        return profitabilityRatios;
    }

    public List<Pair<String, BigDecimal>> generateLiquidityRatios(FigureContainer figureContainer) {
        List<Pair<String, BigDecimal>> liquidityRatios = new ArrayList<>();

        BigDecimal currentAssets = figureContainer.getCurrentAssetFigure();
        BigDecimal currentLiabilities = figureContainer.getCurrentLiabilityFigure();
        BigDecimal inventory = BigDecimal.ZERO;

        if (currentLiabilities.compareTo(BigDecimal.ZERO) != 0) {
            BigDecimal currentRatio = currentAssets
                .divide(currentLiabilities, 4, RoundingMode.HALF_UP);
            liquidityRatios.add(new Pair<>("Current Ratio", currentRatio));

            BigDecimal quickRatio = currentAssets.subtract(inventory)
                .divide(currentLiabilities,4,RoundingMode.HALF_UP);
            liquidityRatios.add(new Pair<>("Quick Ratio", quickRatio));

            BigDecimal inventoryToNetWorkingCapital = inventory
                .divide(currentAssets.subtract(currentLiabilities), 4, RoundingMode.HALF_UP);
            liquidityRatios.add(new Pair<>("Inventory to Net Working Capital", inventoryToNetWorkingCapital));
        }
        return liquidityRatios;
    }

    public List<Pair<String, BigDecimal>> generateLeverageRatios(FigureContainer figureContainer) {
        List<Pair<String, BigDecimal>> leverageRatios = new ArrayList<>();

        BigDecimal totalDebt = figureContainer.getCurrentLiabilityFigure()
            .add(figureContainer.getLongTermLiabilityFigure());
        BigDecimal longTermDebt = figureContainer.getLongTermLiabilityFigure();
        BigDecimal totalAssets = figureContainer.getCurrentAssetFigure()
            .add(figureContainer.getLongTermAssetFigure());
        BigDecimal totalStockholderEquity = figureContainer.getEquityFigure();

        if (totalAssets.compareTo(BigDecimal.ZERO) != 0) {
            BigDecimal debtToAssetsRatio = totalDebt
                .divide(totalAssets, 4, RoundingMode.HALF_UP);
            leverageRatios.add(new Pair<>("Debt to Assets Ratio", debtToAssetsRatio));
        }

        if (totalStockholderEquity.compareTo(BigDecimal.ZERO) != 0) {
            BigDecimal debtToEquityRatio = totalDebt
                .divide(totalStockholderEquity, 4, RoundingMode.HALF_UP);
            leverageRatios.add(new Pair<>("Debt to Equity Ratio", debtToEquityRatio));

            BigDecimal longTermDebtToEquityRatio = longTermDebt
                .divide(totalStockholderEquity, 4, RoundingMode.HALF_UP);
            leverageRatios.add(new Pair<>("Long Term Debt to Equity Ratio", longTermDebtToEquityRatio));
        }
        return leverageRatios;
    }

    // TODO: Refine financial figure collection for Accounts Receivable
    private List<Pair<String, BigDecimal>> generateActivityRatios(FigureContainer financialFigures) {
        List<Pair<String, BigDecimal>> activityRatios = new ArrayList<>();

        BigDecimal sales = financialFigures.getRevenueFigure();
        BigDecimal inventoryOfFinishedGoods = BigDecimal.ZERO;
        BigDecimal fixedAssets = financialFigures.getLongTermAssetFigure();
        BigDecimal totalAssets = financialFigures.getCurrentAssetFigure().add(financialFigures.getLongTermAssetFigure());

        if (inventoryOfFinishedGoods.compareTo(BigDecimal.ZERO) != 0) {
            BigDecimal inventoryTurnover = sales
                .divide(inventoryOfFinishedGoods);
            activityRatios.add(new Pair<>("Inventory Turnover", inventoryTurnover));
        }

        if (fixedAssets.compareTo(BigDecimal.ZERO) !=  0) {
            BigDecimal fixedAssetsTurnover = sales
                .divide(fixedAssets, 4, RoundingMode.HALF_UP);
            activityRatios.add(new Pair<>("Fixed Assets Turnover", fixedAssetsTurnover));
        }

        if (totalAssets.compareTo(BigDecimal.ZERO) != 0) {
            BigDecimal totalAssetsTurnover = sales
                .divide(totalAssets, 4, RoundingMode.HALF_UP);
            activityRatios.add(new Pair<>("Total Assets Turnover", totalAssetsTurnover));
        }
        return activityRatios;
    }

    private List<Pair<String, BigDecimal>> generateOtherRatios(FigureContainer financialFigures) {
        List<Pair<String, BigDecimal>> activityRatios = new ArrayList<>();
        return activityRatios;
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