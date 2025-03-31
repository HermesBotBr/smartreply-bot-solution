
import { useState, useEffect } from 'react';

export function useReportGeneration() {
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    let intervalId: number | undefined;

    if (generatingReport) {
      intervalId = window.setInterval(async () => {
        try {
          const response = await fetch("https://projetohermes-dda7e0c8d836.herokuapp.com/r_geral.txt");
          if (response.ok) {
            // If the file exists and has content
            const text = await response.text();
            if (text && text.trim() !== "") {
              setGeneratingReport(false);
              clearInterval(intervalId);
            }
          }
        } catch (error) {
          console.log("Still generating report...");
        }
      }, 3000); // Check every 3 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [generatingReport]);

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      // Send the request to generate report but don't wait for it to complete
      fetch("https://projetohermes-dda7e0c8d836.herokuapp.com/relatorio");
      
      // Navigate immediately to the report page
      window.location.href = "https://www.hermesbot.com.br/relatorio";
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      setGeneratingReport(false);
    }
  };

  const handleReportButtonClick = () => {
    if (generatingReport) {
      // If already generating, just navigate to the report page
      window.location.href = "https://www.hermesbot.com.br/relatorio";
    } else {
      // Start generating the report
      handleGenerateReport();
    }
  };

  return {
    generatingReport,
    handleReportButtonClick
  };
}
