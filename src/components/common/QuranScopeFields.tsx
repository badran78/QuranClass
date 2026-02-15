import { SURAH_LIST, surahByNumber } from '@/constants/quran';
import { Assignment } from '@/types';

interface Props {
  value: Assignment['quranScope'];
  onChange: (next: Assignment['quranScope']) => void;
}

export function QuranScopeFields({ value, onChange }: Props) {
  const selectedSurah = surahByNumber(value.surahNumber) ?? SURAH_LIST[0];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-700">Surah</span>
        <select
          value={value.surahNumber}
          onChange={(e) => {
            const surahNumber = Number(e.target.value);
            const surah = surahByNumber(surahNumber);
            onChange({
              scopeMode: 'surah_ayah',
              surahNumber,
              ayahStart: 1,
              ayahEnd: surah?.ayahCount ?? 1
            });
          }}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        >
          {SURAH_LIST.map((surah) => (
            <option key={surah.number} value={surah.number}>
              {surah.number}. {surah.nameEn}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-700">Ayah Start</span>
        <input
          type="number"
          min={1}
          max={selectedSurah.ayahCount}
          value={value.ayahStart}
          onChange={(e) => onChange({ ...value, ayahStart: Number(e.target.value) })}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-700">Ayah End</span>
        <input
          type="number"
          min={1}
          max={selectedSurah.ayahCount}
          value={value.ayahEnd}
          onChange={(e) => onChange({ ...value, ayahEnd: Number(e.target.value) })}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </label>
    </div>
  );
}
