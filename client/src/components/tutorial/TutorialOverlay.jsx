import { useState, useEffect, useCallback, useRef } from 'react';
import { useTutorial } from './TutorialContext';
import './Tutorial.css';

const PADDING = 10;
const POPOVER_GAP = 16;
const POPOVER_WIDTH = 340;

function getTargetRect(selector) {
  const el = document.querySelector(selector);
  if (!el) return null;
  return el.getBoundingClientRect();
}

function calcPopoverPos(targetRect, placement, popoverHeight) {
  if (!targetRect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

  const pad = PADDING;
  const gap = POPOVER_GAP;
  const pw = POPOVER_WIDTH;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let top, left;
  let actualPlacement = placement;

  // Try preferred placement, fall back if not enough space
  if (placement === 'bottom') {
    top = targetRect.bottom + pad + gap;
    left = targetRect.left + targetRect.width / 2 - pw / 2;
    if (top + (popoverHeight || 200) > vh - 20) actualPlacement = 'top';
  }
  if (placement === 'top' || actualPlacement === 'top') {
    top = targetRect.top - pad - gap - (popoverHeight || 200);
    left = targetRect.left + targetRect.width / 2 - pw / 2;
    if (top < 20) {
      actualPlacement = 'bottom';
      top = targetRect.bottom + pad + gap;
    } else {
      actualPlacement = 'top';
    }
  }
  if (placement === 'right') {
    top = targetRect.top + targetRect.height / 2 - (popoverHeight || 200) / 2;
    left = targetRect.right + pad + gap;
    if (left + pw > vw - 20) {
      actualPlacement = 'left';
      left = targetRect.left - pad - gap - pw;
    }
  }
  if (placement === 'left' && actualPlacement !== 'right') {
    top = targetRect.top + targetRect.height / 2 - (popoverHeight || 200) / 2;
    left = targetRect.left - pad - gap - pw;
    if (left < 20) {
      actualPlacement = 'right';
      left = targetRect.right + pad + gap;
    }
  }

  // Clamp to viewport
  left = Math.max(16, Math.min(left, vw - pw - 16));
  top = Math.max(16, Math.min(top, vh - (popoverHeight || 200) - 16));

  return { top: `${top}px`, left: `${left}px`, placement: actualPlacement };
}

export default function TutorialOverlay() {
  const { active, currentStep, stepIndex, totalSteps, nextStep, prevStep, skipTutorial } = useTutorial();
  const [targetRect, setTargetRect] = useState(null);
  const [popoverPos, setPopoverPos] = useState({});
  const [popoverHeight, setPopoverHeight] = useState(200);
  const popoverRef = useRef(null);
  const [animKey, setAnimKey] = useState(0);

  const measure = useCallback(() => {
    if (!currentStep) return;
    const rect = getTargetRect(currentStep.target);
    setTargetRect(rect);
    const pos = calcPopoverPos(rect, currentStep.placement, popoverHeight);
    setPopoverPos(pos);
  }, [currentStep, popoverHeight]);

  // Measure target on step change
  useEffect(() => {
    if (!active || !currentStep) return;
    // Allow time for DOM to settle
    const timer = setTimeout(() => {
      measure();
      setAnimKey(k => k + 1);
    }, 50);
    return () => clearTimeout(timer);
  }, [active, currentStep, measure]);

  // Measure popover height after render
  useEffect(() => {
    if (popoverRef.current) {
      const h = popoverRef.current.offsetHeight;
      if (h !== popoverHeight) {
        setPopoverHeight(h);
        measure();
      }
    }
  });

  // Reposition on resize
  useEffect(() => {
    if (!active) return;
    const handleResize = () => measure();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [active, measure]);

  // Keyboard navigation
  useEffect(() => {
    if (!active) return;
    const handleKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') nextStep();
      else if (e.key === 'ArrowLeft') prevStep();
      else if (e.key === 'Escape') skipTutorial();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [active, nextStep, prevStep, skipTutorial]);

  if (!active || !currentStep) return null;

  const spotlightStyle = targetRect ? {
    top: targetRect.top - PADDING,
    left: targetRect.left - PADDING,
    width: targetRect.width + PADDING * 2,
    height: targetRect.height + PADDING * 2,
  } : {
    top: '50%',
    left: '50%',
    width: 0,
    height: 0,
  };

  // Indicator positioned at top-right of spotlight
  const indicatorStyle = targetRect ? {
    top: targetRect.top - 20,
    left: targetRect.right - 2,
  } : null;

  return (
    <div className={`tutorial-overlay ${active ? 'active' : ''}`} onClick={skipTutorial}>
      {/* Spotlight cutout */}
      <div className="tutorial-spotlight" style={spotlightStyle} />

      {/* Pulse indicator */}
      {indicatorStyle && (
        <div className="tutorial-indicator" style={indicatorStyle}>
          <div className="tutorial-indicator-dot">
            <div className="tutorial-indicator-ring" />
            <div className="tutorial-indicator-ring" />
          </div>
        </div>
      )}

      {/* Popover */}
      <div
        key={animKey}
        ref={popoverRef}
        className="tutorial-popover"
        data-placement={popoverPos.placement || currentStep.placement}
        style={{ top: popoverPos.top, left: popoverPos.left }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="tutorial-popover-arrow"
        />

        <div className="tutorial-popover-header">
          <span className="tutorial-popover-step">{stepIndex + 1} / {totalSteps}</span>
          <h3 className="tutorial-popover-title">{currentStep.title}</h3>
        </div>

        <div className="tutorial-popover-body">
          {currentStep.description}
        </div>

        {/* Progress bar */}
        <div className="tutorial-progress">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={`tutorial-progress-dot ${i === stepIndex ? 'active' : ''} ${i < stepIndex ? 'completed' : ''}`}
            />
          ))}
        </div>

        <div className="tutorial-popover-footer">
          <button className="tutorial-skip-btn" onClick={skipTutorial}>
            Skip tutorial
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            {stepIndex > 0 && (
              <button className="tutorial-nav-btn secondary" onClick={prevStep}>
                Back
              </button>
            )}
            <button className="tutorial-nav-btn primary" onClick={nextStep}>
              {stepIndex === totalSteps - 1 ? 'Got it!' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
