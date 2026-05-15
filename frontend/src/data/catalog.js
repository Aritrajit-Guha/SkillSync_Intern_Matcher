export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'bn', label: 'Bangla' },
  { code: 'ta', label: 'Tamil' },
  { code: 'te', label: 'Telugu' },
];

export const THEMES = [
  { value: 'dark', label: 'Dark Neon' },
  { value: 'light', label: 'Light Glass' },
];

export const QUALIFICATIONS = [
  { value: 'class10', label: 'Class 10' },
  { value: 'class12', label: 'Class 12' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'graduation', label: 'Graduation' },
  { value: 'postgrad', label: 'Post Graduation' },
];

export const LOCATIONS = [
  'Ahmedabad, Gujarat',
  'Bengaluru, Karnataka',
  'Bhubaneswar, Odisha',
  'Chandigarh',
  'Chennai, Tamil Nadu',
  'Coimbatore, Tamil Nadu',
  'Gurugram, Haryana',
  'Hyderabad, Telangana',
  'Indore, Madhya Pradesh',
  'Jaipur, Rajasthan',
  'Kochi, Kerala',
  'Kolkata, West Bengal',
  'Lucknow, Uttar Pradesh',
  'Mumbai, Maharashtra',
  'Mysuru, Karnataka',
  'New Delhi, Delhi',
  'Noida, Uttar Pradesh',
  'Pune, Maharashtra',
  'Remote - India',
  'Thiruvananthapuram, Kerala',
];

export const SKILL_OPTIONS = [
  'python',
  'javascript',
  'typescript',
  'react',
  'nodejs',
  'django',
  'flask',
  'fastapi',
  'spring-boot',
  'express',
  'java',
  'cpp',
  'sql',
  'mongodb',
  'aws',
  'docker',
  'git',
  'linux',
  'html-css',
  'figma',
  'ui-ux',
  'machine-learning',
  'data-analysis',
  'pandas',
  'numpy',
  'tensorflow',
  'jira',
  'problem-solving',
];

export const SKILL_LABELS = {
  python: 'Python',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  react: 'React',
  nodejs: 'Node.js',
  django: 'Django',
  flask: 'Flask',
  fastapi: 'FastAPI',
  'spring-boot': 'Spring Boot',
  express: 'Express',
  java: 'Java',
  cpp: 'C++',
  sql: 'SQL',
  mongodb: 'MongoDB',
  aws: 'AWS',
  docker: 'Docker',
  git: 'Git',
  linux: 'Linux',
  'html-css': 'HTML/CSS',
  figma: 'Figma',
  'ui-ux': 'UI/UX',
  'machine-learning': 'Machine Learning',
  'data-analysis': 'Data Analysis',
  pandas: 'Pandas',
  numpy: 'NumPy',
  tensorflow: 'TensorFlow',
  jira: 'Jira',
  'problem-solving': 'Problem Solving',
};

export const NAV_ITEMS = [
  { path: '/home', label: 'Home' },
  { path: '/qualified', label: 'Internships' },
  { path: '/profile', label: 'Profile' },
];

export function labelForSkill(skill) {
  return SKILL_LABELS[skill] || skill;
}
