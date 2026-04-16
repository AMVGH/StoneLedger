import React, { useState, useRef, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  getTrialBalanceContent,
  getIncomeStatementContent,
  getBalanceSheetContent,
  getRetainedEarningsContent,
  issuePostClosingWarning,
} from "../API/Report";
import { getFinancialAccounts } from "../API/FinancialAccount";

export default function Reports() {
  const [reportType, setReportType] = useState("TRIAL_BALANCE");
  const [params, setParams] = useState({
    trialBalanceType: "UNADJUSTED",
    periodEnd: "",
    retainedEarningsAccount: "",
    dividendsDistributedAccount: "",
    period: "",
  });
  const [result, setResult] = useState(null);
  const [fetchError, setFetchError] = useState("");
  const [fetching, setFetching] = useState(false);
  const [financialAccounts, setFinancialAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [postClosingWarning, setPostClosingWarning] = useState(null);
  const [showInfo, setShowInfo] = useState(false);

  // Fetch financial accounts on component mount
  useEffect(() => {
    const fetchAccounts = async () => {
      setLoadingAccounts(true);
      try {
        const response = await getFinancialAccounts();
        setFinancialAccounts(response?.data || []);
      } catch (err) {
        console.error("Failed to fetch financial accounts:", err);
      } finally {
        setLoadingAccounts(false);
      }
    };
    fetchAccounts();
  }, []);

  // Fetch post-closing warning on component mount
  useEffect(() => {
    const fetchPostClosingWarning = async () => {
      try {
        const response = await issuePostClosingWarning();
        const warningData = response?.data || response;
        if (warningData?.issueWarning && warningData?.latestPostClosingDate) {
          setPostClosingWarning(warningData);
        } else {
          setPostClosingWarning(null);
        }
      } catch (err) {
        console.error("Failed to fetch post-closing warning:", err);
      }
    };

    fetchPostClosingWarning();
  }, []);

  const handleParamChange = (e) => {
    const { name, value } = e.target;
    setParams((prev) => ({ ...prev, [name]: value }));
    setResult(null);
    setFetchError("");
    setShowInfo(false);
  };

  const handleReportTypeChange = (e) => {
    setReportType(e.target.value);
    setResult(null);
    setFetchError("");
    setShowInfo(false);
  };

  // Parse date string safely without timezone shift
  const parseLocalDate = (dateStr) => {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  // Check if info should be shown based on selected date
  const shouldShowInfo = (selectedDateStr, warningDateStr) => {
    if (!warningDateStr || !selectedDateStr) return false;

    const selectedDate = parseLocalDate(selectedDateStr);
    let warningDate;

    if (warningDateStr.includes('T')) {
      const datePart = warningDateStr.split('T')[0];
      const [year, month, day] = datePart.split("-").map(Number);
      warningDate = new Date(year, month - 1, day);
    } else {
      warningDate = parseLocalDate(warningDateStr);
    }

    if (!selectedDate || !warningDate) return false;

    // Show info if selected date is BEFORE the closing date
    return selectedDate < warningDate;
  };

  const handleGenerate = async () => {
    setFetchError("");
    setResult(null);
    setFetching(true);
    setShowInfo(false);

    try {
      let data;
      const periodEndISO = params.periodEnd ? new Date(params.periodEnd).toISOString() : null;

      switch (reportType) {
        case "TRIAL_BALANCE":
          if (!params.periodEnd) {
            setFetchError("Period end date is required.");
            setFetching(false);
            return;
          }

          // Check if info should be shown
          if (postClosingWarning && postClosingWarning.latestPostClosingDate) {
            const show = shouldShowInfo(
              params.periodEnd,
              postClosingWarning.latestPostClosingDate
            );
            setShowInfo(show);
          }

          data = await getTrialBalanceContent(params.trialBalanceType, periodEndISO);
          break;

        case "INCOME_STATEMENT":
          if (!params.periodEnd) {
            setFetchError("Period end date is required.");
            setFetching(false);
            return;
          }

          // Check info for income statement
          if (postClosingWarning && postClosingWarning.latestPostClosingDate) {
            const show = shouldShowInfo(
              params.periodEnd,
              postClosingWarning.latestPostClosingDate
            );
            setShowInfo(show);
          }

          data = await getIncomeStatementContent(periodEndISO);
          break;

        case "BALANCE_SHEET":
          if (!params.periodEnd) {
            setFetchError("Period end date is required.");
            setFetching(false);
            return;
          }

          // Check info for balance sheet
          if (postClosingWarning && postClosingWarning.latestPostClosingDate) {
            const show = shouldShowInfo(
              params.periodEnd,
              postClosingWarning.latestPostClosingDate
            );
            setShowInfo(show);
          }

          data = await getBalanceSheetContent(periodEndISO);
          break;

        case "RETAINED_EARNINGS":
          if (!params.period) {
            setFetchError("Period (month) is required.");
            setFetching(false);
            return;
          }
          if (!params.retainedEarningsAccount) {
            setFetchError("Retained earnings target account is required.");
            setFetching(false);
            return;
          }
          if (!params.dividendsDistributedAccount) {
            setFetchError("Dividends distributed account is required.");
            setFetching(false);
            return;
          }
          data = await getRetainedEarningsContent(
            params.retainedEarningsAccount,
            params.dividendsDistributedAccount,
            params.period
          );
          break;

        default:
          break;
      }
      setResult(data?.data ?? data);
    } catch (err) {
      setFetchError(err.response?.data?.message || err.message || "Failed to generate report.");
    } finally {
      setFetching(false);
    }
  };

  // Plain number — no dollar sign
  const fmtNum = (val) => {
    if (val == null) return "";
    const num = Number(val);
    return isNaN(num) ? String(val) : num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // With leading "$ "
  const fmtDollar = (val) => {
    const n = fmtNum(val);
    return n ? `$ ${n}` : "";
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return "—";

    let d;
    if (typeof dateStr === 'string' && dateStr.includes('T')) {
      const datePart = dateStr.split('T')[0];
      const [year, month, day] = datePart.split("-").map(Number);
      d = new Date(year, month - 1, day);
    } else if (typeof dateStr === 'string' && dateStr.includes('-')) {
      const [year, month, day] = dateStr.split("-").map(Number);
      d = new Date(year, month - 1, day);
    } else {
      d = new Date(dateStr);
    }

    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const fmtDate = (val) => {
    return formatDisplayDate(val);
  };

  const fmtPeriodEndHeader = (dateStr) => {
    return formatDisplayDate(dateStr);
  };

  const trialBalanceSubtypeLabel = (type) => {
    switch (type) {
      case "UNADJUSTED":   return "Unadjusted Trial Balance";
      case "ADJUSTED":     return "Adjusted Trial Balance";
      case "REVERSING":    return "Reversing Trial Balance";
      case "POST_CLOSING": return "Post-Closing Trial Balance";
      default:             return "Trial Balance";
    }
  };

  // ── UI chrome ──
  const panelStyle       = { display: "flex", flexDirection: "row", gap: "20px", alignItems: "flex-start" };
  const cardStyle        = { background: "#fff", border: "0.5px solid #e5e7eb", borderRadius: "10px", padding: "20px 24px" };
  const filterPanelStyle = { ...cardStyle, width: "220px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "16px" };
  const resultPanelStyle = { ...cardStyle, flex: 1, minWidth: 0 };
  const rowStyle         = { display: "flex", flexDirection: "column", gap: "14px" };
  const groupStyle       = { display: "flex", flexDirection: "column", gap: "5px" };
  const labelStyle       = { fontSize: "12px", fontWeight: 500, color: "#374151" };
  const inputStyle       = { padding: "7px 10px", border: "0.5px solid #d1d5db", borderRadius: "6px", fontSize: "13px", color: "#111827", background: "#fff", outline: "none", width: "100%", boxSizing: "border-box" };
  const selectStyle      = { ...inputStyle, cursor: "pointer" };
  const btnStyle         = { padding: "8px 0", border: "none", borderRadius: "6px", background: "#4f46e5", color: "#fff", fontSize: "13px", cursor: "pointer", fontWeight: 500, width: "100%", marginTop: "4px" };
  const errorStyle       = { background: "#fef2f2", border: "0.5px solid #fecaca", color: "#b91c1c", borderRadius: "6px", padding: "8px 12px", fontSize: "13px", marginTop: "12px" };

  // Info banner style (simple blue informational)
  const infoBannerStyle = {
    background: "#e0f2fe",
    border: "1px solid #0284c7",
    borderRadius: "8px",
    padding: "10px 16px",
    marginBottom: "20px",
    color: "#0c4a6e",
    fontSize: "13px",
    display: "flex",
    alignItems: "center",
    gap: "10px"
  };

  const infoIconStyle = {
    fontSize: "16px"
  };

  // ── Shared report header ──
  const reportHeaderStyle        = { textAlign: "center", marginBottom: "16px", fontFamily: "serif", borderBottom: "2px solid #111", paddingBottom: "10px" };
  const reportCompanyNameStyle   = { fontSize: "22px", fontWeight: 500, color: "#111", margin: 0, lineHeight: "1.4" };
  const reportStatementNameStyle = { fontSize: "20px", fontWeight: 400, color: "#111", margin: 0, lineHeight: "1.4" };
  const reportPeriodStyle        = { fontSize: "20px", fontWeight: 400, color: "#111", margin: 0, lineHeight: "1.4" };

  // Shared: no borders anywhere by default; serif font
  const tableStyle = { width: "100%", borderCollapse: "collapse", fontSize: "18px", fontFamily: "serif" };
  const noCell     = { border: "none", padding: "3px 4px", fontFamily: "serif", color: "#111" };

  // ─────────────────────────────────────────
  // TRIAL BALANCE
  // ─────────────────────────────────────────
  const tbThEmpty  = { ...noCell, padding: "4px 8px" };
  const tbThCol    = { ...noCell, padding: "4px 8px", textAlign: "right", fontWeight: 600, fontSize: "18px", textDecoration: "underline" };
  const tbTdAcct   = { ...noCell, padding: "4px 4px", borderTop: "1px solid #ccc" };
  const tbTdAmt    = { ...noCell, padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap", borderTop: "1px solid #ccc" };
  const tbTdTotAcct = { ...tbTdAcct, fontWeight: 700, borderTop: "1px solid #ccc" };
  const tbTdTotAmt  = { ...tbTdAmt, fontWeight: 700, borderTop: "1px solid #ccc", padding: "4px 8px" };

  // ─────────────────────────────────────────
  // INCOME STATEMENT
  // ─────────────────────────────────────────
  const isLabel         = { ...noCell };
  const isLabelIndented = { ...noCell, paddingLeft: "24px" };
  const isLabelBold     = { ...noCell, fontWeight: 700 };
  const isSectionHdr    = { ...noCell, fontWeight: 700, paddingTop: "8px", paddingBottom: "2px" };
  const isAmt           = { ...noCell, textAlign: "right", padding: "3px 16px 3px 8px", whiteSpace: "nowrap" };

  // ─────────────────────────────────────────
  // BALANCE SHEET
  // ─────────────────────────────────────────
  const bsFirstLevel = { ...noCell, fontWeight: 700, paddingTop: "8px" };
  const bsSecondLevel = { ...noCell, paddingLeft: "20px", fontWeight: 500 };
  const bsThirdLevel = { ...noCell, paddingLeft: "40px" };
  const bsAmtLeft = { ...noCell, textAlign: "left", padding: "4px 4px", whiteSpace: "nowrap" };
  const bsAmtRight = { ...noCell, textAlign: "right", padding: "4px 4px", whiteSpace: "nowrap" };

  // ─────────────────────────────────────────
  // RETAINED EARNINGS
  // ─────────────────────────────────────────
  const reLabel         = { ...noCell };
  const reLabelBold     = { ...noCell, fontWeight: 700 };
  const reAmt           = { ...noCell, textAlign: "right", padding: "3px 12px", whiteSpace: "nowrap" };

  const reportRef = useRef(null);

  const handleDownloadPdf = async () => {
    const content = reportRef.current;
    if (!content) return;
    const canvas = await html2canvas(content, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/png");
    const pdfDoc = new jsPDF("p", "mm", "letter");
    const pageWidth  = pdfDoc.internal.pageSize.getWidth();
    const pageHeight = pdfDoc.internal.pageSize.getHeight();
    const margin = 10;
    const imgWidth  = pageWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let yOffset = margin;
    let remainingHeight = imgHeight;
    pdfDoc.addImage(imgData, "PNG", margin, yOffset, imgWidth, imgHeight);
    remainingHeight -= (pageHeight - margin * 2);
    while (remainingHeight > 0) {
      pdfDoc.addPage();
      yOffset -= (pageHeight - margin * 2);
      pdfDoc.addImage(imgData, "PNG", margin, yOffset, imgWidth, imgHeight);
      remainingHeight -= (pageHeight - margin * 2);
    }
    pdfDoc.save(`${reportType.toLowerCase().replace(/_/g, "-")}-${params.periodEnd || params.period || "report"}.pdf`);
  };

  return (
    <div style={panelStyle}>

      <div style={filterPanelStyle}>
        <p style={{ margin: 0, fontSize: "12px", color: "#6b7280", lineHeight: "1.5" }}>
          Select a report type and fill in the required parameters.
        </p>
        <div style={rowStyle}>
          <div style={groupStyle}>
            <label style={labelStyle}>Report Type</label>
            <select style={selectStyle} value={reportType} onChange={handleReportTypeChange}>
              <option value="TRIAL_BALANCE">Trial Balance</option>
              <option value="INCOME_STATEMENT">Income Statement</option>
              <option value="BALANCE_SHEET">Balance Sheet</option>
              <option value="RETAINED_EARNINGS">Retained Earnings</option>
            </select>
          </div>

          {reportType === "TRIAL_BALANCE" && (
            <div style={groupStyle}>
              <label style={labelStyle}>Balance Type</label>
              <select style={selectStyle} name="trialBalanceType" value={params.trialBalanceType} onChange={handleParamChange}>
                <option value="UNADJUSTED">Unadjusted</option>
                <option value="ADJUSTED">Adjusted</option>
                <option value="REVERSING">Reversing</option>
                <option value="POST_CLOSING">Post-Closing</option>
              </select>
            </div>
          )}

          {(reportType === "TRIAL_BALANCE" || reportType === "INCOME_STATEMENT" || reportType === "BALANCE_SHEET") && (
            <div style={groupStyle}>
              <label style={labelStyle}>Period End Date</label>
              <input style={inputStyle} type="date" name="periodEnd" value={params.periodEnd} onChange={handleParamChange} />
            </div>
          )}

          {reportType === "RETAINED_EARNINGS" && (
            <>
              <div style={groupStyle}>
                <label style={labelStyle}>Period (Month)</label>
                <input style={inputStyle} type="month" name="period" value={params.period} onChange={handleParamChange} />
              </div>
              <div style={groupStyle}>
                <label style={labelStyle}>Retained Earnings Account</label>
                <select
                  style={selectStyle}
                  name="retainedEarningsAccount"
                  value={params.retainedEarningsAccount}
                  onChange={handleParamChange}
                  disabled={loadingAccounts}
                >
                  <option value="">Select an account...</option>
                  {financialAccounts.map((account) => (
                    <option
                      key={account.id || account.accountId}
                      value={account.accountName}
                      disabled={account.accountName === params.dividendsDistributedAccount}
                    >
                      {account.accountName}
                    </option>
                  ))}
                </select>
              </div>
              <div style={groupStyle}>
                <label style={labelStyle}>Dividends Declaration Account</label>
                <select
                  style={selectStyle}
                  name="dividendsDistributedAccount"
                  value={params.dividendsDistributedAccount}
                  onChange={handleParamChange}
                  disabled={loadingAccounts}
                >
                  <option value="">Select an account...</option>
                  {financialAccounts.map((account) => (
                    <option
                      key={account.id || account.accountId}
                      value={account.accountName}
                      disabled={account.accountName === params.retainedEarningsAccount}
                    >
                      {account.accountName}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <button style={btnStyle} onClick={handleGenerate} disabled={fetching}>
            {fetching ? "Generating…" : "Generate Report"}
          </button>
        </div>
        {fetchError && <div style={errorStyle}>{fetchError}</div>}
      </div>

      {result && (
        <div style={resultPanelStyle}>
          {/* Simple informational message - shows for any report before closing date */}
          {showInfo && postClosingWarning && (
            <div style={infoBannerStyle}>
              <span>
                Closing entries for the period were applied on{" "}
                <strong>{formatDisplayDate(postClosingWarning.latestPostClosingDate)}</strong>.
                This report reflects data before closing entries were posted.
              </span>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
            <button style={{ ...btnStyle, width: "auto", padding: "8px 16px", marginTop: 0 }} onClick={handleDownloadPdf}>
              Download PDF
            </button>
          </div>

          <div ref={reportRef}>

            {reportType === "TRIAL_BALANCE" && (() => {
              const entries = result.trialBalanceEntries || [];
              const firstDebitIdx  = entries.findIndex(e => e.balanceLean === "DEBIT");
              const firstCreditIdx = entries.findIndex(e => e.balanceLean === "CREDIT");

              return (
                <>
                  <div style={reportHeaderStyle}>
                    <p style={reportCompanyNameStyle}>StoneLedger Accounting</p>
                    <p style={reportStatementNameStyle}>{trialBalanceSubtypeLabel(params.trialBalanceType)}</p>
                    <p style={reportPeriodStyle}>For the Year Ended {fmtPeriodEndHeader(params.periodEnd)}</p>
                  </div>

                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={tbThEmpty}></th>
                        <th style={tbThCol}>Debit</th>
                        <th style={tbThCol}>Credit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((entry, i) => {
                        const isDebit  = entry.balanceLean === "DEBIT";
                        const isCredit = entry.balanceLean === "CREDIT";
                        const debitVal  = isDebit
                          ? (i === firstDebitIdx  ? fmtDollar(entry.amount) : fmtNum(entry.amount))
                          : "";
                        const creditVal = isCredit
                          ? (i === firstCreditIdx ? fmtDollar(entry.amount) : fmtNum(entry.amount))
                          : "";
                        const isFirstRow = i === 0;
                        const rowAcctStyle = { ...tbTdAcct, borderTop: isFirstRow ? "none" : "1px solid #ccc" };
                        const rowAmtStyle = { ...tbTdAmt, borderTop: isFirstRow ? "none" : "1px solid #ccc" };
                        return (
                          <tr key={i}>
                            <td style={rowAcctStyle}>{entry.financialAccountName}</td>
                            <td style={rowAmtStyle}>{debitVal}</td>
                            <td style={rowAmtStyle}>{creditVal}</td>
                          </tr>
                        );
                      })}
                      <tr>
                        <td style={tbTdTotAcct}></td>
                        <td style={tbTdTotAmt}>
                          <span style={{ borderBottom: "3px double #111", display: "inline-block" }}>
                            $ {fmtNum(result.totalDebit)}
                          </span>
                        </td>
                        <td style={tbTdTotAmt}>
                          <span style={{ borderBottom: "3px double #111", display: "inline-block" }}>
                            $ {fmtNum(result.totalCredit)}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </>
              );
            })()}

            {reportType === "INCOME_STATEMENT" && (() => {
              const revenues   = result.revenueList || [];
              const expenses   = result.expenseList || [];
              const lastRevIdx = revenues.length - 1;
              const lastExpIdx = expenses.length - 1;

              return (
                <>
                  <div style={reportHeaderStyle}>
                    <p style={reportCompanyNameStyle}>StoneLedger Accounting</p>
                    <p style={reportStatementNameStyle}>Income Statement</p>
                    <p style={reportPeriodStyle}>For the Year Ended {fmtPeriodEndHeader(params.periodEnd)}</p>
                  </div>

                  <table style={tableStyle}>
                    <tbody>
                      <tr>
                        <td style={isSectionHdr} colSpan={2}>Revenues</td>
                      </tr>
                      {revenues.map((pair, i) => (
                        <tr key={i}>
                          <td style={isLabelIndented}>{pair.a}</td>
                          <td style={isAmt}>
                            {i === lastRevIdx ? (
                              <span style={{ borderBottom: "1px solid #111", display: "inline-block" }}>
                                {i === 0 ? fmtDollar(pair.b) : fmtNum(pair.b)}
                              </span>
                            ) : (
                              <span>{i === 0 ? fmtDollar(pair.b) : fmtNum(pair.b)}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td style={isLabel}>Total Revenues</td>
                        <td style={isAmt}>
                          <span style={{ borderBottom: "1px solid #111", display: "inline-block" }}>
                            {fmtNum(result.totalRevenues)}
                          </span>
                        </td>
                      </tr>

                      <tr><td colSpan={2} style={{ ...noCell, padding: "5px" }}></td></tr>

                      <tr>
                        <td style={isSectionHdr} colSpan={2}>Expenses</td>
                      </tr>
                      {expenses.map((pair, i) => (
                        <tr key={i}>
                          <td style={isLabelIndented}>{pair.a}</td>
                          <td style={isAmt}>
                            {i === lastExpIdx ? (
                              <span style={{ borderBottom: "1px solid #111", display: "inline-block" }}>
                                {fmtNum(pair.b)}
                              </span>
                            ) : (
                              <span>{fmtNum(pair.b)}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td style={isLabel}>Total Expenses</td>
                        <td style={isAmt}>
                          <span style={{ borderBottom: "1px solid #111", display: "inline-block" }}>
                            {fmtNum(result.totalExpenses)}
                          </span>
                        </td>
                      </tr>

                      <tr>
                        <td style={isLabelBold}>Net Income</td>
                        <td style={isAmt}>
                          <span style={{ borderBottom: "3px double #111", display: "inline-block", fontWeight: 700 }}>
                            {fmtDollar(result.netIncome)}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </>
              );
            })()}

            {/* BALANCE SHEET */}
            {reportType === "BALANCE_SHEET" && (
              <>
                <div style={reportHeaderStyle}>
                  <p style={reportCompanyNameStyle}>StoneLedger Accounting</p>
                  <p style={reportStatementNameStyle}>Balance Sheet</p>
                  <p style={reportPeriodStyle}>At {fmtPeriodEndHeader(params.periodEnd)}</p>
                </div>

                <table style={tableStyle}>
                  <tbody>
                    {/* ASSETS section */}
                    <tr><td style={bsFirstLevel} colSpan={2}>Assets</td></tr>
                    <tr><td style={bsSecondLevel}>Current Assets</td><td style={bsAmtRight}></td></tr>
                    {(result.currentAssetList || []).map((pair, i) => {
                      const isLast = i === result.currentAssetList.length - 1;
                      return (
                        <tr key={i}>
                          <td style={bsThirdLevel}>{pair.a}</td>
                          <td style={bsAmtLeft}>
                            {i === 0 ? (
                              <span>{fmtDollar(pair.b)}</span>
                            ) : isLast ? (
                              <span style={{ borderBottom: "1px solid #111", display: "inline-block" }}>
                                {fmtNum(pair.b)}
                              </span>
                            ) : (
                              <span>{fmtNum(pair.b)}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    <tr>
                      <td style={bsSecondLevel}>Total Current Assets</td>
                      <td style={bsAmtRight}>
                        <span style={{ borderTop: "1px solid #111", display: "inline-block", paddingTop: "2px" }}>
                          {fmtDollar(result.totalCurrentAssets)}
                        </span>
                      </td>
                    </tr>

                    <tr><td style={bsSecondLevel}>Property, Plant &amp; Equipment</td><td style={bsAmtRight}></td></tr>
                    {(result.propertyPlantEquipmentList || []).map((pair, i) => {
                      const isLast = i === result.propertyPlantEquipmentList.length - 1;
                      return (
                        <tr key={i}>
                          <td style={bsThirdLevel}>{pair.a}</td>
                          <td style={bsAmtLeft}>
                            {isLast ? (
                              <span style={{ borderBottom: "1px solid #111", display: "inline-block" }}>
                                {fmtNum(pair.b)}
                              </span>
                            ) : (
                              <span>{fmtNum(pair.b)}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    <tr>
                      <td style={bsSecondLevel}>Property, Plant &amp; Equipment, Net</td>
                      <td style={bsAmtRight}>
                        <span style={{ borderBottom: "1px solid #111", display: "inline-block" }}>
                          {fmtNum(result.totalPropertyPlantEquipment)}
                        </span>
                      </td>
                    </tr>

                    <tr>
                      <td style={bsFirstLevel}>Total Assets</td>
                      <td style={bsAmtRight}>
                        <span style={{ borderBottom: "3px double #111", display: "inline-block", fontWeight: 700 }}>
                          {fmtNum(result.totalAssets)}
                        </span>
                      </td>
                    </tr>

                    <tr><td colSpan={2} style={{ ...noCell, padding: "12px" }}></td></tr>

                    {/* LIABILITIES section */}
                    <tr><td style={bsFirstLevel} colSpan={2}>Liabilities</td></tr>
                    <tr><td style={bsSecondLevel}>Current Liabilities</td><td style={bsAmtRight}></td></tr>
                    {(result.currentLiabilityList || []).map((pair, i) => {
                      const isLast = i === result.currentLiabilityList.length - 1;
                      return (
                        <tr key={i}>
                          <td style={bsThirdLevel}>{pair.a}</td>
                          <td style={bsAmtLeft}>
                            {isLast ? (
                              <span style={{ borderBottom: "1px solid #111", display: "inline-block" }}>
                                {fmtDollar(pair.b)}
                              </span>
                            ) : (
                              <span>{fmtNum(pair.b)}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    <tr>
                      <td style={bsSecondLevel}>Total Current Liabilities</td>
                      <td style={bsAmtRight}>
                        <span style={{ borderTop: "1px solid #111", display: "inline-block", paddingTop: "2px" }}>
                          {fmtNum(result.totalCurrentLiabilities)}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td style={bsSecondLevel}>Unearned Revenue</td>
                      <td style={bsAmtRight}>
                        <span style={{ borderBottom: "1px solid #111", display: "inline-block" }}>
                          {fmtNum(result.unearnedRevenue)}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td style={bsFirstLevel}>Total Liabilities</td>
                      <td style={bsAmtRight}>
                        <span style={{ borderBottom: "1px solid #111", display: "inline-block" }}>
                          {fmtNum(result.totalLiabilities)}
                        </span>
                      </td>
                    </tr>

                    <tr><td colSpan={2} style={{ ...noCell, padding: "12px" }}></td></tr>

                    {/* STOCKHOLDERS' EQUITY section */}
                    <tr><td style={bsFirstLevel} colSpan={2}>Stockholders' Equity</td></tr>
                    {(result.stockholderEquityList || []).map((pair, i) => {
                      const isLast = i === result.stockholderEquityList.length - 1;
                      return (
                        <tr key={i}>
                          <td style={bsSecondLevel}>{pair.a}</td>
                          <td style={bsAmtRight}>
                            {isLast ? (
                              <span style={{ borderBottom: "1px solid #111", display: "inline-block" }}>
                                {fmtNum(pair.b)}
                              </span>
                            ) : (
                              <span>{fmtNum(pair.b)}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    <tr>
                      <td style={bsFirstLevel}>Total Stockholders' Equity</td>
                      <td style={bsAmtRight}>
                        <span style={{ borderBottom: "1px solid #111", display: "inline-block" }}>
                          {fmtNum(result.totalStockHolderEquity)}
                        </span>
                      </td>
                    </tr>

                    <tr><td colSpan={2} style={{ ...noCell, padding: "8px" }}></td></tr>

                    {/* TOTAL LIABILITIES AND EQUITY */}
                    <tr>
                      <td style={bsFirstLevel}>Total Liabilities and Stockholders' Equity</td>
                      <td style={bsAmtRight}>
                        <span style={{ borderBottom: "3px double #111", display: "inline-block", fontWeight: 700 }}>
                          {fmtDollar(result.totalLiabilitiesAndEquity)}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </>
            )}

            {reportType === "RETAINED_EARNINGS" && (
              <>
                <div style={reportHeaderStyle}>
                  <p style={reportCompanyNameStyle}>StoneLedger Accounting</p>
                  <p style={reportStatementNameStyle}>Statement of Retained Earnings</p>
                  <p style={reportPeriodStyle}>
                    For the Month Ended{" "}
                    {params.period
                      ? new Date(params.period + "-01").toLocaleDateString("en-US", { year: "numeric", month: "long" })
                      : ""}
                  </p>
                </div>

                <table style={tableStyle}>
                  <tbody>
                    <tr>
                      <td style={reLabel}>
                        Retained Earnings, Beginning {fmtDate(result.periodBeginning)}
                      </td>
                      <td style={reAmt}>{fmtDollar(result.retainedEarningsBeginning)}</td>
                    </tr>

                    <tr>
                      <td style={reLabel}>Add: Net Income</td>
                      <td style={reAmt}>{fmtNum(result.netIncome)}</td>
                    </tr>

                    <tr>
                      <td style={reLabel}>Less: Dividends</td>
                      <td style={reAmt}>
                        <span style={{ borderBottom: "1px solid #111", display: "inline-block" }}>
                          {fmtNum(result.dividends)}
                        </span>
                      </td>
                    </tr>

                    <tr><td colSpan={2} style={{ ...noCell, padding: "4px" }}></td></tr>

                    <tr>
                      <td style={reLabelBold}>
                        Retained Earnings, Ending {fmtDate(result.periodEnding)}
                      </td>
                      <td style={reAmt}>
                        <span style={{ borderBottom: "3px double #111", display: "inline-block", fontWeight: 700 }}>
                          {fmtDollar(result.retainedEarningsEnding)}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
}