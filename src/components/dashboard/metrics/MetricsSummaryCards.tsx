
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Users, ShoppingBag, AlertTriangle } from "lucide-react";

interface MetricsSummaryCardsProps {
  complaintsAvoided: number;
  totalMessages: number;
  totalQuestions: number;
  unpreventedComplaints: number;
  onPreventedClick: () => void;
  onUnpreventedClick: () => void;
}

const MetricsSummaryCards: React.FC<MetricsSummaryCardsProps> = ({
  complaintsAvoided,
  totalMessages,
  totalQuestions,
  unpreventedComplaints,
  onPreventedClick,
  onUnpreventedClick
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card onClick={onPreventedClick} className="cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex flex-col space-y-1">
            <CardTitle className="text-sm font-medium">Reclamações Evitadas</CardTitle>
            <CardDescription>Período total</CardDescription>
          </div>
          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{complaintsAvoided}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex flex-col space-y-1">
            <CardTitle className="text-sm font-medium">Total de Mensagens</CardTitle>
            <CardDescription>Período total</CardDescription>
          </div>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalMessages}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex flex-col space-y-1">
            <CardTitle className="text-sm font-medium">Perguntas Recebidas</CardTitle>
            <CardDescription>Período total</CardDescription>
          </div>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalQuestions}</div>
        </CardContent>
      </Card>
      
      <Card onClick={onUnpreventedClick} className="cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex flex-col space-y-1">
            <CardTitle className="text-sm font-medium">Reclamações não impedidas</CardTitle>
            <CardDescription>Período total</CardDescription>
          </div>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{unpreventedComplaints}</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MetricsSummaryCards;
