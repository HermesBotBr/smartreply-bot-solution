
import React, { useState, useEffect } from 'react';
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
type EnvRow = {
  seller_id: string;
  password_id: string;
  [key: string]: any;
};

interface HermesLoginProps {
  onLoginSuccess: (sellerId: string) => void;
}

const HermesLogin: React.FC<HermesLoginProps> = ({ onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [envData, setEnvData] = useState<EnvRow[]>([]);
  const [isLoadingEnvData, setIsLoadingEnvData] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Initialize form
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sellerId: "",
      password: "",
    },
  });

  // Fetch env table data on component mount
  useEffect(() => {
    const fetchEnvData = async () => {
      setIsLoadingEnvData(true);
      setLoadError(null);
      
      try {
        const dbRowsUrl = getNgrokUrl('/api/db/rows/env');
        console.log("Fetching env data from:", dbRowsUrl);
        
        const response = await axios.get(dbRowsUrl);
        
        if (response.data && Array.isArray(response.data.rows)) {
          setEnvData(response.data.rows);
          console.log("Env data loaded successfully:", response.data.rows.length, "rows");
        } else {
          console.error("Invalid response format for env data:", response.data);
          setLoadError("Formato de resposta inválido ao carregar dados de autenticação");
        }
      } catch (error) {
        console.error("Error fetching env data:", error);
        setLoadError("Erro ao carregar dados de autenticação. Verifique a conexão com o servidor.");
      } finally {
        setIsLoadingEnvData(false);
      }
    };
    
    fetchEnvData();
  }, []);

  // Function to activate notifications for a seller
  const activateNotifications = async (sellerId: string) => {
    try {
      console.log("Activating notifications for seller:", sellerId);
      
      await axios.post(getNgrokUrl('/notifica'), {
        seller_id: sellerId,
        notifica: "on"
      });
      
      console.log("Notifications activated successfully");
    } catch (error) {
      console.error("Error activating notifications:", error);
      // We don't show an error toast here to not disturb the user experience
      // The login process continues normally even if this call fails
    }
  };

  // Function to notify backend about the login
  const notifyBackendConfig = async (sellerId: string) => {
    try {
      console.log("Notifying backend config for seller:", sellerId);
      
      await axios.post(getNgrokUrl('/config'), {
        seller_id: sellerId,
        command: "add"
      });
      
      console.log("Backend config notification successful");
      
      // Also activate notifications for this seller
      await activateNotifications(sellerId);
    } catch (error) {
      console.error("Error notifying backend config:", error);
      // We don't show an error toast here to not disturb the user experience
      // The login process continues normally even if this call fails
    }
  };

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    
    try {
      // Check if we're in the preview environment
      const isPreview = typeof window !== 'undefined' && 
        window.location.hostname.includes('preview--smartreply-bot-solution.lovable.app');
      
      if (isPreview) {
        // In preview mode, simulate successful login for any credentials
        console.log("Preview mode: Simulating successful login");
        setTimeout(async () => {
          // Notify backend about login
          await notifyBackendConfig(data.sellerId);
          
          onLoginSuccess(data.sellerId);
          toast.success("Login simulado com sucesso (ambiente de preview)");
        }, 1000);
      } else {
        // Validate against env table data
        const matchingUser = envData.find(
          user => user.seller_id === data.sellerId && user.password_id === data.password
        );
        
        if (matchingUser) {
          console.log("Login validated successfully for seller ID:", data.sellerId);
          
          // Notify backend about login
          await notifyBackendConfig(data.sellerId);
          
          onLoginSuccess(data.sellerId);
          toast.success("Login realizado com sucesso!");
        } else {
          console.log("Login failed: Invalid credentials");
          toast.error("Credenciais inválidas. Verifique seu ID de vendedor e senha.");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Erro ao realizar login. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingEnvData) {
    return (
      <div className="w-full space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Carregando...</h1>
          <p className="text-gray-500">
            Aguarde enquanto carregamos os dados de autenticação
          </p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="w-full space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Erro de Conexão</h1>
          <p className="text-red-500">
            {loadError}
          </p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
          >
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

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
