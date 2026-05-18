import React, { useState, useMemo } from 'react';
import { useData } from '../App';
import { formatCurrency, calculatePricePerM2 } from '../utils/formatters';
import { 
  ArrowUp, 
  ArrowDown, 
  TrendingUp, 
  History,
  Calculator,
  Plus
} from 'lucide-react';
import styles from './AnalisisPage.module.css';

const AnalisisPage = () => {
  const { data, addActividad } = useData();
  const { inmueble, comparables, actividad } = data;
  const [scenarioPrice, setScenarioPrice] = useState(inmueble.precioPublicacion);

  const marketAvg = useMemo(() => {
    const activeComps = comparables.filter(c => c.activa);
    const m2Prices = activeComps.map(c => calculatePricePerM2(c.precio, c.areaConstruidaM2));
    return m2Prices.reduce((a, b) => a + b, 0) / m2Prices.length;
  }, [comparables]);

  const scenarioM2 = scenarioPrice / inmueble.areaConstruidaM2;
  const diffAvgUSD = scenarioM2 - marketAvg;
  const diffAvgPct = (diffAvgUSD / marketAvg) * 100;

  const getStatus = () => {
    if (diffAvgPct < 0) return { label: 'Competitivo', color: 'green', text: 'debajo' };
    if (diffAvgPct < 15) return { label: 'En rango', color: 'yellow', text: 'en rango' };
    return { label: 'Por encima', color: 'red', text: 'por encima' };
  };

  const status = getStatus();

  const handleAddHistory = () => {
    const note = prompt("Nota para el historial:");
    if (note) {
      addActividad({
        fecha: new Date().toISOString().split('T')[0],
        tipo: 'Publicación',
        descripcion: `Actualización de precio de análisis: ${formatCurrency(scenarioPrice)}. ${note}`,
        monto: scenarioPrice
      });
    }
  };

  return (
    <div className="container">
      <h2>Análisis de Precio</h2>

      <div className="grid-2">
        {/* Left: Calculator */}
        <div className={styles.col}>
          <div className="card">
            <div className={styles.cardHeader}>
              <Calculator size={20} />
              <h3>Calculadora de Escenarios</h3>
            </div>
            
            <div className={styles.sliderContainer}>
              <div className={styles.priceDisplay}>
                <input 
                  type="number" 
                  value={scenarioPrice} 
                  onChange={(e) => setScenarioPrice(Number(e.target.value))}
                  className={styles.priceInput}
                />
                <span>USD</span>
              </div>
              <input 
                type="range" 
                min="150000" 
                max="280000" 
                step="5000" 
                value={scenarioPrice}
                onChange={(e) => setScenarioPrice(Number(e.target.value))}
                className={styles.rangeInput}
              />
              <div className={styles.rangeLabels}>
                <span>$150k</span>
                <span>$215k</span>
                <span>$280k</span>
              </div>
            </div>

            <div className={styles.resultGrid}>
              <div className={styles.resultItem}>
                <label>Precio/m² Resultante</label>
                <div className={styles.resultVal}>{formatCurrency(scenarioM2)}</div>
              </div>
              <div className={`${styles.resultItem} ${diffAvgPct > 0 ? styles.textRed : styles.textGreen}`}>
                <label>vs Promedio Mercado</label>
                <div className={styles.resultVal}>
                  {diffAvgPct > 0 ? <ArrowUp size={20} /> : <ArrowDown size={20} />}
                  {Math.abs(diffAvgPct).toFixed(1)}%
                </div>
              </div>
            </div>

            <div className={`${styles.statusAlert} ${styles[status.color]}`}>
              <div className={styles.statusDot}></div>
              <div>
                <strong>{status.label}</strong>
                <p>Tu inmueble está {Math.abs(diffAvgPct).toFixed(1)}% {status.text} del promedio del mercado.</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className={styles.cardHeader}>
              <TrendingUp size={20} />
              <h3>Comparativa Dinámica</h3>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Comparable</th>
                    <th>vs Tu Precio</th>
                    <th>Dif. %</th>
                  </tr>
                </thead>
                <tbody>
                  {comparables.filter(c => c.activa).map(comp => {
                    const compM2 = calculatePricePerM2(comp.precio, comp.areaConstruidaM2);
                    const diffM2 = scenarioM2 - compM2;
                    const diffPct = (diffM2 / compM2) * 100;
                    return (
                      <tr key={comp.id}>
                        <td>{comp.nombre}</td>
                        <td className={diffM2 > 0 ? styles.textRed : styles.textGreen}>
                          {diffM2 > 0 ? '+' : ''}{formatCurrency(diffM2)}/m²
                        </td>
                        <td className={diffPct > 0 ? styles.textRed : styles.textGreen}>
                          {diffPct > 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                          {Math.abs(diffPct).toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: History */}
        <div className={styles.col}>
          <div className="card">
            <div className={styles.cardHeader}>
              <History size={20} />
              <h3>Historial de Precios</h3>
              <button className={styles.addBtn} onClick={handleAddHistory}>
                <Plus size={16} />
              </button>
            </div>
            <div className={styles.timeline}>
              {actividad.filter(a => a.monto).map(item => (
                <div key={item.id} className={styles.timelineItem}>
                  <div className={styles.timelineDate}>{item.fecha}</div>
                  <div className={styles.timelineContent}>
                    <strong>{formatCurrency(item.monto)}</strong>
                    <p>{item.descripcion}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalisisPage;
