import React, { useMemo, useState, useCallback } from 'react';
import { useData } from '../App';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  LabelList
} from 'recharts';
import { 
  ExternalLink, 
  Info,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { formatCurrency, formatNumber, calculatePricePerM2 } from '../utils/formatters';
import styles from './MercadoPage.module.css';

const MercadoPage = () => {
  const { data } = useData();
  const { comparables, inmueble } = data;

  // Editable price state — initialized from data
  const [customPrice, setCustomPrice] = useState(inmueble.precioPublicacion);

  // Track which comparables are included in average calculation
  // By default: all activa ones are included
  const [includedIds, setIncludedIds] = useState(() => {
    const ids = new Set();
    comparables.forEach(c => {
      if (c.activa) ids.add(c.id);
    });
    return ids;
  });

  const toggleIncluded = useCallback((id) => {
    setIncludedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handlePriceChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setCustomPrice(val === '' ? '' : parseInt(val, 10));
  };

  const nudgePrice = (delta) => {
    setCustomPrice(prev => {
      const current = typeof prev === 'number' ? prev : inmueble.precioPublicacion;
      return Math.max(0, current + delta);
    });
  };

  const displayNumbers = useMemo(() => {
    let activeCount = 0;
    return comparables.map(c => {
      if (c.activa) return ++activeCount;
      if (c.estado === 'Referencia') return '!';
      return 'X';
    });
  }, [comparables]);

  const effectivePrice = typeof customPrice === 'number' ? customPrice : inmueble.precioPublicacion;
  const ownM2Price = calculatePricePerM2(effectivePrice, inmueble.areaConstruidaM2);

  // Stats now filter by includedIds
  const stats = useMemo(() => {
    const activeComps = comparables.filter(c => includedIds.has(c.id));
    if (activeComps.length === 0) return null;

    const prices = activeComps.map(c => c.precio);
    const m2Prices = activeComps
      .filter(c => c.areaConstruidaM2)
      .map(c => calculatePricePerM2(c.precio, c.areaConstruidaM2));

    const min = activeComps.reduce((prev, curr) => prev.precio < curr.precio ? prev : curr);
    const max = activeComps.reduce((prev, curr) => prev.precio > curr.precio ? prev : curr);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const avgM2 = m2Prices.length > 0 ? m2Prices.reduce((a, b) => a + b, 0) / m2Prices.length : 0;

    return { min, max, avg, avgM2, count: activeComps.length };
  }, [comparables, includedIds]);

  const chartData = useMemo(() => {
    const activeComps = comparables
      .filter(c => includedIds.has(c.id) && c.areaConstruidaM2)
      .map(c => ({
        name: c.nombre.length > 16 ? c.nombre.substring(0, 16) + '…' : c.nombre,
        fullName: c.nombre,
        m2Price: Math.round(calculatePricePerM2(c.precio, c.areaConstruidaM2)),
        isOwn: false
      }));

    const ownData = {
      name: "Mi Inmueble",
      fullName: "Mi Inmueble",
      m2Price: Math.round(ownM2Price),
      isOwn: true
    };

    return [...activeComps, ownData].sort((a, b) => a.m2Price - b.m2Price);
  }, [comparables, includedIds, ownM2Price]);

  // Reference data: comparables NOT in includedIds that have m2 data and are not active
  const refChartData = useMemo(() => {
    return comparables
      .filter(c => !includedIds.has(c.id) && c.areaConstruidaM2)
      .map(c => ({
        name: c.nombre.length > 20 ? c.nombre.substring(0, 20) + '…' : c.nombre,
        fullName: c.nombre,
        m2Price: Math.round(calculatePricePerM2(c.precio, c.areaConstruidaM2)),
      }));
  }, [comparables, includedIds]);

  // Custom label at end of each bar
  const renderBarLabel = (props) => {
    const { x, y, width, height, value } = props;
    return (
      <text 
        x={x + width + 5} 
        y={y + height / 2} 
        fill="#374151" 
        fontSize={11} 
        fontWeight={700}
        dominantBaseline="central"
        fontFamily="'Inter', sans-serif"
      >
        ${value}
      </text>
    );
  };

  // Position comparison vs average
  const diffVsAvg = stats ? Math.round(((ownM2Price - stats.avgM2) / stats.avgM2) * 100) : 0;

  const isCustom = effectivePrice !== inmueble.precioPublicacion;

  return (
    <div className={styles.page}>

      {/* Hero stat bar with editable price */}
      <div className={styles.heroBar}>
        <div className={styles.heroMain}>
          <span className={styles.heroLabel}>Tu Precio</span>
          <div className={styles.priceEditor}>
            <button 
              className={styles.nudgeBtn} 
              onClick={() => nudgePrice(-5000)}
              title="-$5,000"
            >
              <ChevronDown size={16} />
            </button>
            <div className={styles.priceInputWrap}>
              <span className={styles.priceCurrency}>$</span>
              <input 
                type="text"
                className={styles.priceInput}
                value={typeof customPrice === 'number' ? customPrice.toLocaleString('en-US') : ''}
                onChange={handlePriceChange}
                inputMode="numeric"
              />
            </div>
            <button 
              className={styles.nudgeBtn} 
              onClick={() => nudgePrice(5000)}
              title="+$5,000"
            >
              <ChevronUp size={16} />
            </button>
          </div>
          {isCustom && (
            <button className={styles.resetPriceBtn} onClick={() => setCustomPrice(inmueble.precioPublicacion)}>
              Restaurar ${inmueble.precioPublicacion.toLocaleString('en-US')}
            </button>
          )}
        </div>
        <div className={styles.heroDivider}></div>
        <div className={styles.heroStat}>
          <span className={styles.heroLabel}>USD/m²</span>
          <span className={styles.heroValue}>{formatCurrency(ownM2Price)}</span>
        </div>
        <div className={styles.heroDivider}></div>
        <div className={styles.heroStat}>
          <span className={styles.heroLabel}>vs Mercado</span>
          <span className={`${styles.heroValue} ${diffVsAvg > 0 ? styles.heroUp : diffVsAvg < 0 ? styles.heroDown : ''}`}>
            {diffVsAvg > 0 ? <TrendingUp size={14} /> : diffVsAvg < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
            {diffVsAvg > 0 ? '+' : ''}{diffVsAvg}%
          </span>
        </div>
      </div>

      {/* Scenario indicator */}
      {isCustom && (
        <div className={styles.scenarioBanner}>
          ⚡ Escenario: ${effectivePrice.toLocaleString('en-US')} — precio original: ${inmueble.precioPublicacion.toLocaleString('en-US')}
        </div>
      )}

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Precio Mínimo</span>
          <span className={styles.statVal}>{formatCurrency(stats?.min.precio)}</span>
          <span className={styles.statSub}>{stats?.min.nombre}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Precio Promedio</span>
          <span className={styles.statVal}>{formatCurrency(stats?.avg)}</span>
          <span className={styles.statSub}>{stats ? `${stats.count} inmuebles seleccionados` : 'Ninguno seleccionado'}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Precio Máximo</span>
          <span className={styles.statVal}>{formatCurrency(stats?.max.precio)}</span>
          <span className={styles.statSub}>{stats?.max.nombre}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Avg USD/m²</span>
          <span className={styles.statVal}>{formatCurrency(stats?.avgM2)}</span>
          <span className={styles.statSub}>Referencia mercado</span>
        </div>
      </div>

      {/* Chart */}
      <div className={styles.chartCard}>
        <h3 className={styles.sectionTitle}>Comparativa USD/m² Construido</h3>
        {chartData.length > 1 ? (
          <>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height={Math.max(220, chartData.length * 52 + 50)}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 5, right: 55, top: 15, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={120} 
                    tick={{ fontSize: 10, fill: '#6b7280', fontFamily: "'Inter', sans-serif" }} 
                  />
                  <Bar dataKey="m2Price" radius={[0, 5, 5, 0]} barSize={22}>
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.isOwn ? '#c9a84c' : '#1e3a5f'} 
                        fillOpacity={entry.isOwn ? 1 : 0.75} 
                      />
                    ))}
                    <LabelList dataKey="m2Price" content={renderBarLabel} />
                  </Bar>
                  <ReferenceLine 
                    x={Math.round(stats?.avgM2 || 0)} 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    strokeDasharray="6 4" 
                    label={{ 
                      position: 'top', 
                      value: `Avg $${Math.round(stats?.avgM2 || 0)}`, 
                      fill: '#ef4444', 
                      fontSize: 11, 
                      fontWeight: 700,
                      fontFamily: "'Inter', sans-serif"
                    }} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className={styles.chartLegend}>
              <span className={styles.legendDot} style={{ background: '#1e3a5f' }}></span> Comparables
              <span className={styles.legendDot} style={{ background: '#c9a84c', marginLeft: 12 }}></span> Mi Inmueble
              <span className={styles.legendLine}></span> Promedio
            </div>
          </>
        ) : (
          <div className={styles.emptyChart}>Selecciona al menos un comparable para ver la gráfica</div>
        )}

        {/* Reference properties - separate section */}
        {refChartData.length > 0 && (
          <>
            <div className={styles.refDivider}>
              <span>Excluidos del promedio</span>
            </div>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height={refChartData.length * 52 + 30}>
                <BarChart data={refChartData} layout="vertical" margin={{ left: 5, right: 55, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={120} 
                    tick={{ fontSize: 10, fill: '#9ca3af', fontFamily: "'Inter', sans-serif" }} 
                  />
                  <Bar dataKey="m2Price" radius={[0, 5, 5, 0]} barSize={20} fill="#9ca3af" fillOpacity={0.5}>
                    <LabelList dataKey="m2Price" content={renderBarLabel} />
                  </Bar>
                  {stats && (
                    <ReferenceLine 
                      x={Math.round(stats.avgM2)} 
                      stroke="#ef4444" 
                      strokeWidth={1}
                      strokeDasharray="4 3" 
                    />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>

      {/* Table / Cards */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h3 className={styles.sectionTitle}>Tabla de Comparables</h3>
          <p className={styles.infoNote}>
            <Info size={13} /> Usa los casilleros para incluir/excluir del promedio
          </p>
        </div>

        {/* Desktop table */}
        <div className={styles.desktopTable}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 40 }}>Incl.</th>
                  <th>#</th>
                  <th>Nombre / Referencia</th>
                  <th>Precio USD</th>
                  <th>Terreno m²</th>
                  <th>Construido m²</th>
                  <th>USD/m²</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {/* Mi Inmueble */}
                <tr className={styles.rowOwn}>
                  <td></td>
                  <td>★</td>
                  <td>
                    <div className={styles.compName}>Mi Inmueble</div>
                    <div className={styles.compRef}>{inmueble.direccion}</div>
                  </td>
                  <td className={styles.bold}>
                    {formatCurrency(effectivePrice)}
                    {isCustom && <span className={styles.scenarioTag}>escenario</span>}
                  </td>
                  <td>{formatNumber(inmueble.areaTerrenoM2)}</td>
                  <td>{formatNumber(inmueble.areaConstruidaM2)}</td>
                  <td className={styles.bold}>{formatCurrency(ownM2Price)}</td>
                  <td></td>
                </tr>
                {/* Comparables */}
                {comparables.map((comp, idx) => {
                  const m2Price = comp.areaConstruidaM2 ? calculatePricePerM2(comp.precio, comp.areaConstruidaM2) : null;
                  const isIncluded = includedIds.has(comp.id);
                  
                  return (
                    <tr key={comp.id} className={!isIncluded ? styles.rowInactive : ''}>
                      <td>
                        <label className={styles.checkboxWrap}>
                          <input 
                            type="checkbox" 
                            checked={isIncluded} 
                            onChange={() => toggleIncluded(comp.id)}
                            className={styles.checkbox}
                          />
                          <span className={styles.checkboxCustom}></span>
                        </label>
                      </td>
                      <td>{displayNumbers[idx]}</td>
                      <td>
                        <div className={styles.compName}>
                          {comp.nombre}
                          {comp.estado && (
                            <span className={styles.badge}>{comp.estado}</span>
                          )}
                        </div>
                        <div className={styles.compRef}>{comp.referencia}</div>
                      </td>
                      <td className={styles.bold}>
                        {comp.precioAnterior && (
                          <span className={styles.oldPrice}>{formatCurrency(comp.precioAnterior)}</span>
                        )}
                        {formatCurrency(comp.precio)}
                      </td>
                      <td>{formatNumber(comp.areaTerrenoM2)}</td>
                      <td>{comp.areaConstruidaM2 ? formatNumber(comp.areaConstruidaM2) : '—'}</td>
                      <td className={styles.bold}>{m2Price ? formatCurrency(m2Price) : '—'}</td>
                      <td>
                        <a href={comp.link} target="_blank" rel="noopener noreferrer" className={styles.linkIcon}>
                          <ExternalLink size={15} />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile cards */}
        <div className={styles.mobileCards}>
          {/* Mi Inmueble card */}
          <div className={`${styles.card} ${styles.cardOwn}`}>
            <div className={styles.cardTop}>
              <div className={styles.cardBadgeOwn}>★</div>
              <div className={styles.cardInfo}>
                <span className={styles.cardName}>Mi Inmueble</span>
                <span className={styles.cardAddr}>{inmueble.direccion}</span>
              </div>
            </div>
            <div className={styles.cardGrid}>
              <div className={styles.cardMetric}>
                <span className={styles.metricLabel}>Precio</span>
                <span className={styles.metricVal}>
                  {formatCurrency(effectivePrice)}
                  {isCustom && <span className={styles.scenarioTag}>escenario</span>}
                </span>
              </div>
              <div className={styles.cardMetric}>
                <span className={styles.metricLabel}>Terreno</span>
                <span className={styles.metricVal}>{formatNumber(inmueble.areaTerrenoM2)} m²</span>
              </div>
              <div className={styles.cardMetric}>
                <span className={styles.metricLabel}>Construido</span>
                <span className={styles.metricVal}>{formatNumber(inmueble.areaConstruidaM2)} m²</span>
              </div>
              <div className={styles.cardMetric}>
                <span className={styles.metricLabel}>USD/m²</span>
                <span className={`${styles.metricVal} ${styles.metricHighlight}`}>{formatCurrency(ownM2Price)}</span>
              </div>
            </div>
          </div>

          {/* Comparable cards */}
          {comparables.map((comp, idx) => {
            const m2Price = comp.areaConstruidaM2 ? calculatePricePerM2(comp.precio, comp.areaConstruidaM2) : null;
            const isIncluded = includedIds.has(comp.id);
            
            return (
              <div key={comp.id} className={`${styles.card} ${!isIncluded ? styles.cardDim : ''}`}>
                <div className={styles.cardTop}>
                  <label className={styles.checkboxWrap} onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      checked={isIncluded} 
                      onChange={() => toggleIncluded(comp.id)}
                      className={styles.checkbox}
                    />
                    <span className={styles.checkboxCustom}></span>
                  </label>
                  <div className={`${styles.cardBadge} ${!isIncluded ? styles.cardBadgeInactive : ''}`}>{displayNumbers[idx]}</div>
                  <div className={styles.cardInfo}>
                    <span className={styles.cardName}>{comp.nombre}</span>
                    {comp.estado && <span className={styles.badge}>{comp.estado}</span>}
                  </div>
                  <a href={comp.link} target="_blank" rel="noopener noreferrer" className={styles.cardExtLink}>
                    <ExternalLink size={15} />
                  </a>
                </div>
                <div className={styles.cardGrid}>
                  <div className={styles.cardMetric}>
                    <span className={styles.metricLabel}>Precio</span>
                    <span className={styles.metricVal}>
                      {comp.precioAnterior && <span className={styles.oldPrice}>{formatCurrency(comp.precioAnterior)} → </span>}
                      {formatCurrency(comp.precio)}
                    </span>
                  </div>
                  <div className={styles.cardMetric}>
                    <span className={styles.metricLabel}>Terreno</span>
                    <span className={styles.metricVal}>{formatNumber(comp.areaTerrenoM2)} m²</span>
                  </div>
                  <div className={styles.cardMetric}>
                    <span className={styles.metricLabel}>Construido</span>
                    <span className={styles.metricVal}>{comp.areaConstruidaM2 ? `${formatNumber(comp.areaConstruidaM2)} m²` : '—'}</span>
                  </div>
                  <div className={styles.cardMetric}>
                    <span className={styles.metricLabel}>USD/m²</span>
                    <span className={`${styles.metricVal} ${styles.metricHighlight}`}>{m2Price ? formatCurrency(m2Price) : '—'}</span>
                  </div>
                </div>
                {comp.referencia && <div className={styles.cardFooter}>{comp.referencia}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MercadoPage;
