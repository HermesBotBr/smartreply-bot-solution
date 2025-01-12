import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";

const ContactForm = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    EMAIL: "",
    FNAME: "",
    PHONE: "",
    COMPANY: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    form.submit();
    toast({
      title: "Formulário enviado!",
      description: "Entraremos em contato em breve.",
    });
    setFormData({ EMAIL: "", FNAME: "", PHONE: "", COMPANY: "" });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <form
        action="https://hermesbot.us7.list-manage.com/subscribe/post?u=60f9d468271e05a6a26d9959c&amp;id=20857a3eef&amp;f_id=003f72e0f0"
        method="post"
        id="mc-embedded-subscribe-form"
        name="mc-embedded-subscribe-form"
        className="space-y-4"
        target="_self"
        onSubmit={handleSubmit}
      >
        <h2 className="text-2xl font-bold text-center">
          Fale com a gente e transforme seu atendimento!
        </h2>
        <div>
          <Input
            type="text"
            name="FNAME"
            placeholder="Nome"
            value={formData.FNAME}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Input
            type="email"
            name="EMAIL"
            placeholder="E-mail"
            value={formData.EMAIL}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Input
            type="tel"
            name="PHONE"
            placeholder="Telefone"
            value={formData.PHONE}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Input
            type="url"
            name="COMPANY"
            placeholder="Link da sua loja no ML"
            value={formData.COMPANY}
            onChange={handleChange}
            required
          />
        </div>
        <input
          type="hidden"
          name="b_60f9d468271e05a6a26d9959c_20857a3eef"
          tabIndex={-1}
        />
        <Button type="submit" className="w-full">
          ENVIAR
        </Button>
      </form>
    </div>
  );
};

export default ContactForm;