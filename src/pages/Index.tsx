import { ArrowRight, Shield, UserCheck, Rocket, BarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContactFormDialog } from "@/components/ContactFormDialog";
import ContactForm from "@/components/ContactForm";
import FAQ from "@/components/FAQ";

const Index = () => {
  const diferenciais = [
    {
      icon: UserCheck,
      title: "Experiência Real",
      description: "Criada por quem viveu os desafios do Mercado Livre.",
    },
    {
      icon: Shield,
      title: "100% Segura",
      description: "Alinhada às diretrizes da plataforma.",
    },
    {
      icon: Rocket,
      title: "Fácil de Usar",
      description: "Sem configurações complicadas.",
    },
    {
      icon: BarChart,
      title: "Resultados Comprovados",
      description: "Vendas aumentadas e clientes satisfeitos.",
    },
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-secondary py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-up">
            Venda mais no Mercado Livre com automação inteligente!
          </h1>
          <p className="text-xl mb-8 animate-fade-up">
            Automatize seu atendimento, melhore seu ranqueamento e conquiste
            resultados surpreendentes.
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
      <section id="quem-somos" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Quem Somos?</h2>
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-lg text-gray-700 mb-8">
              A HermesBot é uma solução de automação inteligente criada por
              vendedores que conhecem de perto os desafios do Mercado Livre. Com
              tecnologia avançada do ChatGPT, transformamos o atendimento,
              oferecendo respostas rápidas, humanizadas e um impacto direto no
              ranqueamento e nas vendas.
            </p>
            <div className="aspect-video rounded-lg overflow-hidden mb-8">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/_PUAxU_h5AQ?controls=1&rel=0&showinfo=0"
                title="HermesBot Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section id="funcionalidades" className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Transforme Seu Atendimento no Mercado Livre
          </h2>
          <div className="max-w-3xl mx-auto text-center mb-12">
            <p className="text-lg text-gray-700">
              Imagine ter um assistente que nunca para e entende exatamente o que
              seus clientes precisam.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="font-semibold mb-2">
                Atendimento ativo 24 horas por dia
              </h3>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="font-semibold mb-2">
                Respostas humanizadas que aproximam seu cliente da venda
              </h3>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="font-semibold mb-2">
                Melhor ranqueamento, garantindo mais visibilidade
              </h3>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="font-semibold mb-2">
                Tudo isso sem esforço – nós configuramos tudo para você
              </h3>
            </div>
          </div>
          <div className="text-center mt-12">
            <Button size="lg" asChild>
              <a href="/funcionalidades">
                Saiba Mais
                <ArrowRight className="ml-2" size={20} />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Differentials Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Por Que HermesBot é a Escolha Certa?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {diferenciais.map((item) => (
              <div
                key={item.title}
                className="bg-white p-6 rounded-lg shadow-lg text-center"
              >
                <div className="inline-block p-3 bg-primary/10 rounded-full mb-4">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
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