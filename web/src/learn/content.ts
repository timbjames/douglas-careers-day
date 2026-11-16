/**
 * Everything shown on the "Careers in tech" info pages. Edit the text here; the pages pick it up.
 * Keep it short: these are read on a big screen from across the stand.
 */

// ---------------------------------------------------------------------------------------------
// Myths vs truths
// ---------------------------------------------------------------------------------------------

export interface Myth {
  myth: string
  truth: string
}

export const myths: Myth[] = [
  {
    myth: 'You have to be a maths genius',
    truth: 'Logical thinking and problem-solving matter far more. Most day-to-day code uses everyday maths.',
  },
  {
    myth: 'You need a computer science degree',
    truth: "A degree is just one route. Apprenticeships, college and teaching yourself all lead to great tech jobs.",
  },
  {
    myth: 'Coders work alone in a dark room',
    truth: 'Tech is a team sport: daily stand-ups, pair programming, and lots of talking to the people who use what you build.',
  },
  {
    myth: "It's too late if you didn't start coding at 8",
    truth: 'Loads of developers wrote their first line of code at college, at university or in their first job.',
  },
  {
    myth: 'Tech jobs are for boys',
    truth: 'Tech needs all kinds of people. Teams with different backgrounds build better products for everyone.',
  },
  {
    myth: 'There’s no creativity in tech',
    truth: 'Designing an app, a game or a website people love to use is creative work, every single day.',
  },
  {
    myth: 'AI will write all the code, so there’ll be no jobs',
    truth: 'AI is a power tool for developers. People still decide what to build, check it works and keep it secure.',
  },
  {
    myth: 'All hackers are criminals',
    truth: 'Ethical hackers are paid to break in, legally, to find weaknesses before criminals do. LRQA has a whole cybersecurity team doing it.',
  },
]

// ---------------------------------------------------------------------------------------------
// Pathways
// ---------------------------------------------------------------------------------------------

export interface Route {
  name: string
  /** Short stages, left to right. */
  steps: string[]
  note: string
}

/** The main routes into a tech career in Scotland. */
export const routes: Route[] = [
  {
    name: 'University',
    steps: ['Highers / Advanced Highers', '4-year honours degree', 'Graduate job'],
    note: 'Computing, software engineering, cyber security, data science…',
  },
  {
    name: 'Graduate Apprenticeship',
    steps: ['Highers', 'Get a job and a degree', 'Qualified, with experience'],
    note: 'Earn a salary while you study: about 80% at work, 20% at university.',
  },
  {
    name: 'Modern Apprenticeship',
    steps: ['National 5s / Highers', 'Apprentice job (SCQF 6)', 'Technical apprenticeship (SCQF 8)'],
    note: 'Paid training on the job in software, cyber, data, cloud or IT support.',
  },
  {
    name: 'College',
    steps: ['National 5s / Highers', 'HNC / HND', 'Job, or 2nd/3rd year of university'],
    note: 'Hands-on courses, and a stepping stone into university if you want.',
  },
  {
    name: 'Teach yourself',
    steps: ['Build things for fun', 'Online courses & a portfolio', 'Junior role'],
    note: 'Show what you’ve made: projects can matter as much as certificates.',
  },
]

export interface PathwayStep {
  when: string
  title: string
  detail: string
  /** True until it's been filled in with the real story; shown with a dashed outline as a reminder. */
  placeholder?: boolean
}

/**
 * The presenter's own pathway, shown as a timeline. Replace the placeholder steps with the real
 * story (and delete `placeholder: true`).
 */
export const myPathway: PathwayStep[] = [
  { when: 'School', title: 'Subjects I took', detail: 'Which subjects, and what I enjoyed', placeholder: true },
  { when: 'After school', title: 'College / university / job', detail: 'What I did next, and why', placeholder: true },
  { when: 'First tech job', title: 'Where I started', detail: 'My first role and what I learned', placeholder: true },
  { when: 'Along the way', title: 'Moving up', detail: 'Roles, skills and moments that shaped my career', placeholder: true },
  { when: 'Today', title: 'Interim Head of Development, LRQA', detail: 'Leading LRQA’s software development teams' },
]

// ---------------------------------------------------------------------------------------------
// Qualifications and training
// ---------------------------------------------------------------------------------------------

export interface QualificationLevel {
  scqf: string
  items: string[]
}

/** Qualifications by SCQF level, lowest first. */
export const qualificationLevels: QualificationLevel[] = [
  { scqf: '5', items: ['National 5s'] },
  { scqf: '6', items: ['Highers', 'Foundation Apprenticeship (in S5/S6)', 'Modern Apprenticeship'] },
  { scqf: '7', items: ['Advanced Highers', 'HNC'] },
  { scqf: '8', items: ['HND', 'Technical Apprenticeship'] },
  { scqf: '9–10', items: ['Degree', 'Graduate Apprenticeship'] },
]

export const schoolOption = {
  title: 'Start now, at school',
  text: 'The Foundation Apprenticeship in IT: Software Development can be one of your S5/S6 subjects. It’s the same level as a Higher and includes a work placement.',
}

export const keepLearning: { title: string; text: string }[] = [
  { title: 'Certifications', text: 'Cloud (Microsoft Azure, AWS) and cyber security certificates prove your skills.' },
  { title: 'Learning on the job', text: 'Mentors, code reviews and new projects: you never stop learning in tech.' },
  { title: 'Your own projects', text: 'Websites, games and apps you build yourself show what you can do.' },
]

export const softSkills = ['Problem solving', 'Teamwork', 'Communication', 'Curiosity', 'Resilience']

// ---------------------------------------------------------------------------------------------
// School subjects
// ---------------------------------------------------------------------------------------------

export interface Subject {
  name: string
  /** 1–3: how directly it helps in software development. */
  relevance: 1 | 2 | 3
  why: string
}

export const subjects: Subject[] = [
  { name: 'Computing Science', relevance: 3, why: 'Programming, databases, web design and how computers really work.' },
  { name: 'Maths', relevance: 3, why: 'Logic, problem-solving and working with data.' },
  { name: 'English', relevance: 2, why: 'Writing clearly: explaining ideas to your team and to clients.' },
  { name: 'Physics', relevance: 2, why: 'Breaking big problems into small ones, like an engineer.' },
  { name: 'Business', relevance: 1, why: 'Understanding the companies and people that software is built for.' },
  { name: 'Graphic Communication / Art', relevance: 1, why: 'Designing screens that look great and are easy to use.' },
  { name: 'Modern Languages', relevance: 1, why: 'Tech companies like LRQA work with people all over the world.' },
]

export const subjectsTip = 'No single subject decides your future. Pick what you enjoy and are good at: curiosity counts most.'
