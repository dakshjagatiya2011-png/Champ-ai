
import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Image as ImageIcon, Sparkles, Paperclip, ChevronDown, Mic, MicOff, Camera, X, Bell, LayoutGrid, Share2, Copy, Check, Globe, ShieldCheck, Crown, Zap, ShoppingBag, ChevronRight, Smartphone, FileText, Settings, Volume2, Database, Trash2, Archive, Download, ExternalLink, Moon, Sun, Languages, MessageSquare, Shield, Info, Video, Play, BookOpen, Edit3, CheckCircle, Monitor, Brain, Upload, BarChart3, PlusCircle, CreditCard, Wallet, Code, LogOut, Github } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Sidebar from './Sidebar';
import Logo from './Logo';
import { GeminiService } from '../services/geminiService';
import { OpenAIService } from '../services/openaiService';
import { Message, UserProfile } from '../types';

interface Attachment {
  data: string;
  mimeType: string;
  preview: string;
}

const STORAGE_KEY = 'champ_chat_history';

interface DashboardProps {
  user: UserProfile;
  onOpenAppStore?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onOpenAppStore }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chats, setChats] = useState<{ id: string, title: string, timestamp: string, mode?: string }[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isVideoGeneratorMode, setIsVideoGeneratorMode] = useState(false);
  const [imgSize, setImgSize] = useState<'1K' | '2K' | '4K' | '5K'>('1K');
  const [premiumTier, setPremiumTier] = useState<0 | 1 | 2 | 3>(0); // 0: Free, 1: Champ Pro, 2: Champ 3.0, 3: Champ 3.0 Pro
  const [showShareModal, setShowShareModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState<1 | 2 | 3 | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'general' | 'personalization' | 'speech' | 'data' | 'about' | 'brain'>('general');
  const [settings, setSettings] = useState({
    theme: 'dark',
    language: 'English',
    voice: 'Zephyr',
    chatHistory: true,
    training: true,
    customInstructions: '',
    responseStyle: 'Concise',
    googleConnected: false,
    googleEmail: '',
    knowledgeBase: ''
  });
  const [copied, setCopied] = useState(false);
  const [isAppMakerMode, setIsAppMakerMode] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [showCodePreview, setShowCodePreview] = useState(false);
  const [showCodeView, setShowCodeView] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [githubToken, setGithubToken] = useState<string | null>(null);
  const [showGithubModal, setShowGithubModal] = useState(false);
  const [repoName, setRepoName] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'gemini' | 'openai'>('openai');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        const { tokens } = event.data;
        // In a real app, you'd decode the ID token to get the email
        setSettings(prev => ({ ...prev, googleConnected: true, googleEmail: 'Connected' }));
        alert('Google Account connected successfully, champ!');
      }
      if (event.data?.type === 'GITHUB_AUTH_SUCCESS') {
        setGithubToken(event.data.token);
        setShowGithubModal(true);
      }
    };
    window.addEventListener('message', handleMessage);
    
    // Fetch chat history on mount
    fetchChats();
    
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handlePublishToGithub = async () => {
    if (!githubToken) {
      try {
        const res = await fetch('/api/auth/github/url');
        if (!res.ok) {
          const err = await res.json();
          alert(`GitHub integration is not configured.\n\nPlease set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in your .env file.`);
          return;
        }
        const { url } = await res.json();
        window.open(url, 'github_oauth', 'width=600,height=700');
      } catch (e) {
        console.error("Failed to get GitHub auth URL", e);
        alert("Failed to initiate GitHub login. Please try again.");
      }
      return;
    }
    setShowGithubModal(true);
  };

  const confirmPublish = async () => {
    if (!repoName.trim()) {
      alert("Please enter a repository name");
      return;
    }
    setIsPublishing(true);
    try {
      const res = await fetch('/api/github/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: githubToken,
          repoName,
          code: generatedCode
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Published successfully!\nRepo: ${data.repoUrl}\nPages: ${data.pagesUrl}`);
        setShowGithubModal(false);
      } else {
        alert('Failed to publish: ' + data.error);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to publish');
    } finally {
      setIsPublishing(false);
    }
  };

  const fetchChats = async () => {
    try {
      const res = await fetch('/api/chats');
      if (res.ok) {
        const data = await res.json();
        setChats(data);
      }
    } catch (e) {
      console.error('Failed to fetch chats', e);
    }
  };

  const handleSelectChat = async (id: string) => {
    try {
      const res = await fetch(`/api/chats/${id}`);
      if (res.ok) {
        const data = await res.json();
        
        // Reset generated code first
        setGeneratedCode('');
        
        // Restore generated code from message history if it exists
        const reversedMessages = [...data.messages].reverse();
        const lastCodeMessage = reversedMessages.find((m: Message) => m.role === 'assistant' && m.content && m.content.includes('```html'));
        
        if (lastCodeMessage) {
          const codeBlockRegex = /```html\n([\s\S]*?)```/;
          const match = lastCodeMessage.content.match(codeBlockRegex);
          if (match && match[1]) {
            setGeneratedCode(match[1]);
          }
        }

        // Strip code blocks from messages for UI display
        const uiMessages = data.messages.map((m: Message) => {
          if (m.role === 'assistant' && m.content && m.content.includes('```html')) {
            const codeBlockRegex = /```html\n([\s\S]*?)```/;
            let newContent = m.content.replace(codeBlockRegex, '').trim();
            if (!newContent) {
              newContent = "I've updated the app for you, champ. Check the preview!";
            }
            return { ...m, content: newContent };
          }
          return m;
        });

        setMessages(uiMessages);
        setCurrentChatId(id);
      }
    } catch (e) {
      console.error('Failed to select chat', e);
    }
  };

  const handleNewChat = async () => {
    setMessages([]);
    setCurrentChatId(null);
    setAttachments([]);
    setInput('');
    setGeneratedCode(''); // Clear generated code for new chat
  };

  const saveMessageToServer = async (chatId: string, message: Message) => {
    try {
      await fetch(`/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
    } catch (e) {
      console.error('Failed to save message', e);
    }
  };

  const createNewChatOnServer = async (firstMessage: string) => {
    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: firstMessage.substring(0, 30) + '...',
          mode: isAppMakerMode ? 'app-maker' : isVideoGeneratorMode ? 'video-generator' : 'normal'
        })
      });
      if (res.ok) {
        const newChat = await res.json();
        setChats(prev => [newChat, ...prev]);
        return newChat.id;
      }
    } catch (e) {
      console.error('Failed to create chat', e);
    }
    return null;
  };

  const handleGoogleConnect = async () => {
    try {
      const response = await fetch('/api/auth/google/url');
      if (!response.ok) throw new Error('Failed to get auth URL');
      const { url } = await response.json();
      
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      window.open(
        url,
        'google_oauth_popup',
        `width=${width},height=${height},left=${left},top=${top}`
      );
    } catch (error) {
      console.error('Google OAuth error:', error);
      alert('Failed to initiate Google connection.');
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    // Reset filters and styles first
    root.style.filter = 'none';
    
    if (settings.theme === 'dark') {
      root.classList.add('dark');
      root.style.setProperty('--bg-color', '#070707');
      document.body.style.backgroundColor = '#070707';
      document.body.style.color = '#ffffff';
      root.style.filter = 'none';
    } else if (settings.theme === 'light') {
      root.classList.remove('dark');
      root.style.setProperty('--bg-color', '#ffffff');
      document.body.style.backgroundColor = '#ffffff';
      document.body.style.color = '#000000';
      root.style.filter = 'none';
    } else if (settings.theme === 'eye-protection') {
      root.classList.remove('dark');
      root.style.setProperty('--bg-color', '#F5F0E6'); // Warm beige
      document.body.style.backgroundColor = '#F5F0E6';
      document.body.style.color = '#000000'; // Pure black as requested
      root.style.filter = 'none'; // Only background should be changed
    } else {
      // System default
      root.style.filter = 'none';
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
        root.style.setProperty('--bg-color', '#070707');
        document.body.style.backgroundColor = '#070707';
        document.body.style.color = '#ffffff';
      } else {
        root.classList.remove('dark');
        root.style.setProperty('--bg-color', '#ffffff');
        document.body.style.backgroundColor = '#ffffff';
        document.body.style.color = '#000000';
      }
    }
  }, [settings.theme]);

    useEffect(() => {
    try {
      const messagesToSave = messages.map(msg => ({
        ...msg,
        fileUrl: msg.fileUrl && msg.fileUrl.length > 100000 ? undefined : msg.fileUrl,
        imageUrl: msg.imageUrl && msg.imageUrl.length > 100000 ? undefined : msg.imageUrl,
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messagesToSave));
    } catch (e) {
      console.warn('Failed to save chat history to localStorage', e);
    }
  }, [messages]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setInput(prev => {
            const newInput = prev + (prev.length > 0 && !prev.endsWith(' ') ? ' ' : '') + finalTranscript;
            return newInput;
          });
          
          if (isVoiceMode) {
            // In voice mode, we might want to wait a bit or just send it
            // For now, let's just update input and let onend handle the "send" if we want it automatic
          }
        }
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
        setIsVoiceMode(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
        // If we were in voice mode and have input, send it
        if (isVoiceMode) {
          // We need a way to trigger handleSend from here
          // Since handleSend depends on current state, it's better to use a ref or a separate function
          document.getElementById('send-button')?.click();
        }
      };
    }
  }, [isVoiceMode]); // Re-init when isVoiceMode changes to capture it in closures if needed

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const getMimeType = (file: File): string => {
    // If the browser detects a valid mime type that is not generic, use it
    if (file.type && file.type !== 'application/octet-stream') return file.type;
    
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf': return 'application/pdf';
      case 'txt': return 'text/plain';
      case 'html': return 'text/html';
      case 'css': return 'text/css';
      case 'js': return 'text/javascript';
      case 'ts': return 'text/x-typescript';
      case 'csv': return 'text/csv';
      case 'md': return 'text/markdown';
      case 'py': return 'text/x-python';
      case 'json': return 'application/json';
      case 'xml': return 'text/xml';
      case 'rtf': return 'application/rtf';
      case 'c': return 'text/x-c';
      case 'cpp': return 'text/x-c++';
      case 'java': return 'text/x-java-source';
      case 'cs': return 'text/plain'; // C#
      case 'go': return 'text/plain';
      case 'rs': return 'text/plain'; // Rust
      case 'php': return 'text/x-php';
      case 'rb': return 'text/x-ruby';
      case 'sh': return 'text/x-shellscript';
      case 'yaml': 
      case 'yml': return 'text/yaml';
      case 'png': return 'image/png';
      case 'jpg': 
      case 'jpeg': return 'image/jpeg';
      case 'webp': return 'image/webp';
      case 'heic': return 'image/heic';
      case 'heif': return 'image/heif';
      case 'wav': return 'audio/wav';
      case 'mp3': return 'audio/mp3';
      case 'aiff': return 'audio/aiff';
      case 'aac': return 'audio/aac';
      case 'ogg': return 'audio/ogg';
      case 'flac': return 'audio/flac';
      case 'mp4': return 'video/mp4';
      case 'mpeg': return 'video/mpeg';
      case 'mov': return 'video/mov';
      case 'avi': return 'video/avi';
      case 'flv': return 'video/x-flv';
      case 'mpg': return 'video/mpg';
      case 'webm': return 'video/webm';
      case 'wmv': return 'video/wmv';
      case '3gp': return 'video/3gpp';
      default: return 'text/plain'; // Fallback to text/plain for unknown types to avoid octet-stream error
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const isTextFile = file.type.startsWith('text/') || 
                         file.name.match(/\.(txt|md|csv|json|xml|js|ts|py|c|cpp|java|html|css)$/i);
      
      const maxSize = isTextFile ? 2 * 1024 * 1024 : 10 * 1024 * 1024; // 2MB for text (~500k tokens), 10MB for others
      
      if (file.size > maxSize) {
        alert(`File ${file.name} is too large. Max size is ${isTextFile ? '2MB for text files' : '10MB'}.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        const base64Data = result.split(',')[1];
        setAttachments(prev => [...prev, {
          data: base64Data,
          mimeType: getMimeType(file),
          preview: result
        }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsVoiceMode(false);
    } else {
      // Stop any playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      recognitionRef.current.start();
      setIsListening(true);
      setIsVoiceMode(true);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText('https://www.champai.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = async () => {
    if (!input.trim() && attachments.length === 0) return;
    if (isListening) recognitionRef.current.stop();

    const currentInput = input;
    const currentAttachments = [...attachments];
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: currentInput,
      type: currentAttachments.length > 0 
        ? ((currentAttachments[0].mimeType || '').includes('image') ? 'image' : 'file')
        : 'text',
      timestamp: Date.now(),
      imageUrl: currentAttachments.length > 0 && (currentAttachments[0].mimeType || '').includes('image') 
        ? currentAttachments[0].preview 
        : undefined,
      fileUrl: currentAttachments.length > 0 && !(currentAttachments[0].mimeType || '').includes('image')
        ? currentAttachments[0].preview
        : undefined,
      mimeType: currentAttachments.length > 0 ? currentAttachments[0].mimeType : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAttachments([]);
    setIsTyping(true);

    let activeChatId = currentChatId;
    if (!activeChatId) {
      activeChatId = await createNewChatOnServer(currentInput || 'New Chat');
      setCurrentChatId(activeChatId);
    }
    
    if (activeChatId) {
      await saveMessageToServer(activeChatId, userMessage);
    }

    try {
      const geminiService = new GeminiService();
      const openaiService = new OpenAIService();

      if (isVideoGeneratorMode) {
        // Check API Key for Veo if using Gemini
        if (selectedModel === 'gemini' && window.aistudio && window.aistudio.hasSelectedApiKey) {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          if (!hasKey) {
            await window.aistudio.openSelectKey();
          }
        }
        
        // Note: OpenAI video generation (Sora) is not available via API yet.
        // We will stick to Gemini Veo for video generation for now, or use a placeholder if OpenAI is strictly requested for video.
        // However, the user asked to "generate all types of video". Veo is the best bet.
        
        let videoUrl: string | null = null;

        if (selectedModel === 'openai') {
             // Fallback to Gemini for video as OpenAI doesn't support it publicly yet
             // Or inform user. But user asked to "generate all types of video".
             // We will use Gemini Veo even if OpenAI is selected, as it's the only one capable.
             videoUrl = await geminiService.generateVideo(
              currentInput || "Animate this",
              currentAttachments.length > 0 ? currentAttachments[0].data : undefined,
              currentAttachments.length > 0 ? currentAttachments[0].mimeType : undefined
            );
        } else {
            videoUrl = await geminiService.generateVideo(
              currentInput || "Animate this",
              currentAttachments.length > 0 ? currentAttachments[0].data : undefined,
              currentAttachments.length > 0 ? currentAttachments[0].mimeType : undefined
            );
        }

        if (videoUrl) {
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `Here is your video, champ.`,
            type: 'video',
            videoUrl: videoUrl,
            timestamp: Date.now()
          };
          setMessages(prev => [...prev, aiMessage]);
          if (activeChatId) await saveMessageToServer(activeChatId, aiMessage);
        }
        setIsTyping(false);
        return;
      }

      const isImageRequest = currentInput.toLowerCase().match(/(generate|image|draw|create an image)/);
      const isEditRequest = currentInput.toLowerCase().match(/(edit|change|modify|add|remove|transform)/);

      if (isImageRequest && currentAttachments.length === 0) {
        let imageUrl: string | null = null;

        if (selectedModel === 'openai') {
            imageUrl = await openaiService.generateImage(currentInput);
        } else {
            // Check API Key for high-end image models if needed
            if (window.aistudio && window.aistudio.hasSelectedApiKey) {
            const hasKey = await window.aistudio.hasSelectedApiKey();
            if (!hasKey) {
                await window.aistudio.openSelectKey();
            }
            }

            // Enforce quality based on premium tier
            let effectiveSize: '1K' | '2K' | '4K' | '5K' = '1K';
            if (premiumTier === 2 || premiumTier === 3) {
            effectiveSize = '5K';
            } else if (premiumTier === 1) {
            effectiveSize = '1K'; // As per latest request
            } else {
            effectiveSize = '1K'; // Simple image for free users
            }

            imageUrl = await geminiService.generateImage(currentInput, effectiveSize);
        }

        if (imageUrl) {
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `Masterpiece rendered, champ.`,
            type: 'image',
            imageUrl: imageUrl,
            timestamp: Date.now()
          };
          setMessages(prev => [...prev, aiMessage]);
          if (activeChatId) await saveMessageToServer(activeChatId, aiMessage);
        }
      } else if (isEditRequest && currentAttachments.length > 0 && currentAttachments[0].mimeType.includes('image')) {
        // Image Editing Mode (Gemini Only for now)
        const imageUrl = await geminiService.editImage(currentInput, currentAttachments[0].data, currentAttachments[0].mimeType);
        if (imageUrl) {
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `I've edited the image as requested, champ.`,
            type: 'image',
            imageUrl: imageUrl,
            timestamp: Date.now()
          };
          setMessages(prev => [...prev, aiMessage]);
          if (activeChatId) await saveMessageToServer(activeChatId, aiMessage);
        }
      } else {
        // Text/Code Generation
        let responseText: string | undefined = "";

        // Inject Knowledge Base if available
        let baseInstruction = settings.customInstructions;
        if (settings.knowledgeBase) {
          baseInstruction += `\n\n[KNOWLEDGE BASE]\nUse the following information to answer the user's questions if relevant:\n${settings.knowledgeBase}\n[END KNOWLEDGE BASE]`;
        }

        const systemInstruction = isAppMakerMode 
          ? "You are an expert App Maker and Developer. Your goal is to help the user build functional, beautiful web applications. When the user asks to build an app, provide a single self-contained HTML file (including <style> and <script> tags) wrapped in a markdown code block with the language set to 'html'. IMPORTANT: Do not include any other text after the code block if possible, or keep it very brief. The system will automatically extract this code and show it in the dedicated 'Code' and 'Preview' sections. Do not explain the code in the chat unless specifically asked."
          : `${baseInstruction}\n\nIMPORTANT: You must respond ONLY in ${settings.language}.`;

        if (selectedModel === 'openai') {
            const history = messages.map(m => ({
                role: m.role === 'user' ? 'user' : (m.role === 'assistant' ? 'assistant' : 'system') as any,
                content: m.content || ""
            }));
            
            responseText = await openaiService.generateChatResponse(
                currentInput,
                history,
                systemInstruction
            ) || "";

        } else {
            const history = messages.map(m => ({
                role: m.role === 'user' ? 'user' as const : 'model' as const,
                parts: [{ text: m.content || "Attached a file." }]
            }));
            
            responseText = await geminiService.generateChatResponse(
                currentInput || "Please analyze this document, champ.", 
                history, 
                currentAttachments.map(a => ({ data: a.data, mimeType: a.mimeType })),
                systemInstruction,
                settings.responseStyle,
                isAppMakerMode ? 'gemini-3.1-pro-preview' : 'gemini-3-flash-preview'
            );
        }

        let finalResponseText = responseText || "My systems are refining, please try again, champ.";
        
        // Extract code for App Maker mode
        if (isAppMakerMode && responseText) {
          const codeBlockRegex = /```html\n([\s\S]*?)```/;
          const match = responseText.match(codeBlockRegex);
          if (match && match[1]) {
            setGeneratedCode(match[1]);
            // Remove the code block from the response text so it's not shown in chat
            finalResponseText = responseText.replace(codeBlockRegex, '').trim();
            if (!finalResponseText) {
              finalResponseText = "I've updated the app for you, champ. Check the preview!";
            }
            // Automatically show preview after generation
            setTimeout(() => setShowCodePreview(true), 500);
          }
        }

        // Save FULL content to server (so we can restore code later), but show STRIPPED content in UI
        const fullAiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: responseText || "My systems are refining, please try again, champ.",
          type: 'text',
          timestamp: Date.now()
        };

        const uiAiMessage: Message = {
          ...fullAiMessage,
          content: finalResponseText
        };

        setMessages(prev => [...prev, uiAiMessage]);
        if (activeChatId) await saveMessageToServer(activeChatId, fullAiMessage);

        // If in voice mode, generate and play speech
        if (isVoiceMode && responseText) {
          const audioUrl = await geminiService.generateSpeech(responseText, settings.voice as any);
          if (audioUrl) {
            const audio = new Audio(audioUrl);
            audioRef.current = audio;
            audio.play();
            audio.onended = () => {
              // After AI finishes speaking, start listening again for a continuous conversation
              if (isVoiceMode) {
                recognitionRef.current?.start();
                setIsListening(true);
              }
            };
          }
        }
      }
    } catch (error: any) {
      console.error(error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I'm currently calibrating for the best result. Please try asking me again in a moment, champ.`,
        type: 'text',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className={`flex h-screen bg-white dark:bg-[#070707] ${settings.theme === 'dark' ? 'text-zinc-100' : 'text-black'} selection:bg-zinc-200 dark:selection:bg-zinc-700`}>
      <Sidebar 
        onNewChat={handleNewChat} 
        onUpgrade={() => setShowUpgradeModal(true)} 
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={handleSelectChat}
        premiumTier={premiumTier}
        onAppMakerClick={() => {
          setIsAppMakerMode(!isAppMakerMode);
          setIsVideoGeneratorMode(false);
          handleNewChat();
        }}
        isAppMakerMode={isAppMakerMode}
        onVideoGeneratorClick={() => {
          setIsVideoGeneratorMode(!isVideoGeneratorMode);
          setIsAppMakerMode(false);
          handleNewChat();
        }}
        isVideoGeneratorMode={isVideoGeneratorMode}
        isOpen={isSidebarOpen}
      />
      <input type="file" multiple accept="image/*,application/pdf" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
      <input type="file" accept="image/*" capture="environment" className="hidden" ref={cameraInputRef} onChange={handleFileUpload} />
      
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Modern Minimal Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-900 sticky top-0 bg-white/90 dark:bg-[#070707]/90 backdrop-blur-xl z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 -ml-2 text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
              title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
            >
              <LayoutGrid size={20} className={isSidebarOpen ? "" : "rotate-180"} />
            </button>
            <div className="flex items-center">
              <Logo size="sm" showText={false} />
              <span className="ml-3 font-black text-[10px] tracking-[0.3em] uppercase text-zinc-500 dark:text-zinc-600 hidden sm:block">Champai.com</span>
              {isAppMakerMode && (
                <div className="flex items-center ml-4 pl-4 border-l border-zinc-200 dark:border-zinc-800 animate-in fade-in slide-in-from-left-4 duration-500">
                  <div className="w-5 h-5 rounded-md bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <Zap size={12} className="text-white fill-white" />
                  </div>
                  <span className="ml-2 font-bold text-[10px] tracking-widest uppercase text-indigo-500">App Maker</span>
                </div>
              )}
              {isVideoGeneratorMode && (
                <div className="flex items-center ml-4 pl-4 border-l border-zinc-200 dark:border-zinc-800 animate-in fade-in slide-in-from-left-4 duration-500">
                  <div className="w-5 h-5 rounded-md bg-pink-500 flex items-center justify-center shadow-lg shadow-pink-500/20">
                    <Video size={12} className="text-white fill-white" />
                  </div>
                  <span className="ml-2 font-bold text-[10px] tracking-widest uppercase text-pink-500">Video Generator</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAppMakerMode && (
              <div className="flex items-center gap-1 mr-4">
                <button 
                  onClick={() => setShowCodePreview(true)}
                  className="p-2.5 text-indigo-500 bg-indigo-500/10 rounded-2xl transition-all flex items-center gap-2 border border-indigo-500/20" 
                  title="Preview"
                >
                  <Play size={18} className="fill-indigo-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest hidden lg:block">Preview</span>
                </button>
                <button 
                  onClick={() => setShowCodeView(true)}
                  className="p-2.5 text-amber-600 bg-amber-500/10 hover:bg-amber-500/20 rounded-2xl transition-all flex items-center gap-2 border border-amber-500/20" 
                  title="Code"
                >
                  <Code size={18} />
                  <span className="text-[10px] font-black uppercase tracking-widest hidden lg:block">Code</span>
                </button>
                <button 
                  onClick={handlePublishToGithub}
                  className="p-2.5 text-zinc-600 bg-zinc-100 hover:bg-zinc-200 dark:text-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-2xl transition-all flex items-center gap-2 border border-zinc-200 dark:border-zinc-700" 
                  title="Publish to GitHub"
                >
                  <Github size={18} />
                  <span className="text-[10px] font-black uppercase tracking-widest hidden lg:block">Publish</span>
                </button>
                <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 mx-2"></div>
                <button 
                  onClick={() => {
                    setIsAppMakerMode(false);
                    handleNewChat();
                  }}
                  className="w-2 h-2 rounded-full bg-red-500 hover:bg-red-600 transition-all ml-2"
                  title="Exit App Maker"
                />
              </div>
            )}
            {isVideoGeneratorMode && (
              <div className="flex items-center gap-1 mr-4">
                <button 
                  onClick={() => {
                    setIsVideoGeneratorMode(false);
                    handleNewChat();
                  }}
                  className="w-2 h-2 rounded-full bg-red-500 hover:bg-red-600 transition-all ml-2"
                  title="Exit Video Generator"
                />
              </div>
            )}
             <button className="p-2.5 text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-2xl transition-all">
              <Bell size={18} strokeWidth={2.5} />
            </button>
             <button className="p-2.5 text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-2xl transition-all">
              <LayoutGrid size={18} strokeWidth={2.5} />
            </button>
             <div 
              onClick={() => setShowSettingsModal(true)}
              className={`w-9 h-9 rounded-full ${user.color} border border-zinc-200 dark:border-zinc-800 flex items-center justify-center ml-2 cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-600 transition-all shadow-lg`}
             >
              <span className="text-[14px] font-black text-white">{user.initial}</span>
            </div>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto px-6 pb-60 pt-32 max-w-4xl mx-auto w-full scrollbar-hide">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-start text-center space-y-12 animate-in fade-in duration-1000 max-w-2xl mx-auto pt-20">
              <div className="logo-glow p-0.5 rounded-full bg-black dark:bg-white shrink-0 hover:scale-110 transition-transform duration-700">
                <Logo size="lg" showText={false} />
              </div>
              <div className="space-y-4">
                <h2 className={`text-4xl font-black tracking-tighter ${settings.theme === 'dark' ? 'text-white' : 'text-black'}`}>
                  {isAppMakerMode ? "App Maker Mode" : "What's the move, champ?"}
                </h2>
                <p className="text-zinc-500 font-medium max-w-md mx-auto">
                  {isAppMakerMode 
                    ? "Build functional web apps with advanced Gemini 3.1 Pro intelligence. Describe your app idea and let's start coding."
                    : "I'm here to refine your vision. Ask me anything or upload an asset to begin."}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-14">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-7 group animate-in slide-in-from-bottom-5 duration-700 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 mt-1.5 shadow-xl border ${msg.role === 'assistant' ? 'bg-black border-zinc-800 dark:bg-white dark:border-zinc-100' : 'bg-zinc-100 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800'}`}>
                    <Logo size="sm" showText={false} />
                  </div>
                  <div className={`max-w-[85%] rounded-[32px] p-7 transition-all duration-300 ${msg.role === 'user' ? 'bg-zinc-100 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/40 text-black dark:text-zinc-100' : 'bg-transparent text-black dark:text-zinc-200'}`}>
                    {(msg.imageUrl || msg.type === 'image') && (
                      <div className="mb-6 relative group/img overflow-hidden rounded-3xl border border-zinc-800 bg-black shadow-2xl">
                        <img src={msg.imageUrl} alt="Asset" className="max-w-full max-h-[600px] object-contain mx-auto transition-transform duration-500 group-hover/img:scale-[1.02]" />
                      </div>
                    )}
                    {(msg.videoUrl || msg.type === 'video') && (
                      <div className="mb-6 relative group/video overflow-hidden rounded-3xl border border-zinc-800 bg-black shadow-2xl">
                        <video controls src={msg.videoUrl} className="max-w-full max-h-[600px] mx-auto" />
                      </div>
                    )}
                    {(msg.fileUrl || msg.type === 'file') && (
                      <div className="mb-6 relative group/file overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 p-6 flex items-center gap-4 shadow-2xl">
                        <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400">
                          <FileText size={24} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-white uppercase tracking-widest">PDF Document</p>
                          <p className="text-xs text-zinc-500 font-medium">Attached for analysis</p>
                        </div>
                      </div>
                    )}
                    <div className={`text-[17px] font-medium leading-[1.7] antialiased prose ${settings.theme === 'dark' ? 'prose-invert' : ''} max-w-none prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent prose-pre:m-0`}>
                      <ReactMarkdown
                        components={{
                          code({ node, className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || '');
                            return match ? (
                              <div className="relative group/code mt-4 mb-6 rounded-xl overflow-hidden bg-zinc-900 dark:bg-[#1E1E1E] border border-zinc-800 shadow-2xl">
                                <div className="flex items-center justify-between px-4 py-2 bg-[#2D2D2D] border-b border-zinc-800">
                                  <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">{match[1]}</span>
                                  <button
                                    onClick={() => navigator.clipboard.writeText(String(children).replace(/\n$/, ''))}
                                    className="text-zinc-500 hover:text-white transition-colors flex items-center gap-1.5"
                                  >
                                    <Copy size={14} />
                                    <span className="text-[10px] uppercase tracking-widest font-bold">Copy</span>
                                  </button>
                                </div>
                                <SyntaxHighlighter
                                  {...props}
                                  children={String(children).replace(/\n$/, '')}
                                  style={vscDarkPlus}
                                  language={match[1]}
                                  PreTag="div"
                                  customStyle={{ margin: 0, background: 'transparent', padding: '1rem', fontSize: '14px' }}
                                />
                              </div>
                            ) : (
                              <code {...props} className={`${className || ''} bg-zinc-200 dark:bg-zinc-800/50 px-1.5 py-0.5 rounded-md text-zinc-800 dark:text-zinc-200 font-mono text-[15px]`}>
                                {children}
                              </code>
                            );
                          }
                        }}
                      >
                        {msg.content.replace(/\$\$/g, '').replace(/\$/g, '')}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-7">
                  <div className="w-11 h-11 rounded-full bg-black dark:bg-white flex items-center justify-center shrink-0 mt-1.5 shadow-xl border border-zinc-800 dark:border-zinc-100">
                    <Logo size="sm" showText={false} />
                  </div>
                  <div className="flex items-center gap-3 py-8">
                    <div className="w-2 h-2 bg-zinc-400 dark:bg-zinc-700 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-zinc-400 dark:bg-zinc-700 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-zinc-400 dark:bg-zinc-700 rounded-full animate-bounce"></div>
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Premium Input Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-14 bg-gradient-to-t from-white via-white/95 to-transparent dark:from-[#070707] dark:via-[#070707]/95 z-40">
          <div className="max-w-3xl mx-auto relative">
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-4 mb-6 px-4">
                {attachments.map((att, idx) => (
                  <div key={idx} className="relative group/att w-24 h-24 rounded-3xl border border-zinc-800 overflow-hidden bg-zinc-900 shadow-2xl transition-transform hover:scale-105 flex items-center justify-center">
                    {(att.mimeType || '').includes('image') ? (
                      <img src={att.preview} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-zinc-500">
                        <FileText size={32} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">PDF</span>
                      </div>
                    )}
                    <button 
                      onClick={() => removeAttachment(idx)}
                      className="absolute top-2 right-2 p-1.5 bg-black/80 rounded-full text-white opacity-0 group-hover/att:opacity-100 transition-all backdrop-blur-md"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="relative flex items-end bg-zinc-100 dark:bg-[#141414] border border-zinc-200 dark:border-zinc-800 focus-within:border-zinc-400 dark:focus-within:border-zinc-700 focus-within:bg-white dark:focus-within:bg-[#181818] transition-all px-6 py-4 rounded-[36px] group shadow-[0_30px_70px_rgba(0,0,0,0.1)] dark:shadow-[0_30px_70px_rgba(0,0,0,0.6)]">
              <div className="flex items-center mb-1 mr-3">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-all"
                  title="Attach asset"
                >
                  <Paperclip size={22} strokeWidth={2.5} />
                </button>
                <button 
                  onClick={() => cameraInputRef.current?.click()}
                  className="p-3 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-all"
                  title="Capture frame"
                >
                  <Camera size={22} strokeWidth={2.5} />
                </button>
              </div>
              
              <textarea
                rows={1}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = 'inherit';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Message Champ AI..."
                className="flex-1 bg-transparent border-none py-4 px-3 outline-none text-black dark:text-zinc-100 text-[18px] placeholder:text-zinc-400 dark:placeholder:text-zinc-600 placeholder:font-medium resize-none min-h-[56px] max-h-60 overflow-y-auto"
              />
              
              <div className="flex items-center gap-2.5 mb-1 ml-4">
                <button 
                  onClick={() => {
                    const newMode = !isVideoGeneratorMode;
                    setIsVideoGeneratorMode(newMode);
                    if (newMode) {
                      setIsAppMakerMode(false);
                      handleNewChat();
                    } else {
                      handleNewChat();
                    }
                  }}
                  className={`p-3 rounded-full transition-all hover:bg-zinc-200 dark:hover:bg-zinc-800 ${isVideoGeneratorMode ? 'text-pink-500 animate-pulse bg-pink-500/10' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'}`}
                  title="Video Generator Mode"
                >
                  <Video size={22} strokeWidth={2.5} />
                </button>

                <button 
                  onClick={toggleListening}
                  className={`p-3 rounded-full transition-all hover:bg-zinc-200 dark:hover:bg-zinc-800 ${isListening ? 'text-red-500 animate-pulse bg-red-500/10' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'}`}
                >
                  {isListening ? <MicOff size={22} strokeWidth={2.5} /> : <Mic size={22} strokeWidth={2.5} />}
                </button>

                <button 
                  id="send-button"
                  onClick={handleSend}
                  disabled={!input.trim() && attachments.length === 0}
                  className={`p-3.5 rounded-full transition-all shadow-2xl active:scale-90 ${input.trim() || attachments.length > 0 ? 'bg-black text-white dark:bg-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200' : 'bg-zinc-200 text-zinc-400 dark:bg-zinc-900 dark:text-zinc-700 cursor-not-allowed'}`}
                >
                  <Send size={22} strokeWidth={3} />
                </button>
              </div>
            </div>
            
            <div className="flex justify-between items-center px-6 mt-6">
               <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-zinc-100/50 dark:bg-zinc-900/30 border border-zinc-200/50 dark:border-zinc-800/50">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
               </div>
               <div className="flex items-center gap-5">
                  <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-700 font-black uppercase tracking-tighter">Render:</span>
                    <select 
                      value={imgSize} 
                      onChange={(e) => {
                        const val = e.target.value as any;
                        if (val === '4K' && premiumTier < 1) {
                          setShowUpgradeModal(true);
                          return;
                        }
                        if (val === '5K' && premiumTier < 3) {
                          setShowUpgradeModal(true);
                          return;
                        }
                        setImgSize(val);
                      }}
                      className="bg-transparent text-[11px] text-zinc-700 dark:text-zinc-300 font-black outline-none cursor-pointer appearance-none"
                    >
                      <option value="1K" className="bg-white dark:bg-black">1K</option>
                      <option value="2K" className="bg-white dark:bg-black">2K</option>
                      <option value="4K" className="bg-white dark:bg-black">4K { premiumTier < 1 && '🔒' }</option>
                      <option value="5K" className="bg-white dark:bg-black">5K { premiumTier < 3 && '🔒' }</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`px-2 py-0.5 rounded text-[8px] font-black border ${premiumTier >= 1 ? 'bg-white text-black border-white' : 'bg-transparent text-zinc-600 border-zinc-800'}`}>4K</div>
                    <div className={`px-2 py-0.5 rounded text-[8px] font-black border ${premiumTier >= 3 ? 'bg-emerald-500 text-black border-emerald-500' : 'bg-transparent text-zinc-600 border-zinc-800'}`}>5K</div>
                  </div>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-800 font-bold uppercase tracking-widest hidden sm:block">WWW.CHAMPAI.COM Network</span>
               </div>
            </div>
          </div>
        </div>
      </main>

      {/* Premium Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-3xl">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowShareModal(false)}></div>
          <div className="relative w-full max-w-md bg-[#111] border border-zinc-800 rounded-[40px] p-10 shadow-[0_50px_100px_-20px_rgba(0,0,0,1)] scale-in-center overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
            
            <button 
              onClick={() => setShowShareModal(false)}
              className="absolute top-6 right-6 p-2 text-zinc-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="p-4 bg-zinc-900 rounded-[28px] border border-zinc-800 mb-8 shadow-2xl">
                <Share2 size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Your App Link</h3>
              <p className="text-zinc-500 text-sm font-medium mb-10 max-w-[240px]">Share your intelligence workspace with the world, champ.</p>
              
              <div className="w-full relative group">
                <div className="w-full bg-black border border-zinc-800 h-16 rounded-[22px] flex items-center px-6 transition-all group-hover:border-zinc-700">
                  <Globe size={18} className="text-zinc-700 mr-4" />
                  <span className="text-zinc-100 font-bold text-[15px] flex-1 text-left">www.champai.com</span>
                  <button 
                    onClick={handleCopyLink}
                    className="p-3 bg-zinc-900 rounded-xl text-zinc-400 hover:text-white transition-all active:scale-90"
                  >
                    {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                  </button>
                </div>
                {copied && (
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 animate-in fade-in slide-in-from-top-2">
                    Copied to clipboard
                  </span>
                )}
              </div>

              <div className="mt-14 pt-8 border-t border-zinc-900 w-full flex justify-between items-center opacity-40">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Secure Link</span>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest">Champ AI Protocol</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Premium Upgrade Modal (In-App Purchases Simulation) */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 backdrop-blur-3xl">
          <div className="absolute inset-0 bg-black/80" onClick={() => setShowUpgradeModal(false)}></div>
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#0a0a0a] border border-zinc-800 rounded-[48px] overflow-hidden shadow-[0_80px_160px_-40px_rgba(0,0,0,1)] scale-in-center flex flex-col">
            
            {/* Header with gradient */}
            <div className="h-40 bg-gradient-to-br from-zinc-700 via-zinc-900 to-black relative flex items-center justify-center shrink-0">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
              <div className="flex flex-col items-center">
                <Logo size="lg" showText={false} />
                <h2 className="text-white font-black text-xl mt-4 tracking-tighter uppercase">Upgrade Your Intelligence</h2>
              </div>
              <button 
                onClick={() => setShowUpgradeModal(false)}
                className="absolute top-8 right-8 p-3 bg-black/40 rounded-full text-white hover:bg-black transition-all backdrop-blur-md"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-10 overflow-y-auto scrollbar-hide">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Tier 1: Champ Pro */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-[32px] p-8 flex flex-col h-full hover:border-zinc-700 transition-all group">
                  <div className="mb-6">
                    <span className="px-3 py-1 bg-white text-black text-[9px] font-black uppercase tracking-widest rounded-full">Tier 1</span>
                    <h4 className="text-xl font-black text-white mt-3">Champ Pro</h4>
                    <div className="text-2xl font-black text-white mt-2">₹550<span className="text-xs text-zinc-500 font-bold">/mo</span></div>
                  </div>
                  <div className="space-y-4 mb-10 flex-1">
                    <FeatureItem icon={<Zap size={14} className="text-white fill-white"/>} text="Unlocks 4K Rendering" />
                    <FeatureItem icon={<ImageIcon size={14} className="text-white"/>} text="High Quality Image Creation" />
                    <FeatureItem icon={<ShieldCheck size={14} className="text-white"/>} text="Priority Support" />
                  </div>
                  <button 
                    onClick={() => { setSelectedTier(1); setShowCheckoutModal(true); setShowUpgradeModal(false); }}
                    className="w-full bg-white text-black font-black py-4 rounded-2xl hover:bg-zinc-200 transition-all active:scale-95"
                  >
                    Select Pro
                  </button>
                </div>

                {/* Tier 2: Champ 3.0 */}
                <div className="bg-zinc-900/50 border border-emerald-500/30 rounded-[32px] p-8 flex flex-col h-full hover:border-emerald-500/50 transition-all group relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-black text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Most Popular</div>
                  <div className="mb-6">
                    <span className="px-3 py-1 bg-emerald-500 text-black text-[9px] font-black uppercase tracking-widest rounded-full">Tier 2</span>
                    <h4 className="text-xl font-black text-white mt-3">Champ 3.0</h4>
                    <div className="text-2xl font-black text-white mt-2">₹800<span className="text-xs text-zinc-500 font-bold">/mo</span></div>
                  </div>
                  <div className="space-y-4 mb-10 flex-1">
                    <FeatureItem icon={<BookOpen size={14} className="text-emerald-400"/>} text="5K Reading Capability" />
                    <FeatureItem icon={<Zap size={14} className="text-emerald-400 fill-emerald-400"/>} text="Fast Image Creation" />
                    <FeatureItem icon={<Edit3 size={14} className="text-emerald-400"/>} text="Advanced Image Editor" />
                    <FeatureItem icon={<CheckCircle size={14} className="text-emerald-400"/>} text="All Pro Features" />
                  </div>
                  <button 
                    onClick={() => { setSelectedTier(2); setShowCheckoutModal(true); setShowUpgradeModal(false); }}
                    className="w-full bg-emerald-500 text-black font-black py-4 rounded-2xl hover:bg-emerald-400 transition-all active:scale-95 shadow-[0_0_30px_-5px_rgba(16,185,129,0.4)]"
                  >
                    Select 3.0
                  </button>
                </div>

                {/* Tier 3: Champ 3.0 Pro */}
                <div className="bg-gradient-to-br from-indigo-900/20 to-violet-900/20 border border-indigo-500/30 rounded-[32px] p-8 flex flex-col h-full hover:border-indigo-500/50 transition-all group">
                  <div className="mb-6">
                    <span className="px-3 py-1 bg-indigo-500 text-white text-[9px] font-black uppercase tracking-widest rounded-full">Tier 3</span>
                    <h4 className="text-xl font-black text-white mt-3">Champ 3.0 Pro</h4>
                    <div className="text-2xl font-black text-white mt-2">₹960<span className="text-xs text-zinc-500 font-bold">/mo</span></div>
                  </div>
                  <div className="space-y-4 mb-10 flex-1">
                    <FeatureItem icon={<Monitor size={14} className="text-indigo-400"/>} text="5K + 4K Rendering" />
                    <FeatureItem icon={<Brain size={14} className="text-indigo-400"/>} text="High Chat Knowledge" />
                    <FeatureItem icon={<Upload size={14} className="text-indigo-400"/>} text="More File Uploads" />
                    <FeatureItem icon={<BarChart3 size={14} className="text-indigo-400"/>} text="Advanced Data Analysis" />
                    <FeatureItem icon={<PlusCircle size={14} className="text-indigo-400"/>} text="More Image Creation" />
                  </div>
                  <button 
                    onClick={() => { setSelectedTier(3); setShowCheckoutModal(true); setShowUpgradeModal(false); }}
                    className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black py-4 rounded-2xl hover:from-indigo-500 hover:to-violet-500 transition-all active:scale-95 shadow-[0_0_30px_-5px_rgba(79,70,229,0.4)]"
                  >
                    Select 3.0 Pro
                  </button>
                </div>
              </div>
              <p className="text-center text-[10px] text-zinc-600 font-medium mt-10">Secure checkout via Google Play / App Store • Cancel anytime</p>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckoutModal && selectedTier && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 backdrop-blur-3xl">
          <div className="absolute inset-0 bg-black/90" onClick={() => setShowCheckoutModal(false)}></div>
          <div className="relative w-full max-w-2xl bg-[#0a0a0a] border border-zinc-800 rounded-[48px] overflow-hidden shadow-[0_80px_160px_-40px_rgba(0,0,0,1)] scale-in-center flex flex-col">
            <div className="p-10">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tighter uppercase">Complete Purchase</h3>
                  <p className="text-zinc-500 text-sm font-medium">Select your preferred payment method</p>
                </div>
                <button 
                  onClick={() => setShowCheckoutModal(false)}
                  className="p-3 bg-zinc-900 rounded-full text-white hover:bg-zinc-800 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-[32px]">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">Order Summary</h4>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white font-bold">{selectedTier === 1 ? 'Champ Pro' : selectedTier === 2 ? 'Champ 3.0' : 'Champ 3.0 Pro'}</span>
                    <span className="text-white font-black">₹{selectedTier === 1 ? '550' : selectedTier === 2 ? '800' : '960'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-zinc-500">
                    <span>Billing Cycle</span>
                    <span>Monthly</span>
                  </div>
                  <div className="mt-6 pt-6 border-t border-zinc-800 flex justify-between items-center">
                    <span className="text-sm font-black text-white uppercase tracking-widest">Total</span>
                    <span className="text-xl font-black text-emerald-500">₹{selectedTier === 1 ? '550' : selectedTier === 2 ? '800' : '960'}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">Payment Methods</h4>
                  <PaymentMethodButton 
                    icon={<CreditCard size={18} />} 
                    label="Credit / Debit Card" 
                    onClick={() => { setPremiumTier(selectedTier as any); setShowCheckoutModal(false); alert('Payment successful! Welcome to the elite, champ.'); }}
                  />
                  <PaymentMethodButton 
                    icon={<Smartphone size={18} />} 
                    label="UPI (GPay, PhonePe)" 
                    onClick={() => { setPremiumTier(selectedTier as any); setShowCheckoutModal(false); alert('UPI Payment successful! Welcome to the elite, champ.'); }}
                  />
                  <PaymentMethodButton 
                    icon={<Wallet size={18} />} 
                    label="Net Banking" 
                    onClick={() => { setPremiumTier(selectedTier as any); setShowCheckoutModal(false); alert('Net Banking successful! Welcome to the elite, champ.'); }}
                  />
                  <PaymentMethodButton 
                    icon={<ShoppingBag size={18} />} 
                    label="Google Play / App Store" 
                    onClick={() => { setPremiumTier(selectedTier as any); setShowCheckoutModal(false); alert('App Store purchase successful! Welcome to the elite, champ.'); }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                <ShieldCheck size={18} className="text-emerald-500" />
                <p className="text-[10px] text-emerald-500/80 font-bold uppercase tracking-widest">Secure 256-bit SSL Encrypted Payment</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Account Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 backdrop-blur-3xl">
          <div className="absolute inset-0 bg-black/80 dark:bg-black/80 bg-white/80" onClick={() => setShowSettingsModal(false)}></div>
          <div className="relative w-full max-w-4xl h-[600px] bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800 rounded-[40px] overflow-hidden shadow-[0_80px_160px_-40px_rgba(0,0,0,0.2)] dark:shadow-[0_80px_160px_-40px_rgba(0,0,0,1)] scale-in-center flex">
            
            {/* Sidebar */}
            <div className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/20 p-6 flex flex-col">
              <div className="flex items-center gap-3 mb-8 px-2">
                <div className="w-8 h-8 rounded-lg bg-black dark:bg-white flex items-center justify-center">
                  <Logo size="sm" showText={false} />
                </div>
                <span className="font-black text-black dark:text-white tracking-tighter">Settings</span>
              </div>
              
              <div className="space-y-1 flex-1">
                <SettingsTabButton 
                  active={activeSettingsTab === 'general'} 
                  onClick={() => setActiveSettingsTab('general')}
                  icon={<Settings size={18} />}
                  label="General"
                />
                <SettingsTabButton 
                  active={activeSettingsTab === 'personalization'} 
                  onClick={() => setActiveSettingsTab('personalization')}
                  icon={<User size={18} />}
                  label="Personalization"
                />
                <SettingsTabButton 
                  active={activeSettingsTab === 'speech'} 
                  onClick={() => setActiveSettingsTab('speech')}
                  icon={<Volume2 size={18} />}
                  label="Speech"
                />
                <SettingsTabButton 
                  active={activeSettingsTab === 'data'} 
                  onClick={() => setActiveSettingsTab('data')}
                  icon={<Database size={18} />}
                  label="Data controls"
                />
                <SettingsTabButton 
                  active={activeSettingsTab === 'brain'} 
                  onClick={() => setActiveSettingsTab('brain')}
                  icon={<Brain size={18} />}
                  label="Brain & Knowledge"
                />
                <SettingsTabButton 
                  active={activeSettingsTab === 'about'} 
                  onClick={() => setActiveSettingsTab('about')}
                  icon={<Info size={18} />}
                  label="About"
                />
              </div>

              <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
                <button 
                  onClick={() => window.location.reload()}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all text-sm font-bold"
                >
                  <X size={18} />
                  Sign Out
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
                <h3 className="text-lg font-black text-black dark:text-white capitalize">{activeSettingsTab}</h3>
                <button 
                  onClick={() => setShowSettingsModal(false)}
                  className="p-2 text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
                {activeSettingsTab === 'general' && (
                  <div className="space-y-8">
                    <SettingsSection title="Theme">
                      <div className="flex gap-4">
                        {['light', 'dark', 'eye-protection', 'system'].map((t) => (
                          <button 
                            key={t}
                            onClick={() => setSettings({...settings, theme: t})}
                            className={`flex-1 py-3 px-4 rounded-xl border transition-all text-sm font-bold capitalize ${settings.theme === t ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white' : 'bg-zinc-100 text-zinc-500 border-zinc-200 hover:border-zinc-300 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-700'}`}
                          >
                            {t === 'eye-protection' ? 'Eye Care' : t}
                          </button>
                        ))}
                      </div>
                    </SettingsSection>

                    <SettingsSection title="AI Model">
                      <div className="flex gap-4">
                        <button 
                          onClick={() => setSelectedModel('gemini')}
                          className={`flex-1 py-4 px-4 rounded-xl border transition-all text-sm font-bold flex items-center justify-center gap-2 ${selectedModel === 'gemini' ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-zinc-100 text-zinc-500 border-zinc-200 hover:border-zinc-300 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800'}`}
                        >
                          <Sparkles size={16} />
                          Gemini Pro (Google)
                        </button>
                        <button 
                          onClick={() => setSelectedModel('openai')}
                          className={`flex-1 py-4 px-4 rounded-xl border transition-all text-sm font-bold flex items-center justify-center gap-2 ${selectedModel === 'openai' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-zinc-100 text-zinc-500 border-zinc-200 hover:border-zinc-300 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800'}`}
                        >
                          <Zap size={16} />
                          GPT-4o (OpenAI)
                        </button>
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-2">
                        {selectedModel === 'gemini' ? 'Uses Gemini 3.1 Pro for reasoning and Flash Image (Banana) for media.' : 'Uses GPT-4o for text and DALL-E 3 for images.'}
                      </p>
                    </SettingsSection>

                    <SettingsSection title="Language">
                      <SettingsSelect 
                        value={settings.language} 
                        onChange={(v) => setSettings({...settings, language: v})}
                        options={['English', 'Spanish', 'French', 'German', 'Hindi', 'Japanese']}
                      />
                    </SettingsSection>

                    <SettingsSection title="Archive all chats">
                      <button 
                        onClick={() => {
                          handleNewChat();
                          setShowSettingsModal(false);
                          alert('All chats archived, champ.');
                        }}
                        className="w-full py-3 px-4 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl text-black dark:text-white text-sm font-bold transition-all flex items-center justify-center gap-2"
                      >
                        <Archive size={16} />
                        Archive all
                      </button>
                    </SettingsSection>

                    <SettingsSection title="Delete all chats">
                      <button 
                        onClick={() => {
                          if (confirm('Are you sure you want to delete all chats?')) {
                            handleNewChat();
                            setShowSettingsModal(false);
                          }
                        }}
                        className="w-full py-3 px-4 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 rounded-xl text-red-400 text-sm font-bold transition-all flex items-center justify-center gap-2"
                      >
                        <Trash2 size={16} />
                        Delete all
                      </button>
                    </SettingsSection>
                  </div>
                )}

                {activeSettingsTab === 'personalization' && (
                  <div className="space-y-8">
                    <SettingsSection title="Custom Instructions">
                      <p className="text-xs text-zinc-500 mb-4">Share anything you'd like Champ AI to know across every conversation.</p>
                      <textarea 
                        value={settings.customInstructions}
                        onChange={(e) => setSettings({...settings, customInstructions: e.target.value})}
                        placeholder="What would you like Champ AI to know about you to provide better responses?"
                        className="w-full h-32 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-sm text-black dark:text-white outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-all resize-none"
                      />
                    </SettingsSection>
                    
                    <SettingsSection title="Response Style">
                      <div className="grid grid-cols-2 gap-3">
                        {['Concise', 'Detailed', 'Creative', 'Professional'].map((style) => (
                          <button 
                            key={style} 
                            onClick={() => setSettings({...settings, responseStyle: style})}
                            className={`py-3 px-4 rounded-xl border transition-all text-xs font-bold ${settings.responseStyle === style ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white' : 'bg-zinc-100 text-zinc-500 border-zinc-200 hover:border-zinc-300 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-700'}`}
                          >
                            {style}
                          </button>
                        ))}
                      </div>
                    </SettingsSection>
                  </div>
                )}

                {activeSettingsTab === 'speech' && (
                  <div className="space-y-8">
                    <SettingsSection title="Voice Selection">
                      <div className="grid grid-cols-2 gap-3">
                        {['Zephyr', 'Puck', 'Charon', 'Kore', 'Fenrir'].map((v) => (
                          <button 
                            key={v}
                            onClick={() => setSettings({...settings, voice: v})}
                            className={`py-3 px-4 rounded-xl border transition-all text-sm font-bold flex items-center justify-between ${settings.voice === v ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white' : 'bg-zinc-100 text-zinc-500 border-zinc-200 hover:border-zinc-300 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-700'}`}
                          >
                            <span>{v}</span>
                            {settings.voice === v && <Check size={14} />}
                          </button>
                        ))}
                      </div>
                    </SettingsSection>

                    <SettingsSection title="Main Language">
                      <p className="text-xs text-zinc-500 mb-4">Select the language you'll primarily use for voice interaction.</p>
                      <SettingsSelect 
                        value={settings.language} 
                        onChange={(v) => setSettings({...settings, language: v})}
                        options={['Auto-detect', 'English', 'Spanish', 'French', 'German', 'Hindi']}
                      />
                    </SettingsSection>
                  </div>
                )}

                {activeSettingsTab === 'data' && (
                  <div className="space-y-8">
                    <SettingsSection title="Chat History & Training">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-black dark:text-white">Save new chats to your history</p>
                          <p className="text-[11px] text-zinc-500">Allow us to improve our models with your data.</p>
                        </div>
                        <SettingsToggle 
                          enabled={settings.chatHistory} 
                          onChange={(v) => setSettings({...settings, chatHistory: v})} 
                        />
                      </div>
                    </SettingsSection>

                    <SettingsSection title="Shared Links">
                      <button 
                        onClick={() => alert('No shared links found, champ.')}
                        className="w-full py-3 px-4 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl text-black dark:text-white text-sm font-bold transition-all flex items-center justify-between"
                      >
                        <span className="flex items-center gap-2"><Share2 size={16} /> Manage shared links</span>
                        <ChevronRight size={16} />
                      </button>
                    </SettingsSection>

                    <SettingsSection title="Export Data">
                      <button 
                        onClick={() => {
                          const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(messages));
                          const downloadAnchorNode = document.createElement('a');
                          downloadAnchorNode.setAttribute("href",     dataStr);
                          downloadAnchorNode.setAttribute("download", "champ_ai_export.json");
                          document.body.appendChild(downloadAnchorNode);
                          downloadAnchorNode.click();
                          downloadAnchorNode.remove();
                        }}
                        className="w-full py-3 px-4 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl text-black dark:text-white text-sm font-bold transition-all flex items-center justify-between"
                      >
                        <span className="flex items-center gap-2"><Download size={16} /> Export workspace data</span>
                        <ChevronRight size={16} />
                      </button>
                    </SettingsSection>

                    <SettingsSection title="Delete Account">
                      <button 
                        onClick={() => {
                          if (confirm('Are you sure you want to delete your account? This will wipe all data.')) {
                            localStorage.clear();
                            window.location.reload();
                          }
                        }}
                        className="w-full py-3 px-4 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 rounded-xl text-red-400 text-sm font-bold transition-all flex items-center justify-center gap-2"
                      >
                        <Trash2 size={16} />
                        Delete account
                      </button>
                    </SettingsSection>
                  </div>
                )}

                {activeSettingsTab === 'brain' && (
                  <div className="space-y-8">
                    <div className="p-6 bg-indigo-500/10 border border-indigo-500/20 rounded-3xl">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-indigo-500 rounded-xl text-white shadow-lg shadow-indigo-500/20">
                          <Brain size={24} />
                        </div>
                        <div>
                          <h4 className="text-lg font-black text-black dark:text-white">Universal Knowledge</h4>
                          <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Teacher Mode Active</p>
                        </div>
                      </div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        Champ AI is now configured as a universal teacher. It is not limited by standard constraints and will attempt to answer any question, solve any problem, and teach any subject with authority.
                      </p>
                    </div>

                    <SettingsSection title="Knowledge Base">
                      <div className="space-y-2">
                        <p className="text-xs text-zinc-500">Add custom knowledge for Champ to learn from.</p>
                        <textarea
                          value={settings.knowledgeBase}
                          onChange={(e) => setSettings({...settings, knowledgeBase: e.target.value})}
                          placeholder="Paste text, articles, or documentation here..."
                          className="w-full h-40 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-sm text-black dark:text-white outline-none focus:border-indigo-500 transition-all resize-none"
                        />
                        <p className="text-[10px] text-zinc-400 text-right">
                          {settings.knowledgeBase.length} characters
                        </p>
                      </div>
                    </SettingsSection>

                    <SettingsSection title="Learning Mode">
                      <div className="flex items-center justify-between p-4 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-center gap-3">
                          <Sparkles size={18} className="text-amber-500" />
                          <span className="text-sm font-bold text-black dark:text-white">Active Learning</span>
                        </div>
                        <SettingsToggle enabled={settings.training} onChange={(v) => setSettings({...settings, training: v})} />
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-2 px-1">
                        When enabled, Champ adapts to your conversation style and remembers context across longer sessions.
                      </p>
                    </SettingsSection>
                  </div>
                )}

                {activeSettingsTab === 'about' && (
                  <div className="space-y-8">
                    <div className="flex flex-col items-center py-8">
                      <div className="w-20 h-20 rounded-3xl bg-black dark:bg-white flex items-center justify-center mb-6 shadow-2xl">
                        <Logo size="lg" showText={false} />
                      </div>
                      <h4 className="text-2xl font-black text-black dark:text-white tracking-tighter">Champ AI</h4>
                      <p className="text-zinc-500 text-sm font-medium">Version 2.5.0-flash</p>
                    </div>

                    <div className="space-y-3">
                      <button className="w-full py-4 px-6 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-between text-sm font-bold text-black dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all">
                        <span>Release Notes</span>
                        <ExternalLink size={16} className="text-zinc-600" />
                      </button>
                      <button className="w-full py-4 px-6 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-between text-sm font-bold text-black dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all">
                        <span>Terms of Use</span>
                        <ExternalLink size={16} className="text-zinc-600" />
                      </button>
                      <button className="w-full py-4 px-6 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-between text-sm font-bold text-black dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all">
                        <span>Privacy Policy</span>
                        <ExternalLink size={16} className="text-zinc-600" />
                      </button>
                    </div>

                    <p className="text-center text-[10px] text-zinc-600 font-medium pt-8">
                      Crafted with intelligence by Daksh Jagatiya.<br/>
                      © 2026 Champ AI Ecosystem.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Code View Modal */}
      {showCodeView && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 sm:p-8">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-6xl h-full max-h-[90vh] rounded-[32px] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                  <Code size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight uppercase">Source Code</h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">App Maker Engine</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowCodeView(false)}
                  className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-xl transition-all"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6 bg-[#1E1E1E]">
              {generatedCode ? (
                <SyntaxHighlighter
                  language="html"
                  style={vscDarkPlus}
                  customStyle={{ margin: 0, background: 'transparent', padding: 0, fontSize: '14px' }}
                >
                  {generatedCode}
                </SyntaxHighlighter>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-4">
                  <Code size={48} strokeWidth={1} />
                  <p className="font-bold uppercase tracking-widest text-xs">No code generated yet, champ.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showCodePreview && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 sm:p-8">
          <div className="bg-white w-full max-w-6xl h-full max-h-[90vh] rounded-[32px] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white">
                  <Play size={20} className="fill-white" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-black tracking-tight uppercase">Live Preview</h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Real-time Rendering</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCodePreview(false)}
                className="p-2 text-zinc-400 hover:text-black hover:bg-zinc-200 rounded-xl transition-all"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 bg-white">
              {generatedCode ? (
                <iframe 
                  srcDoc={generatedCode}
                  title="App Preview"
                  className="w-full h-full border-none"
                  sandbox="allow-scripts"
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-400 space-y-4">
                  <Monitor size={48} strokeWidth={1} />
                  <p className="font-bold uppercase tracking-widest text-xs">Nothing to preview yet, champ.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* GitHub Publish Modal */}
      {showGithubModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 backdrop-blur-3xl">
          <div className="absolute inset-0 bg-black/80" onClick={() => setShowGithubModal(false)}></div>
          <div className="relative w-full max-w-md bg-[#0a0a0a] border border-zinc-800 rounded-[32px] p-8 shadow-2xl scale-in-center">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800">
                  <Github size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-black text-white">Publish to GitHub</h3>
              </div>
              <button onClick={() => setShowGithubModal(false)} className="p-2 text-zinc-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Repository Name</label>
                <input 
                  type="text" 
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  placeholder="my-awesome-app"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white outline-none focus:border-white transition-all"
                />
              </div>
              
              <div className="pt-4">
                <button 
                  onClick={confirmPublish}
                  disabled={isPublishing || !repoName}
                  className={`w-full py-4 rounded-xl font-bold text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isPublishing || !repoName ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-white text-black hover:bg-zinc-200'}`}
                >
                  {isPublishing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin"></div>
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      Push to GitHub
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FeatureItem = ({ icon, text }: { icon: React.ReactNode, text: string }) => (
  <div className="flex items-center gap-5">
    <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
      {icon}
    </div>
    <span className="text-sm font-bold text-zinc-200">{text}</span>
  </div>
);

const PaymentMethodButton = ({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center gap-4 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl hover:bg-zinc-800 hover:border-zinc-700 transition-all text-left group"
  >
    <div className="p-2 bg-black rounded-lg text-zinc-500 group-hover:text-white transition-colors">
      {icon}
    </div>
    <span className="text-sm font-bold text-zinc-300 group-hover:text-white transition-colors">{label}</span>
  </button>
);

const SettingsTabButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold ${active ? 'bg-zinc-200 text-black dark:bg-zinc-800 dark:text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900/50'}`}
  >
    {icon}
    {label}
  </button>
);

const SettingsSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="space-y-3">
    <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 px-1">{title}</h5>
    {children}
  </div>
);

const SettingsToggle = ({ enabled, onChange }: { enabled: boolean, onChange: (v: boolean) => void }) => (
  <button 
    onClick={() => onChange(!enabled)}
    className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${enabled ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-800'}`}
  >
    <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 transform ${enabled ? 'translate-x-6' : 'translate-x-0'}`} />
  </button>
);

const SettingsSelect = ({ value, options, onChange }: { value: string, options: string[], onChange: (v: string) => void }) => (
  <div className="relative group">
    <select 
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-sm text-black dark:text-white outline-none appearance-none cursor-pointer focus:border-zinc-400 dark:focus:border-zinc-700 transition-all"
    >
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
      <ChevronDown size={16} />
    </div>
  </div>
);

const SettingsItem = ({ label, description }: { label: string, description: string }) => (
  <button className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all text-left group">
    <div>
      <div className="text-sm font-bold text-black dark:text-white group-hover:text-zinc-900 dark:group-hover:text-zinc-200">{label}</div>
      <div className="text-[11px] text-zinc-500 font-medium">{description}</div>
    </div>
    <ChevronRight size={16} className="text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-400 transition-colors" />
  </button>
);

const PromptSuggestion = ({ text, icon }: { text: string, icon: React.ReactNode }) => (
  <button className="flex items-center gap-5 text-left p-6 border border-zinc-200 dark:border-zinc-900 rounded-[32px] hover:bg-zinc-100 dark:hover:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-800 transition-all text-sm text-zinc-600 dark:text-zinc-500 group bg-zinc-50 dark:bg-zinc-900/20 active:scale-98">
    <div className="p-3 bg-white dark:bg-zinc-900 rounded-2xl group-hover:bg-zinc-50 dark:group-hover:bg-zinc-800 transition-all border border-zinc-200 dark:border-zinc-800 group-hover:border-zinc-300 dark:group-hover:border-zinc-700 shadow-lg">
      <div className="text-black dark:text-zinc-400 group-hover:text-black dark:group-hover:text-white transition-colors">{icon}</div>
    </div>
    <span className="group-hover:text-black dark:group-hover:text-zinc-200 transition-colors font-bold tracking-tight truncate uppercase text-[11px]">{text}</span>
  </button>
);

export default Dashboard;
