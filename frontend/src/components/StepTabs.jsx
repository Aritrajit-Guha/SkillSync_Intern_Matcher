export default function StepTabs({ currentStep, doneSteps, labels, onStep }) {
  return (
    <nav className="step-nav" aria-label="Steps" role="tablist">
      {labels.map((label, index) => {
        const step = index + 1;
        const isActive = currentStep === step;
        const isDone = doneSteps.has(step);
        return (
          <button
            key={label}
            className={`step-btn${isActive ? ' active' : ''}${isDone ? ' done' : ''}`}
            onClick={() => onStep(step)}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={`Step ${step}: ${label}`}
          >
            <span className="step-check" aria-hidden="true">{'\u2713'}</span>
            <span className="step-num" aria-hidden="true">{step}</span>
            <span className="step-label">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
