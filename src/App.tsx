import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import Index from "./pages/Index";
import ThankYou from "./pages/ThankYou";
import Form from "./pages/Form";
import HelloWorld from "./pages/HelloWorld";
import UserGiovaniBurgo from "./pages/UserGiovaniBurgo";
import NotificationEndpoint from "./pages/NotificationEndpoint";
import WhatsAppButton from "./components/WhatsAppButton";
import Relatorio from "./pages/Relatorio";
import MercadoLivreCallback from "./pages/MercadoLivreCallback";
import TokenRequest from "./pages/TokenRequest";
import Hermes from "./pages/Hermes";
import DesenvolvedorSql from "./pages/DesenvolvedorSql";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

// Component to conditionally render header and footer
const AppLayout = () => {
  const location = useLocation();
  const isUserGiovaniBurgo = location.pathname === "/user_giovaniburgo";
  const isNotificationEndpoint = location.pathname === "/notification-endpoint";
  const isMlCallback = location.pathname === "/ml-callback";
  const isTokenRequest = location.pathname === "/token-request";
  const isHermes = location.pathname === "/hermes";
  const isDesenvolvedorSql = location.pathname === "/desenvolvedorsql";

  return (
    <div className="min-h-screen flex flex-col">
      {!isUserGiovaniBurgo && !isNotificationEndpoint && !isMlCallback && !isTokenRequest && !isHermes && !isDesenvolvedorSql && <Header />}
      <main className={`flex-grow ${!isUserGiovaniBurgo && !isNotificationEndpoint && !isMlCallback && !isTokenRequest && !isHermes && !isDesenvolvedorSql ? "pt-16" : ""}`}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/obrigado" element={<ThankYou />} />
          <Route path="/form" element={<Form />} />
          <Route path="/hello-world" element={<HelloWorld />} />
          <Route path="/user_giovaniburgo" element={<UserGiovaniBurgo />} />
          <Route path="/notification-endpoint" element={<NotificationEndpoint />} />
          <Route path="/relatorio" element={<Relatorio />} />
          <Route path="/ml-callback" element={<MercadoLivreCallback />} />
          <Route path="/token-request" element={<TokenRequest />} />
          <Route path="/hermes" element={<Hermes />} />
          <Route path="/desenvolvedorsql" element={<DesenvolvedorSql />} />
        </Routes>
      </main>
      {!isUserGiovaniBurgo && !isNotificationEndpoint && !isMlCallback && !isTokenRequest && !isHermes && !isDesenvolvedorSql && <Footer />}
      {!isUserGiovaniBurgo && !isNotificationEndpoint && !isMlCallback && !isTokenRequest && !isHermes && !isDesenvolvedorSql && <WhatsAppButton />}
    </div>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
