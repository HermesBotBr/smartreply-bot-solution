
import { ArrowRight, Shield, UserCheck, Rocket, BarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContactFormDialog } from "@/components/ContactFormDialog";
import ContactForm from "@/components/ContactForm";
import FAQ from "@/components/FAQ";

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-secondary py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-up">
            Automatize seu atendimento no Mercado Livre
          </h1>
          <p className="text-xl mb-8 animate-fade-up">
            Aumente suas vendas e melhore seu ranqueamento com respostas rápidas e personalizadas
          </p>
          <ContactFormDialog>
            <Button
              size="lg"
              variant="secondary"
              className="animate-fade-up"
            >
              Teste Grátis por 15 Dias
              <ArrowRight className="ml-2" size={20} />
            </Button>
          </ContactFormDialog>
        </div>
      </section>

      {/* About Section */}
      <section id="funcionalidades" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto flex flex-col items-center">
            <h2 className="text-3xl font-bold text-center mb-12">
              Automatize seu atendimento e aumente suas vendas
            </h2>
            <div className="space-y-6 text-center mb-12">
              <p className="text-lg">
                A HermesBot é uma solução de automação inteligente que utiliza IA avançada para responder às perguntas dos seus clientes no Mercado Livre de forma rápida e eficiente.
              </p>
              <p className="text-lg">
                Com respostas personalizadas e humanizadas, você melhora seu atendimento, aumenta suas vendas e otimiza seu ranqueamento na plataforma.
              </p>
            </div>
            <div className="w-full max-w-3xl aspect-video rounded-lg overflow-hidden shadow-xl">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/_PUAxU_h5AQ?controls=1&rel=0&showinfo=0"
                title="HermesBot Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Por que escolher a HermesBot?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="p-6 bg-white rounded-lg shadow-lg text-center">
              <div className="inline-block p-3 bg-primary/10 rounded-full mb-4">
                <UserCheck className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Atendimento 24/7</h3>
              <p className="text-gray-600">
                Respostas instantâneas para seus clientes, a qualquer hora do dia
              </p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-lg text-center">
              <div className="inline-block p-3 bg-primary/10 rounded-full mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">100% Seguro</h3>
              <p className="text-gray-600">
                Integração segura e aprovada pelo Mercado Livre
              </p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-lg text-center">
              <div className="inline-block p-3 bg-primary/10 rounded-full mb-4">
                <Rocket className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Fácil de Usar</h3>
              <p className="text-gray-600">
                Configuração simples e suporte completo
              </p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-lg text-center">
              <div className="inline-block p-3 bg-primary/10 rounded-full mb-4">
                <BarChart className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Mais Vendas</h3>
              <p className="text-gray-600">
                Aumente seu ranqueamento e suas conversões
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQ />

      {/* Contact Form Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <ContactForm />
        </div>
      </section>
    </div>
  );
};

export default Index;
