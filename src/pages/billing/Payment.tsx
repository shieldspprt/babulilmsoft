import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Banknote, Smartphone, Upload, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const paymentMethods = [
  { id: 'bank_transfer', name: 'Bank Transfer', icon: Banknote },
  { id: 'easypaisa', name: 'EasyPaisa', icon: Smartphone },
  { id: 'jazzcash', name: 'JazzCash', icon: Smartphone },
];

const packages = [
  { id: 'starter', name: 'Starter', credits: 500, price: 5000 },
  { id: 'standard', name: 'Standard', credits: 1200, price: 10000 },
  { id: 'premium', name: 'Premium', credits: 3000, price: 20000 },
];

const Payment = () => {
  const [formData, setFormData] = useState({
    packageId: '',
    method: '',
    reference: '',
    amount: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: Submit to Supabase
    await new Promise(r => setTimeout(r, 1000));
    setSubmitted(true);
    toast.success('Payment submitted for verification');
    setLoading(false);
  };

  const selectedPkg = packages.find(p => p.id === formData.packageId);

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <Upload className="h-8 w-8 text-emerald-600" />
            </div>
            <CardTitle>Payment Submitted</CardTitle>
            <CardDescription>
              Your payment is under verification. Credits will be added within 24 hours.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/dashboard'} className="w-full">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Buy Credits</h1>
        <p className="text-gray-500 mb-6">Select a package and submit your payment</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {packages.map((pkg) => (
            <Card
              key={pkg.id}
              className={`cursor-pointer transition-all ${
                formData.packageId === pkg.id ? 'ring-2 ring-emerald-500' : ''
              }`}
              onClick={() => setFormData({ ...formData, packageId: pkg.id })}
            >
              <CardContent className="p-4">
                <h3 className="font-bold">{pkg.name}</h3>
                <p className="text-2xl font-bold text-emerald-600">{pkg.credits}</p>
                <p className="text-sm text-gray-500">credits</p>
                <p className="mt-2 font-semibold">PKR {pkg.price.toLocaleString()}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedPkg && (
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
              <CardDescription>
                Pay PKR {selectedPkg.price.toLocaleString()} for {selectedPkg.credits} credits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Payment Instructions
                  </h4>
                  <p className="text-sm text-blue-800 mt-2">
                    Bank: Habib Bank Limited (HBL)<br />
                    Account: BAB UL ILM Software<br />
                    Account #: 0123-45678901234
                  </p>
                  <p className="text-sm text-blue-800 mt-2">
                    EasyPaisa: 0311-1747333<br />
                    JazzCash: 0311-1747333
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select
                    value={formData.method}
                    onValueChange={(v) => setFormData({ ...formData, method: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Transaction Reference #</Label>
                  <Input
                    placeholder="e.g., TRX123456789"
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Amount Paid (PKR)</Label>
                  <Input
                    type="number"
                    placeholder="5000"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={loading || !formData.method}>
                  {loading ? 'Submitting...' : 'Submit Payment for Verification'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Payment;
