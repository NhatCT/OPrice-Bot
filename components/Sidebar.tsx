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
    if ((editingConvoId || editingGroupId || isCreatingGroup) && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingConvoId, editingGroupId, isCreatingGroup]);

  const handleStartRenameConvo = (conversation: ConversationMeta) => {
    setEditingGroupId(null);
    setEditingConvoId(conversation.id);
    setRenameInput(conversation.title);
  };

  const handleStartRenameGroup = (group: ConversationGroup) => {
    setEditingConvoId(null);
    setEditingGroupId(group.id);
    setRenameInput(group.name);
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (renameInput.trim()) {
      if (editingConvoId) {
        onRenameConversation(editingConvoId, renameInput.trim());
      } else if (editingGroupId) {
        onRenameGroup(editingGroupId, renameInput.trim());
      }
    }
    setEditingConvoId(null);
    setEditingGroupId(null);
  };

  const handleCreateGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGroupName.trim()) {
      onCreateGroup(newGroupName.trim());
    }
    setIsCreatingGroup(false);
    setNewGroupName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setEditingConvoId(null);
      setEditingGroupId(null);
      setIsCreatingGroup(false);
      setNewGroupName('');
    }
  };
  
  const toggleGroupExpansion = (groupId: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const sortedConversations = [...conversations].sort((a, b) => Number(b.id) - Number(a.id));

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) {
      return sortedConversations;
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    return sortedConversations.filter(convo =>
      convo.title.toLowerCase().includes(lowercasedQuery)
    );
  }, [sortedConversations, searchQuery]);

  const { grouped, ungrouped } = useMemo(() => {
    const grouped: Record<string, ConversationMeta[]> = {};
    const ungrouped: ConversationMeta[] = [];
    
    filteredConversations.forEach(convo => {
      if (convo.groupId && conversationGroups[convo.groupId]) {
        if (!grouped[convo.groupId]) {
          grouped[convo.groupId] = [];
        }
        grouped[convo.groupId].push(convo);
      } else {
        ungrouped.push(convo);
      }
    });
    return { grouped, ungrouped };
  }, [filteredConversations, conversationGroups]);


  // --- Drag and Drop Handlers ---
  const handleDragStart = (e: React.DragEvent, convoId: string) => {
    e.dataTransfer.setData('conversationId', convoId);
    setDraggedItemId(convoId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  const handleDrop = (e: React.DragEvent, groupId: string | null) => {
    e.preventDefault();
    const convoId = e.dataTransfer.getData('conversationId');
    if (convoId) {
      const currentConvo = conversations.find(c => c.id === convoId);
      const currentGroupId = currentConvo?.groupId || null;
      if (currentGroupId !== groupId) {
        onAssignConversationToGroup(convoId, groupId);
      }
    }
    setDragOverTarget(null);
    setDraggedItemId(null);
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
    setDragOverTarget(null);
  };

  const handleDeleteClick = (convoId: string) => {
    if (conversations.length <= 1) {
      alert("Không thể xóa cuộc trò chuyện cuối cùng.");
      return;
    }
    onDeleteConversation(convoId);
  };

  const renderConversationItem = (convo: ConversationMeta) => {
    const isActive = convo.id === activeConversationId && activeView === 'chat';
    const isEditing = editingConvoId === convo.id;
    const isDragging = draggedItemId === convo.id;
    const iconClass = `w-5 h-5 shrink-0 transition-colors ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'}`;

    return (
      <li 
        key={convo.id} 
        draggable="true"
        onDragStart={(e) => handleDragStart(e, convo.id)}
        onDragEnd={handleDragEnd}
        className={`rounded-md ${isDragging ? 'opacity-50 bg-slate-300 dark:bg-slate-700' : ''}`}
      >
        <div
          className={`group w-full flex items-center justify-between rounded-md transition-colors duration-200 cursor-pointer relative ${
            isActive ? 'bg-slate-200 dark:bg-slate-800' : 'hover:bg-slate-200/70 dark:hover:bg-slate-800/70'
          }`}
        >
          {isActive && <div className="absolute left-0 top-2 bottom-2 w-1 bg-blue-500 rounded-r-full animate-active-bar-in"></div>}
          {isEditing ? (
            <form onSubmit={handleRenameSubmit} className="flex-grow">
              <input
                ref={inputRef} type="text" value={renameInput} onChange={(e) => setRenameInput(e.target.value)}
                onBlur={handleRenameSubmit} onKeyDown={handleKeyDown}
                className="w-full bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-700 dark:text-slate-50 focus:outline-none rounded-md"
              />
            </form>
          ) : (
            <button onClick={() => { onSelectConversation(convo.id); onViewChange('chat'); }} className="flex items-center gap-3 px-3 py-2 flex-grow text-left min-w-0">
              <ChatBubbleIcon className={iconClass} />
              <span className={`text-sm truncate ${isActive ? 'font-semibold text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'}`}>
                {convo.title}
              </span>
            </button>
          )}
          
          <div className={`pr-2 flex items-center shrink-0 transition-opacity ${isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            {isEditing ? (
              <button onClick={handleRenameSubmit} className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700"><CheckIcon className="w-4 h-4" /></button>
            ) : (
              <>
                <button onClick={() => handleStartRenameConvo(convo)} className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700"><PencilIcon className="w-4 h-4" /></button>
                <button onClick={() => handleDeleteClick(convo.id)} className="p-1.5 rounded-md text-red-500/80 hover:bg-red-500/10 hover:text-red-600"><TrashIcon className="w-4 h-4" /></button>
              </>
            )}
          </div>
        </div>
      </li>
    );
  };
  
  const viewButtonClass = (isActive: boolean) =>
    `flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-colors duration-200 ${
        isActive
            ? 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-100'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800/70'
    }`;
  
  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-100 dark:bg-gray-900 border-r border-slate-200 dark:border-slate-800">
      <div className="p-3 grid grid-cols-2 gap-2 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <button 
          onClick={() => setIsCreatingGroup(true)}
          title="Nhóm mới" 
          className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-gray-900 border border-slate-300 dark:border-slate-700 rounded-lg py-1.5 transition-colors duration-200 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <span>Nhóm mới</span>
        </button>
        <button 
          onClick={() => { onNewChat(); onViewChange('chat'); }}
          title="Cuộc trò chuyện mới" 
          className="flex items-center justify-center gap-2 text-sm font-semibold text-white bg-purple-500 rounded-lg py-1.5 transition-all duration-200 hover:bg-purple-600"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Chat Mới</span>
        </button>
      </div>
       <div className="p-2 space-y-2 border-b border-slate-200 dark:border-slate-800">
        <button onClick={() => onViewChange('chat')} className={viewButtonClass(activeView === 'chat')}>
            <ChatBubbleIcon className="w-5 h-5" />
            <span>Trò chuyện</span>
        </button>
        <button onClick={() => onViewChange('products')} className={viewButtonClass(activeView === 'products')}>
            <ArchiveBoxIcon className="w-5 h-5" />
            <span>Sản phẩm</span>
        </button>
       </div>
       <div className="p-2 border-b border-slate-200 dark:border-slate-800">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <SearchIcon className="w-4 h-4 text-slate-400" />
          </div>
          <input
            type="search"
            placeholder="Tìm kiếm cuộc trò chuyện..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-200/80 dark:bg-slate-800 border-none rounded-md py-2 pl-9 pr-3 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-2 space-y-1" onDrop={(e) => handleDrop(e, null)} onDragOver={handleDragOver} onDragEnter={() => setDragOverTarget('ungrouped')} onDragLeave={() => setDragOverTarget(null)}>
        {isCreatingGroup && (
           <form onSubmit={handleCreateGroupSubmit} className="p-1">
             <input
                ref={inputRef} type="text" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)}
                onBlur={() => { if(!newGroupName.trim()) setIsCreatingGroup(false); else handleCreateGroupSubmit; }} onKeyDown={handleKeyDown}
                placeholder="Tên nhóm mới..."
                className="w-full bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-700 dark:text-slate-50 focus:outline-none rounded-md border border-blue-500"
             />
           </form>
        )}
        
        {filteredConversations.length === 0 && searchQuery.trim() && (
            <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
                Không tìm thấy cuộc trò chuyện nào.
            </div>
        )}

        {/* FIX: Explicitly type 'group' as ConversationGroup to fix multiple TypeScript errors. */}
        {Object.values(conversationGroups).map((group: ConversationGroup) => {
            const isSearchActive = searchQuery.trim().length > 0;
            const hasMatchesInGroup = (grouped[group.id]?.length || 0) > 0;
            const isExpanded = (isSearchActive && hasMatchesInGroup) || (!isSearchActive && (expandedGroups[group.id] ?? true));
            const isDropTarget = dragOverTarget === group.id;

            if (!isSearchActive || hasMatchesInGroup) {
              return (
                  <div 
                    key={group.id} 
                    onDrop={(e) => handleDrop(e, group.id)} 
                    onDragOver={handleDragOver} 
                    onDragEnter={() => setDragOverTarget(group.id)} 
                    onDragLeave={() => setDragOverTarget(null)}
                    className={`rounded-lg transition-colors duration-200 ${isDropTarget ? 'bg-blue-500/20' : ''}`}
                  >
                      <div className="group w-full flex items-center justify-between rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/70">
                          <button onClick={() => toggleGroupExpansion(group.id)} className="flex items-center gap-2 px-2 py-1.5 flex-grow text-left">
                              <ChevronDownIcon className={`w-4 h-4 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                              <FolderIcon className="w-5 h-5" />
                              {editingGroupId === group.id ? (
                                  <form onSubmit={handleRenameSubmit} className="flex-grow -my-1.5">
                                      <input
                                          ref={inputRef} type="text" value={renameInput} onChange={(e) => setRenameInput(e.target.value)}
                                          onBlur={handleRenameSubmit} onKeyDown={handleKeyDown}
                                          className="w-full bg-transparent text-sm font-semibold text-slate-700 dark:text-slate-50 focus:outline-none"
                                      />
                                  </form>
                              ) : (
                                  <span className="text-sm font-semibold truncate">{group.name}</span>
                              )}
                              <span className="text-xs font-mono bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded-full">{grouped[group.id]?.length || 0}</span>
                          </button>
                          <div className="pr-1 flex items-center shrink-0 opacity-0 group-hover:opacity-100">
                               {editingGroupId === group.id ? (
                                   <button onClick={handleRenameSubmit} className="p-1.5 rounded-md hover:bg-slate-300 dark:hover:bg-slate-700"><CheckIcon className="w-4 h-4" /></button>
                               ) : (
                                  <>
                                      <button onClick={() => handleStartRenameGroup(group)} className="p-1.5 rounded-md hover:bg-slate-300 dark:hover:bg-slate-700"><PencilIcon className="w-4 h-4" /></button>
                                      <button onClick={() => onDeleteGroup(group.id)} className="p-1.5 rounded-md text-red-500/80 hover:bg-red-500/10 hover:text-red-600"><TrashIcon className="w-4 h-4" /></button>
                                  </>
                               )}
                          </div>
                      </div>
                      {isExpanded && (
                          <ul className="pl-4 pr-1 py-1 space-y-1">
                              {(grouped[group.id] || []).map(renderConversationItem)}
                          </ul>
                      )}
                  </div>
              );
            }
            return null;
        })}
        
        <div className={`p-2 mt-2 rounded-lg transition-colors duration-200 ${dragOverTarget === 'ungrouped' ? 'bg-blue-500/20' : ''}`}>
           <ul className="space-y-1">{ungrouped.map(renderConversationItem)}</ul>
        </div>
      </nav>
    </div>
  );

  return (
    <>
      <aside className="hidden md:block w-72 lg:w-80 h-full flex-shrink-0">
        {sidebarContent}
      </aside>

      <div 
        className={`fixed inset-0 z-40 transition-opacity duration-300 md:hidden ${isOpen ? 'bg-black/50 backdrop-blur-sm' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      ></div>
      <aside
        className={`fixed top-0 left-0 h-full w-72 z-50 bg-slate-100 dark:bg-gray-900 transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? 'transform-none' : '-translate-x-full'
        }`}
      >
        <button onClick={() => setIsOpen(false)} className="absolute top-3 right-3 p-2 text-slate-500 dark:text-slate-400" aria-label="Đóng thanh bên">
          <XIcon className="w-6 h-6" />
        </button>
        {sidebarContent}
      </aside>
       <style>{`
        @keyframes activeBarIn {
          from { transform: scaleY(0); }
          to { transform: scaleY(1); }
        }
        .animate-active-bar-in { animation: activeBarIn 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; transform-origin: center; }
      `}</style>
    </>
  );
};