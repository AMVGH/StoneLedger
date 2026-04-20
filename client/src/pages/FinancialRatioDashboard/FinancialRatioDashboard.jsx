// src/pages/FinancialRatioDashboard/FinancialRatioDashboard.jsx
import React, { useState, useEffect } from 'react';
import styles from './FinancialRatioDashboard.module.css';
import { getFinancialRatios } from '../../API/Ratios';

export default function FinancialRatioDashboard() {
  const [ratios, setRatios] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('current');

  useEffect(() => {
    fetchFinancialRatios();
  }, [selectedPeriod]);

  const fetchFinancialRatios = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getFinancialRatios();
      setRatios(response.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch financial ratios');
      console.error('Error fetching ratios:', err);
    } finally {
      setLoading(false);
    }
  };

  const RatioCard = ({ title, ratios: ratioList, color }) => (
    <div className={`${styles.ratioCard} ${styles[`card_${color}`]}`}>
      <h3 className={styles.ratioCardTitle}>{title}</h3>
      <div className={styles.ratioList}>
        {ratioList && ratioList.length > 0 ? (
          ratioList.map((ratio, idx) => (
            <div key={idx} className={styles.ratioItem}>
              <span className={styles.ratioLabel}>{ratio[0]}</span>
              <span className={styles.ratioValue}>
                {typeof ratio[1] === 'number' ? ratio[1].toFixed(2) : parseFloat(ratio[1]).toFixed(2)}
              </span>
            </div>
          ))
        ) : (
          <p className={styles.noData}>No data available</p>
        )}
      </div>
    </div>
  );

  if (loading) {
    return <div className={styles.container}><p>Loading financial ratios...</p></div>;
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorPanel}>
          <p className={styles.error}>{error}</p>
          <button className={styles.retryBtn} onClick={fetchFinancialRatios}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1>Financial Ratios Dashboard</h1>
        <div className={styles.periodSelector}>
          <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)}>
            <option value="current">Current Period</option>
            <option value="ytd">Year to Date</option>
            <option value="trailing">Trailing 12 Months</option>
          </select>
        </div>
      </div>

      {ratios && (
        <div className={styles.container}>
          {/* Profitability Ratios */}
          {ratios.profitabilityRatios && ratios.profitabilityRatios.length > 0 && (
            <RatioCard
              title="Profitability Ratios"
              ratios={ratios.profitabilityRatios}
              color="profitability"
            />
          )}

          {/* Liquidity Ratios */}
          {ratios.liquidityRatios && ratios.liquidityRatios.length > 0 && (
            <RatioCard
              title="Liquidity Ratios"
              ratios={ratios.liquidityRatios}
              color="liquidity"
            />
          )}

          {/* Leverage Ratios */}
          {ratios.leverageRatios && ratios.leverageRatios.length > 0 && (
            <RatioCard
              title="Leverage Ratios"
              ratios={ratios.leverageRatios}
              color="leverage"
            />
          )}

          {/* Activity Ratios */}
          {ratios.activityRatios && ratios.activityRatios.length > 0 && (
            <RatioCard
              title="Activity Ratios"
              ratios={ratios.activityRatios}
              color="activity"
            />
          )}

          {/* Other Ratios */}
          {ratios.otherRatios && ratios.otherRatios.length > 0 && (
            <RatioCard
              title="Other Financial Ratios"
              ratios={ratios.otherRatios}
              color="other"
            />
          )}
        </div>
      )}
    </div>
  );
}
