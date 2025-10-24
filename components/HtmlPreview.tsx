
'use client';
import { useState } from 'react';

interface HtmlPreviewProps {
  htmlContent: string;
  className?: string;
}

export default function HtmlPreview({ htmlContent, className = '' }: HtmlPreviewProps) {
  const [iframeKey, setIframeKey] = useState(0);

  const refreshPreview = () => {
    setIframeKey(prev => prev + 1);
  };

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium">Превью HTML</label>
        <button
          onClick={refreshPreview}
          className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
        >
          Обновить
        </button>
      </div>
      <div className="flex-1 border border-gray-300 rounded-lg overflow-hidden">
        <iframe
          key={iframeKey}
          srcDoc={htmlContent}
          title="HTML Preview"
          className="w-full h-full"
          sandbox="allow-scripts"
        />
      </div>
    </div>
  );
}