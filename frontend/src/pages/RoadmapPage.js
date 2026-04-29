/**
 * RoadmapPage - Conversational roadmap coach for locked internships.
 */
const RoadmapPage = {
  render(state) {
    const sec = document.getElementById('sec-upskill');
    if (!sec) return;
    const T = state.translations;

    const internship = state.results.find(item => item.id === state.roadmapFor) || state.results[0];
    if (!internship) {
      sec.innerHTML = `
        <div class="section-head"><h2>${T.upskillHead}</h2></div>
        <div class="empty-state"><div class="icon">🗺️</div><p>Select an internship to view its roadmap.</p></div>
      `;
      return;
    }

    const progress = App.getInternshipProgress(internship);
    const coach = App.buildCoachPlan(internship);

    sec.innerHTML = `
      <div class="section-head">
        <h2>${T.upskillHead}</h2>
        <p>${T.upskillSub}</p>
      </div>

      <div class="roadmap-header">
        <h3>${internship.icon || '💼'} ${sanitize(internship.title)}</h3>
        <p>${sanitize(internship.org)} • ${sanitize(internship.location)}</p>
      </div>

      <div class="coach-panel">
        <div class="coach-shell">
          <div class="coach-bubble coach-user-bubble">
            <span class="chat-avatar chat-avatar-user">You</span>
            <div class="coach-message">
              <span class="coach-label">Candidate prompt</span>
              <p>I want to become eligible for <strong>${sanitize(internship.title)}</strong>. Show me the roadmap for my missing skills.</p>
            </div>
          </div>
          <div class="coach-bubble coach-bubble-primary coach-ai-bubble">
            <span class="chat-avatar">AI</span>
            <div class="coach-message">
              <span class="coach-label">AI Roadmap Chatbot</span>
              <h3>${sanitize(coach.heading)}</h3>
              <p>${sanitize(coach.message)}</p>
            </div>
            <div class="typing-indicator" aria-hidden="true">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
        <div class="coach-bubble coach-bubble-secondary">
          <strong>Roadmap progress</strong>
          ${ProgressBar.render({ value: progress.done, max: progress.total || 1, label: T.overallProgress })}
        </div>
      </div>

      <div class="roadmap-chat-list">
        ${coach.plan.map(item => `
          <div class="roadmap-chat-card">
            <div class="chat-avatar-row chat-avatar-row-rich">
              <span class="chat-avatar">AI</span>
              <div>
                <span class="chat-intent">Roadmap for ${sanitize(item.label)}</span>
                <small class="chat-subline">Focused plan generated from the current skill gap.</small>
              </div>
            </div>
            <div class="roadmap-chat-head">
              <h3>${sanitize(item.label)}</h3>
              <span>${(App.getCoursesForSkill(item.skill) || []).length} steps</span>
            </div>
            <p>${sanitize(item.summary)}</p>
            <div class="course-list">
              ${App.getCoursesForSkill(item.skill).map(course =>
                CourseCard.render(
                  course,
                  item.skill,
                  state.completedCourses.has(App.getCourseId(item.skill, course.title)),
                  T
                )
              ).join('')}
            </div>
          </div>
        `).join('')}
      </div>

      ${EligibleBanner.render(internship.title, progress.unlocked, T)}
    `;
  }
};
