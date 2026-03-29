import { Card, CardContent } from "@/components/ui/card";
import ImageProtection from "@/components/ImageProtection";
import muhammadRamzan from "@/assets/muhammad-ramzan.png";
import muhammadSarwar from "@/assets/muhammad-sarwar.png";
import abdurRehman from "@/assets/abdur-rehman.png";

const Legacy = () => {
  const leaders = [
    {
      name: "Late Sir Muhammad Ramzan",
      title: "The Foundation | 1st Generation",
      description: "A mentor of hearts, a beacon of discipline and compassion. Every lesson began with 'Bismillah' and ended with gratitude. For decades, he nurtured young minds in Mathematics, English, and the Quran — shaping generations through his gentle character and spiritual warmth.",
      image: muhammadRamzan,
      quote: "A candle may burn out — but the light of knowledge it kindles lives on."
    },
    {
      name: "Late Sir Muhammad Sarwar",
      title: "The Continuation | 2nd Generation",
      description: "Beloved son of Sir Ramzan, who carried forward this noble mission with the same sincerity and devotion for more than 20 years. A dedicated educator who led with wisdom, integrity, and unwavering commitment to serving the community.",
      image: muhammadSarwar,
      quote: "Continuing the sacred work with devotion."
    },
    {
      name: "Hafiz Abdur Rehman",
      title: "The Revival | 3rd Generation",
      description: "Brother of Muhammad Sarwar and son of Sir Ramzan, now holding high the torch of light. Vowed to revive, preserve, and expand this 50-year legacy of education and faith — blending Quranic wisdom with modern learning, including AI and technology.",
      image: abdurRehman,
      quote: "From teacher to teacher, from heart to heart — fifty years of light continue to shine."
    },
  ];

  return (
    <section id="about" className="py-24 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            A Living Monument
          </h2>
          <p className="text-xl text-emerald mb-4 font-arabic">
            میراث کی روشنی
          </p>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            This is not merely a school — it is a <span className="text-emerald font-semibold">continuation of a sacred journey</span> that began over half a century ago. 
            The living soul of a teacher's dream, reborn to guide the next generations toward both <span className="text-emerald font-semibold">spiritual light</span> and <span className="text-emerald font-semibold">worldly excellence</span>.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {leaders.map((leader) => (
            <Card key={leader.name} className="border-2 hover:border-primary transition-colors overflow-hidden">
              <div className="aspect-square overflow-hidden">
                <ImageProtection
                  src={leader.image}
                  alt={`${leader.name} - ${leader.title}`}
                  className="w-full h-full object-cover object-center"
                />
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-foreground mb-2">{leader.name}</h3>
                <p className="text-emerald font-medium mb-3 text-sm">{leader.title}</p>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  {leader.description}
                </p>
                <p className="text-xs italic text-foreground/60 border-l-2 border-emerald pl-3">
                  {leader.quote}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="mt-16 text-center max-w-4xl mx-auto">
          <div className="bg-emerald/5 border-2 border-emerald/20 rounded-lg p-8">
            <p className="text-2xl text-foreground mb-6 font-arabic leading-relaxed">
              جہاں گير و جہاں دار و جہاں بان و جہاں آرا
            </p>
            <p className="text-base text-foreground/80 leading-relaxed">
              Bab ul Ilm stands as a living monument to true teaching, humility, and faith. 
              Education is not just a profession here — it is <span className="text-emerald font-semibold">worship</span>, 
              a sacred trust passed from generation to generation, 
              illuminating paths for those who seek both <span className="text-emerald font-semibold">Deen and Dunya</span>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Legacy;
