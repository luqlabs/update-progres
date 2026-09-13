import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Section, SectionHeading } from "./Section";
import faqBgImage from "@/assets/landing/features-bottom-banner.jpg";

const faqs = [
  {
    question: "What is Quizabl?",
    answer: "Quizabl is an AI-powered platform that helps professional educators turn lecture notes, articles, and training documents into interactive assessments in minutes. Create quizzes, flashcards, and matching games without the manual build time."
  },
  {
    question: "Who is Quizabl for?",
    answer: "Quizabl is built for university lecturers, professors, and assistant lecturers or TAs who use formative and pre lecture checks to find out what their cohort already knows before teaching it."
  },
  {
    question: "What can I create?",
    answer: "You can create: Quizzes with 9 question types (multiple choice, true/false, short answer, fill in the blank, polls, word clouds, open ended, instructional slides, and matching). Flashcards with spaced repetition and self rating. Matching Games with drag and drop gameplay, timers, and scores."
  },
  {
    question: "How does the AI work?",
    answer: "Upload your content (lecture notes, PDFs, or URLs) and describe what you need. For example: 'Generate a comprehension check from this PDF' or 'Build vocabulary flashcards from this article.' The AI analyzes your material and builds the activity instantly."
  },
  {
    question: "Can I edit the activities myself?",
    answer: "Yes. Use the three panel builder: Preview (real time view), Edit (full control over questions, answers, hints, timers, cards, or pairs), and Analytics (see how participants are performing). Or simply chat to make changes like 'Make it harder' or 'Add a hint.'"
  },
  {
    question: "How do participants access activities?",
    answer: "Share a link or QR code. Participants enter a display name and start immediately. No accounts, passwords, or LMS integration required."
  },
  {
    question: "What analytics are available?",
    answer: "Quizzes: plays, average score, completion rate, common mistakes, score distribution, and individual sessions. Flashcards: cards reviewed, self ratings, average time per card. Matching Games: average matches, challenging pairs, completion time."
  },
  {
    question: "How much does Quizabl cost?",
    answer: "Quizabl is a simple subscription. Free gives you 5 AI credits a month and up to 10 activities. Basic is $9.99/month with 50 credits and up to 50 activities. Pro is $14.99/month with 150 credits and unlimited activities. Yearly billing is available at a discount, and you can cancel anytime."
  },
  {
    question: "What is the difference between Basic and Pro?",
    answer: "Both plans include every feature: advanced analytics, hidden Quizabl branding, and priority support. The difference is capacity: Basic gives you 50 AI credits and up to 50 activities per month, while Pro gives you 150 credits and unlimited activities for lecturers teaching several cohorts."
  },
  {
    question: "What is an AI credit?",
    answer: "One credit covers one AI action like generating an activity from your material or making an AI edit through chat. Manual editing, sharing, participant plays, and analytics never cost credits. Credits reset at the start of each billing month."
  },
  {
    question: "How many free credits do I get?",
    answer: "The Free plan includes 5 AI credits every month and up to 10 activities, with unlimited participants and unlimited plays. No card required. Upgrade only when you need more capacity."
  },

  {
    question: "Does Quizabl save my work automatically?",
    answer: "Yes. Auto save is built in, with undo/redo for configuration changes."
  },
  {
    question: "How is Quizabl different from Kahoot or Quizizz?",
    answer: "Chat to Edit: Refine activities through conversation instead of clicking through menus. Content Analysis: Upload your actual lecture notes or training docs, not just topics. No Accounts Needed: Participants join via link or QR instantly. Deeper Analytics: Session level details, common mistakes, and time on task insights."
  },
  {
    question: "What makes Quizabl special?",
    answer: "Professional grade speed. Upload your content, chat to refine, and share in minutes. No manual question building, no LMS headaches, and actionable analytics to improve your materials."
  }
];

export const FAQSection = () => {
  return (
    <section className="relative py-24 md:py-32 px-6 sm:px-8 overflow-hidden min-h-[80vh] flex items-center justify-center">
      {/* Background Image Setup */}
      <div className="absolute inset-0 z-0">
        <img 
          src={faqBgImage} 
          alt="FAQ Background" 
          className="w-full h-full object-cover opacity-60"
        />
        {/* Soft gradient overlay to blend image */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-slate-100/40 to-slate-200/50 mix-blend-multiply" />
      </div>

      {/* Floating Card for readability */}
      <div className="relative z-10 w-full max-w-4xl bg-white/95 backdrop-blur-sm shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] rounded-[2.5rem] p-8 md:p-14 border border-white">
        <div className="text-center mb-12">
          <span className="text-sm font-bold tracking-wider text-slate-500 mb-6 block">
            FAQ
          </span>
          <h3 className="font-display italic text-3xl md:text-5xl text-slate-900 mb-4 leading-[1.15]">
            Frequently asked questions
          </h3>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`} 
              className="border-b border-slate-200/60 px-2"
            >
              <AccordionTrigger className="text-left font-bold text-[16px] md:text-[17px] text-slate-800 hover:text-indigo-600 hover:no-underline transition-colors py-6">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-[15px] md:text-[16px] text-slate-600 leading-relaxed pb-6 pr-8 font-medium">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQSection;

