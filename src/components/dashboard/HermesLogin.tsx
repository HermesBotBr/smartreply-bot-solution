
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import axios from 'axios';

// Define form schema
const formSchema = z.object({
  sellerId: z.string().min(1, { message: "ID do vendedor é obrigatório" }),
  password: z.string().min(1, { message: "Senha é obrigatória" }),
});

type LoginFormValues = z.infer<typeof formSchema>;

interface HermesLoginProps {
  onLoginSuccess: (sellerId: string) => void;
}

const HermesLogin: React.FC<HermesLoginProps> = ({ onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sellerId: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    
    try {
      // Call the authentication service
      const response = await axios.post('/api/auth/login', {
        sellerId: data.sellerId,
        password: data.password,
      });
      
      if (response.data.success) {
        onLoginSuccess(data.sellerId);
      } else {
        toast.error("Falha na autenticação. Verifique suas credenciais.");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Erro ao realizar login. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Login Hermes</h1>
        <p className="text-gray-500">
          Insira suas credenciais para acessar o sistema
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="sellerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ID do Vendedor</FormLabel>
                <FormControl>
                  <Input placeholder="Insira o ID do vendedor" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Senha</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    placeholder="Insira sua senha" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? "Autenticando..." : "Entrar"}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default HermesLogin;
