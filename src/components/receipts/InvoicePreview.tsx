import type { ReceiptData } from '../../lib/supabase';
import { formatCurrency, formatMonth } from '../../lib/receiptGenerator';
import { Printer, Download, MessageCircle, X, AlertTriangle } from 'lucide-react';
import './ReceiptPrint.css';

interface Props {
  invoice: ReceiptData;
  onClose: () => void;
}

export function InvoicePreview({ invoice, onClose }: Props) {
  
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const printContent = document.querySelector('.invoice-print-area')?.innerHTML || '';
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 15);
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Fee Voucher ${invoice.receipt_no || ''}</title>
        <style>
          @page { size: A4 portrait; margin: 0.3in; }
          body { margin: 0; padding: 20px; font-family: Arial, sans-serif; background: white; }
          .invoice-print-area { display: flex; flex-direction: column; }
          .receipt-print-item { width: 100%; page-break-inside: avoid; padding: 6px 0; }
          
          /* Invoice Styles */
          .receipt-single { width: 100%; padding: 10px; font-family: Arial, sans-serif; font-size: 10px; line-height: 1.2; color: #000; background: white; box-sizing: border-box; position: relative; }
          .r-header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 6px; border-bottom: 1.5px solid #000; margin-bottom: 6px; }
          .r-school-name { font-size: 14px; font-weight: 700; }
          .r-school-phone { font-size: 8px; color: #333; }
          .r-logo { flex-shrink: 0; }
          .r-logo img { height: 40px; width: auto; max-width: 80px; object-fit: contain; }
          .r-meta { text-align: right; flex-shrink: 0; }
          .r-receipt-no { font-size: 11px; font-weight: 700; color: #dc2626; }
          .r-date { font-size: 8px; color: #666; }
          .r-parent { display: flex; justify-content: space-between; align-items: center; background: #f5f5f5; padding: 6px; margin-bottom: 6px; border-radius: 3px; }
          .r-parent-label { font-size: 7px; text-transform: uppercase; color: #666; }
          .r-parent-name { font-size: 11px; font-weight: 600; }
          .r-parent-cnic { font-size: 8px; color: #666; margin-top: 2px; }
          .r-table-title { font-size: 8px; font-weight: 700; text-transform: uppercase; margin-bottom: 3px; }
          .r-table { width: 100%; border-collapse: collapse; font-size: 9px; margin-bottom: 6px; }
          .r-table th { background: #e5e5e5; padding: 3px 2px; text-align: left; font-weight: 700; border: 0.5px solid #ccc; font-size: 8px; }
          .r-table td { padding: 2px; border: 0.5px solid #ddd; }
          .r-table tfoot td { font-weight: 700; background: #e5e5e5; border: 0.5px solid #ccc; }
          .cut-line { text-align: center; font-size: 8px; color: #999; margin-bottom: 10px; border-bottom: 1px dashed #ccc; padding-bottom: 5px; }
          
          /* Invoice Specific */
          .invoice-title-banner { background: #dc2626; color: white; text-align: center; padding: 8px; margin: 0 -10px 10px -10px; }
          .invoice-title-banner h1 { margin: 0; font-size: 18px; font-weight: 800; letter-spacing: 2px; }
          .invoice-subtitle { font-size: 9px; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px; }
          .invoice-no { color: #dc2626 !important; font-size: 12px !important; }
          .invoice-due-date { background: #fef2f2; color: #dc2626; padding: 2px 6px; border-radius: 3px; font-size: 9px; margin-top: 4px; border: 1px solid #fecaca; }
          .invoice-summary { background: #fef2f2; border: 1.5px solid #dc2626; border-radius: 4px; padding: 8px; margin-bottom: 8px; }
          .invoice-summary-row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 9px; color: #333; }
          .invoice-summary-row.total-due { background: #dc2626; color: white; margin: 6px -8px -8px -8px; padding: 8px; font-size: 12px; font-weight: 800; border-radius: 0 0 2px 2px; }
          .invoice-notice { display: flex; gap: 8px; background: #fff7ed; border: 1.5px solid #f97316; border-radius: 4px; padding: 8px; margin-bottom: 8px; }
          .invoice-notice-icon { color: #f97316; flex-shrink: 0; }
          .invoice-notice-text { font-size: 8px; color: #7c2d12; }
          .invoice-notice-text strong { color: #c2410c; font-size: 9px; }
          .invoice-notice-text p { margin: 2px 0 0 0; line-height: 1.3; }
          .invoice-footer { display: flex; justify-content: space-between; align-items: flex-end; }
          .r-footer { display: flex; justify-content: space-between; align-items: flex-end; padding-top: 4px; font-size: 8px; }
          .r-signature-line { width: 60px; border-top: 0.5px solid #000; margin-bottom: 1px; }
          .r-note { font-size: 7px; color: #999; text-align: center; margin-top: 4px; }
          .invoice-note { color: #dc2626; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="invoice-print-area">
          ${printContent}
        </div>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };
  
  const handleDownload = () => {
    const printContent = document.querySelector('.invoice-print-area')?.innerHTML || '';
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 15);
    
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>Fee Voucher ${invoice.receipt_no || ''}</title>
  <style>
    @page { size: A4 portrait; margin: 0.3in; }
    body { margin: 0; padding: 20px; font-family: Arial, sans-serif; background: white; }
    .invoice-print-area { display: flex; flex-direction: column; }
    .receipt-print-item { width: 100%; page-break-inside: avoid; padding: 6px 0; }
    
    /* Invoice Styles */
    .receipt-single { width: 100%; padding: 10px; font-family: Arial, sans-serif; font-size: 10px; line-height: 1.2; color: #000; background: white; box-sizing: border-box; position: relative; }
    .r-header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 6px; border-bottom: 1.5px solid #000; margin-bottom: 6px; }
    .r-school-name { font-size: 14px; font-weight: 700; }
    .r-school-phone { font-size: 8px; color: #333; }
    .r-logo { flex-shrink: 0; }
    .r-logo img { height: 40px; width: auto; max-width: 80px; object-fit: contain; }
    .r-meta { text-align: right; flex-shrink: 0; }
    .r-receipt-no { font-size: 11px; font-weight: 700; color: #dc2626; }
    .r-date { font-size: 8px; color: #666; }
    .r-parent { display: flex; justify-content: space-between; align-items: center; background: #f5f5f5; padding: 6px; margin-bottom: 6px; border-radius: 3px; }
    .r-parent-label { font-size: 7px; text-transform: uppercase; color: #666; }
    .r-parent-name { font-size: 11px; font-weight: 600; }
    .r-parent-cnic { font-size: 8px; color: #666; margin-top: 2px; }
    .r-table-title { font-size: 8px; font-weight: 700; text-transform: uppercase; margin-bottom: 3px; }
    .r-table { width: 100%; border-collapse: collapse; font-size: 9px; margin-bottom: 6px; }
    .r-table th { background: #e5e5e5; padding: 3px 2px; text-align: left; font-weight: 700; border: 0.5px solid #ccc; font-size: 8px; }
    .r-table td { padding: 2px; border: 0.5px solid #ddd; }
    .r-table tfoot td { font-weight: 700; background: #e5e5e5; border: 0.5px solid #ccc; }
    .cut-line { text-align: center; font-size: 8px; color: #999; margin-bottom: 10px; border-bottom: 1px dashed #ccc; padding-bottom: 5px; }
    
    /* Invoice Specific */
    .invoice-title-banner { background: #dc2626; color: white; text-align: center; padding: 8px; margin: 0 -10px 10px -10px; }
    .invoice-title-banner h1 { margin: 0; font-size: 18px; font-weight: 800; letter-spacing: 2px; }
    .invoice-subtitle { font-size: 9px; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px; }
    .invoice-no { color: #dc2626 !important; font-size: 12px !important; }
    .invoice-due-date { background: #fef2f2; color: #dc2626; padding: 2px 6px; border-radius: 3px; font-size: 9px; margin-top: 4px; border: 1px solid #fecaca; }
    .invoice-summary { background: #fef2f2; border: 1.5px solid #dc2626; border-radius: 4px; padding: 8px; margin-bottom: 8px; }
    .invoice-summary-row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 9px; color: #333; }
    .invoice-summary-row.total-due { background: #dc2626; color: white; margin: 6px -8px -8px -8px; padding: 8px; font-size: 12px; font-weight: 800; border-radius: 0 0 2px 2px; }
    .invoice-notice { display: flex; gap: 8px; background: #fff7ed; border: 1.5px solid #f97316; border-radius: 4px; padding: 8px; margin-bottom: 8px; }
    .invoice-notice-icon { color: #f97316; flex-shrink: 0; }
    .invoice-notice-text { font-size: 8px; color: #7c2d12; }
    .invoice-notice-text strong { color: #c2410c; font-size: 9px; }
    .invoice-notice-text p { margin: 2px 0 0 0; line-height: 1.3; }
    .invoice-footer { display: flex; justify-content: space-between; align-items: flex-end; }
    .r-footer { display: flex; justify-content: space-between; align-items: flex-end; padding-top: 4px; font-size: 8px; }
    .r-signature-line { width: 60px; border-top: 0.5px solid #000; margin-bottom: 1px; }
    .r-note { font-size: 7px; color: #999; text-align: center; margin-top: 4px; }
    .invoice-note { color: #dc2626; font-weight: 600; }
  </style>
</head>
<body>
  <div class="invoice-print-area">
    ${printContent}
  </div>
</body>
</html>`;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Voucher-${invoice.receipt_no || 'print'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const handleWhatsApp = () => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 15);
    
    const msg = `*FEE VOUCHER - PAYMENT DUE*\n\n` +
      `Voucher: ${invoice.receipt_no || 'N/A'}\n` +
      `School: ${invoice.school.name}\n` +
      `Parent: ${invoice.parent.name}\n` +
      `Amount Due: ${formatCurrency(invoice.summary.total_payable)}\n` +
      `For: ${invoice.payment.months_paid.map(formatMonth).join(', ')}\n` +
      `Due Date: ${dueDate.toLocaleDateString('en-PK')}\n\n` +
      `Please pay before the due date to avoid late fees.`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };
  
  return (
    <div className="receipt-modal" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="receipt-modal-content">
        <div className="receipt-preview-wrapper">
          <div className="a4-preview">
            <InvoiceContent invoice={invoice} />
          </div>
        </div>
        
        <div className="receipt-actions">
          <button className="btn-print" onClick={handlePrint}>
            <Printer size={16} /> Print
          </button>
          <button className="btn-pdf" onClick={handleDownload}>
            <Download size={16} /> Download
          </button>
          <button className="btn-whatsapp" onClick={handleWhatsApp}>
            <MessageCircle size={16} /> WhatsApp
          </button>
          <button className="btn-close" onClick={onClose}>
            <X size={16} /> Close
          </button>
        </div>
      </div>
      
      <div className="invoice-print-area">
        <InvoicePrintItem invoice={invoice} />
      </div>
    </div>
  );
}

function InvoicePrintItem({ invoice }: { invoice: ReceiptData }) {
  const s = invoice.summary;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 15);
  
  return (
    <div className="receipt-print-item">
      <div className="cut-line">✂ ─── CUT HERE ─── ✂</div>
      
      <div className="receipt-single invoice-single">
        {/* Watermark */}
        <div className="invoice-watermark">
          <AlertTriangle size={60} />
          <span>PAYMENT DUE</span>
        </div>
        
        {/* Header */}
        <div className="r-header">
          <div className="r-school">
            <div className="r-school-name">{invoice.school.name}</div>
            <div className="r-school-phone">Ph: {invoice.school.contact}</div>
          </div>
          {invoice.school.logo_url && (
            <div className="r-logo">
              <img src={invoice.school.logo_url} alt="School Logo" />
            </div>
          )}
        </div>
        
        {/* Title Banner */}
        <div className="invoice-title-banner">
          <h1>FEE VOUCHER</h1>
          <span className="invoice-subtitle">Fee Demand Notice</span>
        </div>
        
        {/* Parent Info */}
        <div className="r-parent">
          <div>
            <div className="r-parent-label">Bill To</div>
            <div className="r-parent-name">{invoice.parent.name}</div>
            <div className="r-parent-contact">{invoice.parent.contact}</div>
            <div className="r-parent-cnic">CNIC: {invoice.parent.cnic}</div>
          </div>
          <div className="r-meta">
            <div className="r-receipt-no invoice-no">#{invoice.receipt_no}</div>
            <div className="r-date">Date: {invoice.date}</div>
            <div className="invoice-due-date">
              <strong>Due Date: {dueDate.toLocaleDateString('en-PK')}</strong>
            </div>
          </div>
        </div>
        
        {/* Students Table */}
        <div className="r-table-title">Student Fee Details</div>
        <table className="r-table">
          <thead>
            <tr>
              <th>S#</th>
              <th>Student</th>
              <th>Class</th>
              <th>Class Fee</th>
              <th>Disc</th>
              <th>Final</th>
            </tr>
          </thead>
          <tbody>
            {invoice.students.map((student, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{student.name}</td>
                <td>{student.class_name}</td>
                <td>{formatCurrency(student.monthly_fee)}</td>
                <td>{(student.discount_value || 0) > 0 ? `-${formatCurrency(student.discount_value || 0)}` : '-'}</td>
                <td>{formatCurrency(student.final_fee)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3}>Monthly Total</td>
              <td>{formatCurrency(s.gross_fee)}</td>
              <td>-{formatCurrency(s.total_discount)}</td>
              <td>{formatCurrency(s.net_monthly)}</td>
            </tr>
          </tfoot>
        </table>
        
        {/* Amount Due Summary */}
        <div className="invoice-summary">
          <div className="invoice-summary-row">
            <span>Monthly Fee:</span>
            <span>{formatCurrency(s.net_monthly)}</span>
          </div>
          <div className="invoice-summary-row total-due">
            <span>Total Due Today:</span>
            <span>{formatCurrency(s.total_payable)}</span>
          </div>
        </div>

        {/* Notice Box */}
        <div className="invoice-notice">
          <div className="invoice-notice-icon">
            <AlertTriangle size={20} />
          </div>
          <div className="invoice-notice-text">
            <strong>THIS IS NOT A RECEIPT</strong>
            <p>Payment has not been received. Please pay the total amount due by <strong>{dueDate.toLocaleDateString('en-PK')}</strong> to avoid late fees.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="r-footer invoice-footer">
          <div className="r-signature">
            <div className="r-signature-line"></div>
            <span>Authorized Signature</span>
          </div>
          <div className="invoice-stamp-area">
            <div className="stamp-placeholder">PAID stamp will be affixed upon payment</div>
          </div>
        </div>
        <div className="r-note invoice-note">This is a computer-generated voucher and does not require signature until paid.</div>
      </div>
    </div>
  );
}

function InvoiceContent({ invoice }: { invoice: ReceiptData }) {
  const s = invoice.summary;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 15);
  
  return (
    <div className="receipt-single invoice-single">
      <div className="invoice-watermark-preview">
        <AlertTriangle size={40} />
        <span>PAYMENT DUE</span>
      </div>
      
      <div className="r-header">
        <div className="r-school">
          <div className="r-school-name">{invoice.school.name}</div>
          <div className="r-school-phone">Ph: {invoice.school.contact}</div>
        </div>
        {invoice.school.logo_url && (
          <div className="r-logo">
            <img src={invoice.school.logo_url} alt="School Logo" />
          </div>
        )}
      </div>
      
      <div className="invoice-title-banner">
        <h1>FEE VOUCHER</h1>
        <span className="invoice-subtitle">Fee Demand Notice</span>
      </div>
      
      <div className="r-parent">
        <div>
          <div className="r-parent-label">Bill To</div>
          <div className="r-parent-name">{invoice.parent.name}</div>
          <div className="r-parent-contact">{invoice.parent.contact}</div>
        </div>
        <div className="r-meta">
          <div className="r-receipt-no invoice-no">#{invoice.receipt_no}</div>
          <div className="r-date">{invoice.date}</div>
          <div className="invoice-due-date">
            <strong>Due: {dueDate.toLocaleDateString('en-PK')}</strong>
          </div>
        </div>
      </div>
      
      <div className="r-table-title">Student Fee Details</div>
      <table className="r-table">
        <thead>
          <tr>
            <th>S#</th>
            <th>Student</th>
            <th>Class</th>
            <th>Class Fee</th>
            <th>Disc</th>
            <th>Final</th>
          </tr>
        </thead>
        <tbody>
          {invoice.students.map((student, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>{student.name}</td>
              <td>{student.class_name}</td>
              <td>{formatCurrency(student.monthly_fee)}</td>
              <td>{(student.discount_value || 0) > 0 ? `-${formatCurrency(student.discount_value || 0)}` : '-'}</td>
              <td>{formatCurrency(student.final_fee)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3}>Monthly Total</td>
            <td>{formatCurrency(s.gross_fee)}</td>
            <td>-{formatCurrency(s.total_discount)}</td>
            <td>{formatCurrency(s.net_monthly)}</td>
          </tr>
        </tfoot>
      </table>
      
      <div className="invoice-summary">
        <div className="invoice-summary-row">
          <span>Monthly Fee:</span>
          <span>{formatCurrency(s.net_monthly)}</span>
        </div>
        <div className="invoice-summary-row total-due">
          <span>Total Due Today:</span>
          <span>{formatCurrency(s.total_payable)}</span>
        </div>
      </div>

      <div className="invoice-notice">
        <div className="invoice-notice-icon">
          <AlertTriangle size={18} />
        </div>
        <div className="invoice-notice-text">
          <strong>THIS IS NOT A RECEIPT</strong>
          <p>Payment pending. Please pay by {dueDate.toLocaleDateString('en-PK')}.</p>
        </div>
      </div>

      <div className="r-footer invoice-footer">
        <div className="r-signature">
          <div className="r-signature-line"></div>
          <span>Authorized</span>
        </div>
      </div>
      <div className="r-note invoice-note">Computer-generated voucher</div>
    </div>
  );
}
