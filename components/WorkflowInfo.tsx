import React from 'react';
import { GlobeAltIcon } from './icons/GlobeAltIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { PencilIcon } from './icons/PencilIcon';
import { BeakerIcon } from './icons/BeakerIcon';
import { ArchiveBoxIcon } from './icons/ArchiveBoxIcon';
import { CheckBadgeIcon } from './icons/CheckBadgeIcon';
import { CheckIcon } from './icons/CheckIcon';
import { PhotoIcon } from './icons/PhotoIcon';

const workflowSteps = [
  {
    icon: <GlobeAltIcon />,
    title: 'Nghiên cứu xu hướng',
    description: 'Nghiên cứu xu hướng thời trang thế giới và trong nước.',
  },
  {
    icon: <SparklesIcon />,
    title: 'Lên ý tưởng',
    description: 'Lên ý tưởng cho bộ sưu tập theo mùa.',
  },
  {
    icon: <PencilIcon />,
    title: 'Thiết kế sản phẩm',
    description: 'Lên thiết kế sản phẩm phù hợp với ý tưởng và chủ đề.',
  },
  {
    icon: <BeakerIcon />,
    title: 'Phát triển sản phẩm',
    description: 'Làm việc với phòng phát triển May và Wash.',
  },
  {
    icon: <ArchiveBoxIcon />,
    title: 'Cung cấp Nguyên phụ liệu',
    description: 'Cung cấp nguyên phụ liệu để hoàn thiện sản phẩm.',
  },
  {
    icon: <CheckBadgeIcon />,
    title: 'Nghiệm thu mẫu',
    description: 'Nghiệm thu sản phẩm mẫu.',
  },
  {
    icon: <CheckIcon />,
    title: 'Fitting & Duyệt sản xuất',
    description: 'Fitting mẫu và duyệt sản xuất hàng loạt.',
  },
  {
    icon: <PhotoIcon />,
    title: 'Chuẩn bị bán hàng',
    description: 'Mix & match sản phẩm để chuẩn bị chụp hình bán sản phẩm.',
  },
];

export const WorkflowInfo: React.FC = () => {
  return (
    <section>
        <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-6">
            Quy trình phát triển sản phẩm thời trang
        </h3>
        <div className="relative pl-4">
            {/* Vertical line */}
            <div className="absolute left-9 top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-slate-700 transform -translate-x-1/2"></div>
            
            <ul className="space-y-8">
                {workflowSteps.map((step, index) => (
                    <li key={index} className="flex items-start">
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center z-10 ring-8 ring-white dark:ring-slate-800">
                            {React.cloneElement(step.icon, { className: "w-5 h-5"})}
                        </div>
                        <div className="ml-4 mt-1">
                            <h4 className="font-semibold text-slate-700 dark:text-slate-200">{index + 1}. {step.title}</h4>
                            <p className="text-slate-600 dark:text-slate-300 text-sm mt-1">{step.description}</p>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    </section>
  );
};