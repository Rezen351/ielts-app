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
  Pause
} from 'lucide-react';
import Link from 'next/link';
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';

interface UserAnswers {
  [module: string]: {
    [questionId: string]: string;
  };
}

export default function ExaminerPage() {
  const [step, setStep] = useState<'setup' | 'test' | 'answers' | 'results'>('setup');
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

  // Speech Refs
  const recognizerRef = useRef<SpeechSDK.SpeechRecognizer | null>(null);
  const playerRef = useRef<SpeechSDK.SpeakerAudioDestination | null>(null);
  const synthesizerRef = useRef<SpeechSDK.SpeechSynthesizer | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSpeechKey, setActiveSpeechKey] = useState<string | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
    fetchPackages();

    return () => {
        stopAudio();
        stopRecording();
    };
  }, []);

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
    if (isPlaying && activeSpeechKey === `listening-${sectionIdx}`) {
        stopAudio();
        return;
    }
    stopAudio();

    try {
        const tokenRes = await fetch('/api/auth/speech-token');
        const { token, region } = await tokenRes.json();

        const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(token, region);
        speechConfig.speechSynthesisLanguage = "en-GB";

        playerRef.current = new SpeechSDK.SpeakerAudioDestination();
        const audioConfig = SpeechSDK.AudioConfig.fromSpeakerOutput(playerRef.current);
        synthesizerRef.current = new SpeechSDK.SpeechSynthesizer(speechConfig, audioConfig);

        playerRef.current.onAudioEnd = () => {
            setIsPlaying(false);
            setActiveSpeechKey(null);
        };

        const ssml = `
            <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-GB">
                <voice name="en-GB-SoniaNeural">
                    ${section.script.replace(/[<>&"']/g, (c: string) => {
                        switch (c) {
                            case '<': return '&lt;';
                            case '>': return '&gt;';
                            case '&': return '&amp;';
                            case '"': return '&quot;';
                            case "'": return '&apos;';
                            default: return c;
                        }
                    })}
                </voice>
            </speak>
        `;

        setIsPlaying(true);
        setActiveSpeechKey(`listening-${sectionIdx}`);
        synthesizerRef.current.speakSsmlAsync(ssml, () => {}, (err) => {
            console.error("Speech Execution Error:", err);
            setIsPlaying(false);
            setActiveSpeechKey(null);
        });

    } catch (err) {
        toast.error("Audio Initialization Error");
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
      // Clean up incomplete package if possible
      if (packageId) {
        await fetch('/api/generate/examiner', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'deletePackage', packageId: packageId }) // Need to implement this action
        });
      }
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

  const updateAnswer = (module: string, questionId: string, answer: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [module]: {
        ...prev[module],
        [questionId]: answer
      }
    }));
  };

  const renderQuestion = (module: string, question: any, key: any) => {
    return (
      <div key={key} className="space-y-2 p-4 sm:p-6 border rounded-xl bg-slate-50">
        <p className="font-bold text-slate-900">{question.text}</p>
        {question.options ? (
          question.options.map((opt: string, i: number) => (
            <label
              key={i}
              className="flex items-center gap-2 p-2 sm:p-3 border rounded-lg cursor-pointer hover:bg-white text-sm sm:text-base"
            >
              <input 
                type="radio" 
                name={`${module}-${question.id}`} 
                value={opt}
                checked={userAnswers[module]?.[question.id] === opt}
                onChange={(e) => updateAnswer(module, question.id.toString(), e.target.value)}
                className="w-4 h-4 text-blue-600"
              />
              <span>{opt}</span>
            </label>
          ))
        ) : (
          <Input 
            placeholder="Your answer..."
            value={userAnswers[module]?.[question.id] || ''}
            onChange={(e) => updateAnswer(module, question.id.toString(), e.target.value)}
          />
        )}
      </div>
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
        <div className="max-w-4xl mx-auto space-y-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/dashboard" className="flex items-center gap-2 text-slate-600">
              <ArrowLeft className="w-5 h-5" /> Dashboard
            </Link>
          </Button>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl">
              <CardHeader className="text-center">
                <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <CardTitle className="text-3xl font-black bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  New Test
                </CardTitle>
                <p className="text-slate-500">Generate a fresh IELTS simulation</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label>Test Type</Label>
                    <select 
                      value={testType} 
                      onChange={(e) => setTestType(e.target.value as any)}
                      className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option>Academic</option>
                      <option>General</option>
                    </select>
                  </div>
                  <div>
                    <Label>Difficulty</Label>
                    <select 
                      value={difficulty} 
                      onChange={(e) => setDifficulty(e.target.value as any)}
                      className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
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
                  className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-xl text-lg"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
                  Generate New Test
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl">
              <CardHeader className="text-center">
                <History className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                <CardTitle className="text-3xl font-black text-slate-900">
                  Saved Tests
                </CardTitle>
                <p className="text-slate-500">Retry or continue previous packages</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {savedPackages.length === 0 ? (
                    <p className="text-center text-slate-400 py-8 italic text-sm">No saved tests yet</p>
                  ) : (
                    savedPackages.map((pkg) => (
                      <button
                        key={pkg._id}
                        onClick={() => loadPackage(pkg)}
                        className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white hover:border-blue-200 hover:bg-blue-50/50 transition-all text-left group"
                      >
                        <div>
                          <p className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">{pkg.title}</p>
                          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-1">
                            {pkg.difficulty} • {new Date(pkg.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Play className="w-4 h-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
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
                          {section.questions.map((q: any, qIdx: number) => renderQuestion(mod, q, `${mod}-sec-${sIdx}-q-${qIdx}`))}
                        </div>
                      )) || 
                      (testData[mod.toLowerCase()] || {}).passages?.map((passage: any, pIdx: number) => (
                        <div key={pIdx} className="space-y-6">
                          <h3 className="font-bold text-xl text-blue-600">Passage {pIdx + 1}: {passage.title}</h3>
                          <div className="prose prose-slate max-w-none bg-slate-50 p-6 rounded-2xl border mb-6">
                              <p className="text-sm leading-relaxed italic">{passage.text}</p>
                          </div>
                          {passage.questions?.map((q: any, qIdx: number) => renderQuestion(mod, q, `${mod}-pas-${pIdx}-q-${qIdx}`))}
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
                         <div className="space-y-8">
                            <div className="space-y-4">
                                <h4 className="font-bold text-blue-600 uppercase text-xs">Part 1: Introduction</h4>
                                {testData.speaking.part1?.map((q: any, i: number) => (
                                    <div key={i} className="p-4 border rounded-xl bg-slate-50 space-y-3">
                                        <p className="text-sm font-bold">• {typeof q === 'string' ? q : q.text}</p>
                                        <div className="flex gap-2">
                                            <Button 
                                                size="sm" 
                                                variant={activeSpeechKey === `speaking-1-${i}` ? "destructive" : "outline"}
                                                onClick={() => activeSpeechKey === `speaking-1-${i}` ? stopRecording() : startRecording('speaking', `speaking-1-${i}`)}
                                                className="rounded-full h-8"
                                            >
                                                {activeSpeechKey === `speaking-1-${i}` ? <Square className="w-3 h-3 mr-2" /> : <Mic className="w-3 h-3 mr-2" />}
                                                {activeSpeechKey === `speaking-1-${i}` ? "Stop" : "Record Answer"}
                                            </Button>
                                        </div>
                                        {userAnswers['speaking']?.[`speaking-1-${i}`] && (
                                            <div className="text-xs text-slate-500 italic bg-white p-2 rounded border">
                                                Transcript: {userAnswers['speaking'][`speaking-1-${i}`]}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-4 border-t pt-8">
                                <h4 className="font-bold text-blue-600 uppercase text-xs">Part 2: Cue Card</h4>
                                <div className="bg-slate-50 p-6 rounded-2xl border space-y-4">
                                    <div>
                                        <p className="font-bold">{testData.speaking.part2?.topic}</p>
                                        <ul className="mt-2 space-y-1">
                                            {testData.speaking.part2?.bullets?.map((b: string, i: number) => <li key={i} className="text-sm font-medium">• {b}</li>)}
                                        </ul>
                                    </div>
                                    <Button 
                                        size="sm" 
                                        variant={activeSpeechKey === `speaking-2` ? "destructive" : "outline"}
                                        onClick={() => activeSpeechKey === `speaking-2` ? stopRecording() : startRecording('speaking', `speaking-2`)}
                                        className="rounded-full h-8"
                                    >
                                        {activeSpeechKey === `speaking-2` ? <Square className="w-3 h-3 mr-2" /> : <Mic className="w-3 h-3 mr-2" />}
                                        {activeSpeechKey === `speaking-2` ? "Stop" : "Record Long Turn"}
                                    </Button>
                                    {userAnswers['speaking']?.[`speaking-2`] && (
                                        <div className="text-xs text-slate-500 italic bg-white p-2 rounded border">
                                            Transcript: {userAnswers['speaking'][`speaking-2`]}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-4 border-t pt-8">
                                <h4 className="font-bold text-blue-600 uppercase text-xs">Part 3: Discussion</h4>
                                {testData.speaking.part3?.map((q: any, i: number) => (
                                    <div key={i} className="p-4 border rounded-xl bg-slate-50 space-y-3">
                                        <p className="text-sm font-bold">• {typeof q === 'string' ? q : q.text}</p>
                                        <div className="flex gap-2">
                                            <Button 
                                                size="sm" 
                                                variant={activeSpeechKey === `speaking-3-${i}` ? "destructive" : "outline"}
                                                onClick={() => activeSpeechKey === `speaking-3-${i}` ? stopRecording() : startRecording('speaking', `speaking-3-${i}`)}
                                                className="rounded-full h-8"
                                            >
                                                {activeSpeechKey === `speaking-3-${i}` ? <Square className="w-3 h-3 mr-2" /> : <Mic className="w-3 h-3 mr-2" />}
                                                {activeSpeechKey === `speaking-3-${i}` ? "Stop" : "Record Answer"}
                                            </Button>
                                        </div>
                                        {userAnswers['speaking']?.[`speaking-3-${i}`] && (
                                            <div className="text-xs text-slate-500 italic bg-white p-2 rounded border">
                                                Transcript: {userAnswers['speaking'][`speaking-3-${i}`]}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                         </div>
                      ) : null)}
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
            <div className="flex gap-4 pt-4">
              <Button variant="outline" onClick={() => setStep('setup')} className="flex-1 h-12 rounded-xl font-bold border-slate-200">
                Exit Practice
              </Button>
              <Button onClick={submitAnswers} disabled={loading || Object.keys(userAnswers).length === 0} className="flex-1 bg-green-600 hover:bg-green-700 h-12 rounded-xl font-bold shadow-lg shadow-green-100">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Submit & Evaluate
              </Button>
            </div>
          </>
        )}

        {step === 'results' && evaluation && (
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-green-50 to-emerald-50 rounded-[40px] overflow-hidden">
            <CardHeader className="text-center p-12">
              <Trophy className="w-20 h-20 mx-auto text-emerald-500 mb-4" />
              <CardTitle className="text-5xl font-black text-emerald-600 tracking-tight">
                Band {evaluation.overallBand}
              </CardTitle>
              <p className="text-2xl font-bold text-slate-700">Overall Performance</p>
            </CardHeader>
            <CardContent className="px-12 pb-12">
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {Object.entries(evaluation.moduleBands).map(([mod, band]: any) => (
                    <Card key={mod} className="text-center border-0 shadow-sm rounded-2xl bg-white p-6">
                        <div className="text-3xl font-black text-emerald-600 mb-1">{band}</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{mod}</div>
                    </Card>
                ))}
               </div>

                <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Detailed Feedback</h3>
                    <div className="bg-white p-6 rounded-3xl shadow-sm text-sm leading-relaxed text-slate-600 prose prose-slate">
                        {evaluation.detailedFeedback}
                    </div>
                </div>
                <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Targeted Suggestions</h3>
                    <div className="space-y-3">
                        {evaluation.suggestions.map((s: string, i: number) => (
                        <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-white shadow-sm border-l-4 border-l-emerald-500">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                            <span className="text-sm font-medium text-slate-700">{s}</span>
                        </div>
                        ))}
                    </div>
                </div>
                </div>

                <div className="mt-12 flex gap-4">
                    <Button variant="outline" onClick={() => setStep('setup')} className="flex-1 h-12 rounded-xl font-bold border-slate-200">
                        Try Another Test
                    </Button>
                    <Button className="flex-1 bg-slate-900 hover:bg-slate-800 text-white h-12 rounded-xl font-bold shadow-xl" onClick={() => {
                        const dataStr = JSON.stringify(evaluation, null, 2);
                        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                        const linkElement = document.createElement('a');
                        linkElement.setAttribute('href', dataUri);
                        linkElement.setAttribute('download', `ielts-results-${Date.now()}.json`);
                        linkElement.click();
                    }}>
                        <Download className="w-4 h-4 mr-2" /> Download Report
                    </Button>
                </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
