import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const ThankYou = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <h1 className="text-3xl font-bold text-center mb-6">Obrigado pelo seu interesse!</h1>
      <p className="text-lg text-center mb-8 max-w-2xl">
        Em breve, um de nossos atendentes entrará em contato para ajudar você a transformar o atendimento da sua loja!
      </p>
      <Button asChild>
        <Link to="/">Voltar para a página inicial</Link>
      </Button>
    </div>
  );
};

export default ThankYou;