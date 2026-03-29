import logo from "@/assets/logo.png";

const Legacy = () => {
  return (
    <section id="about" className="py-24 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-4xl mx-auto text-center">
        <img 
          src={logo} 
          alt="BAB UL ILM" 
          className="h-24 w-auto mx-auto mb-8" 
        />
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
          Powered by BAB UL ILM
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          MultiSchool brings decades of educational expertise into a modern, 
          easy-to-use platform. Built with care for schools that want to focus 
          on what matters most — their students.
        </p>
      </div>
    </section>
  );
};

export default Legacy;
