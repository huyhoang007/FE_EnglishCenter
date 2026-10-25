/**
 * VocabularySetEditorModal — Tạo / Sửa BỘ TỪ VỰNG trong KHO CHUNG
 * -----------------------------------------------------------
 * API thật (Backend):
 *   POST /api/v1/vocabulary-sets          → tạo bộ mới trong kho chung
 *   PUT  /api/v1/vocabulary-sets/{setId}  → sửa bộ trong kho chung
 *
 * ĐÂY là UI cho LUỒNG 1 (Create Word / tạo từ vựng chung):
 *   - KHÔNG có `courseId` — bộ từ vựng được tạo độc lập.
 *   - Gán vào khóa học là 1 luồng RIÊNG (`VocabularyAssignPanel`).
 *
 * Bố cục 2 cột:
 *   - Trái: form nhập TÊN BỘ + MÔ TẢ + mini-form thêm 1 từ.
 *   - Phải: danh sách từ đã thêm trong bộ (sửa / xoá được).
 *
 * Toàn bộ nhãn UI đi qua i18n key → hỗ trợ nút gạt Anh/Việt.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ListPlus, PencilLine, Plus, Save, Trash2, Volume2 } from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { Modal } from '@/shared/components/Modal';
import { useToast } from '@/shared/components/Toast';
import { cn } from '@/shared/utils/cn';
import { useTranslation } from '@/shared/i18n/I18nProvider';
import {
  createVocabularySet,
  updateVocabularySet,
  type VocabularySet,
  type VocabularyWord,
} from '@/shared/api/vocabularyService';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';

/* =========================================================
 * Types
 * ========================================================= */

/** 1 từ đang nhập trong mini-form. */
export interface VocabWordDraft {
  word: string;
  ipa: string;
  meaning: string;
  audioUrl: string;
  partOfSpeech: string;
  example: string;
}

const EMPTY_DRAFT: VocabWordDraft = {
  word: '',
  ipa: '',
  meaning: '',
  audioUrl: '',
  partOfSpeech: '',
  example: '',
};

/* =========================================================
 * Props
 * ========================================================= */
export interface VocabularySetEditorModalProps {
  open: boolean;
  onClose: () => void;
  /** Bộ đang sửa — `null` nghĩa là tạo mới. */
  editing?: VocabularySet | null;
  /** Bộ vừa tạo/sửa xong — báo ra ngoài để parent refresh. */
  onSaved?: (set: VocabularySet) => void;
}

/* =========================================================
 * Component
 * ========================================================= */
export const VocabularySetEditorModal: React.FC<
  VocabularySetEditorModalProps
> = ({ open, onClose, editing = null, onSaved }) => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();

  const isEditing = Boolean(editing);

  /* ---------- State ---------- */
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [draft, setDraft] = useState<VocabWordDraft>(EMPTY_DRAFT);
  /** Index của từ đang sửa trong `words` (null = đang thêm mới). */
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [touched, setTouched] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /* ---------- Nạp dữ liệu khi mở modal ---------- */
  useEffect(() => {
    if (!open) return;
    setTouched(false);
    setPreviewing(false);
    setEditingIndex(null);
    setDraft(EMPTY_DRAFT);

    if (editing) {
      setTitle(editing.title ?? '');
      setDescription(editing.description ?? '');
      setWords(editing.words ?? []);
    } else {
      setTitle('');
      setDescription('');
      setWords([]);
    }
  }, [open, editing]);

  /* ---------- Dừng audio khi đóng ---------- */
  useEffect(() => {
    if (open) return;
    audioRef.current?.pause();
    audioRef.current = null;
    setPreviewing(false);
  }, [open]);

  /* ---------- Validate ---------- */
  const errors = useMemo(() => {
    const trimmedTitle = title.trim();
    const trimmedWord = draft.word.trim();
    const trimmedMeaning = draft.meaning.trim();
    const trimmedAudio = draft.audioUrl.trim();

    return {
      title: !trimmedTitle
        ? t('vocab.bank.titleRequired')
        : trimmedTitle.length > 255
          ? t('content.validation.titleTooLong')
          : '',
      draftWord: !trimmedWord
        ? t('vocab.validation.wordRequired')
        : trimmedWord.length > 255
          ? t('vocab.validation.wordTooLong')
          : '',
      draftMeaning: !trimmedMeaning
        ? t('vocab.validation.meaningRequired')
        : trimmedMeaning.length > 500
          ? t('vocab.validation.meaningTooLong')
          : '',
      draftAudio: !trimmedAudio
        ? ''
        : trimmedAudio.length > 500
          ? t('vocab.validation.audioUrlTooLong')
          : !/^https?:\/\/.+/i.test(trimmedAudio)
            ? t('vocab.validation.audioUrlInvalid')
            : '',
      draftIpa: draft.ipa.trim().length > 100 ? t('vocab.validation.ipaTooLong') : '',
      /** Bộ phải có ít nhất một từ. */
      words: words.length === 0 ? t('vocab.bank.wordsRequired') : '',
    };
  }, [title, draft, words.length, t]);

  /** Trùng từ trong cùng bộ (case-insensitive) — bỏ qua từ đang sửa. */
  const duplicateWord = useMemo(() => {
    const key = draft.word.trim().toLowerCase();
    if (!key) return false;
    return words.some(
      (w, idx) => idx !== editingIndex && w.word.toLowerCase() === key,
    );
  }, [draft.word, words, editingIndex]);

  const hasError =
    Object.values(errors).some(Boolean) || duplicateWord;

  /* ---------- Mutations ---------- */
  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.catalog.vocabularyBank,
    });
  };

  const buildPayload = () => ({
    title: title.trim(),
    description: description.trim() || undefined,
    words: words.map((w) => ({
      word: w.word,
      ipa: w.ipa || undefined,
      meaning: w.meaning || undefined,
      audioUrl: w.audioUrl || undefined,
      partOfSpeech: w.partOfSpeech || undefined,
      example: w.example || undefined,
    })),
  });

  const createMutation = useMutation({
    mutationFn: () => createVocabularySet(buildPayload()),
    onSuccess: (saved) => {
      toast.success(t('vocab.feedback.added'));
      invalidate();
      onSaved?.(saved);
      onClose();
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : t('vocab.feedback.addFailed'),
      ),
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!editing) throw new Error(t('vocab.feedback.updateFailed'));
      return updateVocabularySet(editing.setId, buildPayload());
    },
    onSuccess: (saved) => {
      toast.success(t('vocab.feedback.updated'));
      invalidate();
      onSaved?.(saved);
      onClose();
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : t('vocab.feedback.updateFailed'),
      ),
  });

  /* ---------- Handlers ---------- */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (hasError) return;
    if (isEditing) updateMutation.mutate();
    else createMutation.mutate();
  };

  /** Thêm / cập nhật 1 từ trong danh sách của bộ. */
  const addWordToList = () => {
    const word = draft.word.trim();
    if (!word) {
      toast.error(t('vocab.validation.wordRequired'));
      return;
    }
    if (!draft.meaning.trim()) {
      toast.error(t('vocab.validation.meaningRequired'));
      return;
    }
    if (duplicateWord) {
      toast.error(t('vocab.validation.duplicateWord'));
      return;
    }

    const next: VocabularyWord = {
      wordId: '',
      word,
      ipa: draft.ipa.trim(),
      phonetic: draft.ipa.trim(),
      meaning: draft.meaning.trim(),
      audioUrl: draft.audioUrl.trim(),
      partOfSpeech: draft.partOfSpeech.trim(),
      example: draft.example.trim(),
    };

    setWords((prev) =>
      editingIndex !== null
        ? prev.map((w, idx) => (idx === editingIndex ? next : w))
        : [...prev, next],
    );
    setDraft(EMPTY_DRAFT);
    setEditingIndex(null);
    toast.success(
      editingIndex !== null
        ? t('content.feedback.wordUpdated')
        : t('content.feedback.wordAdded'),
    );
  };

  /** Load 1 từ về mini-form để sửa nhanh. */
  const startEditWord = (index: number) => {
    const item = words[index];
    if (!item) return;
    setDraft({
      word: item.word,
      ipa: item.ipa || item.phonetic || '',
      meaning: item.meaning,
      audioUrl: item.audioUrl,
      partOfSpeech: item.partOfSpeech,
      example: item.example,
    });
    setEditingIndex(index);
  };

  const cancelEditWord = () => {
    setDraft(EMPTY_DRAFT);
    setEditingIndex(null);
  };

  const removeWordFromList = (index: number) => {
    setWords((prev) => prev.filter((_, i) => i !== index));
    if (editingIndex === index) cancelEditWord();
  };

  /** Nghe thử audio đang nhập. */
  const previewAudio = () => {
    const url = draft.audioUrl.trim();
    if (!url) {
      toast.error(t('vocab.feedback.audioMissing'));
      return;
    }
    try {
      audioRef.current?.pause();
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setPreviewing(false);
      audio.onerror = () => {
        setPreviewing(false);
        toast.error(t('vocab.feedback.audioError'));
      };
      setPreviewing(true);
      audio.play().catch(() => {
        setPreviewing(false);
        toast.error(t('vocab.feedback.audioError'));
      });
    } catch {
      setPreviewing(false);
      toast.error(t('vocab.feedback.audioError'));
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidth="2xl"
      icon={ListPlus}
      title={isEditing ? t('vocab.bank.updateTitle') : t('vocab.bank.createTitle')}
      subtitle={t('vocab.bank.subtitle')}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,340px)_1fr] gap-6">
          {/* ============ CỘT TRÁI: THÔNG TIN BỘ + THÊM TỪ ============ */}
          <div className="space-y-4">
            {/* ---- Tên bộ ---- */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t('vocab.bank.titleLabel')}{' '}
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('vocab.bank.titlePlaceholder')}
                className={cn(
                  'w-full h-10 px-3 rounded-xl border text-sm outline-none transition-colors',
                  'placeholder:text-slate-300',
                  touched && errors.title
                    ? 'border-rose-300 focus:border-rose-400'
                    : 'border-slate-200 focus:border-[#0052CC]',
                )}
                autoFocus
              />
              {touched && errors.title && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.title}</p>
              )}
            </div>

            {/* ---- Mô tả ---- */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t('vocab.bank.descriptionLabel')}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('vocab.bank.descriptionPlaceholder')}
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none transition-colors placeholder:text-slate-300 focus:border-[#0052CC] resize-y"
              />
            </div>

            {/* ---- Mini-form thêm / sửa 1 từ ---- */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-[#0052CC]" />
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {editingIndex !== null
                    ? t('content.vocab.editingTitle')
                    : t('vocab.bank.addWord')}
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  {t('vocab.form.word')}{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={draft.word}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, word: e.target.value }))
                  }
                  placeholder={t('vocab.form.wordPlaceholder')}
                  className={cn(
                    'w-full h-10 px-3 rounded-xl border text-sm outline-none transition-colors',
                    'placeholder:text-slate-300',
                    touched && (errors.draftWord || duplicateWord)
                      ? 'border-rose-300 focus:border-rose-400'
                      : 'border-slate-200 focus:border-[#0052CC]',
                  )}
                />
                {touched && duplicateWord && (
                  <p className="text-[11px] text-amber-600 mt-1">
                    {t('vocab.validation.duplicateWord')}
                  </p>
                )}
                {touched && errors.draftWord && !duplicateWord && (
                  <p className="text-[11px] text-rose-500 mt-1">
                    {errors.draftWord}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  {t('vocab.form.ipa')}
                </label>
                <input
                  type="text"
                  value={draft.ipa}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, ipa: e.target.value }))
                  }
                  placeholder={t('vocab.form.ipaPlaceholder')}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm font-mono outline-none transition-colors placeholder:text-slate-300 focus:border-[#0052CC]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  {t('vocab.form.meaning')}{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={draft.meaning}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, meaning: e.target.value }))
                  }
                  placeholder={t('vocab.form.meaningPlaceholder')}
                  className={cn(
                    'w-full h-10 px-3 rounded-xl border text-sm outline-none transition-colors',
                    'placeholder:text-slate-300',
                    touched && errors.draftMeaning
                      ? 'border-rose-300 focus:border-rose-400'
                      : 'border-slate-200 focus:border-[#0052CC]',
                  )}
                />
                {touched && errors.draftMeaning && (
                  <p className="text-[11px] text-rose-500 mt-1">
                    {errors.draftMeaning}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  {t('vocab.form.audioUrl')}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={draft.audioUrl}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, audioUrl: e.target.value }))
                    }
                    placeholder={t('vocab.form.audioUrlPlaceholder')}
                    className={cn(
                      'flex-1 min-w-0 h-10 px-3 rounded-xl border text-sm outline-none transition-colors',
                      'placeholder:text-slate-300',
                      touched && errors.draftAudio
                        ? 'border-rose-300 focus:border-rose-400'
                        : 'border-slate-200 focus:border-[#0052CC]',
                    )}
                  />
                  <button
                    type="button"
                    onClick={previewAudio}
                    disabled={!draft.audioUrl.trim()}
                    title={t('vocab.action.previewAudio')}
                    aria-label={t('vocab.action.previewAudio')}
                    className={cn(
                      'shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors',
                      'disabled:opacity-40 disabled:cursor-not-allowed',
                      previewing
                        ? 'bg-[#0052CC] text-white'
                        : 'bg-blue-50 text-[#0052CC] hover:bg-[#0052CC] hover:text-white',
                    )}
                  >
                    <Volume2
                      className={cn('w-4 h-4', previewing && 'animate-pulse')}
                    />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    {t('vocab.form.partOfSpeech')}
                  </label>
                  <input
                    type="text"
                    value={draft.partOfSpeech}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        partOfSpeech: e.target.value,
                      }))
                    }
                    placeholder={t('vocab.form.partOfSpeechPlaceholder')}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none transition-colors placeholder:text-slate-300 focus:border-[#0052CC]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    {t('vocab.form.example')}
                  </label>
                  <input
                    type="text"
                    value={draft.example}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, example: e.target.value }))
                    }
                    placeholder={t('vocab.form.examplePlaceholder')}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none transition-colors placeholder:text-slate-300 focus:border-[#0052CC]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  leftIcon={editingIndex !== null ? PencilLine : ListPlus}
                  onClick={addWordToList}
                  fullWidth
                  className="font-bold"
                >
                  {editingIndex !== null
                    ? t('content.action.updateWord')
                    : t('content.action.addWordToList')}
                </Button>
                {editingIndex !== null && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={cancelEditWord}
                    className="shrink-0 font-bold"
                  >
                    {t('content.action.cancelEditWord')}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* ============ CỘT PHẢI: DANH SÁCH TỪ TRONG BỘ ============ */}
          <div className="min-w-0">
            <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-4 py-3 bg-slate-50/70 border-b border-slate-200/80">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  {t('vocab.bank.wordsInSet')}
                </p>
                <span className="shrink-0 text-[10px] font-bold text-slate-400">
                  {t('vocab.modal.total', { count: words.length })}
                </span>
              </div>

              <div className="p-4">
                {touched && errors.words && (
                  <p className="text-[11px] text-rose-500 mb-2">
                    {errors.words}
                  </p>
                )}

                {words.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 px-5 py-10 text-center">
                    <p className="text-xs font-bold text-slate-600">
                      {t('vocab.bank.noWords')}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {t('vocab.bank.noWordsHint')}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-200/80 overflow-hidden bg-white">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 font-extrabold text-[10px] uppercase tracking-wider text-left">
                            <th className="py-2.5 px-4 font-bold">
                              {t('vocab.table.word')}
                            </th>
                            <th className="py-2.5 px-3 font-bold">
                              {t('vocab.table.ipa')}
                            </th>
                            <th className="py-2.5 px-3 font-bold">
                              {t('vocab.table.meaning')}
                            </th>
                            <th className="py-2.5 px-4 font-bold text-right">
                              {t('vocab.table.actions')}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {words.map((item, index) => (
                            <tr
                              key={`${item.word}-${index}`}
                              className={cn(
                                'transition-colors',
                                editingIndex === index
                                  ? 'bg-blue-50/50'
                                  : 'hover:bg-slate-50/60',
                              )}
                            >
                              <td className="py-2.5 px-4 max-w-[160px]">
                                <span className="font-bold text-slate-900 block truncate">
                                  {item.word}
                                </span>
                                {item.partOfSpeech && (
                                  <span className="text-[10px] text-slate-400 italic">
                                    {item.partOfSpeech}
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                                {item.ipa || item.phonetic || '—'}
                              </td>
                              <td className="py-2.5 px-3 text-slate-700 max-w-[200px]">
                                <span className="block truncate">
                                  {item.meaning || '—'}
                                </span>
                              </td>
                              <td className="py-2.5 px-4">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={() => startEditWord(index)}
                                    aria-label={t('content.action.editWord')}
                                    title={t('content.action.editWord')}
                                    className="p-1.5 rounded-lg text-[#0052CC] hover:bg-blue-50 transition-colors"
                                  >
                                    <PencilLine className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeWordFromList(index)}
                                    aria-label={t('content.action.removeWord')}
                                    title={t('content.action.removeWord')}
                                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ============ ACTIONS ============ */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isPending}
            leftIcon={isEditing ? Save : Plus}
            className="bg-[#0052CC] hover:bg-[#0040A8] font-bold"
          >
            {isEditing ? t('vocab.action.update') : t('vocab.action.add')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default VocabularySetEditorModal;
