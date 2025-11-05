import React from 'react';
import type { ChatMessage } from '../types';
import { XIcon } from './icons/XIcon';
import { ExternalLinkIcon } from './icons/ExternalLinkIcon';
import { PlusIcon } from './icons/PlusIcon';
import { MinusIcon } from './icons/MinusIcon';
import { Bars2Icon } from './icons/Bars2Icon';

interface SourceComparisonDialogProps {
  isOpen: boolean;
  onClose: () => void;
  message1: ChatMessage;
  message2: ChatMessage;
}

interface ComparedSource {
  uri: string;
  title: string;
  inMessage1: boolean;
  inMessage2: boolean;
}

const SourceRow: React.FC<{ source: ComparedSource }> = ({ source }) => (
    <td>
        <a href={source.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 group p-3 text-blue-600 dark:text-blue-400">
            <ExternalLinkIcon className="w-4 h-4 flex-shrink-0" />
            <span className="truncate group-hover:underline" title={source.title}>{source.title}</span>
        </a>
    </td>
);

const GroupHeader: React.FC<{ icon: React.ReactNode; title: string; count: number }> = ({ icon, title, count }) => (
    <tr>
        <td className="p-3 bg-slate-100 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 first-of-type:border-t-0">
            <div className="flex items-center gap-2">
                {icon}
                <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-200">{title} ({count})</h4>
            </div>
        </td>
    </tr>
);

export const SourceComparisonDialog: React.FC<SourceComparisonDialogProps> = ({ isOpen, onClose, message1, message2 }) => {
  if (!isOpen) return null;

  const sources1 = message1.sources || [];
  const sources2 = message2.sources || [];
  
  const uris1 = new Map<string, string>(sources1.map(s => [s.uri, s.title]));
  const uris2 = new Map<string, string>(sources2.map(s => [s.uri, s.title]));
  
  const allUris: string[] = [...new Set([...uris1.keys(), ...uris2.keys()])];

  const comparedSources: ComparedSource[] = allUris.map(uri => ({
    uri,
    title: uris1.get(uri) || uris2.get(uri) || uri,
    inMessage1: uris1.has(uri),
    inMessage2: uris2.has(uri),
  }));
  
  const added = comparedSources.filter(s => !s.inMessage1 && s.inMessage2);
  const removed = comparedSources.filter(s => s.inMessage1 && !s.inMessage2);
  const common = comparedSources.filter(s => s.inMessage1 && s.inMessage2);
  
  const summaryText = `So với phản hồi đầu tiên, phản hồi thứ hai có <span class="text-green-600 dark:text-green-400 font-bold">${added.length} nguồn mới</span> và <span class="text-red-600 dark:text-red-400 font-bold">${removed.length} nguồn đã bị loại bỏ</span>.`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex justify-center items-center" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-3xl m-4 transform transition-all animate-dialog-in" onClick={e => e.stopPropagation()}>
        <header className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">So sánh Nguồn Tham khảo</h2>
          <button onClick={onClose} className="p-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" aria-label="Đóng">
            <XIcon className="w-6 h-6" />
          </button>
        </header>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {(added.length > 0 || removed.length > 0) && (
             <div className="bg-slate-100 dark:bg-slate-900/40 p-4 rounded-lg mb-4 text-center">
                <p className="text-slate-700 dark:text-slate-200" dangerouslySetInnerHTML={{ __html: summaryText }} />
             </div>
          )}

          <div className="overflow-hidden border border-slate-200 dark:border-slate-700 rounded-lg">
            <table className="w-full table-auto border-collapse">
              <tbody>
                {added.length > 0 && (
                  <>
                    <GroupHeader
                        icon={<span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400"><PlusIcon className="w-4 h-4" /></span>}
                        title="Nguồn mới"
                        count={added.length}
                    />
                    {added.map(source => (
                      <tr key={source.uri} className="border-t border-slate-200 dark:border-slate-700 bg-green-50/50 dark:bg-green-900/20">
                        <SourceRow source={source} />
                      </tr>
                    ))}
                  </>
                )}
                {removed.length > 0 && (
                  <>
                    <GroupHeader
                        icon={<span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400"><MinusIcon className="w-4 h-4" /></span>}
                        title="Nguồn đã loại bỏ"
                        count={removed.length}
                    />
                    {removed.map(source => (
                      <tr key={source.uri} className="border-t border-slate-200 dark:border-slate-700 bg-red-50/50 dark:bg-red-900/20">
                         <SourceRow source={source} />
                      </tr>
                    ))}
                  </>
                )}
                {common.length > 0 && (
                    <>
                     <GroupHeader
                        icon={<span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"><Bars2Icon className="w-4 h-4" /></span>}
                        title="Nguồn chung"
                        count={common.length}
                    />
                    {common.map(source => (
                      <tr key={source.uri} className="border-t border-slate-200 dark:border-slate-700">
                         <SourceRow source={source} />
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>
          
          {added.length === 0 && removed.length === 0 && common.length > 0 && (
            <div className="bg-slate-100 dark:bg-slate-900/40 p-4 rounded-lg mt-4 text-center">
                <p className="text-slate-700 dark:text-slate-200">Cả hai phản hồi đều sử dụng cùng một bộ nguồn tham khảo.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

const style = document.createElement('style');
if (!document.head.querySelector('[data-animation="dialog-in"]')) {
    style.setAttribute('data-animation', 'dialog-in');
    style.innerHTML = `
        @keyframes dialogIn {
            from { opacity: 0; transform: scale(0.95) translateY(10px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-dialog-in {
            animation: dialogIn 0.2s ease-out forwards;
        }
    `;
    document.head.appendChild(style);
}