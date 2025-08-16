"use client";
import { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Upload } from 'lucide-react';

interface ProfileAvatarProps {
  src?: string;
  fallback: string;
  onFileSelect: (file: File | null) => void;
}

export default function ProfileAvatar({ src, fallback, onFileSelect }: ProfileAvatarProps) {
  const [preview, setPreview] = useState<string | null>(src || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    onFileSelect(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="relative w-24 h-24 cursor-pointer" onClick={handleClick}>
      <Avatar className="w-full h-full text-xl">
        <AvatarImage src={preview || src} />
        <AvatarFallback>{fallback}</AvatarFallback>
      </Avatar>
      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-40 flex items-center justify-center rounded-full transition-opacity">
        <Upload className="h-8 w-8 text-white opacity-0 hover:opacity-100" />
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg"
      />
    </div>
  );
}
