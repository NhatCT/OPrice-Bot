import React, { useState, useEffect, useRef } from 'react';
import { XIcon } from './icons/XIcon';
import { ArrowLongLeftIcon } from './icons/ArrowLongLeftIcon';
import { ArrowLongRightIcon } from './icons/ArrowLongRightIcon';

export interface TourStep {
  elementId: string;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
  steps: TourStep[];
}

export const GuidedTour: React.FC<GuidedTourProps> = ({ isOpen, onClose, steps }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const step = steps[currentStep];

  useEffect(() => {
    if (!isOpen || !step) return;

    const element = document.getElementById(step.elementId);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
      element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    } else {
      setTargetRect(null);
    }
  }, [currentStep, isOpen, step]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleClose = () => {
    setCurrentStep(0);
    onClose();
  }

  if (!isOpen || !step) return null;
  
  const position = step.position || 'bottom';
  let popoverStyle: React.CSSProperties = {
    position: 'absolute',
    zIndex: 10001,
  };
  
  if (targetRect) {
    const margin = 12; // margin between element and popover
    switch (position) {
      case 'top':
        popoverStyle.bottom = window.innerHeight - targetRect.top + margin;
        popoverStyle.left = targetRect.left + targetRect.width / 2;
        popoverStyle.transform = 'translateX(-50%)';
        break;
      case 'bottom':
        popoverStyle.top = targetRect.bottom + margin;
        popoverStyle.left = targetRect.left + targetRect.width / 2;
        popoverStyle.transform = 'translateX(-50%)';
        break;
      case 'left':
        popoverStyle.right = window.innerWidth - targetRect.left + margin;
        popoverStyle.top = targetRect.top + targetRect.height / 2;
        popoverStyle.transform = 'translateY(-50%)';
        break;
      case 'right':
        popoverStyle.left = targetRect.right + margin;
        popoverStyle.top = targetRect.top + targetRect.height / 2;
        popoverStyle.transform = 'translateY(-50%)';
        break;
    }
  }

  return (
    <div className="fixed inset-0 z-[10000]">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose}></div>
      
      {/* Highlight Box */}
      {targetRect && (
        <div
          className="absolute rounded-lg border-2 border-white border-dashed shadow-2xl transition-all duration-300 ease-in-out"
          style={{
            left: targetRect.left - 4,
            top: targetRect.top - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Popover */}
      <div ref={popoverRef} style={popoverStyle} className="w-80 bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-4 animate-popover-enter">
        <div className="flex justify-between items-start">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 pr-2">{step.title}</h3>
            <button onClick={handleClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700">
                <XIcon className="w-5 h-5" />
            </button>
        </div>
        <p className="mt-2 text-base text-slate-600 dark:text-slate-300">{step.description}</p>
        
        <div className="mt-4 flex justify-between items-center">
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {currentStep + 1} / {steps.length}
            </div>
            <div className="flex items-center gap-2">
                {currentStep > 0 && (
                    <button onClick={handlePrev} className="flex items-center gap-1.5 px-3 py-1.5 text-base font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/70 transition-colors">
                        <ArrowLongLeftIcon className="w-5 h-5"/>
                        <span>Quay lại</span>
                    </button>
                )}
                <button onClick={handleNext} className="flex items-center gap-1.5 px-3 py-1.5 text-base font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors">
                    <span>{currentStep === steps.length - 1 ? 'Hoàn tất' : 'Tiếp theo'}</span>
                    <ArrowLongRightIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

