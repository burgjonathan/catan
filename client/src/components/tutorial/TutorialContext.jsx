import { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import { useGame } from '../../context/GameContext';
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
  const { state: gameState, dispatch: gameDispatch } = useGame();
  const tutorialMode = gameState.tutorialMode;
  const prevActiveRef = useRef(false);

  const startTutorial = useCallback(() => dispatch({ type: 'START' }), []);
  const nextStep = useCallback(() => dispatch({ type: 'NEXT' }), []);
  const prevStep = useCallback(() => dispatch({ type: 'PREV' }), []);
  const skipTutorial = useCallback(() => dispatch({ type: 'SKIP' }), []);
  const goToStep = useCallback((i) => dispatch({ type: 'GO_TO', payload: i }), []);

  // Auto-start tutorial
  useEffect(() => {
    if (tutorialMode) {
      // Always start in tutorial mode
      const timer = setTimeout(() => dispatch({ type: 'START' }), 800);
      return () => clearTimeout(timer);
    }
    // Normal mode: auto-start on first visit
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      const timer = setTimeout(() => dispatch({ type: 'START' }), 800);
      return () => clearTimeout(timer);
    }
  }, [tutorialMode]);

  // Return to lobby when tutorial ends in tutorial mode
  useEffect(() => {
    if (tutorialMode && prevActiveRef.current && !state.active) {
      gameDispatch({ type: 'RESET' });
    }
    prevActiveRef.current = state.active;
  }, [state.active, tutorialMode, gameDispatch]);

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
