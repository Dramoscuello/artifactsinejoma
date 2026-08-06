import React from 'react';

export default function Header({ title, subtitle, activeTab, onTabChange, tabs = [] }) {
  return (
    <header className="bg-white px-8 pt-8 pb-4 border-b border-gray-200 shadow-sm">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            {title} <span className="text-brand-blue">⚡</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">{subtitle || 'Plataforma Interactiva de Artefactos Educativos'}</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      {tabs.length > 0 && (
        <nav className="flex space-x-6 text-sm font-medium text-gray-500">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange && onTabChange(tab.id)}
              className={`pb-3 transition-colors relative ${
                activeTab === tab.id
                  ? 'text-brand-blue font-semibold border-b-2 border-brand-blue top-[1px]'
                  : 'hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
}
