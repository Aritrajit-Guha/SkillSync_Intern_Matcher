/**
 * RoadmapPage — Renders the skill roadmap with course cards and unlock banner.
 */
const RoadmapPage = {
  render(state) {
    const sec = document.getElementById('sec-upskill');
    if (!sec) return;
    const T = state.translations;

    const intern = state.results.find(r => r.id === state.roadmapFor)
                 || state.results[0];
    if (!intern) {
      sec.innerHTML = `<div class="section-head"><h2>${T.upskillHead}</h2></div>
        <div class="empty-state"><div class="icon">🗺️</div><p>Select an internship from matches first.</p></div>`;
      return;
    }

    const allCoursePairs = intern.missingSkills.flatMap(skill =>
      (STATIC_COURSES[skill] || []).map(c => ({ ...c, skill }))
    );
    const total = allCoursePairs.length;
    const done  = allCoursePairs.filter(c =>
      state.completedCourses.has(`${c.skill}-${c.title.replace(/\s+/g,'_')}`)
    ).length;
    const allDone = total > 0 && done === total;

    sec.innerHTML = `
      <div class="section-head">
        <h2>${T.upskillHead}</h2>
        <p>${T.upskillSub}</p>
      </div>
      <div class="roadmap-header">
        <h3>${intern.icon} ${sanitize(intern.title)}</h3>
        <p>${sanitize(intern.org)} • ${intern.missingSkills.length} skill gap${intern.missingSkills.length !== 1 ? 's' : ''} to close</p>
      </div>

      ${ProgressBar.render({ value: done, max: total || 1, label: T.overallProgress })}

      <div style="height:16px"></div>

      ${intern.missingSkills.map((skill, idx) => `
        <div class="sub-head">
          <h3>${ProfileForm.SKILLS[skill] || skill}</h3>
          <span class="count">${(STATIC_COURSES[skill]||[]).length} ${T.courses}</span>
        </div>
        <div class="course-list" style="margin-bottom:24px">
          ${(STATIC_COURSES[skill] || []).map(c =>
            CourseCard.render(c, skill,
              state.completedCourses.has(`${skill}-${c.title.replace(/\s+/g,'_')}`), T)
          ).join('')}
        </div>
      `).join('')}

      ${EligibleBanner.render(intern.title, allDone, T)}
    `;
  }
};