
export function parseMessages(text: string) {
  const entries = text.split("\n-------------------------------------------------\n");
  const convs = [];
  
  entries.forEach(entry => {
    if (entry.trim()) {
      const lines = entry.split('\n').filter(line => line.trim() !== '');
      let buyer = '';
      let orderId = '';
      let itemId = '';
      const messages = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith("Nome completo:")) {
          buyer = line.replace("Nome completo:", "").trim();
        } else if (line.startsWith("Item_id:")) {
          itemId = line.replace("Item_id:", "").trim();
        } else if (line.startsWith("Order_ID:")) {
          orderId = line.replace("Order_ID:", "").trim();
        } else if (line.startsWith("Mensagens:")) {
          continue;
        } else if (line.startsWith("Attachment:")) {
          if (messages.length > 0) {
            const attachmentLine = line.replace("Attachment:", "").trim();
            const parts = attachmentLine.split(",");
            const attachment = {
              filename: parts[0] ? parts[0].trim() : "",
              original_filename: parts[1] ? parts[1].trim() : "",
              type: parts[2] ? parts[2].trim() : "",
              size: parts[3] ? parts[3].trim() : ""
            };
            messages[messages.length - 1].message_attachments.push(attachment);
          }
        } else {
          const colonIndex = line.indexOf(":");
          if (colonIndex !== -1) {
            const sender = line.substring(0, colonIndex).trim();
            let rest = line.substring(colonIndex + 1).trim();
            let messageId = '';
            const idMatch = rest.match(/^\((\w+)\)/);
            if (idMatch) {
              messageId = idMatch[1];
              rest = rest.replace(/^\(\w+\)/, '').trim();
            }
            const match = rest.match(/\((\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)\)$/);
            let date = '';
            let message = rest;
            if (match) {
              date = match[1];
              message = rest.substring(0, rest.lastIndexOf(`(${date})`)).trim();
            }

            if (!message) {
              message = "[Imagem]";
            }

            messages.push({ sender, message, date, id: messageId, message_attachments: [] });
          }
        }
      }
      
      if (buyer) {
        convs.push({ buyer, orderId, itemId, messages });
      }
    }
  });
  
  return convs;
}
