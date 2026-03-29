// Fee Receipt Component for thermal printer and PDF export - v3
import logoImg from '@/assets/logo.png';

interface ReceiptProps {
  transactionNumber: string;
  parentName: string;
  parentId: string;
  phone: string;
  previousBalance: number;
  totalCharged: number;
  cashReceived: number;
  newBalance: number;
  students: Array<{
    name: string;
    studentId: string;
    class?: string;
    amount: number;
    description?: string;
  }>;
  paymentDate: string;
  paymentMethod: string;
  notes?: string;
  months?: string[];
  collectionName?: string;
}

export const Receipt = ({
  transactionNumber,
  parentName,
  parentId,
  phone,
  previousBalance,
  totalCharged,
  cashReceived,
  newBalance,
  students,
  paymentDate,
  paymentMethod,
  notes,
  months,
  collectionName
}: ReceiptProps) => {
  const totalDue = previousBalance + totalCharged;

  return (
    <div id="receipt-print-area" className="w-full max-w-[80mm] mx-auto bg-white border rounded-lg p-3 text-black">
      
      {/* Logo */}
      <div className="flex justify-center mb-2">
        <img src={logoImg} alt="Bab ul Ilm" className="h-12 w-auto" />
      </div>
      
      {/* Header */}
      <div className="text-center mb-2 print-header font-bold text-sm">
        BAB UL ILM
      </div>
      <div className="text-center mb-1 print-subheader text-xs">
        K12 International School
      </div>
      <div className="text-center mb-2 print-small text-xs">
        SUI GAS CHOWK, MANANWALA
      </div>
      
      <div className="print-border-dashed border-t-2 border-dashed border-gray-400 my-2"></div>
      
      {/* Receipt Title */}
      <div className="text-center my-2 print-title font-bold">
        FEE RECEIPT
      </div>
      <div className="text-center print-small text-xs">
        #{transactionNumber.slice(-8)}
      </div>
      <div className="text-center mb-2 print-small text-xs">
        {paymentDate}
      </div>
      
      <div className="print-border-solid border-t border-gray-300 my-2"></div>
      
      {/* Parent Info */}
      <div className="my-2 print-body text-xs space-y-1">
        <div>
          <strong>Parent:</strong> {parentName}
        </div>
        <div>
          <strong>Phone:</strong> {phone}
        </div>
        {months && months.length > 0 && (
          <div>
            <strong>Period:</strong> {months.join(', ')}
          </div>
        )}
        {collectionName && (
          <div>
            <strong>Collection:</strong> {collectionName}
          </div>
        )}
      </div>
      
      <div className="print-border-solid border-t border-gray-300 my-2"></div>
      
      {/* Students */}
      <div className="my-2">
        <div className="font-bold mb-1 print-body text-xs">ITEMS:</div>
        {students.map((student, idx) => (
          <div key={idx} className="flex justify-between mb-1 print-body text-xs">
            <span className="flex-1 truncate">{student.name}</span>
            <span className="font-bold ml-2">Rs.{Math.round(student.amount)}</span>
          </div>
        ))}
      </div>
      
      <div className="print-border-solid border-t border-gray-300 my-2"></div>
      
      {/* Payment Summary */}
      <div className="my-2 print-body text-xs space-y-1">
        {previousBalance !== 0 && (
          <div className="flex justify-between">
            <span>Previous Balance:</span>
            <span>Rs.{Math.round(Math.abs(previousBalance))}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>New Charges:</span>
          <span>Rs.{Math.round(totalCharged)}</span>
        </div>
        <div className="flex justify-between font-bold pt-1 border-t border-gray-400">
          <span>TOTAL DUE:</span>
          <span>Rs.{Math.round(totalDue)}</span>
        </div>
      </div>
      
      <div className="print-border-dashed border-t-2 border-dashed border-gray-400 my-2"></div>
      
      {/* Amount Paid */}
      <div className="my-2 py-2 bg-gray-100 px-2 rounded">
        <div className="flex justify-between items-center print-body">
          <span className="font-bold text-sm">PAID:</span>
          <span className="print-large text-lg font-bold">Rs.{Math.round(cashReceived)}</span>
        </div>
      </div>
      
      {/* Remaining Balance */}
      <div className="my-2">
        <div className="flex justify-between items-center print-body">
          <span className="font-bold text-sm">
            {newBalance > 0 ? 'BALANCE DUE:' : newBalance < 0 ? 'CREDIT:' : 'BALANCE:'}
          </span>
          <span className="print-large text-lg font-bold">
            Rs.{Math.round(Math.abs(newBalance))}
          </span>
        </div>
      </div>
      
      <div className="print-border-solid border-t border-gray-300 my-2"></div>
      
      {/* Payment Method */}
      <div className="text-center my-2 print-small text-xs">
        Payment via: <span className="font-bold capitalize">
          {paymentMethod.replace('_', ' ')}
        </span>
      </div>
      
      {notes && (
        <div className="my-1 print-small text-xs">
          <strong>Note:</strong> {notes}
        </div>
      )}
      
      {/* Footer */}
      <div className="text-center mt-2 print-small text-xs space-y-1">
        <div className="font-bold">Thank you for your payment!</div>
        <div>Contact: 03 111 747 333</div>
      </div>
      
      <div className="print-border-double border-t-2 border-double border-gray-400 mt-2"></div>
    </div>
  );
};
