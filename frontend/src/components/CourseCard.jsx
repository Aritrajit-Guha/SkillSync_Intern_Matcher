export default function CourseCard({ course, skillId, completed, translations, onComplete }) {
  const courseId = `${skillId}-${course.title.replace(/\s+/g, '_')}`;

  return (
    <div className={`course-card${completed ? ' done' : ''}`} aria-label={course.title}>
      <div className="course-inner">
        <div className="course-icon" aria-hidden="true">{course.icon}</div>
        <div className="course-info">
          <div className="course-title">{course.title}</div>
          <div className="course-meta">
            {course.platform}{' \u2022 '}{course.duration}
          </div>
        </div>
        <button
          className={`course-check${completed ? ' done' : ''}`}
          disabled={completed}
          onClick={() => onComplete(courseId)}
          type="button"
          aria-label={`${translations.markComplete}: ${course.title}`}
          title={translations.markComplete}
          aria-pressed={completed}
        >
          {completed ? '\u2713' : ''}
        </button>
      </div>
      <div
        className="course-progress"
        role="progressbar"
        aria-valuenow={completed ? 100 : 0}
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div className="course-progress-fill" style={{ width: completed ? '100%' : '0%' }} />
      </div>
    </div>
  );
}
