
import React, { useState } from 'react';
import { Participant, GiftSuggestion, Language } from '../types';
import { Gift, Sparkles, Plus, Trash, List, LogOut, Link as LinkIcon, Check } from 'lucide-react';
import { generateGiftSuggestions } from '../services/geminiService';
import { translations } from '../translations';

interface ParticipantModalProps {
  me: Participant;
  target: Participant;
  allParticipants: Participant[];
  onUpdateWishlist: (participantId: string, newWishlist: string[]) => void;
  onClose?: () => void;
  isStandalone?: boolean;
  lang: Language;
  eventId?: string;
}

const ParticipantModal: React.FC<ParticipantModalProps> = ({ 
  me, 
  target, 
  onUpdateWishlist, 
  onClose,
  isStandalone = false,
  lang,
  eventId
}) => {
  const [activeTab, setActiveTab] = useState<'my-target' | 'my-wishlist'>('my-target');
  const [newWishItem, setNewWishItem] = useState('');
  const t = translations[lang];
  
  // AI State
  const [suggestions, setSuggestions] = useState<GiftSuggestion[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState(false);

  // Link Copy State
  const [copied, setCopied] = useState(false);

  // Wishlist Logic
  const handleAddWish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWishItem.trim()) return;
    const updated = [...me.wishlist, newWishItem.trim()];
    onUpdateWishlist(me.id, updated);
    setNewWishItem('');
  };

  const removeWish = (index: number) => {
    const updated = me.wishlist.filter((_, i) => i !== index);
    onUpdateWishlist(me.id, updated);
  };

  // AI Logic
  const handleAskAI = async () => {
    setLoadingAi(true);
    setAiError(false);
    try {
      // Pass the current language to the service
      const results = await generateGiftSuggestions(target.name, target.wishlist, lang);
      setSuggestions(results);
    } catch (err) {
      setAiError(true);
    } finally {
      setLoadingAi(false);
    }
  };

  const handleCopyLink = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    let link = `${baseUrl}?uid=${me.id}&token=${me.secretToken}`;
    if (eventId) {
      link += `&event=${eventId}`;
    }
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isStandalone ? '' : ''}`}>
      {/* Backdrop */}
      {!isStandalone && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
      )}

      {/* Modal Card */}
      <div className={`relative w-full max-w-2xl bg-santa-dark border border-santa-gold/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${isStandalone ? 'h-full max-h-none border-none rounded-none md:rounded-2xl md:h-auto md:max-h-[90vh]' : ''}`}>
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-santa-red to-red-800 flex justify-between items-center shrink-0">
          <div>
            <div className="text-red-200 text-sm font-medium uppercase tracking-wider mb-1">{t.dashboardTitle}</div>
            <h2 className="text-3xl font-holiday text-white">{t.hello.replace('{name}', me.name)}</h2>
          </div>
          <div className="flex items-center gap-2">
            {onClose && (
              <button 
                onClick={onClose} 
                className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors flex items-center gap-2"
                title={t.logout}
              >
                <LogOut size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 shrink-0">
          <button
            onClick={() => setActiveTab('my-target')}
            className={`flex-1 py-4 text-center font-medium transition-colors ${
              activeTab === 'my-target' 
                ? 'bg-white/5 text-santa-gold border-b-2 border-santa-gold' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {t.tabTarget}
          </button>
          <button
            onClick={() => setActiveTab('my-wishlist')}
            className={`flex-1 py-4 text-center font-medium transition-colors ${
              activeTab === 'my-wishlist' 
                ? 'bg-white/5 text-santa-gold border-b-2 border-santa-gold' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {t.tabWishlist}
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          
          {/* TAB: MY TARGET */}
          {activeTab === 'my-target' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="text-center py-8 bg-white/5 rounded-2xl border border-white/5 relative overflow-hidden group">
                 {/* Decorative background element */}
                <div className="absolute top-0 right-0 p-20 bg-santa-gold/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                
                <h3 className="text-gray-400 mb-2">{t.youAreSantaFor}</h3>
                <div className="text-5xl font-holiday text-santa-gold drop-shadow-md mb-6">{target.name}</div>
                
                <div className="w-16 h-1 bg-gradient-to-r from-transparent via-santa-red to-transparent mx-auto"></div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <List size={20} className="text-santa-green" />
                  {t.targetWishlist.replace('{name}', target.name)}
                </h3>
                {target.wishlist.length === 0 ? (
                  <div className="text-gray-500 italic p-4 text-center border border-dashed border-white/10 rounded-xl">
                    {t.emptyTargetWishlist}
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {target.wishlist.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
                        <Gift size={20} className="text-santa-red shrink-0 mt-0.5" />
                        <span className="text-gray-200">{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* AI Section */}
              <div className="pt-6 border-t border-white/10">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Sparkles size={20} className="text-yellow-400" />
                    {t.aiTitle}
                  </h3>
                  {!loadingAi && (
                    <button 
                      onClick={handleAskAI}
                      className="text-xs bg-santa-green hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg transition-colors"
                    >
                      {suggestions.length > 0 ? t.aiButtonRegen : t.aiButtonGenerate}
                    </button>
                  )}
                </div>

                {loadingAi && (
                  <div className="p-8 text-center text-gray-400 animate-pulse">
                    {t.aiLoading}
                  </div>
                )}

                {aiError && (
                  <div className="p-4 bg-red-900/30 text-red-300 rounded-xl text-sm">
                    {t.aiError}
                  </div>
                )}

                {!loadingAi && suggestions.length > 0 && (
                  <div className="grid grid-cols-1 gap-4">
                    {suggestions.map((sug, i) => (
                      <div key={i} className="bg-gradient-to-br from-white/10 to-white/5 p-4 rounded-xl border border-white/10">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-santa-gold">{sug.item}</h4>
                          <span className="text-xs bg-white/10 px-2 py-1 rounded text-gray-300">{sug.estimatedPrice}</span>
                        </div>
                        <p className="text-sm text-gray-400 leading-relaxed">{sug.reason}</p>
                      </div>
                    ))}
                  </div>
                )}
                
                {!loadingAi && suggestions.length === 0 && !aiError && (
                  <div className="text-sm text-gray-500">
                    {t.aiEmpty.replace('{name}', target.name)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: MY WISHLIST */}
          {activeTab === 'my-wishlist' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-santa-green/10 p-4 rounded-xl border border-santa-green/20">
                <p className="text-sm text-gray-300">
                  {t.wishlistHelper}
                </p>
              </div>

              <form onSubmit={handleAddWish} className="flex gap-2">
                <input 
                  type="text" 
                  value={newWishItem}
                  onChange={(e) => setNewWishItem(e.target.value)}
                  placeholder={t.wishlistPlaceholder}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-santa-gold outline-none"
                />
                <button 
                  type="submit"
                  disabled={!newWishItem.trim()}
                  className="bg-santa-gold text-santa-dark font-bold p-3 rounded-xl hover:bg-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus size={24} />
                </button>
              </form>

              <ul className="space-y-2">
                {me.wishlist.map((item, i) => (
                  <li key={i} className="flex justify-between items-center bg-white/5 p-4 rounded-xl group hover:bg-white/10 transition-colors">
                    <span className="text-gray-200">{item}</span>
                    <button 
                      onClick={() => removeWish(i)}
                      className="text-gray-600 hover:text-red-400 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash size={18} />
                    </button>
                  </li>
                ))}
                {me.wishlist.length === 0 && (
                  <div className="text-center py-10 text-gray-600">
                    {t.wishlistEmpty}
                  </div>
                )}
              </ul>
            </div>
          )}

          {/* Copy Link Section */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <h4 className="text-sm font-medium text-gray-400 mb-3">{t.linkTitle}</h4>
            <div className="flex gap-2">
              <div className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-400 font-mono truncate select-all">
                {(() => {
                   const baseUrl = window.location.origin + window.location.pathname;
                   let link = `${baseUrl}?uid=${me.id}&token=${me.secretToken}`;
                   if (eventId) {
                     link += `&event=${eventId}`;
                   }
                   return link;
                })()}
              </div>
              <button 
                onClick={handleCopyLink}
                className={`px-3 py-2 rounded-lg transition-all flex items-center gap-2 text-xs font-bold ${copied ? 'bg-green-500/20 text-green-300' : 'bg-white/10 text-white hover:bg-white/20'}`}
              >
                {copied ? <Check size={14} /> : <LinkIcon size={14} />}
                {copied ? t.copySuccess : t.copyEventLink}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">{t.linkDesc}</p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ParticipantModal;
