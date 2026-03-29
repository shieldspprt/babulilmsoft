import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, Package } from 'lucide-react';

const Billing = () => {
  const [credits] = useState(100);

  const packages = [
    { name: 'Starter', credits: 500, price: 5000 },
    { name: 'Standard', credits: 1200, price: 10000 },
    { name: 'Premium', credits: 3000, price: 20000 },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Billing & Credits</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-emerald-500" />
            Credit Balance: {credits}
          </CardTitle>
        </CardHeader>
      </Card>

      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Package className="h-5 w-5" />
        Credit Packages
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {packages.map((pkg) => (
          <Card key={pkg.name} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>{pkg.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-emerald-600">{pkg.credits}</p>
              <p className="text-sm text-gray-500">credits</p>
              <p className="mt-2 font-semibold">PKR {pkg.price.toLocaleString()}</p>
              <Button className="w-full mt-4">Buy Now</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Billing;
