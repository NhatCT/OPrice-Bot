
import React, { useState, useRef, useEffect } from 'react';
import { PaletteIcon } from './icons/PaletteIcon';
import type { UserProfile, Theme, Font } from '../types';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { TextSizeIcon } from './icons/TextSizeIcon';
import { SpeakerWaveIcon } from './icons/SpeakerWaveIcon';
import { BriefcaseIcon } from './icons/BriefcaseIcon';
import { WorkflowIcon } from './icons/WorkflowIcon';
import { CheckBadgeIcon } from './icons/CheckBadgeIcon';
import { CogIcon } from './icons/CogIcon';
import { BeakerIcon } from './icons/BeakerIcon';
import { ArchiveBoxIcon } from './icons/ArchiveBoxIcon';

interface SettingsPopoverProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  font: Font;
  setFont: (font: Font) => void;
  userProfile: UserProfile | null;
  onUpdateProfile: (profile: UserProfile) => void;
  onForgetUser: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  onOpenWorkflow: () => void;
  onOpenTestingGuide: () => void;
  onOpenBusinessProfile: () => void;
  onNavigateToProducts: () => void;
}

type ActiveTab = 'profile' | 'appearance' | 'tools';

export const SettingsPopover: React.FC<SettingsPopoverProps> = ({ 
    theme, setTheme, font, setFont, userProfile, onUpdateProfile, onForgetUser, 
    soundEnabled, setSoundEnabled,
    onOpenWorkflow, onOpenTestingGuide, onOpenBusinessProfile, onNavigateToProducts
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('profile');
  const popoverRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (userProfile?.name) {
      setNameInput(userProfile.name);
    }
  }, [userProfile]);


  const handleToggle = () => setIsOpen(p => !p);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSaveName = () => {
    if (nameInput.trim()) {
        onUpdateProfile({ name: nameInput.trim() });
    }
  };
  
  const themeOptions: { key: Theme; name: string }[] = [
    { key: 'light', name: 'Sáng' },
    { key: 'dark', name: 'Tối' },
    { key: 'system', name: 'Hệ thống' },
  ];

  const fontOptions: { key: Font; name: string }[] = [
    { key: 'sans', name: 'Mặc định' },
    { key: 'serif', name: 'Serif' },
    { key: 'mono', name: 'Mono' },
  ];
  
  const getButtonClass = (isActive: boolean) => 
    `w-full text-center px-3 py-1.5 text-xl rounded-md transition-colors duration-200 ${
      isActive
        ? 'bg-blue-600 text-white font-semibold'
        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600/70'
    }`;


  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={handleToggle}
        className="text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-200 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
        title="Cài đặt"
      >
        <CogIcon className="w-6 h-6" />
      </button>

      {isOpen && (
        <div
          className="absolute top-full right-0 mt-2 w-96 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl shadow-lg z-10 animate-popover-enter"
        >
            <div className="p-2 border-b border-slate-200 dark:border-slate-600">
                <div className="flex items-center justify-around">
                    <button onClick={() => setActiveTab('profile')} title="Hồ sơ & AI" className={`p-2 rounded-lg transition-colors ${activeTab === 'profile' ? 'bg-slate-200 dark:bg-slate-600/80 text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:bg-slate-600/50'}`}><UserCircleIcon className="w-8 h-8" /></button>
                    <button onClick={() => setActiveTab('appearance')} title="Giao diện" className={`p-2 rounded-lg transition-colors ${activeTab === 'appearance' ? 'bg-slate-200 dark:bg-slate-600/80 text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:bg-slate-600/50'}`}><PaletteIcon className="w-8 h-8" /></button>
                    <button onClick={() => setActiveTab('tools')} title="Công cụ & Hướng dẫn" className={`p-2 rounded-lg transition-colors ${activeTab === 'tools' ? 'bg-slate-200 dark:bg-slate-600/80 text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:bg-slate-600/50'}`}><BriefcaseIcon className="w-8 h-8" /></button>
                </div>
            </div>
            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                {activeTab === 'profile' && (
                    <div className="space-y-4 animate-fade-in-fast">
                      <div>
                        <label className="flex items-center space-x-2 text-lg font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          <UserCircleIcon className="w-4 h-4" />
                          <span>Hồ sơ người dùng</span>
                        </label>
                        <div className='mt-2 p-2 bg-slate-200 dark:bg-slate-800/60 rounded-lg space-y-2'>
                          <div className="flex items-center space-x-2">
                              <input type="text" value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="Tên của bạn" className="flex-grow bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-400 rounded-md px-3 py-1.5 text-xl focus:outline-none focus:ring-2 focus:ring-blue-500 border border-slate-300 dark:border-transparent" />
                              <button onClick={handleSaveName} className="px-3 py-1.5 text-xl bg-blue-600 text-white rounded-md hover:bg-blue-500 font-semibold transition-colors disabled:opacity-70" disabled={!nameInput.trim() || nameInput.trim() === userProfile?.name}>Lưu</button>
                          </div>
                          <button onClick={onForgetUser} className="w-full text-center px-2 py-1 text-lg text-red-500 dark:text-red-400 hover:bg-red-500/10 rounded-md transition-colors">Quên tôi và xóa dữ liệu</button>
                        </div>
                      </div>
                      <div>
                        <label className="flex items-center space-x-2 text-lg font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            <BriefcaseIcon className="w-4 h-4" />
                            <span>Cá nhân hóa AI</span>
                        </label>
                         <div className="mt-2 p-1 bg-slate-200 dark:bg-slate-800/60 rounded-lg">
                            <button onClick={() => { onOpenBusinessProfile(); setIsOpen(false); }} className="w-full flex items-center gap-3 text-left px-3 py-2 text-xl text-slate-700 dark:text-slate-200 hover:bg-slate-300/50 dark:hover:bg-slate-700/60 rounded-md transition-colors duration-200">
                                <BriefcaseIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                                <span>Hồ sơ Kinh doanh</span>
                            </button>
                        </div>
                         <p className="text-base text-slate-500 dark:text-slate-400 mt-1.5 px-1">AI được thiết lập để tự động chuyển đổi giữa các nhà cung cấp (Gemini, GPT, DeepSeek) để đảm bảo độ tin cậy.</p>
                      </div>
                    </div>
                )}
                 {activeTab === 'appearance' && (
                     <div className="space-y-4 animate-fade-in-fast">
                         <div>
                            <label className="flex items-center space-x-2 text-lg font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            <PaletteIcon className="w-4 h-4" />
                            <span>Chủ đề</span>
                            </label>
                            <div className="mt-2 grid grid-cols-3 gap-2 p-1 bg-slate-200 dark:bg-slate-800/60 rounded-lg">
                            {themeOptions.map(t => (
                                <button key={t.key} onClick={() => setTheme(t.key)} className={getButtonClass(theme === t.key)}>{t.name}</button>
                            ))}
                            </div>
                        </div>
                        <div>
                            <label className="flex items-center space-x-2 text-lg font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            <TextSizeIcon className="w-4 h-4" />
                            <span>Phông chữ</span>
                            </label>
                            <div className="mt-2 grid grid-cols-3 gap-2 p-1 bg-slate-200 dark:bg-slate-800/60 rounded-lg">
                            {fontOptions.map(f => (
                                <button key={f.key} onClick={() => setFont(f.key)} className={getButtonClass(font === f.key)}>{f.name}</button>
                            ))}
                            </div>
                        </div>
                        <div>
                            <label className="flex items-center space-x-2 text-lg font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            <SpeakerWaveIcon className="w-4 h-4" />
                            <span>Âm thanh</span>
                            </label>
                            <div className="mt-2 p-1 bg-slate-200 dark:bg-slate-800/60 rounded-lg">
                            <button onClick={() => setSoundEnabled(!soundEnabled)} className="w-full flex items-center justify-between px-3 py-1.5 text-xl rounded-md transition-colors duration-200 text-slate-700 dark:text-slate-200 hover:bg-slate-300/50 dark:hover:bg-slate-700/60" role="switch" aria-checked={soundEnabled}>
                                <span>Bật thông báo</span>
                                <div className={`relative w-10 h-5 rounded-full transition-colors duration-200 ease-in-out ${soundEnabled ? 'bg-blue-600' : 'bg-slate-400 dark:bg-slate-600'}`}>
                                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ease-in-out ${soundEnabled ? 'transform translate-x-5' : ''}`}></span>
                                </div>
                            </button>
                            </div>
                        </div>
                     </div>
                 )}
                 {activeTab === 'tools' && (
                     <div className="animate-fade-in-fast">
                        <label className="flex items-center space-x-2 text-lg font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        <BriefcaseIcon className="w-4 h-4" />
                        <span>Công cụ & Hướng dẫn</span>
                        </label>
                        <div className="mt-2 space-y-1 p-1 bg-slate-200 dark:bg-slate-800/60 rounded-lg">
                            <button onClick={() => {onOpenWorkflow(); setIsOpen(false);}} className="w-full flex items-center gap-3 text-left px-3 py-2 text-xl text-slate-700 dark:text-slate-200 hover:bg-slate-300/50 dark:hover:bg-slate-700/60 rounded-md transition-colors duration-200">
                                <WorkflowIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                                <span>Quy trình làm việc</span>
                            </button>
                            <button onClick={() => { onOpenTestingGuide(); setIsOpen(false);}} className="w-full flex items-center gap-3 text-left px-3 py-2 text-xl text-slate-700 dark:text-slate-200 hover:bg-slate-300/50 dark:hover:bg-slate-700/60 rounded-md transition-colors duration-200">
                                <CheckBadgeIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                                <span>Hướng dẫn kiểm thử</span>
                            </button>
                            <button onClick={() => { onNavigateToProducts(); setIsOpen(false);}} className="w-full flex items-center gap-3 text-left px-3 py-2 text-xl text-slate-700 dark:text-slate-200 hover:bg-slate-300/50 dark:hover:bg-slate-700/60 rounded-md transition-colors duration-200">
                                <ArchiveBoxIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                                <span>Quản lý Sản phẩm</span>
                            </button>
                        </div>
                    </div>
                 )}
            </div>
        </div>
      )}
    </div>
  );
};
