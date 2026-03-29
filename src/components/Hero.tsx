import { Button } from "@/components/ui/button";
import { ArrowRight, School, Sparkles } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-32 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-sand/20 to-background -z-10" />
      
      <div className="max-w-5xl mx-auto text-center">
        <div className="mb-8 inline-block">
          <span className="inline-block px-4 py-2 bg-emerald/10 border border-emerald/20 rounded-full text-sm font-medium text-emerald">
            K12 International School Mananwala
          </span>
        </div>
        
        <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold text-foreground mb-6 leading-tight tracking-tight">
          BAB UL ILM
        </h1>
        
        <div className="mb-4 text-xl sm:text-2xl text-emerald font-arabic">
          رہبر ترقی و کمال
        </div>
        
        <p className="text-base sm:text-lg text-muted-foreground mb-4 max-w-3xl mx-auto italic">
          Leading the Way in Faith and Excellence
        </p>
        
        <div className="mb-6 text-xl sm:text-2xl text-emerald font-arabic leading-relaxed">
          قرآن کی روشنی، علم کی قوت، اور سائنس کا سفر
        </div>
        
        <p className="text-base sm:text-lg text-muted-foreground mb-12 max-w-3xl mx-auto">
          The Light of Quran, the Power of Knowledge, and the Journey of Science
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <Button size="lg" className="group" asChild>
            <a href="#programs">
              Explore Programs
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a href="https://wa.me/923111747333?text=Hello%2C%20I%20would%20like%20to%20know%20more%20about%20BAB%20UL%20ILM%20School" target="_blank" rel="noopener noreferrer">Contact Us</a>
          </Button>
        </div>
        
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald mb-2">50 Years</div>
            <div className="text-sm text-muted-foreground">Living Legacy of Excellence</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald mb-2">Global Pathways</div>
            <div className="text-sm text-muted-foreground">From Mananwala to the World</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald mb-2">Canadian Framework</div>
            <div className="text-sm text-muted-foreground">International Standards</div>
          </div>
        </div>

        {/* SaaS CTA Section */}
        <div className="mt-20 mb-8">
          <div className="bg-gradient-to-r from-emerald/10 via-emerald/5 to-emerald/10 border border-emerald/20 rounded-2xl p-8 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-4">
              <School className="h-6 w-6 text-emerald" />
              <span className="text-sm font-medium text-emerald uppercase tracking-wider">For Schools</span>
            </div>
            <h3 className="text-2xl font-bold mb-2">School Management Software</h3>
            <p className="text-muted-foreground mb-4">
              Manage students, fees, attendance, and finances in one place.
              <br />
              <span className="inline-flex items-center gap-1 text-emerald font-medium">
                <Sparkles className="h-4 w-4" />
                Start free trial — 100 credits, 14 days
              </span>
            </p>
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
