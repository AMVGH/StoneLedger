package com.stoneledger.server.services;

import com.stoneledger.server.api.dtos.requests.BalanceSheetReportDTO;
import com.stoneledger.server.api.dtos.requests.IncomeStatementReportDTO;
import com.stoneledger.server.api.dtos.requests.RetainedEarningsStatementReportDTO;
import com.stoneledger.server.api.dtos.requests.TrialBalanceReportDTO;
import com.stoneledger.server.api.dtos.responses.*;
import com.stoneledger.server.api.enums.*;
import com.stoneledger.server.api.exeptions.InvalidIdException;
import com.stoneledger.server.api.exeptions.InvalidRequestException;
import com.stoneledger.server.api.models.AccountModel;
import com.stoneledger.server.api.models.TransactionEntryModel;
import com.stoneledger.server.api.repositories.AccountRepository;
import com.stoneledger.server.api.repositories.TransactionEntryRepository;
import com.stoneledger.server.utils.MonetaryUtil;
import lombok.SneakyThrows;
import org.antlr.v4.runtime.misc.Pair;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class ReportService {
    @Autowired
    private ErrorMessageService errorMessageService;
    @Autowired
    private AccountRepository accountRepository;
    @Autowired
    private TransactionEntryRepository transactionEntryRepository;
    @Autowired
    private MonetaryUtil monetaryUtil;
    @SneakyThrows
    public TrialBalanceContentDTO gatherTrialBalanceReportContent(TrialBalanceReportDTO request) {
        BigDecimal totalDebits = BigDecimal.ZERO;
        BigDecimal totalCredits = BigDecimal.ZERO;
        List<TrialBalanceEntryDTO> reportEntries = new ArrayList<>();
        TrialBalanceContentDTO trialBalanceContent = new TrialBalanceContentDTO();

        // Gets all active financial accounts.
        List<AccountModel> activeFinancialAccounts = accountRepository.findAllByIsActive(true);

        // TODO: Add Reversing

        switch (request.getReportType()) {
            case ADJUSTED, REVERSING -> {
                // Gets all approved transactions up to the request date
                for (AccountModel financialAccount:activeFinancialAccounts) {
                    // Collection of the postedEntries for a given account as of the requested period
                    List<TransactionEntryModel> postedEntries = transactionEntryRepository.findByAccountImpactedAndIsApprovedAndEntryDateLessThanEqual(
                        financialAccount,
                        true,
                        request.getPeriodEnd());

                    BigDecimal accountBalance = monetaryUtil.calculateAccountBalanceToDate(financialAccount, postedEntries, request.getPeriodEnd());

                    if (accountBalance.compareTo(BigDecimal.ZERO) == 0) continue;

                    BalanceLean financialAccountBalanceLean = determineBalanceLean(financialAccount, accountBalance);
                    reportEntries.add(new TrialBalanceEntryDTO(
                        financialAccount.getAccountName(),
                        financialAccountBalanceLean,
                        accountBalance.abs()
                    ));

                    if (financialAccountBalanceLean == BalanceLean.CREDIT) {
                        totalCredits = totalCredits.add(accountBalance.abs());
                    } else {
                        totalDebits = totalDebits.add(accountBalance.abs());
                    }
                }

                // Not validating debits = credits here - this report is for finding root causes
                trialBalanceContent.setTotalDebit(totalDebits);
                trialBalanceContent.setTotalCredit(totalCredits);
                trialBalanceContent.setTrialBalanceEntries(reportEntries);
            }
            case UNADJUSTED -> {
                for (AccountModel financialAccount:activeFinancialAccounts) {
                    // Collection of the postedEntries for a given account as of the requested period; only STANDARD
                    List<TransactionEntryModel> postedEntries = transactionEntryRepository.findByAccountImpactedAndIsApprovedAndEntryDateLessThanEqualAndParentTransactionTransactionType(
                        financialAccount,
                        true,
                        request.getPeriodEnd(),
                        TransactionType.STANDARD);

                    BigDecimal accountBalance = monetaryUtil.calculateAccountBalanceToDate(financialAccount, postedEntries, request.getPeriodEnd());

                    if (accountBalance.compareTo(BigDecimal.ZERO) == 0) continue;

                    BalanceLean financialAccountBalanceLean = determineBalanceLean(financialAccount, accountBalance);
                    reportEntries.add(new TrialBalanceEntryDTO(
                        financialAccount.getAccountName(),
                        financialAccountBalanceLean,
                        accountBalance.abs()
                    ));

                    if (financialAccountBalanceLean == BalanceLean.CREDIT) {
                        totalCredits = totalCredits.add(accountBalance.abs());
                    } else {
                        totalDebits = totalDebits.add(accountBalance.abs());
                    }
                }
                // Not validating debits = credits here - this report is for finding root causes
                trialBalanceContent.setTotalDebit(totalDebits);
                trialBalanceContent.setTotalCredit(totalCredits);
                trialBalanceContent.setTrialBalanceEntries(reportEntries);
            }
            case POST_CLOSING -> {
                // Gets all approved transactions up to the request date
                for (AccountModel financialAccount:activeFinancialAccounts) {
                    // Exclude any financial accounts whose category is EXPENSE or REVENUE
                    if (financialAccount.getAccountCategory() == AccountCategory.EXPENSE
                        || financialAccount.getAccountCategory() == AccountCategory.REVENUE) continue;

                    // Collection of the postedEntries for a given account as of the requested period
                    List<TransactionEntryModel> postedEntries = transactionEntryRepository.findByAccountImpactedAndIsApprovedAndEntryDateLessThanEqual(
                        financialAccount,
                        true,
                        request.getPeriodEnd());

                    BigDecimal accountBalance = monetaryUtil.calculateAccountBalanceToDate(financialAccount, postedEntries, request.getPeriodEnd());

                    if (accountBalance.compareTo(BigDecimal.ZERO) == 0) continue;

                    BalanceLean financialAccountBalanceLean = determineBalanceLean(financialAccount, accountBalance);
                    reportEntries.add(new TrialBalanceEntryDTO(
                        financialAccount.getAccountName(),
                        financialAccountBalanceLean,
                        accountBalance.abs()
                    ));

                    if (financialAccountBalanceLean == BalanceLean.CREDIT) {
                        totalCredits = totalCredits.add(accountBalance.abs());
                    } else {
                        totalDebits = totalDebits.add(accountBalance.abs());
                    }
                }

                // Not validating debits = credits here - this report is for finding root causes
                trialBalanceContent.setTotalDebit(totalDebits);
                trialBalanceContent.setTotalCredit(totalCredits);
                trialBalanceContent.setTrialBalanceEntries(reportEntries);
            }
            default -> throw new InvalidRequestException(errorMessageService.getError(136));
        }
        return trialBalanceContent;
    }

    private BalanceLean determineBalanceLean(AccountModel account, BigDecimal accountBalance) {
        NormalSide normalSide = account.getNormalSide();
        BigDecimal balance = accountBalance;
        boolean isNegative = balance.compareTo(BigDecimal.ZERO) < 0;

        // If balance is negative, flip the lean opposite of normal side
        // If balance is positive, lean matches normal side
        if (isNegative) {
            // Negative balance ; opposite of normal side
            return normalSide == NormalSide.LEFT ? BalanceLean.CREDIT : BalanceLean.DEBIT;
        } else {
            // Positive balance ; matches normal side
            return normalSide == NormalSide.LEFT ? BalanceLean.DEBIT : BalanceLean.CREDIT;
        }
    }

    public IncomeStatementContentDTO gatherIncomeStatementReportContent(IncomeStatementReportDTO request) {
        BigDecimal totalRevenues = BigDecimal.ZERO;
        BigDecimal totalExpenses = BigDecimal.ZERO;
        BigDecimal netIncome;
        List<Pair<String, BigDecimal>> revenueList = new ArrayList<>();
        List<Pair<String, BigDecimal>> expenseList = new ArrayList<>();


        IncomeStatementContentDTO incomeStatementContent = new IncomeStatementContentDTO();

        // Gets all active revenue accounts
        List<AccountModel> activeRevenueAccounts = accountRepository.findAllByIsActiveAndAccountCategory(
            true,
            AccountCategory.REVENUE
        );

        // Gets all active expense accounts
        List<AccountModel> activeExpenseAccounts = accountRepository.findAllByIsActiveAndAccountCategory(
            true,
            AccountCategory.EXPENSE
        );

        for (AccountModel revenueAccount : activeRevenueAccounts) {
            List<TransactionEntryModel> postedEntries = transactionEntryRepository.findByAccountImpactedAndIsApprovedAndEntryDateLessThanEqual(
                revenueAccount,
                true,
                request.getPeriodEnd());

            // Calculates the account balance up to the given date
            BigDecimal accountBalance = BigDecimal.ZERO;
            switch (revenueAccount.getNormalSide()) {
                case LEFT -> {
                    for (TransactionEntryModel entry : postedEntries) {
                        if (entry.getEntryType() == EntryType.DEBIT) {
                            accountBalance = accountBalance.add(entry.getAmount());
                        } else if (entry.getEntryType() == EntryType.CREDIT) {
                            accountBalance = accountBalance.subtract(entry.getAmount());
                        }
                    }
                }

                case RIGHT -> {
                    for (TransactionEntryModel entry : postedEntries) {
                        if (entry.getEntryType() == EntryType.CREDIT) {
                            accountBalance = accountBalance.add(entry.getAmount());
                        } else if (entry.getEntryType() == EntryType.DEBIT) {
                            accountBalance = accountBalance.subtract(entry.getAmount());
                        }
                    }
                }
            }

            if (accountBalance.compareTo(BigDecimal.ZERO) == 0) continue;

            totalRevenues = totalRevenues.add(accountBalance);
            Pair<String, BigDecimal> revenuePair = new Pair<>(revenueAccount.getAccountName(), accountBalance);
            revenueList.add(revenuePair);
        }

        for (AccountModel expenseAccount : activeExpenseAccounts) {
            List<TransactionEntryModel> postedEntries = transactionEntryRepository.findByAccountImpactedAndIsApprovedAndEntryDateLessThanEqual(
                expenseAccount,
                true,
                request.getPeriodEnd());

            // Calculates the account balance up to the given date
            BigDecimal accountBalance = BigDecimal.ZERO;
            switch (expenseAccount.getNormalSide()) {
                case LEFT -> {
                    for (TransactionEntryModel entry : postedEntries) {
                        if (entry.getEntryType() == EntryType.DEBIT) {
                            accountBalance = accountBalance.add(entry.getAmount());
                        } else if (entry.getEntryType() == EntryType.CREDIT) {
                            accountBalance = accountBalance.subtract(entry.getAmount());
                        }
                    }
                }

                case RIGHT -> {
                    for (TransactionEntryModel entry : postedEntries) {
                        if (entry.getEntryType() == EntryType.CREDIT) {
                            accountBalance = accountBalance.add(entry.getAmount());
                        } else if (entry.getEntryType() == EntryType.DEBIT) {
                            accountBalance = accountBalance.subtract(entry.getAmount());
                        }
                    }
                }
            }

            if (accountBalance.compareTo(BigDecimal.ZERO) == 0) continue;

            totalExpenses = totalExpenses.add(accountBalance);
            Pair<String, BigDecimal> expensePair = new Pair<>(expenseAccount.getAccountName(), accountBalance);
            expenseList.add(expensePair);
        }

        netIncome = totalRevenues.subtract(totalExpenses);

        incomeStatementContent.setRevenueList(revenueList);
        incomeStatementContent.setTotalRevenues(totalRevenues);
        incomeStatementContent.setExpenseList(expenseList);
        incomeStatementContent.setTotalExpenses(totalExpenses);
        incomeStatementContent.setNetIncome(netIncome);

        return incomeStatementContent;
    }

    public RetainedEarningsStatementContentDTO gatherRetainedEarningsReportContent(RetainedEarningsStatementReportDTO request) {
        YearMonth requestedPeriod = request.getPeriod();

        LocalDateTime latestClosingDate = findLatestClosingDateBefore(requestedPeriod);

        LocalDateTime periodStart;
        LocalDateTime periodEnd;

        if (latestClosingDate != null) {
            periodStart = latestClosingDate.plusDays(1);
            periodEnd = latestClosingDate.plusDays(30).with(LocalTime.MAX);
        } else {
            periodStart = requestedPeriod.atDay(1).atStartOfDay();
            periodEnd = requestedPeriod.atEndOfMonth().atTime(23,59,59);
        }

        AccountModel retainedEarningsAccount = accountRepository
            .findByAccountName(request.getRetainedEarningsTargetAccount())
            .orElseThrow(() -> new InvalidRequestException(
                errorMessageService.getError(123)
            ));

        BigDecimal beginningRetainedEarnings;
        if (latestClosingDate != null) {
            // Get balance as of the closing date (after closing entries)
            List<TransactionEntryModel> entriesUpToClosing = transactionEntryRepository
                .findByAccountImpactedAndIsApprovedAndEntryDateLessThanEqual(
                    retainedEarningsAccount,
                    true,
                    latestClosingDate
                );
            beginningRetainedEarnings = monetaryUtil.calculateAccountBalanceToDate(
                retainedEarningsAccount,
                entriesUpToClosing,
                latestClosingDate
            );
        } else {
            // No closing entries - get balance from beginning of time
            List<TransactionEntryModel> allEntries = transactionEntryRepository
                .findByAccountImpactedAndIsApprovedAndEntryDateLessThanEqual(
                    retainedEarningsAccount,
                    true,
                    periodStart.minusNanos(1)
                );
            beginningRetainedEarnings = monetaryUtil.calculateAccountBalanceToDate(
                retainedEarningsAccount,
                allEntries,
                periodStart
            );
        }

        // Calculate net income and dividends for the period since last closing
        BigDecimal netIncome = calculateNetIncomeForPeriod(periodStart, periodEnd);
        BigDecimal dividends = calculateDividendsForPeriod(periodStart, periodEnd,
            request.getDividendsDistributedTargetAccount());

        BigDecimal endingRetainedEarnings = beginningRetainedEarnings
            .add(netIncome)
            .subtract(dividends);

        return new RetainedEarningsStatementContentDTO(
            periodStart,
            periodEnd,
            beginningRetainedEarnings,
            endingRetainedEarnings,
            netIncome,
            dividends
        );
    }

    private LocalDateTime findLatestClosingDateBefore(YearMonth requestedPeriod) {
        LocalDateTime periodEnd = requestedPeriod.atEndOfMonth().atTime(23, 59, 59);

        // Query for the latest closing transaction entry date
        List<AccountModel> activeAccounts = accountRepository.findAllByIsActive(true);
        LocalDateTime latestClosingDate = null;

        for (AccountModel account : activeAccounts) {
            List<TransactionEntryModel> closingEntries = transactionEntryRepository
                .findByAccountImpactedAndIsApprovedAndParentTransactionTransactionType(
                    account,
                    true,
                    TransactionType.CLOSING
                );

            for (TransactionEntryModel entry : closingEntries) {
                if (entry.getParentTransaction() != null &&
                    entry.getParentTransaction().getCreatedDate() != null) {
                    LocalDateTime entryDate = entry.getParentTransaction().getCreatedDate();

                    // Only consider closing entries on or before the period end
                    if (!entryDate.isAfter(periodEnd)) {
                        if (latestClosingDate == null || entryDate.isAfter(latestClosingDate)) {
                            latestClosingDate = entryDate;
                        }
                    }
                }
            }
        }

        return latestClosingDate;
    }

    private BigDecimal calculateDividendsForPeriod(LocalDateTime periodStart,
                                                   LocalDateTime periodEnd,
                                                   String targetAccountName) {
        Optional<AccountModel> dividendsAccount = accountRepository
            .findByAccountName(targetAccountName);

        if (dividendsAccount.isEmpty()) {
            return BigDecimal.ZERO;
        }

        List<TransactionEntryModel> dividendEntries = transactionEntryRepository
            .findByAccountImpactedAndIsApprovedAndEntryDateBetween(
                dividendsAccount.get(),
                true,
                periodStart,
                periodEnd
            );

        return monetaryUtil.calculateAccountBalanceToDate(
            dividendsAccount.get(),
            dividendEntries,
            periodEnd
        );
    }

    // Helper method to calculate net income for a period
    private BigDecimal calculateNetIncomeForPeriod(LocalDateTime periodStart, LocalDateTime periodEnd) {
        List<AccountModel> revenueAccounts = accountRepository
            .findAllByAccountCategoryAndIsActive(AccountCategory.REVENUE, true);

        List<AccountModel> expenseAccounts = accountRepository
            .findAllByAccountCategoryAndIsActive(AccountCategory.EXPENSE, true);

        BigDecimal totalRevenue = calculateAccountBalancesForPeriod(revenueAccounts, periodStart, periodEnd);
        BigDecimal totalExpenses = calculateAccountBalancesForPeriod(expenseAccounts, periodStart, periodEnd);

        return totalRevenue.subtract(totalExpenses);
    }

    private BigDecimal calculateAccountBalancesForPeriod(List<AccountModel> accounts,
                                                         LocalDateTime periodStart,
                                                         LocalDateTime periodEnd) {
        BigDecimal total = BigDecimal.ZERO;

        for (AccountModel account : accounts) {
            List<TransactionEntryModel> entries = transactionEntryRepository
                .findByAccountImpactedAndIsApprovedAndEntryDateBetween(
                    account,
                    true,
                    periodStart,
                    periodEnd
                );

            BigDecimal balance = monetaryUtil.calculateAccountBalanceToDate(account, entries, periodEnd);
            total = total.add(balance);
        }

        return total;
    }

    public BalanceSheetContentDTO gatherBalanceSheetReportContent(BalanceSheetReportDTO request) {
        BalanceSheetContentDTO balanceSheetContent = new BalanceSheetContentDTO();

        List<Pair<String,BigDecimal>> currentAssetList = new ArrayList<>();
        List<Pair<String,BigDecimal>> longTermAssetList = new ArrayList<>();
        BigDecimal totalCurrentAssets = BigDecimal.ZERO;
        BigDecimal totalLongTermAssets = BigDecimal.ZERO;
        BigDecimal totalAssets;

        List<AccountModel> assetAccounts = accountRepository.findAllByAccountCategoryAndIsActive(
            AccountCategory.ASSET,
            true
        );

        // Iterates over each of the asset accounts and retrieves the associated ledger entries within the period
        for (AccountModel assetAccount : assetAccounts) {
            List<TransactionEntryModel> postedEntries = transactionEntryRepository.findByAccountImpactedAndIsApprovedAndEntryDateLessThanEqual(
                assetAccount,
                true,
                request.getPeriodEnd());
            BigDecimal accountBalance = monetaryUtil.calculateAccountBalanceToDate(assetAccount, postedEntries, request.getPeriodEnd());

            // Skip 0 balance
            if (accountBalance.compareTo(BigDecimal.ZERO) == 0) continue;

            if (assetAccount.getAccountSubcategory() == AccountSubcategory.SHORT_TERM) {
                totalCurrentAssets = totalCurrentAssets.add(accountBalance);
                currentAssetList.add(new Pair<>(assetAccount.getAccountName(), accountBalance));
            } else if (assetAccount.getAccountSubcategory() == AccountSubcategory.LONG_TERM) {
                totalLongTermAssets = totalLongTermAssets.add(accountBalance);
                longTermAssetList.add(new Pair<>(assetAccount.getAccountName(), accountBalance));
            }
        }

        totalAssets = totalCurrentAssets.add(totalLongTermAssets);

        balanceSheetContent.setCurrentAssetList(currentAssetList);
        balanceSheetContent.setTotalCurrentAssets(totalCurrentAssets);
        balanceSheetContent.setPropertyPlantEquipmentList(longTermAssetList);
        balanceSheetContent.setTotalPropertyPlantEquipment(totalLongTermAssets);
        balanceSheetContent.setTotalAssets(totalAssets);

        List<Pair<String,BigDecimal>> currentLiabilityList = new ArrayList<>();
        BigDecimal totalCurrentLiabilities = BigDecimal.ZERO;
        BigDecimal totalUnearnedRevenue = BigDecimal.ZERO;
        BigDecimal totalLiabilities;

        List<AccountModel> liabilityAccounts = accountRepository.findAllByAccountCategoryAndIsActive(
            AccountCategory.LIABILITY,
            true
        );

        for (AccountModel liabilityAccount : liabilityAccounts) {
            List<TransactionEntryModel> postedEntries = transactionEntryRepository.findByAccountImpactedAndIsApprovedAndEntryDateLessThanEqual(
                liabilityAccount,
                true,
                request.getPeriodEnd());

            BigDecimal accountBalance = monetaryUtil.calculateAccountBalanceToDate(liabilityAccount, postedEntries, request.getPeriodEnd());

            if (accountBalance.compareTo(BigDecimal.ZERO) == 0) continue;


            if (liabilityAccount.getAccountSubcategory() == AccountSubcategory.SHORT_TERM) {
                totalCurrentLiabilities = totalCurrentLiabilities.add(accountBalance);
                currentLiabilityList.add(new Pair<>(liabilityAccount.getAccountName(), accountBalance));
            } else if (liabilityAccount.getAccountSubcategory() == AccountSubcategory.LONG_TERM) {
                totalUnearnedRevenue = totalUnearnedRevenue.add(accountBalance);
            }
        }

        totalLiabilities = totalCurrentLiabilities.add(totalUnearnedRevenue);

        balanceSheetContent.setCurrentLiabilityList(currentLiabilityList);
        balanceSheetContent.setTotalCurrentLiabilities(totalCurrentLiabilities);
        balanceSheetContent.setUnearnedRevenue(totalUnearnedRevenue);
        balanceSheetContent.setTotalLiabilities(totalLiabilities);

        List<Pair<String,BigDecimal>> stockholderEquityList = new ArrayList<>();
        BigDecimal totalStockholderEquity = BigDecimal.ZERO;
        BigDecimal totalLiabilitiesAndEquity;

        List<AccountModel> equityAccounts = accountRepository.findAllByAccountCategoryAndIsActive(
            AccountCategory.EQUITY,
            true
        );

        for (AccountModel equityAccount : equityAccounts) {
            List<TransactionEntryModel> postedEntries = transactionEntryRepository.findByAccountImpactedAndIsApprovedAndEntryDateLessThanEqual(
                equityAccount,
                true,
                request.getPeriodEnd()
            );

            BigDecimal accountBalance = monetaryUtil.calculateAccountBalanceToDate(equityAccount, postedEntries, request.getPeriodEnd());

            if (accountBalance.compareTo(BigDecimal.ZERO) == 0) continue;

            stockholderEquityList.add(new Pair<>(equityAccount.getAccountName(), accountBalance));
            totalStockholderEquity = totalStockholderEquity.add(accountBalance);
        }

        totalLiabilitiesAndEquity = totalStockholderEquity.add(totalLiabilities);

        balanceSheetContent.setStockholderEquityList(stockholderEquityList);
        balanceSheetContent.setTotalStockHolderEquity(totalStockholderEquity);
        balanceSheetContent.setTotalLiabilitiesAndEquity(totalLiabilitiesAndEquity);

        return balanceSheetContent;
    }

    public PostClosingWarningDTO issuePostClosingWarning() {
        PostClosingWarningDTO postClosingWarning = new PostClosingWarningDTO();

        postClosingWarning.setIssueWarning(false);
        postClosingWarning.setLatestPostClosingDate(null);

        List<AccountModel> activeFinancialAccounts = accountRepository.findAllByIsActive(true);

        LocalDateTime latestClosingDate = null;

        for (AccountModel financialAccount : activeFinancialAccounts) {
            List<TransactionEntryModel> postedEntries = transactionEntryRepository.findByAccountImpactedAndIsApprovedAndParentTransactionTransactionType(
                financialAccount,
                true,
                TransactionType.CLOSING);

            // Find the latest entry date from closing transactions
            for (TransactionEntryModel entry : postedEntries) {
                if (entry.getParentTransaction() != null && entry.getParentTransaction().getCreatedDate() != null) {
                    LocalDateTime entryDate = entry.getParentTransaction().getCreatedDate();
                    if (latestClosingDate == null || entryDate.isAfter(latestClosingDate)) {
                        latestClosingDate = entryDate;
                    }
                }
            }
        }

        // If we found any closing entries
        if (latestClosingDate != null) {
            postClosingWarning.setIssueWarning(true);
            postClosingWarning.setLatestPostClosingDate(latestClosingDate);
        }

        return postClosingWarning;
    }
}
