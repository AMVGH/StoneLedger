package com.stoneledger.server.api.dtos.responses;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.antlr.v4.runtime.misc.Pair;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RatioInformationDTO {
    private List<Pair<String, BigDecimal>> profitabilityRatios;
    private List<Pair<String, BigDecimal>> liquidityRatios;
    private List<Pair<String, BigDecimal>> leverageRatios;

    private List<Pair<String, BigDecimal>> activityRatios;
    private List<Pair<String, BigDecimal>> otherRatios;
}
