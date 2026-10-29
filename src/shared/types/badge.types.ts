/**
 * Badge variant — tách riêng khỏi component để các module thuần logic
 * (constants, helpers) import được mà không kéo theo React/JSX.
 */

export type BadgeVariant =
  | 'primary'
  | 'ai'
  | 'ielts'
  | 'toeic'
  | 'vstep'
  | 'success'
  | 'warning'
  | 'danger'
  | 'neutral';
