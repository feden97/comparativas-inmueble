import React, { useMemo } from 'react';
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
  Minus
} from 'lucide-react';
import { formatCurrency, formatNumber, calculatePricePerM2 } from '../utils/formatters';
import styles from './MercadoPage.module.css';

const MercadoPage = () => {
  const { data } = useData();
  const { comparables, inmueble } = data;

  const displayNumbers = useMemo(() => {
    let activeCount = 0;
    return comparables.map(c => {
      if (c.activa) return ++activeCount;
      if (c.estado === 'Referencia') return '!';
      return 'X';
    });
  }, [comparables]);

  const ownM2Price = calculatePricePerM2(inmueble.precioPublicacion, inmueble.areaConstruidaM2);

  const stats = useMemo(() => {
    const activeComps = comparables.filter(c => c.activa);
    if (activeComps.length === 0) return null;

    const prices = activeComps.map(c => c.precio);
    const m2Prices = activeComps
      .filter(c => c.areaConstruidaM2)
      .map(c => calculatePricePerM2(c.precio, c.areaConstruidaM2));

    const min = activeComps.reduce((prev, curr) => prev.precio < curr.precio ? prev : curr);
    const max = activeComps.reduce((prev, curr) => prev.precio > curr.precio ? prev : curr);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const avgM2 = m2Prices.length > 0 ? m2Prices.reduce((a, b) => a + b, 0) / m2Prices.length : 0;

    return { min, max, avg, avgM2 };
  }, [comparables]);

  const chartData = useMemo(() => {
    const activeComps = comparables
      .filter(c => c.activa && c.areaConstruidaM2)
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
  }, [comparables, inmueble, ownM2Price]);

  // Reference data: inactive comparables with m2 data (separate from main chart)
  const refChartData = useMemo(() => {
    return comparables
      .filter(c => !c.activa && c.areaConstruidaM2)
      .map(c => ({
        name: c.nombre.length > 20 ? c.nombre.substring(0, 20) + '…' : c.nombre,
        fullName: c.nombre,
        m2Price: Math.round(calculatePricePerM2(c.precio, c.areaConstruidaM2)),
      }));
  }, [comparables]);

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

  return (
    <div className={styles.page}>

      {/* Hero stat bar */}
      <div className={styles.heroBar}>
        <div className={styles.heroMain}>
          <span className={styles.heroLabel}>Tu Precio</span>
          <span className={styles.heroPrice}>{formatCurrency(inmueble.precioPublicacion)}</span>
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
          <span className={styles.statSub}>Mercado activo</span>
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

        {/* Reference properties - separate section */}
        {refChartData.length > 0 && (
          <>
            <div className={styles.refDivider}>
              <span>Solo referencia — no incluido en promedios</span>
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
                  <ReferenceLine 
                    x={Math.round(stats?.avgM2 || 0)} 
                    stroke="#ef4444" 
                    strokeWidth={1}
                    strokeDasharray="4 3" 
                  />
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
            <Info size={13} /> Actualizado Mayo 2026
          </p>
        </div>

        {/* Desktop table */}
        <div className={styles.desktopTable}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
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
                  <td>★</td>
                  <td>
                    <div className={styles.compName}>Mi Inmueble</div>
                    <div className={styles.compRef}>{inmueble.direccion}</div>
                  </td>
                  <td className={styles.bold}>{formatCurrency(inmueble.precioPublicacion)}</td>
                  <td>{formatNumber(inmueble.areaTerrenoM2)}</td>
                  <td>{formatNumber(inmueble.areaConstruidaM2)}</td>
                  <td className={styles.bold}>{formatCurrency(ownM2Price)}</td>
                  <td></td>
                </tr>
                {/* Comparables */}
                {comparables.map((comp, idx) => {
                  const m2Price = comp.areaConstruidaM2 ? calculatePricePerM2(comp.precio, comp.areaConstruidaM2) : null;
                  const isInactive = !comp.activa;
                  
                  return (
                    <tr key={comp.id} className={isInactive ? styles.rowInactive : ''}>
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
                <span className={styles.metricVal}>{formatCurrency(inmueble.precioPublicacion)}</span>
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
            const isInactive = !comp.activa;
            
            return (
              <div key={comp.id} className={`${styles.card} ${isInactive ? styles.cardDim : ''}`}>
                <div className={styles.cardTop}>
                  <div className={`${styles.cardBadge} ${isInactive ? styles.cardBadgeInactive : ''}`}>{displayNumbers[idx]}</div>
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
