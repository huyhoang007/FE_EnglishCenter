/**
 * Exam Mock Data
 * -----------------------------------------------------------
 * Mock đề thi IELTS Reading Academic - Diagnostic Test 01
 * dùng cho Gold Flow #4.
 */

import type { Exam } from '@/shared/types';

export const MOCK_EXAM: Exam = {
  id: 'exam_ielts_mock_01',
  slug: 'ielts-mock-01',
  title: 'IELTS Reading Academic - Diagnostic Test 01',
  skill: 'READING',
  certificate: 'IELTS',
  durationSeconds: 60 * 60, // 60 phút
  totalQuestions: 10,
  passages: [
    {
      id: 'p1',
      title: 'The Evolution of Urban Transportation',
      paragraphs: [
        {
          heading: 'A. From horse-drawn carriages to electric vehicles',
          text: 'For more than a century, urban transportation has been at the forefront of technological change. The first major shift occurred in the late 19th century when horse-drawn carriages were gradually replaced by electric streetcars. By 1902, nearly every major city in Europe and North America had at least one electrified tram line, which revolutionised daily commuting and reduced the dependency on animal-powered transport.',
        },
        {
          heading: 'B. The rise of the private automobile',
          text: 'The widespread adoption of the private car in the 1950s triggered a dramatic transformation of city planning. Urban landscapes were redesigned to accommodate motor vehicles, with vast networks of highways, multi-storey car parks, and suburban developments. While this era brought unprecedented personal mobility, it also introduced problems such as air pollution, traffic congestion, and a decline in public transport usage.',
        },
        {
          heading: 'C. The modern revival of public transport',
          text: 'In recent decades, cities have begun to rebalance their transport strategies. Investment has returned to public transport, with light rail, bus rapid transit, and dedicated cycle lanes being prioritised. Cities such as Copenhagen and Amsterdam have demonstrated that integrated mobility systems can dramatically reduce carbon emissions while improving quality of life for residents.',
        },
        {
          heading: 'D. Looking ahead: autonomous and shared mobility',
          text: 'The next frontier in urban transportation is widely expected to involve autonomous vehicles and shared mobility platforms. Analysts predict that by 2040, a significant proportion of urban journeys will be completed in self-driving electric pods summoned via smartphone applications. However, the transition will require substantial investment in infrastructure, regulatory frameworks, and public acceptance.',
        },
      ],
    },
  ],
  questions: [
    {
      id: 'q1',
      order: 1,
      type: 'MULTIPLE_CHOICE',
      prompt:
        'When did the first major shift in urban transportation occur?',
      options: [
        { key: 'A', text: 'In the early 18th century' },
        { key: 'B', text: 'In the late 19th century' },
        { key: 'C', text: 'In the mid-20th century' },
        { key: 'D', text: 'In the early 21st century' },
      ],
      correctAnswer: 'B',
      explanation: 'Paragraph A: "The first major shift occurred in the late 19th century..."',
    },
    {
      id: 'q2',
      order: 2,
      type: 'MULTIPLE_CHOICE',
      prompt:
        'What problem did the rise of private cars in the 1950s NOT cause?',
      options: [
        { key: 'A', text: 'Air pollution' },
        { key: 'B', text: 'Traffic congestion' },
        { key: 'C', text: 'Decline in public transport usage' },
        { key: 'D', text: 'Reduction of personal mobility' },
      ],
      correctAnswer: 'D',
      explanation:
        'Paragraph B: "this era brought unprecedented personal mobility" — it actually INCREASED personal mobility.',
    },
    {
      id: 'q3',
      order: 3,
      type: 'TRUE_FALSE_NOTGIVEN',
      prompt:
        'By 1902, all major cities worldwide had electrified tram lines.',
      options: [
        { key: 'A', text: 'True' },
        { key: 'B', text: 'False' },
        { key: 'C', text: 'Not Given' },
      ],
      correctAnswer: 'B',
      explanation:
        'Paragraph A says "nearly every major city in Europe and North America" — not all cities worldwide.',
    },
    {
      id: 'q4',
      order: 4,
      type: 'TRUE_FALSE_NOTGIVEN',
      prompt:
        'Copenhagen and Amsterdam have reduced carbon emissions by integrating mobility systems.',
      correctAnswer: 'A',
      explanation: 'Paragraph C: "Cities such as Copenhagen and Amsterdam... can dramatically reduce carbon emissions..."',
    },
    {
      id: 'q5',
      order: 5,
      type: 'FILL_BLANK',
      prompt:
        'According to the passage, by 2040, a significant proportion of urban journeys will be completed in __________ electric pods.',
      correctAnswer: 'self-driving',
      explanation: 'Paragraph D: "self-driving electric pods summoned via smartphone applications".',
    },
    {
      id: 'q6',
      order: 6,
      type: 'FILL_BLANK',
      prompt:
        'The transition to autonomous mobility will require investment in infrastructure, regulatory frameworks, and __________ acceptance.',
      correctAnswer: 'public',
      explanation: 'Paragraph D: "...infrastructure, regulatory frameworks, and public acceptance".',
    },
    {
      id: 'q7',
      order: 7,
      type: 'MULTIPLE_CHOICE',
      prompt: 'What is the main idea of paragraph C?',
      options: [
        { key: 'A', text: 'Private cars are still dominant in modern cities' },
        { key: 'B', text: 'Cities are reinvesting in sustainable transport' },
        { key: 'C', text: 'Highways are the future of urban mobility' },
        { key: 'D', text: 'Copenhagen and Amsterdam are the largest cities' },
      ],
      correctAnswer: 'B',
      explanation: 'Paragraph C discusses "the modern revival of public transport" and sustainable investments.',
    },
    {
      id: 'q8',
      order: 8,
      type: 'MULTIPLE_CHOICE',
      prompt: 'The word "unprecedented" in paragraph B is closest in meaning to:',
      options: [
        { key: 'A', text: 'limited' },
        { key: 'B', text: 'unheard of before' },
        { key: 'C', text: 'predictable' },
        { key: 'D', text: 'expensive' },
      ],
      correctAnswer: 'B',
      explanation: '"Unprecedented" = chưa từng có tiền lệ = "unheard of before".',
    },
    {
      id: 'q9',
      order: 9,
      type: 'TRUE_FALSE_NOTGIVEN',
      prompt:
        'The passage suggests that autonomous vehicles will completely replace public transport by 2040.',
      correctAnswer: 'C',
      explanation:
        'The passage does not state that AVs will replace public transport — only that they will be a significant proportion of journeys.',
    },
    {
      id: 'q10',
      order: 10,
      type: 'FILL_BLANK',
      prompt:
        'Investment has returned to public transport, with light rail, bus rapid transit, and dedicated __________ lanes being prioritised.',
      correctAnswer: 'cycle',
      explanation: 'Paragraph C: "...dedicated cycle lanes being prioritised".',
    },
  ],
};
