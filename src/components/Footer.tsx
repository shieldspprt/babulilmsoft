import logo from "@/assets/logo.png";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <img 
              src={logo} 
              alt="BAB UL ILM K12 International School - BISE Lahore Board, AI Courses, Tech Training" 
              className="h-12 w-auto mb-4" 
            />
            <p className="text-sm opacity-90 mb-2 font-urdu">
              رہبر ترقی و کمال — Leading the Way in Faith and Excellence
            </p>
            <p className="text-sm opacity-90 mb-2 font-urdu">
              قرآن کی روشنی، علم کی قوت، اور سائنس کا سفر
            </p>
            <p className="text-sm opacity-75 italic mb-2">
              The Light of Quran, the Power of Knowledge, and the Journey of Science
            </p>
            <p className="text-xs opacity-75 italic">
              "Rooted in Values. Rising with Knowledge."
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/" className="opacity-90 hover:opacity-100 transition-opacity">Home</a></li>
              <li><a href="/about" className="opacity-90 hover:opacity-100 transition-opacity">About Us</a></li>
              <li><a href="/global-pathways" className="opacity-90 hover:opacity-100 transition-opacity">Global Pathways</a></li>
              <li><a href="/leadership" className="opacity-90 hover:opacity-100 transition-opacity">Leadership</a></li>
              <li><a href="/activities" className="opacity-90 hover:opacity-100 transition-opacity">Activities</a></li>
              <li><a href="/fees" className="opacity-90 hover:opacity-100 transition-opacity">Fee Concessions</a></li>
              <li><a href="#contact" className="opacity-90 hover:opacity-100 transition-opacity">Contact</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm opacity-90">
              <li>Sui Gas Chowk, Mananwala</li>
              <li>Pakistani Punjab</li>
              <li>03 111 747 333</li>
              <li>www.bab-ul-ilm.com</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-primary-foreground/20 pt-8 text-center">
          <p className="text-sm opacity-90 mb-2 font-urdu">
            ترجمان ماضی شان حال — A voice of the past, the pride of today
          </p>
          <p className="text-xs opacity-75 italic mb-4">
            "A 50-year legacy of faith and learning — where hearts are polished and minds are awakened"
          </p>
          <p className="text-sm opacity-75">
            © 2025 BAB UL ILM K12 International School. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
