import { Building2, Phone, MapPin, Edit, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SupplierCardProps {
  supplier: any;
  onEdit: (supplier: any) => void;
  onRefresh: () => void;
}

export function SupplierCard({ supplier, onEdit }: SupplierCardProps) {
  const balance = Number(supplier.current_balance);
  const isDue = balance > 0;
  const isAdvance = balance < 0;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg">{supplier.name}</CardTitle>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {supplier.business_name}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onEdit(supplier)}>
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-3 w-3 text-muted-foreground" />
            <span>{supplier.contact}</span>
          </div>
          {supplier.address && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="line-clamp-1">{supplier.address}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-sm text-muted-foreground">ID: {supplier.supplier_id}</span>
          <Badge variant={supplier.is_active ? "default" : "secondary"}>
            {supplier.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Balance:</span>
            <div className="flex items-center gap-2">
              {isDue && <TrendingUp className="h-4 w-4 text-destructive" />}
              {isAdvance && <TrendingDown className="h-4 w-4 text-green-600" />}
              <span className={`text-lg font-bold ${
                isDue ? 'text-destructive' : isAdvance ? 'text-green-600' : 'text-foreground'
              }`}>
                Rs. {Math.abs(balance).toLocaleString()}
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-right mt-1">
            {isDue && 'Payable (We owe them)'}
            {isAdvance && 'Receivable (They owe us)'}
            {balance === 0 && 'Settled'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
          <div>
            <span className="text-muted-foreground">Total Billed:</span>
            <p className="font-medium">Rs. {Number(supplier.total_billed).toLocaleString()}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Total Paid:</span>
            <p className="font-medium">Rs. {Number(supplier.total_paid).toLocaleString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
