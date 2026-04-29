/**
 * ApplyPage - Final application form for eligible internships.
 */
const ApplyPage = {
  render(state) {
    const sec = document.getElementById('sec-apply');
    if (!sec) return;

    const internship = state.results.find(item => item.id === state.applyFor) || App.getInternshipById(state.applyFor);
    if (!internship) {
      sec.innerHTML = `
        <div class="section-head"><h2>Apply</h2><p>Select an internship first.</p></div>
        <div class="empty-state"><div class="icon">📄</div><p>No internship selected for application.</p></div>
      `;
      return;
    }

    const draft = state.applicationDrafts[internship.id] || {
      fullName: '',
      email: '',
      phone: '',
      cgpa: '',
      college: '',
      graduationYear: '',
      coverNote: '',
      resumeName: ''
    };

    sec.innerHTML = `
      <div class="section-head">
        <h2>Apply for ${sanitize(internship.title)}</h2>
        <p>${sanitize(internship.org)} • ${sanitize(internship.location)}</p>
      </div>

      <div class="card apply-card">
        <div class="card-title">Application details</div>

        <div class="field-grid">
          <div class="field">
            <label for="apply-name">Full name</label>
            <input id="apply-name" type="text" value="${sanitize(draft.fullName)}" oninput="App.updateApplicationDraft('${internship.id}','fullName',this.value)" />
          </div>
          <div class="field">
            <label for="apply-email">Email</label>
            <input id="apply-email" type="email" value="${sanitize(draft.email)}" oninput="App.updateApplicationDraft('${internship.id}','email',this.value)" />
          </div>
        </div>

        <div class="field-grid">
          <div class="field">
            <label for="apply-phone">Phone number</label>
            <input id="apply-phone" type="tel" value="${sanitize(draft.phone)}" oninput="App.updateApplicationDraft('${internship.id}','phone',this.value)" />
          </div>
          <div class="field">
            <label for="apply-cgpa">CGPA / Percentage</label>
            <input id="apply-cgpa" type="text" value="${sanitize(draft.cgpa)}" oninput="App.updateApplicationDraft('${internship.id}','cgpa',this.value)" />
          </div>
        </div>

        <div class="field-grid">
          <div class="field">
            <label for="apply-college">College / University</label>
            <input id="apply-college" type="text" value="${sanitize(draft.college)}" oninput="App.updateApplicationDraft('${internship.id}','college',this.value)" />
          </div>
          <div class="field">
            <label for="apply-year">Graduation year</label>
            <input id="apply-year" type="text" value="${sanitize(draft.graduationYear)}" oninput="App.updateApplicationDraft('${internship.id}','graduationYear',this.value)" />
          </div>
        </div>

        <div class="field">
          <label for="apply-resume">Resume upload</label>
          <input id="apply-resume" type="file" accept=".pdf,.doc,.docx" onchange="App.captureResume('${internship.id}', this)" />
          ${draft.resumeName ? `<div class="upload-note">Selected file: ${sanitize(draft.resumeName)}</div>` : `<div class="upload-note">Upload PDF, DOC, or DOCX resume.</div>`}
        </div>

        <div class="field">
          <label for="apply-note">Why are you a fit?</label>
          <textarea id="apply-note" rows="5" oninput="App.updateApplicationDraft('${internship.id}','coverNote',this.value)">${sanitize(draft.coverNote)}</textarea>
        </div>

        <div class="form-actions apply-actions">
          <button class="btn-secondary" onclick="App.goStep(2)">Back to internships</button>
          <button class="btn-primary" onclick="App.submitApplication('${internship.id}')">Submit application</button>
        </div>
      </div>
    `;
  }
};
