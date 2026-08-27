import { Trash2, ExternalLink, Star } from 'lucide-react';

interface ApodData {
  title: string;
  url: string;
  explanation: string;
  date: string;
  media_type: string;
  copyright?: string;
  hdurl?: string;
}

interface FavoritesProps {
  favorites: ApodData[];
  onRemoveFavorite: (date: string) => void;
  onSelectImage: (date: string) => void;
}

const formatDate = (dateString: string) => {
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

export default function Favorites({ favorites, onRemoveFavorite, onSelectImage }: FavoritesProps) {
  return (
    <div className="space-y-10 animate-fade-in pb-16">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl md:text-5xl font-serif font-semibold tracking-tight text-slate-100 leading-none">
            Saved <span className="italic font-light text-[#E4A853]">Cosmic Wonders</span>
          </h2>
          <p className="text-slate-400 mt-3 text-sm md:text-base font-light font-sans tracking-wide">
            Your curated collection of deep space discoveries and celestial imagery.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#0C0E12] border border-white/5 px-4 py-1.5 rounded-full text-[#E4A853] self-start md:self-auto shadow-[0_0_15px_rgba(228,168,83,0.05)]">
          <Star className="text-[#E4A853] fill-[#E4A853]" size={12} />
          <span className="text-[10px] font-mono font-bold tracking-widest uppercase">{favorites.length} Cataloged</span>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-12 md:p-20 bg-[#0C0E12] border border-dashed border-white/5 rounded-2xl max-w-2xl mx-auto space-y-6">
          <div className="w-14 h-14 rounded-full bg-[#050608] border border-[#E4A853]/20 flex items-center justify-center text-slate-500 animate-pulse shadow-[0_0_15px_rgba(228,168,83,0.1)]">
            <Star size={20} className="text-[#E4A853]" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-serif font-medium text-slate-200">Celestial Vault Empty</h3>
            <p className="text-slate-400 max-w-sm text-xs font-sans font-light leading-relaxed">
              Discover the secrets of the universe. Tap the star icon on any Astronomy Picture of the Day to catalog it here for permanent record.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {favorites.map((item) => (
            <div 
              key={item.date} 
              className="group bg-[#0C0E12] border border-white/5 hover:border-[#E4A853]/30 rounded-xl overflow-hidden hover:shadow-[0_12px_30px_rgba(0,0,0,0.65),0_0_20px_rgba(228,168,83,0.03)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col h-full"
            >
              {/* Media Preview Box */}
              <div className="relative aspect-video overflow-hidden bg-[#050608]">
                {item.media_type === 'image' ? (
                  <img 
                    src={item.url} 
                    alt={item.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#050608] text-slate-500">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Video Content</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#050608] via-transparent to-transparent opacity-60"></div>
                <span className="absolute bottom-3 left-3 bg-[#050608]/90 backdrop-blur-sm border border-white/5 px-2 py-0.5 rounded text-[10px] font-mono text-slate-300">
                  {formatDate(item.date)}
                </span>
              </div>

              {/* Informative Body */}
              <div className="p-4 flex flex-col flex-grow space-y-3">
                <h3 className="font-semibold text-slate-200 text-sm leading-snug group-hover:text-[#E4A853] transition-colors line-clamp-1">
                  {item.title}
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed line-clamp-3 flex-grow font-sans font-light">
                  {item.explanation}
                </p>

                {/* Footer Operations */}
                <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-auto">
                  <button
                    onClick={() => onSelectImage(item.date)}
                    className="inline-flex items-center gap-1.5 text-xs text-[#E4A853] hover:text-[#ffd99e] font-semibold transition cursor-pointer"
                  >
                    <ExternalLink size={12} />
                    View APOD
                  </button>
                  <button
                    onClick={() => onRemoveFavorite(item.date)}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-[#050608] rounded-full transition cursor-pointer"
                    title="Remove from favorites"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
