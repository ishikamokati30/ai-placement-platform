import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, ChevronRight, PlayCircle, BarChart3, Tag, Lightbulb, Play } from "lucide-react";

export default function ResumeInterview() {
  const navigate = useNavigate();
  
  // States
  const [phase, setPhase] = useState("upload"); // upload, analyzing, report, interview, feedback, completed
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  
  // ATS Report Data
  const [atsData, setAtsData] = useState(null);
  
  // Interview Data
  const [role, setRole] = useState("SDE");
  const [interviewId, setInterviewId] = useState(null);
  const [questionData, setQuestionData] = useState(null);
  const [answer, setAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Adaptive Interview State
  const [questionIndex, setQuestionIndex] = useState(1);
  const [currentDifficulty, setCurrentDifficulty] = useState("easy");
  const [feedbackData, setFeedbackData] = useState(null);
  const [finalReport, setFinalReport] = useState([]);
  
  const fileInputRef = useRef(null);

  const handleFileDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile);
      setError("");
    } else {
      setError("Please upload a valid PDF file.");
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setError("");
    } else {
      setError("Please upload a valid PDF file.");
    }
  };

  const analyzeResume = async () => {
    if (!file) {
      setError("Please upload a resume first.");
      return;
    }

    setPhase("analyzing");
    
    const formData = new FormData();
    formData.append("resume", file);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/resume/analyze`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to analyze resume");
      }
      
      setAtsData(data);
      setPhase("report");
    } catch (err) {
      setError(err.message);
      setPhase("upload");
    }
  };

  const startInterview = async () => {
    setPhase("interview");
    setQuestionData(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/interview/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          type: "resume",
          role,
          difficulty: "easy",
          resumeText: atsData.resumeText,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      setInterviewId(data.interviewId);
      setQuestionData({ question: data.question });
      setCurrentDifficulty("easy");
      setQuestionIndex(1);
    } catch (err) {
      setError(err.message);
      setPhase("report");
    }
  };

  const nextQuestion = async (difficultyToUse) => {
    setPhase("interview");
    setAnswer("");
    setFeedbackData(null);
    setQuestionData(null);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/interview/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          type: "resume",
          role,
          difficulty: difficultyToUse,
          resumeText: atsData.resumeText,
          interviewId,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      setQuestionData({ question: data.question });
      setCurrentDifficulty(difficultyToUse);
      setQuestionIndex((prev) => prev + 1);
    } catch (err) {
      setError(err.message);
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim()) return;
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/interview/answer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          interviewId,
          question: questionData.question,
          answer,
          type: "resume",
          role,
          resumeText: atsData.resumeText,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      setFeedbackData(data.feedback);
      setFinalReport((prev) => [...prev, { question: questionData.question, answer, feedback: data.feedback }]);
      setPhase("feedback");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (questionIndex >= 5) {
      setPhase("completed");
      return;
    }

    let nextDifficulty = currentDifficulty;
    if (feedbackData.difficulty_recommendation) {
      nextDifficulty = feedbackData.difficulty_recommendation;
    } else {
      // Manual fallback logic
      const score = feedbackData.score || 5;
      if (score >= 8) {
        if (currentDifficulty === "easy") nextDifficulty = "medium";
        else if (currentDifficulty === "medium") nextDifficulty = "hard";
      } else if (score < 5) {
        if (currentDifficulty === "hard") nextDifficulty = "medium";
        else if (currentDifficulty === "medium") nextDifficulty = "easy";
      }
    }
    
    // Progressive difficulty for first 3 questions if doing well
    if (questionIndex === 1 && nextDifficulty === "easy" && (feedbackData.score || 0) >= 6) {
      nextDifficulty = "medium";
    }
    if (questionIndex === 2 && nextDifficulty === "medium" && (feedbackData.score || 0) >= 6) {
      nextDifficulty = "hard";
    }

    nextQuestion(nextDifficulty);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 relative overflow-hidden flex flex-col items-center">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/40 via-gray-950 to-gray-950 -z-10" />
      
      <div className="w-full max-w-4xl flex justify-between items-center mb-8 pt-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
            Resume AI Analyzer
          </h1>
          <p className="text-gray-400 mt-1">Upload your resume for deep ATS analysis & tailored interview</p>
        </div>
        <button
          onClick={() => navigate("/dashboard")}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-sm font-medium rounded-lg transition-colors border border-gray-700"
        >
          Back to Dashboard
        </button>
      </div>

      <div className="w-full max-w-4xl bg-gray-900/60 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl relative">
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        )}

        {/* PHASE 1: UPLOAD */}
        {phase === "upload" && (
          <div className="flex flex-col items-center py-12">
            <div 
              className={`w-full max-w-xl border-2 border-dashed rounded-xl p-12 text-center transition-all ${file ? 'border-indigo-500 bg-indigo-500/5' : 'border-gray-700 hover:border-indigo-500/50 hover:bg-gray-800/50 cursor-pointer'}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => !file && fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="application/pdf" 
                className="hidden" 
              />
              
              {file ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white">{file.name}</h3>
                    <p className="text-sm text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="text-xs text-red-400 hover:text-red-300 mt-2"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center text-gray-400">
                    <Upload className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white">Upload your resume</h3>
                    <p className="text-sm text-gray-400 mt-1">Drag and drop your PDF here, or click to browse</p>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={analyzeResume}
              disabled={!file}
              className={`mt-8 px-8 py-3 rounded-xl font-medium flex items-center gap-2 transition-all ${file ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
            >
              Analyze Resume <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* ANALYZING STATE */}
        {phase === "analyzing" && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-6" />
            <h2 className="text-2xl font-bold text-white mb-2">Analyzing Resume...</h2>
            <p className="text-gray-400 text-center max-w-md">Our AI is extracting skills, projects, and evaluating your resume against ATS standards.</p>
          </div>
        )}

        {/* PHASE 1: ATS REPORT */}
        {phase === "report" && atsData && (
          <div className="animate-fade-in">
            <div className="flex flex-col md:flex-row gap-8 mb-10">
              <div className="w-full md:w-1/3 flex flex-col items-center justify-center bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
                <BarChart3 className="w-10 h-10 text-indigo-400 mb-4" />
                <h3 className="text-gray-400 font-medium mb-1">ATS Match Score</h3>
                <div className="relative w-32 h-32 flex items-center justify-center mt-2">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-gray-800"
                      strokeWidth="3"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={atsData.atsScore >= 75 ? "text-green-500" : atsData.atsScore >= 50 ? "text-yellow-500" : "text-red-500"}
                      strokeDasharray={`${atsData.atsScore}, 100`}
                      strokeWidth="3"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute text-3xl font-bold text-white">{atsData.atsScore}</div>
                </div>
              </div>
              
              <div className="w-full md:w-2/3 flex flex-col gap-6">
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-medium text-white mb-3">
                    <Tag className="w-5 h-5 text-indigo-400" /> Detected Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {atsData.skills?.map((skill, i) => (
                      <span key={i} className="px-3 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                
                {atsData.missingKeywords?.length > 0 && (
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-medium text-white mb-3">
                      <AlertCircle className="w-5 h-5 text-red-400" /> Missing Keywords
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {atsData.missingKeywords.map((kw, i) => (
                        <span key={i} className="px-3 py-1 bg-red-500/10 text-red-300 border border-red-500/20 rounded-full text-sm">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6 mb-10">
              <h3 className="flex items-center gap-2 text-lg font-medium text-white mb-4">
                <Lightbulb className="w-5 h-5 text-yellow-400" /> Suggestions for Improvement
              </h3>
              <ul className="space-y-3">
                {atsData.suggestions?.map((sugg, i) => (
                  <li key={i} className="flex gap-3 text-gray-300 text-sm">
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                    <span>{sugg}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Debug: Raw Extracted Text */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-10">
              <h3 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">Raw Extracted Text (Debug)</h3>
              <div className="max-h-40 overflow-y-auto text-xs text-gray-500 font-mono leading-relaxed bg-black/20 p-4 rounded-lg">
                {atsData.resumeText || atsData.rawText || "No text extracted"}
              </div>
            </div>

            <div className="flex flex-col items-center pt-6 border-t border-gray-800">
              <h3 className="text-xl font-bold text-white mb-2">Ready to test your skills?</h3>
              <p className="text-gray-400 text-center mb-6 max-w-lg">We will generate personalized interview questions based on the projects and skills mentioned in your resume. The difficulty will adapt to your performance.</p>
              
              <div className="flex items-center gap-4 mb-6">
                <label className="text-sm font-medium text-gray-300">Target Role:</label>
                <input 
                  type="text" 
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Frontend Engineer"
                />
              </div>

              <button
                onClick={startInterview}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
              >
                <PlayCircle className="w-5 h-5" /> Start Resume Interview
              </button>
            </div>
          </div>
        )}

        {/* PHASE 2: INTERVIEW MODE */}
        {phase === "interview" && (
          <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
              <div className="flex gap-2 items-center">
                <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-lg font-medium text-sm border border-indigo-500/30">
                  Question {questionIndex} / 5
                </span>
                <span className={`px-3 py-1 rounded-lg font-medium text-xs border ${
                  currentDifficulty === 'easy' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                  currentDifficulty === 'medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                  'bg-red-500/10 text-red-400 border-red-500/20'
                }`}>
                  {currentDifficulty.toUpperCase()}
                </span>
              </div>
            </div>

            {!questionData ? (
              <div className="py-20 flex flex-col items-center">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                <p className="text-gray-400">Generating question based on your resume...</p>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                <div className="bg-gray-800/40 p-6 rounded-xl border border-gray-700/50">
                  <h3 className="text-xl font-medium text-white leading-relaxed">{questionData.question}</h3>
                </div>

                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your detailed answer here. Focus on the STAR method..."
                  className="w-full h-48 bg-gray-900 border border-gray-700 rounded-xl p-4 text-white focus:outline-none focus:border-indigo-500 resize-none transition-colors"
                />

                <div className="flex justify-end">
                  <button
                    onClick={submitAnswer}
                    disabled={!answer.trim() || isSubmitting}
                    className={`px-8 py-3 rounded-xl font-medium flex items-center gap-2 transition-all ${answer.trim() && !isSubmitting ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Answer'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* FEEDBACK STATE */}
        {phase === "feedback" && feedbackData && (
          <div className="animate-fade-in space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">AI Evaluation</h2>
              <div className="flex items-center gap-3 bg-gray-800 px-4 py-2 rounded-xl border border-gray-700">
                <span className="text-gray-400 text-sm">Score</span>
                <span className={`text-xl font-bold ${feedbackData.score >= 8 ? 'text-green-400' : feedbackData.score >= 5 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {feedbackData.score}/10
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-5">
                <h3 className="text-green-400 font-medium mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" /> Strengths
                </h3>
                <ul className="space-y-2">
                  {feedbackData.strengths?.map((item, i) => (
                    <li key={i} className="text-gray-300 text-sm flex gap-2">
                      <span className="text-green-500">•</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5">
                <h3 className="text-red-400 font-medium mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" /> Weaknesses
                </h3>
                <ul className="space-y-2">
                  {feedbackData.weaknesses?.map((item, i) => (
                    <li key={i} className="text-gray-300 text-sm flex gap-2">
                      <span className="text-red-500">•</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-6">
              <h3 className="text-indigo-400 font-medium mb-3">Ideal Answer Structure</h3>
              <p className="text-gray-300 text-sm leading-relaxed">{feedbackData.improved_answer}</p>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-800">
              <button
                onClick={handleNext}
                className="px-8 py-3 bg-white text-gray-900 hover:bg-gray-100 font-medium rounded-xl flex items-center gap-2 shadow-lg transition-all"
              >
                {questionIndex >= 5 ? "Complete Interview" : "Next Question"} <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* COMPLETED STATE */}
        {phase === "completed" && (
          <div className="animate-fade-in flex flex-col items-center py-10">
            <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Interview Completed!</h2>
            <p className="text-gray-400 text-center max-w-md mb-10">You've successfully completed the resume-based adaptive interview.</p>
            
            <div className="w-full grid grid-cols-2 gap-4 mb-8">
               <div className="bg-gray-800/50 border border-gray-700/50 p-6 rounded-xl flex flex-col items-center">
                 <span className="text-gray-400 text-sm mb-1">ATS Score</span>
                 <span className="text-3xl font-bold text-indigo-400">{atsData?.atsScore || 0}</span>
               </div>
               <div className="bg-gray-800/50 border border-gray-700/50 p-6 rounded-xl flex flex-col items-center">
                 <span className="text-gray-400 text-sm mb-1">Avg Interview Score</span>
                 <span className="text-3xl font-bold text-green-400">
                   {(finalReport.reduce((acc, curr) => acc + (curr.feedback?.score || 0), 0) / Math.max(finalReport.length, 1)).toFixed(1)}/10
                 </span>
               </div>
            </div>

            <div className="w-full flex gap-4">
               <button
                 onClick={() => navigate("/dashboard")}
                 className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl transition-colors"
               >
                 Return to Dashboard
               </button>
               <button
                 onClick={() => {
                   setPhase("upload");
                   setFile(null);
                   setAtsData(null);
                 }}
                 className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/20 transition-colors"
               >
                 Analyze Another Resume
               </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
