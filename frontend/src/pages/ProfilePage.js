/**
 * ProfilePage — Renders and manages the profile-building step.
 */
const ProfilePage = {
  render(state) {
    const sec = document.getElementById('sec-profile');
    if (!sec) return;
    sec.innerHTML = ProfileForm.render(state.profile, state.translations);
  }
};