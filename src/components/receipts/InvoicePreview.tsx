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
    window.print();
  };
  
  const handleDownload = () => {
    const printContent = document.querySelector('.invoice-print-area')?.innerHTML || '';
    const blob = new Blob([`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Fee Voucher ${invoice.receipt_no || ''}</title>
        <style>
          * { visibility: hidden; }
          body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
          .invoice-print-area, .invoice-print-area * { visibility: visible; }
          .invoice-print-area { display: flex !important; flex-direction: column; }
          @page { size: A4 portrait; margin: 0.3in; }
        </style>
      </head>
      <body>${printContent}</body>
      </html>
    `], { type: 'text/html' });
    
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
          {s.previous_balance > 0 && (
            <div className="invoice-summary-row">
              <span>Previous Balance:</span>
              <span>{formatCurrency(s.previous_balance)}</span>
            </div>
          )}
          {s.previous_balance < 0 && (
            <div className="invoice-summary-row">
              <span>Previous Advance:</span>
              <span>-{formatCurrency(Math.abs(s.previous_balance))}</span>
            </div>
          )}
          <div className="invoice-summary-row fee-row">
            <span>Fee for {invoice.payment.months_count} month(s):</span>
            <span>{formatCurrency(s.net_monthly * invoice.payment.months_count)}</span>
          </div>
          <div className="invoice-summary-row total-due">
            <span>TOTAL AMOUNT DUE</span>
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
        {s.previous_balance > 0 && (
          <div className="invoice-summary-row">
            <span>Previous Balance:</span>
            <span>{formatCurrency(s.previous_balance)}</span>
          </div>
        )}
        {s.previous_balance < 0 && (
          <div className="invoice-summary-row">
            <span>Previous Advance:</span>
            <span>-{formatCurrency(Math.abs(s.previous_balance))}</span>
          </div>
        )}
        <div className="invoice-summary-row fee-row">
          <span>Fee for {invoice.payment.months_count} month(s):</span>
          <span>{formatCurrency(s.net_monthly * invoice.payment.months_count)}</span>
        </div>
        <div className="invoice-summary-row total-due">
          <span>TOTAL AMOUNT DUE</span>
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
