'use client';

import { useRef } from 'react';
import VariablePalette from './VariablePalette';
import type { MessageTemplate } from './templateTypes';

interface TemplateEditorProps {
  content: string;
  onChange: (content: string) => void;
  templateType: MessageTemplate['type'];
  onTypeChange: (type: MessageTemplate['type']) => void;
}

export default function TemplateEditor(props: TemplateEditorProps) {
  const { content, onChange, templateType, onTypeChange } = props;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertVariable = (variable: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = content.slice(0, start) + `{${variable}}` + content.slice(end);
    
    onChange(newContent);
    
    // Reset cursor position after React re-render
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + variable.length + 2; // +2 for the curly braces
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const templateTypes = [
    { value: 'initial_contact', label: 'Initial Contact' },
    { value: 'follow_up', label: 'Follow-up' },
    { value: 'tour_confirmation', label: 'Tour Confirmation' },
    { value: 'custom', label: 'Custom' }
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Template Type
        </label>
        <select
          value={templateType}
          onChange={(e) => onTypeChange(e.target.value as MessageTemplate['type'])}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
        >
          {templateTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <VariablePalette onInsert={insertVariable} />

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Template Content
        </label>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          className="w-full font-mono text-sm min-h-[400px] p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
          placeholder="Enter your template here... Use {variable_name} for dynamic content"
          onDrop={(e) => {
            e.preventDefault();
            const variable = e.dataTransfer.getData('text/plain');
            if (variable) {
              insertVariable(variable);
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.classList.add('border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20');
          }}
          onDragLeave={(e) => {
            e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20');
          }}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Tip: Click variables above to insert them, or type &#123; to see suggestions
        </p>
      </div>
    </div>
  );
}