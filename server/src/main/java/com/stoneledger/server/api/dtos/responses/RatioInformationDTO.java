package com.stoneledger.server.api.dtos.responses;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.antlr.v4.runtime.misc.Pair;
import org.antlr.v4.runtime.misc.Triple;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RatioInformationDTO {
    private List<Triple<String, BigDecimal, BigDecimal>> profitabilityRatios;
    private List<Triple<String, BigDecimal, BigDecimal>> liquidityRatios;
    private List<Triple<String, BigDecimal, BigDecimal>> leverageRatios;
    private List<Triple<String, BigDecimal, BigDecimal>> activityRatios;
}
