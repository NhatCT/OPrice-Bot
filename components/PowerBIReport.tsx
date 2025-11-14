import React from 'react';
import { ChartBarIcon } from './icons/ChartBarIcon';

export const PowerBIReport: React.FC = () => {
  // **QUAN TRỌNG**: Thay thế URL bên dưới bằng URL "Publish to web" từ báo cáo Power BI của bạn.
  const reportUrl = "https://app.powerbi.com/view?r=eyJrIjoiYOUR_REPORT_ID_HEREiLCJ0IjoiYOUR_TENANT_ID_HEREifQ%3D%3D";

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-900 overflow-hidden">
      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border-b-2 border-amber-200 dark:border-amber-800/50">
          <div className="flex items-start gap-3 max-w-4xl mx-auto">
            <ChartBarIcon className="w-6 h-6 text-amber-600 dark:text-amber-400 mt-1 flex-shrink-0" />
            <div>
                <h3 className="text-base font-bold text-amber-800 dark:text-amber-200">Hướng dẫn Tích hợp Báo cáo</h3>
                <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                    Để hiển thị báo cáo của bạn, hãy mở file <code>components/PowerBIReport.tsx</code> và thay thế giá trị của biến <code>reportUrl</code> bằng URL "Publish to web (public)" bạn nhận được từ Power BI.
                </p>
            </div>
          </div>
      </div>
      <div className="flex-1 p-4">
          <iframe
              title="Power BI Report"
              width="100%"
              height="100%"
              src={reportUrl}
              frameBorder="0"
              allowFullScreen={true}
              className="rounded-lg border border-slate-200 dark:border-slate-700 shadow-md bg-white"
          ></iframe>
      </div>
    </div>
  );
};
