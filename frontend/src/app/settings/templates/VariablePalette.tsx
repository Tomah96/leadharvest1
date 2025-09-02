'use client';

import { useState } from 'react';
import { Search, Info } from 'lucide-react';
import { TemplateVariable } from './templateTypes';

interface VariablePaletteProps {
  onInsert: (variable: string) => void;
}

const TEMPLATE_VARIABLES: TemplateVariable[] = [
  // Lead Information
  { field: 'first_name', description: "Lead's first name", category: 'lead_info', example: 'John' },
  { field: 'last_name', description: "Lead's last name", category: 'lead_info', example: 'Smith' },
  { field: 'full_name', description: "Lead's full name", category: 'lead_info', example: 'John Smith' },
  { field: 'email', description: "Lead's email address", category: 'lead_info', example: 'john@example.com' },
  { field: 'phone', description: "Lead's phone number", category: 'lead_info', example: '(555) 123-4567' },
  
  // Property Information
  { field: 'property_address', description: 'Property address', category: 'property', example: '123 Main St' },
  { field: 'move_in_date', description: 'Desired move-in date', category: 'property', example: 'September 1, 2025' },
  { field: 'inquiry_date', description: 'Date of inquiry', category: 'property', example: 'August 27, 2025' },
  { field: 'income', description: 'Annual income', category: 'property', example: '$75,000' },
  { field: 'credit_score', description: 'Credit score or range', category: 'property', example: '720-780' },
  { field: 'occupants', description: 'Number of occupants', category: 'property', example: '2' },
  { field: 'pets', description: 'Pet information', category: 'property', example: '1 cat' },
  { field: 'lease_length', description: 'Desired lease length', category: 'property', example: '12 months' },
  
  // Smart Sections
  { field: 'acknowledgment_text', description: 'Auto-generated acknowledgment of provided info', category: 'acknowledgment' },
  { field: 'tour_availability_ack', description: 'Acknowledgment of tour dates provided', category: 'acknowledgment' },
  { field: 'tour_question', description: 'Smart question about tour availability', category: 'questions' },
  { field: 'missing_info', description: 'List of missing required information', category: 'questions' },
  { field: 'qualification_criteria', description: 'Property qualification requirements', category: 'questions' },
  
  // Agent Information
  { field: 'agent_name', description: "Agent's full name", category: 'agent', example: 'Toma Holovatsky' },
  { field: 'agent_company', description: 'Company name', category: 'agent', example: 'RE/MAX Plus' },
  { field: 'agent_phone', description: 'Agent phone number', category: 'agent', example: '(215) 280-1874' },
  { field: 'agent_email', description: 'Agent email', category: 'agent', example: 'toma@remax.com' },
  { field: 'agent_signature', description: 'Full signature block', category: 'agent' }
];

export default function VariablePalette({ onInsert }: VariablePaletteProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [hoveredVariable, setHoveredVariable] = useState<string | null>(null);

  const categories = [
    { value: 'all', label: 'All Variables' },
    { value: 'lead_info', label: 'Lead Info' },
    { value: 'property', label: 'Property' },
    { value: 'acknowledgment', label: 'Acknowledgment' },
    { value: 'questions', label: 'Questions' },
    { value: 'agent', label: 'Agent Info' }
  ];

  const filteredVariables = TEMPLATE_VARIABLES.filter(variable => {
    const matchesSearch = variable.field.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         variable.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || variable.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getVariableInfo = (field: string) => {
    return TEMPLATE_VARIABLES.find(v => v.field === field);
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Template Variables</h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search variables..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-48 h-8 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-8 text-sm border border-gray-300 dark:border-gray-600 rounded px-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
        {filteredVariables.map((variable) => (
          <div key={variable.field} className="relative">
            <button
              onClick={() => onInsert(variable.field)}
              onMouseEnter={() => setHoveredVariable(variable.field)}
              onMouseLeave={() => setHoveredVariable(null)}
              className="w-full flex items-center justify-between p-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600 transition-colors group"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', variable.field);
              }}
            >
              <span className="font-mono text-xs text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                {`{${variable.field}}`}
              </span>
              <Info className="w-3 h-3 text-gray-400 dark:text-gray-500" />
            </button>
            
            {/* Tooltip */}
            {hoveredVariable === variable.field && (
              <div className="absolute z-10 bottom-full left-0 mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg">
                <p className="font-semibold mb-1">{variable.field}</p>
                <p className="mb-1">{variable.description}</p>
                {variable.example && (
                  <p className="text-gray-300">Example: {variable.example}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
        Click to insert at cursor position, or drag into the editor
      </p>
    </div>
  );
}