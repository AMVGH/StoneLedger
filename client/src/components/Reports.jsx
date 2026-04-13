import React, { useState, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  getTrialBalanceContent,
  getIncomeStatementContent,
  getBalanceSheetContent,
  getRetainedEarningsContent,
} from "../API/Report";

export default function Reports() {
  const [reportType, setReportType] = useState("TRIAL_BALANCE");
  const [params, setParams] = useState({
    trialBalanceType: "UNADJUSTED",
    periodEnd: "",
    retainedEarningsAccount: "",
    period: "",
  });
  const [result, setResult] = useState(null);
  const [fetchError, setFetchError] = useState("");
  const [fetching, setFetching] = useState(false);

  const handleParamChange = (e) => {
    const { name, value } = e.target;
    setParams((prev) => ({ ...prev, [name]: value }));
    setResult(null);
    setFetchError("");
  };

  const handleReportTypeChange = (e) => {
    setReportType(e.target.value);
    setResult(null);
    setFetchError("");
  };

  const handleGenerate = async () => {
    setFetchError("");
    setResult(null);
    setFetching(true);
    try {
      let data;
      const periodEndISO = params.periodEnd ? new Date(params.periodEnd).toISOString() : null;
      switch (reportType) {
        case "TRIAL_BALANCE":
          if (!params.periodEnd) { setFetchError("Period end date is required."); setFetching(false); return; }
          data = await getTrialBalanceContent(params.trialBalanceType, periodEndISO);
          break;
        case "INCOME_STATEMENT":
          if (!params.periodEnd) { setFetchError("Period end date is required."); setFetching(false); return; }
          data = await getIncomeStatementContent(periodEndISO);
          break;
        case "BALANCE_SHEET":
          if (!params.periodEnd) { setFetchError("Period end date is required."); setFetching(false); return; }
          data = await getBalanceSheetContent(periodEndISO);
          break;
        case "RETAINED_EARNINGS":
          if (!params.period) { setFetchError("Period (month) is required."); setFetching(false); return; }
          if (!params.retainedEarningsAccount.trim()) { setFetchError("Retained earnings target account is required."); setFetching(false); return; }
          data = await getRetainedEarningsContent(params.retainedEarningsAccount.trim(), params.period);
          break;
        default: break;
      }
      setResult(data?.data ?? data);
    } catch (err) {
      setFetchError(err.response?.data?.message || err.message || "Failed to generate report.");
    } finally {
      setFetching(false);
    }
  };

  const fmt = (val) => {
    if (val == null) return "—";
    const num = Number(val);
    return isNaN(num) ? String(val) : `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const fmtDate = (val) => {
    if (!val) return "—";
    const d = new Date(val);
    return isNaN(d) ? String(val) : d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  const panelStyle = { display: "flex", flexDirection: "row", gap: "20px", alignItems: "flex-start" };
  const cardStyle = { background: "#fff", border: "0.5px solid #e5e7eb", borderRadius: "10px", padding: "20px 24px" };
  const filterPanelStyle = { ...cardStyle, width: "220px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "16px" };
  const resultPanelStyle = { ...cardStyle, flex: 1, minWidth: 0 };
  const rowStyle = { display: "flex", flexDirection: "column", gap: "14px" };
  const groupStyle = { display: "flex", flexDirection: "column", gap: "5px" };
  const labelStyle = { fontSize: "12px", fontWeight: 500, color: "#374151" };
  const inputStyle = { padding: "7px 10px", border: "0.5px solid #d1d5db", borderRadius: "6px", fontSize: "13px", color: "#111827", background: "#fff", outline: "none", width: "100%", boxSizing: "border-box" };
  const selectStyle = { ...inputStyle, cursor: "pointer" };
  const btnStyle = { padding: "8px 0", border: "none", borderRadius: "6px", background: "#4f46e5", color: "#fff", fontSize: "13px", cursor: "pointer", fontWeight: 500, width: "100%", marginTop: "4px" };
  const errorStyle = { background: "#fef2f2", border: "0.5px solid #fecaca", color: "#b91c1c", borderRadius: "6px", padding: "8px 12px", fontSize: "13px", marginTop: "12px" };
  const tableStyle = { width: "100%", borderCollapse: "collapse", fontSize: "13px" };
  const thStyle = { textAlign: "left", padding: "8px 12px", background: "#f9fafb", border: "0.5px solid #e5e7eb", fontWeight: 600, color: "#374151" };
  const tdStyle = { padding: "8px 12px", border: "0.5px solid #e5e7eb", color: "#111827" };
  const sectionTitleStyle = { fontSize: "14px", fontWeight: 600, color: "#1f2937", margin: "0 0 12px 0" };
  const totalRowStyle = { fontWeight: 600, background: "#f9fafb" };
  const netRowStyle = { fontWeight: 700, background: "#eef2ff", color: "#4f46e5" };
  const groupHeaderStyle = { ...tdStyle, fontWeight: 600, background: "#f3f4f6", color: "#6b7280", fontSize: "11px", letterSpacing: "0.05em", textTransform: "uppercase" };

  const reportRef = useRef(null);

  const handleDownloadPdf = async () => {
    const content = reportRef.current;
    if (!content) return;
    const canvas = await html2canvas(content, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/png");
    const pdfDoc = new jsPDF("p", "mm", "letter");
    const pageWidth = pdfDoc.internal.pageSize.getWidth();
    const pageHeight = pdfDoc.internal.pageSize.getHeight();
    const margin = 10;
    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let yOffset = margin;
    let remainingHeight = imgHeight;
    // First page
    pdfDoc.addImage(imgData, "PNG", margin, yOffset, imgWidth, imgHeight);
    remainingHeight -= (pageHeight - margin * 2);
    // Additional pages if content overflows
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
      {/* Filter panel — left column */}
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
                <label style={labelStyle}>Target Account</label>
                <input style={inputStyle} type="text" name="retainedEarningsAccount" value={params.retainedEarningsAccount} onChange={handleParamChange} placeholder="Account name or identifier" />
              </div>
            </>
          )}

          <button style={btnStyle} onClick={handleGenerate} disabled={fetching}>
            {fetching ? "Generating…" : "Generate Report"}
          </button>
        </div>
        {fetchError && <div style={errorStyle}>{fetchError}</div>}
      </div>

      {/* Result panel — right */}
      {result && (
        <div style={resultPanelStyle}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
            <button
              style={{ ...btnStyle, width: "auto", padding: "8px 16px", marginTop: 0 }}
              onClick={handleDownloadPdf}
            >
              Download PDF
            </button>
          </div>
          <div ref={reportRef}>
          {/* Trial Balance */}
          {reportType === "TRIAL_BALANCE" && (
            <>
              <p style={sectionTitleStyle}>
                Trial Balance — {params.trialBalanceType.replace("_", "-")}
              </p>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Account Name</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Debit</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {(result.trialBalanceEntries || []).map((entry, i) => (
                    <tr key={i}>
                      <td style={tdStyle}>{entry.financialAccountName}</td>
                      <td style={{ ...tdStyle, textAlign: "right" }}>{entry.balanceLean === "DEBIT" ? fmt(entry.amount) : "—"}</td>
                      <td style={{ ...tdStyle, textAlign: "right" }}>{entry.balanceLean === "CREDIT" ? fmt(entry.amount) : "—"}</td>
                    </tr>
                  ))}
                  <tr style={totalRowStyle}>
                    <td style={tdStyle}>Totals</td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>{fmt(result.totalDebit)}</td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>{fmt(result.totalCredit)}</td>
                  </tr>
                </tbody>
              </table>
            </>
          )}

          {/* Income Statement */}
          {reportType === "INCOME_STATEMENT" && (
            <>
              <p style={sectionTitleStyle}>Income Statement</p>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Account</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td style={groupHeaderStyle} colSpan={2}>Revenues</td></tr>
                  {(result.revenueList || []).map((pair, i) => (
                    <tr key={i}>
                      <td style={tdStyle}>{pair.a}</td>
                      <td style={{ ...tdStyle, textAlign: "right" }}>{fmt(pair.b)}</td>
                    </tr>
                  ))}
                  <tr style={totalRowStyle}>
                    <td style={tdStyle}>Total Revenues</td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>{fmt(result.totalRevenues)}</td>
                  </tr>
                  <tr><td style={groupHeaderStyle} colSpan={2}>Expenses</td></tr>
                  {(result.expenseList || []).map((pair, i) => (
                    <tr key={i}>
                      <td style={tdStyle}>{pair.a}</td>
                      <td style={{ ...tdStyle, textAlign: "right" }}>{fmt(pair.b)}</td>
                    </tr>
                  ))}
                  <tr style={totalRowStyle}>
                    <td style={tdStyle}>Total Expenses</td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>{fmt(result.totalExpenses)}</td>
                  </tr>
                  <tr style={netRowStyle}>
                    <td style={tdStyle}>Net Income</td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>{fmt(result.netIncome)}</td>
                  </tr>
                </tbody>
              </table>
            </>
          )}

          {/* Balance Sheet */}
          {reportType === "BALANCE_SHEET" && (
            <>
              <p style={sectionTitleStyle}>Balance Sheet</p>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Item</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td style={groupHeaderStyle} colSpan={2}>Assets — Current</td></tr>
                  {(result.currentAssetList || []).map((pair, i) => (
                    <tr key={i}><td style={tdStyle}>{pair.a}</td><td style={{ ...tdStyle, textAlign: "right" }}>{fmt(pair.b)}</td></tr>
                  ))}
                  <tr style={totalRowStyle}><td style={tdStyle}>Total Current Assets</td><td style={{ ...tdStyle, textAlign: "right" }}>{fmt(result.totalCurrentAssets)}</td></tr>
                  <tr><td style={groupHeaderStyle} colSpan={2}>Assets — Property, Plant & Equipment</td></tr>
                  {(result.propertyPlantEquipmentList || []).map((pair, i) => (
                    <tr key={i}><td style={tdStyle}>{pair.a}</td><td style={{ ...tdStyle, textAlign: "right" }}>{fmt(pair.b)}</td></tr>
                  ))}
                  <tr style={totalRowStyle}><td style={tdStyle}>Total PP&amp;E</td><td style={{ ...tdStyle, textAlign: "right" }}>{fmt(result.totalPropertyPlantEquipment)}</td></tr>
                  <tr style={netRowStyle}><td style={tdStyle}>Total Assets</td><td style={{ ...tdStyle, textAlign: "right" }}>{fmt(result.totalAssets)}</td></tr>
                  <tr><td style={groupHeaderStyle} colSpan={2}>Liabilities — Current</td></tr>
                  {(result.currentLiabilityList || []).map((pair, i) => (
                    <tr key={i}><td style={tdStyle}>{pair.a}</td><td style={{ ...tdStyle, textAlign: "right" }}>{fmt(pair.b)}</td></tr>
                  ))}
                  <tr style={totalRowStyle}><td style={tdStyle}>Total Current Liabilities</td><td style={{ ...tdStyle, textAlign: "right" }}>{fmt(result.totalCurrentLiabilities)}</td></tr>
                  <tr><td style={tdStyle}>Unearned Revenue</td><td style={{ ...tdStyle, textAlign: "right" }}>{fmt(result.unearnedRevenue)}</td></tr>
                  <tr style={totalRowStyle}><td style={tdStyle}>Total Liabilities</td><td style={{ ...tdStyle, textAlign: "right" }}>{fmt(result.totalLiabilities)}</td></tr>
                  <tr><td style={groupHeaderStyle} colSpan={2}>Stockholders' Equity</td></tr>
                  {(result.stockholderEquityList || []).map((pair, i) => (
                    <tr key={i}><td style={tdStyle}>{pair.a}</td><td style={{ ...tdStyle, textAlign: "right" }}>{fmt(pair.b)}</td></tr>
                  ))}
                  <tr style={totalRowStyle}><td style={tdStyle}>Total Stockholders' Equity</td><td style={{ ...tdStyle, textAlign: "right" }}>{fmt(result.totalStockHolderEquity)}</td></tr>
                  <tr style={netRowStyle}><td style={tdStyle}>Total Liabilities &amp; Equity</td><td style={{ ...tdStyle, textAlign: "right" }}>{fmt(result.totalLiabilitiesAndEquity)}</td></tr>
                </tbody>
              </table>
            </>
          )}

          {/* Retained Earnings */}
          {reportType === "RETAINED_EARNINGS" && (
            <>
              <p style={sectionTitleStyle}>Retained Earnings Statement</p>
              <table style={tableStyle}>
                <tbody>
                  <tr><td style={tdStyle}>Period Beginning</td><td style={{ ...tdStyle, textAlign: "right" }}>{fmtDate(result.periodBeginning)}</td></tr>
                  <tr><td style={tdStyle}>Period Ending</td><td style={{ ...tdStyle, textAlign: "right" }}>{fmtDate(result.periodEnding)}</td></tr>
                  <tr><td style={tdStyle}>Retained Earnings (Beginning)</td><td style={{ ...tdStyle, textAlign: "right" }}>{fmt(result.retainedEarningsBeginning)}</td></tr>
                  <tr><td style={tdStyle}>+ Net Income</td><td style={{ ...tdStyle, textAlign: "right" }}>{fmt(result.netIncome)}</td></tr>
                  <tr><td style={tdStyle}>− Dividends</td><td style={{ ...tdStyle, textAlign: "right" }}>{fmt(result.dividends)}</td></tr>
                  <tr style={netRowStyle}><td style={tdStyle}>Retained Earnings (Ending)</td><td style={{ ...tdStyle, textAlign: "right" }}>{fmt(result.retainedEarningsEnding)}</td></tr>
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
