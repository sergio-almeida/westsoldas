
import { CompanyInfo, Client, Machine, Quote, ServiceOrder } from '../types';

export const printDocument = (
  title: string, 
  company: CompanyInfo, 
  client: Client, 
  machine: Machine, 
  data: Quote | ServiceOrder
) => {
  const financial = (data as any).financial || { 
    total: (data as any).totalPrice || 0,
    serviceValue: (data as any).services?.reduce((acc: number, s: any) => acc + s.price, 0) || 0,
    partsValue: (data as any).partsPrice || 0,
    discount: 0,
    remainingValue: 0
  };
  
  const services = (data as any).services || [];
  const isOS = 'status' in data && !['Aguardando aprovação', 'Em análise', 'Aprovado', 'Reprovado'].includes(data.status as any);

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html lang="pt-br">
    <head>
      <meta charset="UTF-8">
      <title>${title} - ${data.id}</title>
      <style>
        @page { size: A4; margin: 15mm; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; line-height: 1.5; margin: 0; padding: 0; background: #fff; }
        .container { max-width: 800px; margin: 0 auto; }
        
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
        .company-brand { display: flex; align-items: center; gap: 15px; }
        .logo-img { height: 70px; width: auto; object-fit: contain; }
        .company-info h1 { margin: 0; color: #2563eb; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.5px; }
        .company-info p { margin: 2px 0; font-size: 11px; color: #64748b; font-weight: 500; }
        
        .doc-meta { text-align: right; }
        .doc-meta h2 { margin: 0; color: #1e293b; font-size: 20px; font-weight: 800; }
        .doc-meta .id { color: #2563eb; font-family: monospace; font-size: 16px; font-weight: bold; }
        .doc-meta .date { font-size: 12px; color: #94a3b8; margin-top: 5px; font-weight: bold; }

        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
        .card { background: #f8fafc; padding: 15px; rounded: 12px; border: 1px solid #e2e8f0; }
        .section-title { font-size: 10px; font-weight: 900; text-transform: uppercase; color: #3b82f6; letter-spacing: 1px; margin-bottom: 10px; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; }
        
        .info-row { margin-bottom: 6px; display: flex; flex-direction: column; }
        .info-label { font-size: 9px; color: #94a3b8; text-transform: uppercase; font-weight: 800; }
        .info-value { font-size: 13px; font-weight: 600; color: #334155; }

        .details-section { margin-bottom: 30px; }
        .description-box { background: #fff; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; font-size: 12px; min-height: 60px; white-space: pre-wrap; color: #475569; }

        table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px; }
        th { background: #f1f5f9; text-align: left; padding: 12px; color: #475569; font-weight: 800; text-transform: uppercase; font-size: 10px; border-bottom: 2px solid #e2e8f0; }
        td { padding: 12px; border-bottom: 1px solid #f1f5f9; color: #334155; }
        
        .financial-summary { margin-left: auto; width: 300px; margin-top: 20px; }
        .fin-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #e2e8f0; font-size: 12px; }
        .fin-row.total { border-bottom: none; border-top: 2px solid #1e293b; margin-top: 10px; padding-top: 15px; font-weight: 900; font-size: 18px; color: #2563eb; }
        
        .footer { margin-top: 60px; }
        .signatures { display: flex; justify-content: space-between; gap: 50px; }
        .sig-box { flex: 1; border-top: 1px solid #334155; text-align: center; padding-top: 10px; font-size: 11px; font-weight: bold; color: #64748b; margin-top: 40px; }
        
        .terms { margin-top: 40px; font-size: 10px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 15px; text-align: center; }

        @media print {
          .no-print { display: none !important; }
          body { padding: 0; }
          .card { border: 1px solid #ddd; background: #fff !important; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="company-brand">
            ${company.logo ? `<img src="${company.logo}" class="logo-img">` : ''}
            <div class="company-info">
              <h1>${company.name}</h1>
              <p><i class="fas fa-id-card"></i> ${company.document}</p>
              <p><i class="fas fa-map-marker-alt"></i> ${company.address}</p>
              <p><i class="fas fa-phone"></i> ${company.phone} | <i class="fas fa-envelope"></i> ${company.email}</p>
            </div>
          </div>
          <div class="doc-meta">
            <h2>${title}</h2>
            <div class="id">#${data.id.substring(0, 8).toUpperCase()}</div>
            <div class="date">Emitido em: ${new Date().toLocaleDateString('pt-BR')}</div>
          </div>
        </div>

        <div class="grid">
          <div class="card">
            <div class="section-title">Dados do Cliente</div>
            <div class="info-row">
              <span class="info-label">Nome / Razão Social</span>
              <span class="info-value">${client.name}</span>
            </div>
            <div class="info-row">
              <span class="info-label">CPF / CNPJ</span>
              <span class="info-value">${client.document}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Endereço</span>
              <span class="info-value">${client.address.street}, ${client.address.number} - ${client.address.city}/${client.address.state}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Contato</span>
              <span class="info-value">${client.phone} | ${client.email}</span>
            </div>
          </div>

          <div class="card">
            <div class="section-title">Equipamento</div>
            <div class="info-row">
              <span class="info-label">Máquina / Modelo</span>
              <span class="info-value">${machine.brand} ${machine.model} (${machine.type})</span>
            </div>
            <div class="info-row">
              <span class="info-label">Nº de Série</span>
              <span class="info-value">${machine.serialNumber}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Voltagem / Tensão</span>
              <span class="info-value">${machine.voltage}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Condição Visual</span>
              <span class="info-value">${machine.visualCondition || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div class="details-section">
          <div class="section-title">Relato do Problema / Defeito</div>
          <div class="description-box">${(data as any).problemDescription || (data as any).identifiedDefect}</div>
        </div>

        ${isOS && (data as any).servicesExecuted ? `
        <div class="details-section">
          <div class="section-title">Serviços Executados</div>
          <div class="description-box">${(data as any).servicesExecuted}</div>
        </div>
        ` : ''}

        <div class="section-title">Detalhamento de Valores</div>
        <table>
          <thead>
            <tr>
              <th style="width: 70%;">Descrição do Item / Serviço</th>
              <th style="text-align: right;">Valor Unitário</th>
            </tr>
          </thead>
          <tbody>
            ${services.length > 0 ? services.map((s: any) => `
              <tr>
                <td>${s.description}</td>
                <td style="text-align: right;">R$ ${s.price.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
              </tr>
            `).join('') : `
              <tr>
                <td>Mão de Obra Técnica Especializada</td>
                <td style="text-align: right;">R$ ${financial.serviceValue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
              </tr>
            `}
            ${financial.partsValue > 0 ? `
              <tr>
                <td>Peças e Componentes de Reposição</td>
                <td style="text-align: right;">R$ ${financial.partsValue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
              </tr>
            ` : ''}
          </tbody>
        </table>

        <div class="financial-summary">
          <div class="fin-row">
            <span>Subtotal</span>
            <span>R$ ${(financial.serviceValue + financial.partsValue).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
          </div>
          ${financial.discount > 0 ? `
          <div class="fin-row">
            <span>Desconto</span>
            <span style="color: #ef4444;">- R$ ${financial.discount.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
          </div>
          ` : ''}
          <div class="fin-row total">
            <span>Total Geral</span>
            <span>R$ ${financial.total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
          </div>
          ${financial.downPayment > 0 ? `
          <div class="fin-row" style="font-weight: bold; color: #10b981;">
            <span>Valor Pago (Sinal)</span>
            <span>R$ ${financial.downPayment.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
          </div>
          <div class="fin-row" style="font-weight: bold; margin-top: 5px;">
            <span>Saldo Restante</span>
            <span>R$ ${financial.remainingValue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
          </div>
          ` : ''}
        </div>

        <div class="footer">
          <div class="signatures">
            <div class="sig-box">
              RESPONSÁVEL TÉCNICO
            </div>
            <div class="sig-box">
              CIENTE E DE ACORDO (CLIENTE)
            </div>
          </div>
        </div>

        <div class="terms">
          Este documento tem validade de 10 dias corridos. 
          Garantia de 90 dias limitada exclusivamente aos serviços descritos e peças substituídas.
          Gerado via WestSoldas em ${new Date().toLocaleString('pt-BR')}.
        </div>

        <div class="no-print" style="position: fixed; bottom: 30px; right: 30px; display: flex; gap: 10px;">
          <button onclick="window.close()" style="padding: 12px 25px; background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; border-radius: 12px; cursor: pointer; font-weight: bold;">Cancelar</button>
          <button onclick="window.print()" style="padding: 12px 30px; background: #2563eb; color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: bold; box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3);">Imprimir Agora</button>
        </div>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
