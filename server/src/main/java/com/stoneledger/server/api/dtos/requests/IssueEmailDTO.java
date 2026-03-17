package com.stoneledger.server.api.dtos.requests;

import lombok.Data;

@Data
public class IssueEmailDTO {
    private String targetEmail;
    private String emailBody;
}
