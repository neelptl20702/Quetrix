import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Trash2, Copy, MoveUp, MoveDown, FileText, 
  Image as ImageIcon, Settings, Save, Printer, Upload, 
  CheckSquare, Type, List, LayoutTemplate, PieChart,
  Sparkles, Wand2, Loader2, Bot, Layers, ArrowRight, ArrowLeft,
  AlertCircle, School, Clock, Calendar, Eye, Lock, BookOpen, BrainCircuit, X,
  ImagePlus, RefreshCw, TrendingUp, TrendingDown, Eraser, Sigma, Table2, History, AlertTriangle, Download,
  Maximize2, Minimize2, ToggleLeft, ToggleRight, HelpCircle
} from 'lucide-react';

// --- Constants ---
const EXAM_TYPES = ["MST", "CET 1", "CET 2", "REMEDIAL", "EXTERNAL", "EXTERNAL REMEDIAL"];
const CO_OPTIONS = ["CO1", "CO2", "CO3", "CO4", "CO5", "CO6"];
const BLOOM_OPTIONS = ["R", "U", "AP", "AN", "E", "C"];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
const DURATION_OPTIONS = [
  { label: "1 Hr", minutes: 60 },
  { label: "1.5 Hrs", minutes: 90 },
  { label: "2 Hrs", minutes: 120 },
  { label: "2.5 Hrs", minutes: 150 },
  { label: "3 Hrs", minutes: 180 },
];

const DIFFICULTY_LEVELS = ["Easy", "Medium", "Hard"];

// ITM Brand Colors
const THEME = {
  primary: "bg-red-800",
  primaryHover: "hover:bg-red-900",
  text: "text-red-800",
  border: "border-red-200",
  light: "bg-red-50"
};

// --- Helper Functions ---
const formatTime12Hour = (timeStr: string) => {
  if (!timeStr) return "";
  const [hours, minutes] = timeStr.split(':');
  const h = parseInt(hours, 10);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${minutes} ${suffix}`;
};

const addMinutesToTime = (timeStr: string, minutesToAdd: number) => {
  if (!timeStr) return "";
  const [hours, mins] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours);
  date.setMinutes(mins + minutesToAdd);
  
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
};

const calculateDurationText = (start: string, end: string) => {
  if (!start || !end) return "";
  
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  
  let diffM = (endH * 60 + endM) - (startH * 60 + startM);
  if (diffM < 0) diffM += 24 * 60; 
  
  const hours = Math.floor(diffM / 60);
  const minutes = diffM % 60;
  
  let durationStr = "";
  if (hours > 0) durationStr += `${hours} Hr `;
  if (minutes > 0) durationStr += `${minutes} Mins`;
  if (hours === 0 && minutes === 0) return "";
  
  return durationStr.trim();
};

const getCurrentAcademicYear = () => {
  const year = new Date().getFullYear();
  const month = new Date().getMonth(); 
  return month < 5 ? `${year-1}-${year}` : `${year}-${year+1}`;
};

// --- Local Storage Helpers ---
const loadFromStorage = (key: string, defaultValue: any) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch (e) {
    console.error("Failed to load from storage", e);
    return defaultValue;
  }
};

// --- API Helper ---
const apiKey = process.env.API_KEY; 

const callGemini = async (prompt: string) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{ parts: [{ text: prompt }] }]
  };

  const delays = [1000, 2000, 4000];
  for (let i = 0; i < delays.length + 1; i++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } catch (err) {
      if (i === delays.length) throw err;
      await new Promise(res => setTimeout(res, delays[i]));
    }
  }
};

// --- KaTeX Math Component ---
const KatexRenderer = ({ content, block = false }: { content: string, block?: boolean }) => {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    // @ts-ignore
    if (window.katex && containerRef.current) {
      try {
        // @ts-ignore
        window.katex.render(content, containerRef.current, {
          throwOnError: false,
          displayMode: block,
          output: 'html', 
        });
      } catch (e) {
        console.error("KaTeX render error:", e);
        if (containerRef.current) containerRef.current.innerText = content;
      }
    }
  }, [content, block]);

  return <span ref={containerRef} />;
};

const MixedTextRenderer = ({ text }: { text: string }) => {
  if (!text) return null;
  const parts = text.split(/(\$\$[^$]+\$\$|\$[^$]+\$)/g);

  return (
    <span>
      {parts.map((part, index) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          return <KatexRenderer key={index} content={part.slice(2, -2)} block={true} />;
        } else if (part.startsWith('$') && part.endsWith('$')) {
          return <KatexRenderer key={index} content={part.slice(1, -1)} block={false} />;
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
};

// --- Material 3 Loading Overlay ---
const LoadingOverlay = ({ message }: { message: string }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
    <div className="bg-[#fffbff] text-[#201a1b] p-8 rounded-[28px] shadow-2xl flex flex-col items-center gap-6 min-w-[320px] transform transition-all scale-100">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-red-100 rounded-full"></div>
        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-t-transparent border-red-800 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-red-800 animate-pulse" />
        </div>
      </div>
      <div className="text-center space-y-1">
        <h3 className="text-xl font-bold text-gray-800 tracking-tight">AI is Working</h3>
        <p className="text-sm text-gray-500 font-medium">{message || "Generating content..."}</p>
      </div>
    </div>
  </div>
);

// --- Restore Modal ---
const RestoreModal = ({ onRestore, onDiscard }: { onRestore: () => void, onDiscard: () => void }) => (
  <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm">
    <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full border border-gray-200">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="p-4 bg-blue-50 rounded-full text-blue-600">
          <History className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800">Previous Session Found</h3>
          <p className="text-sm text-gray-500 mt-2">
            We found unsaved data from a previous session. Would you like to restore it or start fresh?
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 w-full mt-2">
          <button 
            onClick={onDiscard}
            className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
          >
            Start Fresh
          </button>
          <button 
            onClick={onRestore}
            className={`px-4 py-2.5 rounded-lg ${THEME.primary} ${THEME.primaryHover} text-white font-bold transition-colors shadow-lg`}
          >
            Restore Data
          </button>
        </div>
      </div>
    </div>
  </div>
);

// --- Low Context Warning Modal ---
const LowContextModal = ({ onAddContext, onProceed }: { onAddContext: () => void, onProceed: () => void }) => (
  <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm">
    <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full border-l-8 border-orange-500">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-orange-100 rounded-full text-orange-600 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">Knowledge Bank is Empty</h3>
            <p className="text-sm text-gray-600 mt-2">
              Generating questions without study material relies on general knowledge. For accurate, syllabus-specific questions, please add material to the Knowledge Bank.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3 w-full mt-2">
          <button 
            onClick={onAddContext}
            className={`w-full px-4 py-3 rounded-lg ${THEME.primary} text-white font-bold flex items-center justify-center gap-2`}
          >
            <BookOpen className="w-4 h-4"/> Add Material (Recommended)
          </button>
          <button 
            onClick={onProceed}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-600 font-bold hover:bg-gray-50"
          >
            Generate Anyway (Generic)
          </button>
        </div>
      </div>
    </div>
  </div>
);

// --- Main Component ---
export default function QuestionPaperApp() {
  // --- Inject KaTeX ---
  useEffect(() => {
    if (!document.getElementById('katex-css')) {
      const link = document.createElement("link");
      link.id = 'katex-css';
      link.href = "https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css";
      link.rel = "stylesheet";
      document.head.appendChild(link);

      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js";
      script.defer = true;
      document.head.appendChild(script);
    }
  }, []);

  // --- Default State ---
  const defaultMeta = {
    universityName: "ITM (SLS) BARODA UNIVERSITY", 
    schoolName: "",
    branch: "",
    semester: "",
    specializations: "", 
    academicYear: getCurrentAcademicYear(),
    examType: "",
    courseCode: "",
    courseName: "",
    examDate: "",
    startTime: "",
    endTime: "",
    instructions: "· All questions are mandatory. There are no external options.\n· Make suitable assumptions, wherever necessary, and state them clearly.\n· Use of Non-Programmable Calculator is allowed/Not allowed.\n· Figures to the right indicate maximum marks.",
  };

  const defaultSections = [
    { id: 1, title: "Q1", desc: "Multiple Choice Questions", type: "mcq", qCount: 6, attemptCount: 6, marksPerQ: 1, questions: [] as any[] },
    { id: 2, title: "Q2", desc: "Short Notes / Answer", type: "subjective", qCount: 4, attemptCount: 2, marksPerQ: 3, questions: [] as any[] }
  ];

  // --- State Initialization ---
  const [meta, setMeta] = useState(defaultMeta);
  const [sections, setSections] = useState(defaultSections);
  const [knowledgeContext, setKnowledgeContext] = useState("");
  
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [showLowContextWarning, setShowLowContextWarning] = useState(false);
  const [pendingMagicSectionId, setPendingMagicSectionId] = useState<number | null>(null);

  const [validationError, setValidationError] = useState<string | null>(null);
  const [calculatedDuration, setCalculatedDuration] = useState("");
  const [activeTab, setActiveTab] = useState('blueprint'); 
  const [activeSectionId, setActiveSectionId] = useState(1); 
  
  // --- Preview Settings State ---
  const [previewSettings, setPreviewSettings] = useState({
    showCO: true,
    showBloom: true,
    showWatermark: false,
    fontSize: 'normal' // 'compact' or 'normal'
  });

  // --- AI & UI State ---
  const [aiLoadingState, setAiLoadingState] = useState<{ loading: boolean, sectionId: number | null }>({ loading: false, sectionId: null });
  const [aiDifficulty, setAiDifficulty] = useState("Medium");
  const [improvingState, setImprovingState] = useState<{ sectionId: number, qIndex: number, loading: boolean } | null>(null);
  const [showKnowledgeModal, setShowKnowledgeModal] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null); 

  // --- Restore Logic ---
  useEffect(() => {
    const hasData = localStorage.getItem("qpf_meta");
    if (hasData) {
      setShowRestorePrompt(true);
    }
  }, []);

  const handleRestore = () => {
    setMeta(loadFromStorage("qpf_meta", defaultMeta));
    setSections(loadFromStorage("qpf_sections", defaultSections));
    setKnowledgeContext(loadFromStorage("qpf_knowledge", ""));
    setShowRestorePrompt(false);
  };

  const handleDiscard = () => {
    localStorage.clear();
    setShowRestorePrompt(false);
  };

  // --- Effects: Auto-Save ---
  useEffect(() => { 
    if (!showRestorePrompt) localStorage.setItem("qpf_meta", JSON.stringify(meta)); 
  }, [meta, showRestorePrompt]);
  
  useEffect(() => { 
    if (!showRestorePrompt) localStorage.setItem("qpf_sections", JSON.stringify(sections)); 
  }, [sections, showRestorePrompt]);
  
  useEffect(() => { 
    if (!showRestorePrompt) localStorage.setItem("qpf_knowledge", JSON.stringify(knowledgeContext)); 
  }, [knowledgeContext, showRestorePrompt]);

  useEffect(() => {
    if (meta.startTime && meta.endTime) {
      setCalculatedDuration(calculateDurationText(meta.startTime, meta.endTime));
    } else {
      setCalculatedDuration("");
    }
  }, [meta.startTime, meta.endTime]);

  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    if (openMenuId) window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

  // --- Helpers ---
  const totalPaperMarks = sections.reduce((acc, s) => acc + (s.attemptCount * s.marksPerQ), 0);
  const examCategory = totalPaperMarks <= 30 ? "INTERNAL / REMEDIAL" : "EXTERNAL / FINAL";
  const categoryColor = totalPaperMarks <= 30 ? "bg-red-50 text-red-800 border-red-200" : "bg-purple-100 text-purple-700 border-purple-200";

  const getDurationString = () => {
    if (!meta.startTime || !meta.endTime) return "";
    return `${formatTime12Hour(meta.startTime)} to ${formatTime12Hour(meta.endTime)}`;
  };

  const clearStorage = () => {
    if(confirm("Are you sure? This will reset all your current progress.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  // --- Handlers: PDF Download Logic ---
  const handlePrint = () => {
    // Generate safe filename
    const branch = meta.branch || "EXAM";
    const sem = meta.semester ? `SEM${meta.semester}` : "";
    const course = meta.courseName ? meta.courseName.replace(/[^a-zA-Z0-9]/g, '_') : "PAPER";
    const type = meta.examType ? meta.examType.replace(/ /g, '_') : "TEST";
    
    const filename = `${branch}_${sem}_${course}_${type}`;
    
    // Change page title for print dialog
    const originalTitle = document.title;
    document.title = filename;
    
    window.print();
    
    // Restore title
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  const getExportFilename = (extension: string) => {
    const branch = meta.branch || "EXAM";
    const sem = meta.semester ? `SEM${meta.semester}` : "";
    const course = meta.courseName ? meta.courseName.replace(/[^a-zA-Z0-9]/g, '_') : "PAPER";
    const type = meta.examType ? meta.examType.replace(/ /g, '_') : "TEST";
    return `${branch}_${sem}_${course}_${type}.${extension}`;
  };

  const escapeRtf = (text: string) => {
    return (text || "")
      .replace(/\\/g, "\\\\")
      .replace(/{/g, "\\{")
      .replace(/}/g, "\\}")
      .replace(/\n/g, "\\line ")
      .replace(/[\u0080-\uFFFF]/g, (ch) => `\\u${ch.charCodeAt(0)}?`);
  };

  const normalizeQuestionText = (text: string) => {
    return (text || "")
      .replace(/\$\$([^$]+)\$\$/g, "$1")
      .replace(/\$([^$]+)\$/g, "$1");
  };

  const handleWordCompatibleDownload = () => {
    const lines: string[] = [];
    const push = (value: string = "") => lines.push(value);

    push("{\\rtf1\\ansi\\deff0");
    push("{\\fonttbl{\\f0 Times New Roman;}{\\f1 Calibri;}}");
    push("\\paperw11906\\paperh16838\\margl1134\\margr1134\\margt850\\margb850");
    push("\\f0\\fs24");

    push(`\\qc\\b ${escapeRtf(meta.universityName)}\\b0\\par`);
    push(`\\qc\\b ${escapeRtf(meta.schoolName || "SCHOOL OF ...")}\\b0\\par`);
    push(`\\qc ${escapeRtf(`${meta.examType} Examination ${meta.academicYear}`.trim())}\\par`);
    push("\\par");

    push(`\\pard\\ql\\b Branch:\\b0 ${escapeRtf(meta.branch)}\\tab \\b Semester:\\b0 ${escapeRtf(String(meta.semester || ""))}\\par`);
    push(`\\b Course:\\b0 ${escapeRtf(meta.courseName)}\\tab \\b Code:\\b0 ${escapeRtf(meta.courseCode)}\\par`);
    push(`\\b Date:\\b0 ${escapeRtf(meta.examDate)}\\tab \\b Time:\\b0 ${escapeRtf(getDurationString())}\\par`);
    push(`\\b Duration:\\b0 ${escapeRtf(calculatedDuration)}\\tab \\b Max Marks:\\b0 ${totalPaperMarks}\\par`);
    push("\\par");

    push("\\b Instructions:\\b0\\par");
    push(`${escapeRtf(meta.instructions)}\\par`);
    push("\\par");

    sections.forEach((section, sIdx) => {
      const attemptText = section.attemptCount < section.qCount ? ` (Attempt any ${section.attemptCount})` : "";
      push(`\\b Q.${sIdx + 1} ${escapeRtf(section.title)} - ${escapeRtf(section.desc)}${escapeRtf(attemptText)} [${section.attemptCount * section.marksPerQ} Marks]\\b0\\par`);

      section.questions.forEach((q, qIdx) => {
        const questionText = normalizeQuestionText(q.text || "_________________________________");
        push(`${qIdx + 1}. ${escapeRtf(questionText)}  [${section.marksPerQ}]\\par`);

        if (section.type === 'mcq' && Array.isArray(q.options)) {
          q.options.forEach((opt: string, oIdx: number) => {
            const optChar = String.fromCharCode(97 + oIdx);
            push(`\\li360 (${optChar}) ${escapeRtf(normalizeQuestionText(opt || ""))}\\li0\\par`);
          });
        }

        if (previewSettings.showCO || previewSettings.showBloom) {
          const tags: string[] = [];
          if (previewSettings.showCO && q.co) tags.push(q.co);
          if (previewSettings.showBloom && q.bloom) tags.push(q.bloom);
          if (tags.length) push(`\\i ${escapeRtf(tags.join(" | "))}\\i0\\par`);
        }

        push("\\par");
      });
    });

    push("}");

    const blob = new Blob([lines.join("\n")], { type: "application/rtf;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = getExportFilename("rtf");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const addSection = () => {
    const newId = Math.max(0, ...sections.map(s => s.id)) + 1;
    const newSection = {
      id: newId,
      title: `Q${sections.length + 1}`, 
      desc: "Subjective Questions",
      type: "subjective",
      qCount: 3,
      attemptCount: 3,
      marksPerQ: 5,
      questions: [] as any[]
    };
    setSections([...sections, newSection]);
    if (activeTab === 'builder') setActiveSectionId(newId);
  };

  const updateSection = (id: number, field: string, value: any) => {
    setSections(prev => prev.map(s => {
      if (s.id !== id) return s;
      const updated = { ...s, [field]: value };
      if (updated.type === 'mcq') {
        updated.attemptCount = parseInt(updated.qCount as any);
      } else {
        if (field === 'qCount' && parseInt(value) < s.attemptCount) {
          updated.attemptCount = parseInt(value);
        }
      }
      return updated;
    }));
  };

  const deleteSection = (id: number) => {
    if (sections.length > 1) {
      const newSections = sections.filter(s => s.id !== id);
      setSections(newSections);
      if (activeSectionId === id) {
        setActiveSectionId(newSections[0].id);
      }
    }
  };

  const initializeBuilder = () => {
    const requiredFields = [
      'schoolName', 'branch', 'semester', 'academicYear', 
      'examType', 'courseCode', 'courseName', 'examDate', 'startTime', 'endTime', 'specializations'
    ];
    
    // @ts-ignore
    const missing = requiredFields.filter(field => !meta[field]);

    if (missing.length > 0) {
      setValidationError("Please fill in all required fields marked with *");
      window.scrollTo(0,0);
      return;
    }
    setValidationError(null);

    const newSections = sections.map(section => {
      let currentQs = [...section.questions];
      if (currentQs.length < section.qCount) {
        const needed = section.qCount - currentQs.length;
        for (let i = 0; i < needed; i++) {
          currentQs.push({
            id: Date.now() + Math.random(),
            text: "",
            options: section.type === 'mcq' ? ['Option A', 'Option B', 'Option C', 'Option D'] : [],
            image: null,
            co: 'CO1',
            bloom: 'R'
          });
        }
      } else if (currentQs.length > section.qCount) {
        currentQs = currentQs.slice(0, section.qCount);
      }
      return { ...section, questions: currentQs };
    });
    
    setSections(newSections);
    setActiveTab('builder');
    if (!newSections.find(s => s.id === activeSectionId)) {
        setActiveSectionId(newSections[0].id);
    }
  };

  const updateQuestion = (sectionId: number, qIndex: number, field: string, value: any) => {
    setSections(prev => prev.map(s => {
      if (s.id !== sectionId) return s;
      const newQs = [...s.questions];
      newQs[qIndex] = { ...newQs[qIndex], [field]: value };
      return { ...s, questions: newQs };
    }));
  };

  const handleImageUpload = (sectionId: number, qIndex: number, e: any) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => updateQuestion(sectionId, qIndex, 'image', reader.result);
      reader.readAsDataURL(file);
    }
  };

  // --- AI Handlers ---
  const handleImproveQuestion = async (sectionId: number, qIndex: number, action: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;
    const question = section.questions[qIndex];
    if (!question.text) return;

    setImprovingState({ sectionId, qIndex, loading: true });

    try {
      let prompt = "";
      const baseInstruction = `Context: ${meta.courseName} (${meta.branch}). Difficulty Level adjustment: ${action}. `;
      
      if (section.type === 'mcq') {
        let adjustment = "";
        if (action === 'rephrase') adjustment = "Rephrase the question and options for better clarity and academic tone.";
        if (action === 'easier') adjustment = "Simplify the question concept and make options more distinct.";
        if (action === 'harder') adjustment = "Make the question more analytical/application-based and options closer/trickier.";

        prompt = `${baseInstruction} ${adjustment}
        Original Question: "${question.text}"
        Original Options: ${JSON.stringify(question.options)}
        
        IMPORTANT: Use LaTeX for math. Escape backslashes like "\\\\frac".
        Constraint: Return strictly valid JSON format ONLY. No markdown.
        Format: { "text": "New Question Text", "options": ["Opt A", "Opt B", "Opt C", "Opt D"] }`;
      } else {
        let adjustment = "";
        if (action === 'rephrase') adjustment = "Rephrase for better academic clarity.";
        if (action === 'easier') adjustment = "Simplify the concept being asked.";
        if (action === 'harder') adjustment = "Make it more analytical or detailed.";

        prompt = `${baseInstruction} ${adjustment}
        Original Question: "${question.text}"
        
        Constraint: Return ONLY the new question text string. Do NOT provide the answer. No quotes. Do NOT use markdown bold (**).`;
      }

      const responseText = await callGemini(prompt);
      
      if (section.type === 'mcq') {
        const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(cleanJson);
        updateQuestion(sectionId, qIndex, 'text', data.text);
        if (data.options && Array.isArray(data.options)) {
          updateQuestion(sectionId, qIndex, 'options', data.options);
        }
      } else {
        const cleanText = responseText.replace(/^"|"$/g, '').replace(/\*\*/g, '').trim();
        updateQuestion(sectionId, qIndex, 'text', cleanText);
      }

    } catch (e) {
      console.error(e);
      alert("AI improvement failed. Please try again.");
    } finally {
      setImprovingState(null);
    }
  };

  const initiateMagicFill = (sectionId: number) => {
    if (!knowledgeContext) {
      setPendingMagicSectionId(sectionId);
      setShowLowContextWarning(true);
    } else {
      executeMagicFill(sectionId, true);
    }
  };

  const executeMagicFill = async (sectionId: number | null, useKnowledge: boolean) => {
    if (sectionId === null) return;
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    setAiLoadingState({ loading: true, sectionId });
    setShowLowContextWarning(false);

    try {
      let contextInstruction = "";
      if (useKnowledge && knowledgeContext) {
        contextInstruction = `SOURCE MATERIAL: "${knowledgeContext.substring(0, 3000)}..." (Use this material primarily).`;
      } else {
        contextInstruction = `NO SPECIFIC SYLLABUS PROVIDED. Generate relevant questions based on standard academic curriculum for COURSE: "${meta.courseName}", BRANCH: "${meta.branch}", SEMESTER: "${meta.semester}", SPECIALIZATION: "${meta.specializations}".`;
      }
      
      let complexityInstruction = "";
      if (section.marksPerQ <= 2) complexityInstruction = "Questions should be brief, definitions, or direct concepts suitable for 1-2 marks.";
      else if (section.marksPerQ <= 5) complexityInstruction = "Questions should be analytical or require short explanations suitable for 3-5 marks.";
      else complexityInstruction = "Questions should be detailed, descriptive, or scenario-based suitable for long answers (6+ marks).";

      const prompt = `
        You are an expert professor preparing a ${meta.examType} exam paper for ${meta.branch}.
        Task: Generate ${section.qCount} ${section.type} questions.
        Difficulty: ${aiDifficulty}
        ${contextInstruction}
        Marking Constraint: Each question is worth ${section.marksPerQ} marks. ${complexityInstruction}
        
        IMPORTANT: Use LaTeX for ANY mathematical notation. Wrap inline math in single $ signs (e.g. $E=mc^2$) and display math in double $$ signs.
        
        CRITICAL FOR JSON: You MUST escape all backslashes in LaTeX commands. For example, output "\\\\frac{a}{b}" instead of "\\frac{a}{b}". This is required for valid JSON.
        
        Strictly return ONLY a valid JSON array of objects. No markdown.
        Schema: { "text": "Question text with LaTeX", "options": ["Option with $LaTeX$", "Option B", "C", "D"] (Only if type is mcq), "bloom": "R", "co": "CO1" }
      `;

      let rawText = await callGemini(prompt);
      rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const generatedData = JSON.parse(rawText);

      setSections(prev => prev.map(s => {
        if (s.id !== sectionId) return s;
        const newQs = s.questions.map((q, idx) => {
          if (generatedData[idx]) {
            return {
              ...q,
              text: generatedData[idx].text,
              options: s.type === 'mcq' ? (generatedData[idx].options || q.options) : [],
              bloom: generatedData[idx].bloom || 'R',
              co: generatedData[idx].co || 'CO1'
            };
          }
          return q;
        });
        return { ...s, questions: newQs };
      }));

    } catch (e) {
      console.error(e);
      alert("AI Generation failed. Try again.");
    } finally {
      setAiLoadingState({ loading: false, sectionId: null });
      setPendingMagicSectionId(null);
    }
  };

  const handleDurationSelect = (minutes: number) => {
    if (!meta.startTime) {
      alert("Please select a Start Time first.");
      return;
    }
    const newEndTime = addMinutesToTime(meta.startTime, minutes);
    setMeta(prev => ({ ...prev, endTime: newEndTime }));
  };

  // --- Renderers ---

  const renderBlueprintTab = () => (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      
      {/* Reset Button */}
      <div className="flex justify-end">
        <button 
          onClick={clearStorage}
          className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 underline"
        >
          <Eraser className="w-3 h-3"/> Reset All Data
        </button>
      </div>

      {validationError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
           <AlertCircle className="w-5 h-5"/>
           {validationError}
        </div>
      )}

      {/* Header Config */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className={`text-xl font-bold ${THEME.text} mb-6 flex items-center gap-2 border-b pb-2`}>
          <Settings className="w-5 h-5"/> Exam Metadata
        </h2>
        
        <div className="grid grid-cols-12 gap-4">
          {/* Row 1 */}
          <div className="col-span-12 md:col-span-6">
            <label className="block text-xs font-semibold text-gray-500 mb-1">University Name</label>
            <div className="w-full border p-2 rounded bg-gray-50 text-gray-600 font-medium">
              {meta.universityName}
            </div>
          </div>
          <div className="col-span-12 md:col-span-6">
            <label className="block text-xs font-semibold text-gray-500 mb-1">School / Dept Name <span className="text-red-500">*</span></label>
            <input 
              className="w-full border p-2 rounded focus:ring-2 ring-red-100 outline-none"
              value={meta.schoolName}
              placeholder="e.g. SOCSET"
              onChange={e => setMeta({...meta, schoolName: e.target.value})}
            />
          </div>

          {/* Row 2 */}
          <div className="col-span-12 md:col-span-4">
            <label className="block text-xs font-semibold text-gray-500 mb-1">Course Name <span className="text-red-500">*</span></label>
            <input 
              placeholder="e.g. Data Structures" 
              className="w-full border p-2 rounded focus:ring-2 ring-red-100 outline-none"
              value={meta.courseName}
              onChange={e => setMeta({...meta, courseName: e.target.value})}
            />
          </div>
          <div className="col-span-12 md:col-span-4">
             <label className="block text-xs font-semibold text-gray-500 mb-1">Specializations <span className="text-red-500">*</span></label>
             <input
                className="w-full border p-2 rounded focus:ring-2 ring-red-100 outline-none"
                value={meta.specializations}
                placeholder="e.g. CSE, IT, AI"
                onChange={e => setMeta({...meta, specializations: e.target.value})}
             />
          </div>
          <div className="col-span-12 md:col-span-4">
            <label className="block text-xs font-semibold text-gray-500 mb-1">Course Code <span className="text-red-500">*</span></label>
            <input 
              placeholder="e.g. CS101" 
              className="w-full border p-2 rounded focus:ring-2 ring-red-100 outline-none"
              value={meta.courseCode}
              onChange={e => setMeta({...meta, courseCode: e.target.value})}
            />
          </div>

          {/* Row 3 - Unified Grid for Details */}
          <div className="col-span-12 md:col-span-3">
            <label className="block text-xs font-semibold text-gray-500 mb-1">Branch <span className="text-red-500">*</span></label>
            <input 
              className="w-full border p-2 rounded focus:ring-2 ring-red-100 outline-none"
              value={meta.branch}
              placeholder="e.g. BTECH"
              onChange={e => setMeta({...meta, branch: e.target.value})}
            />
          </div>
          <div className="col-span-12 md:col-span-3">
            <label className="block text-xs font-semibold text-gray-500 mb-1">Semester <span className="text-red-500">*</span></label>
            <select 
              className="w-full border p-2 rounded bg-white outline-none"
              value={meta.semester}
              onChange={e => setMeta({...meta, semester: e.target.value})}
            >
              <option value="">Select Sem...</option>
              {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="col-span-12 md:col-span-3">
            <label className="block text-xs font-semibold text-gray-500 mb-1">Exam Type <span className="text-red-500">*</span></label>
             <select 
              className="w-full border p-2 rounded bg-white outline-none"
              value={meta.examType}
              onChange={e => setMeta({...meta, examType: e.target.value})}
            >
              <option value="">Select Type...</option>
              {EXAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="col-span-12 md:col-span-3">
            <label className="block text-xs font-semibold text-gray-500 mb-1">Academic Year <span className="text-red-500">*</span></label>
            <input 
              placeholder="e.g. 2025-26"
              className="w-full border p-2 rounded outline-none"
              value={meta.academicYear}
              onChange={e => setMeta({...meta, academicYear: e.target.value})}
            />
          </div>

          {/* Row 4 - Time & Date */}
          <div className="col-span-12 md:col-span-4">
            <label className="block text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
              <Calendar className="w-4 h-4 text-red-600"/> Exam Date <span className="text-red-500">*</span>
            </label>
            <input 
              type="date"
              className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all shadow-sm"
              value={meta.examDate}
              onChange={e => setMeta({...meta, examDate: e.target.value})}
            />
          </div>

          <div className="col-span-12 md:col-span-4">
            <label className="block text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
              <Clock className="w-4 h-4 text-red-600"/> Start Time <span className="text-red-500">*</span>
            </label>
            <input 
              type="time"
              className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all shadow-sm"
              value={meta.startTime}
              onChange={e => setMeta({...meta, startTime: e.target.value})}
            />
            <div className="flex flex-wrap gap-2 mt-3">
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => handleDurationSelect(opt.minutes)}
                  className="px-2 py-1 text-[10px] font-medium bg-red-50 text-red-800 border border-red-200 rounded-full hover:bg-red-100 transition-colors shadow-sm"
                >
                  + {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="col-span-12 md:col-span-4">
            <label className="block text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
              <Clock className="w-4 h-4 text-red-800"/> End Time <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-col gap-2">
              <input 
                type="time"
                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all shadow-sm"
                value={meta.endTime}
                onChange={e => setMeta({...meta, endTime: e.target.value})}
              />
              {calculatedDuration && (
                <div className="text-center text-xs font-bold text-red-700 bg-red-50 border border-red-100 py-1.5 rounded">
                  Total: {calculatedDuration}
                </div>
              )}
            </div>
          </div>
          
          <div className="col-span-12 mt-2">
            <label className="block text-xs font-semibold text-gray-500 mb-1">Instructions</label>
            <textarea 
              rows={4}
              className="w-full border p-2 rounded outline-none font-mono text-sm"
              value={meta.instructions}
              onChange={e => setMeta({...meta, instructions: e.target.value})}
            />
          </div>
        </div>
      </div>

      {/* Structure Designer */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-red-50">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className={`text-2xl font-bold ${THEME.text} flex items-center gap-2`}>
              <Layers className="w-6 h-6"/> Paper Structure
            </h2>
            <div className="flex gap-4 mt-2 items-center">
              <p className="text-gray-500 text-sm">Total Marks: <span className="font-bold text-red-800 text-lg">{totalPaperMarks}</span></p>
              <span className={`text-xs font-bold px-3 py-1 rounded border ${categoryColor}`}>
                {examCategory}
              </span>
            </div>
          </div>
          <button 
            onClick={initializeBuilder}
            className={`${THEME.primary} ${THEME.primaryHover} text-white px-6 py-2 rounded-lg shadow-md flex items-center gap-2 font-bold transition-colors`}
          >
            Go to Content Builder <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {sections.map((section, idx) => (
            <div key={section.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-white transition-all hover:shadow-md relative group">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-3">
                  <label className="text-xs font-semibold text-gray-500">Section Title</label>
                  <input 
                    value={section.title}
                    onChange={(e) => updateSection(section.id, 'title', e.target.value)}
                    className="w-full p-2 border rounded font-medium focus:border-red-500 outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-gray-500">Type</label>
                  <select 
                    value={section.type}
                    onChange={(e) => updateSection(section.id, 'type', e.target.value)}
                    className="w-full p-2 border rounded bg-white focus:border-red-500 outline-none"
                  >
                    <option value="mcq">MCQ</option>
                    <option value="subjective">Subjective</option>
                    <option value="fillblank">Fill Blank</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-gray-500">Total Qs</label>
                  <input 
                    type="number" min="1"
                    value={section.qCount}
                    onChange={(e) => updateSection(section.id, 'qCount', e.target.value)}
                    className="w-full p-2 border rounded focus:border-red-500 outline-none"
                  />
                </div>
                <div className="md:col-span-2 relative">
                  <label className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                    To Attempt {section.type === 'mcq' && <Lock className="w-3 h-3 text-red-500"/>}
                  </label>
                  <input 
                    type="number" min="1" max={section.qCount}
                    value={section.attemptCount}
                    onChange={(e) => updateSection(section.id, 'attemptCount', e.target.value)}
                    disabled={section.type === 'mcq'}
                    className={`w-full p-2 border rounded focus:border-red-500 outline-none ${
                      section.type === 'mcq' 
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                        : section.attemptCount < section.qCount 
                          ? 'border-orange-400 bg-orange-50' 
                          : ''
                    }`}
                  />
                  {section.type === 'mcq' ? (
                    <span className="text-[10px] text-gray-500 absolute -bottom-4 left-0">Strict (Attempt All)</span>
                  ) : section.attemptCount < section.qCount && (
                    <span className="text-[10px] text-orange-600 absolute -bottom-4 left-0">Internal Choice Active</span>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-gray-500">Marks Each</label>
                  <input 
                    type="number" min="1"
                    value={section.marksPerQ}
                    onChange={(e) => updateSection(section.id, 'marksPerQ', e.target.value)}
                    className="w-full p-2 border rounded focus:border-red-500 outline-none"
                  />
                </div>
                <div className="md:col-span-1 flex justify-center">
                   <button 
                    onClick={() => deleteSection(section.id)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    disabled={sections.length === 1}
                   >
                     <Trash2 className="w-5 h-5"/>
                   </button>
                </div>
              </div>
            </div>
          ))}

          <button 
            onClick={addSection}
            className="w-full py-3 border-2 border-dashed border-red-300 rounded-lg text-red-500 hover:border-red-500 hover:text-red-700 transition-all flex justify-center gap-2 font-medium"
          >
            <Plus className="w-5 h-5"/> Add Another Section
          </button>
        </div>
      </div>
    </div>
  );

  const renderKnowledgeModal = () => (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-red-100">
        <div className="bg-gradient-to-r from-red-800 to-red-900 p-6 flex justify-between items-center">
           <div>
             <h3 className="text-xl font-bold text-white flex items-center gap-2">
               <BookOpen className="w-6 h-6" /> Knowledge Bank
             </h3>
             <p className="text-red-100 text-sm mt-1">Paste your syllabus or study material here.</p>
           </div>
           <button onClick={() => setShowKnowledgeModal(false)} className="text-white hover:bg-red-700 p-1 rounded">
             <X className="w-6 h-6"/>
           </button>
        </div>
        
        <div className="p-6">
           <textarea 
             className="w-full h-96 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none font-mono text-sm leading-relaxed"
             placeholder="Paste chapters, notes, or topics here..."
             value={knowledgeContext}
             onChange={(e) => setKnowledgeContext(e.target.value)}
           />
        </div>

        <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
          <button 
            onClick={() => setShowKnowledgeModal(false)}
            className="px-6 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900 flex items-center gap-2"
          >
            Save Material
          </button>
        </div>
      </div>
    </div>
  );

  const renderBuilderTab = () => {
    const activeSection = sections.find(s => s.id === activeSectionId);
    
    if (!activeSection) {
        return (
            <div className="text-center p-10">
                <p className="text-gray-500">No active section selected.</p>
                <button onClick={() => setActiveTab('blueprint')} className="text-red-600 font-bold mt-2">Go Back</button>
            </div>
        );
    }
    
    return (
      <div className="max-w-6xl mx-auto flex gap-6 h-[calc(100vh-140px)]">
        {/* Left Sidebar: Section Nav & Knowledge Button */}
        <div className="w-64 flex flex-col gap-4">
          
          <button 
            onClick={() => setShowKnowledgeModal(true)}
            className="w-full bg-gradient-to-r from-red-800 to-red-900 text-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-all flex flex-col items-center justify-center gap-2 group"
          >
            <BookOpen className="w-8 h-8 group-hover:scale-110 transition-transform"/>
            <span className="font-bold text-sm tracking-wide">Knowledge Bank</span>
          </button>

          <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            <div className="p-4 bg-gray-50 border-b font-bold text-gray-700">Sections</div>
            <div className="flex-1 overflow-y-auto">
              {sections.map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveSectionId(s.id)}
                  className={`w-full text-left p-4 border-b transition-colors ${
                    activeSectionId === s.id 
                    ? 'bg-red-50 border-l-4 border-l-red-800 text-red-800' 
                    : 'hover:bg-gray-50 text-gray-600 border-l-4 border-l-transparent'
                  }`}
                >
                  <div className="font-bold truncate">{s.title}</div>
                  <div className="text-xs opacity-75 mt-1">{s.qCount} Questions • {s.type.toUpperCase()}</div>
                </button>
              ))}
            </div>
            <div className="p-4 border-t bg-gray-50">
               <button 
                onClick={() => setActiveTab('preview')}
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-medium flex justify-center gap-2 transition-colors"
               >
                 <CheckSquare className="w-4 h-4"/> Preview Paper
               </button>
               <button 
                onClick={() => setActiveTab('blueprint')}
                className="w-full mt-2 text-gray-500 text-sm hover:text-gray-700"
               >
                 ← Back to Structure
               </button>
            </div>
          </div>
        </div>

        {/* Main Area: Questions */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
          {/* Section Header & AI Magic */}
          <div className="p-6 border-b bg-gray-50 flex justify-between items-start">
             <div>
               <h2 className="text-2xl font-bold text-gray-800">{activeSection.title}</h2>
               <p className="text-gray-500 text-sm">
                 {activeSection.desc} • {activeSection.marksPerQ} Marks Each • 
                 {activeSection.attemptCount < activeSection.qCount ? 
                   <span className="text-orange-600 font-medium ml-1">Attempt any {activeSection.attemptCount} of {activeSection.qCount}</span> : 
                   " All compulsory"
                 }
               </p>
             </div>
             
             <div className="flex gap-2 items-center bg-white p-2 rounded-lg border shadow-sm">
                <select 
                  className="bg-gray-50 border border-gray-300 text-xs rounded p-1.5 outline-none"
                  value={aiDifficulty}
                  onChange={(e) => setAiDifficulty(e.target.value)}
                >
                  {DIFFICULTY_LEVELS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
               
               <button 
                onClick={() => initiateMagicFill(activeSection.id)}
                disabled={aiLoadingState.loading}
                className="bg-purple-100 text-purple-700 px-4 py-2 rounded-md hover:bg-purple-200 text-sm font-bold flex gap-2 items-center"
               >
                 {aiLoadingState.loading && aiLoadingState.sectionId === activeSection.id ? <Loader2 className="w-6 h-6 animate-spin"/> : <Sparkles className="w-6 h-6"/>}
                 Auto-Fill Questions
               </button>
             </div>
          </div>

          {/* Questions Scroll Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {activeSection.questions.map((q, idx) => (
              <div key={q.id} className="border border-gray-200 rounded-lg p-4 group hover:border-red-300 transition-all">
                <div className="flex justify-between mb-2">
                   <span className="font-bold text-gray-400 text-sm">Question {idx + 1}</span>
                   
                   <div className="flex items-center gap-2">
                      {/* Magic Wand Per Question */}
                      <div className="relative group/wand">
                        <button 
                          className="p-1.5 bg-purple-50 text-purple-600 rounded hover:bg-purple-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === q.id ? null : q.id);
                          }}
                        >
                          {improvingState?.sectionId === activeSection.id && improvingState?.qIndex === idx ? (
                            <Loader2 className="w-4 h-4 animate-spin"/>
                          ) : (
                            <Wand2 className="w-4 h-4"/>
                          )}
                        </button>
                        
                        {/* Click-activated menu */}
                        {openMenuId === q.id && (
                          <div className="absolute right-0 top-full mt-1 w-32 bg-white shadow-xl rounded-lg border border-purple-100 z-20 overflow-hidden">
                             <button onClick={() => { handleImproveQuestion(activeSection.id, idx, 'rephrase'); setOpenMenuId(null); }} className="w-full text-left px-3 py-2 text-xs hover:bg-purple-50 flex gap-2"><RefreshCw className="w-3 h-3"/> Rephrase</button>
                             <button onClick={() => { handleImproveQuestion(activeSection.id, idx, 'easier'); setOpenMenuId(null); }} className="w-full text-left px-3 py-2 text-xs hover:bg-purple-50 flex gap-2"><TrendingDown className="w-3 h-3"/> Make Easier</button>
                             <button onClick={() => { handleImproveQuestion(activeSection.id, idx, 'harder'); setOpenMenuId(null); }} className="w-full text-left px-3 py-2 text-xs hover:bg-purple-50 flex gap-2"><TrendingUp className="w-3 h-3"/> Make Harder</button>
                          </div>
                        )}
                      </div>

                      <select 
                        value={q.bloom || 'R'}
                        onChange={(e) => updateQuestion(activeSection.id, idx, 'bloom', e.target.value)}
                        className="text-xs border rounded p-1 bg-blue-50 focus:ring-blue-500"
                        title="Bloom Level"
                      >
                        {BLOOM_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>

                      <select 
                        value={q.co}
                        onChange={(e) => updateQuestion(activeSection.id, idx, 'co', e.target.value)}
                        className="text-xs border rounded p-1 bg-gray-50 focus:ring-red-500"
                        title="Course Outcome"
                      >
                        {CO_OPTIONS.map(co => <option key={co} value={co}>{co}</option>)}
                      </select>
                      
                      {/* Better Image Upload Button */}
                      <label className="cursor-pointer flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 transition-colors" title="Add Diagram">
                        <ImagePlus className="w-4 h-4 text-blue-600"/>
                        Add Diagram
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(activeSection.id, idx, e)} />
                      </label>
                   </div>
                </div>

                <div className="relative">
                  <textarea
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none resize-none text-gray-800 font-serif text-sm leading-relaxed"
                    rows={3}
                    placeholder={`Type question here (Supports LaTeX: $$x^2$$)`}
                    value={q.text}
                    onChange={(e) => updateQuestion(activeSection.id, idx, 'text', e.target.value)}
                  />
                  {/* Math Preview Hint */}
                  {q.text && (q.text.includes('$$') || q.text.includes('$')) && (
                    <div className="mt-2 text-sm text-gray-600 bg-gray-50 border rounded px-3 py-2">
                      <span className="font-bold text-xs uppercase text-gray-400 mr-2">Preview:</span>
                      <MixedTextRenderer text={q.text} />
                    </div>
                  )}
                </div>

                {q.image && (
                   <div className="mt-3 relative inline-block group/img">
                     <img src={q.image} className="h-32 border rounded-lg p-1 bg-white shadow-sm object-contain" alt="diagram"/>
                     <button 
                       onClick={() => updateQuestion(activeSection.id, idx, 'image', null)}
                       className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 shadow-md hover:bg-red-700 opacity-0 group-hover/img:opacity-100 transition-opacity"
                     >
                       <X className="w-3 h-3"/>
                     </button>
                   </div>
                )}

                {activeSection.type === 'mcq' && (
                  <div className="grid grid-cols-2 gap-4 mt-3 pl-2">
                    {q.options.map((opt: any, optIdx: number) => (
                      <div key={optIdx} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center text-xs font-bold text-gray-400">
                          {String.fromCharCode(65+optIdx)}
                        </div>
                        <input 
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...q.options];
                            newOpts[optIdx] = e.target.value;
                            updateQuestion(activeSection.id, idx, 'options', newOpts);
                          }}
                          className="flex-1 border-b border-gray-200 text-sm py-1 focus:border-red-500 outline-none font-serif"
                          placeholder={`Option ${String.fromCharCode(65+optIdx)}`}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Navigation Buttons for Faster Builder Flow */}
            <div className="flex justify-between pt-4 pb-8">
              <button 
                onClick={() => {
                    const currentIndex = sections.findIndex(s => s.id === activeSectionId);
                    if (currentIndex > 0) setActiveSectionId(sections[currentIndex - 1].id);
                }}
                disabled={sections.findIndex(s => s.id === activeSectionId) === 0}
                className="px-6 py-2.5 rounded-lg border hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2 text-sm font-bold text-gray-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4"/> Previous Section
              </button>
              
              <button 
                onClick={() => {
                  const currentIndex = sections.findIndex(s => s.id === activeSectionId);
                  if (currentIndex === sections.length - 1) setActiveTab('preview');
                  else setActiveSectionId(sections[currentIndex + 1].id);
                }}
                className={`px-6 py-2.5 rounded-lg ${THEME.primary} ${THEME.primaryHover} text-white flex items-center gap-2 text-sm font-bold transition-colors shadow-md hover:shadow-lg`}
              >
                {sections.findIndex(s => s.id === activeSectionId) === sections.length - 1 ? 'Go to Preview' : 'Next Section'} 
                <ArrowRight className="w-4 h-4"/>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPreviewTab = () => (
    <div className="flex flex-col items-center gap-6 pb-12 bg-gray-100 min-h-screen">
      
      {/* --- Preview Settings Toolbar --- */}
      <div className="sticky top-16 z-30 bg-white/90 backdrop-blur-sm border rounded-full px-6 py-2 shadow-lg flex items-center gap-6 mt-6 print:hidden">
        <div className="flex items-center gap-2 border-r pr-6">
           <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">View</span>
           <button 
             onClick={() => setPreviewSettings(p => ({...p, fontSize: p.fontSize === 'normal' ? 'compact' : 'normal'}))}
             className={`p-2 rounded hover:bg-gray-100 ${previewSettings.fontSize === 'compact' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'}`}
             title="Toggle Font Density"
           >
             {previewSettings.fontSize === 'normal' ? <Maximize2 className="w-4 h-4"/> : <Minimize2 className="w-4 h-4"/>}
           </button>
        </div>

        <div className="flex items-center gap-4 border-r pr-6">
           <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Extras</span>
           
           <button 
             onClick={() => setPreviewSettings(p => ({...p, showCO: !p.showCO}))}
             className={`flex items-center gap-2 text-sm font-medium px-3 py-1 rounded transition-colors ${previewSettings.showCO ? 'bg-green-100 text-green-700' : 'text-gray-400 hover:bg-gray-50'}`}
           >
             {previewSettings.showCO ? <ToggleRight className="w-4 h-4"/> : <ToggleLeft className="w-4 h-4"/>} COs
           </button>

           <button 
             onClick={() => setPreviewSettings(p => ({...p, showBloom: !p.showBloom}))}
             className={`flex items-center gap-2 text-sm font-medium px-3 py-1 rounded transition-colors ${previewSettings.showBloom ? 'bg-green-100 text-green-700' : 'text-gray-400 hover:bg-gray-50'}`}
           >
             {previewSettings.showBloom ? <ToggleRight className="w-4 h-4"/> : <ToggleLeft className="w-4 h-4"/>} Bloom's
           </button>

           <button 
             onClick={() => setPreviewSettings(p => ({...p, showWatermark: !p.showWatermark}))}
             className={`flex items-center gap-2 text-sm font-medium px-3 py-1 rounded transition-colors ${previewSettings.showWatermark ? 'bg-purple-100 text-purple-700' : 'text-gray-400 hover:bg-gray-50'}`}
           >
             {previewSettings.showWatermark ? <CheckSquare className="w-4 h-4"/> : <div className="w-4 h-4 border rounded border-gray-300"/>} Watermark
           </button>
        </div>

        <button 
          onClick={handleWordCompatibleDownload}
          className="bg-blue-700 text-white px-5 py-2 rounded-full font-bold text-sm flex items-center gap-2 hover:bg-blue-800 transition-transform hover:scale-105 shadow-md"
        >
          <FileText className="w-4 h-4"/> Word Compatible (.rtf)
        </button>

        <button 
          onClick={handlePrint}
          className="bg-gray-900 text-white px-5 py-2 rounded-full font-bold text-sm flex items-center gap-2 hover:bg-black transition-transform hover:scale-105 shadow-md"
        >
          <Download className="w-4 h-4"/> Save as PDF / Print
        </button>
      </div>

      {/* --- Paper Container (A4 Simulation) --- */}
      <div 
        className={`bg-white shadow-2xl relative print:shadow-none print:w-full print:m-0 mx-auto transition-all duration-300 ${previewSettings.fontSize === 'compact' ? 'text-[10pt]' : 'text-[11pt]'}`}
        style={{ 
          width: '210mm', 
          minHeight: '297mm', 
          padding: '12mm 15mm',
          paddingBottom: '20mm', /* Extra padding for footer */
          fontFamily: '"Times New Roman", serif' 
        }}
      >
        {/* Watermark Overlay */}
        {previewSettings.showWatermark && (
           <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
             <div className="text-gray-100 text-[100pt] font-black transform -rotate-45 select-none opacity-50">
               CONFIDENTIAL
             </div>
           </div>
        )}

        {/* --- Exam Header (Official Table Format) --- */}
        <div className="relative z-10 mb-6">
          <div className="flex items-center border-b-2 border-black pb-4 mb-4">
              {/* Left: Logo */}
              <div className="shrink-0 mr-4">
                  <img src="itmbu_logo.png" alt="University Logo" className="h-28 object-contain" />
              </div>
              {/* Center: University Details */}
              <div className="flex-grow text-center">
                  <h1 className="text-[18pt] font-bold uppercase leading-tight tracking-wide text-black">{meta.universityName}</h1>
                  <h2 className="text-[14pt] font-bold uppercase text-gray-800 mt-1">{meta.schoolName || "SCHOOL OF ..."}</h2>
                  <div className="font-bold uppercase text-[12pt] mt-2">
                     {meta.examType} Examination {meta.academicYear}
                  </div>
              </div>
          </div>

          {/* Exam Info - No Box */}
          <div className="w-full mt-4">
             <div className="grid grid-cols-2 gap-x-12 text-[11pt]">
                 <div className="space-y-1">
                     <div className="flex gap-2"><span className="font-bold w-24">Branch:</span> <span>{meta.branch}</span></div>
                     <div className="flex gap-2"><span className="font-bold w-24">Semester:</span> <span>{meta.semester}</span></div>
                     <div className="flex gap-2"><span className="font-bold w-24">Course:</span> <span>{meta.courseName}</span></div>
                     <div className="flex gap-2"><span className="font-bold w-24">Code:</span> <span>{meta.courseCode}</span></div>
                 </div>
                 <div className="space-y-1">
                     <div className="flex gap-2"><span className="font-bold w-24">Date:</span> <span>{meta.examDate}</span></div>
                     <div className="flex gap-2"><span className="font-bold w-24">Time:</span> <span>{getDurationString()}</span></div>
                     <div className="flex gap-2"><span className="font-bold w-24">Duration:</span> <span>{calculatedDuration}</span></div>
                      <div className="flex gap-2"><span className="font-bold w-24">Max Marks:</span> <span>{totalPaperMarks}</span></div>
                 </div>
             </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mb-6 relative z-10 border-b-2 border-black pb-2">
           <span className="font-bold underline text-[11pt]">Instructions:</span>
           <div className="whitespace-pre-wrap mt-1 italic text-[10pt] leading-snug">{meta.instructions}</div>
        </div>

        {/* --- Sections & Questions --- */}
        <div className="space-y-6 relative z-10">
          {sections.map((section, sIdx) => (
            <div key={section.id}>
              {/* Section Header */}
              <div className="flex justify-between items-baseline mb-3 font-bold uppercase tracking-wide border-b border-gray-300 pb-1">
                 <div>
                   <span className="mr-2">Q.{sIdx + 1}</span> 
                   {section.title} - {section.desc}
                   {section.attemptCount < section.qCount && (
                     <span className="normal-case font-normal italic text-[10pt] ml-2">
                       (Attempt any {section.attemptCount})
                     </span>
                   )}
                 </div>
                 <div>[{section.attemptCount * section.marksPerQ} Marks]</div>
              </div>

              {/* Questions List */}
              <div className="space-y-3">
                 {section.questions.map((q, qIdx) => (
                   <div key={q.id} className="flex gap-2 break-inside-avoid">
                      {/* Q Number */}
                      <div className="font-bold w-8 shrink-0 text-right pt-0.5">
                        {qIdx + 1}.
                      </div>

                      {/* Content */}
                      <div className="grow pt-0.5">
                        <div className="text-justify leading-snug">
                           <MixedTextRenderer text={q.text || "_________________________________"} />
                        </div>
                        
                        {q.image && (
                          <div className="my-2">
                            <img src={q.image} alt="diagram" className="max-h-24 object-contain border border-gray-300 p-1 bg-white"/>
                          </div>
                        )}

                        {/* MCQ Options */}
                        {section.type === 'mcq' && (
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 ml-2">
                            {q.options.map((opt: string, oIdx: number) => (
                               <div key={oIdx} className="flex gap-2 items-start">
                                 <span className="font-bold text-[9pt] pt-0.5">({String.fromCharCode(97+oIdx)})</span>
                                 <span><MixedTextRenderer text={opt} /></span>
                               </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Right Metadata Column */}
                      <div className="w-16 shrink-0 text-right space-y-0.5 pt-0.5">
                        <div className="font-bold">[{section.marksPerQ}]</div>
                        
                        {(previewSettings.showCO || previewSettings.showBloom) && (
                          <div className="text-[8pt] text-gray-500 font-sans mt-1 flex flex-col items-end">
                             {previewSettings.showCO && <span>{q.co}</span>}
                             {previewSettings.showBloom && <span>{q.bloom}</span>}
                          </div>
                        )}
                      </div>
                   </div>
                 ))}
              </div>
            </div>
          ))}
        </div>
        
        {/* Footer for Screen Preview (Single page view) */}
        <div className="mt-12 text-center font-bold text-[10pt] text-gray-400 print:hidden">
           *** END OF PAPER ***
        </div>

        {/* --- Print-Specific Footer (Fixed on every page) --- */}
        <div className="hidden print:flex fixed bottom-0 left-0 w-full justify-between items-end px-8 py-4 text-[9pt] text-gray-500 bg-white border-t border-gray-100">
           <div className="flex flex-col text-left">
             <span className="font-bold text-black">{meta.courseCode}</span>
             <span className="text-[8pt] italic opacity-75">Page numbers available in print settings</span>
           </div>
           
           <div className="flex flex-col items-center">
             <span className="font-bold uppercase tracking-widest text-xs">{meta.universityName}</span>
           </div>

           <div className="flex flex-col text-right">
             <span className="font-bold text-black">{meta.examDate}</span>
             <span className="text-[8pt]">{meta.examType}</span>
           </div>
        </div>

      </div>
      
      {/* Print Help Text - Helper for users who are confused about "Download" */}
      <div className="w-full max-w-2xl bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-4 print:hidden">
         <div className="p-2 bg-blue-100 rounded-full text-blue-600 h-fit">
            <HelpCircle className="w-5 h-5"/>
         </div>
         <div>
            <h4 className="font-bold text-blue-800 text-sm">How to Download as PDF?</h4>
            <p className="text-sm text-blue-700 mt-1">
              Click the <strong>Save as PDF</strong> button above. In the print dialog, change the "Destination" to <strong>Save as PDF</strong>.
            </p>
            <p className="text-xs text-blue-600 mt-2 font-medium">
              Tip: For page numbers, enable "Headers and footers" in the print dialog options.
            </p>
         </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 print:bg-white">
      {/* Loading Overlay */}
      {(aiLoadingState.loading || improvingState?.loading) && (
        <LoadingOverlay message={improvingState?.loading ? "Polishing Question..." : "Generating Questions..."} />
      )}

      {/* Top Bar - Hidden in Print */}
      <div className="bg-white border-b px-6 py-3 flex justify-between items-center print:hidden sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
                <img src="itmbu_logo.png" alt="Site Logo" className="h-10 object-contain" />
            </div>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-lg">
          {['blueprint', 'builder', 'preview'].map(tab => (
            <button
              key={tab}
              onClick={() => tab === 'builder' ? initializeBuilder() : setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${
                activeTab === tab ? 'bg-white text-red-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 print:p-0">
        {activeTab === 'blueprint' && renderBlueprintTab()}
        {activeTab === 'builder' && renderBuilderTab()}
        {activeTab === 'preview' && renderPreviewTab()}
        
        {showKnowledgeModal && renderKnowledgeModal()}
        {showRestorePrompt && <RestoreModal onRestore={handleRestore} onDiscard={handleDiscard} />}
        {showLowContextWarning && <LowContextModal onAddContext={() => { setShowLowContextWarning(false); setShowKnowledgeModal(true); }} onProceed={() => executeMagicFill(pendingMagicSectionId, false)} />}
      </div>
      
      <style>{`
        @media print {
          body { background: white; margin: 0; padding: 0; }
          .print\\:hidden { display: none !important; }
          @page {
             size: A4;
             margin: 10mm; /* Small margins so footer fits */
             @bottom-center {
                content: "Page " counter(page) " of " counter(pages);
             }
          }
          /* Reset container for print */
          .bg-white.shadow-2xl {
            box-shadow: none !important;
            margin: 0 !important;
            width: 100% !important;
            min-height: auto !important;
            padding-bottom: 0 !important;
          }
        }
        .katex { font-size: 1.0em !important; }
      `}</style>
    </div>
  );
}
