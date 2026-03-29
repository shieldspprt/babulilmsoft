import { MobileBottomSheet } from './MobileBottomSheet';
import { Receipt } from '@/components/fee-collection/Receipt';
import { Button } from '@/components/ui/button';
import { Send, Share2, Download } from 'lucide-react';
import { useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface MobileReceiptSheetProps {
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
      amount: number;
      description?: string;
    }>;
    paymentDate: string;
    paymentMethod: string;
    notes?: string;
    months?: string[];
  } | null;
}

export function MobileReceiptSheet({ open, onOpenChange, receiptData }: MobileReceiptSheetProps) {
  const [isExporting, setIsExporting] = useState(false);

  if (!receiptData) return null;

  const formatPhoneForWhatsApp = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('0')) {
      return '92' + digits.substring(1);
    }
    if (digits.startsWith('92')) {
      return digits;
    }
    return '92' + digits;
  };

  const generateReceiptText = () => {
    const totalDue = receiptData.previousBalance + receiptData.totalCharged;
    
    let message = `*BAB UL ILM*\nK12 International School\nSUI GAS CHOWK, MANANWALA\n`;
    message += `- - - - - - - - - - - - - - - - - - -\n\n`;
    message += `*FEE RECEIPT*\n\n`;
    message += `#${receiptData.transactionNumber.slice(-8)}\n`;
    message += `${receiptData.paymentDate}\n`;
    message += `_____________________________\n\n`;
    message += `*Parent:* ${receiptData.parentName}\n`;
    message += `*Phone:* ${receiptData.phone}\n`;
    
    if (receiptData.months && receiptData.months.length > 0) {
      message += `*Period:* ${receiptData.months.join(', ')}\n`;
    }
    
    message += `_____________________________\n\n`;
    message += `*ITEMS:*\n`;
    
    receiptData.students.forEach(student => {
      const spaces = ' '.repeat(Math.max(1, 30 - student.name.length));
      message += `${student.name}${spaces}*Rs.${Math.round(student.amount).toLocaleString()}*\n`;
    });
    
    message += `\n`;
    
    if (receiptData.previousBalance !== 0) {
      message += `Previous Balance:           Rs.${Math.round(Math.abs(receiptData.previousBalance)).toLocaleString()}\n`;
    }
    
    message += `New Charges:                Rs.${Math.round(receiptData.totalCharged).toLocaleString()}\n`;
    message += `_____________________________\n`;
    message += `*TOTAL DUE:                  Rs.${Math.round(totalDue).toLocaleString()}*\n`;
    message += `- - - - - - - - - - - - - - - - - - -\n\n`;
    message += `*PAID:                         Rs.${Math.round(receiptData.cashReceived).toLocaleString()}*\n\n`;
    
    const balanceLabel = receiptData.newBalance > 0 ? 'BALANCE DUE:' : receiptData.newBalance < 0 ? 'CREDIT:' : 'BALANCE:';
    message += `*${balanceLabel.padEnd(27)}Rs.${Math.round(Math.abs(receiptData.newBalance)).toLocaleString()}*\n`;
    message += `_____________________________\n\n`;
    message += `Payment via: *${receiptData.paymentMethod.replace('_', ' ').toUpperCase()}*\n\n`;
    
    if (receiptData.notes) {
      message += `*Note:* ${receiptData.notes}\n\n`;
    }
    
    message += `*Thank you for your payment!*\n`;
    message += `Contact: 03 111 747 333\n`;
    message += `=============================`;
    
    return message;
  };

  const handleWhatsApp = () => {
    const formattedPhone = formatPhoneForWhatsApp(receiptData.phone);
    const message = generateReceiptText();
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Fee Receipt',
          text: generateReceiptText(),
        });
      } catch (err) {
        console.log('Share cancelled or failed:', err);
      }
    } else {
      handleWhatsApp();
    }
  };

  return (
    <MobileBottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Payment Receipt"
      description="Share this receipt with the parent"
    >
      <div className="mb-6">
        <Receipt {...receiptData} />
      </div>

      <div className="flex flex-col gap-3 sticky bottom-0 bg-background pt-4 pb-2">
        <Button 
          onClick={handleWhatsApp} 
          className="w-full h-12 text-base bg-emerald hover:bg-emerald/90 text-primary-foreground shadow-md touch-feedback"
        >
          <Send className="mr-2 h-5 w-5" />
          Send to WhatsApp
        </Button>
        
        <Button 
          onClick={handleExportPDF}
          disabled={isExporting}
          variant="outline"
          className="w-full h-12 text-base shadow-sm touch-feedback"
        >
          <Download className="mr-2 h-5 w-5" />
          {isExporting ? 'Exporting...' : 'Download PDF'}
        </Button>
        
        {navigator.share && (
          <Button 
            onClick={handleShare} 
            variant="outline"
            className="w-full h-12 text-base shadow-sm touch-feedback"
          >
            <Share2 className="mr-2 h-5 w-5" />
            Share Receipt
          </Button>
        )}
        
        <Button 
          onClick={() => onOpenChange(false)} 
          variant="outline"
          className="w-full h-12 text-base touch-feedback"
        >
          Close
        </Button>
      </div>
    </MobileBottomSheet>
  );
}
