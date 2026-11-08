/**
 * VocabularySetWordsPreview — XEM TRƯỚC TỪ CỦA 1 BỘ TỪ VỰNG
 * ---------------------------------------------------------------------------
 * Dùng trong modal xem chi tiết nội dung 'vocabulary' của khóa học.
 *
 * Bối cảnh:
 *   - Nội dung 'vocabulary' KHÔNG chứa từ — nó là CON TRỎ tới các bộ trong
 *     KHO TỪ VỰNG CHUNG (`vocabulary_sets`).
 *   - `GET /api/v1/vocabulary-sets` (list) KHÔNG trả kèm `words` → muốn xem
 *     từ phải gọi `GET /api/v1/vocabulary-sets/{setId}` cho từng bộ.
 *
 * Vì vậy component này:
 *   1. Tự tìm id các bộ từ `content.vocabularySetIds` / `content_data.setIds`.
 *   2. Gọi API chi tiết cho TỪNG bộ (có cache theo query key).
 *   3. Render bảng từ (word / IPA / nghĩa / từ loại / ví dụ) + tìm kiếm.
 */

import React, { useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { Loader2, Search, Volume2, X } from 'lucide-react';
import { fetchVocabularySet } from '@/shared/api/vocabularyService';
import { cn } from '@/shared/utils/cn';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import type { CourseContentDto } from '@/shared/types/catalog.types';

/* =========================================================
 * Helpers
 * ========================================================= */

/**
 * Lấy danh sách id bộ từ vựng của một nội dung.
 *
 * Ưu tiên `vocabularySetIds` (FK từ response) → fallback `content_data.setIds`.
 */
export function readVocabularySetIds(
  content: CourseContentDto,
): string[] {
  const fromField = content.vocabularySetIds ?? [];
  const fromData = (content.contentData as { setIds?: string[] } | null)?.setIds;
  const merged = [...fromField, ...(fromData ?? [])];
  return Array.from(new Set(merged.filter((id) => Boolean(id?.trim()))));
}

/* =========================================================
 * Component
 * ========================================================= */

export interface VocabularySetWordsPreviewProps {
  /** Nội dung 'vocabulary' cần xem. */
  content: CourseContentDto;
}

export const VocabularySetWordsPreview: React.FC<
  VocabularySetWordsPreviewProps
> = ({ content }) => {
  const setIds = useMemo(() => readVocabularySetIds(content), [content]);
  const [keyword, setKeyword] = useState('');
  /** Bộ đang mở rộng (xem từ). `null` = không mở bộ nào. */
  const [expandedSetId, setExpandedSetId] = useState<string | null>(null);

  /**
   * Tải chi tiết TỪNG bộ.
   *
   * `useQueries` chạy song song, mỗi bộ 1 query — cache theo `setId` nên
   * mở/đóng modal không tải lại.
   */
  const results = useQueries({
    queries: setIds.map((setId) => ({
      queryKey: [...QUERY_KEYS.catalog.vocabularyBank, setId] as const,
      queryFn: () => fetchVocabularySet(setId),
      staleTime: 60_000,
    })),
  });

  const isLoading = results.some((r) => r.isLoading);
  const isError = results.some((r) => r.isError);

  /* ---------- Lọc từ theo từ khoá (chỉ trong bộ đang mở) ---------- */
  const expandedResult = expandedSetId
    ? results[setIds.indexOf(expandedSetId)]
    : undefined;
  const filteredWords = useMemo(() => {
    const words = expandedResult?.data?.words ?? [];
    const kw = keyword.trim().toLowerCase();
    if (!kw) return words;
    return words.filter(
      (w) =>
        w.word.toLowerCase().includes(kw) ||
        (w.meaning ?? '').toLowerCase().includes(kw) ||
        (w.example ?? '').toLowerCase().includes(kw),
    );
  }, [expandedResult?.data?.words, keyword]);

  if (setIds.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/60 p-4 text-center">
        <p className="text-xs font-bold text-amber-800">
          Nội dung này chưa gắn bộ từ vựng nào.
        </p>
        <p className="text-[11px] text-amber-700 mt-1">
          Dùng nút &quot;Sửa nội dung&quot; để tick các bộ trong kho từ vựng chung.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* ---- Danh sách bộ ---- */}
      <div className="space-y-2">
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Đang tải bộ từ vựng…
          </div>
        )}

        {isError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
            <p className="text-xs font-bold text-rose-700">
              Không tải được chi tiết bộ từ vựng.
            </p>
          </div>
        )}

        {results.map((result, i) => {
          const setId = setIds[i];
          const set = result.data;
          const expanded = expandedSetId === setId;

          return (
            <div
              key={setId}
              className={cn(
                'rounded-xl border overflow-hidden transition-colors',
                expanded
                  ? 'border-[#0052CC]/40 bg-blue-50/30'
                  : 'border-slate-200 bg-white',
              )}
            >
              {/* ---- Header bộ ---- */}
              <button
                type="button"
                onClick={() => {
                  setExpandedSetId(expanded ? null : setId);
                  setKeyword('');
                }}
                className="w-full flex items-center gap-3 px-3.5 py-3 text-left hover:bg-slate-50/70 transition-colors"
              >
                <span
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                    expanded
                      ? 'bg-[#0052CC] text-white'
                      : 'bg-blue-50 text-[#0052CC]',
                  )}
                >
                  {result.isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span className="text-xs font-extrabold">
                      {set?.wordCount ?? 0}
                    </span>
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {set?.title ?? 'Đang tải…'}
                  </p>
                  {set?.description && (
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">
                      {set.description}
                    </p>
                  )}
                </div>

                <span className="shrink-0 text-[11px] font-bold text-slate-500">
                  {expanded ? 'Thu gọn' : 'Xem từ'}
                </span>
              </button>

              {/* ---- Bảng từ ---- */}
              {expanded && (
                <div className="border-t border-slate-200/80 bg-white">
                  {/* Tìm kiếm trong bộ */}
                  <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2 h-8 px-3 bg-slate-50 border border-slate-200/80 rounded-lg text-slate-500 flex-1 focus-within:bg-white focus-within:border-[#0052CC] transition-colors">
                      <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input
                        type="search"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder="Tìm trong bộ này…"
                        className="bg-transparent outline-none w-full text-xs placeholder:text-slate-400 text-slate-700"
                        aria-label="Tìm từ trong bộ"
                      />
                      {keyword && (
                        <button
                          type="button"
                          onClick={() => setKeyword('')}
                          aria-label="Xoá tìm kiếm"
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <span className="shrink-0 text-[10px] font-bold text-slate-500">
                      {filteredWords.length}/{set?.wordCount ?? 0} từ
                    </span>
                  </div>

                  {filteredWords.length === 0 ? (
                    <p className="px-3.5 py-6 text-center text-xs text-slate-400">
                      {keyword
                        ? 'Không có từ nào khớp từ khoá.'
                        : 'Bộ này chưa có từ nào.'}
                    </p>
                  ) : (
                    <div className="overflow-x-auto max-h-[45vh] overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-slate-50 border-b border-slate-200/80 z-10">
                          <tr className="text-slate-500 font-extrabold text-[10px] uppercase tracking-wider text-left">
                            <th className="py-2 px-3 font-bold w-8">#</th>
                            <th className="py-2 px-2 font-bold">Từ</th>
                            <th className="py-2 px-2 font-bold">IPA</th>
                            <th className="py-2 px-2 font-bold">Nghĩa</th>
                            <th className="py-2 px-2 font-bold">Từ loại / Ví dụ</th>
                            <th className="py-2 px-2 font-bold text-right w-10">
                              Âm
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredWords.map((w, wi) => (
                            <tr
                              key={w.wordId || `${w.word}-${wi}`}
                              className="hover:bg-slate-50/70 transition-colors"
                            >
                              <td className="py-2 px-3 text-slate-400 font-mono text-center">
                                {wi + 1}
                              </td>
                              <td className="py-2 px-2">
                                <span className="font-bold text-slate-900">
                                  {w.word}
                                </span>
                              </td>
                              <td className="py-2 px-2 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                                {w.ipa || w.phonetic || '—'}
                              </td>
                              <td className="py-2 px-2 text-slate-700">
                                {w.meaning || '—'}
                              </td>
                              <td className="py-2 px-2 text-slate-500 max-w-[200px]">
                                {w.partOfSpeech && (
                                  <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-semibold text-slate-600 mr-1.5">
                                    {w.partOfSpeech}
                                  </span>
                                )}
                                {w.example && (
                                  <span
                                    className="text-[11px] text-slate-400 italic line-clamp-1"
                                    title={w.example}
                                  >
                                    {w.example}
                                  </span>
                                )}
                                {!w.partOfSpeech && !w.example && '—'}
                              </td>
                              <td className="py-2 px-2 text-right">
                                {w.audioUrl ? (
                                  <a
                                    href={w.audioUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    title="Nghe phát âm"
                                    aria-label="Nghe phát âm"
                                    className="inline-flex items-center justify-center w-6 h-6 rounded-md text-[#0052CC] hover:bg-blue-50 transition-colors"
                                  >
                                    <Volume2 className="w-3.5 h-3.5" />
                                  </a>
                                ) : (
                                  <span className="text-slate-200">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VocabularySetWordsPreview;
