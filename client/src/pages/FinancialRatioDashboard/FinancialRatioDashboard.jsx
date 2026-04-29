// src/pages/FinancialRatioDashboard/FinancialRatioDashboard.jsx
import React, { useState, useEffect } from 'react';
import styles from './FinancialRatioDashboard.module.css';
import { getFinancialRatios } from '../../API/Ratios';

/* ── Inline SVG icons ── */
const Icons = {
  profitability: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
  ),
  liquidity: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M12 2C6 8 4 12 4 15a8 8 0 0 0 16 0c0-3-2-7-8-13z" />
      </svg>
  ),
  leverage: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
  ),
  activity: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
  ),
};

/* ── Radial Gauge ── */
function Gauge({ value, max, color, label }) {
  const R = 28, CX = 35, CY = 35;
  const pct = Math.min(Math.abs(value) / Math.max(Math.abs(max), 0.001), 1);
  const startAngle = -210;
  const sweepTotal = 240;
  const sweepFill = sweepTotal * pct;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const arc = (angle) => ({
    x: CX + R * Math.cos(toRad(angle)),
    y: CY + R * Math.sin(toRad(angle)),
  });
  const trackStart = arc(startAngle);
  const trackEnd = arc(startAngle + sweepTotal);
  const fillEnd = arc(startAngle + sweepFill);
  const largeFull = sweepTotal > 180 ? 1 : 0;
  const large = sweepFill > 180 ? 1 : 0;

  return (
      <div className={styles.gaugeWrapper}>
        <svg width={70} height={56} viewBox="0 0 70 56">
          <path
              d={`M ${trackStart.x} ${trackStart.y} A ${R} ${R} 0 ${largeFull} 1 ${trackEnd.x} ${trackEnd.y}`}
              fill="none" stroke="#e2e8f0" strokeWidth="5" strokeLinecap="round"
          />
          {pct > 0.005 && (
              <path
                  d={`M ${arc(startAngle).x} ${arc(startAngle).y} A ${R} ${R} 0 ${large} 1 ${fillEnd.x} ${fillEnd.y}`}
                  fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
              />
          )}
          <text
              x={CX} y={CY + 4}
              textAnchor="middle"
              fontSize="9"
              fontWeight="700"
              fill="#334155"
              fontFamily="'Courier New', monospace"
          >
            {value.toFixed(3)}
          </text>
        </svg>
        <span className={styles.gaugeName}>{label}</span>
      </div>
  );
}

/* ── Horizontal Bar Chart ── */
function HBarChart({ items, accent }) {
  if (!items || items.length === 0) return null;

  const max = Math.max(...items.map((i) => Math.abs(i.b)), 0.001);

  return (
      <div className={styles.hBarChart}>
        {items.map((item, idx) => {
          const pct = Math.max((Math.abs(item.b) / max) * 100, item.b !== 0 ? 3 : 0);

          return (
              <div key={idx} className={styles.hBarRow}>
                <span className={styles.hBarLabel} title={item.a}>{item.a}</span>
                <div className={styles.hBarTrack}>
                  <div
                      className={styles.hBarFill}
                      style={{ width: `${pct}%`, background: accent }}
                  />
                </div>
                <span className={styles.hBarValue}>
              {item.b.toFixed(4)}
            </span>
              </div>
          );
        })}
      </div>
  );
}

/* ── Simple Bar Chart for Visualizations with journal colors ── */
function SimpleBarChart({ ratios }) {
  const getMetricColor = (value, benchmark) => {
    const ratio = value / benchmark;
    if (ratio >= 1) return '#66a668'; // Approved Green
    if (ratio >= 0.7) return '#e65100'; // Pending Orange
    return '#c62828'; // Rejected Red
  };

  const chartData = [
    { name: 'Current Ratio', value: ratios?.liquidityRatios?.find(r => r.a === 'Current Ratio')?.b || 0, benchmark: 2 },
    { name: 'Quick Ratio', value: ratios?.liquidityRatios?.find(r => r.a === 'Quick Ratio')?.b || 0, benchmark: 1 },
    { name: 'Debt/Equity', value: ratios?.leverageRatios?.find(r => r.a === 'Debt to Equity Ratio')?.b || 0, benchmark: 1 },
    { name: 'ROA %', value: (ratios?.profitabilityRatios?.find(r => r.a === 'Return On Total Assets')?.b || 0) * 100, benchmark: 5 },
    { name: 'ROE %', value: (ratios?.profitabilityRatios?.find(r => r.a === 'Return on Stockholder Equity')?.b || 0) * 100, benchmark: 10 },
  ];

  const maxValue = Math.max(...chartData.map(d => Math.max(d.value, d.benchmark))) * 1.2;

  return (
      <div className={styles.simpleBarChart}>
        <h3 className={styles.chartTitle}>Key Metrics vs Benchmarks</h3>
        <div className={styles.barChartContainer}>
          {chartData.map((item, idx) => {
            const metricColor = getMetricColor(item.value, item.benchmark);
            return (
                <div key={idx} className={styles.barChartItem}>
                  <span className={styles.barChartLabel}>{item.name}</span>
                  <div className={styles.barChartBars}>
                    <div className={styles.barWrapper}>
                      <div
                          className={styles.valueBar}
                          style={{
                            width: `${(item.value / maxValue) * 100}%`,
                            backgroundColor: metricColor
                          }}
                      />
                      <span className={styles.barValue} style={{ color: metricColor }}>
                    {item.value.toFixed(2)}
                  </span>
                    </div>
                    <div className={styles.barWrapper}>
                      <div
                          className={styles.benchmarkBar}
                          style={{
                            width: `${(item.benchmark / maxValue) * 100}%`,
                            backgroundColor: '#cbd5e1'
                          }}
                      />
                      <span className={styles.benchmarkValue}>Target: {item.benchmark}</span>
                    </div>
                  </div>
                </div>
            );
          })}
        </div>
      </div>
  );
}

/* ── Simple Donut Chart for Performance Overview with journal colors ── */
function SimpleDonutChart({ ratios }) {
  const score = (() => {
    const currentRatio = ratios?.liquidityRatios?.find(r => r.a === 'Current Ratio')?.b || 0;
    const debtToEquity = ratios?.leverageRatios?.find(r => r.a === 'Debt to Equity Ratio')?.b || 0;
    const roa = ratios?.profitabilityRatios?.find(r => r.a === 'Return On Total Assets')?.b || 0;

    let score = 0;
    if (currentRatio >= 2) score += 35;
    else if (currentRatio >= 1.5) score += 25;
    else if (currentRatio >= 1) score += 15;

    if (debtToEquity < 0.5) score += 35;
    else if (debtToEquity < 1) score += 25;
    else if (debtToEquity < 2) score += 15;

    if (roa > 0.05) score += 30;
    else if (roa > 0) score += 15;

    return score;
  })();

  // 3-tier color system using journal colors
  const getScoreColor = (score) => {
    if (score >= 70) return '#66a668'; // Approved Green
    if (score >= 50) return '#e65100'; // Pending Orange
    return '#c62828'; // Rejected Red
  };

  const getScoreStatus = (score) => {
    if (score >= 70) return 'Strong Performance';
    if (score >= 50) return 'Needs Improvement';
    return 'Critical Attention';
  };

  const scoreColor = getScoreColor(score);
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
      <div className={styles.simpleDonutChart}>
        <h3 className={styles.chartTitle}>Overall Performance Score</h3>
        <div className={styles.donutContainer}>
          <svg width="140" height="140" viewBox="0 0 120 120">
            <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="12"
            />
            <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke={scoreColor}
                strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
            />
            <text
                x="60"
                y="60"
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="24"
                fontWeight="700"
                fill={scoreColor}
            >
              {score}
            </text>
            <text
                x="60"
                y="75"
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="10"
                fill="#64748b"
            >
              /100
            </text>
          </svg>
          <div className={styles.scoreLegend}>
            <div className={styles.legendItem}>
              <div className={styles.legendDot} style={{ backgroundColor: scoreColor }} />
              <span>Performance Score</span>
            </div>
            <div className={styles.scoreStatus} style={{ color: scoreColor }}>
              {getScoreStatus(score)}
            </div>
          </div>
        </div>
      </div>
  );
}

/* ── Scorecard Component - 3-tier colors from journal ── */
function Scorecard({ title, value, benchmark, unit = '' }) {
  const displayValue = unit === '%' ? value.toFixed(1) : value.toFixed(2);

  const getStatusColor = (value, benchmark) => {
    const ratio = value / benchmark;
    if (ratio >= 1) return '#2e7d32'; // Approved Green
    if (ratio >= 0.7) return '#e65100'; // Pending Orange
    return '#c62828'; // Rejected Red
  };

  const getStatusIcon = (value, benchmark) => {
    const ratio = value / benchmark;
    if (ratio >= 1) return '✓';
    if (ratio >= 0.7) return '!';
    return '⚠';
  };

  const statusColor = benchmark ? getStatusColor(value, benchmark) : null;
  const statusIcon = benchmark ? getStatusIcon(value, benchmark) : null;

  return (
      <div className={styles.scorecard}>
        <div className={styles.scorecardHeader}>
          <span className={styles.scorecardTitle}>{title}</span>
          {benchmark && (
              <span
                  className={styles.scorecardStatus}
                  style={{
                    backgroundColor: `${statusColor}20`,
                    color: statusColor
                  }}
              >
            {statusIcon}
          </span>
          )}
        </div>
        <div className={styles.scorecardValue}>
          {displayValue}{unit}
        </div>
        {benchmark && (
            <div className={styles.scorecardBenchmark}>
              Target: {benchmark}{unit}
            </div>
        )}
      </div>
  );
}

/* ── KPI Row Component - 3-tier badges with journal colors ── */
function KPIRow({ ratios }) {
  const find = (key, name) => ratios?.[key]?.find((r) => r.a === name)?.b ?? null;

  const getBadgeInfo = (value, benchmark) => {
    const ratio = value / benchmark;
    if (ratio >= 1) return { text: 'On Track', color: '#2e7d32', bg: '#e8f5e9' };
    if (ratio >= 0.7) return { text: 'Needs Review', color: '#e65100', bg: '#fff3e0' };
    return { text: 'Critical', color: '#c62828', bg: '#fce4ec' };
  };

  const kpis = [
    { label: 'Current Ratio', value: find('liquidityRatios', 'Current Ratio'), unit: 'x', benchmark: 2 },
    { label: 'Quick Ratio', value: find('liquidityRatios', 'Quick Ratio'), unit: 'x', benchmark: 1 },
    { label: 'Debt/Equity', value: find('leverageRatios', 'Debt to Equity Ratio'), unit: 'x', benchmark: 1 },
    { label: 'ROA', value: find('profitabilityRatios', 'Return On Total Assets'), unit: '%', multiplier: 100, benchmark: 5 },
    { label: 'ROE', value: find('profitabilityRatios', 'Return on Stockholder Equity'), unit: '%', multiplier: 100, benchmark: 10 },
  ];

  return (
      <div className={styles.kpiRow}>
        {kpis.map((k) => {
          if (k.value === null) return null;
          const displayValue = k.multiplier ? (k.value * k.multiplier) : k.value;
          const badge = getBadgeInfo(displayValue, k.benchmark);

          return (
              <div key={k.label} className={styles.kpiRowCard}>
                <span className={styles.kpiRowLabel}>{k.label}</span>
                <span className={styles.kpiRowValue}>
              {displayValue.toFixed(2)}{k.unit}
            </span>
                <span className={styles.kpiRowBadge} style={{ backgroundColor: badge.bg, color: badge.color }}>
              {badge.text}
            </span>
              </div>
          );
        })}
      </div>
  );
}

/* ── Section configs with distinct muted colors (using journal inspired palette) ── */
const SECTIONS = [
  { key: 'liquidityRatios', title: 'Liquidity Analysis', iconKey: 'liquidity', accent: '#1565c0', light: '#e3f2fd', gaugeMax: 20 },
  { key: 'leverageRatios', title: 'Leverage & Solvency', iconKey: 'leverage', accent: '#6a1b9a', light: '#f3e5f5', gaugeMax: 1 },
  { key: 'profitabilityRatios', title: 'Profitability Metrics', iconKey: 'profitability', accent: '#2e7d32', light: '#e8f5e9', gaugeMax: 0.2 },
  { key: 'activityRatios', title: 'Activity Efficiency', iconKey: 'activity', accent: '#e65100', light: '#fff3e0', gaugeMax: 2 },
];

/* ── Section Card with distinct colors per section ── */
function SectionCard({ section, data }) {
  if (!data || data.length === 0) return null;
  const { title, iconKey, accent, light, gaugeMax } = section;

  return (
      <div className={styles.sectionCard} style={{ '--accent': accent }}>
        <div className={styles.sectionHeader}>
        <span className={styles.sectionIconWrap} style={{ background: light, color: accent }}>
          {Icons[iconKey]}
        </span>
          <h3 className={styles.sectionTitle}>{title}</h3>
        </div>

        <HBarChart items={data} accent={accent} />

        <div className={styles.divider} />

        <div className={styles.gaugeGrid}>
          {data.map((item, idx) => (
              <Gauge key={idx} value={item.b} max={gaugeMax} label={item.a.split(' ').slice(0, 2).join(' ')} color={accent} />
          ))}
        </div>
      </div>
  );
}

/* ── Main Dashboard Component ── */
export default function FinancialRatioDashboard() {
  const [ratios, setRatios] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { fetchRatios(); }, []);

  const fetchRatios = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getFinancialRatios();
      const data = response.data?.data || response.data;
      setRatios(data);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message || 'Failed to fetch financial ratios');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
        <div className={styles.page}>
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <span>Loading financial ratios…</span>
          </div>
        </div>
    );
  }

  if (error) {
    return (
        <div className={styles.page}>
          <div className={styles.errorPanel}>
            <p className={styles.errorText}>{error}</p>
            <button className={styles.retryBtn} onClick={fetchRatios}>Retry</button>
          </div>
        </div>
    );
  }

  // Calculate key metrics
  const currentRatio = ratios?.liquidityRatios?.find(r => r.a === 'Current Ratio')?.b || 0;
  const debtToEquity = ratios?.leverageRatios?.find(r => r.a === 'Debt to Equity Ratio')?.b || 0;
  const roa = (ratios?.profitabilityRatios?.find(r => r.a === 'Return On Total Assets')?.b || 0) * 100;

  // Get active sections
  const activeSections = SECTIONS.filter(
      (s) => ratios?.[s.key] && ratios[s.key].length > 0
  ).slice(0, 4);

  const topRowSections = activeSections.slice(0, 2);
  const bottomRowSections = activeSections.slice(2, 4);

  return (
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>StoneLedger Financial Dashboard</h1>
            <p className={styles.pageSubtitle}>A Quick Look at Account Finances</p>
          </div>
          <button className={styles.refreshBtn} onClick={fetchRatios} title="Refresh Page">
            ↻ Refresh
          </button>
        </div>

        {/* Top 3 Scorecards */}
        <div className={styles.topScorecardRow}>
          <Scorecard title="Current Ratio" value={currentRatio} benchmark={2} unit="x" />
          <Scorecard title="Debt to Equity" value={debtToEquity} benchmark={1} unit="x" />
          <Scorecard title="Return on Assets" value={roa} benchmark={5} unit="%" />
        </div>

        {/* KPI Row */}
        <KPIRow ratios={ratios} />

        {/* Visualization Charts Row - Compact */}
        <div className={styles.chartsRow}>
          <SimpleBarChart ratios={ratios} />
          <SimpleDonutChart ratios={ratios} />
        </div>

        {/* 2x2 Grid of Section Cards */}
        <div className={styles.sectionsGrid}>
          <div className={styles.gridRow}>
            {topRowSections.map((section) => (
                <SectionCard key={section.key} section={section} data={ratios[section.key]} />
            ))}
          </div>
          <div className={styles.gridRow}>
            {bottomRowSections.map((section) => (
                <SectionCard key={section.key} section={section} data={ratios[section.key]} />
            ))}
          </div>
        </div>
      </div>
  );
}