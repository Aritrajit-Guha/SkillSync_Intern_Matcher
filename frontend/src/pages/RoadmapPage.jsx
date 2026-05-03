import CourseCard from '../components/CourseCard.jsx';
import EligibleBanner from '../components/EligibleBanner.jsx';
import ProgressBar from '../components/ProgressBar.jsx';

export default function RoadmapPage({
  state,
  translations,
  getInternshipById,
  getProgress,
  buildCoachPlan,
  getCoursesForSkill,
  getCourseId,
  onMarkCourse,
  onBack,
  onApply,
}) {
  const internship = getInternshipById(state.roadmapFor) || state.results[0];

  if (!internship) {
    return (
      <>
        <div className="section-head"><h2>{translations.upskillHead}</h2></div>
        <div className="empty-state"><div className="icon">Map</div><p>Select an internship to view its roadmap.</p></div>
      </>
    );
  }

  const progress = getProgress(internship);
  const coach = buildCoachPlan(internship);

  return (
    <>
      <div className="section-head">
        <h2>{translations.upskillHead}</h2>
        <p>{translations.upskillSub}</p>
      </div>

      <div className="roadmap-header">
        <h3>{internship.icon || 'PM'} {internship.title}</h3>
        <p>{internship.org} · {internship.location}</p>
      </div>

      <div className="coach-panel">
        <div className="coach-shell">
          <div className="coach-bubble coach-user-bubble">
            <span className="chat-avatar chat-avatar-user">You</span>
            <div className="coach-message">
              <span className="coach-label">Candidate prompt</span>
              <p>I want to become eligible for <strong>{internship.title}</strong>. Show me the roadmap for my missing skills.</p>
            </div>
          </div>
          <div className="coach-bubble coach-bubble-primary coach-ai-bubble">
            <span className="chat-avatar">AI</span>
            <div className="coach-message">
              <span className="coach-label">AI Roadmap Chatbot</span>
              <h3>{coach.heading}</h3>
              <p>{coach.message}</p>
            </div>
            <div className="typing-indicator" aria-hidden="true">
              <span /><span /><span />
            </div>
          </div>
        </div>
        <div className="coach-bubble coach-bubble-secondary">
          <strong>Roadmap progress</strong>
          <ProgressBar value={progress.done} max={progress.total || 1} label={translations.overallProgress} />
        </div>
      </div>

      <div className="roadmap-chat-list">
        {coach.plan.map(item => (
          <div className="roadmap-chat-card" key={item.skill}>
            <div className="chat-avatar-row chat-avatar-row-rich">
              <span className="chat-avatar">AI</span>
              <div>
                <span className="chat-intent">Roadmap for {item.label}</span>
                <small className="chat-subline">Focused plan generated from the current skill gap.</small>
              </div>
            </div>
            <div className="roadmap-chat-head">
              <h3>{item.label}</h3>
              <span>{getCoursesForSkill(item.skill).length} steps</span>
            </div>
            <p>{item.summary}</p>
            <div className="course-list">
              {getCoursesForSkill(item.skill).map(course => (
                <CourseCard
                  key={getCourseId(item.skill, course.title)}
                  course={course}
                  skillId={item.skill}
                  completed={state.completedCourses.has(getCourseId(item.skill, course.title))}
                  translations={translations}
                  onComplete={onMarkCourse}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <EligibleBanner
        title={internship.title}
        unlocked={progress.unlocked}
        translations={translations}
        onBack={onBack}
        onApply={() => onApply(internship.id)}
      />
    </>
  );
}
