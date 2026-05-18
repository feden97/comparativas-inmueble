import { useState, useEffect } from 'react';
import { initialInmuebleData, initialComparables, initialDocumentos, initialActividad, DATA_VERSION } from '../utils/initialData';

const APP_KEY = 'inmueble_app_data';
const INITIALIZED_KEY = 'inmueble_app_initialized';
const VERSION_KEY = 'inmueble_app_version';

export const useDataManager = () => {
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem(APP_KEY);
    const savedVersion = localStorage.getItem(VERSION_KEY);
    
    if (saved && savedVersion && parseInt(savedVersion) >= DATA_VERSION) {
      return JSON.parse(saved);
    }
    
    // Si no hay datos o la versión es antigua, inicializar o migrar
    const initialData = {
      inmueble: initialInmuebleData,
      comparables: initialComparables,
      documentos: initialDocumentos,
      actividad: initialActividad,
      config: {
        costoAdquisicion: 150000,
        honorariosAbogado: 500,
        tipoCambio: 3.75,
        selectedBank: 'BCP'
      }
    };
    
    // Si había datos guardados pero la versión era vieja, podríamos querer mezclar
    // Pero para asegurar que el usuario vea los cambios que hice en initialData:
    localStorage.setItem(VERSION_KEY, DATA_VERSION.toString());
    return initialData;
  });

  useEffect(() => {
    localStorage.setItem(APP_KEY, JSON.stringify(data));
    localStorage.setItem(INITIALIZED_KEY, 'true');
    localStorage.setItem(VERSION_KEY, DATA_VERSION.toString());
  }, [data]);

  const updateInmueble = (newData) => {
    setData(prev => ({
      ...prev,
      inmueble: { ...prev.inmueble, ...newData, ultimaActualizacion: new Date().toISOString().split('T')[0] }
    }));
  };

  const updateComparables = (newComparables) => {
    setData(prev => ({ ...prev, comparables: newComparables }));
  };

  const addComparable = (comp) => {
    setData(prev => ({
      ...prev,
      comparables: [...prev.comparables, { ...comp, id: Date.now() }]
    }));
  };

  const deleteComparable = (id) => {
    setData(prev => ({
      ...prev,
      comparables: prev.comparables.filter(c => c.id !== id)
    }));
  };

  const updateDocumentos = (newDocs) => {
    setData(prev => ({ ...prev, documentos: newDocs }));
  };

  const addActividad = (event) => {
    setData(prev => ({
      ...prev,
      actividad: [{ ...event, id: Date.now() }, ...prev.actividad]
    }));
  };

  const updateConfig = (newConfig) => {
    setData(prev => ({ ...prev, config: { ...prev.config, ...newConfig } }));
  };

  const resetData = () => {
    if (window.confirm('¿Estás seguro de que deseas restablecer todos los datos? Se perderán los cambios manuales.')) {
      const newData = {
        inmueble: initialInmuebleData,
        comparables: initialComparables,
        documentos: initialDocumentos,
        actividad: initialActividad,
        config: {
          costoAdquisicion: 150000,
          honorariosAbogado: 500,
          tipoCambio: 3.75,
          selectedBank: 'BCP'
        }
      };
      setData(newData);
      localStorage.setItem(APP_KEY, JSON.stringify(newData));
    }
  };

  return {
    data,
    updateInmueble,
    updateComparables,
    addComparable,
    deleteComparable,
    updateDocumentos,
    addActividad,
    updateConfig,
    resetData
  };
};
