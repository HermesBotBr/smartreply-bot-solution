
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { FileSpreadsheet } from "lucide-react";

interface DataInputProps {
  settlementData: string;
  onSettlementDataChange: (data: string) => void;
}

export const DataInput: React.FC<DataInputProps> = ({ 
  settlementData,
  onSettlementDataChange
}) => {
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onSettlementDataChange(e.target.value);
  };

  return (
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
          onChange={handleTextareaChange}
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
  );
};
