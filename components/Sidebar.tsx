
import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { ConversationMeta, ConversationGroup } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { FolderIcon } from './icons/FolderIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { SearchIcon } from './icons/SearchIcon';
import { V64Logo } from './icons/V64Logo';
import { TagIcon } from './icons/TagIcon';
import { PinIcon } from './icons/PinIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';

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
  activeView: 'chat' | 'products' | 'report' | 'watchlist';
  onViewChange: (view: 'chat' | 'products' | 'report' | 'watchlist') => void;
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
            className={`group flex items-center justify-between p-2.5 mx-1 rounded-lg cursor-pointer transition-all duration-200 ${
                isActive 
                ? 'bg-white/90 dark:bg-slate-800/90 text-blue-600 dark:text-blue-400 shadow-md ring-1 ring-black/5 transform scale-[1.02]' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
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
                        className="w-full bg-transparent text-sm px-1 focus:outline-none border-b-2 border-blue-500 text-slate-900 dark:text-slate-100"
                        autoFocus
                    />
                </form>
            ) : (
                <div className="flex items-center gap-3 min-w-0 overflow-hidden">
                    <ChatBubbleIcon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-500 dark:text-blue-400' : 'opacity-70'}`} />
                    <span className="text-sm font-medium truncate">{convo.title}</span>
                </div>
            )}
            {!isEditing && isActive && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); onStartRename(); }} className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-500"><PencilIcon className="w-3 h-3" /></button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"><TrashIcon className="w-3 h-3" /></button>
                </div>
            )}
        </div>
    );
};

export const Sidebar: React.FC<SidebarProps> = ({
  conversations, conversationGroups, activeConversationId, onNewChat,
  onSelectConversation, onDeleteConversation, onRenameConversation,
  onCreateGroup, onRenameGroup, onDeleteGroup, onAssignConversationToGroup,
  isOpen, setIsOpen, activeView, onViewChange
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
    if (editingConvoId || editingGroupId || isCreatingGroup) {
        inputRef.current?.focus();
    }
  }, [editingConvoId, editingGroupId, isCreatingGroup]);

  const handleStartRenameConvo = (id: string, title: string) => { setEditingConvoId(id); setRenameInput(title); };
  const handleRenameConvo = (e: React.FormEvent) => { e.preventDefault(); if (editingConvoId && renameInput.trim()) onRenameConversation(editingConvoId, renameInput.trim()); setEditingConvoId(null); };
  const handleStartRenameGroup = (id: string, name: string) => { setEditingGroupId(id); setRenameInput(name); };
  const handleRenameGroupSubmit = (e: React.FormEvent) => { e.preventDefault(); if (editingGroupId && renameInput.trim()) onRenameGroup(editingGroupId, renameInput.trim()); setEditingGroupId(null); };
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Escape') { setEditingConvoId(null); setEditingGroupId(null); setIsCreatingGroup(false); } };
  const handleCreateGroupSubmit = (e: React.FormEvent) => { e.preventDefault(); if (newGroupName.trim()) onCreateGroup(newGroupName.trim()); setNewGroupName(''); setIsCreatingGroup(false); };
  const toggleGroup = (groupId: string) => { setExpandedGroups(prev => ({...prev, [groupId]: !prev[groupId]})); };
  const handleDragStart = (e: React.DragEvent, id: string) => { setDraggedItemId(id); e.dataTransfer.effectAllowed = 'move'; };
  const handleDragOver = (e: React.DragEvent, targetId: string) => { e.preventDefault(); setDragOverTarget(targetId); };
  const handleDragLeave = () => { setDragOverTarget(null); };
  const handleDrop = (e: React.DragEvent, groupId: string | null) => { e.preventDefault(); if (draggedItemId) onAssignConversationToGroup(draggedItemId, groupId); setDraggedItemId(null); setDragOverTarget(null); };

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    return conversations.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [conversations, searchQuery]);

  const { groups: groupedConversations, ungrouped } = useMemo(() => {
    const groups: Record<string, ConversationMeta[]> = {};
    const ungroupedConversations: ConversationMeta[] = [];
    filteredConversations.forEach(convo => {
      if (convo.groupId && conversationGroups[convo.groupId]) {
        if (!groups[convo.groupId]) groups[convo.groupId] = [];
        groups[convo.groupId].push(convo);
      } else {
        ungroupedConversations.push(convo);
      }
    });
    return { groups, ungrouped: ungroupedConversations };
  }, [filteredConversations, conversationGroups]);

  return (
    <div className="flex flex-col h-full glass-panel m-3 rounded-2xl overflow-hidden border-opacity-50 shadow-2xl transition-all duration-300">
      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
                <div className="p-1.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg shadow-purple-500/20">
                    <V64Logo className="w-6 h-6 text-white filter brightness-0 invert"/>
                </div>
                <div>
                    <h1 className="font-bold text-lg text-slate-800 dark:text-white tracking-tight">V64 Assistant</h1>
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">AI Intelligence</span>
                </div>
            </div>
            <button onClick={onNewChat} className="group p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-300">
                <PlusIcon className="w-5 h-5 text-slate-400 dark:text-slate-300 group-hover:text-blue-500 transition-colors" />
            </button>
        </div>

        {/* View Switcher Pills */}
        <div className="grid grid-cols-4 gap-1 p-1.5 bg-slate-100/80 dark:bg-slate-900/50 rounded-2xl border border-white/20 shadow-inner mb-4">
            {[
                { id: 'chat', icon: ChatBubbleIcon, label: 'Chat' },
                { id: 'products', icon: TagIcon, label: 'S.Phẩm' },
                { id: 'watchlist', icon: PinIcon, label: 'Theo dõi' },
                { id: 'report', icon: ChartBarIcon, label: 'Báo cáo' },
            ].map((item) => {
                const Icon = item.icon as React.FC<any>;
                return (
                <button 
                    key={item.id}
                    onClick={() => onViewChange(item.id as any)}
                    className={`relative flex flex-col items-center justify-center py-2.5 rounded-xl transition-all duration-300 ${
                        activeView === item.id 
                        ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-md ring-1 ring-black/5 transform scale-105' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-white/5'
                    }`}
                >
                    <Icon className={`w-4 h-4 mb-1 ${activeView === item.id ? 'stroke-2' : ''}`} />
                    <span className="text-[9px] font-medium">{item.label}</span>
                </button>
            )})}
        </div>

        {/* Search */}
        <div className="relative group">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors z-10" />
          <input type="text" placeholder="Tìm kiếm..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white/80 dark:bg-slate-800/50 rounded-xl pl-10 pr-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all outline-none text-slate-700 dark:text-slate-200" />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 custom-scrollbar space-y-3">
        {Object.values(conversationGroups).map((group) => {
             const convosInGroup = groupedConversations[group.id] || [];
             if (searchQuery.trim() && convosInGroup.length === 0 && !group.name.toLowerCase().includes(searchQuery.toLowerCase())) return null;
             const isExpanded = expandedGroups[group.id] ?? true;
             
             return (
                <div key={group.id} onDrop={(e) => { e.stopPropagation(); handleDrop(e, group.id); }} onDragOver={(e) => { e.stopPropagation(); handleDragOver(e, group.id); }} onDragLeave={handleDragLeave} className={`rounded-2xl transition-all ${dragOverTarget === group.id ? 'bg-blue-50/50 dark:bg-blue-900/20 ring-2 ring-blue-500/30' : ''}`}>
                    <div className="flex items-center justify-between px-2 py-2 cursor-pointer group/header" onClick={() => toggleGroup(group.id)}>
                        <div className="flex items-center gap-2">
                            <ChevronDownIcon className={`w-3 h-3 text-slate-400 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                            {editingGroupId === group.id ? (
                                <form onSubmit={handleRenameGroupSubmit}><input ref={inputRef} value={renameInput} onChange={(e) => setRenameInput(e.target.value)} onBlur={handleRenameGroupSubmit} onKeyDown={handleKeyDown} className="bg-transparent border-b border-blue-500 focus:outline-none text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 w-full"/></form>
                            ) : (
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider group-hover/header:text-blue-600 transition-colors">{group.name}</span>
                            )}
                        </div>
                        <div className="opacity-0 group-hover/header:opacity-100 flex items-center gap-1">
                             <button onClick={(e) => { e.stopPropagation(); handleStartRenameGroup(group.id, group.name); }} className="p-1 hover:text-blue-500"><PencilIcon className="w-3 h-3"/></button>
                             <button onClick={(e) => { e.stopPropagation(); onDeleteGroup(group.id); }} className="p-1 hover:text-red-500"><TrashIcon className="w-3 h-3"/></button>
                        </div>
                    </div>
                    {isExpanded && (
                        <div className="space-y-1 mt-1">
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
             );
        })}

        {ungrouped.length > 0 && (
            <div className="space-y-1">
                <div className="px-2 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Gần đây</div>
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
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-200/50 dark:border-white/5">
        {isCreatingGroup ? (
          <form onSubmit={handleCreateGroupSubmit} className="flex items-center gap-2 animate-fade-in-up">
            <input ref={inputRef} type="text" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} onKeyDown={handleKeyDown} onBlur={() => setIsCreatingGroup(false)} placeholder="Tên nhóm..." className="flex-1 bg-white dark:bg-slate-800 px-3 py-2 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-inner"/>
          </form>
        ) : (
          <button onClick={() => setIsCreatingGroup(true)} className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all group">
            <FolderIcon className="w-4 h-4 group-hover:scale-110 transition-transform"/>
            <span className="text-sm font-medium">Tạo nhóm mới</span>
          </button>
        )}
      </div>
    </div>
  );
};
