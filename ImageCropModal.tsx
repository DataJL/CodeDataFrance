import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  RotateCcw, 
  Check, 
  Move, 
  Crop as CropIcon,
  Maximize2,
  Circle,
  Square
} from 'lucide-react';

interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onCropComplete: (croppedDataUrl: string) => void;
  aspectRatio?: number; // 1 for square/circle
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
  aspectRatio = 1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  
  // Transform states
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0); // degrees (0, 90, 180, 270)
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [maskShape, setMaskShape] = useState<'circle' | 'square'>('circle');

  // Dragging states
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const initialOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Viewport dimensions
  const VIEWPORT_SIZE = 320;
  const CROP_RADIUS = 130; // 260px diameter circle

  // Charger l'image quand imageSrc change
  useEffect(() => {
    if (!imageSrc) {
      setImage(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImage(img);
      // Réinitialiser les transformations au centre
      setZoom(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
    };
    img.onerror = () => {
      console.error('Erreur chargement image à recadrer');
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Fonction de dessin sur le canvas principal
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // 1. Nettoyer le canvas
    ctx.clearRect(0, 0, width, height);

    // Fond sombre pour le canevas de travail
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    // 2. Dessiner l'image transformée
    ctx.save();
    
    // Translation vers le centre + offset utilisateur
    ctx.translate(centerX + offset.x, centerY + offset.y);
    
    // Rotation
    ctx.rotate((rotation * Math.PI) / 180);
    
    // Calcul de l'échelle de base pour que l'image couvre au moins le masque
    const isRotatedQuarter = rotation % 180 !== 0;
    const effectiveImgWidth = isRotatedQuarter ? image.naturalHeight : image.naturalWidth;
    const effectiveImgHeight = isRotatedQuarter ? image.naturalWidth : image.naturalHeight;
    
    const cropDiameter = CROP_RADIUS * 2;
    const baseScale = Math.max(cropDiameter / effectiveImgWidth, cropDiameter / effectiveImgHeight);
    const finalScale = baseScale * zoom;

    ctx.scale(finalScale, finalScale);

    // Dessin centré
    ctx.drawImage(
      image,
      -image.naturalWidth / 2,
      -image.naturalHeight / 2,
      image.naturalWidth,
      image.naturalHeight
    );

    ctx.restore();

    // 3. Dessiner le masque d'assombrissement avec découpe (Viewfinder)
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)'; // slate-900 à 78% d'opacité
    ctx.beginPath();
    // Rectangle englobant entier
    ctx.rect(0, 0, width, height);

    if (maskShape === 'circle') {
      // Trou circulaire dans le sens anti-horaire (evenodd cutout)
      ctx.arc(centerX, centerY, CROP_RADIUS, 0, Math.PI * 2, true);
    } else {
      // Trou carré arrondi
      const size = CROP_RADIUS * 2;
      const x = centerX - CROP_RADIUS;
      const y = centerY - CROP_RADIUS;
      const r = 24; // arrondi
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + size - r, y);
      ctx.quadraticCurveTo(x + size, y, x + size, y + r);
      ctx.lineTo(x + size, y + size - r);
      ctx.quadraticCurveTo(x + size, y + size, x + size - r, y + size);
      ctx.lineTo(x + r, y + size);
      ctx.quadraticCurveTo(x, y + size, x, y + size - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }
    ctx.fill('evenodd');

    // 4. Contour de cadrage lumineux
    ctx.beginPath();
    if (maskShape === 'circle') {
      ctx.arc(centerX, centerY, CROP_RADIUS, 0, Math.PI * 2);
    } else {
      const size = CROP_RADIUS * 2;
      const x = centerX - CROP_RADIUS;
      const y = centerY - CROP_RADIUS;
      const r = 24;
      ctx.roundRect ? ctx.roundRect(x, y, size, size, r) : ctx.rect(x, y, size, size);
    }
    ctx.strokeStyle = '#38bdf8'; // sky-400
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 5. Grille de composition légère (Règle des tiers)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    const third = (CROP_RADIUS * 2) / 3;
    const startX = centerX - CROP_RADIUS;
    const startY = centerY - CROP_RADIUS;

    // Lignes verticales
    ctx.beginPath();
    ctx.moveTo(startX + third, startY);
    ctx.lineTo(startX + third, startY + CROP_RADIUS * 2);
    ctx.moveTo(startX + third * 2, startY);
    ctx.lineTo(startX + third * 2, startY + CROP_RADIUS * 2);

    // Lignes horizontales
    ctx.moveTo(startX, startY + third);
    ctx.lineTo(startX + CROP_RADIUS * 2, startY + third);
    ctx.moveTo(startX, startY + third * 2);
    ctx.lineTo(startX + CROP_RADIUS * 2, startY + third * 2);
    ctx.stroke();

    ctx.restore();
  }, [image, zoom, rotation, offset, maskShape]);

  // Re-rendre le canvas dès qu'un paramètre change
  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Gestion du drag à la souris
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    initialOffsetRef.current = { ...offset };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setOffset({
      x: initialOffsetRef.current.x + dx,
      y: initialOffsetRef.current.y + dy,
    });
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Gestion du drag sur tactile (Smartphones & Tablettes)
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      initialOffsetRef.current = { ...offset };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStartRef.current.x;
    const dy = e.touches[0].clientY - dragStartRef.current.y;
    setOffset({
      x: initialOffsetRef.current.x + dx,
      y: initialOffsetRef.current.y + dy,
    });
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  // Zoom avec la molette
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom(prev => Math.min(3.5, Math.max(0.7, +(prev + delta).toFixed(2))));
  };

  // Rotation horaire par pas de 90°
  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  // Réinitialiser le positionnement
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  };

  // Exporter l'image finale recadrée
  const handleConfirmCrop = () => {
    if (!image) return;

    // Canvas d'export haute résolution (400x400)
    const exportSize = 400;
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = exportSize;
    exportCanvas.height = exportSize;
    const outCtx = exportCanvas.getContext('2d');
    if (!outCtx) return;

    const cropDiameter = CROP_RADIUS * 2;
    const exportScale = exportSize / cropDiameter;

    // Remplir le fond
    outCtx.fillStyle = '#ffffff';
    outCtx.fillRect(0, 0, exportSize, exportSize);

    outCtx.save();
    // Translation vers le centre du canvas d'export + compensation de l'offset utilisateur ajusté à l'échelle
    outCtx.translate(
      exportSize / 2 + offset.x * exportScale,
      exportSize / 2 + offset.y * exportScale
    );

    // Rotation
    outCtx.rotate((rotation * Math.PI) / 180);

    // Échelle
    const isRotatedQuarter = rotation % 180 !== 0;
    const effectiveImgWidth = isRotatedQuarter ? image.naturalHeight : image.naturalWidth;
    const effectiveImgHeight = isRotatedQuarter ? image.naturalWidth : image.naturalHeight;
    const baseScale = Math.max(cropDiameter / effectiveImgWidth, cropDiameter / effectiveImgHeight);
    const finalScale = baseScale * zoom * exportScale;

    outCtx.scale(finalScale, finalScale);

    // Lissage de l'image
    outCtx.imageSmoothingEnabled = true;
    outCtx.imageSmoothingQuality = 'high';

    outCtx.drawImage(
      image,
      -image.naturalWidth / 2,
      -image.naturalHeight / 2,
      image.naturalWidth,
      image.naturalHeight
    );

    outCtx.restore();

    // Générer l'URL au format JPEG optimisé
    const croppedDataUrl = exportCanvas.toDataURL('image/jpeg', 0.92);
    onCropComplete(croppedDataUrl);
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div 
      className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-6 text-slate-100 flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="w-full flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 text-sky-400 border border-blue-500/30">
              <CropIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Recadrer la photo de profil
              </h3>
              <p className="text-[11px] text-slate-400">
                Glissez pour déplacer · Zoomez et orientez
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Annuler"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewfinder Canvas */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-inner bg-slate-950 cursor-grab active:cursor-grabbing select-none touch-none">
          <canvas
            ref={canvasRef}
            width={VIEWPORT_SIZE}
            height={VIEWPORT_SIZE}
            className="block"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
          />

          {/* Badge informatif en filigrane */}
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-sm border border-slate-800 text-[10px] text-slate-300 font-medium pointer-events-none flex items-center gap-1.5">
            <Move className="w-3 h-3 text-sky-400" />
            <span>Faites glisser pour centrer le visage</span>
          </div>
        </div>

        {/* Barre de contrôle du zoom */}
        <div className="w-full mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Maximize2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Zoom</span>
            </span>
            <span className="font-mono text-sky-400">{Math.round(zoom * 100)}%</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setZoom(prev => Math.max(0.7, +(prev - 0.15).toFixed(2)))}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Dézoomer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <input
              type="range"
              min="0.7"
              max="3.0"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />

            <button
              type="button"
              onClick={() => setZoom(prev => Math.min(3.0, +(prev + 0.15).toFixed(2)))}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Zoomer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Outils d'ajustement rapide (Rotation, Forme, Réinitialisation) */}
        <div className="w-full grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800/80">
          <button
            type="button"
            onClick={handleRotate}
            className="py-2 px-2 rounded-xl bg-slate-800/90 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            title="Tourner de 90° vers la droite"
          >
            <RotateCw className="w-3.5 h-3.5 text-sky-400" />
            <span>Pivoter 90°</span>
          </button>

          <button
            type="button"
            onClick={() => setMaskShape(prev => prev === 'circle' ? 'square' : 'circle')}
            className="py-2 px-2 rounded-xl bg-slate-800/90 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            title="Alterner vue ronde ou carrée"
          >
            {maskShape === 'circle' ? (
              <>
                <Square className="w-3.5 h-3.5 text-amber-400" />
                <span>Format Carré</span>
              </>
            ) : (
              <>
                <Circle className="w-3.5 h-3.5 text-sky-400" />
                <span>Format Rond</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="py-2 px-2 rounded-xl bg-slate-800/90 hover:bg-slate-750 text-slate-400 hover:text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            title="Réinitialiser zoom et position"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Recentrer</span>
          </button>
        </div>

        {/* Boutons d'action */}
        <div className="w-full flex items-center gap-2.5 mt-4 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer text-center"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={handleConfirmCrop}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Valider le recadrage</span>
          </button>
        </div>
      </div>
    </div>
  );
};
