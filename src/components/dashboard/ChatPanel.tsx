import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  ChangeEvent,
} from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useMlToken } from "@/hooks/useMlToken";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dot } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ChatPanelProps {
  conversation: any;
  isGpt?: boolean;
  isComplaint?: boolean;
  complaintData?: any;
}

const API_URL = "https://projetohermes-dda7e0c8d836.herokuapp.com";

const gpt_ids = {
  "giovaniburgo@gmail.com": "653796959f99a3993c4f596b",
  "brunoburgo.dev@gmail.com": "653796959f99a3993c4f596b",
  "suporte@smartreply.com.br": "653796959f99a3993c4f596b",
  "smartreply.com.br@gmail.com": "653796959f99a3993c4f596b",
};

export function ChatPanel({ conversation, isGpt, isComplaint, complaintData }: ChatPanelProps) {
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mlToken, setMlToken] = useState<any | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const mlTokenFromHook = useMlToken();

  useEffect(() => {
    setMlToken(mlTokenFromHook);
  }, [mlTokenFromHook]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages, scrollToBottom]);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    if (fileRef.current) {
      fileRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!conversation || (!messageInput.trim() && !selectedImage) || isSubmitting) {
      return;
    }

    const formData = new FormData();
    if (selectedImage) {
      formData.append("image", selectedImage);
    }

    formData.append("message", messageInput.trim());
    formData.append("conversationId", conversation.id);
    formData.append("packId", conversation.packId || "");
    formData.append("orderId", conversation.orderId?.toString() || "");
    
    // Fix the access_token error by checking if mlToken has the access_token property
    let accessToken = "";
    if (mlToken && typeof mlToken === 'object') {
      if ('access_token' in mlToken) {
        accessToken = mlToken.access_token;
      } else if ('seller_id' in mlToken) {
        // If no access_token, use a default or placeholder
        accessToken = "no-token-available";
      }
    }
    
    formData.append("accessToken", accessToken || "");

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/messages/send", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      setMessageInput("");
      setSelectedImage(null);
      toast.success("Mensagem enviada com sucesso!");

    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Erro ao enviar mensagem. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderMessageContent = (message: any) => {
    if (message.image_url) {
      return (
        <img
          src={message.image_url}
          alt="Uploaded"
          className="max-w-xs max-h-40 rounded-md"
        />
      );
    } else {
      return <p className="text-sm">{message.text}</p>;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {isComplaint && complaintData ? (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Detalhes da Reclamação</CardTitle>
            <CardDescription>Informações sobre a reclamação do cliente.</CardDescription>
          </CardHeader>
          <CardContent>
            <p><strong>ID da Reclamação:</strong> {complaintData.claim_id}</p>
            <p><strong>Status:</strong> {complaintData.claim_status}</p>
            <p><strong>Razão:</strong> {complaintData.claim_reason}</p>
          </CardContent>
        </Card>
      ) : null}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {conversation?.messages?.map((message: any) => (
            <div
              key={message.id}
              className={`flex flex-col ${
                message.origin === "customer" ? "items-start" : "items-end"
              }`}
            >
              <div
                className={`flex flex-col rounded-lg p-3 max-w-sm ${
                  message.origin === "customer"
                    ? "bg-gray-100 text-gray-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {renderMessageContent(message)}
                <span className="text-xs text-gray-500 mt-1 self-end">
                  {formatDistanceToNow(new Date(message.message_date.created), {
                    locale: ptBR,
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      <div className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <Input
            type="text"
            placeholder="Digite sua mensagem..."
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            className="flex-1"
          />
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
            id="image-upload"
            ref={fileRef}
          />
          <Label htmlFor="image-upload" className="cursor-pointer">
            {selectedImage ? (
              <Badge variant="secondary" onClick={handleRemoveImage}>
                Remover Imagem
              </Badge>
            ) : (
              <Button variant="outline" size="sm" disabled={isUploading}>
                {isUploading ? "Enviando..." : "Adicionar Imagem"}
              </Button>
            )}
          </Label>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Enviando..." : "Enviar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
