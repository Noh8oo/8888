
import React, { useState, useEffect } from 'react';
import { 
  Palette, Sparkles, Film, Box, Ghost, Feather, Layers, Sun, Moon, 
  Zap, CloudRain, Monitor, Brush, Dice5, RefreshCw, Star, 
  Wind, Triangle, Coffee, Flame, Heart, Zap as Bolt
} from 'lucide-react';

export interface ArtisticStyle {
  id: string;
  name: string;
  instruction: string;
  icon: any;
  color: string;
}

export const ALL_ARTISTIC_STYLES: ArtisticStyle[] = [
  { id: 'oil', name: 'لوحة زيتية', instruction: 'Classical oil painting with visible brushstrokes and rich textures.', icon: Brush, color: 'text-orange-500' },
  { id: 'anime', name: 'أنمي ياباني', instruction: 'High-quality Japanese anime style, clean lines, vibrant cel-shading.', icon: Ghost, color: 'text-pink-500' },
  { id: 'pixar', name: 'Pixar 3D', instruction: 'Modern 3D animation style similar to Pixar or Disney, soft lighting, smooth surfaces.', icon: Box, color: 'text-blue-500' },
  { id: 'sketch', name: 'رسم رصاص', instruction: 'Detailed pencil sketch with graphite texture and artistic shading.', icon: Feather, color: 'text-gray-500' },
  { id: 'cyberpunk', name: 'سايبر بانك', instruction: 'Cyberpunk futuristic style with neon lights, high contrast, and nighttime tech vibes.', icon: Zap, color: 'text-purple-500' },
  { id: 'watercolor', name: 'ألوان مائية', instruction: 'Soft watercolor illustration with blending colors and paper texture.', icon: CloudRain, color: 'text-teal-500' },
  { id: 'cinematic', name: 'سينمائي', instruction: 'Dramatic cinematic photography, anamorphic flares, mood lighting.', icon: Film, color: 'text-yellow-500' },
  { id: 'retro', name: 'ريترو 80s', instruction: 'Retro 80s aesthetic, VHS noise, synthwave colors, nostalgic feel.', icon: Layers, color: 'text-indigo-500' },
  { id: 'pixel', name: 'بكسل آرت', instruction: '16-bit pixel art style, game boy aesthetic, clean pixelated details.', icon: Monitor, color: 'text-green-500' },
  // New Styles
  { id: 'pop-art', name: 'بوب آرت', instruction: 'Andy Warhol style pop art with bold colors, halftone dots, and high contrast.', icon: Star, color: 'text-red-500' },
  { id: 'ukiyo-e', name: 'فن ياباني قديم', instruction: 'Traditional Japanese Ukiyo-e woodblock print style, flat colors, elegant lines.', icon: Wind, color: 'text-emerald-600' },
  { id: 'low-poly', name: 'لو بولي', instruction: 'Abstract low-poly 3D geometric style with sharp triangular facets.', icon: Triangle, color: 'text-cyan-500' },
  { id: 'vintage-poster', name: 'ملصق قديم', instruction: 'Vintage travel poster style from the early 20th century, muted colors, textured paper.', icon: Coffee, color: 'text-amber-700' },
  { id: 'gothic', name: 'قوطي داكن', instruction: 'Dark gothic fantasy style, ornate details, moody atmosphere, sharp edges.', icon: Flame, color: 'text-stone-800' },
  { id: 'pastel', name: 'ألوان باستيل', instruction: 'Soft pastel colors, dreamy atmosphere, low contrast, gentle lighting.', icon: Heart, color: 'text-rose-300' },
  { id: 'origami', name: 'أوريغامي', instruction: 'Paper fold origami style, sharp creases, clean paper texture shadows.', icon: Layers, color: 'text-orange-300' },
  { id: 'steampunk', name: 'ستيم بانك', instruction: 'Steampunk aesthetic, brass gears, steam, Victorian machinery vibes, sepia tones.', icon: Bolt, color: 'text-amber-900' },
];

interface ArtisticGalleryProps {
  onSelectStyle: (style: ArtisticStyle) => void;
  isLoading: boolean;
}

export const ArtisticGallery: React.FC<ArtisticGalleryProps> = ({ onSelectStyle, isLoading }) => {
  const [displayedStyles, setDisplayedStyles] = useState<ArtisticStyle[]>([]);
  const [isShuffling, setIsShuffling] = useState(false);

  // Initialize with 9 random styles
  useEffect(() => {
    shuffleStyles();
  }, []);

  const shuffleStyles = () => {
    setIsShuffling(true);
    setTimeout(() => {
      const shuffled = [...ALL_ARTISTIC_STYLES].sort(() => 0.5 - Math.random());
      setDisplayedStyles(shuffled.slice(0, 9));
      setIsShuffling(false);
    }, 400);
  };

  const handleMagicRandom = () => {
    const randomStyle = ALL_ARTISTIC_STYLES[Math.floor(Math.random() * ALL_ARTISTIC_STYLES.length)];
    onSelectStyle(randomStyle);
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
            <Palette className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-dark dark:text-white">استوديو الفن</h3>
            <p className="text-[10px] text-gray-500">حول صورك لتحف فنية ذكية</p>
          </div>
        </div>
        
        <button 
          onClick={shuffleStyles}
          disabled={isLoading || isShuffling}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-orange-500 transition-all active:rotate-180 duration-500"
          title="تبديل الأنماط"
        >
          <RefreshCw className={`w-5 h-5 ${isShuffling ? 'animate-spin text-orange-500' : ''}`} />
        </button>
      </div>

      <div className={`grid grid-cols-2 sm:grid-cols-3 gap-3 flex-1 transition-opacity duration-300 ${isShuffling ? 'opacity-0' : 'opacity-100'}`}>
        {displayedStyles.map((style) => (
          <button
            key={style.id}
            onClick={() => onSelectStyle(style)}
            disabled={isLoading || isShuffling}
            className="group relative flex flex-col items-center gap-3 p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-orange-500/50 hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className={`p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 group-hover:scale-110 transition-transform ${style.color}`}>
              <style.icon className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold text-gray-700 dark:text-gray-200 text-center leading-tight">{style.name}</span>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Sparkles className="w-3 h-3 text-orange-400 animate-pulse" />
            </div>
          </button>
        ))}
      </div>
      
      <div className="pt-4 mt-auto border-t border-gray-100 dark:border-gray-700 space-y-3">
        <button
          onClick={handleMagicRandom}
          disabled={isLoading || isShuffling}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-orange-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
        >
          <Dice5 className="w-4 h-4" />
          نمط سحري عشوائي
        </button>
        
        <div className="p-3 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-900/30">
          <p className="text-[10px] text-orange-700 dark:text-orange-400 leading-relaxed text-center font-medium">
            سيتم استهلاك بضعة ثوانٍ لإعادة تخيل المشهد بالكامل.
          </p>
        </div>
      </div>
    </div>
  );
};
