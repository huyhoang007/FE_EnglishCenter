/**
 * VocabularySetEditorModal — Tạo / Sửa BỘ TỪ VỰNG trong KHO CHUNG
 * -----------------------------------------------------------
 * API thật (Backend):
 *   POST /api/v1/vocabulary-sets          → tạo bộ mới trong kho chung
 *   PUT  /api/v1/vocabulary-sets/{setId}  → sửa bộ trong kho chung
 *
 * Luồng hoạt động tối giản & tiện lợi:
 *   1. Nhập Tên bộ từ vựng *
 *   2. Nhập Mô tả (tuỳ chọn)
 *   3. Tải lên file Excel (.xlsx, .xls) hoặc CSV chứa danh sách từ vựng
 *   4. Bảng xem trước danh sách từ được trích xuất từ file (có thể xoá từng từ)
 *
 * Toàn bộ nhãn UI đi qua i18n key → hỗ trợ nút gạt Anh/Việt.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Download,
  FileSpreadsheet,
  ListPlus,
  Loader2,
  Plus,
  Save,
  Trash2,
  Upload,
} from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { Modal } from '@/shared/components/Modal';
import { useToast } from '@/shared/components/Toast';
import { cn } from '@/shared/utils/cn';
import { useTranslation } from '@/shared/i18n/I18nProvider';
import {
  parseVocabularyFile,
  VOCABULARY_FILE_ACCEPT,
  type ParsedVocabWord,
} from '@/shared/utils/parseVocabularyFile';
import {
  createVocabularySet,
  updateVocabularySet,
  type VocabularySet,
  type VocabularyWord,
} from '@/shared/api/vocabularyService';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';

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
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [touched, setTouched] = useState(false);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /* ---------- Nạp dữ liệu khi mở modal ---------- */
  useEffect(() => {
    if (!open) return;
    setTouched(false);
    setIsParsingFile(false);
    setIsDragging(false);
    setUploadedFileName('');

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

  /* ---------- Validate ---------- */
  const errors = useMemo(() => {
    const trimmedTitle = title.trim();
    return {
      title: !trimmedTitle
        ? t('vocab.bank.titleRequired')
        : trimmedTitle.length > 255
          ? t('content.validation.titleTooLong')
          : '',
      words: words.length === 0 ? t('vocab.bank.wordsRequired') : '',
    };
  }, [title, words.length, t]);

  const hasError = Object.values(errors).some(Boolean);

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

  const removeWordFromList = (index: number) => {
    setWords((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearAll = () => {
    if (words.length === 0) return;
    setWords([]);
    setUploadedFileName('');
  };

  /* ---------- File Import Handlers ---------- */
  const convertParsedToVocabWords = (
    parsedList: ParsedVocabWord[],
  ): VocabularyWord[] =>
    parsedList.map((p) => ({
      wordId: '',
      word: p.word,
      ipa: p.ipa,
      phonetic: p.ipa,
      meaning: p.meaning,
      audioUrl: p.audioUrl,
      partOfSpeech: p.partOfSpeech,
      example: p.example,
    }));

  const processFile = async (file: File) => {
    setIsParsingFile(true);
    try {
      const result = await parseVocabularyFile(file);

      if (result.words.length === 0) {
        toast.error(t('vocab.bank.noWords'));
        return;
      }

      const newWords = convertParsedToVocabWords(result.words);
      setUploadedFileName(`${file.name} (${newWords.length} từ)`);

      // Nếu danh sách hiện tại đang trống → nạp thẳng
      if (words.length === 0) {
        setWords(newWords);
        toast.success(
          t('vocab.bank.uploadSuccess', { count: newWords.length }),
        );
        if (result.skippedRows > 0) {
          toast.warning(
            t('vocab.bank.uploadSkipped', { skipped: result.skippedRows }),
          );
        }
      } else {
        // Nếu đã có từ → hỏi user muốn Thêm tiếp hay Thay thế toàn bộ
        const confirmAppend = window.confirm(
          `Danh sách hiện tại đã có ${words.length} từ.\n\n` +
            `File mới có ${newWords.length} từ.\n\n` +
            `• Bấm [OK] để THÊM TIẾP vào danh sách\n` +
            `• Bấm [Cancel] để THAY THẾ toàn bộ`,
        );

        if (confirmAppend) {
          // Lọc bỏ trùng lặp (theo word, case-insensitive)
          const existingLower = new Set(
            words.map((w) => w.word.trim().toLowerCase()),
          );
          const uniqueNew = newWords.filter(
            (w) => !existingLower.has(w.word.trim().toLowerCase()),
          );
          setWords((prev) => [...prev, ...uniqueNew]);
          toast.success(
            t('vocab.bank.uploadSuccess', { count: uniqueNew.length }),
          );
        } else {
          setWords(newWords);
          toast.success(
            t('vocab.bank.uploadSuccess', { count: newWords.length }),
          );
        }
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t('vocab.bank.uploadFailed'),
      );
    } finally {
      setIsParsingFile(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  /** Tạo và tải file CSV mẫu chuẩn về máy người dùng. */
  const downloadTemplate = () => {
    const csvContent =
      '﻿' +
      'Word,IPA,Meaning,Part of Speech,Example,Audio URL\n' +
      'Academic,/ˌækəˈdemɪk/,Học thuật,adjective,"She has a brilliant academic career.",https://dictionary.cambridge.org/media/english/us_pron/a/aca/acade/academic.mp3\n' +
      'Schedule,/ˈskedʒ.uːl/,Lịch trình,noun,"The meeting schedule has been updated.",https://dictionary.cambridge.org/media/english/us_pron/s/sch/sched/schedule.mp3\n' +
      'Collaborate,/kəˈlæb.ə.reɪt/,Hợp tác,verb,"Two teams collaborated on this project.",\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'tu_vung_mau.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
          {/* ============ CỘT TRÁI: THÔNG TIN BỘ + TẢI FILE ============ */}
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
                rows={3}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none transition-colors placeholder:text-slate-300 focus:border-[#0052CC] resize-y"
              />
            </div>

            {/* ---- Thẻ tải file Excel/CSV ---- */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {t('vocab.bank.uploadFile')}
                </label>
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0052CC] hover:text-[#0040A8] hover:underline"
                >
                  <Download className="w-3.5 h-3.5" />
                  {t('vocab.bank.downloadTemplate')}
                </button>
              </div>

              {/* Dropzone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'rounded-xl border-2 border-dashed p-4 text-center cursor-pointer transition-all',
                  isDragging
                    ? 'border-[#0052CC] bg-blue-50/70 scale-[0.99]'
                    : 'border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50/80',
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={VOCABULARY_FILE_ACCEPT}
                  onChange={handleFileChange}
                  className="hidden"
                />
                {isParsingFile ? (
                  <div className="py-4 flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 text-[#0052CC] animate-spin" />
                    <p className="text-xs font-bold text-slate-600">
                      Đang xử lý dữ liệu từ file...
                    </p>
                  </div>
                ) : (
                  <div className="py-2 space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">
                        {uploadedFileName
                          ? uploadedFileName
                          : t('vocab.bank.dragDropHint')}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Hỗ trợ file .xlsx, .xls, .csv
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      leftIcon={Upload}
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="font-bold text-xs"
                    >
                      {t('vocab.bank.uploadFile')}
                    </Button>
                  </div>
                )}
              </div>

              {/* Hướng dẫn cột */}
              <div className="rounded-xl bg-slate-100/70 p-2.5 text-[11px] text-slate-500 leading-relaxed">
                <p className="font-semibold text-slate-600 mb-0.5">Các cột trong file:</p>
                <p className="font-mono text-[10px] text-slate-600">
                  Word, IPA, Meaning, Part of Speech, Example, Audio URL
                </p>
              </div>
            </div>
          </div>

          {/* ============ CỘT PHẢI: BẢNG XEM TRƯỚC DANH SÁCH TỪ ============ */}
          <div className="min-w-0 flex flex-col">
            <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden flex-1 flex flex-col">
              <div className="flex items-center justify-between gap-2 px-4 py-3 bg-slate-50/70 border-b border-slate-200/80">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                    {t('vocab.bank.wordsInSet')}
                  </p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#0052CC]">
                    {words.length} từ
                  </span>
                </div>

                {words.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-[11px] font-bold text-rose-500 hover:text-rose-700 hover:underline px-2 py-1"
                  >
                    {t('vocab.bank.clearAll')}
                  </button>
                )}
              </div>

              <div className="p-4 flex-1 flex flex-col">
                {touched && errors.words && (
                  <div className="p-3 mb-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold">
                    {errors.words}
                  </div>
                )}

                {words.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center min-h-[300px]">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                      <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">
                      {t('vocab.bank.noWords')}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                      {t('vocab.bank.noWordsHint')}
                    </p>
                    <div className="flex items-center gap-2 mt-4">
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        leftIcon={Upload}
                        onClick={() => fileInputRef.current?.click()}
                        isLoading={isParsingFile}
                        className="bg-[#0052CC] hover:bg-[#0040A8] font-bold text-xs"
                      >
                        {t('vocab.bank.uploadFile')}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        leftIcon={Download}
                        onClick={downloadTemplate}
                        className="font-bold text-xs"
                      >
                        {t('vocab.bank.downloadTemplate')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200/80 overflow-hidden bg-white max-h-[460px] flex flex-col">
                    <div className="overflow-y-auto overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-slate-50 border-b border-slate-200/80 z-10">
                          <tr className="text-slate-500 font-extrabold text-[10px] uppercase tracking-wider text-left">
                            <th className="py-2.5 px-3 font-bold w-10 text-center">#</th>
                            <th className="py-2.5 px-3 font-bold">{t('vocab.table.word')}</th>
                            <th className="py-2.5 px-3 font-bold">{t('vocab.table.ipa')}</th>
                            <th className="py-2.5 px-3 font-bold">{t('vocab.table.meaning')}</th>
                            <th className="py-2.5 px-3 font-bold">Từ loại / Ví dụ</th>
                            <th className="py-2.5 px-3 font-bold text-right w-12">{t('vocab.table.actions')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {words.map((item, index) => (
                            <tr
                              key={`${item.word}-${index}`}
                              className="hover:bg-slate-50/70 transition-colors"
                            >
                              <td className="py-2.5 px-3 text-slate-400 font-mono text-center">
                                {index + 1}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="font-bold text-slate-900 block">
                                  {item.word}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                                {item.ipa || item.phonetic || '—'}
                              </td>
                              <td className="py-2.5 px-3 text-slate-700">
                                <span className="font-medium">{item.meaning || '—'}</span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-500 max-w-[220px]">
                                {item.partOfSpeech && (
                                  <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-semibold text-slate-600 mr-1.5">
                                    {item.partOfSpeech}
                                  </span>
                                )}
                                {item.example && (
                                  <span
                                    className="text-[11px] text-slate-400 italic line-clamp-1"
                                    title={item.example}
                                  >
                                    {item.example}
                                  </span>
                                )}
                                {!item.partOfSpeech && !item.example && '—'}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => removeWordFromList(index)}
                                  title={t('content.action.removeWord')}
                                  aria-label={t('content.action.removeWord')}
                                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
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
