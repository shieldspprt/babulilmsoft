import { MapPin, Phone, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const Contact = () => {
  const contactInfo = [
    {
      icon: MapPin,
      title: "Location",
      details: "Sui Gas Chowk, Mananwala",
      subtitle: "Pakistani Punjab",
    },
    {
      icon: Phone,
      title: "Contact",
      details: "03 111 747 333",
      subtitle: "WhatsApp Available",
    },
    {
      icon: Globe,
      title: "Website",
      details: "www.bab-ul-ilm.com",
      subtitle: "Visit us online",
    },
  ];

  return (
    <section id="contact" className="py-24 px-4 sm:px-6 lg:px-8 bg-card">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Begin Your Journey
          </h2>
          <p className="text-xl text-emerald mb-4 font-arabic">
            علم کا سفر شروع کریں
          </p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join a legacy that has been lighting paths for 50 years — where faith meets knowledge, and tradition embraces the future
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

        {/* Map Section */}
        <div className="mb-12">
          <Card className="overflow-hidden border-2">
            <CardContent className="p-0">
              <div className="relative w-full h-[400px] md:h-[500px]">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3398.6850955127675!2d73.6877102!3d31.587682299999994!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x22b647f9050dbbe1%3A0xd36aaa1486c170b3!2sBAB%20UL%20ILM%20-%20k12%20International%20School!5e0!3m2!1sen!2s!4v1760677677453!5m2!1sen!2s"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="BAB UL ILM Location - Sui Gas Chowk, Mananwala"
                  className="w-full h-full"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="max-w-2xl mx-auto bg-gradient-to-br from-emerald/5 to-gold/5 rounded-3xl p-8 sm:p-12 text-center border-2 border-emerald/10">
          <h3 className="text-2xl font-bold text-foreground mb-4">
            Open the Gates of Knowledge
          </h3>
          <p className="text-muted-foreground mb-6">
            "Education is worship" — Join us in continuing a 50-year legacy where children grow with <span className="text-emerald font-semibold">faith in heart</span>, <span className="text-emerald font-semibold">curiosity in mind</span>, and <span className="text-emerald font-semibold">kindness in action</span>.
          </p>
          <p className="text-sm text-muted-foreground mb-8 italic">
            Fee concessions available for Hifz students, orphans, and families in need — because education is a right, not a privilege.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <a href="https://wa.me/03111747333" target="_blank" rel="noopener noreferrer">
                WhatsApp Us
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="/fees">View Fee Concessions</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
