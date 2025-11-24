
import React, { useState, useEffect } from 'react';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { PencilSquareIcon } from './icons/PencilSquareIcon';
import { CheckIcon } from './icons/CheckIcon';

export const LookerStudioReport: React.FC = () => {
  // Sử dụng localStorage để lưu URL báo cáo, giúp người dùng không phải nhập lại mỗi lần load trang
  const [reportUrl, setReportUrl] = useState<string>(() => {
      return localStorage.getItem('v64_looker_url') || "";
  });
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(reportUrl);

  const handleSave = () => {
      setReportUrl(inputValue);
      localStorage.setItem('v64_looker_url', inputValue);
      setIsEditing(false);
  };

  // Tự động chuyển sang chế độ chỉnh sửa nếu chưa có URL
  useEffect(() => {
      if (!reportUrl) {
          setIsEditing(true);
      }
  }, [reportUrl]);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-900 overflow-hidden">
      <div className="p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                <ChartBarIcon className="w-6 h-6" />
            </div>
            <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Báo cáo Looker Studio</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Dashboard phân tích dữ liệu kinh doanh tập trung.</p>
            </div>
          </div>
          
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
          >
            <PencilSquareIcon className="w-4 h-4" />
            {isEditing ? 'Hủy cấu hình' : 'Cấu hình URL'}
          </button>
      </div>

      {isEditing && (
          <div className="p-6 bg-blue-50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-800/30 animate-fade-in-fast">
              <div className="max-w-3xl mx-auto">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                      Liên kết nhúng (Embed URL) từ Looker Studio
                  </label>
                  <div className="flex gap-3">
                      <input 
                        type="text" 
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="https://lookerstudio.google.com/embed/reporting/..."
                        className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <button 
                        onClick={handleSave}
                        disabled={!inputValue.trim()}
                        className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 disabled:opacity-50 transition-colors flex items-center gap-2"
                      >
                        <CheckIcon className="w-5 h-5" />
                        Lưu & Hiển thị
                      </button>
                  </div>
                  <div className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                      <strong>Hướng dẫn lấy link:</strong>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>Mở báo cáo Looker Studio của bạn.</li>
                          <li>Chọn <strong>File (Tệp)</strong> &rarr; <strong>Embed report (Nhúng báo cáo)</strong>.</li>
                          <li>Chọn <strong>Enable embedding (Bật nhúng)</strong> và chọn tab <strong>Embed URL</strong>.</li>
                          <li>Copy đường dẫn bắt đầu bằng <code>https://lookerstudio.google.com/embed/...</code> và dán vào đây.</li>
                      </ul>
                  </div>
              </div>
          </div>
      )}

      <div className="flex-1 relative bg-slate-100 dark:bg-slate-900">
          {reportUrl ? (
              <iframe
                  title="Looker Studio Report"
                  width="100%"
                  height="100%"
                  src={reportUrl}
                  frameBorder="0"
                  style={{ border: 0 }}
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
              ></iframe>
          ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500">
                  <ChartBarIcon className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-lg font-medium">Chưa có báo cáo nào được cấu hình.</p>
                  <p className="text-sm mt-2">Vui lòng nhập Embed URL từ Looker Studio để bắt đầu.</p>
              </div>
          )}
      </div>
    </div>
  );
};
