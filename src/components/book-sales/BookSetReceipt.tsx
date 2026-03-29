import { forwardRef } from 'react';
import { formatDate } from '@/lib/utils';

interface BookSetReceiptProps {
  saleNumber: string;
  saleDate: Date;
  customerName?: string;
  customerType: 'student' | 'walkin';
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  totalAmount: number;
  paymentMethod: string;
}

export const BookSetReceipt = forwardRef<HTMLDivElement, BookSetReceiptProps>(
  ({ saleNumber, saleDate, customerName, customerType, items, totalAmount, paymentMethod }, ref) => {
    return (
      <div 
        ref={ref}
        id="receipt-print-area"
        className="bg-white text-black font-mono text-xs p-4 w-[80mm] mx-auto"
        style={{ fontFamily: "'Courier New', Courier, monospace" }}
      >
        {/* Header */}
        <div className="text-center mb-4">
          <div className="print-header text-lg font-bold text-emerald-800" style={{ color: '#065f46' }}>
            BAB UL ILM
          </div>
          <div className="print-subheader text-[10px]">K12 International School</div>
          <div className="print-subheader text-[10px]">SUI GAS CHOWK, MANANWALA</div>
          <div className="print-subheader text-[10px]">Contact: 03 111 747 333</div>
        </div>

        <div className="print-border-double border-t-2 border-double border-black my-2" />

        {/* Title */}
        <div className="text-center my-3">
          <div className="print-title font-bold text-sm">BOOK SALE RECEIPT</div>
        </div>

        <div className="print-border-dashed border-t border-dashed border-black my-2" />

        {/* Receipt Info */}
        <div className="space-y-1 mb-3">
          <div className="flex justify-between">
            <span>Receipt #:</span>
            <span className="font-bold">{saleNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>Date:</span>
            <span>{formatDate(saleDate)}</span>
          </div>
          <div className="flex justify-between">
            <span>Time:</span>
            <span>{formatDate(saleDate, true).split(' ').slice(1).join(' ')}</span>
          </div>
        </div>

        <div className="print-border-dashed border-t border-dashed border-black my-2" />

        {/* Customer Info */}
        <div className="mb-3">
          <div className="flex justify-between">
            <span>Customer:</span>
            <span className="font-bold text-right max-w-[50%] truncate">
              {customerType === 'student' && customerName ? customerName : 'Walk-in Customer'}
            </span>
          </div>
        </div>

        <div className="print-border-solid border-t border-black my-2" />

        {/* Items */}
        <div className="mb-3">
          <div className="font-bold mb-2">ITEMS:</div>
          {items.map((item, index) => (
            <div key={index} className="mb-2">
              <div className="font-medium">{item.name}</div>
              <div className="flex justify-between text-[10px]">
                <span>Rs.{item.price.toLocaleString()} × {item.quantity}</span>
                <span className="font-bold">Rs.{(item.price * item.quantity).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="print-border-double border-t-2 border-double border-black my-2" />

        {/* Total */}
        <div className="flex justify-between text-sm font-bold mb-3">
          <span>TOTAL:</span>
          <span>Rs.{totalAmount.toLocaleString()}</span>
        </div>

        <div className="print-border-dashed border-t border-dashed border-black my-2" />

        {/* Payment Method */}
        <div className="flex justify-between mb-4">
          <span>Payment:</span>
          <span className="font-bold uppercase">{paymentMethod.replace('_', ' ')}</span>
        </div>

        <div className="print-border-dashed border-t border-dashed border-black my-2" />

        {/* Footer */}
        <div className="text-center mt-4 space-y-1">
          <div className="font-bold text-emerald-800" style={{ color: '#065f46' }}>Thank you for your purchase!</div>
          <div className="text-[9px] text-gray-600">Please keep this receipt for your records</div>
          <div className="text-[9px] text-gray-500 mt-2">www.babulilm.edu.pk</div>
        </div>

        <div className="print-border-solid border-t border-black mt-4" />
        
        <div className="text-center text-[8px] text-gray-400 mt-2">
          {formatDate(new Date(), true)}
        </div>
      </div>
    );
  }
);

BookSetReceipt.displayName = 'BookSetReceipt';
