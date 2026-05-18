import React, { createContext, useContext } from 'react';
import { HashRouter, Routes, Route, NavLink } from 'react-router-dom';
import { 
  BarChart2, 
  Map as MapIcon
} from 'lucide-react';
import { useDataManager } from './hooks/useDataManager';

import MercadoPage from './pages/MercadoPage';
import MapaPage from './pages/MapaPage';

import styles from './App.module.css';

const DataContext = createContext();
export const useData = () => useContext(DataContext);

const Header = () => {
  return (
    <header className={styles.header}>
      <h1>Comparativas Inmueble</h1>
      <span className={styles.headerSub}>Gregorio Albarracín · Tacna</span>
    </header>
  );
};

const Sidebar = () => {
  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav}>
        <NavLink to="/" className={({ isActive }) => isActive ? styles.activeLink : styles.link}>
          <BarChart2 size={20} /> <span>Mercado</span>
        </NavLink>
        <NavLink to="/mapa" className={({ isActive }) => isActive ? styles.activeLink : styles.link}>
          <MapIcon size={20} /> <span>Mapa</span>
        </NavLink>
      </nav>
    </aside>
  );
};

const TabBar = () => {
  return (
    <div className={styles.tabBarWrapper}>
      <nav className={styles.tabBar}>
        <NavLink to="/" end className={({ isActive }) => isActive ? styles.tabActive : styles.tabLink}>
          <BarChart2 size={22} /> <span>Mercado</span>
        </NavLink>
        <NavLink to="/mapa" className={({ isActive }) => isActive ? styles.tabActive : styles.tabLink}>
          <MapIcon size={22} /> <span>Mapa</span>
        </NavLink>
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
                <Route path="/" element={<MercadoPage />} />
                <Route path="/mapa" element={<MapaPage />} />
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
