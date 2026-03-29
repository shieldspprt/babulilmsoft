import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const Fees = () => {
  const concessions = [
    {
      category: "Hifz-e-Quran",
      description: "Students enrolled in or having completed Hifz program",
      benefit: "Significant fee reduction",
    },
    {
      category: "Orphans",
      description: "Children who have lost one or both parents",
      benefit: "Special consideration and support",
    },
    {
      category: "Teacher's Children",
      description: "Sons and daughters of teaching staff",
      benefit: "Educational staff benefit",
    },
    {
      category: "Imam's Children",
      description: "Sons and daughters of Masjid Imams",
      benefit: "Community leadership support",
    },
    {
      category: "Staff Concession",
      description: "Children of school staff members",
      benefit: "Employee benefit program",
    },
    {
      category: "Needy Families",
      description: "Families facing economic hardship",
      benefit: "Need-based financial aid",
    },
    {
      category: "Sibling Discount",
      description: "Multiple children from same family",
      benefit: "Family enrollment benefit",
    },
    {
      category: "Family Based",
      description: "Extended family members enrolled together",
      benefit: "Multi-family support",
    },
    {
      category: "Location Based",
      description: "Residents from nearby areas",
      benefit: "Community support program",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-grow pt-20">
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-background via-sand/20 to-background">
          <div className="max-w-7xl mx-auto">
            <Button variant="ghost" asChild className="mb-8">
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>

            <div className="text-center mb-12">
              <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
                Fee Concession Programs
              </h1>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                At BAB UL ILM, we believe education is a right, not a privilege. We offer comprehensive fee concession programs to ensure quality education is accessible to all deserving students.
              </p>
            </div>

            <div className="mb-12 bg-emerald/5 border-2 border-emerald/20 rounded-2xl p-8 text-center">
              <h2 className="text-2xl font-bold text-foreground mb-4">Our Commitment</h2>
              <p className="text-foreground/80 max-w-2xl mx-auto">
                We are dedicated to supporting students from all backgrounds. Our fee concession programs are designed to remove financial barriers and ensure every child has access to quality Islamic education and academic excellence.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {concessions.map((concession) => (
                <Card key={concession.category} className="border-2 hover:border-primary transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{concession.category}</CardTitle>
                      <CheckCircle className="w-5 h-5 text-emerald flex-shrink-0 mt-1" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      {concession.description}
                    </p>
                    <div className="inline-block px-3 py-1 bg-gold/10 text-gold text-xs font-medium rounded-full">
                      {concession.benefit}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-2 border-primary/20 bg-gradient-to-br from-card to-sand/10">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-foreground mb-4 text-center">
                  How to Apply
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-emerald/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-emerald font-bold">1</span>
                    </div>
                    <h4 className="font-semibold mb-2">Contact Us</h4>
                    <p className="text-sm text-muted-foreground">
                      Reach out via WhatsApp or visit our office
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-emerald/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-emerald font-bold">2</span>
                    </div>
                    <h4 className="font-semibold mb-2">Submit Documents</h4>
                    <p className="text-sm text-muted-foreground">
                      Provide required documentation for verification
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-emerald/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-emerald font-bold">3</span>
                    </div>
                    <h4 className="font-semibold mb-2">Get Approved</h4>
                    <p className="text-sm text-muted-foreground">
                      Receive confirmation and enrollment details
                    </p>
                  </div>
                </div>
                <div className="text-center">
                  <Button size="lg" asChild>
                    <a href="https://wa.me/03111747333" target="_blank" rel="noopener noreferrer">
                      Apply for Concession
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Fees;
