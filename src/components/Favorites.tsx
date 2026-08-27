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
    <div className="space-y-8 animate-fade-in pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl md:text-5xl font-serif font-light tracking-tight text-slate-100 leading-none">
            Saved <span className="italic font-normal text-stellar-400">Cosmic Wonders</span>
          </h2>
          <p className="text-slate-400 mt-2 text-sm md:text-base font-light">
            Your curated collection of deep space discoveries and celestial imagery.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-space-900 border border-space-800 px-4 py-1.5 rounded-lg text-stellar-400 self-start md:self-auto">
          <Star className="text-stellar-400 fill-stellar-400" size={14} />
          <span className="text-xs font-mono font-bold tracking-wider">{favorites.length} SAVED</span>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-12 md:p-20 bg-space-900 border border-dashed border-space-800 rounded-xl max-w-2xl mx-auto space-y-6">
          <div className="w-14 h-14 rounded-full bg-space-950 border border-space-800 flex items-center justify-center text-slate-500 animate-pulse">
            <Star size={22} className="text-slate-600" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-serif font-medium text-slate-200">No cosmic wonders saved</h3>
            <p className="text-slate-400 max-w-sm text-sm font-sans font-light leading-relaxed">
              Discover the secrets of the universe. Tap the star icon on any Astronomy Picture of the Day to save it here for cataloging.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {favorites.map((item) => (
            <div 
              key={item.date} 
              className="group bg-space-900/60 border border-space-800 hover:border-space-600 rounded-xl overflow-hidden hover:shadow-[0_12px_24px_rgba(0,0,0,0.55)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col h-full"
            >
              {/* Image / Video thumbnail */}
              <div className="relative aspect-video overflow-hidden bg-space-950">
                {item.media_type === 'image' ? (
                  <img 
                    src={item.url} 
                    alt={item.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-space-950 text-slate-500">
                    <span className="text-xs font-mono uppercase tracking-widest text-slate-400">Video Content</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-space-950 via-transparent to-transparent opacity-60"></div>
                <span className="absolute bottom-3 left-3 bg-space-950/80 backdrop-blur-sm border border-space-800 px-2 py-0.5 rounded text-[10px] font-mono text-slate-300">
                  {formatDate(item.date)}
                </span>
              </div>

              {/* Text Info */}
              <div className="p-4 flex flex-col flex-grow space-y-3">
                <h3 className="font-semibold text-slate-200 text-sm leading-snug group-hover:text-stellar-400 transition-colors line-clamp-1">
                  {item.title}
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed line-clamp-3 flex-grow font-sans font-light">
                  {item.explanation}
                </p>

                {/* Footer buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-space-800/60 mt-auto">
                  <button
                    onClick={() => onSelectImage(item.date)}
                    className="inline-flex items-center gap-1.5 text-xs text-stellar-400 hover:text-stellar-500 font-semibold transition cursor-pointer"
                  >
                    <ExternalLink size={12} />
                    View APOD
                  </button>
                  <button
                    onClick={() => onRemoveFavorite(item.date)}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-space-950 rounded-full transition cursor-pointer"
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
