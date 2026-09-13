const fs = require('fs');
const path = require('path');

const replacements = [
  {
    file: 'src/pages/Index.tsx',
    replaces: [
      { from: 'Quizabl — Pre-lecture Checks', to: 'Quizabl | Pre-lecture Checks' },
      { from: 'struggling with — and what to explain', to: 'struggling with and what to explain' },
      { from: 'Start your first check — free', to: 'Start your first check free' },
      { from: 'No student logins, no setup — one link works on any device.', to: 'No student logins, no setup. One link works on any device.' }
    ]
  },
  {
    file: 'src/components/dashboard/CohortSignal.tsx',
    replaces: [
      { from: 'Share a link — student responses show up here', to: 'Share a link. Student responses show up here' }
    ]
  },
  {
    file: 'src/components/landing/FAQSection.tsx',
    replaces: [
      { from: 'Quizabl is built for university lecturers — professors, lecturers and assistant lecturers or TAs — who use', to: 'Quizabl is built for university lecturers, professors, and assistant lecturers or TAs who use' },
      { from: 'Both plans include every feature — advanced analytics, hidden Quizabl branding, and priority support.', to: 'Both plans include every feature: advanced analytics, hidden Quizabl branding, and priority support.' },
      { from: 'One credit covers one AI action — generating an activity from your material or making an AI edit through chat.', to: 'One credit covers one AI action like generating an activity from your material or making an AI edit through chat.' },
      { from: 'No card required — upgrade only when you need more capacity.', to: 'No card required. Upgrade only when you need more capacity.' }
    ]
  },
  {
    file: 'src/components/landing/CadmusHero.tsx',
    replaces: [
      { from: 'struggling with — and what to explain', to: 'struggling with and what to explain' },
      { from: 'Start your first check — free', to: 'Start your first check free' }
    ]
  },
  {
    file: 'src/components/landing/CadmusFeatures.tsx',
    replaces: [
      { from: 'No student logins, no setup — one link works on any device.', to: 'No student logins, no setup. One link works on any device.' }
    ]
  },
  {
    file: 'src/components/landing/AnimatedDemo.tsx',
    replaces: [
      { from: 'Done — 5 questions, mixed difficulty.', to: 'Done. 5 questions, mixed difficulty.' },
      { from: 'prevalence & epidemiology</span> — start', to: 'prevalence & epidemiology</span>. Start' }
    ]
  },
  {
    file: 'src/components/landing/PricingPreview.tsx',
    replaces: [
      { from: 'Free forever — no card required', to: 'Free forever, no card required' },
      { from: 'Cancel anytime — no notice period', to: 'Cancel anytime, no notice period' }
    ]
  },
  {
    file: 'src/components/landing/Footer.tsx',
    replaces: [
      { from: 'pre-lecture and formative quizzes for university lecturers — built by chatting, shared with one link.', to: 'pre-lecture and formative quizzes for university lecturers, built by chatting, shared with one link.' }
    ]
  },
  {
    file: 'src/components/landing/FeaturesSection.tsx',
    replaces: [
      { from: 'Students join instantly — no sign-ups, no lost class time.', to: 'Students join instantly with no sign-ups and no lost class time.' },
      { from: 'Everything you need to find — and close — the gap', to: 'Everything you need to find and close the gap' },
      { from: 'From pre-lecture activity to live cohort insights — on one simple subscription, with no student logins.', to: 'From pre-lecture activity to live cohort insights on one simple subscription, with no student logins.' }
    ]
  },
  {
    file: 'src/components/builder/ChatInterface.tsx',
    replaces: [
      { from: 'You decide — pick what fits best', to: 'You decide, pick what fits best' },
      { from: 'what you\\'re thinking — whether it\\'s a quiz,', to: 'what you\\'re thinking, whether it\\'s a quiz,' },
      { from: 'Sorry — I didn\\'t catch that.', to: 'Sorry, I didn\\'t catch that.' }
    ]
  },
  {
    file: 'src/components/landing/ProductTabs.tsx',
    replaces: [
      { from: 'short answer and open-ended — mixed exactly how you want it.', to: 'short answer and open-ended, mixed exactly how you want it.' },
      { from: 'change the correct answer, add explanations — the editor is always yours.', to: 'change the correct answer, add explanations. The editor is always yours.' }
    ]
  },
  {
    file: 'src/components/landing/TargetAudienceSection.tsx',
    replaces: [
      { from: 'Catch shaky prerequisites — algebra, units, notation — before they compound', to: 'Catch shaky prerequisites like algebra, units, and notation before they compound' }
    ]
  }
];

for (const rep of replacements) {
  const filePath = path.join(__dirname, rep.file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    for (const r of rep.replaces) {
      content = content.replaceAll(r.from, r.to);
    }
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${rep.file}`);
  }
}
