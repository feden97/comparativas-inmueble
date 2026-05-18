import React, { useState } from 'react';
import { useData } from '../App';
import { formatCurrency } from '../utils/formatters';
import { 
  CreditCard, 
  Globe, 
  Info, 
  TrendingUp, 
  ChevronDown,
  Check
} from 'lucide-react';
import styles from './VentaPage.module.css';

const VentaPage = () => {
  const { data, updateConfig } = useData();
  const { config, inmueble } = data;
  const [salePrice, setSalePrice] = useState(inmueble.precioPublicacion);

  // Peruvian Tax Calculations
  const uit2025 = 5350;
  const uitUsd = uit2025 / config.tipoCambio;
  const alcabalaExempt = 10 * uitUsd;
  const alcabalaBase = Math.max(0, salePrice - alcabalaExempt);
  const alcabala = alcabalaBase * 0.03;

  const capitalGain = Math.max(0, salePrice - config.costoAdquisicion);
  const incomeTax = capitalGain * 0.05;

  const notaryFees = salePrice * 0.0075; // 0.75% avg
  const registrationFees = 40; // Approx fixed

  const sellerTotal = incomeTax + config.honorariosAbogado + registrationFees;
  const buyerTotal = alcabala + notaryFees;
  const netSeller = salePrice - sellerTotal;

  // SWIFT Simulation
  const banks = [
    { name: 'BCP', fee: 20, conv: 0.007, note: 'Líder en Perú, proceso ágil.' },
    { name: 'Interbank', fee: 20, conv: 0.006, note: 'Buen tipo de cambio preferencial.' },
    { name: 'BBVA Perú', fee: 18, conv: 0.005, note: 'Bajas comisiones de recepción.' },
    { name: 'Scotiabank', fee: 25, conv: 0.0075, note: 'Sólida red internacional.' },
    { name: 'Banco Nación', fee: 10, conv: 0.003, note: 'Más económico pero más lento.' }
  ];

  const selectedBankData = banks.find(b => b.name === config.selectedBank) || banks[0];
  const swiftFee = selectedBankData.fee;
  const convFee = netSeller * selectedBankData.conv;
  const totalSwiftCosts = swiftFee + convFee;
  const finalNetUsd = netSeller - totalSwiftCosts;
  const finalNetPen = finalNetUsd * config.tipoCambio;

  return (
    <div className="container">
      <h2>Venta & Costos</h2>

      <div className="grid-2">
        {/* Left: Peruvian Taxes */}
        <div className={styles.col}>
          <div className="card">
            <div className={styles.cardHeader}>
              <CreditCard size={20} />
              <h3>Resumen Financiero (Perú)</h3>
            </div>
            
            <div className={styles.inputGroup}>
              <label>Precio de Venta (USD)</label>
              <input 
                type="number" 
                value={salePrice} 
                onChange={(e) => setSalePrice(Number(e.target.value))}
                className={styles.mainInput}
              />
            </div>

            <div className={styles.costTable}>
              <div className={styles.costItem}>
                <div>
                  <strong>Alcabala</strong>
                  <p>3% sobre base (Venta - 10 UIT)</p>
                </div>
                <div className={styles.costVal}>
                  <span>{formatCurrency(alcabala)}</span>
                  <small>Paga COMPRADOR</small>
                </div>
              </div>

              <div className={styles.costItem}>
                <div className={styles.editableField}>
                  <strong>Impuesto a la Renta (5%)</strong>
                  <div className={styles.subInput}>
                    Costo adquisición: 
                    <input 
                      type="number" 
                      value={config.costoAdquisicion} 
                      onChange={(e) => updateConfig({ costoAdquisicion: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className={styles.costVal}>
                  <span>{formatCurrency(incomeTax)}</span>
                  <small>Paga VENDEDOR</small>
                </div>
              </div>

              <div className={styles.costItem}>
                <div>
                  <strong>Gastos Notariales y Reg.</strong>
                  <p>Est. 0.75% + S/. 150</p>
                </div>
                <div className={styles.costVal}>
                  <span>{formatCurrency(notaryFees + registrationFees)}</span>
                  <small>Negociable</small>
                </div>
              </div>

              <div className={styles.costItem}>
                <div className={styles.editableField}>
                  <strong>Honorarios Abogado</strong>
                  <input 
                    type="number" 
                    value={config.honorariosAbogado} 
                    onChange={(e) => updateConfig({ honorariosAbogado: Number(e.target.value) })}
                  />
                </div>
                <div className={styles.costVal}>
                  <span>{formatCurrency(config.honorariosAbogado)}</span>
                  <small>Paga VENDEDOR</small>
                </div>
              </div>
            </div>

            <div className={styles.summaryBox}>
              <div className={styles.summaryItem}>
                <label>Total Gastos Vendedor</label>
                <span>{formatCurrency(sellerTotal)}</span>
              </div>
              <div className={styles.summaryItem}>
                <label>Total Gastos Comprador</label>
                <span>{formatCurrency(buyerTotal)}</span>
              </div>
              <div className={`${styles.summaryItem} ${styles.net}`}>
                <label>NETO ESTIMADO VENDEDOR</label>
                <span>{formatCurrency(netSeller)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: SWIFT Simulator */}
        <div className={styles.col}>
          <div className="card">
            <div className={styles.cardHeader}>
              <Globe size={20} />
              <h3>Simulador Transferencia SWIFT</h3>
            </div>
            
            <div className={styles.swiftConfig}>
              <div className={styles.inputGroup}>
                <label>Monto a recibir (Neto)</label>
                <div className={styles.staticVal}>{formatCurrency(netSeller)}</div>
              </div>
              <div className={styles.inputGroup}>
                <label>Tipo de Cambio USD/PEN</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={config.tipoCambio} 
                  onChange={(e) => updateConfig({ tipoCambio: Number(e.target.value) })}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Banco Receptor en Perú</label>
                <select 
                  value={config.selectedBank} 
                  onChange={(e) => updateConfig({ selectedBank: e.target.value })}
                >
                  {banks.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                </select>
              </div>
            </div>

            <div className={styles.bankDetail}>
              <div className={styles.bankNote}>
                <Info size={16} /> {selectedBankData.note}
              </div>
              <div className={styles.swiftRow}>
                <span>Comisión Fija SWIFT</span>
                <span>{formatCurrency(swiftFee)}</span>
              </div>
              <div className={styles.swiftRow}>
                <span>Comisión de Conversión Est.</span>
                <span>{formatCurrency(convFee)}</span>
              </div>
              <div className={`${styles.swiftRow} ${styles.totalSwift}`}>
                <span>Total Costos Bancarios</span>
                <span>{formatCurrency(totalSwiftCosts)}</span>
              </div>
            </div>

            <div className={styles.finalNetBox}>
              <div className={styles.finalUsd}>
                <label>Recibes Neto en USD</label>
                <strong>{formatCurrency(finalNetUsd)}</strong>
              </div>
              <div className={styles.finalPen}>
                <label>Equivalente en Soles (S/.)</label>
                <strong>S/. {new Intl.NumberFormat('es-PE').format(finalNetPen)}</strong>
              </div>
            </div>

            <div className={styles.comparisonTable}>
              <h4>Comparativa Bancaria</h4>
              <table>
                <thead>
                  <tr>
                    <th>Banco</th>
                    <th>Costo Total</th>
                    <th>Neto Recibido</th>
                  </tr>
                </thead>
                <tbody>
                  {banks.map(bank => {
                    const cSwift = bank.fee + (netSeller * bank.conv);
                    const isBest = bank.name === 'Banco Nación'; // Example logic
                    return (
                      <tr key={bank.name} className={bank.name === config.selectedBank ? styles.selectedRow : ''}>
                        <td>{bank.name}</td>
                        <td>{formatCurrency(cSwift)}</td>
                        <td className={styles.bold}>{formatCurrency(netSeller - cSwift)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VentaPage;
