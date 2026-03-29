import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  const faqs = [
    {
      question: "What is MultiSchool and how does it work?",
      answer: "MultiSchool is a multi-tenant SaaS platform that allows multiple schools to independently sign up, manage their students, track fees, record finances, and access all data through isolated dashboards. Each school gets their own secure workspace with complete data isolation."
    },
    {
      question: "How does the credit system work?",
      answer: "Schools purchase credits to use the platform. Each action (enrolling a student, recording a fee payment, generating reports) consumes a small amount of credits. You can buy credits in packages: Starter (500 credits for PKR 5,000), Standard (1,200 credits for PKR 10,000), or Premium (3,000 credits for PKR 20,000)."
    },
    {
      question: "What modules are included in MultiSchool?",
      answer: "MultiSchool includes 8 core modules: Student & Parent Records, Fee Collection & Receipts, Accounts & Finance, Class & Section Management, Supplier Management, Book Sales, Reports & Analytics, and User Management with role-based access."
    },
    {
      question: "Is there a free trial available?",
      answer: "Yes! New schools get a 14-day free trial with 100 starter credits. No credit card required to sign up. After the trial, you can purchase credit packages to continue using the platform."
    },
    {
      question: "How secure is my school's data?",
      answer: "MultiSchool uses Row Level Security (RLS) policies in PostgreSQL to ensure complete data isolation between schools. Each school can only access their own data. We use Supabase for secure authentication and data storage with enterprise-grade security."
    },
    {
      question: "What payment methods are accepted for buying credits?",
      answer: "We accept multiple payment methods including Bank Transfer (manual verification), EasyPaisa, and JazzCash. Once payment is confirmed, credits are added to your account immediately."
    },
    {
      question: "Can multiple users from my school access the system?",
      answer: "Yes! You can create multiple user accounts for your school with different permission levels: Admin (full access), Staff (limited access), and View-only users. Perfect for principals, accountants, and teachers."
    },
    {
      question: "Is there a mobile app available?",
      answer: "MultiSchool is a Progressive Web App (PWA) that works seamlessly on mobile devices through your browser. You can add it to your home screen for quick access. Mobile-optimized pages are available for common tasks like fee collection."
    },
    {
      question: "What kind of reports can I generate?",
      answer: "Generate comprehensive financial reports including income/expense summaries, fee collection reports, balance sheets, supplier ledgers, class-wise student reports, and custom date-range analytics. All reports can be printed or exported."
    },
    {
      question: "How do I get started with MultiSchool?",
      answer: "Simply click 'Get Started Free' to create your school account. Complete the onboarding form with your school details, verify your email, and you'll instantly get access to your dashboard with 100 trial credits. Start enrolling students and managing your school right away!"
    }
  ];

  return (
    <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about MultiSchool
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
