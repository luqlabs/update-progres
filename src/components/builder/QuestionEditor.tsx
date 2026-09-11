import { useState } from "react";
import { AppConfig } from "@/pages/Builder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, X, Save, FileText, Clock, AlertCircle, Trash2, Copy, ListChecks, ToggleLeft, MessageSquare, CloudIcon, HelpCircle, Presentation, PenLine, ChevronUp, ChevronDown, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { ImagePicker } from "./ImagePicker";

interface QuestionEditorProps {
  config: AppConfig;
  onConfigUpdate: (config: AppConfig) => void;
}

const QUESTION_TYPES = [
  { type: "multiple-choice", label: "Multiple Choice", icon: ListChecks, description: "Select one correct answer" },
  { type: "true-false", label: "True/False", icon: ToggleLeft, description: "Binary choice question" },
  { type: "short-answer", label: "Short Answer", icon: PenLine, description: "Text input answer" },
  { type: "fill-blank", label: "Fill in Blank", icon: MessageSquare, description: "Complete the sentence" },
  { type: "poll", label: "Poll", icon: CloudIcon, description: "No correct answer" },
  { type: "word-cloud", label: "Word Cloud", icon: CloudIcon, description: "Collect word responses" },
  { type: "open-ended", label: "Open-ended", icon: HelpCircle, description: "Free text response" },
  { type: "slide", label: "Instructional Slide", icon: Presentation, description: "Display content only" },
];

const getQuestionTemplate = (type: string, timerSeconds?: number) => {
  const timer = timerSeconds || 30;
  
  switch (type) {
    case "multiple-choice":
      return { questionType: "multiple-choice" as const, q: "", options: ["Option A", "Option B", "Option C", "Option D"], answer: "", timerSeconds: timer };
    case "true-false":
      return { questionType: "true-false" as const, q: "", options: ["True", "False"], answer: "True", timerSeconds: timer };
    case "short-answer":
      return { questionType: "short-answer" as const, q: "", options: [] as string[], answer: "", acceptedAnswers: [] as string[], timerSeconds: timer };
    case "fill-blank":
      return { questionType: "fill-blank" as const, q: "Complete the sentence: ___", options: [] as string[], answer: "", acceptedAnswers: [] as string[], timerSeconds: timer };
    case "poll":
      return { questionType: "poll" as const, q: "", options: ["Option 1", "Option 2", "Option 3"], answer: "", timerSeconds: timer };
    case "word-cloud":
      return { questionType: "word-cloud" as const, q: "", options: [] as string[], answer: "", timerSeconds: timer };
    case "open-ended":
      return { questionType: "open-ended" as const, q: "", options: [] as string[], answer: "", timerSeconds: timer };
    case "slide":
      return { questionType: "slide" as const, q: "", options: [] as string[], answer: "", content: "", timerSeconds: timer };
    default:
      return { questionType: "multiple-choice" as const, q: "", options: [] as string[], answer: "", timerSeconds: timer };
  }
};

const QuestionEditor = ({ config, onConfigUpdate }: QuestionEditorProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [editedQuestion, setEditedQuestion] = useState<any>(
    config?.questions?.[0] ? { ...config.questions[0] } : null
  );
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);

  if (!config || config.type !== "quiz") {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="text-center text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No quiz to edit. Generate a quiz first.</p>
        </div>
      </div>
    );
  }

  const hasQuestions = config.questions && config.questions.length > 0;

  const handleSelectQuestion = (index: number) => {
    setSelectedIndex(index);
    setEditedQuestion({ ...config.questions![index] });
  };

  const handleSave = () => {
    if (!editedQuestion) return;

    const updatedQuestions = [...config.questions!];
    updatedQuestions[selectedIndex] = editedQuestion;

    onConfigUpdate({
      ...config,
      questions: updatedQuestions,
    });

    toast.success("Question saved");
  };

  const handleAddAcceptedAnswer = () => {
    if (!editedQuestion) return;
    
    const acceptedAnswers = editedQuestion.acceptedAnswers && editedQuestion.acceptedAnswers.length > 0
      ? editedQuestion.acceptedAnswers
      : [editedQuestion.answer];
    setEditedQuestion({
      ...editedQuestion,
      acceptedAnswers: [...acceptedAnswers, ""],
    });
  };

  const handleRemoveAcceptedAnswer = (index: number) => {
    if (!editedQuestion || !editedQuestion.acceptedAnswers) return;
    
    const acceptedAnswers = [...editedQuestion.acceptedAnswers];
    acceptedAnswers.splice(index, 1);
    
    setEditedQuestion({
      ...editedQuestion,
      acceptedAnswers: acceptedAnswers.length > 0 ? acceptedAnswers : undefined,
    });
  };

  const handleAcceptedAnswerChange = (index: number, value: string) => {
    if (!editedQuestion) return;
    
    const acceptedAnswers = [...(editedQuestion.acceptedAnswers || [editedQuestion.answer])];
    acceptedAnswers[index] = value;
    
    setEditedQuestion({
      ...editedQuestion,
      acceptedAnswers,
      answer: acceptedAnswers[0], // Primary answer is always the first accepted answer
    });
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case "multiple-choice": return "Multiple Choice";
      case "true-false": return "True/False";
      case "short-answer": return "Short Answer";
      case "fill-blank": return "Fill in the Blank";
      case "poll": return "Poll";
      case "word-cloud": return "Word Cloud";
      case "open-ended": return "Open-ended";
      case "slide": return "Instructional Slide";
      default: return type;
    }
  };

  const handleAddQuestion = (type: string) => {
    const newQuestion = getQuestionTemplate(type, config.timerSeconds);
    const updatedQuestions = [...(config.questions || []), newQuestion];
    
    onConfigUpdate({
      ...config,
      questions: updatedQuestions,
    });
    
    // Select the newly added question
    setSelectedIndex(updatedQuestions.length - 1);
    setEditedQuestion({ ...newQuestion });
    setShowAddDialog(false);
    
    toast.success(`New ${getQuestionTypeLabel(type)} added`);
  };

  const handleDeleteQuestion = (index: number) => {
    if (!config.questions || config.questions.length <= 1) {
      toast.error("Cannot delete the last question");
      setDeleteConfirmIndex(null);
      return;
    }
    
    const updatedQuestions = config.questions.filter((_, i) => i !== index);
    
    onConfigUpdate({
      ...config,
      questions: updatedQuestions,
    });
    
    // Adjust selected index
    if (selectedIndex >= updatedQuestions.length) {
      setSelectedIndex(updatedQuestions.length - 1);
      setEditedQuestion({ ...updatedQuestions[updatedQuestions.length - 1] });
    } else if (selectedIndex === index) {
      setEditedQuestion({ ...updatedQuestions[Math.min(selectedIndex, updatedQuestions.length - 1)] });
    }
    
    setDeleteConfirmIndex(null);
    toast.success("Question deleted");
  };

  const handleDuplicateQuestion = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!config.questions) return;
    
    const questionToDuplicate = { ...config.questions[index] };
    const updatedQuestions = [
      ...config.questions.slice(0, index + 1),
      questionToDuplicate,
      ...config.questions.slice(index + 1),
    ];
    
    onConfigUpdate({
      ...config,
      questions: updatedQuestions,
    });
    
    setSelectedIndex(index + 1);
    setEditedQuestion({ ...questionToDuplicate });
    toast.success("Question duplicated");
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    if (!config.questions) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Boundary checks
    if (newIndex < 0 || newIndex >= config.questions.length) return;
    
    // Swap questions
    const updatedQuestions = [...config.questions];
    [updatedQuestions[index], updatedQuestions[newIndex]] = 
      [updatedQuestions[newIndex], updatedQuestions[index]];
    
    onConfigUpdate({
      ...config,
      questions: updatedQuestions,
    });
    
    // Update selected index to follow the moved question
    setSelectedIndex(newIndex);
    setEditedQuestion({ ...updatedQuestions[newIndex] });
    
    toast.success(`Question moved ${direction}`);
  };

  // Empty state - no questions yet
  if (!hasQuestions) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="text-center text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="mb-4">No questions yet. Add your first question!</p>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Question
          </Button>
          
          <AddQuestionDialog 
            open={showAddDialog} 
            onOpenChange={setShowAddDialog} 
            onAddQuestion={handleAddQuestion} 
          />
        </div>
      </div>
    );
  }

  const getShortTypeLabel = (type: string) => {
    switch (type) {
      case "multiple-choice": return "MC";
      case "true-false": return "T/F";
      case "short-answer": return "SA";
      case "fill-blank": return "FB";
      case "poll": return "Poll";
      case "word-cloud": return "WC";
      case "open-ended": return "OE";
      case "slide": return "Slide";
      default: return type.slice(0, 2).toUpperCase();
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full w-full bg-background">
      {/* Horizontal Slider - Mobile/Tablet only */}
      <div className="md:hidden border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
          <div>
            <h2 className="text-sm font-semibold">Questions</h2>
            <p className="text-xs text-muted-foreground">{config.questions.length} total</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add
          </Button>
        </div>
        <div className="overflow-x-auto">
          <div className="flex gap-2 p-2 min-w-min">
            {config.questions!.map((question, index) => {
              const isSlide = question.questionType === 'slide';
              const itemNumber = isSlide
                ? config.questions!.slice(0, index + 1).filter(q => q.questionType === 'slide').length
                : config.questions!.slice(0, index + 1).filter(q => q.questionType !== 'slide').length;
              const label = isSlide ? `S${itemNumber}` : `Q${itemNumber}`;
              
              return (
                <button
                  key={index}
                  onClick={() => handleSelectQuestion(index)}
                  className={`flex-shrink-0 flex flex-col items-start gap-1 p-2 rounded-lg min-w-[100px] max-w-[140px] transition-colors ${
                    selectedIndex === index
                      ? "bg-primary/10 border-2 border-primary"
                      : "bg-muted/50 hover:bg-muted border-2 border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {label}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {getShortTypeLabel(question.questionType)}
                    </Badge>
                  </div>
                  <p className="text-xs line-clamp-1 text-left w-full">{question.q || "(no text)"}</p>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Mobile Action Buttons for Selected Question */}
        <div className="flex items-center justify-center gap-1 px-2 py-1.5 border-t border-border/50 bg-muted/30">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={(e) => handleMoveQuestion(selectedIndex, 'up', e)}
            disabled={selectedIndex === 0}
          >
            <ChevronUp className="w-3.5 h-3.5 mr-1" />
            Up
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={(e) => handleMoveQuestion(selectedIndex, 'down', e)}
            disabled={selectedIndex === config.questions!.length - 1}
          >
            <ChevronDown className="w-3.5 h-3.5 mr-1" />
            Down
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={(e) => handleDuplicateQuestion(selectedIndex, e)}
          >
            <Copy className="w-3.5 h-3.5 mr-1" />
            Copy
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-destructive hover:text-destructive"
            onClick={() => setDeleteConfirmIndex(selectedIndex)}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      {/* Left Panel - Question List (Desktop only) */}
      <div className="hidden md:flex w-[30%] border-r border-border flex-col">
        <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3">
          <h2 className="text-lg font-semibold">Questions</h2>
          <p className="text-sm text-muted-foreground">{config.questions.length} total</p>
        </div>
        
        <ScrollArea className="flex-1" type="always">
          <div className="p-2 pr-4">
            {config.questions!.map((question, index) => {
              const isSlide = question.questionType === 'slide';
              const itemNumber = isSlide
                ? config.questions!.slice(0, index + 1).filter(q => q.questionType === 'slide').length
                : config.questions!.slice(0, index + 1).filter(q => q.questionType !== 'slide').length;
              const label = isSlide ? `S${itemNumber}` : `Q${itemNumber}`;
              
              return (
                <div
                  key={index}
                  onClick={() => handleSelectQuestion(index)}
                  className={`group relative w-full text-left p-3 rounded-lg mb-2 transition-colors cursor-pointer ${
                    selectedIndex === index
                      ? "bg-primary/10 border-2 border-primary"
                      : "bg-muted/50 hover:bg-muted border-2 border-transparent"
                  }`}
                >
                  <div className="flex items-start gap-2 mb-1 pr-16">
                    <Badge variant="outline" className="text-xs shrink-0">
                      {label}
                    </Badge>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {getQuestionTypeLabel(question.questionType)}
                    </Badge>
                    {question.timerSeconds && question.timerSeconds > 0 && (
                      <Badge variant="success" className="text-xs shrink-0">
                        <Clock className="w-3 h-3 mr-1" />
                        {question.timerSeconds}s
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm line-clamp-2 mt-1 pr-16">{question.q}</p>
                  
                  {/* Action buttons */}
                  <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => handleMoveQuestion(index, 'up', e)}
                      disabled={index === 0}
                      title="Move up"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => handleMoveQuestion(index, 'down', e)}
                      disabled={index === config.questions!.length - 1}
                      title="Move down"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => handleDuplicateQuestion(index, e)}
                      title="Duplicate question"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmIndex(index);
                      }}
                      title="Delete question"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
        
        {/* Add Question Button */}
        <div className="p-2 border-t border-border">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Question
          </Button>
        </div>
      </div>
      
      {/* Add Question Dialog */}
      <AddQuestionDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog} 
        onAddQuestion={handleAddQuestion} 
      />
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmIndex !== null} onOpenChange={() => setDeleteConfirmIndex(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The question will be permanently removed from your quiz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteConfirmIndex !== null && handleDeleteQuestion(deleteConfirmIndex)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Right Panel - Editor */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border px-6 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              {editedQuestion?.questionType === 'slide' ? 'Edit Slide' : 'Edit Question'}{' '}
              {editedQuestion?.questionType === 'slide'
                ? config.questions.slice(0, selectedIndex + 1).filter(q => q.questionType === 'slide').length
                : config.questions.slice(0, selectedIndex + 1).filter(q => q.questionType !== 'slide').length}
            </h2>
            <p className="text-sm text-muted-foreground">
              {getQuestionTypeLabel(config.questions[selectedIndex]?.questionType || '')}
            </p>
          </div>
          <Button onClick={handleSave} size="lg">
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>

        {/* Editor Content */}
        <ScrollArea className="flex-1">
          <div className="p-6 max-w-3xl">
            <div className="space-y-6">
              {/* Question Text - Hidden for slides */}
              {editedQuestion?.questionType !== "slide" && (
                <div className="space-y-2">
                  <Label htmlFor="question-text" className="text-base font-semibold">
                    Question Text
                  </Label>
                  <Textarea
                    id="question-text"
                    value={editedQuestion?.q || ""}
                    onChange={(e) =>
                      setEditedQuestion({ ...editedQuestion, q: e.target.value })
                    }
                    className="min-h-[100px] text-base resize-none"
                    placeholder="Enter your question..."
                  />
                </div>
              )}

              {/* Question Image - Available for all question types except slides */}
              {editedQuestion?.questionType !== "slide" && (
                <div className="space-y-2">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Question Image (Optional)
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Add an image to accompany your question
                  </p>
                  <ImagePicker
                    value={editedQuestion?.image}
                    onChange={(imageUrl) =>
                      setEditedQuestion({ ...editedQuestion, image: imageUrl })
                    }
                  />
                </div>
              )}

              {/* Question Type Specific Fields */}
              {editedQuestion?.questionType === "slide" && (
                <div className="space-y-2">
                  <Label htmlFor="slide-content" className="text-base font-semibold">
                    Slide Content
                  </Label>
                  <Textarea
                    id="slide-content"
                    value={editedQuestion?.content || editedQuestion?.q || ""}
                    onChange={(e) =>
                      setEditedQuestion({ ...editedQuestion, content: e.target.value, q: e.target.value })
                    }
                    className="min-h-[200px] text-base resize-none"
                    placeholder="Enter the instructional content for this slide..."
                  />
                  <p className="text-sm text-muted-foreground">
                    This slide will display educational content without requiring an answer.
                  </p>
                </div>
              )}

              {(editedQuestion?.questionType === "fill-blank" || 
                editedQuestion?.questionType === "short-answer") && (
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Accepted Answers</Label>
                  <p className="text-sm text-muted-foreground">
                    Add multiple acceptable answers. The first one is the primary answer.
                  </p>
                  
                  {/* Fill-blank validation warning */}
                  {editedQuestion?.questionType === "fill-blank" && (() => {
                    const blankCount = (editedQuestion.q?.match(/_{3,}/g) || []).length;
                    if (blankCount > 1) {
                      return (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Multiple blanks detected ({blankCount})</AlertTitle>
                          <AlertDescription>
                            Fill-in-the-blank questions should have exactly ONE blank (___). 
                            Please use only one sequence of underscores.
                          </AlertDescription>
                        </Alert>
                      );
                    } else if (blankCount === 0) {
                      return (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>No blank detected</AlertTitle>
                          <AlertDescription>
                            Please add exactly one blank using three underscores (___) where the answer should go.
                          </AlertDescription>
                        </Alert>
                      );
                    }
                    return null;
                  })()}
                  
                  {(editedQuestion.acceptedAnswers || [editedQuestion.answer]).map(
                    (answer: string, answerIndex: number) => (
                      <div key={answerIndex} className="flex gap-2">
                        <Input
                          value={answer}
                          onChange={(e) =>
                            handleAcceptedAnswerChange(answerIndex, e.target.value)
                          }
                          placeholder={answerIndex === 0 ? "Primary answer" : "Alternative answer"}
                          className="text-base h-11"
                        />
                        {answerIndex > 0 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveAcceptedAnswer(answerIndex)}
                            className="shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    )
                  )}
                  
                  <Button
                    variant="outline"
                    onClick={handleAddAcceptedAnswer}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Alternative Answer
                  </Button>
                </div>
              )}

              {editedQuestion?.questionType === "multiple-choice" && (
                <>
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Answer Options</Label>
                    <p className="text-sm text-muted-foreground">
                      Add each answer option. You can optionally add images to each option.
                    </p>
                    
                    {(editedQuestion.options || []).map((option: string, optionIndex: number) => (
                      <div key={optionIndex} className="flex gap-2 items-center">
                        <Badge variant="outline" className="shrink-0 h-11 px-3 flex items-center">
                          {String.fromCharCode(65 + optionIndex)}
                        </Badge>
                        <Input
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...(editedQuestion.options || [])];
                            newOptions[optionIndex] = e.target.value;
                            setEditedQuestion({
                              ...editedQuestion,
                              options: newOptions,
                            });
                          }}
                          placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                          className="text-base h-11 flex-1"
                        />
                        <ImagePicker
                          compact
                          value={editedQuestion.optionImages?.[optionIndex] || null}
                          onChange={(imageUrl) => {
                            const newOptionImages = [...(editedQuestion.optionImages || Array(editedQuestion.options?.length || 4).fill(null))];
                            newOptionImages[optionIndex] = imageUrl;
                            setEditedQuestion({
                              ...editedQuestion,
                              optionImages: newOptionImages,
                            });
                          }}
                        />
                        {editedQuestion.options && editedQuestion.options.length > 2 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const newOptions = editedQuestion.options.filter((_: any, i: number) => i !== optionIndex);
                              const newOptionImages = (editedQuestion.optionImages || []).filter((_: any, i: number) => i !== optionIndex);
                              setEditedQuestion({
                                ...editedQuestion,
                                options: newOptions,
                                optionImages: newOptionImages,
                                // Clear answer if it was this option
                                answer: editedQuestion.answer === option ? "" : editedQuestion.answer,
                              });
                            }}
                            className="shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditedQuestion({
                          ...editedQuestion,
                          options: [...(editedQuestion.options || []), ""],
                          optionImages: [...(editedQuestion.optionImages || Array(editedQuestion.options?.length || 0).fill(null)), null],
                        });
                      }}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Another Option
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="correct-answer" className="text-base font-semibold">
                      Correct Answer
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Select which option is correct
                    </p>
                    <div className="flex flex-col gap-2">
                      {(editedQuestion.options || []).map((option: string, idx: number) => (
                        <Button
                          key={idx}
                          variant={editedQuestion.answer === option ? "default" : "outline"}
                          onClick={() =>
                            setEditedQuestion({ ...editedQuestion, answer: option })
                          }
                          className="justify-start h-auto py-3 px-4 text-left"
                        >
                          <Badge variant="secondary" className="shrink-0 mr-3">
                            {String.fromCharCode(65 + idx)}
                          </Badge>
                          <span className="whitespace-normal break-words">{option || "(empty)"}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {editedQuestion?.questionType === "poll" && (
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Poll Options</Label>
                  <p className="text-sm text-muted-foreground">
                    Enter one option per line. No correct answer needed for polls.
                  </p>
                  <Textarea
                    value={editedQuestion.options?.join("\n") || ""}
                    onChange={(e) =>
                      setEditedQuestion({
                        ...editedQuestion,
                        options: e.target.value.split("\n").filter(Boolean),
                      })
                    }
                    className="min-h-[120px] text-base font-mono resize-none"
                    placeholder="Option 1&#10;Option 2&#10;Option 3&#10;Option 4"
                  />
                </div>
              )}

              {editedQuestion?.questionType === "true-false" && (
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Correct Answer</Label>
                  <div className="flex gap-3">
                    <Button
                      variant={editedQuestion.answer === "True" ? "default" : "outline"}
                      onClick={() =>
                        setEditedQuestion({ ...editedQuestion, answer: "True" })
                      }
                      className="flex-1 h-12 text-base"
                    >
                      True
                    </Button>
                    <Button
                      variant={editedQuestion.answer === "False" ? "default" : "outline"}
                      onClick={() =>
                        setEditedQuestion({ ...editedQuestion, answer: "False" })
                      }
                      className="flex-1 h-12 text-base"
                    >
                      False
                    </Button>
                  </div>
                </div>
              )}

              {/* Hint */}
              {editedQuestion?.questionType !== "slide" && 
               editedQuestion?.questionType !== "poll" && 
               editedQuestion?.questionType !== "word-cloud" && 
               editedQuestion?.questionType !== "open-ended" && (
                <div className="space-y-2">
                  <Label htmlFor="hint" className="text-base font-semibold">
                    Hint <span className="text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <Input
                    id="hint"
                    value={editedQuestion?.hint || ""}
                    onChange={(e) =>
                      setEditedQuestion({ ...editedQuestion, hint: e.target.value })
                    }
                    placeholder="Provide a helpful hint for students..."
                    className="text-base h-11"
                  />
                </div>
              )}

              {/* Explanation - shown after student answers */}
              {editedQuestion?.questionType !== "slide" && 
               editedQuestion?.questionType !== "poll" && 
               editedQuestion?.questionType !== "word-cloud" && 
               editedQuestion?.questionType !== "open-ended" && (
                <div className="space-y-2">
                  <Label htmlFor="explanation" className="text-base font-semibold">
                    Explanation <span className="text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <Textarea
                    id="explanation"
                    value={editedQuestion?.explanation || ""}
                    onChange={(e) =>
                      setEditedQuestion({ ...editedQuestion, explanation: e.target.value })
                    }
                    placeholder="Explain why this is the correct answer..."
                    className="min-h-[80px] text-base resize-none"
                  />
                  <p className="text-sm text-muted-foreground">
                    This explanation will be shown to students after they answer.
                  </p>
                </div>
              )}

              {/* Timer */}
              <div className="space-y-2">
                <Label htmlFor="timer" className="text-base font-semibold">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Timer <span className="text-muted-foreground font-normal">(seconds)</span>
                </Label>
                <p className="text-sm text-muted-foreground">
                  Set time limit for this question. Leave empty or 0 to disable timer.
                </p>
                <Input
                  id="timer"
                  type="number"
                  min="0"
                  max="600"
                  value={editedQuestion?.timerSeconds || ""}
                  onChange={(e) =>
                    setEditedQuestion({ 
                      ...editedQuestion, 
                      timerSeconds: e.target.value ? parseInt(e.target.value) : undefined 
                    })
                  }
                  placeholder="e.g., 30, 60, 120..."
                  className="text-base h-11"
                />
              </div>

            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

// Add Question Dialog Component
interface AddQuestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddQuestion: (type: string) => void;
}

const AddQuestionDialog = ({ open, onOpenChange, onAddQuestion }: AddQuestionDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Question</DialogTitle>
          <DialogDescription>
            Choose the type of question you want to add
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-4">
          {QUESTION_TYPES.map((questionType) => {
            const Icon = questionType.icon;
            return (
              <button
                key={questionType.type}
                onClick={() => onAddQuestion(questionType.type)}
                className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border bg-muted/50 hover:bg-muted hover:border-primary/50 transition-colors text-center"
              >
                <Icon className="w-6 h-6 text-primary" />
                <span className="font-medium text-sm">{questionType.label}</span>
                <span className="text-xs text-muted-foreground">{questionType.description}</span>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuestionEditor;