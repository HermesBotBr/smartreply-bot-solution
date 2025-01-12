import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

const ContactForm = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    mlStore: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the data to your backend
    console.log("Form submitted:", formData);
    toast({
      title: "Formulário enviado!",
      description: "Entraremos em contato em breve.",
    });
    setFormData({ name: "", email: "", phone: "", mlStore: "" });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6">
        Fale com a gente e transforme seu atendimento!
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            type="text"
            name="name"
            placeholder="Nome"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Input
            type="email"
            name="email"
            placeholder="E-mail"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Input
            type="tel"
            name="phone"
            placeholder="Telefone"
            value={formData.phone}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Input
            type="url"
            name="mlStore"
            placeholder="Link da sua loja no ML"
            value={formData.mlStore}
            onChange={handleChange}
            required
          />
        </div>
        <Button type="submit" className="w-full">
          ENVIAR
        </Button>
      </form>
    </div>
  );
};

export default ContactForm;