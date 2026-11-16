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

/** The presenter's own pathway, shown as a timeline. */
export const myPathway: PathwayStep[] = [
  { when: 'High school', title: 'Failed Computing Science', detail: 'Yes, really: the subject I now work in!' },
  { when: 'Applying to uni', title: 'Didn’t get in for Biology', detail: 'But I got a place to study Computer Science instead' },
  { when: 'University', title: 'Computer Science → Internet Technology & Software Development', detail: 'My course changed to focus on the web and building software, and I graduated' },
  { when: 'First job', title: 'Into IT', detail: 'Straight from university into my first job in IT' },
  { when: 'Today', title: 'Interim Head of Development, LRQA', detail: 'Leading LRQA’s software development teams' },
]

/** The takeaway shown under the timeline. */
export const pathwayMessage = 'A setback isn’t the end of the road. It can point you somewhere even better.'

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

// ---------------------------------------------------------------------------------------------
// Top tips
// ---------------------------------------------------------------------------------------------

export interface Tip {
  icon: string
  title: string
  text: string
}

export const tips: Tip[] = [
  { icon: '🛠️', title: 'Build something', text: 'A game in Scratch, a Python quiz, a website about your hobby: small projects teach you the most.' },
  { icon: '🤔', title: 'Stay curious', text: 'Wonder how your favourite app works? Look it up. Asking “how?” is how developers think.' },
  { icon: '🐛', title: 'Mistakes are normal', text: 'Every developer writes bugs every day. Fixing them is the job, and failing a test isn’t the end.' },
  { icon: '🧩', title: 'Practise problem-solving', text: 'Puzzles, logic games and maths problems all train the same muscles as coding.' },
  { icon: '🤝', title: 'Work as a team', text: 'Group projects, clubs and sport teach the teamwork every tech job needs.' },
  { icon: '💬', title: 'Explain things clearly', text: 'The best developers can explain a tricky idea to anyone, not just to computers.' },
  { icon: '🏢', title: 'Get a taste of work', text: 'Ask your school about work experience or a Foundation Apprenticeship in S5/S6.' },
  { icon: '📂', title: 'Keep your work', text: 'Save screenshots and code from your projects. They show employers what you can do.' },
]

// ---------------------------------------------------------------------------------------------
// How software gets made (the SDLC / DevOps loop)
// ---------------------------------------------------------------------------------------------

export interface Tool {
  name: string
  /** True if it was used to build this careers-day app: a nice talking point. */
  usedHere?: boolean
}

export interface SdlcStage {
  name: string
  icon: string
  what: string
  tools: Tool[]
}

/** In loop order: the first four make up the "build it" side, the last four the "run it" side. */
export const sdlcStages: SdlcStage[] = [
  {
    name: 'Plan',
    icon: '🗺️',
    what: 'Decide what to build next: talk to users, sketch designs and split the work into small tasks.',
    tools: [{ name: 'Jira' }, { name: 'Azure Boards' }, { name: 'Trello' }, { name: 'Figma' }, { name: 'Miro' }],
  },
  {
    name: 'Code',
    icon: '⌨️',
    what: 'Write the code, save every change with version control, and review each other’s work.',
    tools: [
      { name: 'Visual Studio Code' },
      { name: 'Visual Studio' },
      { name: 'JetBrains Rider' },
      { name: 'Git', usedHere: true },
      { name: 'GitHub', usedHere: true },
      { name: 'AI assistants (Claude, Copilot)', usedHere: true },
    ],
  },
  {
    name: 'Build',
    icon: '🧱',
    what: 'Turn the code into something that runs, automatically, every time someone makes a change.',
    tools: [
      { name: 'GitHub Actions' },
      { name: 'Azure Pipelines' },
      { name: 'dotnet CLI', usedHere: true },
      { name: 'npm', usedHere: true },
      { name: 'Vite', usedHere: true },
      { name: 'Docker', usedHere: true },
    ],
  },
  {
    name: 'Test',
    icon: '🧪',
    what: 'Check it works and is secure: thousands of automatic tests run in minutes.',
    tools: [
      { name: 'xUnit / NUnit' },
      { name: 'Jest / Vitest' },
      { name: 'Playwright', usedHere: true },
      { name: 'Postman' },
      { name: 'SonarQube' },
    ],
  },
  {
    name: 'Release',
    icon: '📦',
    what: 'Approve the change and package it up, ready to go live.',
    tools: [
      { name: 'Pull requests', usedHere: true },
      { name: 'Azure Pipelines' },
      { name: 'Octopus Deploy' },
      { name: 'Feature flags' },
    ],
  },
  {
    name: 'Deploy',
    icon: '🚀',
    what: 'Put the new version live on servers or in the cloud, often many times a day.',
    tools: [
      { name: 'Docker Compose', usedHere: true },
      { name: 'Kubernetes' },
      { name: 'Microsoft Azure' },
      { name: 'Amazon Web Services' },
      { name: 'Terraform' },
    ],
  },
  {
    name: 'Operate',
    icon: '⚙️',
    what: 'Keep it running smoothly for real users, and fix problems quickly when they happen.',
    tools: [{ name: 'Azure App Service' }, { name: 'Kubernetes' }, { name: 'ServiceNow' }, { name: 'Microsoft Teams' }],
  },
  {
    name: 'Monitor',
    icon: '📈',
    what: 'Watch how it’s used and how it performs, then feed what you learn into the next plan.',
    tools: [{ name: 'Application Insights' }, { name: 'Grafana' }, { name: 'Datadog' }, { name: 'Sentry' }],
  },
]

// ---------------------------------------------------------------------------------------------
// Languages and frameworks
// ---------------------------------------------------------------------------------------------

export interface Language {
  name: string
  use: string
  /** A one-line "Hello!" in that language. */
  hello: string
  usedHere?: boolean
}

export const languages: Language[] = [
  { name: 'C#', use: 'Business apps, websites, games', hello: 'Console.WriteLine("Hello!");', usedHere: true },
  { name: 'TypeScript', use: 'Websites and web apps', hello: 'const hi: string = "Hello!";', usedHere: true },
  { name: 'JavaScript', use: 'Anything in a web browser', hello: 'console.log("Hello!");' },
  { name: 'Python', use: 'AI, data and automation', hello: 'print("Hello!")' },
  { name: 'Java', use: 'Big business systems, Android', hello: 'System.out.println("Hello!");' },
  { name: 'SQL', use: 'Asking databases questions', hello: "SELECT 'Hello!';", usedHere: true },
  { name: 'Go', use: 'Fast cloud services', hello: 'fmt.Println("Hello!")' },
  { name: 'Rust', use: 'Super-safe, super-fast code', hello: 'println!("Hello!");' },
  { name: 'Kotlin', use: 'Android apps', hello: 'println("Hello!")' },
  { name: 'Swift', use: 'iPhone and Mac apps', hello: 'print("Hello!")' },
  { name: 'C++', use: 'Games engines, robots', hello: 'std::cout << "Hello!";' },
  { name: 'PHP', use: 'Lots of the world’s websites', hello: 'echo "Hello!";' },
]

export interface FrameworkGroup {
  title: string
  icon: string
  items: Tool[]
}

export const frameworkGroups: FrameworkGroup[] = [
  {
    title: 'Websites (front end)',
    icon: '🖥️',
    items: [{ name: 'React', usedHere: true }, { name: 'Angular' }, { name: 'Vue' }, { name: 'Svelte' }, { name: 'Next.js' }],
  },
  {
    title: 'Servers & APIs (back end)',
    icon: '🔌',
    items: [{ name: 'ASP.NET Core', usedHere: true }, { name: 'Node.js' }, { name: 'Spring Boot' }, { name: 'Django' }, { name: 'FastAPI' }],
  },
  {
    title: 'Mobile apps',
    icon: '📱',
    items: [{ name: 'React Native' }, { name: 'Flutter' }, { name: '.NET MAUI' }, { name: 'SwiftUI' }, { name: 'Jetpack Compose' }],
  },
  {
    title: 'Data & AI',
    icon: '🤖',
    items: [{ name: 'pandas' }, { name: 'PyTorch' }, { name: 'TensorFlow' }, { name: 'Jupyter' }, { name: 'Power BI' }],
  },
  {
    title: 'Databases',
    icon: '🗄️',
    items: [{ name: 'PostgreSQL', usedHere: true }, { name: 'SQL Server' }, { name: 'MySQL' }, { name: 'MongoDB' }, { name: 'Redis' }],
  },
  {
    title: 'Games',
    icon: '🎮',
    items: [{ name: 'Unity' }, { name: 'Unreal Engine' }, { name: 'Godot' }],
  },
]
