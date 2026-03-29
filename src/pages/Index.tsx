import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Programs from "@/components/Programs";
import Legacy from "@/components/Legacy";
import FAQ from "@/components/FAQ";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <main className="min-h-screen">
      <Navigation />
      <Hero />
      <Programs />
      <Legacy />
      <FAQ />
      <Contact />
      <Footer />
    </main>
  );
};

export default Index;
