import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Target, Lightbulb, Heart, Globe2, Brain } from "lucide-react";

const Leadership = () => {
  const framework = [
    {
      icon: Shield,
      title: "Faith-Rooted Confidence",
      description: "Building leadership on Quranic integrity and purpose, developing students who lead with conviction and moral clarity."
    },
    {
      icon: Target,
      title: "Discipline and Dignity",
      description: "Training in responsibility, respect, and perseverance through structured routines and character-building activities."
    },
    {
      icon: Lightbulb,
      title: "Innovation and Adaptability",
      description: "Preparing minds for future technologies and global collaboration through hands-on learning and creative problem-solving."
    },
    {
      icon: Heart,
      title: "Service and Empathy",
      description: "Leadership as an act of service to humanity, cultivating compassion and commitment to community welfare."
    },
    {
      icon: Globe2,
      title: "Civic and Global Awareness",
      description: "Developing global citizens who act with Islamic character while understanding diverse perspectives and cultures."
    },
    {
      icon: Brain,
      title: "Strategic Thinking",
      description: "Cultivating analytical and creative problem-solving abilities through debate, research, and entrepreneurship programs."
    }
  ];

  return (
    <main className="min-h-screen pt-16">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              Leadership Development
            </h1>
            <p className="text-xl text-muted-foreground mb-4 font-urdu">
              رہبر ترقی و کمال — Leadership in Motion
            </p>
            <p className="text-xl text-muted-foreground mb-4 font-urdu">
              سایہ خدائے ذوالجلال — Under the Protection of the Almighty
            </p>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Bab ul ilm's ultimate purpose is to produce leaders of tomorrow — 
              visionary, confident, ethical, and globally competitive.
            </p>
          </div>
        </div>
      </section>

      {/* 6-Point Framework */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-foreground">
              The 6-Point Leadership Framework
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A comprehensive approach to developing well-rounded leaders who embody 
              Islamic values and global competence
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {framework.map((item, index) => {
              const Icon = item.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-all hover:scale-105">
                  <CardHeader>
                    <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-7 h-7 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{index + 1}. {item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {item.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Implementation Approach */}
      <section className="py-16 bg-gradient-to-br from-secondary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8 text-foreground">
              How We Develop Leaders
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Early Years Foundation</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Role modeling and mentorship programs</li>
                    <li>• Basic responsibility training</li>
                    <li>• Group activities and teamwork</li>
                    <li>• Character-building stories and examples</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Middle & High School</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Student Council and House System</li>
                    <li>• Debate clubs and public speaking</li>
                    <li>• Community service projects</li>
                    <li>• Entrepreneurship and innovation programs</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Co-Curricular Activities</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Leadership camps and workshops</li>
                    <li>• Sports team captaincy opportunities</li>
                    <li>• Science and innovation fairs</li>
                    <li>• Arts and cultural festival organization</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Serve & Lead Week</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Annual community service initiative</li>
                    <li>• Emphasis on humility and impact</li>
                    <li>• Real-world problem-solving projects</li>
                    <li>• Reflection and leadership assessment</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Vision Statement */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <blockquote className="text-2xl font-semibold text-foreground">
              "Our leadership training begins in early years, nurtured through role modeling, 
              mentorship, teamwork, and structured opportunities to lead both within and beyond the classroom."
            </blockquote>
            
            <div className="pt-6">
              <p className="text-lg text-muted-foreground font-urdu mb-2">
                لب پہ آتی ہے دعا بن کے تمنا میری
              </p>
              <p className="text-sm text-muted-foreground italic">
                "May My Life Be a Light for My Nation"
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default Leadership;
