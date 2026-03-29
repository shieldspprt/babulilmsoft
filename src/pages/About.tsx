import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ImageProtection from "@/components/ImageProtection";
import { Card, CardContent } from "@/components/ui/card";
import ramzanImg from "@/assets/muhammad-ramzan.png";
import sarwarImg from "@/assets/muhammad-sarwar.png";
import abdurRehmanImg from "@/assets/abdur-rehman.png";
import { Heart, Target, Eye, Sparkles, BookOpen, Users, GraduationCap, Lightbulb } from "lucide-react";

const About = () => {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            A Global Model of Faith and Excellence
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-4 font-urdu">
            رہبر ترقی و کمال — Leading the Way in Faith and Excellence
          </p>
          <p className="text-xl md:text-2xl text-muted-foreground italic max-w-3xl mx-auto">
            "A candle may burn out — but the light of knowledge it kindles lives on."
          </p>
        </div>

        {/* Story Section */}
        <div className="prose prose-lg max-w-4xl mx-auto mb-20 text-foreground">
          <p className="text-lg leading-relaxed mb-6">
            <span className="font-bold text-primary text-xl">Bab ul Ilm School</span> envisions becoming a 
            <span className="font-semibold"> global model of integrated education</span> — where Quranic light meets 
            scientific inquiry, and where knowledge produces leadership powered by faith.
          </p>
          <p className="text-lg leading-relaxed mb-6">
            We aspire to achieve what <span className="font-bold text-primary">Aligarh College once represented</span> — 
            an awakening of faith, intellect, and reform — <span className="italic">reborn for the modern age</span> through 
            Quranic guidance and international standards.
          </p>
          <p className="text-lg leading-relaxed mb-6">
            Our goal is to nurture a generation of <span className="font-semibold">visionary Muslim leaders</span>, 
            rooted in their identity, yet capable of <span className="font-semibold">contributing to the global intellectual 
            and economic landscape</span>. This is not merely a school — it is the 
            <span className="italic"> continuation of a sacred journey</span> spanning over 
            <span className="font-bold text-primary"> half a century</span>.
          </p>
        </div>

        {/* Legacy Lineage */}
        <div className="mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 flex items-center justify-center gap-3">
            <Heart className="h-8 w-8 text-destructive animate-pulse" />
            The Lineage of Light
            <Heart className="h-8 w-8 text-destructive animate-pulse" />
          </h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* First Generation */}
            <Card className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-primary/50 animate-fade-in">
              <CardContent className="p-6">
                <div className="flex flex-col items-center">
                  <div className="mb-6 w-full flex justify-center">
                    <ImageProtection
                      src={ramzanImg}
                      alt="Late Sir Muhammad Ramzan - Founder and First Generation Teacher"
                      className="w-full h-auto object-cover rounded-lg shadow-lg group-hover:shadow-2xl transition-shadow duration-300"
                      watermarkText="© BAB UL ILM"
                    />
                  </div>
                  <div className="text-center">
                    <h3 className="text-2xl font-bold mb-2 text-primary">Late Sir Muhammad Ramzan</h3>
                    <p className="text-sm font-semibold text-muted-foreground mb-4">First Generation • The Foundation</p>
                    <p className="text-sm leading-relaxed mb-4">
                      A <span className="font-semibold">mentor of hearts</span>, a beacon of discipline and compassion, 
                      and a devoted Muslim whose every lesson began with "Bismillah" and ended with gratitude.
                    </p>
                    <blockquote className="italic text-sm border-l-4 border-primary pl-4 text-muted-foreground">
                      "For decades, he nurtured young minds in Mathematics, English, and the Quran — shaping generations 
                      through his gentle character and spiritual warmth."
                    </blockquote>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Second Generation */}
            <Card className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-primary/50 animate-fade-in [animation-delay:200ms]">
              <CardContent className="p-6">
                <div className="flex flex-col items-center">
                  <div className="mb-6 w-full flex justify-center">
                    <ImageProtection
                      src={sarwarImg}
                      alt="Late Sir Muhammad Sarwar - Second Generation Teacher and Legacy Carrier"
                      className="w-full h-auto object-cover rounded-lg shadow-lg group-hover:shadow-2xl transition-shadow duration-300"
                      watermarkText="© BAB UL ILM"
                    />
                  </div>
                  <div className="text-center">
                    <h3 className="text-2xl font-bold mb-2 text-primary">Late Sir Muhammad Sarwar</h3>
                    <p className="text-sm font-semibold text-muted-foreground mb-4">Second Generation • The Continuation</p>
                    <p className="text-sm leading-relaxed mb-4">
                      The beloved son of Sir Ramzan, who carried forward this <span className="font-semibold">noble mission</span> with 
                      the same sincerity and devotion for more than <span className="font-bold text-primary">20 years</span>.
                    </p>
                    <blockquote className="italic text-sm border-l-4 border-primary pl-4 text-muted-foreground">
                      "He continued the sacred work with unwavering dedication, serving the community as a mentor and educator, 
                      keeping his father's dream alive."
                    </blockquote>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Third Generation */}
            <Card className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-primary/50 animate-fade-in [animation-delay:400ms]">
              <CardContent className="p-6">
                <div className="flex flex-col items-center">
                  <div className="mb-6 w-full flex justify-center">
                    <ImageProtection
                      src={abdurRehmanImg}
                      alt="Hafiz Abdur Rehman - Third Generation Leader and Current Director"
                      className="w-full h-auto object-cover rounded-lg shadow-lg group-hover:shadow-2xl transition-shadow duration-300"
                      watermarkText="© BAB UL ILM"
                    />
                  </div>
                  <div className="text-center">
                    <h3 className="text-2xl font-bold mb-2 text-primary">Hafiz Abdur Rehman</h3>
                    <p className="text-sm font-semibold text-muted-foreground mb-4">Third Generation • The Revival</p>
                    <p className="text-sm leading-relaxed mb-4">
                      Brother of Muhammad Sarwar and son of Sir Ramzan, who now holds the <span className="font-semibold">torch of light</span> high, 
                      vowing to <span className="font-bold text-primary">revive, preserve, and expand</span> this 50-year legacy.
                    </p>
                    <blockquote className="italic text-sm border-l-4 border-primary pl-4 text-muted-foreground">
                      "Under his leadership, Bab ul Ilm School blends Quranic wisdom with modern learning, 
                      preparing the next generation for both spiritual light and worldly excellence."
                    </blockquote>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12 max-w-2xl mx-auto">
            <p className="text-xl italic font-semibold text-primary">
              "From teacher to teacher, from heart to heart — fifty years of light continue to shine."
            </p>
          </div>
        </div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-12 mb-20 max-w-6xl mx-auto">
          <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-primary/30 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <Target className="h-10 w-10 text-primary" />
                <h2 className="text-3xl font-bold">Our Mission</h2>
              </div>
              <blockquote className="text-lg italic mb-6 text-muted-foreground border-l-4 border-primary pl-4">
                "To provide world-class K–12 education under the illumination of the Quran, developing morally upright, 
                academically excellent, and globally aware students — capable of leading in universities and corporations 
                across the world with integrity and faith."
              </blockquote>
              <div className="space-y-4">
                <p className="leading-relaxed">
                  <span className="font-bold text-primary">Bab ul Ilm School</span> is built on the belief that 
                  <span className="font-semibold italic"> education is worship</span>. 
                  Our mission is to unite Quranic values with modern learning, cultivating children who are:
                </p>
                <ul className="space-y-3 ml-6">
                  <li className="flex items-start gap-2">
                    <Heart className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                    <span><span className="font-semibold">Faithful in heart</span> — rooted in Islamic values and devotion</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Lightbulb className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                    <span><span className="font-semibold">Curious in mind</span> — eager to explore and understand the world</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Users className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span><span className="font-semibold">Kind in action</span> — committed to service and compassion</span>
                  </li>
                </ul>
                <p className="font-semibold text-primary mt-4">
                  We aim to bring light to every home through education that strengthens both Iman (faith) and Intellect.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-accent/5 to-secondary/5 border-2 border-accent/30 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <Eye className="h-10 w-10 text-accent" />
                <h2 className="text-3xl font-bold">Our Vision</h2>
              </div>
              <blockquote className="text-lg italic mb-6 text-muted-foreground border-l-4 border-accent pl-4">
                "To build a school that not only teaches minds but also polishes hearts — where the Quran meets Science, 
                and legacy meets the future. We envision becoming a global model that Pakistan and the Muslim world 
                can be proud of."
              </blockquote>
              <p className="leading-relaxed mb-4">
                Bab ul Ilm aims to stand among <span className="font-bold text-accent">Pakistan's and the Muslim world's 
                most respected educational institutions</span> — an intellectual movement guided by Quranic light and global excellence.
              </p>
              <p className="leading-relaxed">
                We aspire to produce <span className="font-semibold">graduates accepted into leading universities</span> in the 
                US, Canada, UK, China, and Singapore, who later work for <span className="font-semibold">leading global organizations</span> 
                while embodying <span className="italic">faith and cultural dignity</span>.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Core Values */}
        <div className="mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 flex items-center justify-center gap-3">
            <Sparkles className="h-8 w-8 text-accent" />
            Our Core Values
            <Sparkles className="h-8 w-8 text-accent" />
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                icon: BookOpen,
                title: "Ilm (Knowledge)",
                description: "Knowledge as light and worship — a duty to seek and share.",
                color: "text-primary"
              },
              {
                icon: Heart,
                title: "Adab (Respect)",
                description: "Manners, gratitude, and humility form the soul of learning.",
                color: "text-destructive"
              },
              {
                icon: Sparkles,
                title: "Ikhlaas (Sincerity)",
                description: "Every act done for Allah's sake, with pure intention.",
                color: "text-accent"
              },
              {
                icon: Target,
                title: "Excellence",
                description: "Commitment to the highest standards in faith and academics.",
                color: "text-primary"
              },
              {
                icon: Users,
                title: "Service",
                description: "Serving community and nation through kindness and contribution.",
                color: "text-accent"
              },
              {
                icon: GraduationCap,
                title: "Innovation",
                description: "Embracing science and technology — including AI — to stay future-ready.",
                color: "text-primary"
              }
            ].map((value, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/30">
                <CardContent className="p-6 text-center">
                  <value.icon className={`h-12 w-12 ${value.color} mx-auto mb-4`} />
                  <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Future Plans */}
        <div className="mb-20">
          <Card className="bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 border-2 border-primary/40">
            <CardContent className="p-12">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 flex items-center justify-center gap-3">
                <Lightbulb className="h-10 w-10 text-accent" />
                Our Future Vision
              </h2>
              <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-primary mb-4">Infrastructure Excellence</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold">•</span>
                      <span>Purpose-built classrooms with <span className="font-semibold">natural light</span> and <span className="font-semibold">smart technology</span></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold">•</span>
                      <span>Dedicated <span className="font-semibold">Quran hall</span> and prayer space for spiritual growth</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold">•</span>
                      <span><span className="font-semibold">Computer & AI learning lab</span> for 21st-century skills</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold">•</span>
                      <span><span className="font-semibold">Library and reading corners</span> to foster curiosity</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold">•</span>
                      <span>Safe, clean, and <span className="font-semibold">value-based environment</span></span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-primary mb-4">Educational Innovation</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <span className="text-accent font-bold">•</span>
                      <span><span className="font-semibold">Quranic Studies & Arabic Literacy</span> — foundation of faith</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent font-bold">•</span>
                      <span><span className="font-semibold">STEM & Artificial Intelligence Basics</span> — preparing for tomorrow</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent font-bold">•</span>
                      <span><span className="font-semibold">Character Building & Emotional Intelligence</span> — developing leaders</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent font-bold">•</span>
                      <span><span className="font-semibold">Environmental Awareness</span> — creating responsible citizens</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent font-bold">•</span>
                      <span><span className="font-semibold">Interactive & compassionate teaching</span> — honoring Sir Ramzan's approach</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Closing Message */}
        <div className="text-center max-w-4xl mx-auto">
          <Card className="bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 border-2 border-primary/30">
            <CardContent className="p-12">
              <h2 className="text-3xl font-bold mb-6 text-primary">
                A Legacy Reborn • A Promise Renewed
              </h2>
              <p className="text-lg leading-relaxed mb-6">
                For <span className="font-bold">fifty years</span>, one family has taught generations to read, think, and pray. 
                From <span className="font-semibold">Late Sir Muhammad Ramzan</span> to <span className="font-semibold">Late Sir Muhammad Sarwar</span>, 
                and now to <span className="font-semibold">Hafiz Abdur Rehman</span> — the light of education continues to illuminate paths.
              </p>
              <p className="text-xl font-bold italic text-primary mb-8">
                This is not just a school — this is the living soul of a teacher's dream, reborn to guide the next generations.
              </p>
              <div className="space-y-2 text-lg">
                <p className="font-semibold">📍 Sui Gas Chowk, Mananwala</p>
                <p className="font-semibold">📞 03-111-747-333</p>
                <p className="font-semibold">🌐 www.bab-ul-ilm.com</p>
              </div>
              <p className="text-2xl font-bold text-accent mt-8 italic">
                "Opening the Gates of Knowledge"
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default About;
