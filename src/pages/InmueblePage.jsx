import React, { useState } from 'react';
import { useData } from '../App';
import { 
  MapPin, 
  Maximize, 
  Layers, 
  Home, 
  Bath, 
  DoorOpen, 
  Store, 
  CheckCircle,
  Edit2,
  Save,
  Clock,
  RefreshCcw
} from 'lucide-react';
import { formatCurrency, formatNumber, calculatePricePerM2 } from '../utils/formatters';
import styles from './InmueblePage.module.css';

const InmueblePage = () => {
  const { data, updateInmueble } = useData();
  const { inmueble } = data;
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(inmueble);

  const handleSave = () => {
    updateInmueble(editData);
    setIsEditing(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const pricePerM2 = calculatePricePerM2(inmueble.precioPublicacion, inmueble.areaConstruidaM2);

  return (
    <div className="container">
      <div className={styles.headerRow}>
        <h2>Mi Inmueble</h2>
        <div className={styles.headerActions}>
          <div className={styles.lastUpdate}>
            <Clock size={14} /> 
            <span>Última actualización: {inmueble.ultimaActualizacion}</span>
          </div>
          <button className={styles.resetBtn} onClick={() => data.resetData && data.resetData()}>
            <RefreshCcw size={14} /> Restablecer
          </button>
        </div>
      </div>

      <div className="grid-2">
        {/* Left Column */}
        <div className={styles.col}>
          <div className="card">
            <div className={styles.cardHeader}>
              <h3>Ficha Técnica</h3>
              <button 
                className={styles.editBtn} 
                onClick={isEditing ? handleSave : () => setIsEditing(true)}
              >
                {isEditing ? <><Save size={16} /> Guardar</> : <><Edit2 size={16} /> Editar datos</>}
              </button>
            </div>

            <div className={styles.techGrid}>
              <div className={styles.techItem}>
                <MapPin size={20} className={styles.icon} />
                <div className={styles.techInfo}>
                  <label>Dirección</label>
                  {isEditing ? (
                    <input name="direccion" value={editData.direccion} onChange={handleChange} />
                  ) : (
                    <span>{inmueble.direccion}</span>
                  )}
                </div>
              </div>
              <div className={styles.techItem}>
                <Layers size={20} className={styles.icon} />
                <div className={styles.techInfo}>
                  <label>Referencia</label>
                  {isEditing ? (
                    <input name="referencia" value={editData.referencia} onChange={handleChange} />
                  ) : (
                    <span>{inmueble.referencia}</span>
                  )}
                </div>
              </div>
              <div className={styles.techItem}>
                <Maximize size={20} className={styles.icon} />
                <div className={styles.techInfo}>
                  <label>Área Terreno</label>
                  {isEditing ? (
                    <input name="areaTerrenoM2" type="number" value={editData.areaTerrenoM2} onChange={handleChange} />
                  ) : (
                    <span>{inmueble.areaTerrenoM2} m²</span>
                  )}
                </div>
              </div>
              <div className={styles.techItem}>
                <Maximize size={20} className={styles.icon} />
                <div className={styles.techInfo}>
                  <label>Área Construida</label>
                  {isEditing ? (
                    <input name="areaConstruidaM2" type="number" value={editData.areaConstruidaM2} onChange={handleChange} />
                  ) : (
                    <span>{inmueble.areaConstruidaM2} m²</span>
                  )}
                </div>
              </div>
              <div className={styles.techItem}>
                <DollarSign size={20} className={styles.icon} />
                <div className={styles.techInfo}>
                  <label>Precio USD/m²</label>
                  <span>{formatCurrency(pricePerM2)} / m²</span>
                </div>
              </div>
              <div className={styles.techItem}>
                <Home size={20} className={styles.icon} />
                <div className={styles.techInfo}>
                  <label>Pisos</label>
                  {isEditing ? (
                    <input name="pisos" type="number" value={editData.pisos} onChange={handleChange} />
                  ) : (
                    <span>{inmueble.pisos}</span>
                  )}
                </div>
              </div>
              <div className={styles.techItem}>
                <DoorOpen size={20} className={styles.icon} />
                <div className={styles.techInfo}>
                  <label>Habitaciones</label>
                  {isEditing ? (
                    <input name="habitaciones" type="number" value={editData.habitaciones} onChange={handleChange} />
                  ) : (
                    <span>{inmueble.habitaciones}</span>
                  )}
                </div>
              </div>
              <div className={styles.techItem}>
                <Bath size={20} className={styles.icon} />
                <div className={styles.techInfo}>
                  <label>Baños</label>
                  {isEditing ? (
                    <input name="banios" type="number" value={editData.banios} onChange={handleChange} />
                  ) : (
                    <span>{inmueble.banios}</span>
                  )}
                </div>
              </div>
              <div className={styles.techItem}>
                <Store size={20} className={styles.icon} />
                <div className={styles.techInfo}>
                  <label>Local Comercial</label>
                  {isEditing ? (
                    <input name="localComercialM2" type="number" value={editData.localComercialM2} onChange={handleChange} />
                  ) : (
                    <span>{inmueble.localComercialM2} m²</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3>Características Especiales</h3>
            <ul className={styles.featureList}>
              {inmueble.caracteristicasEspeciales.map((feature, i) => (
                <li key={i}>
                  <CheckCircle size={18} className={styles.checkIcon} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card">
            <h3>Descripción General</h3>
            {isEditing ? (
              <textarea 
                name="descripcionGeneral" 
                className={styles.textarea}
                value={editData.descripcionGeneral} 
                onChange={handleChange} 
              />
            ) : (
              <p className={styles.description}>{inmueble.descripcionGeneral}</p>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className={styles.col}>
          <div className="card">
            <h3>Distribución por Pisos</h3>
            <div className={styles.floorList}>
              {inmueble.distribucionPisos.map((floor) => (
                <div key={floor.id} className={styles.floorItem}>
                  <div className={styles.floorHeader}>
                    <strong>{floor.piso}</strong>
                    {floor.areaConstruida > 0 && <span>{floor.areaConstruida} m²</span>}
                  </div>
                  <p>{floor.descripcion}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3>Notas del Propietario</h3>
            {isEditing ? (
              <textarea 
                name="notas" 
                className={styles.textarea}
                value={editData.notas} 
                onChange={handleChange} 
              />
            ) : (
              <p className={styles.notes}>{inmueble.notas}</p>
            )}
          </div>

          <div className="card">
            <h3>Usos Ideales</h3>
            <div className={styles.badges}>
              <span className={`${styles.usageBadge} ${styles.blue}`}>Hotel</span>
              <span className={`${styles.usageBadge} ${styles.green}`}>Clínica</span>
              <span className={`${styles.usageBadge} ${styles.purple}`}>Oficinas</span>
              <span className={`${styles.usageBadge} ${styles.orange}`}>Academia</span>
              <span className={`${styles.usageBadge} ${styles.teal}`}>Hospedaje</span>
              <span className={`${styles.usageBadge} ${styles.gold}`}>Renta</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InmueblePage;

const DollarSign = ({ size, className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <line x1="12" y1="1" x2="12" y2="23"></line>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
  </svg>
);
