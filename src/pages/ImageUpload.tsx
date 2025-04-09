
import React, { useState } from 'react';
import { uploadFile } from '@/utils/fileUpload';
import { Button } from '@/components/ui/button';
import { Upload, Image as ImageIcon, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ImageUpload = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  // Clean up preview URL when component unmounts
  React.useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione apenas arquivos de imagem');
        return;
      }
      
      setSelectedImage(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      // Reset uploaded image URL when selecting a new image
      setUploadedImageUrl(null);
      setDebugInfo(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedImage) {
      toast.error('Selecione uma imagem para enviar');
      return;
    }

    setUploading(true);
    setDebugInfo('Iniciando upload...');
    
    try {
      // Log environment info for debugging
      const host = window.location.hostname;
      const protocol = window.location.protocol;
      const port = window.location.port;
      const origin = window.location.origin;
      
      setDebugInfo(prev => `${prev}\nEnvironment Info:
- Hostname: ${host}
- Protocol: ${protocol}
- Port: ${port || 'default'}
- Origin: ${origin}`);

      const uploadEndpoint = host === 'www.hermesbot.com.br' || host.includes('hermes') 
        ? '/api/uploads/upload' 
        : '/uploads/upload';
      
      setDebugInfo(prev => `${prev}\nUsing upload endpoint: ${uploadEndpoint}`);
      
      const fileUrl = await uploadFile(selectedImage);
      setUploadedImageUrl(fileUrl);
      setDebugInfo(prev => `${prev}\nUpload bem-sucedido: ${fileUrl}`);
      toast.success('Imagem enviada com sucesso!');
    } catch (error) {
      console.error('Erro no upload:', error);
      setDebugInfo(prev => `${prev}\nErro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      toast.error(`Falha ao enviar imagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Upload de Imagens</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-6">
            {/* Image Preview Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 w-full flex flex-col items-center justify-center min-h-[300px]">
              {previewUrl ? (
                <div className="w-full flex flex-col items-center">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="max-w-full max-h-64 object-contain mb-4" 
                  />
                  <p className="text-sm text-gray-600 mb-2">
                    {selectedImage?.name} ({(selectedImage?.size ? selectedImage.size / 1024 : 0).toFixed(2)} KB)
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-500">
                  <ImageIcon size={64} className="mb-4" />
                  <p>Nenhuma imagem selecionada</p>
                </div>
              )}
            </div>

            {/* Upload Controls */}
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <label className="flex-1">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => document.getElementById('image-input')?.click()}
                >
                  <Upload size={18} className="mr-2" />
                  Selecionar Imagem
                </Button>
                <input 
                  id="image-input"
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageSelect} 
                />
              </label>
              
              <Button 
                onClick={handleUpload} 
                disabled={!selectedImage || uploading} 
                className="flex-1"
              >
                {uploading ? 'Enviando...' : 'Enviar Imagem'}
              </Button>
            </div>

            {/* Debug Information - Expanded with more details */}
            {debugInfo && (
              <div className="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg mt-4">
                <p className="font-medium text-gray-800 mb-2">Informações de Debug:</p>
                <pre className="bg-white p-3 rounded text-xs overflow-auto max-h-60 whitespace-pre-wrap">{debugInfo}</pre>
              </div>
            )}

            {/* Upload Success Message */}
            {uploadedImageUrl && (
              <div className="w-full p-4 bg-green-50 border border-green-200 rounded-lg mt-4">
                <div className="flex items-center mb-2">
                  <Check className="text-green-500 mr-2" size={20} />
                  <p className="font-medium text-green-800">Upload concluído com sucesso!</p>
                </div>
                <p className="text-sm text-gray-600 mb-2">URL da imagem:</p>
                <div className="bg-white p-2 rounded border text-xs break-all">
                  {uploadedImageUrl}
                </div>
                <div className="mt-4">
                  <a 
                    href={uploadedImageUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm flex items-center"
                  >
                    Visualizar imagem <ImageIcon size={16} className="ml-1" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImageUpload;
