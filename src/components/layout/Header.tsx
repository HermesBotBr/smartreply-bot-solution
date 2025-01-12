import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Blog", href: "/blog" },
    { name: "Funcionalidades", href: "/funcionalidades" },
    { name: "Sobre Nós", href: "/sobre" },
    { name: "Contato", href: "/contato" },
    { name: "FAQ", href: "/faq" },
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
              <Link
                key={item.name}
                to={item.href}
                className="text-gray-700 hover:text-primary transition-colors"
              >
                {item.name}
              </Link>
            ))}
            <Button asChild>
              <Link to="/teste-gratis">Teste Grátis por 15 Dias</Link>
            </Button>
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
                <Link
                  key={item.name}
                  to={item.href}
                  className="text-gray-700 hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <Button asChild className="w-full">
                <Link to="/teste-gratis" onClick={() => setIsMenuOpen(false)}>
                  Teste Grátis por 15 Dias
                </Link>
              </Button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;