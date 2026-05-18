import React, { useState, useMemo } from 'react';
import { useData } from '../App';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';
import { 
  Plus, 
  ExternalLink, 
  Edit2, 
  Trash2, 
  ArrowUpRight,
  Info
} from 'lucide-react';
import { formatCurrency, formatNumber, calculatePricePerM2 } from '../utils/formatters';
import styles from './MercadoPage.module.css';

const MercadoPage = () => {
  const { data, addComparable, deleteComparable } = useData();
  const { comparables, inmueble } = data;
  const [showModal, setShowModal] = useState(false);

  const stats = useMemo(() => {
    const activeComps = comparables.filter(c => c.activa);
    if (activeComps.length === 0) return null;

    const prices = activeComps.map(c => c.precio);
    const m2Prices = activeComps.map(c => calculatePricePerM2(c.precio, c.areaConstruidaM2));

    const min = activeComps.reduce((prev, curr) => prev.precio < curr.precio ? prev : curr);
    const max = activeComps.reduce((prev, curr) => prev.precio > curr.precio ? prev : curr);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const avgM2 = m2Prices.reduce((a, b) => a + b, 0) / m2Prices.length;

    return { min, max, avg, avgM2 };
  }, [comparables]);

  const chartData = useMemo(() => {
    const activeComps = comparables.filter(c => c.activa).map(c => ({
      name: c.nombre.length > 20 ? c.nombre.substring(0, 20) + '...' : c.nombre,
      fullName: c.nombre,
      m2Price: calculatePricePerM2(c.precio, c.areaConstruidaM2),
      isOwn: false
    }));

    const ownData = {
      name: "Mi Inmueble",
      fullName: "Mi Inmueble",
      m2Price: calculatePricePerM2(inmueble.precioPublicacion, inmueble.areaConstruidaM2),
      isOwn: true
    };

    return [...activeComps, ownData].sort((a, b) => a.m2Price - b.m2Price);
  }, [comparables, inmueble]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.chartTooltip}>
          <p className={styles.tooltipTitle}>{payload[0].payload.fullName}</p>
          <p className={styles.tooltipValue}>Precio/m²: {formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  const getRowHighlight = (comp) => {
    const compM2 = calculatePricePerM2(comp.precio, comp.areaConstruidaM2);
    const ownM2 = calculatePricePerM2(inmueble.precioPublicacion, inmueble.areaConstruidaM2);
    if (compM2 > ownM2) return styles.rowGreen;
    if (compM2 < ownM2) return styles.rowYellow;
    return '';
  };

  return (
    <div className="container">
      <h2>Mercado</h2>
      
      {/* Stats Summary */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <label>Precio Mínimo</label>
          <div className={styles.statVal}>{formatCurrency(stats?.min.precio)}</div>
          <div className={styles.statSub}>{stats?.min.nombre}</div>
        </div>
        <div className={styles.statCard}>
          <label>Precio Promedio</label>
          <div className={styles.statVal}>{formatCurrency(stats?.avg)}</div>
          <div className={styles.statSub}>Promedio del mercado</div>
        </div>
        <div className={styles.statCard}>
          <label>Precio Máximo</label>
          <div className={styles.statVal}>{formatCurrency(stats?.max.precio)}</div>
          <div className={styles.statSub}>{stats?.max.nombre}</div>
        </div>
        <div className={styles.statCard}>
          <label>Avg USD/m² Construido</label>
          <div className={styles.statVal}>{formatCurrency(stats?.avgM2)}</div>
          <div className={styles.statSub}>Referencia m²</div>
        </div>
      </div>

      {/* Chart */}
      <div className="card">
        <h3>Comparativa de Precio por m² Construido</h3>
        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30, top: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={150} 
                tick={{ fontSize: 12, fill: '#6b7280' }} 
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="m2Price" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.isOwn ? '#c9a84c' : '#1e3a5f'} fillOpacity={entry.isOwn ? 1 : 0.7} />
                ))}
              </Bar>
              <ReferenceLine x={stats?.avgM2} stroke="#ef4444" strokeDasharray="5 5" label={{ position: 'top', value: 'Avg', fill: '#ef4444', fontSize: 12 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className={styles.tableHeader}>
          <div>
            <h3>Tabla de Comparables</h3>
            <p className={styles.infoNote}>
              <Info size={14} /> Datos relevados en Diciembre 2025.
            </p>
          </div>
          <button className={styles.addBtn} onClick={() => setShowModal(true)}>
            <Plus size={18} /> Agregar comparable
          </button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre / Referencia</th>
                <th>Precio USD</th>
                <th>Terreno m²</th>
                <th>Construido m²</th>
                <th>USD/m² Const.</th>
                <th>Fuente</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {comparables.map((comp, idx) => {
                const m2Price = calculatePricePerM2(comp.precio, comp.areaConstruidaM2);
                const isInactive = !comp.activa;
                
                return (
                  <tr key={comp.id} className={`${getRowHighlight(comp)} ${isInactive ? styles.rowInactive : ''}`}>
                    <td>{idx + 1}</td>
                    <td>
                      <div className={styles.compName}>
                        {comp.nombre}
                        {comp.estado && (
                          <span className={`${styles.statusBadge} ${styles.statusSold}`}>{comp.estado}</span>
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
                    <td>{formatNumber(comp.areaConstruidaM2)}</td>
                    <td className={styles.bold}>{formatCurrency(m2Price)}</td>
                    <td>
                      <a href={comp.link} target="_blank" rel="noopener noreferrer" className={styles.linkIcon}>
                        <ExternalLink size={16} />
                      </a>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button className={styles.actionBtn}><Edit2 size={16} /></button>
                        <button className={styles.actionBtn} onClick={() => deleteComparable(comp.id)}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Agregar Nuevo Comparable</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const newComp = {
                nombre: formData.get('nombre'),
                referencia: formData.get('referencia'),
                precio: Number(formData.get('precio')),
                areaTerrenoM2: Number(formData.get('areaTerreno')),
                areaConstruidaM2: Number(formData.get('areaConstruida')),
                pisos: Number(formData.get('pisos')),
                habitaciones: Number(formData.get('habitaciones')),
                banios: Number(formData.get('banios')),
                fuente: formData.get('fuente'),
                link: formData.get('link'),
                activa: true
              };
              addComparable(newComp);
              setShowModal(false);
            }}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Nombre</label>
                  <input name="nombre" required />
                </div>
                <div className={styles.formGroup}>
                  <label>Referencia</label>
                  <input name="referencia" required />
                </div>
                <div className={styles.formGroup}>
                  <label>Precio (USD)</label>
                  <input name="precio" type="number" required />
                </div>
                <div className={styles.formGroup}>
                  <label>Área Terreno (m²)</label>
                  <input name="areaTerreno" type="number" required />
                </div>
                <div className={styles.formGroup}>
                  <label>Área Construida (m²)</label>
                  <input name="areaConstruida" type="number" required />
                </div>
                <div className={styles.formGroup}>
                  <label>Pisos</label>
                  <input name="pisos" type="number" />
                </div>
                <div className={styles.formGroup}>
                  <label>Fuente</label>
                  <input name="fuente" />
                </div>
                <div className={styles.formGroup}>
                  <label>Link</label>
                  <input name="link" />
                </div>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className={styles.saveBtn}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MercadoPage;
