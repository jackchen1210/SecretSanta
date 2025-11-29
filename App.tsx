
import React, { useState, useEffect } from 'react';
import { Participant, AppStage, Language } from './types';
import { createPairings } from './services/santaLogic';
import SetupPhase from './components/SetupPhase';
import ParticipantModal from './components/ParticipantModal';
import AuthModal from './components/AuthModal';
import Snowfall from './components/Snowfall';
import { Gift, Lock, RefreshCw, UserPlus, Globe, ChevronDown, Trash2, Home, Copy, Check } from 'lucide-react';
import { translations } from './translations';

const App: React.FC = () => {
  const [stage, setStage] = useState<AppStage>(AppStage.SETUP);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [eventId, setEventId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  
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

  // 1. Load Data & Routing Logic
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlEventId = params.get('event');
    const uid = params.get('uid');
    const token = params.get('token');

    if (urlEventId) {
      // Trying to load a specific event
      const storageKey = `secret_santa_event_${urlEventId}`;
      const savedData = localStorage.getItem(storageKey);

      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          const loadedParticipants = parsed.participants.map((p: any) => ({
            ...p,
            secretToken: p.secretToken || Math.random().toString(36),
            isClaimed: p.isClaimed || false,
            password: p.password || undefined 
          }));
          
          setParticipants(loadedParticipants);
          setStage(parsed.stage || AppStage.ACTIVE);
          setEventId(urlEventId);

          // Check for Magic Link Direct Access
          if (uid && token && loadedParticipants.length > 0) {
            const me = loadedParticipants.find((p: Participant) => p.id === uid);
            if (me && me.secretToken === token) {
              const target = loadedParticipants.find((p: Participant) => p.id === me.assigneeId);
              if (target) {
                setPersonalView({ me, target });
              }
            }
          }
        } catch (e) {
          console.error("Failed to load event data", e);
          setLoadError("data_corruption");
        }
      } else {
        // Event ID in URL but not in local storage
        setLoadError("not_found");
        setEventId(urlEventId); // Keep ID to show which one failed
      }
    } else {
      // No event ID, clean start (default SETUP)
      setStage(AppStage.SETUP);
    }
  }, []);

  // 2. Persist Data whenever it changes (only if we have an eventId)
  useEffect(() => {
    if (eventId && participants.length > 0) {
      const storageKey = `secret_santa_event_${eventId}`;
      localStorage.setItem(storageKey, JSON.stringify({
        stage,
        participants
      }));
    }
  }, [stage, participants, eventId]);

  const handleStartExchange = (names: string[]) => {
    try {
      const pairedParticipants = createPairings(names);
      
      // Generate new Event ID
      const newEventId = Math.random().toString(36).substring(2, 10);
      
      setParticipants(pairedParticipants);
      setEventId(newEventId);
      setStage(AppStage.ACTIVE);

      // Update URL without reloading
      const newUrl = `${window.location.pathname}?event=${newEventId}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
      
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleDeleteEvent = () => {
    if (window.confirm(t.resetConfirm)) {
      if (eventId) {
        localStorage.removeItem(`secret_santa_event_${eventId}`);
      }
      // Reset state and clear URL
      setParticipants([]);
      setStage(AppStage.SETUP);
      setEventId(null);
      setPersonalView(null);
      window.history.pushState({}, '', window.location.pathname);
    }
  };

  const handleGoHome = () => {
    // Just navigate to root to create new event
    window.location.href = window.location.pathname;
  };

  const handleCopyEventLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
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

  // RENDER: ERROR STATE (Invalid Event ID)
  if (loadError) {
    return (
      <div className="min-h-screen font-sans text-gray-100 relative bg-santa-dark flex items-center justify-center p-4">
        <Snowfall />
        <div className="relative z-10 max-w-md w-full bg-white/5 border border-white/10 rounded-2xl p-8 text-center backdrop-blur-md">
           <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-red-400">
             <RefreshCw size={32} />
           </div>
           <h2 className="text-2xl font-holiday text-santa-gold mb-2">{t.eventNotFound}</h2>
           <p className="text-gray-400 mb-6">{t.eventNotFoundDesc}</p>
           <button 
             onClick={handleGoHome}
             className="bg-santa-red hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl transition-all w-full flex items-center justify-center gap-2"
           >
             <Home size={18} /> {t.home}
           </button>
        </div>
      </div>
    );
  }

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
            eventId={eventId || undefined}
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
        <header className="flex flex-col md:flex-row justify-between items-center mb-12 bg-santa-dark/50 backdrop-blur-sm p-4 rounded-xl border border-white/10 gap-4 md:gap-0">
          <div className="flex items-center gap-3">
            <Gift className="text-santa-red" size={32} />
            <h1 className="text-2xl font-holiday text-white">{t.appTitle}</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <div className="mr-2">
              <LanguageSelector />
            </div>
            
            {/* Navigation Buttons */}
            {eventId ? (
              <>
                 <button 
                  onClick={handleGoHome}
                  className="text-xs text-gray-400 hover:text-white flex items-center gap-1 hover:bg-white/10 px-3 py-2 rounded-lg transition-colors"
                  title={t.home}
                >
                  <Home size={14} /> {t.home}
                </button>
                <button 
                  onClick={handleDeleteEvent}
                  className="text-xs text-red-400 hover:text-red-200 flex items-center gap-1 hover:bg-red-900/20 px-3 py-2 rounded-lg transition-colors"
                  title={t.reset}
                >
                  <Trash2 size={14} /> {t.reset}
                </button>
              </>
            ) : null}
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
              
              {/* Event Link Sharing */}
              <div className="mb-8 flex justify-center">
                <button 
                  onClick={handleCopyEventLink}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all border ${linkCopied ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-santa-gold/10 text-santa-gold border-santa-gold/30 hover:bg-santa-gold/20'}`}
                >
                   {linkCopied ? <Check size={16} /> : <Copy size={16} />}
                   {linkCopied ? t.eventLinkCopied : t.copyEventLink}
                </button>
              </div>

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
