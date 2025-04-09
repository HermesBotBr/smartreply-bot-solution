
import React, { useState, useEffect } from 'react';
import { uploadFile } from '@/utils/fileUpload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import { toast } from 'sonner';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

interface FileItem {
  fileUrl: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadDate: Date;
}

const Anexos = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState<FileItem[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    // Carregar lista de arquivos do localStorage
    const savedFiles = localStorage.getItem('uploadedFiles');
    if (savedFiles) {
      setFileList(JSON.parse(savedFiles));
    }
  }, []);

  // Limpa a URL de visualização quando o componente é desmontado
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Cria uma URL de visualização quando um arquivo é selecionado
  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [selectedFile]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Selecione um arquivo para enviar');
      return;
    }

    setUploading(true);
    try {
      console.log('Iniciando upload...');
      const fileUrl = await uploadFile(selectedFile);
      console.log('Upload concluído:', fileUrl);
      
      // Adiciona o arquivo à lista
      const newFile: FileItem = {
        fileUrl,
        fileName: selectedFile.name.split('/').pop() || 'arquivo',
        originalName: selectedFile.name,
        mimeType: selectedFile.type,
        size: selectedFile.size,
        uploadDate: new Date()
      };
      
      const updatedList = [...fileList, newFile];
      setFileList(updatedList);
      
      // Salva no localStorage
      localStorage.setItem('uploadedFiles', JSON.stringify(updatedList));
      
      toast.success('Arquivo enviado com sucesso!');
      setSelectedFile(null);
      handleRemoveFile();
    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error(`Falha ao enviar arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setUploading(false);
    }
  };

  const isImage = (mimeType: string) => {
    return mimeType.startsWith('image/');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('pt-BR');
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Gerenciador de Anexos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center">
              {!selectedFile ? (
                <>
                  <Upload className="h-12 w-12 text-gray-400 mb-4" />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md flex items-center gap-2">
                      <Upload size={16} />
                      <span>Selecionar arquivo</span>
                    </div>
                    <input 
                      id="file-upload" 
                      type="file" 
                      className="hidden" 
                      onChange={handleFileSelect} 
                    />
                  </label>
                  <p className="text-sm text-gray-500 mt-2">
                    Suporta imagens, PDFs e documentos até 5MB
                  </p>
                </>
              ) : (
                <div className="w-full">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Arquivo selecionado</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleRemoveFile}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={20} />
                    </Button>
                  </div>
                  
                  {isImage(selectedFile.type) && previewUrl && (
                    <div className="w-full max-h-64 overflow-hidden mb-4">
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="max-w-full max-h-64 object-contain mx-auto" 
                      />
                    </div>
                  )}
                  
                  <div className="flex flex-col text-sm mb-4">
                    <p><span className="font-semibold">Nome:</span> {selectedFile.name}</p>
                    <p><span className="font-semibold">Tipo:</span> {selectedFile.type || 'Desconhecido'}</p>
                    <p><span className="font-semibold">Tamanho:</span> {formatFileSize(selectedFile.size)}</p>
                  </div>
                  
                  <Button 
                    onClick={handleUpload} 
                    disabled={uploading} 
                    className="w-full"
                  >
                    {uploading ? 'Enviando...' : 'Enviar arquivo'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Arquivos enviados</CardTitle>
        </CardHeader>
        <CardContent>
          {fileList.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Nenhum arquivo enviado ainda
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Visualização</TableHead>
                    <TableHead>Nome original</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Tamanho</TableHead>
                    <TableHead>Data de upload</TableHead>
                    <TableHead>Link</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fileList.map((file, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {isImage(file.mimeType) ? (
                          <img 
                            src={file.fileUrl} 
                            alt={file.originalName} 
                            className="h-16 w-16 object-cover rounded"
                          />
                        ) : (
                          <div className="h-16 w-16 flex items-center justify-center bg-gray-100 rounded">
                            <ImageIcon size={24} className="text-gray-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{file.originalName}</TableCell>
                      <TableCell>{file.mimeType}</TableCell>
                      <TableCell>{formatFileSize(file.size)}</TableCell>
                      <TableCell>{formatDate(file.uploadDate)}</TableCell>
                      <TableCell>
                        <a 
                          href={file.fileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          Abrir
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Anexos;
