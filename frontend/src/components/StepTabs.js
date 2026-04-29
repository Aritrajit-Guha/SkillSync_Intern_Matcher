/**
 * StepTabs - Renders the candidate journey tabs.
 */
const StepTabs = {
  render(currentStep, doneSteps, labels) {
    const container = document.getElementById('step-nav');
    if (!container) return;
    container.innerHTML = labels.map((label, i) => {
      const n = i + 1;
      const isActive = currentStep === n;
      const isDone = doneSteps.has(n);
      return `
        <button
          class="step-btn${isActive ? ' active' : ''}${isDone ? ' done' : ''}"
          onclick="App.goStep(${n})"
          role="tab"
          aria-selected="${isActive}"
          aria-label="Step ${n}: ${label}"
        >
          <span class="step-check" aria-hidden="true">✓</span>
          <span class="step-num" aria-hidden="true">${n}</span>
          <span class="step-label">${label}</span>
        </button>
      `;
    }).join('');
  }
};
