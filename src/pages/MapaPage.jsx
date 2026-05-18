import React, { useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useData } from '../App';
import { formatCurrency, calculatePricePerM2 } from '../utils/formatters';
import { ExternalLink, Map as MapIcon, Filter } from 'lucide-react';
import styles from './MapaPage.module.css';

// Fix for default marker icons in Leaflet + React
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

const ownIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const compIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const soldIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #ef4444; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); font-family: 'Inter', sans-serif;">X</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14]
});

const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  map.setView(center, zoom);
  return null;
};

const MapaPage = () => {
  const { data, updateInmueble, updateComparables } = useData();
  const { comparables, inmueble } = data;
  const [filterActive, setFilterActive] = useState(false);
  const [mapState, setMapState] = useState({ center: [inmueble.coordenadas.lat, inmueble.coordenadas.lng], zoom: 15 });
  const mapRef = useRef();
  const markerRefs = useRef({});

  const [mapType, setMapType] = useState('streets'); // 'streets' or 'satellite'

  const filteredComparables = useMemo(() => {
    return filterActive ? comparables.filter(c => c.activa) : comparables;
  }, [comparables, filterActive]);

  const handleFlyTo = (coords, id) => {
    setMapState({ center: [coords.lat, coords.lng], zoom: 18 });
    if (markerRefs.current[id]) {
      markerRefs.current[id].openPopup();
    }
  };

  const handleDragOwn = (e) => {
    const marker = e.target;
    const position = marker.getLatLng();
    updateInmueble({ coordenadas: { lat: position.lat, lng: position.lng } });
  };

  const handleDragComp = (e, id) => {
    const marker = e.target;
    const position = marker.getLatLng();
    const newComparables = comparables.map(c => 
      c.id === id ? { ...c, coordenadas: { lat: position.lat, lng: position.lng } } : c
    );
    updateComparables(newComparables);
  };

  return (
    <div className={styles.mapPageWrapper}>
      <div className={styles.header}>
        <h2>Mapa de Ubicación</h2>
        <div className={styles.mapControls}>
          <div className={styles.typeSelector}>
            <button 
              className={mapType === 'streets' ? styles.activeType : ''} 
              onClick={() => setMapType('streets')}
            >
              Mapa
            </button>
            <button 
              className={mapType === 'satellite' ? styles.activeType : ''} 
              onClick={() => setMapType('satellite')}
            >
              Satélite
            </button>
          </div>
          <button 
            className={`${styles.filterBtn} ${filterActive ? styles.active : ''}`}
            onClick={() => setFilterActive(!filterActive)}
          >
            <Filter size={16} /> {filterActive ? 'Activos' : 'Todos'}
          </button>
        </div>
      </div>

      <div className={styles.mainLayout}>
        <div className={styles.mapContainer}>
          <MapContainer 
            center={mapState.center} 
            zoom={mapState.zoom} 
            className={styles.leafletContainer}
            ref={mapRef}
          >
            {mapType === 'streets' ? (
              <TileLayer
                attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              />
            ) : (
              <TileLayer
                attribution='&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
            )}
            <ChangeView center={mapState.center} zoom={mapState.zoom} />
            
            {/* Own Property */}
            <Marker 
              position={[inmueble.coordenadas.lat, inmueble.coordenadas.lng]} 
              icon={ownIcon}
              draggable={true}
              eventHandlers={{ dragend: handleDragOwn }}
              ref={el => markerRefs.current['own'] = el}
            >
              <Popup>
                <div className={styles.popupContent}>
                  <h4>{inmueble.direccion}</h4>
                  <div className={styles.popupPrice}>{formatCurrency(inmueble.precioPublicacion)}</div>
                  <p>{inmueble.areaConstruidaM2} m² construidos</p>
                  <p><strong>Propiedad Principal</strong></p>
                  <p className={styles.dragHint}>📍 Arrastrá el pin para ajustar ubicación</p>
                  <div className={styles.popupActions}>
                    <a 
                      href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${inmueble.coordenadas.lat},${inmueble.coordenadas.lng}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className={styles.popupLinkStreet}
                    >
                      Ver Street View 
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>

            {/* Comparables */}
            {filteredComparables.map(comp => comp.coordenadas && (
              <Marker 
                key={comp.id} 
                position={[comp.coordenadas.lat, comp.coordenadas.lng]} 
                icon={comp.activa ? compIcon : soldIcon}
                draggable={comp.activa}
                eventHandlers={{ dragend: (e) => handleDragComp(e, comp.id) }}
                ref={el => markerRefs.current[comp.id] = el}
              >
                <Popup>
                  <div className={styles.popupContent}>
                    <h4>
                      {comp.nombre}
                      {comp.estado && (
                        <span className={`${styles.statusBadge} ${styles.statusSold}`}>{comp.estado}</span>
                      )}
                    </h4>
                    <div className={styles.popupPrice}>
                      {comp.precioAnterior && (
                        <span className={styles.oldPrice}>{formatCurrency(comp.precioAnterior)}</span>
                      )}
                      {formatCurrency(comp.precio)}
                    </div>
                    <p>{comp.areaConstruidaM2} m² construidos</p>
                    <p className={styles.popupM2}>{formatCurrency(calculatePricePerM2(comp.precio, comp.areaConstruidaM2))}/m²</p>
                    {comp.activa && <p className={styles.dragHint}>📍 Arrastrá el pin para ajustar ubicación</p>}
                    <div className={styles.popupActions}>
                      <a 
                        href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${comp.coordenadas.lat},${comp.coordenadas.lng}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className={styles.popupLinkStreet}
                      >
                        Ver Street View
                      </a>
                      <a href={comp.link} target="_blank" rel="noopener noreferrer" className={styles.popupLink}>
                        Ver publicación <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
          
          <div className={styles.legend}>
            <div className={styles.legendItem}><span className={styles.dotGold}></span> Propiedad</div>
            <div className={styles.legendItem}><span className={styles.dotBlue}></span> Comparable Activo</div>
            <div className={styles.legendItem}><span className={styles.dotRed}></span> No disponible / Vendida</div>
          </div>
        </div>

        <aside className={styles.mapSidebar}>
          <h3>Listado de Puntos</h3>
          <div className={styles.pointsList}>
            <div 
              className={`${styles.pointItem} ${styles.ownPoint}`}
              onClick={() => handleFlyTo(inmueble.coordenadas, 'own')}
            >
              <div className={styles.pointHeader}>
                <strong>Mi Inmueble</strong>
                <span>{formatCurrency(inmueble.precioPublicacion)}</span>
              </div>
              <div className={styles.pointSub}>{formatCurrency(calculatePricePerM2(inmueble.precioPublicacion, inmueble.areaConstruidaM2))}/m²</div>
            </div>

            {filteredComparables.map((comp, idx) => (
              <div 
                key={comp.id} 
                className={`${styles.pointItem} ${!comp.activa ? styles.soldPoint : ''}`}
                onClick={() => comp.coordenadas && handleFlyTo(comp.coordenadas, comp.id)}
              >
                <div className={styles.pointHeader}>
                  <strong>{idx + 1}. {comp.nombre}</strong>
                  <span>{formatCurrency(comp.precio)}</span>
                </div>
                <div className={styles.pointSub}>
                  {formatCurrency(calculatePricePerM2(comp.precio, comp.areaConstruidaM2))}/m²
                  {!comp.activa && comp.estado && <span className={`${styles.statusBadge} ${styles.statusSold}`} style={{ marginLeft: '4px' }}>{comp.estado}</span>}
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default MapaPage;
