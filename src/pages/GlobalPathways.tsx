import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, GraduationCap, Users, Brain, Award, BookOpen } from "lucide-react";

const GlobalPathways = () => {
  const pathways = [
    {
      icon: Globe,
      title: "Canadian Framework",
      description: "Our curriculum follows Canadian teaching methodology, ensuring world-class educational standards while remaining culturally grounded in Pakistan."
    },
    {
      icon: GraduationCap,
      title: "University Preparation",
      description: "Comprehensive guidance for admission into leading universities in the US, Canada, UK, China, and Singapore with scholarship mentorship."
    },
    {
      icon: Users,
      title: "Global Partnerships",
      description: "Developing academic partnerships with institutions in Canada, UK, and Singapore for cultural exchange and collaborative learning."
    },
    {
      icon: Brain,
      title: "AI & Digital Readiness",
      description: "Advanced digital learning tools, robotics, and AI readiness programs preparing students for 21st-century careers."
    },
    {
      icon: BookOpen,
      title: "English Immersion",
      description: "Complete English language mastery through immersive learning environment and communication-focused curriculum."
    },
    {
      icon: Award,
      title: "International Standards",
      description: "Globally benchmarked K-12 education producing graduates ready to compete and lead on the world stage."
    }
  ];

  return (
    <main className="min-h-screen pt-16">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              From Mananwala to the World
            </h1>
            <p className="text-xl text-muted-foreground mb-4 font-urdu">
              رہبر ترقی و کمال — Leading the Way in Faith and Excellence
            </p>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Bab ul ilm connects Pakistan's small-town talent to global opportunities, 
              preparing students for top universities worldwide while maintaining strong Islamic values.
            </p>
          </div>
        </div>
      </section>

      {/* Pathways Grid */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pathways.map((pathway, index) => {
              const Icon = pathway.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle>{pathway.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {pathway.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Target Universities */}
      <section className="py-16 bg-gradient-to-br from-secondary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8 text-foreground">
              Target Universities
            </h2>
            <Card>
              <CardHeader>
                <CardTitle>Preparing for Global Excellence</CardTitle>
                <CardDescription>
                  Our academic program is designed to prepare students for admission into 
                  leading universities worldwide
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold mb-2">🇺🇸 United States</h3>
                    <p className="text-sm text-muted-foreground">
                      Top-tier institutions including Ivy League and leading research universities
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold mb-2">🇨🇦 Canada</h3>
                    <p className="text-sm text-muted-foreground">
                      Premier Canadian universities with strong STEM and business programs
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold mb-2">🇬🇧 United Kingdom</h3>
                    <p className="text-sm text-muted-foreground">
                      Historic institutions known for academic excellence and innovation
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold mb-2">🇨🇳 China & 🇸🇬 Singapore</h3>
                    <p className="text-sm text-muted-foreground">
                      Leading Asian universities in technology, engineering, and business
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Vision Statement */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-2xl font-semibold text-foreground mb-4">
              "Our students are prepared to enter top universities and later work for 
              leading global organizations, while embodying faith and cultural dignity."
            </p>
            <p className="text-lg text-muted-foreground font-urdu">
              لب پہ آتی ہے دعا بن کے تمنا میری
            </p>
            <p className="text-sm text-muted-foreground italic">
              "May My Life Be a Light for My Nation"
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default GlobalPathways;
