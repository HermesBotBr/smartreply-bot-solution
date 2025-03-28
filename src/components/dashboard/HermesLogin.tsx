
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import axios from 'axios';
import { getNgrokUrl } from "@/config/api";

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
      // Check if we're in the preview environment
      const isPreview = typeof window !== 'undefined' && 
        window.location.hostname.includes('preview--smartreply-bot-solution.lovable.app');
      
      if (isPreview) {
        // In preview mode, simulate successful login for any credentials
        console.log("Preview mode: Simulating successful login");
        setTimeout(() => {
          onLoginSuccess(data.sellerId);
          toast.success("Login simulado com sucesso (ambiente de preview)");
        }, 1000);
      } else {
        // Normal login flow for non-preview environments
        // Tente primeiro o caminho com /api no início
        let loginUrl = getNgrokUrl('/api/auth/login');
        
        console.log("Attempting login at:", loginUrl);
        
        try {
          // Tenta primeira opção: /api/auth/login
          const response = await axios.post(loginUrl, {
            sellerId: data.sellerId,
            password: data.password,
          });
          
          if (response.data.success) {
            onLoginSuccess(data.sellerId);
            toast.success("Login realizado com sucesso!");
          } else {
            toast.error("Falha na autenticação. Verifique suas credenciais.");
          }
        } catch (firstError) {
          console.log("First login attempt failed, trying alternative URL");
          
          // Se falhar, tenta caminho sem /api no início
          loginUrl = getNgrokUrl('/auth/login');
          console.log("Trying alternative login at:", loginUrl);
          
          try {
            const response = await axios.post(loginUrl, {
              sellerId: data.sellerId,
              password: data.password,
            });
            
            if (response.data.success) {
              onLoginSuccess(data.sellerId);
              toast.success("Login realizado com sucesso!");
            } else {
              toast.error("Falha na autenticação. Verifique suas credenciais.");
            }
          } catch (secondError) {
            // Se ainda falhar, tenta uma terceira opção - diretamente /login
            loginUrl = getNgrokUrl('/login');
            console.log("Trying final login URL:", loginUrl);
            
            try {
              const response = await axios.post(loginUrl, {
                sellerId: data.sellerId,
                password: data.password,
              });
              
              if (response.data.success) {
                onLoginSuccess(data.sellerId);
                toast.success("Login realizado com sucesso!");
              } else {
                toast.error("Falha na autenticação. Verifique suas credenciais.");
              }
            } catch (thirdError) {
              console.error("All login attempts failed:", thirdError);
              toast.error("Erro ao realizar login. Verifique o endpoint da API.");
            }
          }
        }
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
