import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Users, ShoppingBag, AlertTriangle } from "lucide-react";

interface MetricsSummaryCardsProps {
  complaintsAvoided: number;
  totalMessages: number;
  totalQuestions: number;
  unpreventedComplaints: number;
  onPreventedClick: () => void;
  onUnpreventedClick: () => void;
}

const MetricCard = ({
  label,
  value,
  icon: Icon,
  onClick,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  onClick?: () => void;
}) => (
  <Card
    onClick={onClick}
    className={`min-w-[180px] p-4 flex flex-col justify-between cursor-pointer hover:shadow-md transition-all ${
      onClick ? 'hover:bg-gray-100 dark:hover:bg-gray-800' : ''
    }`}
  >
    <div className="text-xs text-muted-foreground mb-2">{label}</div>
    <div className="flex items-center justify-between">
      <div className="text-2xl font-bold">{value}</div>
      <Icon className="w-5 h-5 text-muted-foreground" />
    </div>
  </Card>
);

const MetricsSummaryCards: React.FC<MetricsSummaryCardsProps> = ({
  complaintsAvoided,
  totalMessages,
  totalQuestions,
  unpreventedComplaints,
  onPreventedClick,
  onUnpreventedClick,
}) => {
  return (
    <div className="flex flex-row overflow-x-auto space-x-4 scrollbar-hide pb-2">
      <MetricCard
        label="Reclamações Evitadas"
        value={complaintsAvoided}
        icon={ShoppingBag}
        onClick={onPreventedClick}
      />
      <MetricCard
        label="Total de Mensagens"
        value={totalMessages}
        icon={MessageSquare}
      />
      <MetricCard
        label="Perguntas Recebidas"
        value={totalQuestions}
        icon={Users}
      />
      <MetricCard
        label="Reclamações não impedidas"
        value={unpreventedComplaints}
        icon={AlertTriangle}
        onClick={onUnpreventedClick}
      />
    </div>
  );
};

export default MetricsSummaryCards;
