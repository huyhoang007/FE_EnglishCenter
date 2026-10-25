/**
 * VocabularyManagementModal — Gán bộ từ vựng chung vào khóa học (Admin)
 * -----------------------------------------------------------
 * API thật (Backend):
 *   GET    /api/v1/vocabulary-sets                       → kho chung
 *   GET    /api/v1/courses/{courseId}/vocabularies      → bộ đang gán
 *   PUT    /api/v1/vocabulary-sets/courses/{courseId}    → lưu danh sách tick
 *   DELETE /api/v1/vocabulary-sets/courses/{courseId}/{setId} → gỡ 1 bộ
 *
 * ĐÂY là UI cho LUỒNG 2 (Assign Word to Course):
 *   Admin/Mentor duyệt kho chung, tick bộ phù hợp, bấm "Lưu" để gán.
 *   Bộ KHÔNG tick sẽ bị gỡ khỏi khóa học (vẫn còn trong kho chung).
 *
 * UI bám sát Admin Layout: bo góc hiện đại (rounded-2xl/3xl), màu nhấn
 * #0052CC, viền slate-200/80.
 *
 * Toàn bộ nhãn UI đi qua i18n key → hỗ trợ nút gạt Anh/Việt.
 */

import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { Modal } from '@/shared/components/Modal';
import { useTranslation } from '@/shared/i18n/I18nProvider';
import { VocabularyAssignPanel } from './VocabularyAssignPanel';
import { VocabularySetEditorModal } from './VocabularySetEditorModal';

/* =========================================================
 * Component
 * ========================================================= */
export interface VocabularyManagementModalProps {
  open: boolean;
  onClose: () => void;
  courseId: string;
  /** Tên khóa học — hiển thị ở phụ đề modal. */
  courseTitle?: string;
}

export const VocabularyManagementModal: React.FC<
  VocabularyManagementModalProps
> = ({ open, onClose, courseId, courseTitle }) => {
  const { t } = useTranslation();

  /** Modal tạo / sửa bộ trong kho chung (mở từ panel gán). */
  const [editorOpen, setEditorOpen] = useState(false);

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        maxWidth="2xl"
        icon={BookOpen}
        title={t('vocab.bank.assignToCourse')}
        subtitle={courseTitle ?? t('vocab.bank.subtitle')}
      >
        <VocabularyAssignPanel
          courseId={courseId}
          courseTitle={courseTitle}
          onCreateSet={() => setEditorOpen(true)}
        />
      </Modal>

      {/* Tạo bộ mới trong kho chung (luồng 1). */}
      <VocabularySetEditorModal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
      />
    </>
  );
};

export default VocabularyManagementModal;
