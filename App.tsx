
import React, { useState, useEffect } from 'react';
import { Participant, AppStage, Language } from './types';
import { createPairings } from './services/santaLogic';
import SetupPhase from './components/SetupPhase';
import ParticipantModal from './components/ParticipantModal';
import AuthModal from './components/AuthModal';
import Snowfall from './components/Snowfall';
import { Gift, Lock, RefreshCw, UserPlus, Globe, ChevronDown } from 'lucide-react';
import { translations } from './translations';

const STORAGE_KEY = 'secret_santa_data_v1';

const App: React.FC = () => {
  const [stage, setStage] = useState<AppStage>(AppStage.SETUP);
  const [participants, setParticipants] = useState<Participant[]>([]);
  
  // Initialize language with auto-detection
  const [lang, setLang] = useState<Language>(() => {
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('zh')) return 'zh';
    if (browserLang.startsWith('ja')) return 'ja';
    if (browserLang.startsWith('ko')) return 'ko';
    if (browserLang.startsWith('es')) return 'es';
    return 'en';
  });

  const t = translations[lang];
  
  // State for the authenticated personal view
  const [personalView, setPersonalView] = useState<{me: Participant, target: Participant} | null>(null);
  
  // State for Auth Modal (Setup Password or Login)
  const [authModal, setAuthModal] = useState<{
    isOpen: boolean;
    participant: Participant | null;
    mode: 'setup' | 'login';
    error?: string;
  }>({ isOpen: false, participant: null, mode: 'setup' });

  // Load Data & Check URL for Direct Access
  useEffect(() => {
    // 1. Check for URL Params (Direct Access)
    const params = new URLSearchParams(window.location.search);
    const uid = params.get('uid');
    const token = params.get('token');

    const savedData = localStorage.getItem(STORAGE_KEY);
    let loadedParticipants: Participant[] = [];
    let loadedStage = AppStage.SETUP;

    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        // Backwards compatibility for old data
        loadedParticipants = parsed.participants.map((p: any) => ({
          ...p,
          secretToken: p.secretToken || Math.random().toString(36),
          isClaimed: p.isClaimed || false,
          password: p.password || undefined 
        }));
        loadedStage = parsed.stage;
        setParticipants(loadedParticipants);
        setStage(loadedStage);
      } catch (e) {
        console.error("Failed to load saved data");
      }
    }

    // 2. Authenticate if params exist (Magic Link)
    if (uid && token && loadedParticipants.length > 0) {
      const me = loadedParticipants.find(p => p.id === uid);
      // Allow access via token OR if they are already logged in locally via some other mechanism (optional, but stick to token here)
      if (me && me.secretToken === token) {
        const target = loadedParticipants.find(p => p.id === me.assigneeId);
        if (target) {
          setPersonalView({ me, target });
        }
      } else {
        console.warn("Invalid access token");
      }
    }
  }, []);

  // Saving to localStorage
  useEffect(() => {
    if (participants.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        stage,
        participants
      }));
    }
  }, [stage, participants]);

  const handleStartExchange = (names: string[]) => {
    try {
      const pairedParticipants = createPairings(names);
      setParticipants(pairedParticipants);
      setStage(AppStage.ACTIVE);
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleReset = () => {
    if (window.confirm(t.resetConfirm)) {
      setParticipants([]);
      setStage(AppStage.SETUP);
      setPersonalView(null);
      localStorage.removeItem(STORAGE_KEY);
      window.history.pushState({}, '', window.location.pathname);
    }
  };

  const handleUpdateWishlist = (participantId: string, newWishlist: string[]) => {
    const updatedParticipants = participants.map(p => {
      if (p.id === participantId) {
        return { ...p, wishlist: newWishlist };
      }
      return p;
    });
    
    setParticipants(updatedParticipants);

    if (personalView && personalView.me.id === participantId) {
      setPersonalView({ ...personalView, me: { ...personalView.me, wishlist: newWishlist }});
    }
  };

  // --- Auth Flow ---

  const handleNameClick = (p: Participant) => {
    if (p.password) {
      // Login Mode
      setAuthModal({
        isOpen: true,
        participant: p,
        mode: 'login'
      });
    } else {
      // Setup Mode
      setAuthModal({
        isOpen: true,
        participant: p,
        mode: 'setup'
      });
    }
  };

  const handleAuthSubmit = (inputPassword: string) => {
    const { mode, participant } = authModal;
    if (!participant) return;

    if (mode === 'setup') {
      // Set Password
      const updatedParticipants = participants.map(p => 
        p.id === participant.id 
          ? { ...p, password: inputPassword, isClaimed: true } 
          : p
      );
      setParticipants(updatedParticipants);
      
      const updatedMe = updatedParticipants.find(p => p.id === participant.id)!;
      const target = updatedParticipants.find(p => p.id === updatedMe.assigneeId)!;
      
      setPersonalView({ me: updatedMe, target });
      setAuthModal({ isOpen: false, participant: null, mode: 'setup' });
    } else {
      // Login Check
      if (inputPassword === participant.password) {
        const target = participants.find(p => p.id === participant.assigneeId)!;
        setPersonalView({ me: participant, target });
        setAuthModal({ isOpen: false, participant: null, mode: 'login' });
      } else {
        setAuthModal(prev => ({ ...prev, error: "Incorrect password" }));
      }
    }
  };

  const closeAuthModal = () => {
    setAuthModal({ ...authModal, isOpen: false, error: undefined });
  };

  // Helper component for Language Selector
  const LanguageSelector = () => (
    <div className="relative group">
      <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value as Language)}
        className="appearance-none bg-black/30 hover:bg-black/50 border border-white/10 text-white/90 text-sm py-2 pl-9 pr-8 rounded-lg outline-none focus:ring-2 focus:ring-santa-gold cursor-pointer transition-colors"
      >
        <option value="en" className="text-black">English</option>
        <option value="zh" className="text-black">繁體中文</option>
        <option value="ja" className="text-black">日本語</option>
        <option value="ko" className="text-black">한국어</option>
        <option value="es" className="text-black">Español</option>
      </select>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 z-10">
        <ChevronDown size={14} />
      </div>
    </div>
  );

  // RENDER: PERSONAL DASHBOARD (Direct Link View or Logged In)
  if (personalView) {
    return (
      <div className="min-h-screen font-sans text-gray-100 relative selection:bg-santa-gold selection:text-santa-dark">
        <Snowfall />
        {/* Language Switcher Overlay */}
        <div className="absolute top-4 right-4 z-50">
           <LanguageSelector />
        </div>

        <div className="relative z-10 container mx-auto p-4 flex items-center justify-center min-h-screen">
          <ParticipantModal
            me={personalView.me}
            target={personalView.target}
            allParticipants={participants}
            onUpdateWishlist={handleUpdateWishlist}
            onClose={() => setPersonalView(null)}
            isStandalone={false}
            lang={lang}
          />
        </div>
      </div>
    );
  }

  // RENDER: MAIN LOBBY (Organizer View)
  return (
    <div className="min-h-screen font-sans text-gray-100 relative selection:bg-santa-gold selection:text-santa-dark">
      <Snowfall />

      <main className="relative z-10 container mx-auto px-4 py-8 min-h-screen flex flex-col">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-12 bg-santa-dark/50 backdrop-blur-sm p-4 rounded-xl border border-white/10">
          <div className="flex items-center gap-3">
            <Gift className="text-santa-red" size={32} />
            <h1 className="text-2xl font-holiday text-white">{t.appTitle}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="mr-2">
              <LanguageSelector />
            </div>
            <button 
              onClick={handleReset}
              className="text-xs text-gray-400 hover:text-white flex items-center gap-1 hover:bg-white/10 px-3 py-2 rounded-lg transition-colors"
            >
              <RefreshCw size={14} /> {t.reset}
            </button>
          </div>
        </header>

        {/* View Switcher */}
        <div className="flex-1 flex flex-col items-center justify-center">
          
          {stage === AppStage.SETUP && (
            <div className="w-full animate-fadeIn">
               <SetupPhase onStart={handleStartExchange} lang={lang} />
            </div>
          )}

          {stage === AppStage.ACTIVE && (
            <div className="w-full max-w-5xl animate-fadeIn">
              <div className="text-center mb-10">
                <h2 className="text-4xl font-holiday text-santa-gold mb-3">{t.whoAreYou}</h2>
                <p className="text-gray-400 max-w-lg mx-auto">
                  {t.instruction}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {participants.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleNameClick(p)}
                    className={`group relative border rounded-2xl p-6 transition-all transform flex flex-col items-center gap-4 aspect-square justify-center
                      ${p.password 
                        ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-santa-gold/30' 
                        : 'bg-santa-gold/10 border-santa-gold/20 hover:bg-santa-gold/20 hover:border-santa-gold/50 hover:-translate-y-1 hover:shadow-xl'
                      }`}
                  >
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-holiday shadow-lg transition-transform ${p.password ? 'bg-gray-700' : 'bg-gradient-to-tr from-santa-red to-red-600 group-hover:scale-110'}`}>
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-center">
                      <span className={`block text-lg font-bold transition-colors ${p.password ? 'text-gray-400' : 'text-gray-100 group-hover:text-santa-gold'}`}>
                        {p.name}
                      </span>
                      <span className="text-xs mt-1 flex items-center justify-center gap-1 font-medium">
                        {p.password ? (
                          <span className="text-gray-500 flex items-center gap-1"><Lock size={12} /> {t.login}</span>
                        ) : (
                          <span className="text-santa-gold flex items-center gap-1"><UserPlus size={12} /> {t.setup}</span>
                        )}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <footer className="mt-12 text-center text-gray-600 text-sm py-4">
          {t.footer}
        </footer>
      </main>

      {/* Auth Modal */}
      {authModal.isOpen && authModal.participant && (
        <AuthModal 
          name={authModal.participant.name}
          mode={authModal.mode}
          onSuccess={handleAuthSubmit}
          onClose={closeAuthModal}
          error={authModal.error}
          lang={lang}
        />
      )}
    </div>
  );
};

export default App;
