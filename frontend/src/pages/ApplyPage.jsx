export default function ApplyPage({
  state,
  getInternshipById,
  onBack,
  onDraftChange,
  onResume,
  onSubmit,
}) {
  const internship = getInternshipById(state.applyFor);

  if (!internship) {
    return (
      <>
        <div className="section-head"><h2>Apply</h2><p>Select an internship first.</p></div>
        <div className="empty-state"><div className="icon">Doc</div><p>No internship selected for application.</p></div>
      </>
    );
  }

  const draft = state.applicationDrafts[internship.id] || {
    fullName: '',
    email: '',
    phone: '',
    cgpa: '',
    college: '',
    graduationYear: '',
    coverNote: '',
    resumeName: '',
  };

  const update = (key, value) => onDraftChange(internship.id, key, value);

  return (
    <>
      <div className="section-head">
        <h2>Apply for {internship.title}</h2>
        <p>{internship.org} · {internship.location}</p>
      </div>

      <div className="card apply-card">
        <div className="card-title">Application details</div>

        <div className="field-grid">
          <div className="field">
            <label htmlFor="apply-name">Full name</label>
            <input id="apply-name" type="text" value={draft.fullName} onChange={event => update('fullName', event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="apply-email">Email</label>
            <input id="apply-email" type="email" value={draft.email} onChange={event => update('email', event.target.value)} />
          </div>
        </div>

        <div className="field-grid">
          <div className="field">
            <label htmlFor="apply-phone">Phone number</label>
            <input id="apply-phone" type="tel" value={draft.phone} onChange={event => update('phone', event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="apply-cgpa">CGPA / Percentage</label>
            <input id="apply-cgpa" type="text" value={draft.cgpa} onChange={event => update('cgpa', event.target.value)} />
          </div>
        </div>

        <div className="field-grid">
          <div className="field">
            <label htmlFor="apply-college">College / University</label>
            <input id="apply-college" type="text" value={draft.college} onChange={event => update('college', event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="apply-year">Graduation year</label>
            <input id="apply-year" type="text" value={draft.graduationYear} onChange={event => update('graduationYear', event.target.value)} />
          </div>
        </div>

        <div className="field">
          <label htmlFor="apply-resume">Resume upload</label>
          <input id="apply-resume" type="file" accept=".pdf,.doc,.docx" onChange={event => onResume(internship.id, event.target.files?.[0])} />
          <div className="upload-note">{draft.resumeName ? `Selected file: ${draft.resumeName}` : 'Upload PDF, DOC, or DOCX resume.'}</div>
        </div>

        <div className="field">
          <label htmlFor="apply-note">Why are you a fit?</label>
          <textarea id="apply-note" rows="5" value={draft.coverNote} onChange={event => update('coverNote', event.target.value)} />
        </div>

        <div className="form-actions apply-actions">
          <button className="btn-secondary" onClick={onBack} type="button">Back to internships</button>
          <button className="btn-primary" onClick={() => onSubmit(internship.id)} type="button">Submit application</button>
        </div>
      </div>
    </>
  );
}
