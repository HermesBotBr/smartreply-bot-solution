import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqData = [
  {
    question: "O que é a HermesBot?",
    answer:
      "A HermesBot é uma ferramenta de automação inteligente que responde automaticamente às perguntas de clientes no Mercado Livre, ajudando a melhorar o tempo de resposta, o ranqueamento e as vendas das lojas.",
  },
  {
    question: "Como a HermesBot funciona?",
    answer:
      "Após uma análise da sua conta, configuramos a ferramenta para responder às dúvidas dos seus clientes. Ela utiliza inteligência artificial avançada para oferecer respostas rápidas e humanizadas, funcionando 24/7.",
  },
  {
    question: "Preciso configurar algo?",
    answer:
      "Não! A HermesBot cuida de tudo para você. Nossa equipe realiza toda a configuração e personalização da ferramenta com base nas necessidades da sua loja no Mercado Livre.",
  },
  {
    question: "A HermesBot é segura?",
    answer:
      "Sim! Trabalhamos exclusivamente dentro da plataforma do Mercado Livre, sem comprometer a segurança dos seus dados ou da sua conta.",
  },
  {
    question: "A HermesBot pode melhorar o meu ranqueamento no Mercado Livre?",
    answer:
      "Sim! Com respostas rápidas e eficientes, sua loja ganha pontos no algoritmo do Mercado Livre, aumentando a visibilidade dos seus anúncios.",
  },
  {
    question: "Quanto custa a HermesBot?",
    answer:
      "Oferecemos planos mensais e anuais acessíveis, ajustados ao volume de atendimento da sua loja. Além disso, você pode testar a HermesBot gratuitamente por 15 dias!",
  },
  {
    question: "A HermesBot pode responder perguntas técnicas ou específicas?",
    answer:
      "Sim! Durante a configuração, analisamos sua conta e personalizamos as respostas de acordo com as particularidades dos seus produtos e atendimento.",
  },
  {
    question: "Como faço para começar?",
    answer:
      'É fácil! Clique no botão "Teste Grátis", forneça acesso à sua conta do Mercado Livre e deixe nossa equipe cuidar de todo o resto. Em minutos, sua loja estará pronta para transformar o atendimento e aumentar suas vendas!',
  },
];

const FAQ = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">
          Perguntas Frequentes – Tudo o Que Você Precisa Saber Sobre a HermesBot
        </h2>
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqData.map((item, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-white rounded-lg shadow-sm"
              >
                <AccordionTrigger className="px-6 hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQ;