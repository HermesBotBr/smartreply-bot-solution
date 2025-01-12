import { Link } from "react-router-dom";
import { Facebook, Instagram, Linkedin, Youtube } from "lucide-react";

const Footer = () => {
  const quickLinks = [
    { name: "Início", href: "/" },
    { name: "Soluções", href: "/funcionalidades" },
    { name: "Sobre", href: "/sobre" },
    { name: "Contato", href: "/contato" },
  ];

  const socialLinks = [
    { name: "Instagram", icon: Instagram, href: "#" },
    { name: "Facebook", icon: Facebook, href: "#" },
    { name: "LinkedIn", icon: Linkedin, href: "#" },
    { name: "YouTube", icon: Youtube, href: "#" },
  ];

  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Links Rápidos</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contato</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="mailto:contato@hermesbot.com"
                  className="hover:text-primary transition-colors"
                >
                  contato@hermesbot.com
                </a>
              </li>
              <li>
                <a
                  href="tel:11999999999"
                  className="hover:text-primary transition-colors"
                >
                  (11) 99999-9999
                </a>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Redes Sociais</h3>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                  aria-label={social.name}
                >
                  <social.icon size={24} />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 text-center">
          <p>© 2025 HermesBot. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;