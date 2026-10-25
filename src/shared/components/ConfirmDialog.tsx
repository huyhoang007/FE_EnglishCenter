/**
 * ConfirmDialog — hộp xác nhận hành động phá huỷ (xoá, vô hiệu hoá…)
 * -----------------------------------------------------------
 * Mở rộng từ `Modal` với nút hủy / xác nhận và trạng thái loading.
 *
 * Dùng:
 *   <ConfirmDialog
 *     open={!!target}
 *     title="Xoá từ vựng này?"
 *     description="…"
 *     confirmLabel="Xoá"
 *     onConfirm={handleDelete}
 *     onClose={() => setTarget(null)}
 *   />
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Đang xử lý → nút xác nhận hiện spinner + disable. */
  isLoading?: boolean;
  /** Màu nút xác nhận (mặc định `danger` cho hành động xoá). */
  confirmVariant?: 'danger' | 'primary';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Huỷ',
  isLoading = false,
  confirmVariant = 'danger',
}) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidth="sm"
      dismissible={!isLoading}
      icon={AlertTriangle}
      iconClassName="bg-rose-50 text-rose-500"
    >
      <h3 className="text-base font-bold text-slate-900">{title}</h3>
      {description && (
        <p className="text-sm text-slate-600 leading-relaxed mt-2">
          {description}
        </p>
      )}

      <div className="flex items-center justify-end gap-2.5 mt-6">
        <Button
          variant="secondary"
          size="sm"
          onClick={onClose}
          disabled={isLoading}
        >
          {cancelLabel}
        </Button>
        <Button
          variant={confirmVariant}
          size="sm"
          onClick={onConfirm}
          isLoading={isLoading}
          className={
            confirmVariant === 'primary'
              ? 'bg-[#0052CC] hover:bg-[#0040A8] font-bold'
              : 'font-bold'
          }
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
