const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

class PDFGenerator {
    constructor() {
        this.browser = null;
    }

    async init() {
        if (!this.browser) {
            this.browser = await puppeteer.launch({
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
        }
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }

    // Generate individual order note (2 per page, horizontal)
    async generateOrderNote(order, outputPath) {
        await this.init();
        const page = await this.browser.newPage();

        const html = this.getOrderNoteHTML(order);

        await page.setContent(html, { waitUntil: 'networkidle0' });
        await page.pdf({
            path: outputPath,
            format: 'Letter',
            landscape: true,
            printBackground: true,
            margin: {
                top: '10mm',
                right: '10mm',
                bottom: '10mm',
                left: '10mm'
            }
        });

        await page.close();
        return outputPath;
    }

    // Generate delivery summary for driver
    async generateDeliverySummary(orders, outputPath) {
        await this.init();
        const page = await this.browser.newPage();

        const html = this.getDeliverySummaryHTML(orders);

        await page.setContent(html, { waitUntil: 'networkidle0' });
        await page.pdf({
            path: outputPath,
            format: 'Letter',
            printBackground: true,
            margin: {
                top: '15mm',
                right: '15mm',
                bottom: '15mm',
                left: '15mm'
            }
        });

        await page.close();
        return outputPath;
    }

    getOrderNoteHTML(order) {
        const items = order.items || [];
        const itemsHTML = items.map(item => `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.quantity_boxes || '-'}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.quantity_units || '-'}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.product_text}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">$${parseFloat(item.precio_unitario).toFixed(2)}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">$${parseFloat(item.subtotal).toFixed(2)}</td>
            </tr>
        `).join('');

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: Arial, sans-serif; font-size: 12px; }
                    .note { width: 48%; display: inline-block; vertical-align: top; padding: 15px; border: 1px solid #333; }
                    .header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #333; padding-bottom: 10px; }
                    .company-name { font-size: 18px; font-weight: bold; }
                    .info-section { margin-bottom: 10px; }
                    .info-label { font-weight: bold; display: inline-block; width: 100px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th { background-color: #f0f0f0; padding: 8px; text-align: left; border-bottom: 2px solid #333; }
                    .total-row { font-weight: bold; font-size: 14px; }
                    .footer { margin-top: 20px; border-top: 1px solid #333; padding-top: 10px; }
                    .signature-line { border-top: 1px solid #000; margin-top: 30px; padding-top: 5px; text-align: center; }
                </style>
            </head>
            <body>
                <div class="note">
                    <div class="header">
                        <div class="company-name">DISTRIBUIDORA</div>
                        <div>Sistema de Pedidos</div>
                    </div>
                    
                    <div class="info-section">
                        <span class="info-label">Cliente:</span> ${order.cliente?.nombre_comercial || 'N/A'}
                    </div>
                    <div class="info-section">
                        <span class="info-label">Sucursal:</span> ${order.sucursal?.nombre_sucursal || 'N/A'}
                    </div>
                    <div class="info-section">
                        <span class="info-label">Dirección:</span> ${order.sucursal?.direccion || 'N/A'}
                    </div>
                    <div class="info-section">
                        <span class="info-label">Folio:</span> ${order.folio || 'N/A'}
                    </div>
                    <div class="info-section">
                        <span class="info-label">Fecha Entrega:</span> ${order.fecha_entrega || 'N/A'}
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>Cajas</th>
                                <th>Unidades</th>
                                <th>Producto</th>
                                <th style="text-align: right;">Precio Unit.</th>
                                <th style="text-align: right;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHTML}
                            <tr class="total-row">
                                <td colspan="4" style="padding: 10px; text-align: right;">TOTAL:</td>
                                <td style="padding: 10px; text-align: right;">$${parseFloat(order.total || 0).toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <div class="footer">
                        <div style="font-size: 10px; margin-bottom: 10px;">
                            Texto legal del pagaré (configurable)
                        </div>
                        <div class="signature-line">
                            Firma del Cliente
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    getDeliverySummaryHTML(orders) {
        const ordersHTML = orders.map((order, index) => `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${index + 1}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${order.folio}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${order.cliente?.nombre_comercial}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${order.sucursal?.nombre_sucursal}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">$${parseFloat(order.total).toFixed(2)}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">☐</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"></td>
            </tr>
        `).join('');

        const total = orders.reduce((sum, order) => sum + parseFloat(order.total || 0), 0);

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
                    .title { font-size: 20px; font-weight: bold; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th { background-color: #0d9488; color: white; padding: 10px; text-align: left; }
                    .total-row { font-weight: bold; background-color: #f0f0f0; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="title">RESUMEN DE REPARTO</div>
                    <div>Fecha: ${new Date().toLocaleDateString('es-MX')}</div>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>N°</th>
                            <th>Folio</th>
                            <th>Cliente</th>
                            <th>Sucursal</th>
                            <th style="text-align: right;">Importe</th>
                            <th style="text-align: center;">Factura Firmada</th>
                            <th>Observaciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${ordersHTML}
                        <tr class="total-row">
                            <td colspan="4" style="padding: 12px; text-align: right;">TOTAL:</td>
                            <td style="padding: 12px; text-align: right;">$${total.toFixed(2)}</td>
                            <td colspan="2"></td>
                        </tr>
                    </tbody>
                </table>
                
                <div style="margin-top: 40px;">
                    <div style="display: inline-block; width: 45%;">
                        <div style="border-top: 1px solid #000; padding-top: 5px; text-align: center; margin-top: 50px;">
                            Firma del Repartidor
                        </div>
                    </div>
                    <div style="display: inline-block; width: 45%; margin-left: 8%;">
                        <div style="border-top: 1px solid #000; padding-top: 5px; text-align: center; margin-top: 50px;">
                            Firma del Supervisor
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;
    }
}

module.exports = new PDFGenerator();
