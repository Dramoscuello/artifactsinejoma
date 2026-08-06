import React from 'react';

export default function ArtifactSandbox({ code, title, hideHeader = false }) {
  const defaultHtml = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: sans-serif; text-align: center; color: #94a3b8; padding: 2rem; margin: 0; }
  </style>
</head>
<body>
  <p>Sin código de artefacto</p>
</body>
</html>`;

  return (
    <div className="w-full h-full bg-white flex flex-col overflow-hidden">
      {!hideHeader && (
        <div className="bg-gray-100/90 px-4 py-2 border-b border-gray-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
            <span className="text-xs font-semibold text-gray-600 ml-2 truncate">
              {title || 'Artefacto Interactivo'}
            </span>
          </div>
          <span className="text-[10px] bg-blue-50 text-brand-blue px-2 py-0.5 rounded font-mono font-medium">
            100% Pantalla Completa
          </span>
        </div>
      )}
      <iframe
        srcDoc={code || defaultHtml}
        title={title || 'Artefacto Interactivo'}
        sandbox="allow-scripts allow-modals allow-forms"
        className="w-full flex-1 h-full border-none bg-white block"
      />
    </div>
  );
}
