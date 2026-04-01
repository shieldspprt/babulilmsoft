import type { ReceiptData } from "../../lib/supabase";
import { formatCurrency } from "../../lib/receiptGenerator";
import "./ReceiptPrint.css";

interface Props {
  receipts: ReceiptData[];
}

export function ReceiptPrintLayout({ receipts }: Props) {
  return (
    <div className="receipt-print-area">
      {receipts.map((receipt, index) => (
        <div key={index} className="receipt-print-item">
          <ReceiptSingle receipt={receipt} />
          {index < receipts.length - 1 && <div className="cut-line">✂ CUT HERE</div>}
        </div>
      ))}
    </div>
  );
}

function ReceiptSingle({ receipt }: { receipt: ReceiptData }) {
  const s = receipt.summary;
  return (
    <div className="receipt-single">
      <div className="r-header">
        <div>
          <div className="r-school-name">{receipt.school.name}</div>
          <div className="r-school-addr">{receipt.school.address}</div>
        </div>
        <div className="r-meta">
          <div className="r-receipt-no">#{receipt.receipt_no}</div>
          <div className="r-date">{receipt.date}</div>
        </div>
      </div>
      <div className="r-parent">
        <div className="r-parent-name">{receipt.parent.name}</div>
        <div>{receipt.parent.contact}</div>
      </div>
      <table className="r-table">
        <thead><tr><th>Student</th><th>Class</th><th>Fee</th></tr></thead>
        <tbody>
          {receipt.students.map((st, i) => (
            <tr key={i}><td>{st.name}</td><td>{st.class_name}</td><td>{formatCurrency(st.final_fee)}</td></tr>
          ))}
        </tbody>
      </table>
      <div className="r-summary">
        <div className="r-row"><span>Total:</span><span>{formatCurrency(s.net_monthly)}</span></div>
        {s.previous_balance > 0 && <div className="r-row"><span>Balance:</span><span>{formatCurrency(s.previous_balance)}</span></div>}
        <div className="r-row total"><span>Payable:</span><span>{formatCurrency(s.total_payable)}</span></div>
      </div>
      <div className="r-payment">
        <div className="r-paid">RECEIVED: {formatCurrency(s.payment_received)}</div>
        <div>{receipt.payment.method}</div>
      </div>
      <div className="r-footer">
        {s.is_cleared ? "✓ Cleared" : s.new_balance > 0 ? "Balance: " + formatCurrency(s.new_balance) : "Advance: " + formatCurrency(Math.abs(s.new_balance))}
      </div>
    </div>
  );
}
