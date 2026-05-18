import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { useData } from '../App';
import { formatCurrency, calculatePricePerM2 } from '../utils/formatters';
import { ExternalLink, Filter } from 'lucide-react';
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

// Numbered circle icon factory
const createNumberedIcon = (number, color, textColor = 'white') => {
  return new L.DivIcon({
    className: 'custom-numbered-icon',
    html: `<div style="
      background-color: ${color}; 
      color: ${textColor}; 
      width: 32px; 
      height: 32px; 
      border-radius: 50%; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      font-weight: 800; 
      font-size: 14px;
      border: 3px solid white; 
      box-shadow: 0 2px 8px rgba(0,0,0,0.35); 
      font-family: 'Inter', sans-serif;
    ">${number}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

// Own property icon — Google Maps-style red pin
const ownIcon = new L.DivIcon({
  className: 'custom-numbered-icon',
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 384 512" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));">
    <path fill="#EA4335" d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67a24 24 0 0 1-39.464 0z"/>
    <circle cx="192" cy="192" r="70" fill="white"/>
  </svg>`,
  iconSize: [40, 48],
  iconAnchor: [20, 48],
  popupAnchor: [0, -44]
});

const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  map.setView(center, zoom);
  return null;
};

// Two-finger gesture handler for mobile
const GestureHandler = () => {
  const map = useMap();
  const overlayRef = useRef(null);
  const timerRef = useRef(null);

  const isMobile = useCallback(() => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }, []);

  useEffect(() => {
    if (!isMobile()) return;

    // Disable one-finger drag
    map.dragging.disable();

    // Create overlay element
    const overlay = document.createElement('div');
    overlay.className = 'gesture-overlay';
    overlay.innerHTML = '<span>Usá dos dedos para mover el mapa</span>';
    overlay.style.cssText = `
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.45); display: flex; align-items: center;
      justify-content: center; z-index: 999; pointer-events: none;
      opacity: 0; transition: opacity 0.3s;
    `;
    overlay.querySelector('span').style.cssText = `
      color: white; font-size: 14px; font-weight: 600;
      background: rgba(0,0,0,0.6); padding: 10px 20px;
      border-radius: 24px; font-family: 'Inter', sans-serif;
    `;
    map.getContainer().appendChild(overlay);
    overlayRef.current = overlay;

    const showOverlay = () => {
      overlay.style.opacity = '1';
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => { overlay.style.opacity = '0'; }, 1200);
    };

    const onTouchStart = (e) => {
      if (e.touches.length === 1) {
        map.dragging.disable();
      } else if (e.touches.length >= 2) {
        map.dragging.enable();
      }
    };

    const onTouchMove = (e) => {
      if (e.touches.length === 1) {
        showOverlay();
      }
    };

    const onTouchEnd = () => {
      map.dragging.disable();
    };

    const container = map.getContainer();
    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: true });
    container.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      if (overlayRef.current) overlayRef.current.remove();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [map, isMobile]);

  return null;
};

const MapaPage = () => {
  const { data, updateInmueble, updateComparables } = useData();
  const { comparables, inmueble } = data;
  const [filterActive, setFilterActive] = useState(false);
  const [mapState, setMapState] = useState({ center: [inmueble.coordenadas.lat, inmueble.coordenadas.lng], zoom: 14 });
  const mapRef = useRef();
  const markerRefs = useRef({});

  const [mapType, setMapType] = useState('streets');

  const filteredComparables = useMemo(() => {
    return filterActive ? comparables.filter(c => c.activa) : comparables;
  }, [comparables, filterActive]);

  // Build display numbers: active = 1,2,3,4  inactive = "X"  referencia = "!"
  const displayNumbersMap = useMemo(() => {
    const map = {};
    let activeCount = 0;
    comparables.forEach(c => {
      if (c.activa) {
        map[c.id] = ++activeCount;
      } else if (c.estado === 'Referencia') {
        map[c.id] = '!';
      } else {
        map[c.id] = 'X';
      }
    });
    return map;
  }, [comparables]);

  // Only comparables with coordinates for the map
  const mappableComparables = useMemo(() => {
    return filteredComparables.filter(c => c.coordenadas);
  }, [filteredComparables]);

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
            zoomControl={false}
          >
            <ZoomControl position="topright" />
            <GestureHandler />
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
                  <h4>★ Mi Inmueble</h4>
                  <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '4px' }}>{inmueble.direccion}</p>
                  <div className={styles.popupPrice}>{formatCurrency(inmueble.precioPublicacion)}</div>
                  <p>{inmueble.areaConstruidaM2} m² construidos</p>
                  <p className={styles.popupM2}>{formatCurrency(calculatePricePerM2(inmueble.precioPublicacion, inmueble.areaConstruidaM2))}/m²</p>
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

            {/* Comparables with numbered icons */}
            {mappableComparables.map((comp) => {
              const pubLabel = displayNumbersMap[comp.id];
              const iconColor = comp.activa ? '#1e3a5f' : comp.estado === 'Referencia' ? '#f59e0b' : '#ef4444';
              const icon = createNumberedIcon(pubLabel, iconColor);

              return (
                <Marker 
                  key={comp.id} 
                  position={[comp.coordenadas.lat, comp.coordenadas.lng]} 
                  icon={icon}
                  draggable={comp.activa}
                  eventHandlers={{ dragend: (e) => handleDragComp(e, comp.id) }}
                  ref={el => markerRefs.current[comp.id] = el}
                >
                  <Popup>
                    <div className={styles.popupContent}>
                      <h4>
                        <span className={styles.pubNumber}>{comp.activa ? `Pub. ${pubLabel}` : pubLabel}</span>
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
                      <p>{comp.areaConstruidaM2 ? `${comp.areaConstruidaM2} m² construidos` : 'Área no especificada'}</p>
                      {comp.areaConstruidaM2 && (
                        <p className={styles.popupM2}>{formatCurrency(calculatePricePerM2(comp.precio, comp.areaConstruidaM2))}/m²</p>
                      )}
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
              );
            })}
          </MapContainer>
          
          <div className={styles.legend}>
            <div className={styles.legendItem}><span className={styles.dotPin}><svg xmlns="http://www.w3.org/2000/svg" width="14" height="18" viewBox="0 0 384 512"><path fill="#EA4335" d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67a24 24 0 0 1-39.464 0z"/><circle cx="192" cy="192" r="70" fill="white"/></svg></span> Mi Inmueble</div>
            <div className={styles.legendItem}><span className={styles.dotBlue}>1</span> Comparable Activo</div>
            <div className={styles.legendItem}><span className={styles.dotRed}>X</span> No disponible / Vendida</div>
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
                <strong>★ Mi Inmueble</strong>
                <span>{formatCurrency(inmueble.precioPublicacion)}</span>
              </div>
              <div className={styles.pointSub}>{formatCurrency(calculatePricePerM2(inmueble.precioPublicacion, inmueble.areaConstruidaM2))}/m²</div>
            </div>

            {filteredComparables.map((comp) => {
              const hasCoordenadas = !!comp.coordenadas;
              const pubLabel = displayNumbersMap[comp.id];
              return (
                <div 
                  key={comp.id} 
                  className={`${styles.pointItem} ${!comp.activa ? styles.soldPoint : ''} ${!hasCoordenadas ? styles.noMapPoint : ''}`}
                  onClick={() => hasCoordenadas && handleFlyTo(comp.coordenadas, comp.id)}
                  style={{ cursor: hasCoordenadas ? 'pointer' : 'default' }}
                >
                  <div className={styles.pointHeader}>
                    <strong>
                      <span className={styles.pointNumber}>{pubLabel}</span>
                      {comp.nombre}
                    </strong>
                    <span>{formatCurrency(comp.precio)}</span>
                  </div>
                  <div className={styles.pointSub}>
                    {comp.areaConstruidaM2 
                      ? `${formatCurrency(calculatePricePerM2(comp.precio, comp.areaConstruidaM2))}/m²`
                      : 'Sin dato m²'
                    }
                    {!comp.activa && comp.estado && <span className={`${styles.statusBadge} ${styles.statusSold}`} style={{ marginLeft: '4px' }}>{comp.estado}</span>}
                    {!hasCoordenadas && <span className={styles.noMapBadge}>Sin ubicación</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default MapaPage;
