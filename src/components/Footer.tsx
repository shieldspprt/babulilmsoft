const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h2 className="text-2xl font-bold mb-4">MultiSchool</h2>
            <p className="text-sm opacity-90 mb-2">
              Multi-Tenant School Management SaaS Platform
            </p>
            <p className="text-sm opacity-75 italic mb-2">
              Complete school management — Students, fees, accounts, and more
            </p>
            <p className="text-xs opacity-75">
              Built with modern web technologies for schools that need more.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/" className="opacity-90 hover:opacity-100 transition-opacity">Home</a></li>
              <li><a href="/signup" className="opacity-90 hover:opacity-100 transition-opacity">Sign Up</a></li>
              <li><a href="#modules" className="opacity-90 hover:opacity-100 transition-opacity">Modules</a></li>
              <li><a href="#programs" className="opacity-90 hover:opacity-100 transition-opacity">Pricing</a></li>
              <li><a href="#contact" className="opacity-90 hover:opacity-100 transition-opacity">Contact</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm opacity-90">
              <li>Email: support@multischool.app</li>
              <li>Phone: +92 311 1747333</li>
              <li>Mon-Sat, 9AM-6PM PKT</li>
              <li>WhatsApp Available</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-primary-foreground/20 pt-8 text-center">
          <p className="text-sm opacity-90 mb-2">
            Simplifying School Management Across Pakistan
          </p>
          <p className="text-xs opacity-75 italic mb-4">
            Credit-based pricing · Multi-tenant architecture · Secure data isolation
          </p>
          <p className="text-sm opacity-75">
            © 2025 MultiSchool Platform. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
