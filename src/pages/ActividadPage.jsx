import React, { useState } from 'react';
import { useData } from '../App';
import { formatCurrency } from '../utils/formatters';
import { 
  Calendar, 
  Plus, 
  Search,
  MessageSquare,
  Eye,
  Handshake,
  FileCheck,
  MoreVertical,
  Filter
} from 'lucide-react';
import styles from './ActividadPage.module.css';

const ActividadPage = () => {
  const { data, addActividad } = useData();
  const { actividad } = data;
  const [filterType, setFilterType] = useState('Todos');
  const [showModal, setShowModal] = useState(false);

  const types = ['Todos', 'Publicación', 'Consulta', 'Visita', 'Oferta', 'Negociación', 'Documento', 'Otro'];

  const filteredActividad = filterType === 'Todos' 
    ? actividad 
    : actividad.filter(a => a.tipo === filterType);

  const getIcon = (type) => {
    switch (type) {
      case 'Publicación': return <Search size={18} />;
      case 'Consulta': return <MessageSquare size={18} />;
      case 'Visita': return <Eye size={18} />;
      case 'Oferta': return <Handshake size={18} />;
      case 'Negociación': return <TrendingUp size={18} />;
      case 'Documento': return <FileCheck size={18} />;
      default: return <MoreVertical size={18} />;
    }
  };

  const getTypeClass = (type) => {
    switch (type) {
      case 'Publicación': return styles.typePub;
      case 'Consulta': return styles.typeCons;
      case 'Visita': return styles.typeVis;
      case 'Oferta': return styles.typeOff;
      case 'Negociación': return styles.typeNeg;
      case 'Documento': return styles.typeDoc;
      default: return styles.typeOther;
    }
  };

  return (
    <div className="container">
      <div className={styles.header}>
        <h2>Historial de Actividad</h2>
        <button className={styles.addBtn} onClick={() => setShowModal(true)}>
          <Plus size={18} /> Registrar evento
        </button>
      </div>

      <div className={styles.filterBar}>
        <Filter size={16} />
        {types.map(t => (
          <button 
            key={t} 
            className={`${styles.filterTab} ${filterType === t ? styles.activeTab : ''}`}
            onClick={() => setFilterType(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className={styles.timeline}>
        {filteredActividad.map((item, idx) => (
          <div key={item.id} className={styles.timelineItem}>
            <div className={styles.timelineDate}>
              <Calendar size={14} /> {item.fecha}
            </div>
            <div className={styles.timelineContent}>
              <div className={styles.timelineHeader}>
                <span className={`${styles.typeBadge} ${getTypeClass(item.tipo)}`}>
                  {getIcon(item.tipo)} {item.tipo}
                </span>
                {item.monto && <span className={styles.timelineMonto}>{formatCurrency(item.monto)}</span>}
              </div>
              <p className={styles.description}>{item.descripcion}</p>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Registrar Nuevo Evento</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const newEvent = {
                fecha: formData.get('fecha'),
                tipo: formData.get('tipo'),
                descripcion: formData.get('descripcion'),
                monto: formData.get('monto') ? Number(formData.get('monto')) : null
              };
              addActividad(newEvent);
              setShowModal(false);
            }}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Fecha</label>
                  <input name="fecha" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
                </div>
                <div className={styles.formGroup}>
                  <label>Tipo de Evento</label>
                  <select name="tipo" required>
                    {types.filter(t => t !== 'Todos').map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                  <label>Descripción</label>
                  <textarea name="descripcion" rows="3" required></textarea>
                </div>
                <div className={styles.formGroup}>
                  <label>Monto USD (opcional)</label>
                  <input name="monto" type="number" placeholder="Ej: 230000" />
                </div>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className={styles.saveBtn}>Guardar Evento</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActividadPage;

const TrendingUp = ({ size }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
);
