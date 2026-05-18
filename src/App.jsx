import React, { createContext, useContext } from 'react';
import { HashRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  BarChart2, 
  Map as MapIcon, 
  DollarSign, 
  FileText, 
  Activity, 
  Menu,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react';
import { useDataManager } from './hooks/useDataManager';
import { formatCurrency } from './utils/formatters';

// Pages (will create these next)
import InmueblePage from './pages/InmueblePage';
import MercadoPage from './pages/MercadoPage';
import MapaPage from './pages/MapaPage';
import AnalisisPage from './pages/AnalisisPage';
import VentaPage from './pages/VentaPage';
import DocumentosPage from './pages/DocumentosPage';
import ActividadPage from './pages/ActividadPage';

import styles from './App.module.css';

const DataContext = createContext();
export const useData = () => useContext(DataContext);

const Header = () => {
  const { data, updateInmueble } = useData();
  const { inmueble } = data;

  const getStatusClass = (status) => {
    switch (status) {
      case 'Activo': return styles.statusActive;
      case 'En negociación': return styles.statusNeg;
      case 'Vendido': return styles.statusSold;
      default: return '';
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <h1>Inmueble Gregorio Albarracín</h1>
      </div>
      <div className={styles.headerRight}>
        <span className={styles.headerPrice}>{formatCurrency(inmueble.precioPublicacion)}</span>
        <select 
          className={`${styles.statusSelect} ${getStatusClass(inmueble.estadoVenta)}`}
          value={inmueble.estadoVenta}
          onChange={(e) => updateInmueble({ estadoVenta: e.target.value })}
        >
          <option value="Activo">Activo</option>
          <option value="En negociación">En negociación</option>
          <option value="Vendido">Vendido</option>
        </select>
      </div>
    </header>
  );
};

const Sidebar = () => {
  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav}>
        <NavLink to="/" className={({ isActive }) => isActive ? styles.activeLink : styles.link}>
          <Home size={20} /> <span>Inmueble</span>
        </NavLink>
        <NavLink to="/mercado" className={({ isActive }) => isActive ? styles.activeLink : styles.link}>
          <BarChart2 size={20} /> <span>Mercado</span>
        </NavLink>
        <NavLink to="/mapa" className={({ isActive }) => isActive ? styles.activeLink : styles.link}>
          <MapIcon size={20} /> <span>Mapa</span>
        </NavLink>
        <NavLink to="/analisis" className={({ isActive }) => isActive ? styles.activeLink : styles.link}>
          <DollarSign size={20} /> <span>Análisis</span>
        </NavLink>
        <NavLink to="/venta" className={({ isActive }) => isActive ? styles.activeLink : styles.link}>
          <DollarSign size={20} /> <span>Venta & Costos</span>
        </NavLink>
        <NavLink to="/documentos" className={({ isActive }) => isActive ? styles.activeLink : styles.link}>
          <FileText size={20} /> <span>Documentos</span>
        </NavLink>
        <NavLink to="/actividad" className={({ isActive }) => isActive ? styles.activeLink : styles.link}>
          <Activity size={20} /> <span>Actividad</span>
        </NavLink>
      </nav>
    </aside>
  );
};

const TabBar = () => {
  const [showMore, setShowMore] = React.useState(false);

  return (
    <div className={styles.tabBarWrapper}>
      {showMore && (
        <div className={styles.moreMenu}>
          <NavLink to="/analisis" onClick={() => setShowMore(false)} className={styles.tabLink}>
            <DollarSign size={20} /> <span>Análisis</span>
          </NavLink>
          <NavLink to="/documentos" onClick={() => setShowMore(false)} className={styles.tabLink}>
            <FileText size={20} /> <span>Documentos</span>
          </NavLink>
          <NavLink to="/actividad" onClick={() => setShowMore(false)} className={styles.tabLink}>
            <Activity size={20} /> <span>Actividad</span>
          </NavLink>
        </div>
      )}
      <nav className={styles.tabBar}>
        <NavLink to="/" className={({ isActive }) => isActive ? styles.tabActive : styles.tabLink}>
          <Home size={24} /> <span>Inmueble</span>
        </NavLink>
        <NavLink to="/mercado" className={({ isActive }) => isActive ? styles.tabActive : styles.tabLink}>
          <BarChart2 size={24} /> <span>Mercado</span>
        </NavLink>
        <NavLink to="/mapa" className={({ isActive }) => isActive ? styles.tabActive : styles.tabLink}>
          <MapIcon size={24} /> <span>Mapa</span>
        </NavLink>
        <NavLink to="/venta" className={({ isActive }) => isActive ? styles.tabActive : styles.tabLink}>
          <DollarSign size={24} /> <span>Venta</span>
        </NavLink>
        <button className={styles.tabLink} onClick={() => setShowMore(!showMore)}>
          <MoreHorizontal size={24} /> <span>Más</span>
        </button>
      </nav>
    </div>
  );
};

function App() {
  const dataManager = useDataManager();

  return (
    <DataContext.Provider value={dataManager}>
      <HashRouter>
        <div className={styles.appContainer}>
          <Header />
          <div className={styles.mainWrapper}>
            <Sidebar />
            <main className={styles.content}>
              <Routes>
                <Route path="/" element={<InmueblePage />} />
                <Route path="/mercado" element={<MercadoPage />} />
                <Route path="/mapa" element={<MapaPage />} />
                <Route path="/analisis" element={<AnalisisPage />} />
                <Route path="/venta" element={<VentaPage />} />
                <Route path="/documentos" element={<DocumentosPage />} />
                <Route path="/actividad" element={<ActividadPage />} />
              </Routes>
            </main>
          </div>
          <TabBar />
        </div>
      </HashRouter>
    </DataContext.Provider>
  );
}

export default App;
