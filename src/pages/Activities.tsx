import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Palette, Users, Lightbulb, Music, Heart } from "lucide-react";

const Activities = () => {
  const sports = [
    { name: "Cricket", description: "Structured coaching and inter-school competitions" },
    { name: "Chess", description: "Strategic thinking and mental agility development" },
    { name: "AR/VR Games", description: "Modern sports technology integration" },
    { name: "Annual Sports Festival", description: "Celebrating teamwork and athletic excellence" }
  ];

  const arts = [
    { name: "Islamic Calligraphy", description: "Beautiful Arabic script art and expression" },
    { name: "Art & Craft", description: "Creative expression through various media" },
    { name: "Drama & Theater", description: "Confidence building through performance" },
    { name: "Speech & Debate", description: "Articulation and persuasive communication" }
  ];

  const clubs = [
    { name: "Science Fairs", description: "Hands-on innovation and discovery" },
    { name: "Entrepreneurship Society", description: "Business skills and leadership" },
    { name: "Student Council", description: "Democratic leadership and governance" },
    { name: "Community Service", description: "Making a positive impact locally" }
  ];

  return (
    <main className="min-h-screen pt-16">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              Sports, Arts & Co-Curricular Activities
            </h1>
            <p className="text-xl text-muted-foreground mb-4 font-urdu">
              شاد باد منزل مراد — Blessed Be the Destination of Our Aspirations
            </p>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Bab ul ilm believes that a complete education must include body, mind, and spirit. 
              We nurture students who are physically strong, emotionally resilient, and spiritually conscious.
            </p>
          </div>
        </div>
      </section>

      {/* Sports Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <Trophy className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold text-foreground">Sports Development</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {sports.map((sport, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle>{sport.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">{sport.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Structured sports periods for all grades</li>
                  <li>• Separate facilities and coaching programs for girls</li>
                  <li>• Annual Sports and Cultural Festivals promoting teamwork and resilience</li>
                  <li>• Modern equipment and safe playing environments</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Arts Section */}
      <section className="py-16 bg-gradient-to-br from-secondary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <Palette className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold text-foreground">Arts, Creativity & Expression</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {arts.map((art, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle>{art.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">{art.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Clubs & Societies */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <Lightbulb className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold text-foreground">Clubs & Leadership Societies</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {clubs.map((club, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle>{club.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">{club.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Serve & Lead Week */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <Heart className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-4 text-foreground">
                Annual "Serve & Lead" Week
              </h2>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Community Service & Leadership</CardTitle>
                <CardDescription>
                  A dedicated week emphasizing humility, service, and positive impact
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold mb-2">Student Council</h3>
                    <p className="text-sm text-muted-foreground">
                      Democratic leadership and representation
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold mb-2">House System</h3>
                    <p className="text-sm text-muted-foreground">
                      Team building and healthy competition
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold mb-2">Service Projects</h3>
                    <p className="text-sm text-muted-foreground">
                      Real community impact initiatives
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold mb-2">Awareness Campaigns</h3>
                    <p className="text-sm text-muted-foreground">
                      Social responsibility and advocacy
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Closing Statement */}
      <section className="py-16 bg-gradient-to-br from-secondary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <p className="text-lg text-muted-foreground font-urdu">
              لب پہ آتی ہے دعا بن کے تمنا میری
            </p>
            <p className="text-sm text-muted-foreground italic mb-4">
              "May My Life Be a Light for My Nation"
            </p>
            <p className="text-xl text-foreground font-semibold">
              Through these activities, Bab ul ilm nurtures students who are physically strong, 
              emotionally resilient, and spiritually conscious.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default Activities;
