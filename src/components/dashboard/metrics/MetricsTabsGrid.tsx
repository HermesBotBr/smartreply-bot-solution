import React, { useState } from 'react';
export function MetricsGrid() {
  const [selectedTab, setSelectedTab] = useState('reputation');

  const handleTabChange = (tab: string) => {
    setSelectedTab(tab);
    const el = document.getElementById(`tab-${tab}`);
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  };

  return (
    <Tabs defaultValue="reputation" value={selectedTab} onValueChange={handleTabChange} className="space-y-4">
      
      {/* WRAPPER de tudo: abas + gráfico */}
      <div className="overflow-x-auto scrollbar-hide p-4 bg-white rounded-xl shadow-md h-[480px] flex flex-col justify-between">
        
        {/* LISTA DE ABAS */}
        <TabsList className="flex gap-2 snap-x snap-mandatory w-max">
          {metrics.map(({ key, label, icon: Icon, value }) => (
            <TabsTrigger
              key={key}
              value={key}
              id={`tab-${key}`}
              className="min-w-[200px] snap-start flex-col items-start py-4 px-5 bg-primary text-white rounded-2xl hover:opacity-90 data-[state=active]:bg-primary/80"
            >
              <div className="flex justify-between items-center w-full">
                <span className="text-sm font-medium">{label}</span>
                <Icon className="w-4 h-4 text-white/70" />
              </div>
              <div className="mt-1 text-xl font-bold">{value}</div>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* GRÁFICO */}
        <div className="mt-4 w-full flex-1">
          {metrics.map(({ key, description }) => (
            <TabsContent key={key} value={key} className="h-full">
              <p className="mb-2 text-sm text-muted-foreground">{description}</p>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockChartData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="valor" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          ))}
        </div>
      </div>
    </Tabs>
  );
}
