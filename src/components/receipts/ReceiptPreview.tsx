import type { ReceiptData } from '../../lib/supabase';
import { formatCurrency, formatMonth } from '../../lib/receiptGenerator';
import { Printer, Download, MessageCircle, X } from 'lucide-react';
import './ReceiptPrint.css';

interface Props {
  receipt: ReceiptData;
  onClose: () => void;
  onPrint: () => void;
  onDownload: () => void;
  onWhatsApp: () => void;
}

export function ReceiptPreview({ receipt, onClose, onPrint, onDownload, onWhatsApp }: Props) {
  return (
    <div className="receipt-modal" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="receipt-modal-content">
        {/* Receipt View */}
        <div className="receipt-preview-wrapper">
          <ReceiptContent receipt={receipt} />
        </div>

        {/* Actions */}
        <div className="receipt-actions">
          <button className="btn-print" onClick={onPrint}>
            <Printer size={16} /> Print
          </button>
          <button className="btn-pdf" onClick={onDownload}>
            <Download size={16} /> PDF
          </button>
          <button className="btn-whatsapp" onClick={onWhatsApp}>
            <MessageCircle size={16} /> WhatsApp
          </button>
          <button className="btn-close" onClick={onClose}>
            <X size={16} /> Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Individual receipt content (reused for print and preview)
export function ReceiptContent({ receipt }: { receipt: ReceiptData }) {
  const s = receipt.summary;
  
  return (
    <div className="receipt-single">
      {/* Header */}
      <div className="r-header">
        <div className="r-school">
          <div className="r-school-name">{receipt.school.name}</div>
          <div className="r-school-addr">{receipt.school.address}</div>
          <div className="r-school-phone">{receipt.school.contact}</div>
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
            <th>S.No</th>
            <th>Student</th>
            <th>Class</th>
            <th>Fee</th>
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
              <td>{student.discount_value ? `-${formatCurrency(student.discount_value)}` : '-'}</td>
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

      {/* Summary */}
      <div className="r-summary">
        <div className="r-summary-row">
          <span>Gross Fee:</span>
          <span>{formatCurrency(s.gross_fee)}</span>
        </div>
        <div className="r-summary-row">
          <span>Less Discount:</span>
          <span>-{formatCurrency(s.total_discount)}</span>
        </div>
        <div className="r-summary-row highlight">
          <span>Net Monthly Fee:</span>
          <span>{formatCurrency(s.net_monthly)}</span>
        </div>
        {s.previous_balance > 0 && (
          <div className="r-summary-row">
            <span>Previous Balance:</span>
            <span>+{formatCurrency(s.previous_balance)}</span>
          </div>
        )}
        {s.previous_balance < 0 && (
          <div className="r-summary-row">
            <span>Previous Advance:</span>
            <span>{formatCurrency(Math.abs(s.previous_balance))}</span>
          </div>
        )}
        <div className="r-summary-row total">
          <span>Total Payable:</span>
          <span>{formatCurrency(s.total_payable)}</span>
        </div>
      </div>

      {/* Payment Received */}
      <div className="r-payment">
        <div className="r-payment-label">Payment Received</div>
        <div className="r-payment-amount">{formatCurrency(s.payment_received)}</div>
        <div className="r-payment-meta">
          {receipt.payment.method} | {receipt.payment.months_paid.map(formatMonth).join(', ')}
        </div>
      </div>

      {/* Footer */}
      <div className="r-footer">
        <div className="r-balance-note">
          {s.is_cleared ? (
            <span className="cleared">✓ Account Cleared</span>
          ) : s.new_balance > 0 ? (
            <span>New Balance Due: {formatCurrency(s.new_balance)}</span>
          ) : (
            <span>Advance: {formatCurrency(Math.abs(s.new_balance))}</span>
          )}
        </div>
        <div className="r-signature">
          <div className="r-stamp">
            <div className="r-stamp-text">PAID</div>
          </div>
          <div className="r-sig-box">
            <div className="r-signature-line"></div>
            <span>Authorized</span>
          </div>
        </div>
        <div className="r-note">This is a computer generated receipt</div>
      </div>
    </div>
  );
}
