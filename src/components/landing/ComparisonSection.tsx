import { Badge } from "@/components/ui/badge";
const comparisonData = [{
  feature: "Editing Method",
  quizabl: "Conversational (chat to edit) + full manual control",
  questionwell: "Manual forms",
  kahoot: "Manual clicking"
}, {
  feature: "Output Variety",
  quizabl: "Quizzes + flashcards + matching games",
  questionwell: "Questions only (export)",
  kahoot: "Quiz only"
}, {
  feature: "Student Access",
  quizabl: "One link, no student login or app",
  questionwell: "N/A (export tool)",
  kahoot: "App / account often needed"
}, {
  feature: "Source Material",
  quizabl: "Lecture slides, PDFs, Word docs, URLs",
  questionwell: "Text / URL",
  kahoot: "Limited AI"
}, {
  feature: "Best Suited For",
  quizabl: "Pre-lecture activities & formative checks",
  questionwell: "Question drafting for an LMS",
  kahoot: "Live classroom games",
  isPricingRow: true
}];
export const ComparisonSection = () => {
  return <section className="container mx-auto px-4 py-20">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h3 className="font-display italic text-3xl md:text-5xl text-foreground mb-4 max-w-2xl mx-auto">
            An honest comparison
          </h3>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Where Quizabl fits next to the tools most lecturers already know.
          </p>
        </div>


        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden bg-background">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="px-6 py-5 text-left text-sm font-semibold text-muted-foreground">
                      Feature
                    </th>
                    <th className="px-6 py-5 text-left text-sm font-semibold">
                      <div className="flex items-center gap-2">
                        
                        <span className="font-semibold text-foreground">Quizabl</span>
                        <Badge variant="outline" className="text-[10px] font-medium border-foreground text-foreground px-2 py-0.5">
                          Best Value
                        </Badge>
                      </div>
                    </th>
                    <th className="px-6 py-5 text-left text-sm font-medium text-muted-foreground/70">
                      QuestionWell
                    </th>
                    <th className="px-6 py-5 text-left text-sm font-medium text-muted-foreground/70">
                      Kahoot!
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((item, index) => <tr key={item.feature} className={index < comparisonData.length - 1 ? "border-b border-border/30" : ""}>
                      <td className="px-6 py-6 text-left text-sm font-medium text-muted-foreground">
                        {item.feature}
                      </td>
                      <td className="px-6 py-6 text-left">
                        <span className={`text-sm font-bold text-foreground ${item.isPricingRow ? 'text-base' : ''}`}>
                          {item.quizabl}
                        </span>
                      </td>
                      <td className="px-6 py-6 text-left">
                        <span className="text-sm text-muted-foreground/60">
                          {item.questionwell}
                        </span>
                      </td>
                      <td className="px-6 py-6 text-left">
                        <span className="text-sm text-muted-foreground/60">
                          {item.kahoot}
                        </span>
                      </td>
                    </tr>)}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>;
};