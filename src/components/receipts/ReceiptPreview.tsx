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
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const printContent = document.querySelector('.receipt-print-area')?.innerHTML || '';
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt ${receipt.receipt_no || ''}</title>
        <style>
          @page { size: A4 portrait; margin: 0.3in; }
          body { margin: 0; padding: 20px; font-family: Arial, sans-serif; background: white; }
          .receipt-print-area { display: flex; flex-direction: column; }
          .receipt-print-item { width: 100%; page-break-inside: avoid; padding: 6px 0; }
          
          /* Receipt Styles */
          .receipt-single { width: 100%; padding: 10px; font-family: Arial, sans-serif; font-size: 10px; line-height: 1.2; color: #000; background: white; box-sizing: border-box; }
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
          .r-table-title { font-size: 8px; font-weight: 700; text-transform: uppercase; margin-bottom: 3px; }
          .r-table { width: 100%; border-collapse: collapse; font-size: 9px; margin-bottom: 6px; }
          .r-table th { background: #e5e5e5; padding: 3px 2px; text-align: left; font-weight: 700; border: 0.5px solid #ccc; font-size: 8px; }
          .r-table td { padding: 2px; border: 0.5px solid #ddd; }
          .r-table tfoot td { font-weight: 700; background: #e5e5e5; border: 0.5px solid #ccc; }
          .r-summary { background: #f5f5f5; padding: 6px; margin-bottom: 6px; border-radius: 3px; }
          .r-summary-row { display: flex; justify-content: space-between; padding: 1px 0; font-size: 9px; }
          .r-summary-row.total { margin-top: 3px; padding-top: 3px; border-top: 1px solid #000; font-size: 10px; font-weight: 700; }
          .r-footer { display: flex; justify-content: space-between; align-items: flex-end; padding-top: 4px; font-size: 8px; }
          .r-signature-line { width: 60px; border-top: 0.5px solid #000; margin-bottom: 1px; }
          .r-note { font-size: 7px; color: #999; text-align: center; margin-top: 4px; }
          .cut-line { text-align: center; font-size: 8px; color: #999; margin-bottom: 10px; border-bottom: 1px dashed #ccc; padding-bottom: 5px; }
        </style>
      </head>
      <body>
        <div class="receipt-print-area">
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
    const printContent = document.querySelector('.receipt-print-area')?.innerHTML || '';
    
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>Receipt ${receipt.receipt_no || ''}</title>
  <style>
    @page { size: A4 portrait; margin: 0.3in; }
    body { margin: 0; padding: 20px; font-family: Arial, sans-serif; background: white; }
    .receipt-print-area { display: flex; flex-direction: column; }
    .receipt-print-item { width: 100%; page-break-inside: avoid; padding: 6px 0; }
    
    /* Receipt Styles */
    .receipt-single { width: 100%; padding: 10px; font-family: Arial, sans-serif; font-size: 10px; line-height: 1.2; color: #000; background: white; box-sizing: border-box; }
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
    .r-table-title { font-size: 8px; font-weight: 700; text-transform: uppercase; margin-bottom: 3px; }
    .r-table { width: 100%; border-collapse: collapse; font-size: 9px; margin-bottom: 6px; }
    .r-table th { background: #e5e5e5; padding: 3px 2px; text-align: left; font-weight: 700; border: 0.5px solid #ccc; font-size: 8px; }
    .r-table td { padding: 2px; border: 0.5px solid #ddd; }
    .r-table tfoot td { font-weight: 700; background: #e5e5e5; border: 0.5px solid #ccc; }
    .r-summary { background: #f5f5f5; padding: 6px; margin-bottom: 6px; border-radius: 3px; }
    .r-summary-row { display: flex; justify-content: space-between; padding: 1px 0; font-size: 9px; }
    .r-summary-row.total { margin-top: 3px; padding-top: 3px; border-top: 1px solid #000; font-size: 10px; font-weight: 700; }
    .r-footer { display: flex; justify-content: space-between; align-items: flex-end; padding-top: 4px; font-size: 8px; }
    .r-signature-line { width: 60px; border-top: 0.5px solid #000; margin-bottom: 1px; }
    .r-note { font-size: 7px; color: #999; text-align: center; margin-top: 4px; }
    .cut-line { text-align: center; font-size: 8px; color: #999; margin-bottom: 10px; border-bottom: 1px dashed #ccc; padding-bottom: 5px; }
  </style>
</head>
<body>
  <div class="receipt-print-area">
    ${printContent}
  </div>
</body>
</html>`;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
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
        {/* Header — Logo on right */}
        <div className="r-header">
          <div className="r-school">
            <div className="r-school-name">{receipt.school.name}</div>
            <div className="r-school-phone">Ph: {receipt.school.contact}</div>
          </div>
          {receipt.school.logo_url && (
            <div className="r-logo">
              <img src={receipt.school.logo_url} alt="School Logo" />
            </div>
          )}
        </div>
        
        {/* Parent Info — Receipt# and Date on right */}
        <div className="r-parent">
          <div>
            <div className="r-parent-label">Parent</div>
            <div className="r-parent-name">{receipt.parent.name}</div>
            <div className="r-parent-contact">{receipt.parent.contact}</div>
          </div>
          <div className="r-meta">
            <div className="r-receipt-no">#{receipt.receipt_no}</div>
            <div className="r-date">{receipt.date}</div>
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
                <td>{(student.discount_value || 0) > 0 ? `-${formatCurrency(student.discount_value || 0)}` : '-'}</td>
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
          {/* New balance after payment — always visible */}
          <div className="r-summary-row" style={{ fontWeight: 700, borderTop: '1px solid #ddd', marginTop: '4px', paddingTop: '4px' }}>
            <span>{s.new_balance > 0 ? 'New Balance Due:' : s.new_balance < 0 ? 'New Advance:' : 'Balance Cleared'}</span>
            <span>{s.new_balance === 0 ? 'Rs 0' : formatCurrency(Math.abs(s.new_balance))}</span>
          </div>
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
      {/* Header — Logo on right */}
      <div className="r-header">
        <div className="r-school">
          <div className="r-school-name">{receipt.school.name}</div>
          <div className="r-school-phone">Ph: {receipt.school.contact}</div>
        </div>
        {receipt.school.logo_url && (
          <div className="r-logo">
            <img src={receipt.school.logo_url} alt="School Logo" />
          </div>
        )}
      </div>
      
      {/* Parent — Receipt# and Date on right */}
      <div className="r-parent">
        <div>
          <div className="r-parent-label">Parent</div>
          <div className="r-parent-name">{receipt.parent.name}</div>
          <div className="r-parent-contact">{receipt.parent.contact}</div>
        </div>
        <div className="r-meta">
          <div className="r-receipt-no">#{receipt.receipt_no}</div>
          <div className="r-date">{receipt.date}</div>
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
              <td>{(student.discount_value || 0) > 0 ? `-${formatCurrency(student.discount_value || 0)}` : '-'}</td>
              <td>{formatCurrency(student.final_fee)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3}>Total</td>
            <td>{formatCurrency(receipt.students.reduce((sum, s) => sum + s.monthly_fee, 0))}</td>
            <td>-{formatCurrency(receipt.students.reduce((sum, s) => sum + (s.discount_value || 0), 0))}</td>
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
        {/* New balance after payment — always visible */}
        <div className="r-summary-row total">
          <span>{s.new_balance > 0 ? 'New Balance Due:' : s.new_balance < 0 ? 'New Advance:' : 'Balance Cleared'}</span>
          <span>{s.new_balance === 0 ? 'Rs 0' : formatCurrency(Math.abs(s.new_balance))}</span>
        </div>
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
