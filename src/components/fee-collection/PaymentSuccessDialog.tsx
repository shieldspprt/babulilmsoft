import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Receipt as ReceiptComponent } from './Receipt';
import { Send, Printer, Download } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface PaymentSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receiptData: {
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
  };
}

export const PaymentSuccessDialog = ({
  open,
  onOpenChange,
  receiptData
}: PaymentSuccessDialogProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const printContainerRef = useRef<HTMLDivElement | null>(null);

  // Create a hidden print container outside of any dialogs
  useEffect(() => {
    if (!printContainerRef.current) {
      const container = document.createElement('div');
      container.id = 'print-container';
      container.style.cssText = 'position: fixed; left: -9999px; top: 0; visibility: hidden;';
      document.body.appendChild(container);
      printContainerRef.current = container;
    }
    return () => {
      if (printContainerRef.current && printContainerRef.current.parentNode) {
        printContainerRef.current.parentNode.removeChild(printContainerRef.current);
        printContainerRef.current = null;
      }
    };
  }, []);

  const handlePrint = () => {
    const receiptElement = document.getElementById('receipt-print-area');
    if (!receiptElement || !printContainerRef.current) return;
    
    // Clone the receipt
    const clone = receiptElement.cloneNode(true) as HTMLElement;
    clone.id = 'receipt-print-clone';
    clone.style.cssText = '';
    
    // Clear and add to print container
    printContainerRef.current.innerHTML = '';
    printContainerRef.current.appendChild(clone);
    
    // Add print-specific styles
    const style = document.createElement('style');
    style.id = 'print-only-styles';
    style.textContent = `
      @media print {
        body > *:not(#print-container) { display: none !important; }
        #print-container { 
          position: fixed !important; 
          left: 0 !important; 
          top: 0 !important; 
          visibility: visible !important;
          width: 80mm !important;
          background: white !important;
        }
        #receipt-print-clone {
          display: block !important;
          visibility: visible !important;
          width: 80mm !important;
          padding: 3mm !important;
          background: white !important;
          color: black !important;
          font-family: 'Courier New', Courier, monospace !important;
        }
        #receipt-print-clone * { 
          visibility: visible !important; 
          color: black !important;
        }
      }
    `;
    document.head.appendChild(style);
    
    // Make container visible for print
    printContainerRef.current.style.visibility = 'visible';
    printContainerRef.current.style.left = '0';
    
    // Print
    window.print();
    
    // Cleanup
    setTimeout(() => {
      if (printContainerRef.current) {
        printContainerRef.current.style.visibility = 'hidden';
        printContainerRef.current.style.left = '-9999px';
        printContainerRef.current.innerHTML = '';
      }
      const styleEl = document.getElementById('print-only-styles');
      if (styleEl) styleEl.remove();
    }, 100);
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const receiptElement = document.getElementById('receipt-print-area');
      if (!receiptElement) {
        console.error('Receipt element not found');
        return;
      }

      const canvas = await html2canvas(receiptElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      
      // 80mm width = ~226 points at 72 DPI
      const pdfWidth = 80;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [pdfWidth, pdfHeight]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`receipt-${receiptData.transactionNumber.slice(-8)}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleWhatsApp = () => {
    const safePhone = receiptData.phone.replace(/\D/g, '');
    
    // Format payment method nicely
    const paymentMethodDisplay = receiptData.paymentMethod
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    // Calculate totals
    const totalDue = receiptData.previousBalance + receiptData.totalCharged;
    
    // Build message matching receipt format
    let message = `*BAB UL ILM*\n`;
    message += `K12 International School\n`;
    message += `SUI GAS CHOWK, MANANWALA\n`;
    message += `- - - - - - - - - - - - - - - - - - -\n\n`;
    message += `*FEE RECEIPT*\n\n`;
    message += `#${receiptData.transactionNumber.slice(-8)}\n`;
    message += `${receiptData.paymentDate}\n`;
    message += `_____________________________\n\n`;
    
    message += `*Parent:* ${receiptData.parentName}\n`;
    message += `*Phone:* ${receiptData.phone}\n`;
    
    if (receiptData.months && receiptData.months.length > 0) {
      message += `*Period:* ${receiptData.months.join(', ')}\n`;
    } else if (receiptData.collectionName) {
      message += `*Collection:* ${receiptData.collectionName}\n`;
    }
    
    message += `_____________________________\n\n`;
    
    message += `*ITEMS:*\n`;
    receiptData.students.forEach((student) => {
      message += `${student.name}                 *Rs.${Math.round(student.amount).toLocaleString()}*\n`;
    });
    
    message += `\n`;
    
    if (receiptData.previousBalance !== 0) {
      message += `Previous Balance:           Rs.${Math.round(receiptData.previousBalance).toLocaleString()}\n`;
    }
    message += `New Charges:                Rs.${Math.round(receiptData.totalCharged).toLocaleString()}\n`;
    message += `_____________________________\n`;
    message += `*TOTAL DUE:                  Rs.${Math.round(totalDue).toLocaleString()}*\n`;
    message += `- - - - - - - - - - - - - - - - - - -\n\n`;
    
    message += `*PAID:                         Rs.${Math.round(receiptData.cashReceived).toLocaleString()}*\n\n`;
    
    const balanceLabel = receiptData.newBalance > 0 
      ? 'BALANCE DUE:' 
      : receiptData.newBalance < 0 
        ? 'CREDIT:' 
        : 'BALANCE:';
    message += `*${balanceLabel}                    Rs.${Math.round(Math.abs(receiptData.newBalance)).toLocaleString()}*\n`;
    message += `_____________________________\n\n`;
    
    message += `Payment via: *${paymentMethodDisplay}*\n\n`;
    
    if (receiptData.notes) {
      message += `*Note:* ${receiptData.notes}\n\n`;
    }
    
    message += `*Thank you for your payment!*\n`;
    message += `Contact: 03 111 747 333\n`;
    message += `=============================`;
    
    const whatsappUrl = `https://wa.me/${safePhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payment Recorded Successfully</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <ReceiptComponent {...receiptData} />
          
          <div className="flex gap-3 justify-end print:hidden">
            <Button variant="outline" onClick={handleWhatsApp}>
              <Send className="mr-2 h-4 w-4" />
              WhatsApp
            </Button>
            <Button variant="outline" onClick={handleExportPDF} disabled={isExporting}>
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? 'Exporting...' : 'PDF'}
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
