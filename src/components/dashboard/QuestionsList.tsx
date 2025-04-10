import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronUp, Loader2, Search, Filter, AlertTriangle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getNgrokUrl } from "@/config/api";

interface Question {
  id: number;
  date_created: string;
  item_id: string;
  seller_id: number;
  status: string;
  text: string;
  deleted_from_listing: boolean;
  answer: {
    text: string;
    status: string;
    date_created: string;
  } | null;
  from: {
    id: number;
  };
}

interface Product {
  id: string;
  title: string;
  thumbnail: string;
  questions: Question[];
  hasUnansweredQuestions?: boolean;
}

interface ProductAPIResponse {
  items: {
    mlb: string;
    title: string;
    image: string;
  }[];
}

const QuestionsList: React.FC = () => {
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterNoAnswers, setFilterNoAnswers] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [answering, setAnswering] = useState<Question | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showDeletedQuestions, setShowDeletedQuestions] = useState(true);

  useEffect(() => {
    const auth = localStorage.getItem('hermesAuth');
    if (auth) {
      try {
        const authData = JSON.parse(auth);
        if (authData.sellerId) {
          setSellerId(authData.sellerId);
        }
      } catch (error) {
        console.error("Erro ao analisar dados de autenticação:", error);
      }
    }
  }, []);

  useEffect(() => {
    if (sellerId) {
      fetchAnuncios();
    }
  }, [sellerId]);

  const fetchAnuncios = async () => {
    if (!sellerId) return;
    
    setLoading(true);
    try {
      const response = await fetch(getNgrokUrl(`/anuncios?seller_id=${sellerId}`));
      if (!response.ok) {
        throw new Error(`Erro ao buscar anúncios: ${response.status}`);
      }
      
      const data = await response.json() as ProductAPIResponse;
      if (data && data.items && Array.isArray(data.items)) {
        const initialProducts = data.items.map(item => ({
          id: item.mlb,
          title: item.title,
          thumbnail: item.image.replace('http://', 'https://'),
          questions: []
        }));
        
        setProducts(initialProducts);
        
        for (const product of initialProducts) {
          fetchProductQuestions(product.id);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar anúncios:", error);
      toast.error("Erro ao carregar anúncios");
    } finally {
      setLoading(false);
    }
  };

  const fetchProductQuestions = async (itemId: string) => {
    if (!sellerId) return;
    
    try {
      const response = await fetch(getNgrokUrl(`/perguntas?seller_id=${sellerId}&mlb=${itemId}`));
      if (!response.ok) {
        console.error(`Erro ao buscar perguntas do produto ${itemId}: ${response.status}`);
        return;
      }
      
      const data = await response.json();
      if (data && data.questions && Array.isArray(data.questions)) {
        setProducts(prev => {
          const updatedProducts = prev.map(product => {
            if (product.id === itemId) {
              const hasUnansweredQuestions = data.questions.some((q: Question) => q.status === "UNANSWERED");
              return {
                ...product,
                questions: data.questions,
                hasUnansweredQuestions
              };
            }
            return product;
          });
          
          return updatedProducts.sort((a, b) => {
            if (a.hasUnansweredQuestions && !b.hasUnansweredQuestions) return -1;
            if (!a.hasUnansweredQuestions && b.hasUnansweredQuestions) return 1;
            return 0;
          });
        });
      }
    } catch (error) {
      console.error(`Erro ao buscar perguntas do produto ${itemId}:`, error);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answering || !answerText.trim() || !sellerId) {
      return;
    }
    
    setSubmitting(true);
    try {
      const response = await fetch(getNgrokUrl('/responder-pergunta'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question_id: answering.id.toString(),
          answer_text: answerText,
          seller_id: sellerId
        })
      });
      
      if (!response.ok) {
        throw new Error('Erro ao enviar resposta');
      }
      
      const data = await response.json();
      if (data.success) {
        toast.success('Resposta enviada com sucesso');
        
        setProducts(prev => prev.map(product => {
          if (product.id === answering.item_id) {
            return {
              ...product,
              questions: product.questions.map(question => {
                if (question.id === answering.id) {
                  return {
                    ...question,
                    status: "ANSWERED",
                    answer: {
                      text: answerText,
                      status: "ACTIVE",
                      date_created: new Date().toISOString()
                    }
                  };
                }
                return question;
              })
            };
          }
          return product;
        }));
        
        setAnswering(null);
        setAnswerText('');
      } else {
        throw new Error(data.message || 'Erro ao enviar resposta');
      }
    } catch (error) {
      console.error('Erro ao enviar resposta:', error);
      toast.error(`Falha ao enviar resposta: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const toggleExpandedQuestions = (productId: string) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  const filteredProducts = products
    .filter(product => {
      if (searchQuery) {
        const title = product.title || product.id;
        const allQuestionTexts = product.questions.map(q => q.text).join(' ');
        const allAnswerTexts = product.questions
          .filter(q => q.answer)
          .map(q => q.answer?.text || '')
          .join(' ');
        
        const searchLower = searchQuery.toLowerCase();
        
        if (!title.toLowerCase().includes(searchLower) && 
            !allQuestionTexts.toLowerCase().includes(searchLower) && 
            !allAnswerTexts.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      
      if (selectedProduct && product.id !== selectedProduct) {
        return false;
      }
      
      if (filterNoAnswers) {
        const hasUnansweredQuestions = product.questions.some(q => q.status === "UNANSWERED");
        if (!hasUnansweredQuestions) {
          return false;
        }
      }
      
      return true;
    })
    .map(product => {
      const filteredQuestions = product.questions.filter(question => {
        if (!showDeletedQuestions && question.deleted_from_listing) {
          return false;
        }
        
        if (searchQuery) {
          const questionText = question.text.toLowerCase();
          const answerText = question.answer?.text?.toLowerCase() || '';
          
          if (!questionText.includes(searchQuery.toLowerCase()) && 
              !answerText.includes(searchQuery.toLowerCase())) {
            return false;
          }
        }
        
        if (filterNoAnswers && question.status !== "UNANSWERED") {
          return false;
        }
        
        return true;
      });
      
      return {
        ...product,
        filteredQuestions
      };
    })
    .filter(product => product.filteredQuestions.length > 0);

  const sortedFilteredProducts = [...filteredProducts].sort((a, b) => {
    const aHasUnanswered = a.filteredQuestions.some(q => q.status === "UNANSWERED");
    const bHasUnanswered = b.filteredQuestions.some(q => q.status === "UNANSWERED");
    
    if (aHasUnanswered && !bHasUnanswered) return -1;
    if (!aHasUnanswered && bHasUnanswered) return 1;
    return 0;
  });

  return (
    <div className="flex flex-col h-full">
      <div className="bg-primary text-white p-4">
        <h1 className="text-xl font-bold mb-4">Perguntas de Produtos</h1>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
            <Input 
              className="pl-8 bg-white text-black"
              placeholder="Buscar pergunta..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button 
            variant="secondary"
            onClick={() => setFilterModalOpen(true)}
          >
            <Filter size={18} className="mr-2" />
            Filtros
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-gray-500">Carregando perguntas...</p>
          </div>
        ) : sortedFilteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <p className="mb-2 text-lg">
              {searchQuery ? "Nenhuma pergunta encontrada para esta pesquisa" : 
               filterNoAnswers ? "Nenhuma pergunta sem resposta encontrada" : 
               selectedProduct ? "Nenhuma pergunta encontrada para este anúncio" : 
               "Nenhuma pergunta encontrada"}
            </p>
            <Button onClick={fetchAnuncios}>Atualizar</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedFilteredProducts.map((product) => {
              const isExpanded = expandedQuestions[product.id] || false;
              const questions = product.filteredQuestions || [];
              const visibleQuestions = isExpanded ? questions : questions.slice(0, 3);
              
              return (
                <Card key={product.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center">
                      <div className="rounded-full overflow-hidden w-12 h-12 border border-gray-300">
                        <img 
                          src={product.thumbnail} 
                          alt={product.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://http2.mlstatic.com/frontend-assets/ui-navigation/5.19.5/mercadolibre/navigation_image_not_found.svg";
                          }}
                        />
                      </div>
                      <div className="ml-3 flex-1">
                        <h3 className="font-medium text-sm">{product.title}</h3>
                        <p className="text-xs text-gray-500">{product.id}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-1/2">Pergunta</TableHead>
                          <TableHead className="w-1/4">Status</TableHead>
                          <TableHead className="w-1/4">Data</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {visibleQuestions.map((question) => {
                          const isUnanswered = question.status === "UNANSWERED";
                          const isDeleted = question.deleted_from_listing;
                          
                          return (
                            <TableRow 
                              key={question.id}
                              className={`cursor-pointer ${isUnanswered ? 'bg-amber-50' : ''} ${isDeleted ? 'bg-gray-100' : ''}`}
                              onClick={() => {
                                setAnswering(question);
                                setAnswerText(question.answer?.text || '');
                              }}
                            >
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-1">
                                  {isDeleted && (
                                    <AlertTriangle size={16} className="text-orange-500 shrink-0" />
                                  )}
                                  <span className={isDeleted ? "text-gray-500 line-through" : ""}>
                                    {question.text.length > 80 
                                      ? `${question.text.substring(0, 80)}...` 
                                      : question.text}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1 items-center">
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    isUnanswered 
                                      ? 'bg-amber-100 text-amber-800' 
                                      : 'bg-green-100 text-green-800'
                                  }`}>
                                    {isUnanswered ? 'Sem resposta' : 'Respondida'}
                                  </span>
                                  {isDeleted && (
                                    <span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                                      Deletada
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{formatDate(question.date_created)}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                    
                    {questions.length > 3 && (
                      <Button
                        variant="ghost"
                        className="w-full text-gray-500 mt-2"
                        onClick={() => toggleExpandedQuestions(product.id)}
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="mr-2 h-4 w-4" />
                            Ver menos
                          </>
                        ) : (
                          <>
                            <ChevronDown className="mr-2 h-4 w-4" />
                            Ver mais {questions.length - 3} perguntas
                          </>
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      
      <Dialog open={filterModalOpen} onOpenChange={setFilterModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Filtrar Perguntas</DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="flex items-center space-x-2">
              <Switch 
                id="filter-no-answers"
                checked={filterNoAnswers}
                onCheckedChange={setFilterNoAnswers}
              />
              <Label htmlFor="filter-no-answers">Mostrar apenas perguntas sem respostas</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="show-deleted-questions"
                checked={showDeletedQuestions}
                onCheckedChange={setShowDeletedQuestions}
              />
              <Label htmlFor="show-deleted-questions">Mostrar perguntas deletadas</Label>
            </div>
            
            <div className="space-y-2">
              <Label>Filtrar por anúncio</Label>
              <div className="max-h-60 overflow-y-auto space-y-2 border rounded-md p-2">
                <div 
                  className={`flex items-center p-2 hover:bg-gray-100 rounded-md cursor-pointer ${selectedProduct === null ? 'bg-blue-50' : ''}`}
                  onClick={() => setSelectedProduct(null)}
                >
                  <div className="ml-2">Todos os anúncios</div>
                </div>
                {products.map((product) => (
                  <div 
                    key={product.id}
                    className={`flex items-center p-2 hover:bg-gray-100 rounded-md cursor-pointer ${selectedProduct === product.id ? 'bg-blue-50' : ''}`}
                    onClick={() => setSelectedProduct(product.id)}
                  >
                    <div className="rounded-full overflow-hidden w-8 h-8 border border-gray-300">
                      <img 
                        src={product.thumbnail} 
                        alt={product.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://http2.mlstatic.com/frontend-assets/ui-navigation/5.19.5/mercadolibre/navigation_image_not_found.svg";
                        }}
                      />
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{product.title}</p>
                      <p className="text-xs text-gray-500">{product.id}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button 
              variant="outline" 
              className="mr-2"
              onClick={() => {
                setFilterNoAnswers(false);
                setSelectedProduct(null);
                setShowDeletedQuestions(true);
              }}
            >
              Limpar filtros
            </Button>
            <Button onClick={() => setFilterModalOpen(false)}>
              Aplicar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={!!answering} onOpenChange={(open) => !open && setAnswering(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {answering?.status === "UNANSWERED" ? "Responder Pergunta" : "Detalhes da Pergunta"}
              {answering?.deleted_from_listing && (
                <span className="ml-2 text-sm font-normal text-orange-500 flex items-center">
                  <AlertTriangle size={16} className="mr-1" />
                  Esta pergunta foi deletada da listagem
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {answering && (
            <div className="py-4 space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-1 text-gray-500">Produto</h3>
                <div className="flex items-center p-2 bg-gray-50 rounded">
                  {products.find(p => p.id === answering.item_id) && (
                    <div className="rounded-full overflow-hidden w-8 h-8 border border-gray-300">
                      <img 
                        src={products.find(p => p.id === answering.item_id)?.thumbnail}
                        alt={products.find(p => p.id === answering.item_id)?.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://http2.mlstatic.com/frontend-assets/ui-navigation/5.19.5/mercadolibre/navigation_image_not_found.svg";
                        }}
                      />
                    </div>
                  )}
                  <div className="ml-3">
                    <p className="text-sm font-medium">
                      {products.find(p => p.id === answering.item_id)?.title || answering.item_id}
                    </p>
                    <p className="text-xs text-gray-500">{answering.item_id}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold mb-1 text-gray-500">Pergunta</h3>
                <div className={`p-3 rounded ${answering.deleted_from_listing ? 'bg-orange-50' : 'bg-gray-50'}`}>
                  <p className={`whitespace-pre-wrap ${answering.deleted_from_listing ? 'text-gray-500' : ''}`}>
                    {answering.text}
                  </p>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-gray-500 text-right">
                      {formatDate(answering.date_created)}
                    </p>
                    {answering.deleted_from_listing && (
                      <span className="text-xs flex items-center text-orange-600">
                        <AlertTriangle size={14} className="mr-1" />
                        Deletada
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {answering.status === "ANSWERED" ? (
                <div>
                  <h3 className="text-sm font-semibold mb-1 text-gray-500">Resposta</h3>
                  <div className="p-3 bg-green-50 rounded">
                    <p className="whitespace-pre-wrap">{answering.answer?.text}</p>
                    <p className="text-xs text-gray-500 mt-1 text-right">
                      {answering.answer ? formatDate(answering.answer.date_created) : ''}
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-sm font-semibold mb-1 text-gray-500">Sua resposta</h3>
                  <textarea
                    className="w-full p-3 border rounded h-32 focus:outline-none focus:ring focus:ring-blue-300"
                    placeholder="Digite sua resposta aqui..."
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    disabled={answering.deleted_from_listing}
                  />
                  {answering.deleted_from_listing ? (
                    <div className="mt-2 p-3 bg-orange-100 rounded text-sm text-orange-800">
                      Esta pergunta foi removida da listagem e não pode ser respondida.
                    </div>
                  ) : (
                    <Button 
                      className="w-full mt-2" 
                      onClick={handleSubmitAnswer}
                      disabled={!answerText.trim() || submitting}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        'Enviar Resposta'
                      )}
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuestionsList;
