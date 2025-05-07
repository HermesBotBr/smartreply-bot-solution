
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { FileSpreadsheet } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DataInputProps {
  settlementData: string;
  releaseData: string;
  onSettlementDataChange: (data: string) => void;
  onReleaseDataChange: (data: string) => void;
}

export const DataInput: React.FC<DataInputProps> = ({ 
  settlementData,
  releaseData,
  onSettlementDataChange,
  onReleaseDataChange
}) => {
  const handleSettlementChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onSettlementDataChange(e.target.value);
  };

  const handleReleaseChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onReleaseDataChange(e.target.value);
  };

  return (
    <Tabs defaultValue="settlement" className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="settlement">Dados de Liquidação</TabsTrigger>
        <TabsTrigger value="release">Dados de Liberações</TabsTrigger>
      </TabsList>
      
      <TabsContent value="settlement">
        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              <CardTitle>Entrada de Dados de Liquidação (Settlement)</CardTitle>
            </div>
            <CardDescription>
              Cole os dados do relatório de settlement no formato CSV abaixo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea 
              value={settlementData}
              onChange={handleSettlementChange}
              placeholder="settlement:
EXTERNAL_REFERENCE,SOURCE_ID,USER_ID,PAYMENT_METHOD_TYPE,PAYMENT_METHOD,SITE,TRANSACTION_TYPE,TRANSACTION_AMOUNT,TRANSACTION_CURRENCY,TRANSACTION_DATE,FEE_AMOUNT,SETTLEMENT_NET_AMOUNT,SETTLEMENT_CURRENCY,SETTLEMENT_DATE,REAL_AMOUNT,COUPON_AMOUNT,METADATA,ORDER_ID,SHIPPING_ID,SHIPMENT_MODE,PACK_ID
..."
              className="min-h-[400px] font-mono text-sm"
            />
          </CardContent>
          <CardFooter className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Apenas transações com TRANSACTION_TYPE = SETTLEMENT serão consideradas vendas
            </div>
          </CardFooter>
        </Card>
      </TabsContent>
      
      <TabsContent value="release">
        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              <CardTitle>Entrada de Dados de Liberações (Release)</CardTitle>
            </div>
            <CardDescription>
              Cole os dados do relatório de release no formato CSV abaixo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea 
              value={releaseData}
              onChange={handleReleaseChange}
              placeholder="release:
DATE,SOURCE_ID,EXTERNAL_REFERENCE,RECORD_TYPE,DESCRIPTION,NET_CREDIT_AMOUNT,NET_DEBIT_AMOUNT,ITEM_ID,SALE_DETAIL
..."
              className="min-h-[400px] font-mono text-sm"
            />
          </CardContent>
          <CardFooter className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Os dados serão processados para calcular valores liberados, reclamações, dívidas, transferências e pagamentos de cartão
            </div>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  );
};
