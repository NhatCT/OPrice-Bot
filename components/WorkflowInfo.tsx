import React from 'react';

// Icons for workflow steps, defined inline for simplicity
const StepIcon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="flex-shrink-0 w-10 h-10 bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400 rounded-full flex items-center justify-center">
        {children}
    </div>
);
const SelectIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>;
const FormIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const AnalysisIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>;
const ResultIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;


export const WorkflowInfo: React.FC = () => {
  return (
    <div className="p-1 space-y-6">
        <section>
            <h3 className="text-base font-semibold text-sky-600 dark:text-sky-400 mb-3">Hỗ trợ tính giá chuyên sâu</h3>
            <ul className="space-y-3">
                <li className="flex items-start space-x-4">
                    <StepIcon><SelectIcon /></StepIcon>
                    <div>
                        <h4 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">1. Chọn công cụ</h4>
                        <p className="text-slate-600 dark:text-slate-300 text-sm">Chọn một trong các công cụ tính giá chuyên dụng: Tính giá bán, giá khuyến mãi, hoặc giá đồng giá.</p>
                    </div>
                </li>
                <li className="flex items-start space-x-4">
                    <StepIcon><FormIcon /></StepIcon>
                    <div>
                        <h4 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">2. Nhập thông tin</h4>
                        <p className="text-slate-600 dark:text-slate-300 text-sm">Điền các thông số cần thiết như giá vốn, chi phí, doanh số... vào biểu mẫu hướng dẫn chi tiết.</p>
                    </div>
                </li>
                <li className="flex items-start space-x-4">
                    <StepIcon><AnalysisIcon /></StepIcon>
                    <div>
                        <h4 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">3. AI Phân tích</h4>
                        <p className="text-slate-600 dark:text-slate-300 text-sm">Trợ lý AI sẽ tiếp nhận dữ liệu, áp dụng các mô hình kinh doanh để thực hiện phân tích chuyên sâu.</p>
                    </div>
                </li>
                <li className="flex items-start space-x-4">
                    <StepIcon><ResultIcon /></StepIcon>
                    <div>
                        <h4 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">4. Nhận kết quả</h4>
                        <p className="text-slate-600 dark:text-slate-300 text-sm">Nhận ngay câu trả lời chi tiết bao gồm công thức, giá bán đề xuất, điểm hòa vốn và lời khuyên chiến lược.</p>
                    </div>
                </li>
            </ul>
        </section>

         <div className="border-t border-slate-300 dark:border-slate-600/70 !my-4"></div>

        <section>
            <h3 className="text-base font-semibold text-sky-600 dark:text-sky-400 mb-3">Hỏi đáp thông tin V64.VN</h3>
             <ul className="space-y-3">
                <li className="flex items-start space-x-4">
                    <StepIcon><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></StepIcon>
                    <div>
                        <h4 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">1. Đặt câu hỏi</h4>
                        <p className="text-slate-600 dark:text-slate-300 text-sm">Nhập câu hỏi của bạn về công ty, giải pháp hoặc các dự án của V64 vào ô chat.</p>
                    </div>
                </li>
                <li className="flex items-start space-x-4">
                    <StepIcon><SearchIcon /></StepIcon>
                    <div>
                        <h4 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">2. AI Tìm kiếm</h4>
                        <p className="text-slate-600 dark:text-slate-300 text-sm">AI sẽ tự động tìm kiếm và tổng hợp thông tin chính xác nhất từ toàn bộ website v64.vn.</p>
                    </div>
                </li>
                 <li className="flex items-start space-x-4">
                    <StepIcon><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2V7a2 2 0 012-2h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H17z" /></svg></StepIcon>
                    <div>
                        <h4 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">3. Nhận câu trả lời</h4>
                        <p className="text-slate-600 dark:text-slate-300 text-sm">Nhận câu trả lời ngắn gọn, đáng tin cậy kèm theo các nguồn tham khảo trực tiếp để bạn có thể xác minh.</p>
                    </div>
                </li>
            </ul>
        </section>
    </div>
  );
};
