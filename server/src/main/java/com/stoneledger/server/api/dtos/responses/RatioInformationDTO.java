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
    private List<Pair<String, Float>> profitabilityRatios;
    private List<Pair<String, Float>> liquidityRatios;
    private List<Pair<String, Float>> leverageRatios;

    private List<Pair<String, Float>> activityRatios;
    private List<Pair<String, Float>> otherRatios;
}
