import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  const faqs = [
    {
      question: "What makes BAB UL ILM's curriculum internationally competitive?",
      answer: "We follow Canadian teaching methodology aligned with international standards, preparing students for top universities in the US, Canada, UK, China, and Singapore. Our globally benchmarked K-12 curriculum combines Quranic excellence with STEM education, robotics, AI, and advanced technology skills."
    },
    {
      question: "How does BAB UL ILM prepare students for international universities?",
      answer: "Our Canadian-aligned curriculum includes comprehensive university preparation, English immersion programs, scholarship mentorship, and guidance for international admissions. We focus on building academic competence, research skills, debate, and global perspectives needed for acceptance into leading universities worldwide."
    },
    {
      question: "What educational levels does BAB UL ILM offer?",
      answer: "We offer K12 education from Kindergarten to Grade 12, with KG to Grade 5 for both boys and girls, and Grade 6 to Grade 12 for girls only. Our curriculum follows Canadian teaching methodology while maintaining strong Islamic values and Quranic education."
    },
    {
      question: "What is the 6-Point Leadership Framework?",
      answer: "Our comprehensive leadership program develops: 1) Faith-Rooted Confidence, 2) Discipline and Dignity, 3) Innovation and Adaptability, 4) Service and Empathy, 5) Civic and Global Awareness, and 6) Strategic Thinking. Students begin leadership training in early years through mentorship, teamwork, and structured opportunities."
    },
    {
      question: "What global partnerships does BAB UL ILM have?",
      answer: "We are actively developing academic partnerships with institutions in Canada, UK, and Singapore. Our global pathways program includes cultural exchange through online collaborative classrooms, advanced digital learning tools, and preparation for international opportunities while maintaining Islamic values."
    },
    {
      question: "What makes BAB UL ILM unique?",
      answer: "We blend Quranic education with Canadian-standard modern learning, continuing a 50-year legacy. We aspire to what Aligarh College once represented — an awakening of faith, intellect, and reform. Our students receive world-class education under Quranic illumination, preparing them for global leadership."
    },
    {
      question: "Are fee concessions available?",
      answer: "Yes, we believe education is a right, not a privilege. We offer fee concessions for Hifz-e-Quran students, orphans, children of teachers and Masjid Imams, economically disadvantaged families, siblings, and nearby residents."
    },
    {
      question: "What is the Hifz-e-Quran program?",
      answer: "Our comprehensive Quranic program includes Nazra, Tajweed, Qirat, and structured Hifz-e-Quran under qualified Huffaz. We provide translation, understanding, character formation, and application of Quranic principles to modern life. Students receive daily memorization sessions, revision support, and fee concessions."
    },
    {
      question: "What sports and activities are available?",
      answer: "We offer Cricket, Chess, AR/VR Games, Islamic Calligraphy, Art, Drama, Speech & Debate Clubs, Science Fairs, and Entrepreneurship Societies. Our annual 'Serve & Lead' Week emphasizes community service, and we have separate facilities for girls with structured coaching programs."
    },
    {
      question: "What facilities are available at the school?",
      answer: "Purpose-built classrooms with smart technology, dedicated Quran halls, Science/Art/Innovation Labs, Computer & AI learning lab, Library, Sports Grounds, Creative Zones, and environmentally conscious infrastructure. Our campus is designed as a sanctuary of knowledge combining traditional respect with modern design."
    },
    {
      question: "Where is BAB UL ILM located?",
      answer: "We are located at Sui Gas Chowk, Mananwala, Punjab, Pakistan. Contact us on WhatsApp at 03 111 747 333 for more information or to schedule a visit. Visit www.bab-ul-ilm.com to learn more about our 50-year legacy and global vision."
    }
  ];

  return (
    <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-emerald mb-4 font-arabic">
            اکثر پوچھے گئے سوالات
          </p>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about BAB UL ILM K12 International School
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="border-2 rounded-lg px-6">
              <AccordionTrigger className="text-left hover:no-underline">
                <h3 className="text-lg font-semibold text-foreground">{faq.question}</h3>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* FAQ Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqs.map(faq => ({
              "@type": "Question",
              "name": faq.question,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
              }
            }))
          })}
        </script>
      </div>
    </section>
  );
};

export default FAQ;
