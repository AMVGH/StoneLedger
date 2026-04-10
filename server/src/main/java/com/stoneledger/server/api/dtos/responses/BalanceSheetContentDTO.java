package com.stoneledger.server.api.dtos.responses;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.antlr.v4.runtime.misc.Pair;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BalanceSheetContentDTO {
    private List<Pair<String, BigDecimal>> currentAssetList;
    private BigDecimal totalCurrentAssets;
    private List<Pair<String, BigDecimal>> propertyPlantEquipmentList;
    private BigDecimal totalPropertyPlantEquipment;
    private BigDecimal totalAssets;
    private List<Pair<String, BigDecimal>> currentLiabilityList;
    private BigDecimal totalCurrentLiabilities;
    private BigDecimal unearnedRevenue;
    private BigDecimal totalLiabilities;
    private List<Pair<String, BigDecimal>> stockholderEquityList;
    private BigDecimal totalStockHolderEquity;
    private BigDecimal totalLiabilitiesAndEquity;

}
