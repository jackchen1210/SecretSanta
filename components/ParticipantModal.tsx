
import React, { useState } from 'react';
import { Participant, GiftSuggestion } from '../types';
import { X, Gift, Sparkles, Plus, Trash, List, Link, Check, LogOut, Copy } from 'lucide-react';
import { generateGiftSuggestions } from '../services/geminiService';

interface ParticipantModalProps {
  me: Participant;
  target: Participant;
  allParticipants: Participant[];
  onUpdateWishlist: (participantId: string, newWishlist: string[]) => void;
  onClose?: () => void;
  isStandalone?: boolean;
}

const ParticipantModal: React.FC<ParticipantModalProps> = ({ 
  me, 
  target, 
  onUpdateWishlist, 
  onClose,
  isStandalone = false
}) => {
  const [activeTab, setActiveTab] = useState<'my-target' | 'my-wishlist'>('my-target');
  const [newWishItem, setNewWishItem] = useState('');
  const [copied, setCopied] = useState(false);
  const [showLink, setShowLink] = useState(false);
  
  // AI State
  const [suggestions, setSuggestions] = useState<GiftSuggestion[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState(false);

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
      const results = await generateGiftSuggestions(target.name, target.wishlist);
      setSuggestions(results);
    } catch (err) {
      setAiError(true);
    } finally {
      setLoadingAi(false);
    }
  };

  // Copy Link Logic
  const myUrl = `${window.location.origin}${window.location.pathname}?uid=${me.id}&token=${me.secretToken}`;
  const handleCopyLink = () => {
    navigator.clipboard.writeText(myUrl);
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
            <div className="text-red-200 text-sm font-medium uppercase tracking-wider mb-1">Secret Santa Dashboard</div>
            <h2 className="text-3xl font-holiday text-white">Hello, {me.name}!</h2>
          </div>
          <div className="flex items-center gap-2">
            {!showLink && (
              <button 
                onClick={() => setShowLink(true)}
                className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
                title="Get Access Link"
              >
                <Link size={20} />
              </button>
            )}
            {onClose && (
              <button 
                onClick={onClose} 
                className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors flex items-center gap-2"
                title="Logout / Close"
              >
                <LogOut size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Link Reveal Section */}
        {showLink && (
          <div className="bg-black/40 p-4 flex flex-col gap-2 border-b border-white/10 animate-fadeIn">
            <div className="flex justify-between items-center text-sm text-gray-300">
              <span>Your private access link:</span>
              <button onClick={() => setShowLink(false)} className="hover:text-white"><X size={16}/></button>
            </div>
            <div className="flex items-center gap-2 bg-black/40 p-2 rounded-lg border border-white/10">
              <input 
                readOnly 
                value={myUrl} 
                className="bg-transparent text-gray-400 text-xs font-mono flex-1 outline-none"
              />
              <button onClick={handleCopyLink} className="text-santa-gold hover:text-white">
                {copied ? <Check size={16}/> : <Copy size={16}/>}
              </button>
            </div>
            <p className="text-[10px] text-gray-500">Save this link or memorize your password to access this page later.</p>
          </div>
        )}

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
            Who I'm Gifting To
          </button>
          <button
            onClick={() => setActiveTab('my-wishlist')}
            className={`flex-1 py-4 text-center font-medium transition-colors ${
              activeTab === 'my-wishlist' 
                ? 'bg-white/5 text-santa-gold border-b-2 border-santa-gold' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            My Wishlist
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
                
                <h3 className="text-gray-400 mb-2">You are the Secret Santa for</h3>
                <div className="text-5xl font-holiday text-santa-gold drop-shadow-md mb-6">{target.name}</div>
                
                <div className="w-16 h-1 bg-gradient-to-r from-transparent via-santa-red to-transparent mx-auto"></div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <List size={20} className="text-santa-green" />
                  {target.name}'s Wishlist
                </h3>
                {target.wishlist.length === 0 ? (
                  <div className="text-gray-500 italic p-4 text-center border border-dashed border-white/10 rounded-xl">
                    They haven't added anything to their wishlist yet.
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
                    AI Gift Assistant
                  </h3>
                  {!loadingAi && (
                    <button 
                      onClick={handleAskAI}
                      className="text-xs bg-santa-green hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg transition-colors"
                    >
                      {suggestions.length > 0 ? 'Regenerate' : 'Get Ideas'}
                    </button>
                  )}
                </div>

                {loadingAi && (
                  <div className="p-8 text-center text-gray-400 animate-pulse">
                    Thinking of perfect gifts...
                  </div>
                )}

                {aiError && (
                  <div className="p-4 bg-red-900/30 text-red-300 rounded-xl text-sm">
                    Could not connect to Santa's Workshop (AI). Please check your API key or try again.
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
                    Stuck? Ask our AI elf for gift suggestions based on {target.name}'s profile.
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
                  Help your Secret Santa out! Add things you'd love to receive. They can see this list anonymously.
                </p>
              </div>

              <form onSubmit={handleAddWish} className="flex gap-2">
                <input 
                  type="text" 
                  value={newWishItem}
                  onChange={(e) => setNewWishItem(e.target.value)}
                  placeholder="I would love..."
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
                    Your list is empty. Add something!
                  </div>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParticipantModal;
