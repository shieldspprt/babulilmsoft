import { Button } from "@/components/ui/button";
import { ArrowRight, School, Sparkles, Users, CreditCard, BarChart3, BookOpen } from "lucide-react";

const Hero = () => {
  const modules = [
    { icon: Users, title: "Student Enrollment", desc: "Complete student & parent records" },
    { icon: CreditCard, title: "Fee Collection", desc: "Track payments & generate receipts" },
    { icon: BarChart3, title: "Accounts", desc: "Income, expenses & categories" },
    { icon: BookOpen, title: "Class Management", desc: "Organize classes & sections" },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-32 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-sand/20 to-background -z-10" />
      
      <div className="max-w-5xl mx-auto text-center">
        <div className="mb-8 inline-block">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald/10 border border-emerald/20 rounded-full text-sm font-medium text-emerald">
            <Sparkles className="h-4 w-4" />
            Beta — 100 Credits Free Trial
          </span>
        </div>
        
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground mb-6 leading-tight tracking-tight">
          MultiSchool Platform
        </h1>
        
        <p className="text-xl sm:text-2xl text-emerald font-medium mb-4">
          Multi-Tenant School Management SaaS
        </p>
        
        <p className="text-base sm:text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Manage students, fees, attendance, and finances in one place. 
          Schools sign up independently, buy credits, and get isolated data security.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <Button size="lg" className="group" asChild>
            <a href="/signup">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a href="#modules">Explore Modules</a>
          </Button>
        </div>
        
        {/* Modules Grid */}
        <div id="modules" className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <div key={module.title} className="bg-card border rounded-xl p-6 text-left hover:border-emerald/50 transition-colors">
                <div className="w-10 h-10 bg-emerald/10 rounded-lg flex items-center justify-center mb-3">
                  <Icon className="h-5 w-5 text-emerald" />
                </div>
                <h3 className="font-semibold mb-1">{module.title}</h3>
                <p className="text-sm text-muted-foreground">{module.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Credit Pricing */}
        <div className="mt-16">
          <div className="bg-gradient-to-r from-emerald/10 via-emerald/5 to-emerald/10 border border-emerald/20 rounded-2xl p-8 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-4">
              <School className="h-6 w-6 text-emerald" />
              <span className="text-sm font-medium text-emerald uppercase tracking-wider">Credit System</span>
            </div>
            <h3 className="text-2xl font-bold mb-2">Pay As You Go</h3>
            <p className="text-muted-foreground mb-6">
              Start with 100 free trial credits. Top up when you need more.
            </p>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-background rounded-lg p-4">
                <div className="text-2xl font-bold text-emerald">500</div>
                <div className="text-sm text-muted-foreground">credits</div>
                <div className="text-xs font-medium mt-1">PKR 5,000</div>
              </div>
              <div className="bg-background rounded-lg p-4 border-2 border-emerald">
                <div className="text-2xl font-bold text-emerald">1,200</div>
                <div className="text-sm text-muted-foreground">credits</div>
                <div className="text-xs font-medium mt-1">PKR 10,000</div>
              </div>
              <div className="bg-background rounded-lg p-4">
                <div className="text-2xl font-bold text-emerald">3,000</div>
                <div className="text-sm text-muted-foreground">credits</div>
                <div className="text-xs font-medium mt-1">PKR 20,000</div>
              </div>
            </div>
            <Button size="lg" className="w-full sm:w-auto" asChild>
              <a href="/signup">
                Get Started Free →
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
