import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronUp } from "lucide-react";
import { getNgrokUrl } from '@/config/api';
import ProductThumbnail from './ProductThumbnail';

const ASKS_URL = 'https://b4c027be31fe.ngrok.app/all_asks.txt';

interface Question {
  item_id: string;
  question_id: string;
  date_created: string;
  text: string;
  status: string;
  answer?: string;
  date_answered?: string;
}

interface QAPair {
  question: string;
  answer: string;
}

interface AskBlock {
  itemTitle: string;
  itemId: string;
  qa: string[];
  latestDate: Date;
}

interface Announcement {
  id: string;
  title: string;
  latestDate: Date;
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

function parseAsks(text: string): AskBlock[] {
  const blocks = text
    .split("-----------------------------------------------------")
    .map(b => b.trim())
    .filter(b => b.length > 0)
    .map(block => {
      const lines = block
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
      if (lines.length < 3) return null;
      const itemTitle = lines[0];
      const itemId = lines[1];
      const qaLines = lines.slice(2);
      let latestDate: Date | null = null;
      qaLines.forEach(line => {
        if (line.toLowerCase().startsWith('buyer:')) {
          const match = line.match(/\((.*?)\)/);
          if (match) {
            const parsedDate = new Date(match[1]);
            if (!isNaN(parsedDate.getTime())) {
              if (latestDate === null || parsedDate > latestDate) {
                latestDate = parsedDate;
              }
            }
          }
        }
      });
      if (!latestDate) return null;
      return { itemTitle, itemId, qa: qaLines, latestDate };
    })
    .filter(block => block !== null) as AskBlock[];
  
  blocks.sort((a, b) => b.latestDate.getTime() - a.latestDate.getTime());
  return blocks;
}

function getQAPairs(qaLines: string[]): QAPair[] {
  const pairs: QAPair[] = [];
  for (let i = 0; i < qaLines.length; i++) {
    if (qaLines[i].toLowerCase().startsWith('buyer:')) {
      const question = qaLines[i];
      let answer = "";
      if (i + 1 < qaLines.length && qaLines[i + 1].toLowerCase().startsWith('seller:')) {
        answer = qaLines[i + 1];
        i++; // Skip the answer line
      }
      pairs.push({ question, answer });
    }
  }
  return pairs;
}

function formatTitle(title: string): string {
  const words = title.split(' ');
  let line = "";
  let result = "";
  words.forEach(word => {
    if ((line + (line ? " " : "") + word).length <= 35) {
      line += (line ? " " : "") + word;
    } else {
      result += (result ? "\n" : "") + line;
      line = word;
    }
  });
  if (line) {
    result += (result ? "\n" : "") + line;
  }
  return result;
}

function truncateText(text: string, n: number): string {
  return text.length > n ? text.substring(0, n) + "..." : text;
}

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
      <div className="w-10 h-10 bg-gray-100 rounded-full overflow-hidden mr-3 border border-gray-200">
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
  const [asks, setAsks] = useState<AskBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [answering, setAnswering] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [searchText, setSearchText] = useState('');
  const [filterNoAnswers, setFilterNoAnswers] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<string | null>(null);
  const [selectedQAPair, setSelectedQAPair] = useState<QAPair | null>(null);
  const [expandedBlocks, setExpandedBlocks] = useState<Record<string, boolean>>({});
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  
  const { toast } = useToast();

  const loadAsks = async () => {
    try {
      setLoading(true);
      const response = await fetch(getNgrokUrl('all_asks.txt'));
      const text = await response.text();
      const parsedAsks = parseAsks(text);
      setAsks(parsedAsks);
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
    loadAsks();
    const interval = setInterval(loadAsks, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmitAnswer = async () => {
    if (!answering || !answerText.trim()) return;
    
    try {
      const response = await fetch(getNgrokUrl('answer_question'), {
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
        
        loadAsks();
        
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

  const filteredAsks = asks.filter(ask => {
    const combinedText = [ask.itemTitle, ask.itemId, ...ask.qa].join(' ').toLowerCase();
    if (searchText && !combinedText.includes(searchText.toLowerCase())) return false;
    
    if (filterNoAnswers) {
      const qaPairs = getQAPairs(ask.qa);
      const unansweredPairs = qaPairs.filter(pair => !pair.answer || pair.answer.trim() === "");
      if (unansweredPairs.length === 0) return false;
    }
    
    if (selectedAnnouncement && ask.itemId !== selectedAnnouncement) return false;
    
    return true;
  });

  const uniqueAnnouncements: Announcement[] = (() => {
    const uniqueMap = new Map<string, Announcement>();
    asks.forEach(ask => {
      if (!uniqueMap.has(ask.itemId)) {
        uniqueMap.set(ask.itemId, { id: ask.itemId, title: ask.itemTitle, latestDate: ask.latestDate });
      } else {
        if (ask.latestDate > uniqueMap.get(ask.itemId)!.latestDate) {
          uniqueMap.set(ask.itemId, { id: ask.itemId, title: ask.itemTitle, latestDate: ask.latestDate });
        }
      }
    });
    const arr = Array.from(uniqueMap.values());
    arr.sort((a, b) => b.latestDate.getTime() - a.latestDate.getTime());
    return arr;
  })();

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
          <Button 
            variant="secondary"
            onClick={() => setFilterModalVisible(true)}
          >
            Filtros
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {filteredAsks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <p className="mb-2 text-lg">
                  {filterNoAnswers 
                    ? "Nenhuma pergunta sem resposta encontrada" 
                    : selectedAnnouncement 
                      ? "Nenhuma pergunta encontrada para este anúncio" 
                      : "Nenhuma pergunta encontrada"}
                </p>
                <Button onClick={loadAsks}>Atualizar</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAsks.map((block, index) => {
                  const qaPairsAll = getQAPairs(block.qa);
                  const qaPairs = filterNoAnswers 
                    ? qaPairsAll.filter(pair => !pair.answer || pair.answer.trim() === "")
                    : qaPairsAll;
                  const isExpanded = expandedBlocks[block.itemId] || false;
                  const pairsToDisplay = qaPairs.length > 3 && !isExpanded ? qaPairs.slice(0, 3) : qaPairs;
                  
                  return (
                    <Card key={index} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex items-center">
                          <ProductThumbnail itemId={block.itemId} />
                          <div className="ml-3 flex-1">
                            <h3 className="font-medium text-sm">{block.itemTitle}</h3>
                            <p className="text-xs text-gray-500">{block.itemId}</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {pairsToDisplay.map((pair, idx) => {
                          const hasAnswer = pair.answer && pair.answer.trim() !== "";
                          
                          return (
                            <div
                              key={idx}
                              onClick={() => setSelectedQAPair(pair)}
                              className={`p-3 rounded-md cursor-pointer ${hasAnswer ? 'bg-gray-100' : 'bg-amber-50 border-l-4 border-amber-500'}`}
                            >
                              <div className="mb-1">
                                <span className="font-medium">Pergunta: </span>
                                <span>{truncateText(pair.question, 100)}</span>
                              </div>
                              <div>
                                <span className="font-medium">Resposta: </span>
                                <span>{hasAnswer ? truncateText(pair.answer, 100) : "Sem resposta"}</span>
                              </div>
                            </div>
                          );
                        })}
                        
                        {qaPairs.length > 3 && (
                          <Button
                            variant="ghost"
                            className="w-full text-gray-500"
                            onClick={() => setExpandedBlocks({ 
                              ...expandedBlocks, 
                              [block.itemId]: !isExpanded 
                            })}
                          >
                            {isExpanded ? (
                              <ChevronUp className="mr-2 h-4 w-4" />
                            ) : (
                              <ChevronDown className="mr-2 h-4 w-4" />
                            )}
                            {isExpanded ? "Ver menos" : `Ver mais ${qaPairs.length - 3} perguntas`}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
      
      <Dialog open={filterModalVisible} onOpenChange={setFilterModalVisible}>
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
              <Label htmlFor="filter-no-answers">Sem respostas</Label>
            </div>
            
            <div className="space-y-2">
              <Label>Filtro por anúncio</Label>
              <div className="max-h-60 overflow-y-auto space-y-2 border rounded-md p-2">
                {uniqueAnnouncements.map((item, idx) => (
                  <div 
                    key={idx}
                    className={`flex items-center p-2 hover:bg-gray-100 rounded-md cursor-pointer ${selectedAnnouncement === item.id ? 'bg-blue-50' : ''}`}
                    onClick={() => setSelectedAnnouncement(item.id === selectedAnnouncement ? null : item.id)}
                  >
                    <div className="flex items-center w-full">
                      <ProductThumbnail itemId={item.id} />
                      <div className="ml-3 flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{truncateText(item.title, 35)}</p>
                        <p className="text-xs text-gray-500">{item.id}</p>
                      </div>
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
                setSelectedAnnouncement(null);
              }}
            >
              Limpar filtros
            </Button>
            <Button onClick={() => setFilterModalVisible(false)}>
              Aplicar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={!!selectedQAPair} onOpenChange={() => setSelectedQAPair(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes da Pergunta</DialogTitle>
          </DialogHeader>
          
          {selectedQAPair && (
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <h3 className="font-bold text-lg">Pergunta Completa</h3>
                <p className="whitespace-pre-wrap p-3 bg-gray-100 rounded-md">{selectedQAPair.question}</p>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-bold text-lg">Resposta Completa</h3>
                <p className="whitespace-pre-wrap p-3 bg-gray-100 rounded-md">
                  {selectedQAPair.answer || "Sem resposta"}
                </p>
              </div>
              
              {!selectedQAPair.answer && (
                <div className="space-y-2">
                  <h3 className="font-bold text-lg">Responder Pergunta</h3>
                  <Input
                    placeholder="Digite sua resposta..."
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    className="mb-2"
                  />
                  <Button onClick={handleSubmitAnswer} className="w-full">
                    Enviar Resposta
                  </Button>
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
