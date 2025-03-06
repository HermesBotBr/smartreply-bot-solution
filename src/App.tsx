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
import WhatsAppButton from "./components/WhatsAppButton";

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

  return (
    <div className="min-h-screen flex flex-col">
      {!isUserGiovaniBurgo && <Header />}
      <main className={`flex-grow ${!isUserGiovaniBurgo ? "pt-16" : ""}`}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/obrigado" element={<ThankYou />} />
          <Route path="/form" element={<Form />} />
          <Route path="/hello-world" element={<HelloWorld />} />
          <Route path="/user_giovaniburgo" element={<UserGiovaniBurgo />} />
        </Routes>
      </main>
      {!isUserGiovaniBurgo && <Footer />}
      {!isUserGiovaniBurgo && <WhatsAppButton />}
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
