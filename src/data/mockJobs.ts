export type MockJob = {
  id: string
  title: string
  company: string
  location: string
  workMode: string
  employmentType: string
  summary: string
}

export const mockJobs: MockJob[] = [
  {
    id: 'job-1',
    title: 'Senior Web Developer',
    company: 'BluePeak Labs',
    location: 'Bengaluru',
    workMode: 'Hybrid',
    employmentType: 'Full-time',
    summary:
      'Build modern web applications, lead frontend architecture, and support full-stack delivery.',
  },
  {
    id: 'job-2',
    title: 'Training Coordinator',
    company: 'Stanford University',
    location: 'Stanford, CA',
    workMode: 'On-site',
    employmentType: 'Contract',
    summary:
      'Create digital learning content, technical training videos, and stakeholder-ready learning programs.',
  },
  {
    id: 'job-3',
    title: 'Python Backend Developer',
    company: 'HireMail Technologies',
    location: 'Remote',
    workMode: 'Remote',
    employmentType: 'Full-time',
    summary:
      'Work on APIs, scoring services, data processing pipelines, and backend integrations.',
  },
  {
    id: 'job-4',
    title: 'Instructional Design Specialist',
    company: 'Westbridge Learning Lab',
    location: 'Chennai',
    workMode: 'Hybrid',
    employmentType: 'Full-time',
    summary:
      'Design eLearning modules, simulations, and digital learning assets for technical teams.',
  },
]
