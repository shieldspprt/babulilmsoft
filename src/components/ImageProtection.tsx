import { useToast } from "@/hooks/use-toast";

interface ImageProtectionProps {
  src: string;
  alt: string;
  className?: string;
  watermarkText?: string;
}

const ImageProtection = ({ src, alt, className, watermarkText = "© BAB UL ILM" }: ImageProtectionProps) => {
  const { toast } = useToast();

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    toast({
      title: "Image Protected",
      description: "This image is protected and cannot be copied.",
      variant: "destructive",
    });
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
    toast({
      title: "Image Protected",
      description: "This image is protected and cannot be copied.",
      variant: "destructive",
    });
  };

  return (
    <div className="relative group">
      <img
        src={src}
        alt={alt}
        className={className}
        onContextMenu={handleContextMenu}
        onDragStart={handleDragStart}
        draggable={false}
        style={{
          userSelect: "none",
          WebkitUserSelect: "none",
          MozUserSelect: "none",
          msUserSelect: "none",
          maxWidth: "400px",
          maxHeight: "400px",
          imageRendering: "auto",
        }}
      />
      
      {/* Always-visible watermark overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-white/40 text-2xl font-bold rotate-[-20deg] select-none drop-shadow-lg">
          {watermarkText}
        </span>
      </div>
    </div>
  );
};

export default ImageProtection;
