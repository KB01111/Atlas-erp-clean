"use client";

import React, { useState, useEffect } from 'react';
import { MagicCard } from "@/components/magicui/magic-card";
import { ShineBorder } from "@/components/ui/shine-border";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { Tooltip } from "@/components/ui/tooltip";
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorMessage } from '@/components/ui/error-message';
import {
  Search,
  X,
  Filter,
  Grid,
  List,
  Tag,
  Download,
  Info,
  ExternalLink,
  FileText
} from 'lucide-react';
import { WorkflowTemplate } from './PipedreamIntegrationManager';

interface PipedreamTemplateLibraryProps {
  templates: WorkflowTemplate[];
  onImport: (template: WorkflowTemplate) => void;
  readOnly?: boolean;
}

export default function PipedreamTemplateLibrary({
  templates,
  onImport,
  readOnly = false
}: PipedreamTemplateLibraryProps) {
  // State
  const [filteredTemplates, setFilteredTemplates] = useState<WorkflowTemplate[]>(templates);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  
  // Get unique categories
  const categories = React.useMemo(() => {
    const uniqueCategories = new Set<string>();
    templates.forEach(template => uniqueCategories.add(template.category));
    return Array.from(uniqueCategories).sort();
  }, [templates]);
  
  // Filter templates
  useEffect(() => {
    let filtered = [...templates];
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(template => 
        template.name.toLowerCase().includes(term) || 
        template.description.toLowerCase().includes(term)
      );
    }
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }
    
    setFilteredTemplates(filtered);
  }, [templates, searchTerm, selectedCategory]);
  
  // Render template grid item
  const renderTemplateGridItem = (template: WorkflowTemplate) => {
    return (
      <div
        key={template.id}
        className="bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
      >
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-medium truncate">{template.name}</h3>
            <div className="text-xs font-medium px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full">
              {template.category}
            </div>
          </div>
          
          {template.description && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">
              {template.description}
            </p>
          )}
          
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            <div>Steps: {template.workflow.steps.length}</div>
          </div>
          
          <div className="flex gap-2">
            <ShimmerButton
              onClick={() => setSelectedTemplate(template)}
              className="flex-1 px-3 py-1 text-xs bg-indigo-600 text-white rounded-md flex items-center justify-center gap-1"
            >
              <Info size={12} />
              <span>Details</span>
            </ShimmerButton>
            
            {!readOnly && (
              <ShimmerButton
                onClick={() => onImport(template)}
                className="flex-1 px-3 py-1 text-xs bg-blue-600 text-white rounded-md flex items-center justify-center gap-1"
              >
                <Download size={12} />
                <span>Use Template</span>
              </ShimmerButton>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  // Render template list item
  const renderTemplateListItem = (template: WorkflowTemplate) => {
    return (
      <div
        key={template.id}
        className="bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow p-3 flex items-center"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-medium truncate">{template.name}</h3>
            <div className="text-xs font-medium px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full">
              {template.category}
            </div>
          </div>
          
          {template.description && (
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
              {template.description}
            </p>
          )}
        </div>
        
        <div className="text-xs text-slate-500 dark:text-slate-400 mx-4">
          <div>Steps: {template.workflow.steps.length}</div>
        </div>
        
        <div className="flex gap-2">
          <ShimmerButton
            onClick={() => setSelectedTemplate(template)}
            className="px-3 py-1 text-xs bg-indigo-600 text-white rounded-md flex items-center justify-center gap-1"
          >
            <Info size={12} />
            <span>Details</span>
          </ShimmerButton>
          
          {!readOnly && (
            <ShimmerButton
              onClick={() => onImport(template)}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md flex items-center justify-center gap-1"
            >
              <Download size={12} />
              <span>Use Template</span>
            </ShimmerButton>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Header with search and filters */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <AnimatedGradientText className="text-xl font-bold">
            Workflow Templates
          </AnimatedGradientText>
          
          <div className="flex gap-2">
            <Tooltip content="Toggle Advanced Filters">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-md ${showFilters ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-slate-700 border border-slate-200'}`}
              >
                <Filter size={16} />
              </button>
            </Tooltip>
            
            <div className="flex border border-slate-200 rounded-md overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${
                  viewMode === 'grid'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Grid size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${
                  viewMode === 'list'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>
        
        {/* Search and basic filters */}
        <div className="flex flex-wrap gap-2 items-center mb-2">
          <div className="relative flex-1 min-w-[200px]">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Search size={16} />
            </div>
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          
          <div className="text-sm text-slate-500 whitespace-nowrap">
            {filteredTemplates.length} of {templates.length} templates
          </div>
        </div>
        
        {/* Advanced filters panel */}
        {showFilters && (
          <div className="p-3 bg-slate-50 rounded-md mb-2 animate-in fade-in duration-200">
            <div className="text-sm font-medium mb-2">Popular Tags</div>
            <div className="flex flex-wrap gap-2">
              {['Data Collection', 'Notifications', 'AI Processing', 'Analytics', 'Integration'].map(tag => (
                <button
                  key={tag}
                  onClick={() => setSearchTerm(tag)}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-white border border-slate-200 rounded-full hover:bg-indigo-50 hover:border-indigo-200"
                >
                  <Tag size={12} />
                  <span>{tag}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Templates list */}
      <div className="flex-1 overflow-hidden">
        <MagicCard className="h-full overflow-hidden">
          <ShineBorder borderRadius="0.75rem" className="p-0.5 h-full">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden h-full">
              {filteredTemplates.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 p-4">
                  <FileText size={48} className="mb-4 opacity-30" />
                  <p className="text-lg font-medium">No templates found</p>
                  <p className="text-sm">
                    Try adjusting your search or filters
                  </p>
                </div>
              ) : (
                <div className="p-4 overflow-auto h-full">
                  <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
                    {filteredTemplates.map(template => 
                      viewMode === 'grid'
                        ? renderTemplateGridItem(template)
                        : renderTemplateListItem(template)
                    )}
                  </div>
                </div>
              )}
            </div>
          </ShineBorder>
        </MagicCard>
      </div>
      
      {/* Template details modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold">{selectedTemplate.name}</h2>
                  <div className="text-sm text-slate-500">{selectedTemplate.category}</div>
                </div>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="p-1 text-slate-500 hover:text-slate-700"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-4 overflow-auto max-h-[calc(80vh-130px)]">
              <p className="text-sm mb-4">{selectedTemplate.description}</p>
              
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">Workflow Steps</h3>
                <div className="space-y-2">
                  {selectedTemplate.workflow.steps.map(step => (
                    <div key={step.id} className="p-3 bg-slate-50 rounded-md border border-slate-200">
                      <div className="font-medium">{step.name}</div>
                      <div className="text-sm text-slate-500">{step.type}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t bg-slate-50 flex justify-end gap-2">
              <button
                onClick={() => setSelectedTemplate(null)}
                className="px-4 py-2 text-sm text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
              >
                Close
              </button>
              
              {!readOnly && (
                <ShimmerButton
                  onClick={() => {
                    onImport(selectedTemplate);
                    setSelectedTemplate(null);
                  }}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md flex items-center gap-2"
                >
                  <Download size={16} />
                  <span>Use This Template</span>
                </ShimmerButton>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
