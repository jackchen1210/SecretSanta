import React, { useState } from 'react';
import { Gift, Trash2, Plus, Users } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';

interface SetupPhaseProps {
  onStart: (names: string[]) => void;
  lang: Language;
}

const SetupPhase: React.FC<SetupPhaseProps> = ({ onStart, lang }) => {
  const [names, setNames] = useState<string[]>(['', '', '']);
  const [error, setError] = useState<string>('');
  const t = translations[lang];

  const handleNameChange = (index: number, value: string) => {
    const newNames = [...names];
    newNames[index] = value;
    setNames(newNames);
    if (error) setError('');
  };

  const addField = () => {
    setNames([...names, '']);
  };

  const removeField = (index: number) => {
    if (names.length <= 3) {
      setError(t.errorMinParticipants);
      return;
    }
    const newNames = names.filter((_, i) => i !== index);
    setNames(newNames);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validNames = names.map(n => n.trim()).filter(n => n.length > 0);
    
    // Check for duplicates
    const uniqueNames = new Set(validNames);
    if (uniqueNames.size !== validNames.length) {
       setError(t.errorUnique);
       return;
    }

    if (validNames.length < 3) {
      setError(t.errorMinParticipants);
      return;
    }
    onStart(validNames);
  };

  return (
    <div className="w-full max-w-lg mx-auto p-6 bg-santa-dark/80 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl">
      <div className="text-center mb-8">
        <div className="inline-block p-4 rounded-full bg-santa-red mb-4 shadow-lg ring-4 ring-white/20">
          <Gift size={48} className="text-white" />
        </div>
        <h1 className="text-4xl font-holiday text-santa-gold mb-2">{t.setupTitle}</h1>
        <p className="text-gray-300 font-sans">{t.setupSubtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="max-h-[50vh] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
          {names.map((name, index) => (
            <div key={index} className="flex gap-2 items-center group">
              <span className="w-8 text-center font-holiday text-xl text-gray-500">{index + 1}</span>
              <input
                type="text"
                placeholder={t.participantPlaceholder}
                value={name}
                onChange={(e) => handleNameChange(index, e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-santa-red transition-all"
              />
              {names.length > 3 && (
                <button
                  type="button"
                  onClick={() => removeField(index)}
                  className="p-3 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors"
                  aria-label="Remove participant"
                >
                  <Trash2 size={20} />
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addField}
          className="w-full py-3 border-2 border-dashed border-white/20 rounded-xl text-gray-300 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all flex items-center justify-center gap-2 font-medium"
        >
          <Plus size={20} /> {t.addPerson}
        </button>

        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-center text-sm">
            {error}
          </div>
        )}

        <div className="pt-4 border-t border-white/10">
          <button
            type="submit"
            className="w-full bg-santa-red hover:bg-red-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg transform active:scale-95 transition-all flex items-center justify-center gap-2 text-lg"
          >
            <Users size={24} /> {t.startExchange}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SetupPhase;
