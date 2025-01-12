import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContactFormDialog } from "@/components/ContactFormDialog";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsMenuOpen(false);
    }
  };

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Blog", href: "/blog" },
    { 
      name: "Funcionalidades", 
      href: "#funcionalidades",
      onClick: () => scrollToSection("funcionalidades")
    },
    { 
      name: "Sobre Nós", 
      href: "#quem-somos",
      onClick: () => scrollToSection("quem-somos")
    },
    { 
      name: "FAQ", 
      href: "#faq",
      onClick: () => scrollToSection("faq")
    },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0">
            <Link to="/" className="text-2xl font-bold text-primary">
              HermesBot
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={item.onClick}
                className="text-gray-700 hover:text-primary transition-colors"
              >
                {item.name}
              </a>
            ))}
            <ContactFormDialog>
              <Button>Teste Grátis por 15 Dias</Button>
            </ContactFormDialog>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 animate-fade-in">
            <div className="flex flex-col space-y-4">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={item.onClick}
                  className="text-gray-700 hover:text-primary transition-colors"
                >
                  {item.name}
                </a>
              ))}
              <ContactFormDialog>
                <Button className="w-full">Teste Grátis por 15 Dias</Button>
              </ContactFormDialog>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;