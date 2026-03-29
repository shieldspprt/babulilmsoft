import { BookOpen, GraduationCap, Laptop, Heart, Users, Brain } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const Programs = () => {
  const programs = [
    {
      icon: BookOpen,
      title: "Quranic Excellence",
      description: "Complete Quranic education with Nazra, Tajweed, Qirat, and Hifz programs. Application of Quranic principles to modern life and sciences.",
    },
    {
      icon: GraduationCap,
      title: "Global Standards",
      description: "Canadian teaching methodology preparing students for top universities in US, Canada, UK, China, and Singapore with international competitiveness.",
    },
    {
      icon: Laptop,
      title: "STEM & Innovation",
      description: "Robotics, AI, Mathematics, and Applied Problem Solving with hands-on labs, innovation fairs, and entrepreneurship programs.",
    },
    {
      icon: Heart,
      title: "Leadership Development",
      description: "6-point leadership framework building faith-rooted confidence, strategic thinking, service orientation, and global awareness.",
    },
  ];

  const levels = [
    {
      level: "KG to Grade 5",
      gender: "Boys and Girls",
      highlights: [
        "Foundational Islamic studies",
        "Basic Quranic reading with Tajweed",
        "Core academic subjects",
        "Character development",
        "Playful learning environment",
      ],
    },
    {
      level: "Grade 6 to Grade 12",
      gender: "Girls Only",
      highlights: [
        "Intensive Quranic studies and Hifz programs",
        "Canadian-aligned curriculum with specialization tracks",
        "Robotics, AI, and advanced technology skills",
        "Leadership development and global perspectives",
        "Preparation for international university admissions",
      ],
    },
  ];

  return (
    <section id="programs" className="py-24 px-4 sm:px-6 lg:px-8 bg-card">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Where Quran Meets Science
          </h2>
          <p className="text-lg text-emerald font-arabic mb-2">
            رہبر ترقی و کمال — Guiding the Path of Progress and Perfection
          </p>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Globally benchmarked K-12 curriculum following <span className="text-emerald font-semibold">Canadian teaching methodology</span>, 
            preparing students for <span className="text-emerald font-semibold">top universities worldwide</span> while maintaining strong Islamic values
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {programs.map((program) => {
            const Icon = program.icon;
            return (
              <Card key={program.title} className="border-2 hover:border-primary transition-colors">
                <CardContent className="pt-8 pb-6 text-center">
                  <div className="w-16 h-16 bg-emerald/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-emerald" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{program.title}</h3>
                  <p className="text-muted-foreground">{program.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {levels.map((level) => (
            <Card key={level.level} className="border-2">
              <CardContent className="p-8">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-foreground mb-2">{level.level}</h3>
                  <span className="inline-block px-3 py-1 bg-gold/10 text-gold text-sm font-medium rounded-full">
                    {level.gender}
                  </span>
                </div>
                <ul className="space-y-3">
                  {level.highlights.map((highlight) => (
                    <li key={highlight} className="flex items-start">
                      <span className="inline-block w-2 h-2 bg-emerald rounded-full mt-2 mr-3 flex-shrink-0" />
                      <span className="text-foreground/80">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Programs;
