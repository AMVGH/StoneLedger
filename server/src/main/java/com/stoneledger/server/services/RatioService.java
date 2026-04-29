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
import org.antlr.v4.runtime.misc.Triple;
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
                default -> throw new InvalidRequestException(errorMessageService.getError(140));
            }
        }

        FigureContainer financialFigures = new FigureContainer();

        // At closing figs are listed - A.V
        financialFigures.setCurrentAssetFigure(currentAssetFigure); //17995
        financialFigures.setLongTermAssetFigure(longTermAssetFigure); //8800
        financialFigures.setEquityFigure(equityFigure); //24775
        financialFigures.setExpenseFigure(expenseFigure); //0
        financialFigures.setRevenueFigure(revenueFigure); //0
        financialFigures.setCurrentLiabilityFigure(currentLiabilityFigure); //1020
        financialFigures.setLongTermLiabilityFigure(longTermLiabilityFigure); //1000

        ratioInfo.setProfitabilityRatios(generateProfitabilityRatios(financialFigures));
        ratioInfo.setLiquidityRatios(generateLiquidityRatios(financialFigures));
        ratioInfo.setLeverageRatios(generateLeverageRatios(financialFigures));
        ratioInfo.setActivityRatios(generateActivityRatios(financialFigures));

        return ratioInfo;
    }

    public List<Triple<String, BigDecimal, BigDecimal>> generateProfitabilityRatios(FigureContainer figureContainer) {
        List<Triple<String, BigDecimal, BigDecimal>> profitabilityRatios = new ArrayList<>();

        // Gathering relevant figures for calculations
        BigDecimal sales = figureContainer.getRevenueFigure();
        BigDecimal costOfGoodsSold = BigDecimal.ZERO; //Service based business so COGS is 0.

        BigDecimal profitsBeforeTaxesAndInterest = figureContainer.getRevenueFigure()
            .subtract(figureContainer.getExpenseFigure());
        BigDecimal profitsAfterTaxes = profitsBeforeTaxesAndInterest; //No tax figures available

        BigDecimal totalAssets = figureContainer.getCurrentAssetFigure().add(figureContainer.getLongTermAssetFigure());
        BigDecimal totalEquity = figureContainer.getEquityFigure();

        if (sales.compareTo(BigDecimal.ZERO) != 0) {
            BigDecimal grossProfitMarginTarget = new BigDecimal("0.6");
            BigDecimal grossProfitMargin = sales.subtract(costOfGoodsSold)
                .divide(sales, 4, RoundingMode.HALF_UP);
            profitabilityRatios.add(new Triple<>("Gross Profit Margin", grossProfitMargin, grossProfitMarginTarget));

            BigDecimal operatingProfitMarginTarget = new BigDecimal("0.3");
            BigDecimal operatingProfitMargin = profitsBeforeTaxesAndInterest
                .divide(sales, 4, RoundingMode.HALF_UP);
            profitabilityRatios.add(new Triple<>("Operating Profit Margin", operatingProfitMargin, operatingProfitMarginTarget));

            BigDecimal netProfitMarginTarget = new BigDecimal("0.2");
            BigDecimal netProfitMargin = profitsAfterTaxes
                .divide(sales, 4, RoundingMode.HALF_UP);
            profitabilityRatios.add(new Triple<>("Net Profit Margin", netProfitMargin, netProfitMarginTarget));
        }

        if (totalAssets.compareTo(BigDecimal.ZERO) != 0) {
            BigDecimal returnOnTotalAssetTarget = new BigDecimal("0.20");
            BigDecimal returnOnTotalAssets = profitsAfterTaxes
                .divide(totalAssets, 4, RoundingMode.HALF_UP);
            profitabilityRatios.add(new Triple<>("Return On Total Assets", returnOnTotalAssets, returnOnTotalAssetTarget));
        }

        if (totalEquity.compareTo(BigDecimal.ZERO) != 0) {
            BigDecimal returnOnStockholderEquityTarget = new BigDecimal("0.2");
            BigDecimal returnOnStockholderEquity = profitsAfterTaxes
                .divide(totalEquity,4, RoundingMode.HALF_UP);
            profitabilityRatios.add(new Triple<>("Return on Stockholder Equity", returnOnStockholderEquity, returnOnStockholderEquityTarget));
        }
        return profitabilityRatios;
    }

    public List<Triple<String, BigDecimal, BigDecimal>> generateLiquidityRatios(FigureContainer figureContainer) {
        List<Triple<String, BigDecimal, BigDecimal>> liquidityRatios = new ArrayList<>();

        BigDecimal currentAssets = figureContainer.getCurrentAssetFigure();
        BigDecimal currentLiabilities = figureContainer.getCurrentLiabilityFigure();
        BigDecimal inventory = BigDecimal.ZERO; // No Inventory Figure

        if (currentLiabilities.compareTo(BigDecimal.ZERO) != 0) {
            BigDecimal currentRatioTarget = new BigDecimal("1.75");
            BigDecimal currentRatio = currentAssets
                .divide(currentLiabilities, 4, RoundingMode.HALF_UP);
            liquidityRatios.add(new Triple<>("Current Ratio", currentRatio, currentRatioTarget));

            BigDecimal quickRatioTarget = new BigDecimal("1.75");
            BigDecimal quickRatio = currentAssets.subtract(inventory)
                .divide(currentLiabilities,4,RoundingMode.HALF_UP);
            liquidityRatios.add(new Triple<>("Quick Ratio", quickRatio, quickRatioTarget));
        }
        return liquidityRatios;
    }

    public List<Triple<String, BigDecimal, BigDecimal>> generateLeverageRatios(FigureContainer figureContainer) {
        List<Triple<String, BigDecimal, BigDecimal>> leverageRatios = new ArrayList<>();

        BigDecimal totalDebt = figureContainer.getCurrentLiabilityFigure()
            .add(figureContainer.getLongTermLiabilityFigure());
        BigDecimal longTermDebt = figureContainer.getLongTermLiabilityFigure();
        BigDecimal totalAssets = figureContainer.getCurrentAssetFigure()
            .add(figureContainer.getLongTermAssetFigure());
        BigDecimal totalStockholderEquity = figureContainer.getEquityFigure();

        if (totalAssets.compareTo(BigDecimal.ZERO) != 0) {
            BigDecimal debtToAssetRatioTarget = new BigDecimal("0.5");
            BigDecimal debtToAssetsRatio = totalDebt
                .divide(totalAssets, 4, RoundingMode.HALF_UP);
            leverageRatios.add(new Triple<>("Debt to Assets Ratio", debtToAssetsRatio, debtToAssetRatioTarget));
        }

        if (totalStockholderEquity.compareTo(BigDecimal.ZERO) != 0) {
            BigDecimal debtToEquityRatioTarget = new BigDecimal("1");
            BigDecimal debtToEquityRatio = totalDebt
                .divide(totalStockholderEquity, 4, RoundingMode.HALF_UP);
            leverageRatios.add(new Triple<>("Debt to Equity Ratio", debtToEquityRatio, debtToEquityRatioTarget));

            BigDecimal longTermDebtToEquityRatioTarget = new BigDecimal("0.5");
            BigDecimal longTermDebtToEquityRatio = longTermDebt
                .divide(totalStockholderEquity, 4, RoundingMode.HALF_UP);
            leverageRatios.add(new Triple<>("Long Term Debt to Equity Ratio", longTermDebtToEquityRatio, longTermDebtToEquityRatioTarget));
        }
        return leverageRatios;
    }

    private List<Triple<String, BigDecimal, BigDecimal>> generateActivityRatios(FigureContainer financialFigures) {
        List<Triple<String, BigDecimal, BigDecimal>> activityRatios = new ArrayList<>();

        BigDecimal sales = financialFigures.getRevenueFigure();
        BigDecimal fixedAssets = financialFigures.getLongTermAssetFigure();
        BigDecimal totalAssets = financialFigures.getCurrentAssetFigure().add(financialFigures.getLongTermAssetFigure());

        if (fixedAssets.compareTo(BigDecimal.ZERO) !=  0) {
            BigDecimal fixedAssetTurnoverTarget = new BigDecimal("5.0");
            BigDecimal fixedAssetsTurnover = sales
                .divide(fixedAssets, 4, RoundingMode.HALF_UP);
            activityRatios.add(new Triple<>("Fixed Assets Turnover", fixedAssetsTurnover, fixedAssetTurnoverTarget));
        }

        if (totalAssets.compareTo(BigDecimal.ZERO) != 0) {
            BigDecimal totalAssetTurnoverTarget = new BigDecimal("1.5");
            BigDecimal totalAssetsTurnover = sales
                .divide(totalAssets, 4, RoundingMode.HALF_UP);
            activityRatios.add(new Triple<>("Total Assets Turnover", totalAssetsTurnover, totalAssetTurnoverTarget));
        }
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