'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Trophy, 
  Play, 
  CheckCircle2, 
  Loader2, 
  Download, 
  History, 
  Plus, 
  Volume2, 
  Mic, 
  Square,
  Pause,
  AlertCircle,
  Info
} from 'lucide-react';
import Link from 'next/link';
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import QuestionCard from '@/components/examiner/QuestionCard';

interface UserAnswers {
  [module: string]: {
    [questionId: string]: string;
  };
}

export default function ExaminerPage() {
  const [step, setStep] = useState<'setup' | 'test' | 'answers' | 'results'>('setup');
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [testType, setTestType] = useState<'Academic' | 'General'>('Academic');
  const [modules, setModules] = useState<string[]>(['Listening', 'Reading', 'Writing', 'Speaking']);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [loading, setLoading] = useState(false);
  const [generationStatus, setGenerationStatus] = useState('');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [testData, setTestData] = useState<any>(null);
  const [packageId, setPackageId] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [evaluation, setEvaluation] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [currentModule, setCurrentModule] = useState('Listening');
  const [savedPackages, setSavedPackages] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);

  // Speech Refs
  const recognizerRef = useRef<SpeechSDK.SpeechRecognizer | null>(null);
  const playerRef = useRef<SpeechSDK.SpeakerAudioDestination | null>(null);
  const synthesizerRef = useRef<SpeechSDK.SpeechSynthesizer | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSpeechKey, setActiveSpeechKey] = useState<string | null>(null);
  const [audioCache, setAudioCache] = useState<Record<string, string>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        fetchHistory(parsed.id);
    }
    fetchPackages();

    return () => {
        stopAudio();
        stopRecording();
    };
  }, []);

  const fetchHistory = async (userId: string) => {
    try {
      const response = await fetch(`/api/results/examiner?userId=${userId}`);
      const result = await response.json();
      if (result.success) {
        setHistory(result.results);
      }
    } catch (err) {
      console.error('Failed to fetch history');
    }
  };

  const reviewResult = async (result: any) => {
    setLoading(true);
    try {
        const evalData = {
            overallBand: result.score,
            moduleBands: result.data.moduleBands,
            criteriaBreakdown: result.data.criteriaBreakdown,
            discussion: result.data.discussion,
            detailedFeedback: result.data.detailedFeedback,
            suggestions: result.data.suggestions
        };
        setEvaluation(evalData);
        setUserAnswers(result.data.userAnswers || {});
        setTestType(result.data.testType || 'Academic');
        
        if (result.packageId) {
            // Check if we already have it
            let pkg = savedPackages.find(p => p._id === result.packageId);
            if (!pkg) {
                // Fetch it from API
                const res = await fetch('/api/generate/examiner', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'getPackage', packageId: result.packageId })
                });
                const data = await res.json();
                if (data.success) pkg = data.package;
            }
            
            if (pkg) {
                setTestData(pkg.content);
                setPackageId(pkg._id);
                setDifficulty(pkg.difficulty || 'Medium');
            }
        }
        
        setStep('results');
    } catch (err) {
        toast.error("Failed to load review data");
    } finally {
        setLoading(false);
    }
  };

  const fetchPackages = async () => {
    try {
      const response = await fetch('/api/generate/examiner');
      const result = await response.json();
      if (result.success) {
        // Sort by createdAt descending (newest first)
        const sorted = result.packages.sort((a: any, b: any) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setSavedPackages(sorted);
      }
    } catch (err) {
      console.error('Failed to fetch packages');
    }
  };

  const stopAudio = () => {
    if (playerRef.current) playerRef.current.pause();
    if (synthesizerRef.current) synthesizerRef.current.close();
    setIsPlaying(false);
    setActiveSpeechKey(null);
  };

  const playListeningAudio = async (section: any, sectionIdx: number) => {
    const cacheKey = `listening-${packageId || 'new'}-${sectionIdx}`;
    
    if (isPlaying && activeSpeechKey === cacheKey) {
        if (audioRef.current) audioRef.current.pause();
        setIsPlaying(false);
        setActiveSpeechKey(null);
        return;
    }

    // 1. Check Cache
    if (audioCache[cacheKey]) {
        if (audioRef.current) {
            audioRef.current.src = audioCache[cacheKey];
            audioRef.current.play();
            setIsPlaying(true);
            setActiveSpeechKey(cacheKey);
            
            audioRef.current.onended = () => {
                setIsPlaying(false);
                setActiveSpeechKey(null);
            };
        }
        return;
    }

    try {
        const tokenRes = await fetch('/api/auth/speech-token');
        const { token, region } = await tokenRes.json();

        const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(token, region);
        speechConfig.speechSynthesisLanguage = "en-GB";

        // Multi-voice parsing logic
        const lines = section.script.split('\n').filter((l: string) => l.trim() !== '');
        const uniqueSpeakers: string[] = [];
        let lastAssignedVoice = "en-GB-RyanNeural";

        const getVoiceForSpeaker = (name: string, index: number) => {
            const lowerName = name.toLowerCase();
            if (lowerName.includes('woman') || lowerName.includes('female') || lowerName.includes('girl') || lowerName.includes('mrs') || lowerName.includes('ms')) {
                return "en-GB-LibbyNeural";
            }
            if (lowerName.includes('man') || lowerName.includes('male') || lowerName.includes('boy') || lowerName.includes('mr')) {
                return "en-GB-RyanNeural";
            }
            // Fallback to alternating: 0=Ryan, 1=Libby
            return index % 2 === 0 ? "en-GB-RyanNeural" : "en-GB-LibbyNeural";
        };

        const parsedDialogue = lines.map((line: string) => {
            const match = line.match(/^([^:]+):/);
            let speakerName = match ? match[1].trim() : null;
            let content = match ? line.substring(match[0].length).trim() : line.trim();
            let voice = "";

            if (speakerName) {
                const lowerName = speakerName.toLowerCase();
                if (!uniqueSpeakers.includes(lowerName)) uniqueSpeakers.push(lowerName);
                const speakerIndex = uniqueSpeakers.indexOf(lowerName);
                voice = getVoiceForSpeaker(speakerName, speakerIndex);
            } else {
                voice = lastAssignedVoice === "en-GB-LibbyNeural" ? "en-GB-RyanNeural" : "en-GB-LibbyNeural";
            }
            lastAssignedVoice = voice;
            return { voice, text: content };
        });

        const escapeXml = (unsafe: string) => unsafe.replace(/[<>&"']/g, (c) => {
            switch (c) {
                case '<': return '&lt;'; case '>': return '&gt;'; case '&': return '&amp;';
                case '"': return '&quot;'; case "'": return '&apos;'; default: return c;
            }
        });

        let ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-GB">`;
        parsedDialogue.forEach((line: any) => {
            ssml += `<voice name="${line.voice}">${escapeXml(line.text)}<break time="500ms"/></voice>`;
        });
        ssml += `</speak>`;

        // Synthesize to memory (AudioData)
        const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig, null);
        
        setGenerationStatus(`Synthesizing Audio for Section ${sectionIdx + 1}...`);
        
        synthesizer.speakSsmlAsync(ssml, result => {
            if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
                const blob = new Blob([result.audioData], { type: 'audio/wav' });
                const url = URL.createObjectURL(blob);
                
                setAudioCache(prev => ({ ...prev, [cacheKey]: url }));
                
                if (audioRef.current) {
                    audioRef.current.src = url;
                    audioRef.current.play();
                    setIsPlaying(true);
                    setActiveSpeechKey(cacheKey);
                    
                    audioRef.current.onended = () => {
                        setIsPlaying(false);
                        setActiveSpeechKey(null);
                    };
                }
            } else {
                toast.error("Speech Synthesis Failed");
            }
            synthesizer.close();
            setGenerationStatus('');
        }, err => {
            console.error(err);
            toast.error("Audio Generation Error");
            setGenerationStatus('');
        });

    } catch (err) {
        toast.error("Connection Error");
    }
  };

  const startRecording = async (module: string, key: string) => {
    try {
        const response = await fetch('/api/auth/speech-token');
        const { token, region } = await response.json();

        const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(token, region);
        speechConfig.speechRecognitionLanguage = 'en-US';
        
        const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
        const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

        recognizer.recognized = (s, e) => {
            if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
                updateAnswer(module, key, (userAnswers[module]?.[key] || '') + ' ' + e.result.text);
            }
        };

        recognizer.startContinuousRecognitionAsync();
        recognizerRef.current = recognizer;
        setIsRecording(true);
        setActiveSpeechKey(key);
        toast.info("Recording started");
    } catch (err) {
        toast.error("Speech Service Error");
    }
  };

  const stopRecording = () => {
    if (recognizerRef.current) {
        recognizerRef.current.stopContinuousRecognitionAsync();
        recognizerRef.current = null;
    }
    setIsRecording(false);
    setActiveSpeechKey(null);
  };

  const generateTest = async () => {
    setLoading(true);
    setGenerationProgress(5);
    setGenerationStatus('Initializing Exam Package...');
    
    try {
      // 1. Initialize Package
      const initRes = await fetch('/api/generate/examiner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'initPackage', testType, difficulty })
      });
      const initResult = await initRes.json();
      if (!initResult.success) throw new Error(initResult.error);

      const newPackageId = initResult.packageId;
      setPackageId(newPackageId);
      
      const fullTestData: any = { testType, difficulty, answerKey: {} };
      const moduleList = ['Listening', 'Reading', 'Writing', 'Speaking'];
      let overallQuestionCount = 0;
      let generatedQuestionCount = 0;

      // 2. Generate each module's structure
      for (let i = 0; i < moduleList.length; i++) {
        const mod = moduleList[i];
        setGenerationStatus(`Generating ${mod} Structure...`);
        setGenerationProgress(5 + (i * 5));

        const modStructureRes = await fetch('/api/generate/examiner', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'generateModuleStructure', 
            packageId: newPackageId, 
            moduleName: mod,
            testType,
            difficulty
          })
        });
        const modStructureResult = await modStructureRes.json();
        if (!modStructureResult.success) throw new Error(modStructureResult.error);
        
        fullTestData[mod.toLowerCase()] = { structure: modStructureResult.data };

        // Count total questions for progress bar
        if (mod.toLowerCase() === 'listening') {
            modStructureResult.data.sections.forEach((sec: any) => overallQuestionCount += sec.questionCount);
        } else if (mod.toLowerCase() === 'reading') {
            modStructureResult.data.passages.forEach((pass: any) => overallQuestionCount += pass.questionCount);
        } else if (mod.toLowerCase() === 'writing') {
            overallQuestionCount += 2; // Task 1 and Task 2
        } else if (mod.toLowerCase() === 'speaking') {
            // Estimate question count for speaking based on structure
            // Assuming Part 1: 4 questions, Part 2: 1 cue card, Part 3: 4 questions
            overallQuestionCount += (modStructureResult.data.part1?.questions?.length || 0) 
            + (modStructureResult.data.part2 ? 1 : 0) // Cue card is 1 item
            + (modStructureResult.data.part3?.questions?.length || 0);
        }
      }

      // 3. Generate sections incrementally
      for (let i = 0; i < moduleList.length; i++) {
        const mod = moduleList[i];
        const moduleKey = mod.toLowerCase();
        
        if (moduleKey === 'listening' || moduleKey === 'reading') {
            const sectionsOrPassages = moduleKey === 'listening' 
                ? fullTestData[moduleKey].structure.sections 
                : fullTestData[moduleKey].structure.passages;

            if (moduleKey === 'listening') fullTestData.listening.sections = [];
            else fullTestData.reading.passages = [];

            for (let sIdx = 0; sIdx < sectionsOrPassages.length; sIdx++) {
                setGenerationStatus(`Generating ${mod} Section ${sIdx + 1}...`);
                setGenerationProgress(25 + ((i * 20) + (sIdx / sectionsOrPassages.length) * 20));

                const sectionRes = await fetch('/api/generate/examiner', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'generateSection',
                        packageId: newPackageId,
                        moduleName: mod,
                        questionDetails: { sectionIndex: sIdx },
                        testType,
                        difficulty
                    })
                });
                const sectionResult = await sectionRes.json();
                if (!sectionResult.success) throw new Error(sectionResult.error);
                
                if (moduleKey === 'listening') {
                    fullTestData.listening.sections[sIdx] = {
                        ...sectionsOrPassages[sIdx],
                        script: sectionResult.data.script,
                        questions: sectionResult.data.questions
                    };
                } else { // reading
                    fullTestData.reading.passages[sIdx] = {
                        ...sectionsOrPassages[sIdx],
                        text: sectionResult.data.text,
                        questions: sectionResult.data.questions
                    };
                }

                // Merge answer key
                if (sectionResult.data.answerKey) {
                    if (!fullTestData.answerKey[moduleKey]) fullTestData.answerKey[moduleKey] = {};
                    fullTestData.answerKey[moduleKey] = {
                        ...fullTestData.answerKey[moduleKey],
                        ...sectionResult.data.answerKey
                    };
                }
            }
        } else if (moduleKey === 'writing') {
            setGenerationStatus(`Generating Writing Tasks...`);
            setGenerationProgress(75);

            // Task 1
            const writingTask1Res = await fetch('/api/generate/examiner', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'generateQuestion',
                    packageId: newPackageId,
                    moduleName: mod,
                    questionDetails: { taskType: 'task1' },
                    testType,
                    difficulty
                })
            });
            const writingTask1Result = await writingTask1Res.json();
            if (!writingTask1Result.success) throw new Error(writingTask1Result.error);
            fullTestData.writing = { task1: writingTask1Result.data };

            // Task 2
            const writingTask2Res = await fetch('/api/generate/examiner', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'generateQuestion',
                    packageId: newPackageId,
                    moduleName: mod,
                    questionDetails: { taskType: 'task2' },
                    testType,
                    difficulty
                })
            });
            const writingTask2Result = await writingTask2Res.json();
            if (!writingTask2Result.success) throw new Error(writingTask2Result.error);
            fullTestData.writing.task2 = writingTask2Result.data;
            
            fullTestData.answerKey.writing = {};
            if (writingTask1Result.data.answerKey) {
                fullTestData.answerKey.writing.task1 = writingTask1Result.data.answerKey;
            }
            if (writingTask2Result.data.answerKey) {
                fullTestData.answerKey.writing.task2 = writingTask2Result.data.answerKey;
            }

        } else if (moduleKey === 'speaking') {
            fullTestData.speaking = { part1: [], part2: {}, part3: [] };
            for (let partIdx = 0; partIdx < 3; partIdx++) {
                setGenerationStatus(`Generating Speaking Part ${partIdx + 1}...`);
                setGenerationProgress(85 + (partIdx * 5));

                const speakingRes = await fetch('/api/generate/examiner', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'generateSection',
                        packageId: newPackageId,
                        moduleName: mod,
                        questionDetails: { sectionIndex: partIdx },
                        testType,
                        difficulty
                    })
                });
                const speakingResult = await speakingRes.json();
                if (!speakingResult.success) throw new Error(speakingResult.error);

                if (partIdx === 0) fullTestData.speaking.part1 = speakingResult.data.questions;
                else if (partIdx === 1) fullTestData.speaking.part2 = speakingResult.data;
                else if (partIdx === 2) fullTestData.speaking.part3 = speakingResult.data.questions;

                if (speakingResult.data.answerKey) {
                    if (!fullTestData.answerKey.speaking) fullTestData.answerKey.speaking = {};
                    fullTestData.answerKey.speaking[`part${partIdx + 1}`] = speakingResult.data.answerKey;
                }
            }
        }
      }

      // 4. Finalize
      setGenerationStatus('Finalizing Test...');
      setGenerationProgress(95);
      await fetch('/api/generate/examiner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'finalizePackage', packageId: newPackageId })
      });

      setTestData(fullTestData);
      setStep('test');
      setUserAnswers({});
      setGenerationProgress(100);
      toast.success('Complete IELTS Exam Generated!');
      fetchPackages(); // Refresh the list
      
    } catch (err: any) {
      toast.error('Generation failed: ' + err.message);
      // Jangan hapus paket (deletePackage) agar bisa di-resume nanti dari database
    } finally {
      setLoading(false);
      setGenerationStatus('');
    }
  };

  const loadPackage = (pkg: any) => {
    setTestData(pkg.content);
    setPackageId(pkg._id);
    setTestType(pkg.content.testType || 'Academic');
    setDifficulty(pkg.difficulty || 'Medium');
    setStep('test');
    setUserAnswers({});
    toast.success(`Loaded ${pkg.title}`);
  };

  const submitAnswers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/evaluate/examiner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userAnswers, 
          generatedTest: testData, 
          testType,
          userId: user?.id,
          packageId: packageId
        })
      });
      const result = await response.json();
      if (result.success) {
        setEvaluation(result.evaluation);
        setStep('results');
        toast.success('Test evaluated! Overall Band: ' + result.evaluation.overallBand);
      }
    } catch (err) {
      toast.error('Evaluation failed');
    } finally {
      setLoading(false);
    }
  };

  const updateAnswer = (module: string, questionId: any, answer: string) => {
    const moduleKey = module.toLowerCase();
    const qId = questionId.toString();
    
    setUserAnswers(prev => ({
      ...prev,
      [moduleKey]: {
        ...(prev[moduleKey] || {}),
        [qId]: answer
      }
    }));
  };

  const renderQuestion = (module: string, question: any, key: any) => {
    const moduleKey = module.toLowerCase();
    const qId = key; // Using key as ID (sXqY format)
    
    // Find discussion in evaluation if in review mode
    const discussion = evaluation?.discussion?.[moduleKey]?.find((d: any) => 
      d.questionId === qId || d.questionId === question.id?.toString()
    );

    return (
      <QuestionCard 
        key={key}
        module={module}
        question={question}
        qId={qId}
        isReviewMode={isReviewMode}
        userAnswer={userAnswers[moduleKey]?.[qId] || ''}
        discussion={discussion}
        onUpdateAnswer={updateAnswer}
      />
    );
  };

  if (loading && generationStatus) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center space-y-8">
            <div className="w-24 h-24 bg-blue-100 rounded-[32px] flex items-center justify-center text-blue-600 animate-pulse">
                <Trophy className="w-12 h-12" />
            </div>
            <div className="space-y-4 w-full max-w-md">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{generationStatus}</h2>
                <Progress value={generationProgress} className="h-2" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    This takes about 1-2 minutes to ensure high quality
                </p>
            </div>
        </div>
      );
  }

  if (step === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/dashboard" className="flex items-center gap-2 text-slate-600">
              <ArrowLeft className="w-5 h-5" /> Dashboard
            </Link>
          </Button>
          
          <Tabs defaultValue="new-test" className="w-full">
            <TabsList className="grid w-full sm:w-[400px] grid-cols-2 h-12 md:h-14 bg-white/50 backdrop-blur rounded-2xl p-1 mb-6 md:mb-8 shadow-sm">
                <TabsTrigger value="new-test" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md font-bold text-xs md:text-sm">New Test</TabsTrigger>
                <TabsTrigger value="history" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md font-bold text-xs md:text-sm">History</TabsTrigger>
            </TabsList>

            <TabsContent value="new-test">
                <div className="grid md:grid-cols-2 gap-8">
                    <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl rounded-[40px]">
                    <CardHeader className="text-center pt-10">
                        <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                        <CardTitle className="text-3xl font-black bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                        IELTS Simulator
                        </CardTitle>
                        <p className="text-slate-500">Official Computer-Delivered format</p>
                    </CardHeader>
                    <CardContent className="space-y-6 pb-10">
                        <div className="grid grid-cols-1 gap-4">
                        <div>
                            <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-2 block">Test Module</Label>
                            <select 
                            value={testType} 
                            onChange={(e) => setTestType(e.target.value as any)}
                            className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 bg-white font-bold"
                            >
                            <option>Academic</option>
                            <option>General</option>
                            </select>
                        </div>
                        <div>
                            <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-2 block">Target Difficulty</Label>
                            <select 
                            value={difficulty} 
                            onChange={(e) => setDifficulty(e.target.value as any)}
                            className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 bg-white font-bold"
                            >
                            <option>Easy</option>
                            <option>Medium</option>
                            <option>Hard</option>
                            </select>
                        </div>
                        </div>
                        <Button 
                        onClick={generateTest} 
                        disabled={loading}
                        className="w-full h-16 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl shadow-xl text-lg transition-all active:scale-95"
                        >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
                        START TEST
                        </Button>
                    </CardContent>
                    </Card>

                    <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl rounded-[40px]">
                    <CardHeader className="text-center pt-10">
                        <History className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                        <CardTitle className="text-3xl font-black text-slate-900">
                        Practice Packages
                        </CardTitle>
                        <p className="text-slate-500">Pick up where you left off</p>
                    </CardHeader>
                    <CardContent className="pb-10">
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {savedPackages.length === 0 ? (
                            <p className="text-center text-slate-400 py-8 italic text-sm">No saved tests yet</p>
                        ) : (
                            savedPackages.map((pkg) => (
                            <button
                                key={pkg._id}
                                onClick={() => loadPackage(pkg)}
                                className="w-full flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-white hover:border-blue-200 hover:bg-blue-50/50 transition-all text-left group"
                            >
                                <div>
                                <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{pkg.title}</p>
                                <div className="flex gap-2 mt-1">
                                    <Badge variant="secondary" className="text-[8px] h-4 uppercase">{pkg.difficulty}</Badge>
                                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
                                        {new Date(pkg.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                                    <Play className="w-4 h-4" />
                                </div>
                            </button>
                            ))
                        )}
                        </div>
                    </CardContent>
                    </Card>
                </div>
            </TabsContent>

            <TabsContent value="history">
                <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl rounded-[40px] overflow-hidden">
                    <CardHeader className="p-10 border-b">
                        <CardTitle className="text-2xl font-black">Test Result History</CardTitle>
                        <p className="text-slate-500">Analyze your progress over time</p>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <tr>
                                        <th className="px-8 py-4">Date</th>
                                        <th className="px-8 py-4">Test Name</th>
                                        <th className="px-8 py-4 text-center">L</th>
                                        <th className="px-8 py-4 text-center">R</th>
                                        <th className="px-8 py-4 text-center">W</th>
                                        <th className="px-8 py-4 text-center">S</th>
                                        <th className="px-8 py-4 text-center bg-slate-100">Overall</th>
                                        <th className="px-8 py-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {history.map((res) => (
                                        <tr key={res._id} className="hover:bg-blue-50/30 transition-colors group">
                                            <td className="px-8 py-6 text-xs text-slate-500">{new Date(res.date).toLocaleDateString()}</td>
                                            <td className="px-8 py-6 font-bold text-slate-900">{res.topic}</td>
                                            <td className="px-8 py-6 text-center font-mono text-sm">{res.data?.moduleBands?.listening}</td>
                                            <td className="px-8 py-6 text-center font-mono text-sm">{res.data?.moduleBands?.reading}</td>
                                            <td className="px-8 py-6 text-center font-mono text-sm">{res.data?.moduleBands?.writing}</td>
                                            <td className="px-8 py-6 text-center font-mono text-sm">{res.data?.moduleBands?.speaking}</td>
                                            <td className="px-8 py-6 text-center bg-slate-100/50">
                                                <Badge className="bg-slate-900 text-white font-black text-sm px-3">{res.score}</Badge>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <Button 
                                                    size="sm" 
                                                    variant="secondary" 
                                                    onClick={() => reviewResult(res)}
                                                    className="rounded-full font-bold text-[10px] uppercase tracking-tighter"
                                                >
                                                    Deep Review
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {history.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="px-8 py-20 text-center text-slate-400 italic">No completed tests found in your account.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="md:hidden divide-y divide-slate-100">
                            {history.map((res) => (
                                <div key={res._id} className="p-6 space-y-4 hover:bg-slate-50/50 transition-colors">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(res.date).toLocaleDateString()}</p>
                                            <p className="font-bold text-slate-900 text-base truncate">{res.topic}</p>
                                        </div>
                                        <Badge className="bg-slate-900 text-white font-black text-sm px-3 shrink-0">Band {res.score}</Badge>
                                    </div>
                                    
                                    <div className="grid grid-cols-4 gap-2">
                                        {[
                                            { l: "L", v: res.data?.moduleBands?.listening },
                                            { l: "R", v: res.data?.moduleBands?.reading },
                                            { l: "W", v: res.data?.moduleBands?.writing },
                                            { l: "S", v: res.data?.moduleBands?.speaking }
                                        ].map(m => (
                                            <div key={m.l} className="text-center p-2 rounded-xl bg-slate-50 border border-slate-100">
                                                <p className="text-[8px] font-bold text-slate-400 uppercase">{m.l}</p>
                                                <p className="font-mono text-xs font-black">{m.v || '-'}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <Button 
                                        variant="secondary" 
                                        onClick={() => reviewResult(res)}
                                        className="w-full rounded-xl font-bold text-xs uppercase tracking-widest h-12"
                                    >
                                        Deep Review
                                    </Button>
                                </div>
                            ))}
                            {history.length === 0 && (
                                <div className="p-12 text-center text-slate-400 italic text-sm">No completed tests found in your account.</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  return (
    <main className="p-4 sm:p-6 md:p-8">
      <header className="mb-8 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => {
          if (step === 'test') {
            if (confirm('Exit test? Progress will not be saved.')) setStep('setup');
          } else {
            setStep('setup');
          }
        }}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <div>
          <Badge variant="secondary" className="uppercase tracking-widest font-bold text-xs">
            {testType} - {difficulty}
          </Badge>
          <h1 className="text-2xl font-black text-slate-900 mt-1">IELTS Examiner</h1>
        </div>
      </header>

      <div className="max-w-6xl mx-auto space-y-8">
        <audio ref={audioRef} className="hidden" />
        {step === 'test' && (
          <>
            <Tabs value={currentModule} onValueChange={setCurrentModule} className="w-full">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-14 bg-slate-100 rounded-2xl p-1 mb-8 overflow-x-auto">
                {modules.map(mod => (
                  <TabsTrigger key={mod} value={mod} className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md">
                    {mod}
                  </TabsTrigger>
                ))}
              </TabsList>
              {modules.map(mod => (
                <TabsContent key={mod} value={mod} className="space-y-6">
                  <Card className="rounded-[32px] border-slate-200 overflow-hidden shadow-sm">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                      <CardTitle className="text-sm uppercase tracking-widest font-black text-slate-400">{mod} Module</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-8 p-8 max-h-[65vh] overflow-y-auto">
                      {/* Render questions dynamically */}
                      {(testData[mod.toLowerCase()] || {}).sections?.map((section: any, sIdx: number) => (
                        <div key={sIdx} className="space-y-6">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-lg text-blue-600">Section {sIdx + 1}: {section.title}</h3>
                            <Button 
                                variant={activeSpeechKey === `listening-${sIdx}` ? "destructive" : "secondary"}
                                size="sm" 
                                onClick={() => playListeningAudio(section, sIdx)}
                                className="rounded-full px-4"
                            >
                                {activeSpeechKey === `listening-${sIdx}` ? <Pause className="w-4 h-4 mr-2" /> : <Volume2 className="w-4 h-4 mr-2" />}
                                {activeSpeechKey === `listening-${sIdx}` ? "Stop" : "Play Audio"}
                            </Button>
                          </div>
                          {section.questions.map((q: any, qIdx: number) => renderQuestion(mod, q, `s${sIdx}q${q.id}`))}
                        </div>
                      )) || 
                      (testData[mod.toLowerCase()] || {}).passages?.map((passage: any, pIdx: number) => (
                        <div key={pIdx} className="space-y-6">
                          <h3 className="font-bold text-xl text-blue-600">Passage {pIdx + 1}: {passage.title}</h3>
                          <div className="prose prose-slate max-w-none bg-slate-50 p-6 rounded-2xl border mb-6">
                              <p className="text-sm leading-relaxed italic">{passage.text}</p>
                          </div>
                          {passage.questions?.map((q: any, qIdx: number) => renderQuestion(mod, q, `s${pIdx}q${q.id}`))}
                        </div>
                      )) ||
                      (mod.toLowerCase() === 'writing' && testData.writing ? (
                        <div className="space-y-8">
                           <div className="space-y-4">
                              <Badge className="bg-blue-600 text-white">Task 1</Badge>
                              <p className="font-bold text-slate-800">{testData.writing.task1.prompt}</p>
                              <Textarea 
                                placeholder="Write your Task 1 response here (min 150 words)..."
                                className="min-h-[200px] rounded-2xl border-slate-200"
                                value={userAnswers['writing']?.['task1'] || ''}
                                onChange={(e) => updateAnswer('writing', 'task1', e.target.value)}
                              />
                           </div>
                           <div className="space-y-4 border-t pt-8">
                              <Badge className="bg-blue-600 text-white">Task 2</Badge>
                              <p className="font-bold text-slate-800">{testData.writing.task2.prompt}</p>
                              <Textarea 
                                placeholder="Write your Task 2 response here (min 250 words)..."
                                className="min-h-[300px] rounded-2xl border-slate-200"
                                value={userAnswers['writing']?.['task2'] || ''}
                                onChange={(e) => updateAnswer('writing', 'task2', e.target.value)}
                              />
                           </div>
                        </div>
                      ) : null) ||
                      (mod.toLowerCase() === 'speaking' && testData.speaking ? (
                         <div className="space-y-10">
                            {/* Part 1 */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-lg shadow-blue-100">1</div>
                                    <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest">Part 1: Introduction & Interview</h4>
                                </div>
                                <div className="grid gap-4">
                                    {(testData.speaking.part1 || []).map((q: any, i: number) => (
                                        <div key={i} className="p-5 border-2 border-slate-100 rounded-[24px] bg-white hover:border-blue-100 transition-all space-y-4 shadow-sm">
                                            <p className="text-base font-bold text-slate-800 flex items-start gap-3">
                                                <span className="text-blue-500 mt-1 shrink-0">•</span>
                                                {typeof q === 'string' ? q : (q.question || q.text || "Question")}
                                            </p>
                                            <div className="flex items-center gap-3">
                                                <Button 
                                                    size="sm" 
                                                    variant={activeSpeechKey === `speaking-1-${i}` ? "destructive" : "secondary"}
                                                    onClick={() => activeSpeechKey === `speaking-1-${i}` ? stopRecording() : startRecording('speaking', `speaking-1-${i}`)}
                                                    className={`rounded-full h-10 px-6 font-bold transition-all ${activeSpeechKey === `speaking-1-${i}` ? 'animate-pulse' : ''}`}
                                                >
                                                    {activeSpeechKey === `speaking-1-${i}` ? <Square className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
                                                    {activeSpeechKey === `speaking-1-${i}` ? "Listening..." : "Record Answer"}
                                                </Button>
                                                {userAnswers['speaking']?.[`speaking-1-${i}`] && (
                                                    <Badge variant="outline" className="text-[10px] border-emerald-200 text-emerald-600 bg-emerald-50 py-1">Captured</Badge>
                                                )}
                                            </div>
                                            {userAnswers['speaking']?.[`speaking-1-${i}`] && (
                                                <div className="text-xs text-slate-500 italic bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200 leading-relaxed">
                                                    "{userAnswers['speaking'][`speaking-1-${i}`]}"
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Part 2 */}
                            <div className="space-y-6 pt-4 border-t border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-lg shadow-blue-100">2</div>
                                    <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest">Part 2: Individual Long Turn (Cue Card)</h4>
                                </div>
                                <div className="bg-slate-900 text-white p-6 md:p-10 rounded-[32px] border-4 border-slate-800 space-y-6 shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-blue-600/20 transition-all" />
                                    <div className="relative z-10 space-y-4">
                                        <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/30 hover:bg-blue-600/30 uppercase text-[10px] tracking-widest font-bold">Preparation: 1 Minute</Badge>
                                        <div>
                                            <h5 className="text-xl md:text-2xl font-black text-white leading-tight">{testData.speaking.part2?.topic}</h5>
                                            <p className="text-slate-400 mt-2 text-sm italic">You should say:</p>
                                            <ul className="mt-4 space-y-3">
                                                {(testData.speaking.part2?.bullets || testData.speaking.part2?.questions || []).map((b: any, i: number) => (
                                                    <li key={i} className="text-sm md:text-base font-medium flex items-center gap-3">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                        {typeof b === 'string' ? b : (b.question || b.text || "Instruction")}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="pt-4 flex flex-col sm:flex-row gap-4">
                                            <Button 
                                                size="lg" 
                                                variant={activeSpeechKey === `speaking-2` ? "destructive" : "default"}
                                                onClick={() => activeSpeechKey === `speaking-2` ? stopRecording() : startRecording('speaking', `speaking-2`)}
                                                className={`rounded-full h-12 md:h-14 px-8 font-black transition-all ${activeSpeechKey === `speaking-2` ? 'animate-pulse' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/40'}`}
                                            >
                                                {activeSpeechKey === `speaking-2` ? <Square className="w-5 h-5 mr-3" /> : <Mic className="w-5 h-5 mr-3" />}
                                                {activeSpeechKey === `speaking-2` ? "Stop" : "Start Speaking (2 Min)"}
                                            </Button>
                                            {userAnswers['speaking']?.[`speaking-2`] && (
                                                <div className="flex-1 text-[10px] md:text-xs text-slate-400 italic bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center">
                                                    "{userAnswers['speaking'][`speaking-2`].substring(0, 100)}..."
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Part 3 */}
                            <div className="space-y-6 pt-4 border-t border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-lg shadow-blue-100">3</div>
                                    <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest">Part 3: Two-Way Discussion</h4>
                                </div>
                                <div className="grid gap-4">
                                    {(testData.speaking.part3 || []).map((q: any, i: number) => (
                                        <div key={i} className="p-5 border-2 border-slate-100 rounded-[24px] bg-white hover:border-blue-100 transition-all space-y-4 shadow-sm">
                                            <p className="text-base font-bold text-slate-800 flex items-start gap-3">
                                                <span className="text-blue-500 mt-1 shrink-0">•</span>
                                                {typeof q === 'string' ? q : (q.question || q.text || "Question")}
                                            </p>
                                            <div className="flex items-center gap-3">
                                                <Button 
                                                    size="sm" 
                                                    variant={activeSpeechKey === `speaking-3-${i}` ? "destructive" : "secondary"}
                                                    onClick={() => activeSpeechKey === `speaking-3-${i}` ? stopRecording() : startRecording('speaking', `speaking-3-${i}`)}
                                                    className={`rounded-full h-10 px-6 font-bold transition-all ${activeSpeechKey === `speaking-3-${i}` ? 'animate-pulse' : ''}`}
                                                >
                                                    {activeSpeechKey === `speaking-3-${i}` ? <Square className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
                                                    {activeSpeechKey === `speaking-3-${i}` ? "Listening..." : "Record Answer"}
                                                </Button>
                                            </div>
                                            {userAnswers['speaking']?.[`speaking-3-${i}`] && (
                                                <div className="text-xs text-slate-500 italic bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200 leading-relaxed">
                                                    "{userAnswers['speaking'][`speaking-3-${i}`]}"
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                         </div>
                      ) : null)}
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
            <div className="flex gap-4 pt-4">
              <Button variant="outline" onClick={() => {
                setStep('setup');
                setIsReviewMode(false);
              }} className="flex-1 h-12 rounded-xl font-bold border-slate-200">
                {isReviewMode ? "Back to Dashboard" : "Exit Practice"}
              </Button>
              {isReviewMode ? (
                <Button onClick={() => setStep('results')} className="flex-1 bg-blue-600 hover:bg-blue-700 h-12 rounded-xl font-bold shadow-lg shadow-blue-100">
                   Back to Scores
                </Button>
              ) : (
                <Button onClick={submitAnswers} disabled={loading || Object.keys(userAnswers).length === 0} className="flex-1 bg-green-600 hover:bg-green-700 h-12 rounded-xl font-bold shadow-lg shadow-green-100">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                    Submit & Evaluate
                </Button>
              )}
            </div>
          </>
        )}

        {step === 'results' && evaluation && (
          <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
            <Card className="border-0 shadow-2xl bg-slate-900 text-white rounded-[24px] md:rounded-[40px] overflow-hidden">
                <CardHeader className="text-center p-8 md:p-12">
                <Trophy className="w-12 h-12 md:w-20 md:h-20 mx-auto text-yellow-500 mb-4 animate-bounce" />
                <CardTitle className="text-4xl md:text-6xl font-black text-white tracking-tight">
                    Band {evaluation.overallBand}
                </CardTitle>
                <p className="text-base md:text-xl font-bold text-slate-400 mt-2 italic">Official Simulation Result</p>
                </CardHeader>
                <CardContent className="px-6 md:px-12 pb-8 md:pb-12">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    {Object.entries(evaluation.moduleBands).map(([mod, band]: any) => (
                        <Card key={mod} className="text-center border-0 shadow-sm rounded-xl md:rounded-2xl bg-white/10 backdrop-blur-md p-4 md:p-6">
                            <div className="text-xl md:text-3xl font-black text-white mb-1">{band}</div>
                            <div className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-slate-400">{mod}</div>
                        </Card>
                    ))}
                </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="flex overflow-x-auto flex-nowrap h-auto bg-slate-100 rounded-xl md:rounded-2xl p-1 mb-6 md:mb-8 scrollbar-hide min-w-full">
                    {['overview', 'listening', 'reading', 'writing', 'speaking'].map((val) => (
                      <TabsTrigger key={val} value={val} className="rounded-lg md:rounded-xl px-4 py-2 text-xs md:text-sm capitalize flex-shrink-0">
                        {val}
                      </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-8">
                        <Card className="rounded-[32px] border-slate-200 shadow-sm p-8 space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <Info className="w-4 h-4" /> Examiner's Detailed Feedback
                            </h3>
                            <div className="prose prose-slate text-slate-700 leading-relaxed">
                                {evaluation.detailedFeedback}
                            </div>
                        </Card>
                        <Card className="rounded-[32px] border-slate-200 shadow-sm p-8 space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" /> Targeted Suggestions
                            </h3>
                            <div className="space-y-3">
                                {Array.isArray(evaluation.suggestions) && evaluation.suggestions.map((s: string, i: number) => (
                                    <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border-l-4 border-l-blue-500">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />
                                        <span className="text-sm font-medium text-slate-700">{s}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="listening" className="space-y-6">
                    <div className="grid gap-4">
                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xl">
                                {evaluation.criteriaBreakdown?.listening?.rawScore || 'N/A'}
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900">Listening Performance</h4>
                                <p className="text-xs text-slate-500">Question-by-question discussion and script analysis.</p>
                            </div>
                        </div>
                        {Array.isArray(evaluation.discussion?.listening) && evaluation.discussion.listening.map((item: any, idx: number) => (
                            <Card key={idx} className={`rounded-2xl border-slate-200 overflow-hidden ${item.isCorrect ? 'bg-emerald-50/30' : 'bg-red-50/30'}`}>
                                <div className="p-6 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Badge variant={item.isCorrect ? "default" : "destructive"} className={`rounded-full ${item.isCorrect ? 'bg-emerald-500 text-white' : ''}`}>
                                            {item.isCorrect ? "Correct" : "Incorrect"}
                                        </Badge>
                                        <span className="text-xs font-bold text-slate-400">Question {item.questionId}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="p-3 bg-white rounded-xl border">
                                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Your Answer</p>
                                            <p className="font-medium text-slate-700">{item.userAnswer || 'No answer'}</p>
                                        </div>
                                        <div className="p-3 bg-white rounded-xl border">
                                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Correct Answer</p>
                                            <p className="font-black text-slate-900">{item.correctAnswer}</p>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-white/50 rounded-xl text-sm italic text-slate-600 border border-dashed">
                                        <span className="font-bold text-slate-900 not-italic mr-1">Discussion:</span> {item.explanation}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="reading" className="space-y-6">
                    <div className="grid gap-4">
                        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl">
                                {evaluation.criteriaBreakdown?.reading?.rawScore || 'N/A'}
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900">Reading Analysis</h4>
                                <p className="text-xs text-slate-500">Detailed evidence from the passage for each question.</p>
                            </div>
                        </div>
                        {Array.isArray(evaluation.discussion?.reading) && evaluation.discussion.reading.map((item: any, idx: number) => (
                            <Card key={idx} className={`rounded-2xl border-slate-200 overflow-hidden ${item.isCorrect ? 'bg-emerald-50/30' : 'bg-red-50/30'}`}>
                                <div className="p-6 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Badge variant={item.isCorrect ? "default" : "destructive"} className={`rounded-full ${item.isCorrect ? 'bg-emerald-500 text-white' : ''}`}>
                                            {item.isCorrect ? "Correct" : "Incorrect"}
                                        </Badge>
                                        <span className="text-xs font-bold text-slate-400">Question {item.questionId}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="p-3 bg-white rounded-xl border">
                                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Your Answer</p>
                                            <p className="font-medium text-slate-700">{item.userAnswer || 'No answer'}</p>
                                        </div>
                                        <div className="p-3 bg-white rounded-xl border">
                                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Correct Answer</p>
                                            <p className="font-black text-slate-900">{item.correctAnswer}</p>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-white/50 rounded-xl text-sm italic text-slate-600 border border-dashed">
                                        <span className="font-bold text-slate-900 not-italic mr-1">Evidence:</span> {item.explanation}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="writing" className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        {['task1', 'task2'].map((task) => (
                            <Card key={task} className="rounded-[32px] border-slate-200 overflow-hidden flex flex-col">
                                <CardHeader className="bg-slate-50 border-b">
                                    <Badge className="w-fit mb-2 uppercase">{task.replace('task', 'Task ')}</Badge>
                                    <CardTitle className="text-lg">Response Analysis</CardTitle>
                                </CardHeader>
                                <CardContent className="p-8 space-y-6 flex-1">
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-black text-emerald-600 uppercase tracking-tighter">Strengths</h4>
                                        <p className="text-sm text-slate-600">{evaluation.discussion?.writing?.[task]?.strengths}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-black text-amber-600 uppercase tracking-tighter">Weaknesses</h4>
                                        <p className="text-sm text-slate-600">{evaluation.discussion?.writing?.[task]?.weaknesses}</p>
                                    </div>
                                    
                                    {evaluation.discussion?.writing?.[task]?.technicalCheck?.grammarFixes?.length > 0 && (
                                        <div className="space-y-3 pt-4 border-t border-slate-100">
                                            <h4 className="text-[10px] font-black text-red-600 uppercase tracking-widest">Grammar & Accuracy</h4>
                                            <div className="space-y-2">
                                                {evaluation.discussion.writing[task].technicalCheck.grammarFixes.map((fix: string, i: number) => (
                                                    <div key={i} className="text-[11px] p-3 rounded-xl bg-red-50 border border-red-100 text-red-800 leading-relaxed italic">
                                                        {fix}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {evaluation.discussion?.writing?.[task]?.technicalCheck?.vocabularyUpgrades?.length > 0 && (
                                        <div className="space-y-3 pt-4 border-t border-slate-100">
                                            <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Vocabulary Upgrades</h4>
                                            <div className="space-y-2">
                                                {evaluation.discussion.writing[task].technicalCheck.vocabularyUpgrades.map((up: string, i: number) => (
                                                    <div key={i} className="text-[11px] p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 leading-relaxed italic">
                                                        {up}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 mt-auto">
                                        <h4 className="text-xs font-black text-blue-600 uppercase tracking-tighter mb-2">Examiner Suggestion</h4>
                                        <p className="text-sm text-slate-700 font-medium">{evaluation.discussion?.writing?.[task]?.suggestedImprovement || evaluation.discussion?.writing?.[task]?.improvement}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="speaking" className="space-y-6">
                    <Card className="rounded-[40px] border-slate-200 overflow-hidden">
                        <CardHeader className="bg-slate-900 text-white p-10">
                            <h3 className="text-2xl font-black">Speaking Performance Breakdown</h3>
                            <p className="text-slate-400">Analysis of your fluency, pronunciation, and content development.</p>
                        </CardHeader>
                        <CardContent className="p-10 space-y-8">
                            <div className="grid md:grid-cols-3 gap-6">
                                {['part1', 'part2', 'part3'].map((part) => (
                                    <div key={part} className="space-y-3">
                                        <h4 className="font-bold text-blue-600 uppercase text-xs tracking-widest">{part.replace('part', 'Part ')}</h4>
                                        <div className="p-4 rounded-2xl bg-slate-50 border text-sm text-slate-600 leading-relaxed min-h-[150px]">
                                            <p className="mb-4">{evaluation.discussion?.speaking?.[part]?.feedback || evaluation.discussion?.speaking?.[part]}</p>
                                            
                                            {evaluation.discussion?.speaking?.[part]?.technicalCheck?.grammarFixes?.length > 0 && (
                                                <div className="space-y-2 mt-4 pt-4 border-t border-slate-200">
                                                    <p className="text-[10px] font-black text-red-600 uppercase">Grammar Fixes</p>
                                                    {evaluation.discussion.speaking[part].technicalCheck.grammarFixes.map((fix: string, i: number) => (
                                                        <p key={i} className="text-[11px] text-slate-500 italic">- {fix}</p>
                                                    ))}
                                                </div>
                                            )}

                                            {evaluation.discussion?.speaking?.[part]?.technicalCheck?.vocabularyUpgrades?.length > 0 && (
                                                <div className="space-y-2 mt-4 pt-4 border-t border-slate-200">
                                                    <p className="text-[10px] font-black text-emerald-600 uppercase">Vocab Upgrades</p>
                                                    {evaluation.discussion.speaking[part].technicalCheck.vocabularyUpgrades.map((up: string, i: number) => (
                                                        <p key={i} className="text-[11px] text-slate-500 italic">- {up}</p>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-6 bg-emerald-50 rounded-[32px] border border-emerald-100 flex items-start gap-4">
                                <Trophy className="w-8 h-8 text-emerald-500 shrink-0 mt-1" />
                                <div>
                                    <h4 className="font-bold text-emerald-900">Final Verdict</h4>
                                    <p className="text-sm text-emerald-700">{evaluation.criteriaBreakdown?.speaking?.fluency}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="flex gap-4">
                <Button variant="outline" onClick={() => {
                    setStep('setup');
                    setIsReviewMode(false);
                }} className="flex-1 h-14 rounded-2xl font-bold border-slate-200 text-lg">
                    Return to Dashboard
                </Button>
                <Button 
                    onClick={() => {
                        setStep('test');
                        setIsReviewMode(true);
                        setCurrentModule('Listening');
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-14 rounded-2xl font-bold shadow-xl text-lg"
                >
                    <History className="w-5 h-5 mr-2" /> Review Detailed Answers
                </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
