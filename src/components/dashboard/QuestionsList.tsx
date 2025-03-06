
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

// URL do endpoint
const ASKS_URL = 'https://7dbd2e762353.ngrok.app/all_asks.txt';

interface Question {
  item_id: string;
  question_id: string;
  date_created: string;
  text: string;
  status: string;
  answer?: string;
  date_answered?: string;
}

function parseQuestions(text: string): Question[] {
  const blocks = text.split('\n-------------------------------------------------\n');
  const questions: Question[] = [];
  
  blocks.forEach(block => {
    if (!block.trim()) return;
    
    const lines = block.split('\n');
    const questionData: Partial<Question> = {};
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('Item ID:')) {
        questionData.item_id = line.replace('Item ID:', '').trim();
      } else if (line.startsWith('Question ID:')) {
        questionData.question_id = line.replace('Question ID:', '').trim();
      } else if (line.startsWith('Date created:')) {
        questionData.date_created = line.replace('Date created:', '').trim();
      } else if (line.startsWith('Text:')) {
        questionData.text = line.replace('Text:', '').trim();
      } else if (line.startsWith('Status:')) {
        questionData.status = line.replace('Status:', '').trim();
      } else if (line.startsWith('Answer:')) {
        questionData.answer = line.replace('Answer:', '').trim();
      } else if (line.startsWith('Date answered:')) {
        questionData.date_answered = line.replace('Date answered:', '').trim();
      }
    }
    
    if (questionData.item_id && questionData.question_id) {
      questions.push(questionData as Question);
    }
  });
  
  return questions;
}

// Format date string
function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

interface ProductInfoProps {
  itemId: string;
  mlToken?: string;
}

function ProductInfo({ itemId, mlToken }: ProductInfoProps) {
  const [product, setProduct] = useState<any>(null);
  
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        if (!itemId) return;
        
        const response = await fetch(`https://api.mercadolibre.com/items/${itemId}`);
        const data = await response.json();
        setProduct(data);
      } catch (error) {
        console.error("Erro ao buscar detalhes do produto:", error);
      }
    };
    
    fetchProduct();
  }, [itemId]);
  
  if (!product) {
    return (
      <div className="h-10 flex items-center">
        <div className="animate-pulse h-4 bg-gray-200 rounded w-32"></div>
      </div>
    );
  }
  
  return (
    <div className="flex items-center">
      <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden mr-3 border border-gray-200">
        {product.thumbnail && (
          <img 
            src={product.secure_thumbnail || product.thumbnail} 
            alt={product.title} 
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{product.title}</p>
        <p className="text-xs text-gray-500">{product.price ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price) : ''}</p>
      </div>
    </div>
  );
}

interface QuestionsListProps {
  mlToken?: string;
}

const QuestionsList: React.FC<QuestionsListProps> = ({ mlToken }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [answering, setAnswering] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [filter, setFilter] = useState('unanswered');
  const [searchText, setSearchText] = useState('');
  
  const { toast } = useToast();

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const response = await fetch(ASKS_URL);
      const text = await response.text();
      const parsedQuestions = parseQuestions(text);
      setQuestions(parsedQuestions);
    } catch (error) {
      console.error("Erro ao carregar perguntas:", error);
      toast({
        title: "Erro ao carregar perguntas",
        description: "Não foi possível obter a lista de perguntas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
    const interval = setInterval(loadQuestions, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmitAnswer = async () => {
    if (!answering || !answerText.trim()) return;
    
    try {
      const response = await fetch('https://7dbd2e762353.ngrok.app/answer_question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question_id: answering,
          answer_text: answerText
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        toast({
          title: "Resposta enviada",
          description: "Sua resposta foi registrada com sucesso",
        });
        
        // Atualiza a pergunta na lista
        setQuestions(prevQuestions => 
          prevQuestions.map(q => 
            q.question_id === answering 
              ? { 
                  ...q, 
                  answer: answerText,
                  status: 'ANSWERED',
                  date_answered: new Date().toISOString()
                }
              : q
          )
        );
        
        setAnswerText('');
        setAnswering(null);
      } else {
        throw new Error(result.message || "Erro ao enviar resposta");
      }
    } catch (error) {
      console.error("Erro ao responder pergunta:", error);
      toast({
        title: "Erro ao enviar resposta",
        description: "Não foi possível registrar sua resposta",
        variant: "destructive",
      });
    }
  };

  const filteredQuestions = questions
    .filter(q => {
      // Filter by status
      if (filter === 'unanswered' && q.status !== 'UNANSWERED') return false;
      if (filter === 'answered' && q.status !== 'ANSWERED') return false;
      
      // Filter by search text
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        return q.text.toLowerCase().includes(searchLower);
      }
      
      return true;
    })
    .sort((a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime());

  return (
    <div className="flex flex-col h-full">
      <div className="bg-primary text-white p-4">
        <h1 className="text-xl font-bold mb-4">Perguntas de Produtos</h1>
        <div className="flex items-center gap-2">
          <Input 
            className="flex-1 bg-white text-black"
            placeholder="Buscar pergunta..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <div className="flex gap-1">
            <Button 
              variant={filter === 'all' ? "secondary" : "ghost"}
              className="text-white border border-white"
              onClick={() => setFilter('all')}
            >
              Todas
            </Button>
            <Button 
              variant={filter === 'unanswered' ? "secondary" : "ghost"}
              className="text-white border border-white"
              onClick={() => setFilter('unanswered')}
            >
              Não respondidas
            </Button>
            <Button 
              variant={filter === 'answered' ? "secondary" : "ghost"}
              className="text-white border border-white"
              onClick={() => setFilter('answered')}
            >
              Respondidas
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {filteredQuestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <p className="mb-2 text-lg">Nenhuma pergunta {filter === 'unanswered' ? 'não respondida' : filter === 'answered' ? 'respondida' : ''} encontrada</p>
                <Button onClick={loadQuestions}>Atualizar</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredQuestions.map((question) => (
                  <Card key={question.question_id} className={question.status === 'UNANSWERED' ? 'border-l-4 border-l-amber-500' : ''}>
                    <CardHeader className="pb-2">
                      <ProductInfo itemId={question.item_id} mlToken={mlToken} />
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-medium text-gray-900">{question.text}</h3>
                          <span className="text-xs text-gray-500">{formatDate(question.date_created)}</span>
                        </div>
                        
                        {question.answer && (
                          <div className="mt-3 ml-6 pl-3 border-l-2 border-gray-200">
                            <p className="text-gray-700">{question.answer}</p>
                            {question.date_answered && (
                              <p className="text-xs text-gray-500 mt-1">{formatDate(question.date_answered)}</p>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {question.status === 'UNANSWERED' && (
                        <>
                          {answering === question.question_id ? (
                            <div className="mt-3">
                              <Input 
                                placeholder="Digite sua resposta..."
                                value={answerText}
                                onChange={(e) => setAnswerText(e.target.value)}
                                className="mb-2"
                              />
                              <div className="flex gap-2 justify-end">
                                <Button 
                                  variant="outline"
                                  onClick={() => {
                                    setAnswering(null);
                                    setAnswerText('');
                                  }}
                                >
                                  Cancelar
                                </Button>
                                <Button onClick={handleSubmitAnswer}>
                                  Responder
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button 
                              onClick={() => setAnswering(question.question_id)}
                              className="w-full"
                            >
                              Responder
                            </Button>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default QuestionsList;
