import { Mail, Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const Contact = () => {
  const contactInfo = [
    {
      icon: Mail,
      title: "Email Support",
      details: "support@multischool.app",
      subtitle: "24-48 hour response time",
    },
    {
      icon: Phone,
      title: "Phone Support",
      details: "+92 311 1747333",
      subtitle: "Mon-Sat, 9AM-6PM PKT",
    },
    {
      icon: MessageCircle,
      title: "WhatsApp",
      details: "+92 311 1747333",
      subtitle: "Quick replies available",
    },
  ];

  return (
    <section id="contact" className="py-24 px-4 sm:px-6 lg:px-8 bg-card">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Get in Touch
          </h2>
          <p className="text-lg text-emerald font-medium mb-2">
            We're here to help your school succeed
          </p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Have questions about the platform, credit system, or need technical support? 
            Our team is ready to assist you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {contactInfo.map((info) => {
            const Icon = info.icon;
            return (
              <Card key={info.title} className="border-2">
                <CardContent className="pt-8 pb-6 text-center">
                  <div className="w-16 h-16 bg-emerald/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-emerald" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{info.title}</h3>
                  <p className="text-foreground font-medium mb-1">{info.details}</p>
                  <p className="text-sm text-muted-foreground">{info.subtitle}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="max-w-2xl mx-auto bg-gradient-to-br from-emerald/5 to-emerald/10 rounded-3xl p-8 sm:p-12 text-center border-2 border-emerald/10">
          <h3 className="text-2xl font-bold text-foreground mb-4">
            Start Your Free Trial Today
          </h3>
          <p className="text-muted-foreground mb-6">
            Get <span className="text-emerald font-semibold">100 free credits</span> to explore all modules. 
            No credit card required. Upgrade anytime when you need more.
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            Join schools across Pakistan using MultiSchool to simplify their administration.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <a href="/signup">
                Start Free Trial
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="https://wa.me/923111747333" target="_blank" rel="noopener noreferrer">
                WhatsApp Us
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
