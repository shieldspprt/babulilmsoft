import type { ReceiptData } from '../../lib/supabase';
import { formatCurrency, formatMonth } from '../../lib/receiptGenerator';
import { Printer, Download, MessageCircle, X } from 'lucide-react';
import './ReceiptPrint.css';

interface Props {
  receipt: ReceiptData;
  onClose: () => void;
}

export function ReceiptPreview({ receipt, onClose }: Props) {
  
  const handlePrint = () => {
    window.print();
  };
  
  const handleDownload = () => {
    // Create a printable version and trigger download
    const printContent = document.querySelector('.receipt-print-area')?.innerHTML || '';
    const blob = new Blob([`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt ${receipt.receipt_no || ''}</title>
        <style>
          * { visibility: hidden; }
          body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
          .receipt-print-area, .receipt-print-area * { visibility: visible; }
          .receipt-print-area { display: flex !important; flex-direction: column; }
          @page { size: A4 portrait; margin: 0.3in; }
        </style>
      </head>
      <body>${printContent}</body>
      </html>
    `], { type: 'text/html' });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Receipt-${receipt.receipt_no || 'print'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const handleWhatsApp = () => {
    const msg = `*Fee Receipt*\n\n` +
      `Receipt: ${receipt.receipt_no || 'N/A'}\n` +
      `School: ${receipt.school.name}\n` +
      `Parent: ${receipt.parent.name}\n` +
      `Amount: ${formatCurrency(receipt.summary.payment_received)}\n` +
      `For: ${receipt.payment.months_paid.map(formatMonth).join(', ')}\n` +
      `Balance: ${receipt.summary.new_balance > 0 ? formatCurrency(receipt.summary.new_balance) + ' due' : receipt.summary.new_balance < 0 ? 'Advance: ' + formatCurrency(Math.abs(receipt.summary.new_balance)) : 'Cleared'}`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };
  
  return (
    <div className="receipt-modal" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="receipt-modal-content">
        {/* A4 Preview */}
        <div className="receipt-preview-wrapper">
          <div className="a4-preview">
            {/* Receipt Content */}
            <ReceiptContent receipt={receipt} />
          </div>
        </div>
        
        {/* Actions */}
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
      
      {/* Hidden Print Layout */}
      <div className="receipt-print-area">
        <ReceiptPrintItem receipt={receipt} />
      </div>
    </div>
  );
}

// Receipt for A4 print layout
function ReceiptPrintItem({ receipt }: { receipt: ReceiptData }) {
  const s = receipt.summary;
  
  return (
    <div className="receipt-print-item">
      {/* Cut line */}
      <div className="cut-line">✂ ─── CUT HERE ─── ✂</div>
      
      {/* Receipt */}
      <div className="receipt-single">
        {/* Header */}
        <div className="r-header">
          <div className="r-school">
            <div className="r-school-name">{receipt.school.name}</div>
            
            <div className="r-school-phone">Ph: {receipt.school.contact}</div>
          </div>
          <div className="r-meta">
            <div className="r-receipt-no">#{receipt.receipt_no}</div>
            <div className="r-date">{receipt.date}</div>
          </div>
        </div>
        
        {/* Parent Info */}
        <div className="r-parent">
          <div>
            <div className="r-parent-label">Parent</div>
            <div className="r-parent-name">{receipt.parent.name}</div>
            <div className="r-parent-contact">{receipt.parent.contact}</div>
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
            {receipt.students.map((student, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{student.name}</td>
                <td>{student.class_name}</td>
                <td>{formatCurrency(student.monthly_fee)}</td>
                <td>{student.discount_value > 0 ? `-${formatCurrency(student.discount_value)}` : '-'}</td>
                <td>{formatCurrency(student.final_fee)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3}>Total</td>
              <td>{formatCurrency(s.gross_fee)}</td>
              <td>-{formatCurrency(s.total_discount)}</td>
              <td>{formatCurrency(s.net_monthly)}</td>
            </tr>
          </tfoot>
        </table>
        
        {/* Summary - Payment details */}
        <div className="r-summary">
          {s.previous_balance > 0 && (
            <div className="r-summary-row">
              <span>Previous Balance:</span>
              <span>{formatCurrency(s.previous_balance)}</span>
            </div>
          )}
          {s.previous_balance < 0 && (
            <div className="r-summary-row">
              <span>Previous Advance:</span>
              <span>{formatCurrency(Math.abs(s.previous_balance))}</span>
            </div>
          )}
          <div className="r-summary-row total">
            <span>Payment Received ({receipt.payment.method}):</span>
            <span>{formatCurrency(s.payment_received)}</span>
          </div>
          {/* Show new balance after payment */}
          {Math.abs(s.previous_balance) > 0 && (
            <div className="r-summary-row" style={{ fontWeight: 700, borderTop: '1px solid #ddd', marginTop: '4px', paddingTop: '4px' }}>
              <span>{s.previous_balance - s.payment_received > 0 ? 'New Balance Due:' : s.previous_balance - s.payment_received < 0 ? 'New Advance:' : ''}</span>
              <span>{formatCurrency(Math.abs(s.previous_balance - s.payment_received))}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="r-footer">
          <div className="r-signature">
            <div className="r-signature-line"></div>
            <span>Authorized Signature</span>
          </div>
        </div>
        <div className="r-note">Computer generated receipt · {receipt.date}</div>
      </div>
    </div>
  );
}

// Original ReceiptContent for preview (compact)
export function ReceiptContent({ receipt }: { receipt: ReceiptData }) {
  const s = receipt.summary;
  
  return (
    <div className="receipt-single">
      {/* Header */}
      <div className="r-header">
        <div className="r-school">
          <div className="r-school-name">{receipt.school.name}</div>
          
          <div className="r-school-phone">Ph: {receipt.school.contact}</div>
        </div>
        <div className="r-meta">
          <div className="r-receipt-no">#{receipt.receipt_no}</div>
          <div className="r-date">{receipt.date}</div>
        </div>
      </div>
      
      {/* Parent */}
      <div className="r-parent">
        <div className="r-parent-label">Parent</div>
        <div className="r-parent-name">{receipt.parent.name}</div>
        <div className="r-parent-contact">{receipt.parent.contact}</div>
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
          {receipt.students.map((student, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>{student.name}</td>
              <td>{student.class_name}</td>
              <td>{formatCurrency(student.monthly_fee)}</td>
              <td>{student.discount_value > 0 ? `-${formatCurrency(student.discount_value)}` : '-'}</td>
              <td>{formatCurrency(student.final_fee)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3}>Total</td>
            <td>{formatCurrency(receipt.students.reduce((sum, s) => sum + s.monthly_fee, 0))}</td>
            <td>-{formatCurrency(receipt.students.reduce((sum, s) => sum + s.discount_value, 0))}</td>
            <td>{formatCurrency(receipt.students.reduce((sum, s) => sum + s.final_fee, 0))}</td>
          </tr>
        </tfoot>
      </table>
      
      {/* Summary - Simplified */}
      <div className="r-summary">
        {s.previous_balance > 0 && (
          <div className="r-summary-row">
            <span>Previous Balance:</span>
            <span>{formatCurrency(s.previous_balance)}</span>
          </div>
        )}
        {s.previous_balance < 0 && (
          <div className="r-summary-row">
            <span>Previous Advance:</span>
            <span>{formatCurrency(Math.abs(s.previous_balance))}</span>
          </div>
        )}
        <div className="r-summary-row">
          <span>Payment Received ({receipt.payment.method}):</span>
          <span>{formatCurrency(s.payment_received)}</span>
        </div>
        {/* Show new balance after payment */}
        {Math.abs(s.previous_balance) > 0 && (
          <div className="r-summary-row total">
            <span>{s.previous_balance - s.payment_received > 0 ? 'New Balance Due:' : s.previous_balance - s.payment_received < 0 ? 'New Advance:' : ''}</span>
            <span>{formatCurrency(Math.abs(s.previous_balance - s.payment_received))}</span>
          </div>
        )}
      </div>

      {/* Footer - Signature only */}
      <div className="r-footer">
        <div className="r-signature">
          <div className="r-signature-line"></div>
          <span>Authorized</span>
        </div>
      </div>
      <div className="r-note">Computer generated receipt</div>
    </div>
  );
}
