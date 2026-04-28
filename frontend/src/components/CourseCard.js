/**
 * CourseCard — A single course item with check-off interaction.
 */
const CourseCard = {
  render(course, skillId, isDone, translations) {
    const T = translations;
    const cid = `${skillId}-${course.title.replace(/\s+/g, '_')}`;
    const safeId = btoa(cid).replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);

    return `
      <div class="course-card${isDone ? ' done' : ''}" id="cc-${safeId}" aria-label="${course.title}">
        <div class="course-inner">
          <div class="course-icon" aria-hidden="true">${course.icon}</div>
          <div class="course-info">
            <div class="course-title">${sanitize(course.title)}</div>
            <div class="course-meta">${sanitize(course.platform)} • ${sanitize(course.duration)}</div>
          </div>
          <button
            class="course-check${isDone ? ' done' : ''}"
            onclick="App.markCourse('${cid}')"
            aria-label="${T.markComplete}: ${course.title}"
            title="${T.markComplete}"
            aria-pressed="${isDone}"
          >${isDone ? '✓' : ''}</button>
        </div>
        <div class="course-progress" role="progressbar" aria-valuenow="${isDone ? 100 : 0}" aria-valuemin="0" aria-valuemax="100">
          <div class="course-progress-fill" style="width:${isDone ? 100 : 0}%"></div>
        </div>
      </div>
    `;
  }
};