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

/* ── Utility function to format values based on ratio type ── */
function formatRatioValue(name, value, isTarget = false) {
    const isProfitability = name.includes('Margin') || name.includes('Return On') || name.includes('Return on');
    const isLiquidity = name.includes('Ratio');
    const isLeverage = name.includes('Debt to');
    const isActivity = name.includes('Turnover');

    if (isTarget) {
        if (isProfitability || isLeverage) {
            return `${(value * 100).toFixed(1)}%`;
        }
        if (isLiquidity) {
            return value.toFixed(2);
        }
        if (isActivity) {
            return value.toFixed(1);
        }
        return value.toString();
    }

    if (isProfitability || isLeverage) {
        return `${(value * 100).toFixed(1)}%`;
    }
    if (isLiquidity) {
        return `${value.toFixed(2)}x`;
    }
    if (isActivity) {
        return `${value.toFixed(2)}x`;
    }
    return value.toFixed(4);
}

/* ── Status color helper ── */
function getStatusColor(value, target, higherIsBetter = true) {
    if (!target || target === 0) return { color: '#64748b', status: 'No Target' };

    const ratio = value / target;

    if (higherIsBetter) {
        // For ratios where higher is better (Current Ratio, ROA, ROE, etc.)
        if (ratio >= 1.0) {
            return { color: '#2e7d32', status: 'Excellent' };  // Green - at or above target
        }
        if (ratio >= 0.85) {
            return { color: '#e65100', status: 'Warning' };    // Orange - within 15% of target
        }
        return { color: '#c62828', status: 'Critical' };       // Red - below 85% of target
    } else {
        // For ratios where lower is better (Debt/Equity, etc.)
        if (ratio <= 1.0) {
            return { color: '#2e7d32', status: 'Excellent' };  // Green - at or below target
        }
        if (ratio <= 1.15) {
            return { color: '#e65100', status: 'Warning' };    // Orange - within 15% above target
        }
        return { color: '#c62828', status: 'Critical' };       // Red - more than 15% above target
    }
}

/* ── Radial Gauge ── */
function Gauge({ value, target, color, label, ratioName }) {
    const R = 28, CX = 35, CY = 35;
    const max = target * 1.5;
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

    const displayValue = formatRatioValue(ratioName, value, false);

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
                    {displayValue}
                </text>
            </svg>
            <span className={styles.gaugeName}>{label}</span>
        </div>
    );
}

/* ── Horizontal Bar Chart with target-based progress ── */
function HBarChart({ items, accent }) {
    if (!items || items.length === 0) return null;

    return (
        <div className={styles.hBarChart}>
            {items.map((item, idx) => {
                // Calculate fill percentage based on target (same logic as gauges)
                const targetValue = Math.abs(item.c);
                const actualValue = Math.abs(item.b);
                let fillPercent;

                if (targetValue === 0) {
                    fillPercent = 0;
                } else if (actualValue >= targetValue) {
                    fillPercent = 100;
                } else {
                    fillPercent = (actualValue / targetValue) * 100;
                }

                const displayValue = formatRatioValue(item.a, item.b, false);
                const displayTarget = formatRatioValue(item.a, item.c, true);

                return (
                    <div key={idx} className={styles.hBarRow}>
                        <div className={styles.hBarHeader}>
                            <span className={styles.hBarLabel} title={item.a}>{item.a}</span>
                            <span className={styles.hBarTarget}>Target: {displayTarget}</span>
                        </div>
                        <div className={styles.hBarRight}>
                            <span className={styles.hBarValue}>{displayValue}</span>
                            <div className={styles.hBarTrack}>
                                <div
                                    className={styles.hBarFill}
                                    style={{
                                        width: `${fillPercent}%`,
                                        background: accent,
                                        opacity: fillPercent > 0 ? 1 : 0.3
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/* ── Simple Bar Chart for Visualizations ── */
function SimpleBarChart({ ratios }) {
    const getMetricColor = (value, target, metricName) => {
        const higherIsBetter = !metricName.includes('Debt');
        const ratio = value / target;

        if (higherIsBetter) {
            if (ratio >= 1) return '#2e7d32';
            if (ratio >= 0.8) return '#e65100';
            return '#c62828';
        } else {
            if (ratio <= 1) return '#2e7d32';
            if (ratio <= 1.25) return '#e65100';
            return '#c62828';
        }
    };

    const chartData = [
        { name: 'Current Ratio', value: ratios?.liquidityRatios?.find(r => r.a === 'Current Ratio')?.b || 0, target: ratios?.liquidityRatios?.find(r => r.a === 'Current Ratio')?.c || 2, unit: 'x', higherIsBetter: true },
        { name: 'Quick Ratio', value: ratios?.liquidityRatios?.find(r => r.a === 'Quick Ratio')?.b || 0, target: ratios?.liquidityRatios?.find(r => r.a === 'Quick Ratio')?.c || 1, unit: 'x', higherIsBetter: true },
        { name: 'Debt/Equity', value: ratios?.leverageRatios?.find(r => r.a === 'Debt to Equity Ratio')?.b || 0, target: ratios?.leverageRatios?.find(r => r.a === 'Debt to Equity Ratio')?.c || 1, unit: 'x', higherIsBetter: false },
        { name: 'ROA', value: (ratios?.profitabilityRatios?.find(r => r.a === 'Return On Total Assets')?.b || 0) * 100, target: (ratios?.profitabilityRatios?.find(r => r.a === 'Return On Total Assets')?.c || 0.05) * 100, unit: '%', higherIsBetter: true },
        { name: 'ROE', value: (ratios?.profitabilityRatios?.find(r => r.a === 'Return on Stockholder Equity')?.b || 0) * 100, target: (ratios?.profitabilityRatios?.find(r => r.a === 'Return on Stockholder Equity')?.c || 0.1) * 100, unit: '%', higherIsBetter: true },
    ];

    const maxValue = Math.max(...chartData.map(d => Math.max(d.value, d.target))) * 1.2;

    return (
        <div className={styles.simpleBarChart}>
            <h3 className={styles.chartTitle}>Key Metrics vs Benchmarks</h3>
            <div className={styles.barChartContainer}>
                {chartData.map((item, idx) => {
                    const metricColor = getMetricColor(item.value, item.target, item.name);
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
                                        {item.value.toFixed(1)}{item.unit}
                                    </span>
                                </div>
                                <div className={styles.barWrapper}>
                                    <div
                                        className={styles.benchmarkBar}
                                        style={{
                                            width: `${(item.target / maxValue) * 100}%`,
                                            backgroundColor: '#cbd5e1'
                                        }}
                                    />
                                    <span className={styles.benchmarkValue}>
                                        Target: {item.target.toFixed(1)}{item.unit}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ── Simple Donut Chart for Performance Overview ── */
function SimpleDonutChart({ ratios }) {
    const score = (() => {
        const currentRatio = ratios?.liquidityRatios?.find(r => r.a === 'Current Ratio')?.b || 0;
        const currentRatioTarget = ratios?.liquidityRatios?.find(r => r.a === 'Current Ratio')?.c || 2;
        const debtToEquity = ratios?.leverageRatios?.find(r => r.a === 'Debt to Equity Ratio')?.b || 0;
        const debtToEquityTarget = ratios?.leverageRatios?.find(r => r.a === 'Debt to Equity Ratio')?.c || 1;
        const roa = ratios?.profitabilityRatios?.find(r => r.a === 'Return On Total Assets')?.b || 0;
        const roaTarget = ratios?.profitabilityRatios?.find(r => r.a === 'Return On Total Assets')?.c || 0.05;

        let score = 0;

        const currentRatioScore = Math.min((currentRatio / currentRatioTarget) * 35, 35);
        score += currentRatioScore;

        if (debtToEquity <= debtToEquityTarget) {
            score += 35;
        } else {
            const debtScore = Math.max(35 - ((debtToEquity / debtToEquityTarget) - 1) * 35, 0);
            score += Math.min(debtScore, 35);
        }

        const roaScore = Math.min((roa / roaTarget) * 30, 30);
        score += roaScore;

        return Math.min(Math.round(score), 100);
    })();

    const getScoreColor = (score) => {
        if (score >= 70) return '#2e7d32';
        if (score >= 50) return '#e65100';
        return '#c62828';
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

/* ── Scorecard Component ── */
function Scorecard({ title, value, target, unit = '', higherIsBetter = true }) {
    const status = getStatusColor(value, target, higherIsBetter);
    const displayValue = unit === '%' ? value.toFixed(1) : value.toFixed(2);
    const displayTarget = unit === '%' ? target.toFixed(1) : target.toFixed(2);

    return (
        <div className={styles.scorecard}>
            <div className={styles.scorecardHeader}>
                <span className={styles.scorecardTitle}>{title}</span>
                {target && (
                    <span
                        className={styles.scorecardStatus}
                        style={{
                            backgroundColor: `${status.color}20`,
                            color: status.color
                        }}
                    >
                        {status.status}
                    </span>
                )}
            </div>
            <div className={styles.scorecardValue}>
                {displayValue}{unit}
            </div>
            {target && (
                <div className={styles.scorecardTarget}>
                    Target: {displayTarget}{unit}
                </div>
            )}
        </div>
    );
}

/* ── KPI Row Component ── */
function KPIRow({ ratios }) {
    const find = (key, name) => ratios?.[key]?.find((r) => r.a === name);

    const kpis = [
        { label: 'Quick Ratio', find: find('liquidityRatios', 'Quick Ratio'), unit: 'x', multiplier: 1, higherIsBetter: true },
        { label: 'Debt to Assets', find: find('leverageRatios', 'Debt to Assets Ratio'), unit: '%', multiplier: 100, higherIsBetter: false },
        { label: 'Operating Profit Margin', find: find('profitabilityRatios', 'Operating Profit Margin'), unit: '%', multiplier: 100, higherIsBetter: true },
        { label: 'Fixed Asset Turnover', find: find('activityRatios', 'Fixed Assets Turnover'), unit: 'x', multiplier: 1, higherIsBetter: true },
        { label: 'ROE', find: find('profitabilityRatios', 'Return on Stockholder Equity'), unit: '%', multiplier: 100, higherIsBetter: true },
    ];

    return (
        <div className={styles.kpiRow}>
            {kpis.map((k) => {
                if (!k.find) return null;
                const value = k.find.b * k.multiplier;
                const target = k.find.c * k.multiplier;
                const status = getStatusColor(value, target, k.higherIsBetter);
                const displayValue = k.unit === '%' ? value.toFixed(1) : value.toFixed(2);
                const displayTarget = k.unit === '%' ? target.toFixed(1) : target.toFixed(2);

                return (
                    <div key={k.label} className={styles.kpiRowCard}>
                        <span className={styles.kpiRowLabel}>{k.label}</span>
                        <span className={styles.kpiRowValue} style={{ color: status.color }}>
                            {displayValue}{k.unit}
                        </span>
                        <span className={styles.kpiRowTarget}>
                            Target: {displayTarget}{k.unit}
                        </span>
                        <span className={styles.kpiRowBadge} style={{ backgroundColor: `${status.color}20`, color: status.color }}>
                            {status.status}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

/* ── Section configs ── */
const SECTIONS = [
    { key: 'liquidityRatios', title: 'Liquidity Analysis', iconKey: 'liquidity', accent: '#1565c0', light: '#e3f2fd' },
    { key: 'leverageRatios', title: 'Leverage & Solvency', iconKey: 'leverage', accent: '#6a1b9a', light: '#f3e5f5' },
    { key: 'profitabilityRatios', title: 'Profitability Metrics', iconKey: 'profitability', accent: '#2e7d32', light: '#e8f5e9' },
    { key: 'activityRatios', title: 'Activity Efficiency', iconKey: 'activity', accent: '#e65100', light: '#fff3e0' },
];

/* ── Section Card ── */
function SectionCard({ section, data }) {
    if (!data || data.length === 0) return null;
    const { title, iconKey, accent, light } = section;

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
                {data.map((item, idx) => {
                    const shortLabel = item.a.split(' ').slice(0, 3).join(' ');
                    return (
                        <Gauge
                            key={idx}
                            value={item.b}
                            target={item.c}
                            label={shortLabel}
                            color={accent}
                            ratioName={item.a}
                        />
                    );
                })}
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

    // Filter out Gross Profit Margin (always 100% for service business)
    const filteredProfitability = ratios?.profitabilityRatios?.filter(r => r.a !== 'Gross Profit Margin') || [];

    const filteredRatios = {
        profitabilityRatios: filteredProfitability,
        liquidityRatios: ratios?.liquidityRatios || [],
        leverageRatios: ratios?.leverageRatios || [],
        activityRatios: ratios?.activityRatios || []
    };

    const currentRatio = ratios?.liquidityRatios?.find(r => r.a === 'Current Ratio');
    const debtToEquity = ratios?.leverageRatios?.find(r => r.a === 'Debt to Equity Ratio');
    const roa = ratios?.profitabilityRatios?.find(r => r.a === 'Return On Total Assets');

    const getActiveSections = () => {
        return SECTIONS.filter(s => {
            if (s.key === 'profitabilityRatios') return filteredProfitability.length > 0;
            return ratios?.[s.key] && ratios[s.key].length > 0;
        });
    };

    const activeSections = getActiveSections();
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

            <div className={styles.topScorecardRow}>
                {currentRatio && (
                    <Scorecard
                        title="Current Ratio"
                        value={currentRatio.b}
                        target={currentRatio.c}
                        unit="x"
                        higherIsBetter={true}
                    />
                )}
                {debtToEquity && (
                    <Scorecard
                        title="Debt to Equity"
                        value={debtToEquity.b}
                        target={debtToEquity.c}
                        unit="x"
                        higherIsBetter={false}
                    />
                )}
                {roa && (
                    <Scorecard
                        title="Return on Assets"
                        value={roa.b * 100}
                        target={roa.c * 100}
                        unit="%"
                        higherIsBetter={true}
                    />
                )}
            </div>

            <KPIRow ratios={filteredRatios} />

            <div className={styles.chartsRow}>
                <SimpleBarChart ratios={filteredRatios} />
                <SimpleDonutChart ratios={filteredRatios} />
            </div>

            <div className={styles.sectionsGrid}>
                <div className={styles.gridRow}>
                    {topRowSections.map((section) => (
                        <SectionCard
                            key={section.key}
                            section={section}
                            data={section.key === 'profitabilityRatios' ? filteredProfitability : ratios[section.key]}
                        />
                    ))}
                </div>
                <div className={styles.gridRow}>
                    {bottomRowSections.map((section) => (
                        <SectionCard
                            key={section.key}
                            section={section}
                            data={section.key === 'profitabilityRatios' ? filteredProfitability : ratios[section.key]}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}