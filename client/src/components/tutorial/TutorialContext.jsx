import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { TUTORIAL_STEPS } from './tutorialSteps';

const TutorialContext = createContext(null);

const STORAGE_KEY = 'catan-tutorial-completed';

const initialState = {
  active: false,
  stepIndex: 0,
  steps: TUTORIAL_STEPS,
};

function tutorialReducer(state, action) {
  switch (action.type) {
    case 'START':
      return { ...state, active: true, stepIndex: 0 };
    case 'NEXT':
      if (state.stepIndex >= state.steps.length - 1) {
        localStorage.setItem(STORAGE_KEY, 'true');
        return { ...state, active: false, stepIndex: 0 };
      }
      return { ...state, stepIndex: state.stepIndex + 1 };
    case 'PREV':
      return { ...state, stepIndex: Math.max(0, state.stepIndex - 1) };
    case 'SKIP':
      localStorage.setItem(STORAGE_KEY, 'true');
      return { ...state, active: false, stepIndex: 0 };
    case 'GO_TO':
      return { ...state, stepIndex: action.payload };
    default:
      return state;
  }
}

export function TutorialProvider({ children }) {
  const [state, dispatch] = useReducer(tutorialReducer, initialState);

  const startTutorial = useCallback(() => dispatch({ type: 'START' }), []);
  const nextStep = useCallback(() => dispatch({ type: 'NEXT' }), []);
  const prevStep = useCallback(() => dispatch({ type: 'PREV' }), []);
  const skipTutorial = useCallback(() => dispatch({ type: 'SKIP' }), []);
  const goToStep = useCallback((i) => dispatch({ type: 'GO_TO', payload: i }), []);

  // Auto-start on first visit
  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      // Small delay so the game UI renders first
      const timer = setTimeout(() => dispatch({ type: 'START' }), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const currentStep = state.active ? state.steps[state.stepIndex] : null;

  return (
    <TutorialContext.Provider value={{
      active: state.active,
      stepIndex: state.stepIndex,
      totalSteps: state.steps.length,
      currentStep,
      startTutorial,
      nextStep,
      prevStep,
      skipTutorial,
      goToStep,
    }}>
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  return useContext(TutorialContext);
}
