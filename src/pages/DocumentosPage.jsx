import React from 'react';
import { useData } from '../App';
import { 
  CheckCircle2, 
  Circle, 
  RotateCcw, 
  FileText,
  Clock
} from 'lucide-react';
import styles from './DocumentosPage.module.css';

const DocumentosPage = () => {
  const { data, updateDocumentos, updateInmueble } = useData();
  const { documentos, inmueble } = data;

  const total = documentos.length;
  const ready = documentos.filter(d => d.listo).length;
  const progress = (ready / total) * 100;

  const toggleDoc = (id) => {
    const newDocs = documentos.map(doc => {
      if (doc.id === id) {
        return { 
          ...doc, 
          listo: !doc.listo, 
          fecha: !doc.listo ? new Date().toLocaleString('es-PE') : null 
        };
      }
      return doc;
    });
    updateDocumentos(newDocs);
  };

  const handleReset = () => {
    if (confirm("¿Estás seguro de resetear el checklist?")) {
      const resetDocs = documentos.map(doc => ({ ...doc, listo: false, fecha: null }));
      updateDocumentos(resetDocs);
    }
  };

  const groupedDocs = {
    Vendedor: documentos.filter(d => d.responsable === 'Vendedor'),
    Notaría: documentos.filter(d => d.responsable === 'Notaría'),
    Comprador: documentos.filter(d => d.responsable === 'Comprador')
  };

  return (
    <div className="container">
      <div className={styles.header}>
        <h2>Documentos para la Venta</h2>
        <button className={styles.resetBtn} onClick={handleReset}>
          <RotateCcw size={16} /> Resetear checklist
        </button>
      </div>

      <div className="card">
        <div className={styles.progressHeader}>
          <h3>Progreso de Documentación</h3>
          <span>{ready} de {total} listos</span>
        </div>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      <div className="grid-2">
        <div className={styles.col}>
          {Object.entries(groupedDocs).map(([group, docs]) => (
            <div key={group} className="card">
              <h3 className={styles.groupTitle}>Documentos del {group}</h3>
              <div className={styles.docList}>
                {docs.map(doc => (
                  <div 
                    key={doc.id} 
                    className={`${styles.docItem} ${doc.listo ? styles.ready : ''}`}
                    onClick={() => toggleDoc(doc.id)}
                  >
                    <div className={styles.checkIcon}>
                      {doc.listo ? <CheckCircle2 size={24} color="#16a34a" /> : <Circle size={24} color="#d1d5db" />}
                    </div>
                    <div className={styles.docInfo}>
                      <strong>{doc.nombre}</strong>
                      <p>{doc.descripcion}</p>
                      {doc.fecha && (
                        <div className={styles.timestamp}>
                          <Clock size={12} /> Listo el {doc.fecha}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.col}>
          <div className="card">
            <div className={styles.cardHeader}>
              <FileText size={20} />
              <h3>Notas de Documentos</h3>
            </div>
            <textarea 
              className={styles.textarea}
              placeholder="Ej: Contacto de la notaría, números de partida, observaciones..."
              value={inmueble.notasDocumentos || ''}
              onChange={(e) => updateInmueble({ notasDocumentos: e.target.value })}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentosPage;
