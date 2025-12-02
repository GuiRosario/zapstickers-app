import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Share2,
  Download,
  Image as ImageIcon,
  RotateCcw,
  Move,
  Smartphone,
} from 'lucide-react';

const StickerApp = () => {
  const [step, setStep] = useState('upload'); // upload, edit, result
  const [image, setImage] = useState(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [shape, setShape] = useState('circle'); // circle, square
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  const [finalUrl, setFinalUrl] = useState(null);

  // Configuração do Canvas
  const CANVAS_SIZE = 512; // Tamanho padrão de sticker (512x512)

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setImage(img);
          setStep('edit');
          setScale(1);
          setPosition({ x: 0, y: 0 });
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  // Função Principal de Desenho
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const ctx = canvas.getContext('2d');

    // Limpar
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Salvar estado para aplicar a máscara
    ctx.save();

    // 1. Criar a Máscara (Formato da Figurinha)
    ctx.beginPath();
    const center = CANVAS_SIZE / 2;

    // Agora usamos o tamanho TOTAL, sem descontar borda
    const radius = CANVAS_SIZE / 2;

    if (shape === 'circle') {
      ctx.arc(center, center, radius, 0, Math.PI * 2);
    } else {
      // Quadrado com cantos levemente arredondados (padrão bonito)
      // Usamos 0 de padding para ocupar tudo
      ctx.roundRect(0, 0, CANVAS_SIZE, CANVAS_SIZE, 40);
    }
    ctx.clip();

    // 2. Desenhar a Imagem do Usuário
    // Centralizar a imagem
    const imgWidth = image.width * scale;
    const imgHeight = image.height * scale;
    const x = center - imgWidth / 2 + position.x;
    const y = center - imgHeight / 2 + position.y;

    // Removido o fundo branco forçado, assim se a imagem for PNG transparente, continua transparente
    ctx.drawImage(image, x, y, imgWidth, imgHeight);

    // Remover a máscara
    ctx.restore();

    // REMOVIDO: Desenho da Borda e Desenho do Texto
  };

  useEffect(() => {
    if (step === 'edit') {
      drawCanvas();
    }
  }, [image, scale, position, shape, step]);

  // Controles de Mouse/Touch para mover a imagem
  const handlePointerDown = (e) => {
    setIsDragging(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX - position.x, y: clientY - position.y });
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    e.preventDefault(); // Evita scroll no mobile
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setPosition({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y,
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const generateSticker = async () => {
    const canvas = canvasRef.current;
    const url = canvas.toDataURL('image/webp', 0.8);
    setFinalUrl(url);
    setStep('result');
  };

  const handleShare = async () => {
    if (!finalUrl) return;

    try {
      const response = await fetch(finalUrl);
      const blob = await response.blob();
      const file = new File([blob], 'figurinha_zap.webp', {
        type: 'image/webp',
      });

      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: 'Minha Figurinha',
          text: 'Olha a figurinha que eu fiz!',
        });
      } else {
        const link = document.createElement('a');
        link.href = finalUrl;
        link.download = 'figurinha_zap.webp';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        alert(
          'Seu navegador não suporta envio direto. A imagem foi baixada! Agora é só arrastar pro WhatsApp Web.'
        );
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      alert('Erro ao compartilhar. Tente baixar a imagem.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans selection:bg-green-500 selection:text-white">
      {/* Header */}
      <header className="bg-green-600 p-4 shadow-lg text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <h1 className="text-2xl font-bold flex items-center justify-center gap-2 relative z-10">
          <ImageIcon className="w-8 h-8" />
          ZapSticker Lite
        </h1>
        <p className="text-green-100 text-sm relative z-10">
          Conversor Rápido de Figurinhas
        </p>
      </header>

      <main className="max-w-md mx-auto p-4">
        {/* STEP 1: UPLOAD */}
        {step === 'upload' && (
          <div className="flex flex-col items-center justify-center h-[60vh] gap-6 animate-fade-in">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold">Escolha uma foto</h2>
              <p className="text-gray-400 text-sm">
                JPG ou PNG vira figurinha na hora.
              </p>
            </div>

            <label className="w-full h-64 border-4 border-dashed border-gray-700 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-green-500 hover:bg-gray-800 transition-all group">
              <div className="bg-green-600/20 p-6 rounded-full mb-4 group-hover:scale-110 transition-transform">
                <Upload className="w-10 h-10 text-green-500" />
              </div>
              <span className="font-bold text-gray-300">Toque para enviar</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* STEP 2: EDIT */}
        {step === 'edit' && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <div className="bg-gray-800 rounded-xl p-4 shadow-xl border border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2">
                  <Move className="w-4 h-4" /> Ajuste o corte
                </h3>
                <button
                  onClick={() => setStep('upload')}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Cancelar
                </button>
              </div>

              {/* Canvas Container */}
              <div
                className="relative w-full aspect-square bg-[url('https://www.transparenttextures.com/patterns/checkerboard.png')] rounded-lg overflow-hidden border-2 border-gray-600 touch-none cursor-move"
                onMouseDown={handlePointerDown}
                onMouseMove={handlePointerMove}
                onMouseUp={handlePointerUp}
                onMouseLeave={handlePointerUp}
                onTouchStart={handlePointerDown}
                onTouchMove={handlePointerMove}
                onTouchEnd={handlePointerUp}
              >
                <canvas
                  ref={canvasRef}
                  width={512}
                  height={512}
                  className="w-full h-full object-contain"
                />
                <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded pointer-events-none">
                  Arraste para mover
                </div>
              </div>

              {/* Controls */}
              <div className="mt-4 space-y-4">
                {/* Zoom */}
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 flex justify-between">
                    <span>Zoom</span>
                    <span>{Math.round(scale * 100)}%</span>
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.1"
                    value={scale}
                    onChange={(e) => setScale(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                  />
                </div>

                {/* Shape Toggle */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setShape('circle')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border ${
                      shape === 'circle'
                        ? 'bg-green-600 border-green-500 text-white'
                        : 'bg-gray-700 border-gray-600 text-gray-300'
                    }`}
                  >
                    Circular
                  </button>
                  <button
                    onClick={() => setShape('square')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border ${
                      shape === 'square'
                        ? 'bg-green-600 border-green-500 text-white'
                        : 'bg-gray-700 border-gray-600 text-gray-300'
                    }`}
                  >
                    Quadrado
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={generateSticker}
              className="w-full py-4 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl shadow-lg shadow-green-900/50 transform transition active:scale-95 flex items-center justify-center gap-2"
            >
              Criar Figurinha <RotateCcw className="w-5 h-5 rotate-90" />
            </button>
          </div>
        )}

        {/* STEP 3: RESULT */}
        {step === 'result' && finalUrl && (
          <div className="flex flex-col items-center gap-6 animate-fade-in">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-1">Prontinho!</h2>
              <p className="text-gray-400 text-sm">Sua figurinha foi gerada.</p>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-green-500 blur-xl opacity-20 rounded-full group-hover:opacity-40 transition-opacity"></div>
              <img
                src={finalUrl}
                alt="Sticker Final"
                className="w-64 h-64 object-contain relative z-10 drop-shadow-2xl"
              />
            </div>

            <div className="w-full space-y-3">
              <button
                onClick={handleShare}
                className="w-full py-4 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transform transition active:scale-95"
              >
                <Smartphone className="w-5 h-5" />
                Mandar pro Zap
              </button>

              <p className="text-xs text-center text-gray-500 px-4">
                No iPhone/Android, clique acima para abrir o WhatsApp. <br />
                No PC, a imagem será baixada.
              </p>

              <button
                onClick={() => setStep('edit')}
                className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-xl border border-gray-700 transition"
              >
                Editar novamente
              </button>

              <button
                onClick={() => {
                  setStep('upload');
                  setImage(null);
                  setFinalUrl(null);
                }}
                className="w-full py-2 text-sm text-gray-500 hover:text-white transition"
              >
                Criar outra
              </button>
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default StickerApp;
