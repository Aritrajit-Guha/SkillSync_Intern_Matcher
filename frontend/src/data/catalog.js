export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'bn', label: 'Bangla' },
  { code: 'te', label: 'Telugu' },
  { code: 'mr', label: 'Marathi' },
  { code: 'ta', label: 'Tamil' },
];

export const SKILL_LABELS = {
  python: 'Python',
  javascript: 'JavaScript',
  react: 'React',
  nodejs: 'Node.js',
  django: 'Django',
  flask: 'Flask',
  fastapi: 'FastAPI',
  sql: 'SQL',
  mongodb: 'MongoDB',
  aws: 'AWS',
  docker: 'Docker',
  git: 'Git',
  typescript: 'TypeScript',
  'machine-learning': 'Machine Learning',
  'data-analysis': 'Data Analysis',
  pandas: 'Pandas',
  numpy: 'NumPy',
  'html-css': 'HTML/CSS',
  java: 'Java',
  cpp: 'C++',
  figma: 'Figma',
  'ui-ux': 'UI/UX',
  'spring-boot': 'Spring Boot',
  express: 'Express',
  linux: 'Linux',
  jira: 'JIRA',
  'problem-solving': 'Problem Solving',
  tensorflow: 'TensorFlow',
};

export const TRACK_LABELS = {
  engineering: 'Software Engineering',
  'web-product': 'Frontend / Full Stack',
  'cloud-devops': 'Cloud / DevOps',
  'ai-data': 'AI / Machine Learning',
  analytics: 'Data / Business Analysis',
  mobile: 'Mobile Development',
  quality: 'QA / Testing',
};

export const STATES = [
  'Remote',
  'Delhi',
  'Odisha',
  'Karnataka',
  'Haryana',
  'West Bengal',
  'Rajasthan',
  'Kerala',
  'Chandigarh',
  'Gujarat',
  'Uttar Pradesh',
  'Maharashtra',
  'Tamil Nadu',
  'Telangana',
];

export const EDUCATION = [
  { value: 'class12', label: 'Class 12' },
  { value: 'graduation', label: 'Graduation' },
  { value: 'postgrad', label: 'Post-Graduation' },
];

export const STREAMS = [
  { value: 'engineering', label: 'Engineering / Computer Science' },
  { value: 'analytics', label: 'Analytics / Data' },
  { value: 'design', label: 'Design / Product' },
  { value: 'general', label: 'General / Open to all tech roles' },
];

export const SKILL_COACH = {
  python: 'Start with Python syntax, functions, and backend problem solving. Then build one API-focused mini project.',
  javascript: 'Focus on DOM logic, async behavior, and interactive UI flows before moving into production patterns.',
  react: 'Learn components, props, state, and layout composition. Finish with a reusable dashboard project.',
  nodejs: 'Practice server basics, API routes, and data handling so you can support backend-driven products.',
  django: 'Cover models, views, forms, and authentication. End with a small CRUD app deployment.',
  flask: 'Use Flask for lightweight APIs and service logic. Build confidence with small production-like projects.',
  fastapi: 'Learn request validation, async endpoints, and clean API design for modern backend roles.',
  sql: 'Work on SELECT, JOIN, aggregation, and filtering until query writing becomes natural.',
  mongodb: 'Practice document modeling, CRUD operations, and connecting data to app features.',
  aws: 'Understand cloud basics, deployment flow, storage, and compute services used in real teams.',
  docker: 'Learn containers, image basics, and how to run repeatable local environments.',
  git: 'Improve commit hygiene, branching, pull requests, and collaboration safety.',
  typescript: 'Focus on typed interfaces, props, and safer app logic in frontend and backend work.',
  'machine-learning': 'Strengthen data preparation, evaluation, and model experimentation before larger projects.',
  'data-analysis': 'Build comfort with cleaning, trends, dashboards, and communicating insights clearly.',
  pandas: 'Practice filtering, joins, grouping, and shaping messy datasets into useful outputs.',
  numpy: 'Work on arrays, vectorized operations, and numeric thinking for technical problem solving.',
  'html-css': 'Refine semantic structure, layout systems, spacing, and responsive interface building.',
  java: 'Cover OOP basics, collections, backend fundamentals, and practical debugging patterns.',
  cpp: 'Improve fundamentals, memory awareness, and structured problem solving through focused exercises.',
  figma: 'Learn interface framing, component systems, and developer-ready design handoff.',
  'ui-ux': 'Strengthen usability thinking, interaction flows, and user-centered decision making.',
  'spring-boot': 'Practice service architecture, REST APIs, and production-style backend structure.',
  express: 'Use Express to learn routing, middleware, and lightweight service construction.',
  linux: 'Build confidence with terminal usage, file systems, and basic environment troubleshooting.',
  jira: 'Improve planning discipline, issue tracking, and team workflow visibility.',
  'problem-solving': 'Show structured thinking by breaking unclear tasks into steps, tradeoffs, and outcomes.',
  tensorflow: 'Focus on ML workflows, model training, and practical experimentation patterns.',
};

export const COURSE_TEMPLATES = {
  default: skill => ([
    { icon: 'book', title: `${skill} Foundations`, platform: 'Skill Bridge', duration: '1 week', url: '#' },
    { icon: 'lab', title: `${skill} Project Practice`, platform: 'Career Launchpad', duration: '2 weeks', url: '#' },
  ]),
  java: () => ([
    { icon: 'Java', title: 'Java Basics to OOP', platform: 'Developer Track', duration: '1 week', url: '#' },
    { icon: 'Lab', title: 'Java Mini Backend Project', platform: 'Project Lab', duration: '2 weeks', url: '#' },
  ]),
  python: () => ([
    { icon: 'Py', title: 'Python for Backend Work', platform: 'Developer Track', duration: '1 week', url: '#' },
    { icon: 'API', title: 'Build a Python API Project', platform: 'Project Lab', duration: '2 weeks', url: '#' },
  ]),
  react: () => ([
    { icon: 'UI', title: 'React UI Foundations', platform: 'Frontend Academy', duration: '1 week', url: '#' },
    { icon: 'Dash', title: 'Build a Reusable Dashboard in React', platform: 'Project Lab', duration: '2 weeks', url: '#' },
  ]),
  aws: () => ([
    { icon: 'Cloud', title: 'AWS Cloud Foundations', platform: 'AWS Educate', duration: '1 week', url: '#' },
    { icon: 'Deploy', title: 'Deploy a Sample Service on AWS', platform: 'Hands-on Lab', duration: '2 weeks', url: '#' },
  ]),
  'machine-learning': () => ([
    { icon: 'ML', title: 'Machine Learning Essentials', platform: 'AI Foundations', duration: '2 weeks', url: '#' },
    { icon: 'Model', title: 'Train and Evaluate a Small Model', platform: 'Experiment Lab', duration: '2 weeks', url: '#' },
  ]),
  'data-analysis': () => ([
    { icon: 'Data', title: 'Data Analysis Essentials', platform: 'Analytics Track', duration: '1 week', url: '#' },
    { icon: 'BI', title: 'Create an Insight Dashboard', platform: 'Project Lab', duration: '2 weeks', url: '#' },
  ]),
};

export function createCourseLibrary(internships) {
  const skills = [...new Set(internships.flatMap(item => item.skills || []))];
  return skills.reduce((acc, skillKey) => {
    const label = SKILL_LABELS[skillKey] || skillKey;
    const factory = COURSE_TEMPLATES[skillKey] || COURSE_TEMPLATES.default;
    acc[skillKey] = factory(label);
    return acc;
  }, {});
}

export function getFallbackTranslations() {
  return {
    title: 'PM Internship Scheme',
    subtitle: 'Professional internship matching with guided upskilling',
    profileHead: 'Create your candidate profile',
    profileSub: 'Add your location, education, and skills so we can show the strongest matches.',
    stateLabel: 'Preferred location',
    statePlaceholder: 'Select location',
    eduLabel: 'Education level',
    eduPlaceholder: 'Select education',
    streamLabel: 'Primary focus',
    streamPlaceholder: 'Select focus area',
    skillsLabel: 'Current skills',
    skillsHint: 'Choose the skills you already have',
    sectorLabel: 'Role tracks',
    sectorHint: 'Choose the tracks you want to target',
    findBtn: 'Search internships',
    matchHead: 'Recommended internships',
    matchSub: 'best-fit roles',
    upskillHead: 'AI roadmap coach',
    upskillSub: 'Use the chatbot roadmap to close skill gaps and unlock applications.',
    progressHead: 'Progress hub',
    progressSub: 'Track readiness, applications, and progress in one place.',
    statusEligible: 'Eligible now',
    statusNear: 'Close match',
    statusGap: 'Needs roadmap',
    gapLabel: 'Skill gaps',
    overallProgress: 'Readiness',
    backToApply: 'Back to internships',
    activityLog: 'Recent activity',
    totalXP: 'Total XP',
    level: 'Level',
    nextLevel: 'Next level',
    completeProfile: 'Complete your profile to begin tracking progress.',
    markComplete: 'Mark complete',
    noMatches: 'No internships match yet. Add more skills or adjust your target tracks.',
    steps: ['Profile', 'Matches', 'Roadmap', 'Progress', 'Apply'],
  };
}
