import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ImageProtection from "@/components/ImageProtection";
import { Card, CardContent } from "@/components/ui/card";
import { Shirt, Phone, Mail } from "lucide-react";
import boysSummer from "@/assets/boys-summer-uniform.png";
import boysWinter1 from "@/assets/boys-winter-uniform-1.png";
import boysWinter2 from "@/assets/boys-winter-uniform-2.png";
import boysWinter3 from "@/assets/boys-winter-uniform-3.png";
import girls1 from "@/assets/girls-uniform-1.png";
import girls2 from "@/assets/girls-uniform-2.png";
import girls3 from "@/assets/girls-uniform-3.png";

const Uniforms = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navigation />
      
      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <div className="text-center animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
              <Shirt className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Bab ul ilm Uniforms
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Our school uniforms reflect our commitment to modesty, professionalism, and unity. 
              Designed for comfort and style, they represent the values of BAB UL ILM K12 International School.
            </p>
          </div>
        </section>

        {/* Boys Uniforms Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
          <div className="mb-12 animate-fade-in">
            <h2 className="text-3xl font-bold text-foreground mb-4 text-center">
              Boys' Uniforms
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-primary to-accent mx-auto mb-8"></div>
          </div>

          {/* Summer Uniform */}
          <div className="mb-16">
            <h3 className="text-2xl font-semibold text-foreground mb-6 flex items-center gap-2">
              <span className="text-accent">☀️</span> Summer Uniform
            </h3>
            <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 animate-fade-in">
              <CardContent className="p-8">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div className="flex justify-center">
                    <ImageProtection
                      src={boysSummer}
                      alt="BAB UL ILM boys summer uniform - navy blue polo with khaki collar"
                      className="rounded-lg w-full max-w-md object-cover"
                    />
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-xl font-semibold text-foreground mb-4">Uniform Components:</h4>
                    <ul className="space-y-3 text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span><strong className="text-foreground">Shirt:</strong> Grey short sleeve polo shirt with khaki collar and cuffs</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span><strong className="text-foreground">Logo:</strong> Emerald green school logo embroidered on chest</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span><strong className="text-foreground">Pants:</strong> Khaki trousers</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span><strong className="text-foreground">Footwear:</strong> Black shoes with white socks</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Winter Uniform */}
          <div>
            <h3 className="text-2xl font-semibold text-foreground mb-6 flex items-center gap-2">
              <span className="text-accent">❄️</span> Winter Uniform
            </h3>
            <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 animate-fade-in">
              <CardContent className="p-8">
                <div className="grid md:grid-cols-4 gap-6 mb-6">
                  <div className="flex justify-center">
                    <ImageProtection
                      src={boysWinter1}
                      alt="BAB UL ILM boys winter uniform - navy blue long sleeve polo"
                      className="rounded-lg w-full object-cover"
                    />
                  </div>
                  <div className="flex justify-center">
                    <ImageProtection
                      src={boysWinter2}
                      alt="BAB UL ILM boys winter uniform - with varsity jacket"
                      className="rounded-lg w-full object-cover"
                    />
                  </div>
                  <div className="flex justify-center">
                    <ImageProtection
                      src={boysWinter3}
                      alt="BAB UL ILM boys winter jacket - navy blue with khaki trim"
                      className="rounded-lg w-full object-cover"
                    />
                  </div>
                  <div className="space-y-4 flex flex-col justify-center">
                    <h4 className="text-xl font-semibold text-foreground">Uniform Components:</h4>
                    <ul className="space-y-3 text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span><strong className="text-foreground">Shirt:</strong> Grey long sleeve polo with khaki collar and cuffs</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span><strong className="text-foreground">Jacket:</strong> Grey jacket with khaki trim</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span><strong className="text-foreground">Pants:</strong> Khaki trousers</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span><strong className="text-foreground">Accessories:</strong> School backpack with emerald green accents</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Girls Uniforms Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
          <div className="mb-12 animate-fade-in">
            <h2 className="text-3xl font-bold text-foreground mb-4 text-center">
              Girls' Uniforms
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-primary to-accent mx-auto mb-8"></div>
          </div>

          <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 animate-fade-in">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-4 gap-6">
                <div className="flex justify-center">
                  <ImageProtection
                    src={girls1}
                    alt="BAB UL ILM girls uniform front view - navy blue kurta with khaki checkered pattern"
                    className="rounded-lg w-full object-cover"
                  />
                </div>
                <div className="flex justify-center">
                  <ImageProtection
                    src={girls2}
                    alt="BAB UL ILM girls uniform side view - complete uniform with hijab"
                    className="rounded-lg w-full object-cover"
                  />
                </div>
                <div className="flex justify-center">
                  <ImageProtection
                    src={girls3}
                    alt="BAB UL ILM girls uniform full view with backpack"
                    className="rounded-lg w-full object-cover"
                  />
                </div>
                <div className="space-y-4 flex flex-col justify-center">
                  <h4 className="text-xl font-semibold text-foreground mb-4">Uniform Components:</h4>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong className="text-foreground">Kurta:</strong> Navy blue kurta with khaki checkered pattern on collar and cuffs</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong className="text-foreground">Logo:</strong> Emerald green school logo embroidered on chest</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong className="text-foreground">Shalwar:</strong> White pants/shalwar</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong className="text-foreground">Hijab:</strong> Khaki hijab</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong className="text-foreground">Footwear:</strong> Black shoes with white socks</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><strong className="text-foreground">Accessories:</strong> School backpack with emerald green logo</span>
                    </li>
                  </ul>
                  <p className="text-sm text-muted-foreground italic pt-4">
                    *Same uniform design for both summer and winter seasons
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Ordering Information */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20 animate-fade-in">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
                Uniform Ordering Information
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p className="text-center">
                  For uniform orders, sizing information, and availability, please contact our administrative office:
                </p>
                <div className="flex flex-col md:flex-row gap-4 justify-center items-center pt-4">
                  <a 
                    href="tel:03111747333" 
                    className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
                  >
                    <Phone className="w-5 h-5" />
                    <span>03 111 747 333</span>
                  </a>
                  <span className="hidden md:inline text-muted-foreground">|</span>
                  <a 
                    href="mailto:ask@bab-ul-ilm.com" 
                    className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
                  >
                    <Mail className="w-5 h-5" />
                    <span>ask@bab-ul-ilm.com</span>
                  </a>
                </div>
                <p className="text-sm text-center pt-4">
                  Please ensure all students wear the complete uniform as specified. Uniforms must be clean, well-maintained, and worn with pride.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Uniforms;
