import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { ConversationMeta, ConversationGroup } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { CheckIcon } from './icons/CheckIcon';
import { XIcon } from './icons/XIcon';
import { FolderIcon } from './icons/FolderIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { SearchIcon } from './icons/SearchIcon';
import { ArchiveBoxIcon } from './icons/ArchiveBoxIcon';
import { V64Logo } from './icons/V64Logo';

interface SidebarProps {
  conversations: ConversationMeta[];
  conversationGroups: Record<string, ConversationGroup>;
  activeConversationId: string | null;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onCreateGroup: (name: string) => void;
  onRenameGroup: (id: string, newName: string) => void;
  onDeleteGroup: (id: string) => void;
  onAssignConversationToGroup: (conversationId: string, groupId: string | null) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  activeView: 'chat' | 'products';
  onViewChange: (view: 'chat' | 'products') => void;
}

const ConversationItem: React.FC<{
    convo: ConversationMeta;
    isActive: boolean;
    isEditing: boolean;
    renameInput: string;
    inputRef: React.RefObject<HTMLInputElement>;
    onSelect: () => void;
    onRename: (e: React.FormEvent) => void;
    setRenameInput: (val: string) => void;
    handleKeyDown: (e: React.KeyboardEvent) => void;
    onStartRename: () => void;
    onDelete: () => void;
    setEditingConvoId: (id: string | null) => void;
    onDragStart: (e: React.DragEvent, id: string) => void;
}> = ({
    convo, isActive, isEditing, renameInput, inputRef, onSelect,
    onRename, setRenameInput, handleKeyDown, onStartRename, onDelete,
    setEditingConvoId, onDragStart
}) => {
    return (
        <div 
            className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors duration-200 ${isActive ? 'bg-blue-100 dark:bg-blue-900/40' : 'hover:bg-slate-200 dark:hover:bg-slate-800'}`}
            onClick={onSelect}
            draggable
            onDragStart={(e) => onDragStart(e, convo.id)}
        >
            {isEditing ? (
                <form onSubmit={onRename} className="flex-1">
                    <input
                        ref={inputRef}
                        type="text"
                        value={renameInput}
                        onChange={(e) => setRenameInput(e.target.value)}
                        onBlur={onRename}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-white dark:bg-slate-700 text-sm px-2 py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </form>
            ) : (
                <div className="flex items-center gap-2 min-w-0">
                    <ChatBubbleIcon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`} />
                    <span className="text-sm truncate">{convo.title}</span>
                </div>
            )}
            {!isEditing && (
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); onStartRename(); }} className="p-1 rounded-md hover:bg-slate-300 dark:hover:bg-slate-700"><PencilIcon className="w-4 h-4" /></button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1 rounded-md hover:bg-slate-300 dark:hover:bg-slate-700"><TrashIcon className="w-4 h-4" /></button>
                </div>
            )}
        </div>
    );
};

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  conversationGroups,
  activeConversationId,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
  onCreateGroup,
  onRenameGroup,
  onDeleteGroup,
  onAssignConversationToGroup,
  isOpen,
  setIsOpen,
  activeView,
  onViewChange
}) => {
  const [editingConvoId, setEditingConvoId] = useState<string | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingConvoId && inputRef.current) {
      inputRef.current.select();
    }
  }, [editingConvoId]);

  useEffect(() => {
    if (editingGroupId && inputRef.current) {
      inputRef.current.select();
    }
  }, [editingGroupId]);
  
  useEffect(() => {
    if (isCreatingGroup && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreatingGroup]);

  const handleStartRenameConvo = (id: string, title: string) => {
    setEditingConvoId(id);
    setRenameInput(title);
  };

  const handleRenameConvo = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingConvoId && renameInput.trim()) {
      onRenameConversation(editingConvoId, renameInput.trim());
    }
    setEditingConvoId(null);
  };
  
  const handleStartRenameGroup = (id: string, name: string) => {
    setEditingGroupId(id);
    setRenameInput(name);
  };

  const handleRenameGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGroupId && renameInput.trim()) {
      onRenameGroup(editingGroupId, renameInput.trim());
    }
    setEditingGroupId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setEditingConvoId(null);
      setEditingGroupId(null);
      setIsCreatingGroup(false);
    }
  };

  const handleCreateGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGroupName.trim()) {
      onCreateGroup(newGroupName.trim());
    }
    setNewGroupName('');
    setIsCreatingGroup(false);
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({...prev, [groupId]: !prev[groupId]}));
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItemId(id);
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverTarget(targetId);
  };
  
  const handleDragLeave = () => {
    setDragOverTarget(null);
  };
  
  const handleDrop = (e: React.DragEvent, groupId: string | null) => {
    e.preventDefault();
    if (draggedItemId) {
      onAssignConversationToGroup(draggedItemId, groupId);
    }
    setDraggedItemId(null);
    setDragOverTarget(null);
  };

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const lowerQuery = searchQuery.toLowerCase();
    return conversations.filter(c => c.title.toLowerCase().includes(lowerQuery));
  }, [conversations, searchQuery]);

  const { groups: groupedConversations, ungrouped } = useMemo(() => {
    const groups: Record<string, ConversationMeta[]> = {};
    const ungroupedConversations: ConversationMeta[] = [];

    filteredConversations.forEach(convo => {
      if (convo.groupId && conversationGroups[convo.groupId]) {
        if (!groups[convo.groupId]) {
          groups[convo.groupId] = [];
        }
        groups[convo.groupId].push(convo);
      } else {
        ungroupedConversations.push(convo);
      }
    });

    return { groups, ungrouped: ungroupedConversations };
  }, [filteredConversations, conversationGroups]);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100">
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
            <V64Logo className="w-8 h-8"/>
            <h1 className="font-bold text-lg">V64 Assistant</h1>
        </div>
        <button
          onClick={onNewChat}
          className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          title="Trò chuyện mới"
        >
          <PlusIcon className="w-5 h-5" />
        </button>
      </div>
      
      <div className="p-3">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Tìm kiếm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-200 dark:bg-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="p-3">
        <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-lg">
            <button onClick={() => onViewChange('chat')} className={`w-1/2 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeView === 'chat' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'hover:bg-slate-300/50 dark:hover:bg-slate-700/50'}`}>Trò chuyện</button>
            <button onClick={() => onViewChange('products')} className={`w-1/2 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeView === 'products' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'hover:bg-slate-300/50 dark:hover:bg-slate-700/50'}`}>Sản phẩm</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 space-y-1 pb-3" onDrop={(e) => handleDrop(e, null)} onDragOver={(e) => handleDragOver(e, 'ungrouped')} onDragLeave={handleDragLeave}>
        {/* Render Groups */}
        {Object.values(conversationGroups).map((group: ConversationGroup) => {
          const convosInGroup = groupedConversations[group.id] || [];
          if (searchQuery.trim() && convosInGroup.length === 0 && !group.name.toLowerCase().includes(searchQuery.toLowerCase())) return null;
          const isExpanded = expandedGroups[group.id] ?? true;

          return (
            <div key={group.id} onDrop={(e) => { e.stopPropagation(); handleDrop(e, group.id); }} onDragOver={(e) => { e.stopPropagation(); handleDragOver(e, group.id); }} onDragLeave={handleDragLeave} className={`rounded-lg transition-colors ${dragOverTarget === group.id ? 'bg-blue-100 dark:bg-blue-900/40' : ''}`}>
              <div className="group flex items-center justify-between p-2 rounded-lg cursor-pointer" onClick={() => toggleGroup(group.id)}>
                <div className="flex items-center gap-2 min-w-0">
                  <FolderIcon className="w-4 h-4 text-slate-500 dark:text-slate-400"/>
                  {editingGroupId === group.id ? (
                      <form onSubmit={handleRenameGroupSubmit} className="flex-1">
                          <input ref={inputRef} type="text" value={renameInput} onChange={(e) => setRenameInput(e.target.value)} onBlur={handleRenameGroupSubmit} onKeyDown={handleKeyDown} className="w-full bg-white dark:bg-slate-700 text-sm px-2 py-1 rounded-md focus:outline-none"/>
                      </form>
                  ) : (
                      <span className="text-sm font-semibold truncate">{group.name}</span>
                  )}
                </div>
                <div className="flex items-center opacity-0 group-hover:opacity-100">
                  <button onClick={(e) => { e.stopPropagation(); handleStartRenameGroup(group.id, group.name); }} className="p-1 rounded-md hover:bg-slate-300 dark:hover:bg-slate-700"><PencilIcon className="w-4 h-4" /></button>
                  <button onClick={(e) => { e.stopPropagation(); onDeleteGroup(group.id); }} className="p-1 rounded-md hover:bg-slate-300 dark:hover:bg-slate-700"><TrashIcon className="w-4 h-4" /></button>
                  <ChevronDownIcon className={`w-5 h-5 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                </div>
              </div>
              {isExpanded && (
                <div className="pl-4 space-y-1">
                  {convosInGroup.map(convo => (
                    <ConversationItem 
                      key={convo.id}
                      convo={convo}
                      isActive={convo.id === activeConversationId}
                      isEditing={editingConvoId === convo.id}
                      renameInput={renameInput}
                      inputRef={inputRef}
                      onSelect={() => onSelectConversation(convo.id)}
                      onRename={handleRenameConvo}
                      setRenameInput={setRenameInput}
                      handleKeyDown={handleKeyDown}
                      onStartRename={() => handleStartRenameConvo(convo.id, convo.title)}
                      onDelete={() => onDeleteConversation(convo.id)}
                      setEditingConvoId={setEditingConvoId}
                      onDragStart={handleDragStart}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {/* Render Ungrouped Conversations */}
        <div className={`p-1 rounded-lg ${dragOverTarget === 'ungrouped' ? 'bg-blue-100 dark:bg-blue-900/40' : ''}`}>
            {ungrouped.map(convo => (
            <ConversationItem 
                key={convo.id}
                convo={convo}
                isActive={convo.id === activeConversationId}
                isEditing={editingConvoId === convo.id}
                renameInput={renameInput}
                inputRef={inputRef}
                onSelect={() => onSelectConversation(convo.id)}
                onRename={handleRenameConvo}
                setRenameInput={setRenameInput}
                handleKeyDown={handleKeyDown}
                onStartRename={() => handleStartRenameConvo(convo.id, convo.title)}
                onDelete={() => onDeleteConversation(convo.id)}
                setEditingConvoId={setEditingConvoId}
                onDragStart={handleDragStart}
            />
            ))}
        </div>
      </div>
      
      <div className="p-3 border-t border-slate-200 dark:border-slate-800">
        {isCreatingGroup ? (
            <form onSubmit={handleCreateGroupSubmit} className="flex items-center gap-2">
                <input ref={inputRef} type="text" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="Tên nhóm mới..." className="flex-1 bg-white dark:bg-slate-700 text-sm px-2 py-1.5 rounded-md focus:outline-none"/>
                <button type="submit" className="p-1.5 rounded-md hover:bg-slate-300 dark:hover:bg-slate-700"><CheckIcon className="w-5 h-5 text-green-500" /></button>
                <button type="button" onClick={() => setIsCreatingGroup(false)} className="p-1.5 rounded-md hover:bg-slate-300 dark:hover:bg-slate-700"><XIcon className="w-5 h-5 text-red-500" /></button>
            </form>
        ) : (
            <button onClick={() => setIsCreatingGroup(true)} className="w-full flex items-center gap-2 p-2 rounded-lg text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-800">
                <ArchiveBoxIcon className="w-4 h-4" />
                <span>Tạo nhóm mới</span>
            </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className={`fixed inset-y-0 left-0 w-72 z-40 transform transition-transform md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:shrink-0`}>
        {sidebarContent}
      </div>
      {isOpen && <div onClick={() => setIsOpen(false)} className="fixed inset-0 bg-black/30 z-30 md:hidden" />}
    </>
  );
};