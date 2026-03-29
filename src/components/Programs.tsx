import { Users, CreditCard, BarChart3, BookOpen, GraduationCap, Wallet, FileText, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const Programs = () => {
  const modules = [
    {
      icon: Users,
      title: "Student & Parent Records",
      description: "Complete enrollment management with student profiles, parent contacts, admission tracking, and document storage with search and filter capabilities.",
    },
    {
      icon: CreditCard,
      title: "Fee Collection & Receipts",
      description: "Track fee payments, generate receipts, manage fee structures by class, handle concessions, and view payment history with automatic calculations.",
    },
    {
      icon: Wallet,
      title: "Accounts & Finance",
      description: "Record income and expenses, manage categories, track cash flow, generate financial reports, and maintain audit trails for all transactions.",
    },
    {
      icon: GraduationCap,
      title: "Teacher Management",
      description: "Manage teacher profiles, assignments, classes taught, contact information, and track teacher-related records in one centralized place.",
    },
    {
      icon: BookOpen,
      title: "Class & Section Management",
      description: "Organize classes, sections, student assignments, class-wise fee structures, and handle class promotions with bulk operations.",
    },
    {
      icon: Package,
      title: "Supplier & Book Sales",
      description: "Manage supplier transactions, purchase records, book inventory, sales tracking, and generate supplier ledgers with payment history.",
    },
    {
      icon: BarChart3,
      title: "Reports & Analytics",
      description: "Generate comprehensive reports for collections, expenses, student statistics, financial summaries with export to Excel/CSV capabilities.",
    },
    {
      icon: FileText,
      title: "Balance Write-off",
      description: "Handle fee adjustments, write-off balances, and manage special cases with proper approval workflows and audit logging.",
    },
  ];

  const creditPackages = [
    {
      credits: 500,
      price: "PKR 5,000",
      features: [
        "~500 student actions",
        "Fee collections & receipts",
        "Reports & exports",
        "Email support",
      ],
      popular: false,
    },
    {
      credits: 1200,
      price: "PKR 10,000",
      features: [
        "~1,200 student actions",
        "All core modules included",
        "Priority support",
        "Bulk operations",
      ],
      popular: true,
    },
    {
      credits: 3000,
      price: "PKR 20,000",
      features: [
        "~3,000 student actions",
        "All features unlocked",
        "Dedicated support",
        "Custom integrations",
      ],
      popular: false,
    },
  ];

  return (
    <section id="programs" className="py-24 px-4 sm:px-6 lg:px-8 bg-card">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Complete School Management
          </h2>
          <p className="text-lg text-emerald font-medium mb-2">
            All modules your school needs in one platform
          </p>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            MultiSchool provides a comprehensive suite of tools for managing students, 
            fees, accounts, and reporting — with multi-tenant support for unlimited schools.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Card key={module.title} className="border-2 hover:border-emerald transition-colors h-full">
                <CardContent className="pt-6 pb-6">
                  <div className="w-12 h-12 bg-emerald/10 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-emerald" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{module.title}</h3>
                  <p className="text-sm text-muted-foreground">{module.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Credit Packages */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Credit Packages
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Buy credits to use any module. Start with 100 free trial credits.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {creditPackages.map((pkg) => (
            <Card key={pkg.credits} className={`border-2 ${pkg.popular ? 'border-emerald relative' : ''} flex flex-col`}>
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-emerald text-white text-sm font-medium rounded-full">
                  Most Popular
                </div>
              )}
              <CardContent className="p-8 flex-1 flex flex-col">
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-emerald mb-1">{pkg.credits}</div>
                  <div className="text-sm text-muted-foreground">credits</div>
                  <div className="text-2xl font-semibold mt-3">{pkg.price}</div>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {pkg.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <span className="inline-block w-2 h-2 bg-emerald rounded-full mt-2 mr-3 flex-shrink-0" />
                      <span className="text-foreground/80 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="/signup"
                  className={`w-full text-center py-3 rounded-lg font-medium transition-colors ${
                    pkg.popular
                      ? 'bg-emerald text-white hover:bg-emerald/90'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  Get Started
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Programs;
