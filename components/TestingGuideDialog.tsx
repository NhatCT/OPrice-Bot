import React, { useState, useRef, useCallback } from 'react';
import { XIcon } from './icons/XIcon';
import { CheckBadgeIcon } from './icons/CheckBadgeIcon';
import { runStressTestPrompt, StressTestResult } from '../services/geminiService';
import { BeakerIcon } from './icons/BeakerIcon';
import { toPng } from 'html-to-image';
import { PhotoIcon } from './icons/PhotoIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';


interface TestingGuideDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const TestStep: React.FC<{ title: string, description: string, examples?: string[] }> = ({ title, description, examples }) => (
    <li className="flex items-start space-x-4 py-3">
        <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mt-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clipRule="evenodd" /></svg>
        </div>
        <div>
            <h4 className="font-semibold text-slate-700 dark:text-slate-200">{title}</h4>
            <p className="text-slate-600 dark:text-slate-300 text-sm">{description}</p>
            {examples && (
                <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    <span className="font-medium">Ví dụ:</span>
                    <ul className="list-disc list-inside pl-2">
                        {examples.map((ex, i) => <li key={i}>"{ex}"</li>)}
                    </ul>
                </div>
            )}
        </div>
    </li>
);

const defaultPrompts = [
    "V64 là công ty gì?",
    "Kể tên các dự án tiêu biểu của V64.",
    "Giải pháp quản lý nhân sự của V64 có những tính năng gì?",
    "Làm thế nào để liên hệ với V64?",
    "Hãy phân tích lợi nhuận cho sản phẩm 'Nón V64' với giá vốn 50000, chi phí biến đổi 5000, chi phí cố định 10tr, và giá bán 120000.",
    "So sánh giá thị trường cho 'Áo Thun Thể Thao'.",
].join('\n');

const PerformanceChart: React.FC<{ data: any[] }> = ({ data }) => {
  return (
    <div className="mt-4 h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
          <XAxis dataKey="request" label={{ value: 'Yêu cầu', position: 'insideBottom', offset: -5 }} stroke="rgb(100 116 139)" />
          <YAxis label={{ value: 'Time (ms)', angle: -90, position: 'insideLeft' }} stroke="rgb(100 116 139)" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(4px)',
              border: '1px solid rgb(226 232 240)',
              borderRadius: '0.5rem',
              color: 'black'
            }}
            labelStyle={{ fontWeight: 'bold' }}
          />
          <Legend />
          <Line type="monotone" dataKey="timeToFirstChunk" name="⚡️ TTFC" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2 }} />
          <Line type="monotone" dataKey="totalTime" name="⏱️ Total Time" stroke="#34d399" strokeWidth={2} dot={{ r: 2 }}/>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};


export const TestingGuideDialog: React.FC<TestingGuideDialogProps> = ({ isOpen, onClose }) => {
    const [isSimulating, setIsSimulating] = useState(false);
    const [numRequests, setNumRequests] = useState(50);
    const [prompts, setPrompts] = useState(defaultPrompts);
    const [simulationProgress, setSimulationProgress] = useState({ current: 0, total: 0 });
    const [simulationResults, setSimulationResults] = useState<({ prompt: string; result: StressTestResult; })[] | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const resultsRef = useRef<HTMLDivElement>(null);


    const handleStartSimulation = async () => {
        setIsSimulating(true);
        setSimulationResults(null);
        setSimulationProgress({ current: 0, total: numRequests });
        abortControllerRef.current = new AbortController();

        const promptList = prompts.split('\n').filter(p => p.trim() !== '');
        if (promptList.length === 0) {
            alert("Vui lòng nhập ít nhất một prompt.");
            setIsSimulating(false);
            return;
        }

        const results: ({ prompt: string; result: StressTestResult; })[] = [];
        for (let i = 0; i < numRequests; i++) {
            if (abortControllerRef.current.signal.aborted) {
                console.log("Simulation aborted by user.");
                break;
            }
            setSimulationProgress({ current: i + 1, total: numRequests });
            const randomPrompt = promptList[Math.floor(Math.random() * promptList.length)];
            const result = await runStressTestPrompt(randomPrompt, abortControllerRef.current.signal);
            results.push({ prompt: randomPrompt, result });
        }

        setSimulationResults(results);
        setIsSimulating(false);
    };

    const handleStopSimulation = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        setIsSimulating(false);
    };
    
    const calculateStats = useCallback(() => {
        if (!simulationResults) return null;

        const successfulRuns = simulationResults.filter(r => r.result.success && r.result.performance);
        if (successfulRuns.length === 0) return {
            successRate: 0,
            failedCount: simulationResults.length,
            avgFirstChunk: 0, p95FirstChunk: 0,
            avgTotalTime: 0, p95TotalTime: 0,
            totalRequests: simulationResults.length,
            chartData: [],
        };
        
        const firstChunkTimes = successfulRuns.map(r => r.result.performance!.timeToFirstChunk).sort((a,b) => a - b);
        const totalTimes = successfulRuns.map(r => r.result.performance!.totalTime).sort((a,b) => a-b);
        
        const p95Index = Math.floor(0.95 * successfulRuns.length) -1;

        const chartData = simulationResults.map((r, i) => ({
            request: i + 1,
            timeToFirstChunk: r.result.performance?.timeToFirstChunk ?? null,
            totalTime: r.result.performance?.totalTime ?? null,
        })).filter(d => d.totalTime !== null);

        return {
            successRate: (successfulRuns.length / simulationResults.length) * 100,
            failedCount: simulationResults.length - successfulRuns.length,
            avgFirstChunk: Math.round(firstChunkTimes.reduce((a, b) => a + b, 0) / firstChunkTimes.length) || 0,
            p95FirstChunk: firstChunkTimes[p95Index >= 0 ? p95Index : 0] || 0,
            avgTotalTime: Math.round(totalTimes.reduce((a, b) => a + b, 0) / totalTimes.length) || 0,
            p95TotalTime: totalTimes[p95Index >= 0 ? p95Index : 0] || 0,
            totalRequests: simulationResults.length,
            chartData,
        };
    }, [simulationResults]);
    
    const handleExportPNG = useCallback(() => {
        if (resultsRef.current === null) {
          return;
        }

        toPng(resultsRef.current, { cacheBust: true, backgroundColor: '#ffffff' })
          .then((dataUrl) => {
            const link = document.createElement('a');
            link.download = `stress-test-report-${new Date().toISOString()}.png`;
            link.href = dataUrl;
            link.click();
          })
          .catch((err) => {
            console.error('oops, something went wrong!', err);
            alert('Không thể xuất ảnh. Vui lòng thử lại hoặc kiểm tra console.');
          });
    }, []);
    
    const handleExportCSV = useCallback(() => {
        if (!simulationResults) return;

        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Request,Prompt,Success,Error,TimeToFirstChunk (ms),TotalTime (ms)\r\n";

        simulationResults.forEach((item, index) => {
            const prompt = `"${item.prompt.replace(/"/g, '""')}"`;
            const success = item.result.success;
            const error = item.result.error ? `"${item.result.error.replace(/"/g, '""')}"` : '';
            const ttfc = item.result.performance?.timeToFirstChunk ?? '';
            const totalTime = item.result.performance?.totalTime ?? '';
            csvContent += [index + 1, prompt, success, error, ttfc, totalTime].join(',') + "\r\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `stress-test-details-${new Date().toISOString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [simulationResults]);


    const stats = calculateStats();

    if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex justify-center items-center"
        aria-modal="true"
        role="dialog"
        onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-4xl m-4 transform transition-all animate-dialog-in"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
             <div className="flex items-center gap-3">
                <CheckBadgeIcon className="w-7 h-7 text-blue-500"/>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Hướng dẫn Kiểm thử Chatbot</h2>
             </div>
             <button onClick={onClose} className="p-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" aria-label="Close dialog">
                <XIcon className="w-6 h-6" />
             </button>
        </header>

        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
            <section>
                <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-2">1. Kiểm thử Chức năng</h3>
                <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                    <TestStep title="Hỏi đáp V64" description="Kiểm tra khả năng trả lời các câu hỏi về công ty, giải pháp và dự án. Đảm bảo mỗi câu trả lời đều có nguồn tham khảo hợp lệ từ v64.vn." examples={["V64 là công ty gì?", "Kể tên các dự án tiêu biểu."]}/>
                    <TestStep title="Phân tích Kinh doanh" description="Thử nghiệm cả 3 công cụ (Lợi nhuận, Khuyến mãi, Đồng giá). Đánh giá chất lượng phân tích và các lời khuyên chiến lược mà AI đưa ra."/>
                    <TestStep title="Câu hỏi ngoài phạm vi" description="Hỏi những câu không liên quan để chắc chắn chatbot từ chối trả lời một cách lịch sự và đúng theo kịch bản." examples={["Thời tiết hôm nay thế nào?", "Công thức nấu ăn?"]}/>
                </ul>
            </section>
            
            <section>
                <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-2">2. Kiểm thử Hiệu năng & Độ ổn định</h3>
                <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                    <TestStep title="Đánh giá tốc độ phản hồi" description="Sau mỗi câu trả lời của AI, hãy quan sát các chỉ số hiệu năng bên dưới: ⚡️ (Time to First Chunk): Thời gian nhận được ký tự đầu tiên. Lý tưởng là dưới 500ms. ⏱️ (Total Time): Tổng thời gian để nhận toàn bộ phản hồi."/>
                    <TestStep title="Stress Test: Hội thoại dài" description="Tạo một cuộc hội thoại rất dài (trên 50 lượt hỏi-đáp). Cuộn lên xuống và gửi tin nhắn mới để kiểm tra xem giao diện có bị giật, lag hay chậm đi không."/>
                    <TestStep title="Theo dõi tài nguyên hệ thống" description="Sử dụng công cụ cho nhà phát triển của trình duyệt (F12 > Memory/Performance) để theo dõi việc sử dụng bộ nhớ, đảm bảo không có sự gia tăng bộ nhớ bất thường (dấu hiệu của memory leak)."/>
                </ul>
            </section>
            
            <section>
                <div className="flex items-center gap-3 mb-3">
                    <BeakerIcon className="w-6 h-6 text-blue-500"/>
                    <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">3. Kiểm thử Tải (Stress Test)</h3>
                </div>
                <div className="bg-slate-100 dark:bg-slate-900/40 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="numRequests" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Số lượng yêu cầu</label>
                            <input type="number" id="numRequests" value={numRequests} onChange={e => setNumRequests(parseInt(e.target.value, 10))} disabled={isSimulating} className="w-full bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border border-slate-300 dark:border-slate-600"/>
                        </div>
                        <div>
                            <label htmlFor="prompts" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Danh sách Prompts (mỗi dòng 1 prompt)</label>
                            <textarea id="prompts" value={prompts} onChange={e => setPrompts(e.target.value)} disabled={isSimulating} rows={4} className="w-full bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border border-slate-300 dark:border-slate-600 font-mono"></textarea>
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-4">
                         {isSimulating ? (
                             <button onClick={handleStopSimulation} className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-500 transition-colors">Dừng Giả lập</button>
                         ) : (
                             <button onClick={handleStartSimulation} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors">Bắt đầu Giả lập</button>
                         )}
                         {isSimulating && (
                            <div className="text-sm text-slate-600 dark:text-slate-300">
                                <p>Đang xử lý: {simulationProgress.current} / {simulationProgress.total}</p>
                                <div className="w-32 bg-slate-200 dark:bg-slate-600 rounded-full h-2 mt-1">
                                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(simulationProgress.current / simulationProgress.total) * 100}%` }}></div>
                                </div>
                            </div>
                         )}
                    </div>
                    {stats && (
                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
                             <div className="flex justify-between items-center mb-2">
                                <h4 className="font-semibold text-slate-700 dark:text-slate-200">Kết quả Stress Test</h4>
                                <div className="flex items-center gap-2">
                                     <button onClick={handleExportPNG} className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors border border-slate-300 dark:border-slate-600">
                                        <PhotoIcon className="w-3.5 h-3.5" />
                                        Xuất ảnh PNG
                                     </button>
                                     <button onClick={handleExportCSV} className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors border border-slate-300 dark:border-slate-600">
                                        <DocumentTextIcon className="w-3.5 h-3.5" />
                                        Xuất file CSV
                                    </button>
                                </div>
                             </div>
                            <div ref={resultsRef} className="p-4 bg-white dark:bg-slate-800 rounded-lg">
                                <h5 className="font-semibold text-center text-slate-800 dark:text-slate-100">Báo cáo Hiệu năng Chatbot</h5>
                                <p className="text-center text-xs text-slate-500 dark:text-slate-400 mb-4">Đã thực thi {stats.totalRequests} yêu cầu | Ngày: {new Date().toLocaleDateString('vi-VN')}</p>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                    <div className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                                        <p className="text-slate-500 dark:text-slate-400">Thành công</p>
                                        <p className="text-lg font-bold text-green-600 dark:text-green-400">{stats.successRate.toFixed(1)}%</p>
                                    </div>
                                    <div className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                                        <p className="text-slate-500 dark:text-slate-400">Thất bại</p>
                                        <p className="text-lg font-bold text-red-600 dark:text-red-400">{stats.failedCount}</p>
                                    </div>
                                    <div className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                                        <p className="text-slate-500 dark:text-slate-400">⚡️ TTFC (TB / P95)</p>
                                        <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{stats.avgFirstChunk}ms / {stats.p95FirstChunk}ms</p>
                                    </div>
                                    <div className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                                        <p className="text-slate-500 dark:text-slate-400">⏱️ Tổng time (TB / P95)</p>
                                        <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{stats.avgTotalTime}ms / {stats.p95TotalTime}ms</p>
                                    </div>
                                </div>
                                {stats.chartData.length > 0 && (
                                    <>
                                        <h5 className="font-semibold text-center text-slate-800 dark:text-slate-100 mt-6 mb-2">Phân tích Thời gian Phản hồi</h5>
                                        <PerformanceChart data={stats.chartData} />
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>
      </div>
    </div>
  );
};

// Ensure animation styles are present
const style = document.createElement('style');
if (!document.querySelector('[data-animation="dialog-in"]')) {
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