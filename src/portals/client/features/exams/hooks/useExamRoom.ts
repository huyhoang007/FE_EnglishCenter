/**
 * useExamRoom — toàn bộ logic phòng thi (Dev 3):
 *   - tải lượt thi (câu hỏi không kèm đáp án + câu đã lưu);
 *   - giữ đáp án tạm ở client, autosave 1.5 giây sau lần sửa cuối;
 *   - đồng hồ đếm ngược theo `remainingSeconds` của server (deadline tuyệt đối, không dừng khi ẩn tab);
 *   - hết giờ tự nộp; server báo đã nộp (5013) / hết giờ (5014) thì chuyển sang trang kết quả.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import { CLIENT_ROUTES } from '@/shared/constants/routes';
import { EXAM_ERROR_CODE, type AnswerItemRequest, type ExamQuestion } from '@/shared/types';
import { ExamApiError, getAttemptApi, saveAnswersApi, submitAttemptApi, unwrapExam } from '../services/examService';
import { isAnswered, orderedQuestions, type DraftAnswer } from '../utils/examRoom';

const AUTOSAVE_DELAY_MS = 1500;
const FINISHED_CODES: string[] = [EXAM_ERROR_CODE.ATTEMPT_ALREADY_SUBMITTED, EXAM_ERROR_CODE.ATTEMPT_TIME_EXPIRED];

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const isFinishedError = (err: unknown) => err instanceof ExamApiError && FINISHED_CODES.includes(err.code ?? '');

export function useExamRoom(attemptId: string) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const attemptQuery = useQuery({
    queryKey: QUERY_KEYS.exam.attempt(attemptId),
    queryFn: async () => unwrapExam(await getAttemptApi(attemptId)),
    enabled: Boolean(attemptId),
    retry: false,
    staleTime: Infinity,
  });
  const attempt = attemptQuery.data;

  const [answers, setAnswers] = useState<Record<string, DraftAnswer>>({});
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const dirtyRef = useRef<Set<string>>(new Set());
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const deadlineRef = useRef<number | null>(null);

  const goToResult = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['exam', 'my-attempts'] });
    navigate(CLIENT_ROUTES.examResult(attemptId), { replace: true });
  }, [attemptId, navigate, queryClient]);

  // Khởi tạo đáp án + đồng hồ khi tải xong lượt thi
  useEffect(() => {
    if (!attempt) return;
    if (attempt.status !== 'in_progress') {
      goToResult();
      return;
    }
    const initial: Record<string, DraftAnswer> = {};
    for (const a of attempt.answers) {
      initial[a.questionId] = { selectedOptionId: a.selectedOptionId ?? null, answerText: a.answerText ?? null };
    }
    setAnswers(initial);
    deadlineRef.current = Date.now() + attempt.remainingSeconds * 1000;
    setSecondsLeft(attempt.remainingSeconds);
  }, [attempt, goToResult]);

  const questions: ExamQuestion[] = useMemo(() => (attempt?.exam ? orderedQuestions(attempt.exam) : []), [attempt]);

  const buildItems = (ids: Iterable<string>): AnswerItemRequest[] =>
    Array.from(ids).map((questionId) => ({
      questionId,
      selectedOptionId: answersRef.current[questionId]?.selectedOptionId ?? null,
      answerText: answersRef.current[questionId]?.answerText ?? null,
    }));

  const saveMutation = useMutation({
    mutationFn: async (items: AnswerItemRequest[]) => unwrapExam(await saveAnswersApi(attemptId, items)),
    onMutate: () => setSaveState('saving'),
    onSuccess: () => setSaveState('saved'),
    onError: (err, items) => {
      if (isFinishedError(err)) {
        goToResult();
        return;
      }
      // Giữ lại để gửi kèm ở lần lưu / nộp sau
      items.forEach((i) => dirtyRef.current.add(i.questionId));
      setSaveState('error');
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const pending = buildItems(dirtyRef.current);
      dirtyRef.current.clear();
      return unwrapExam(await submitAttemptApi(attemptId, pending));
    },
    onSuccess: (result) => {
      queryClient.setQueryData(QUERY_KEYS.exam.result(attemptId), result);
      goToResult();
    },
    onError: (err) => {
      if (isFinishedError(err)) goToResult();
    },
  });

  // Autosave: gom các câu đã sửa, gửi khi người dùng ngừng thao tác
  useEffect(() => {
    if (dirtyRef.current.size === 0 || submitMutation.isPending) return;
    const timer = window.setTimeout(() => {
      const items = buildItems(dirtyRef.current);
      dirtyRef.current.clear();
      if (items.length > 0) saveMutation.mutate(items);
    }, AUTOSAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
    // buildItems / saveMutation đọc ref nên chỉ cần chạy lại khi đáp án đổi
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers]);

  // Đồng hồ theo deadline tuyệt đối: không lệch khi tab bị treo, không dừng khi ẩn tab
  const isTimerReady = secondsLeft !== null;
  useEffect(() => {
    if (!isTimerReady) return;
    const timer = window.setInterval(() => {
      if (deadlineRef.current === null) return;
      setSecondsLeft(Math.max(0, Math.round((deadlineRef.current - Date.now()) / 1000)));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isTimerReady]);

  // Hết giờ: tự nộp một lần
  useEffect(() => {
    if (secondsLeft === 0 && !submitMutation.isPending && !submitMutation.isSuccess) {
      submitMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  const setAnswer = (questionId: string, value: DraftAnswer) => {
    dirtyRef.current.add(questionId);
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  return {
    attemptQuery,
    attempt,
    questions,
    answers,
    setAnswer,
    answeredCount: questions.filter((q) => isAnswered(q, answers[q.questionId])).length,
    secondsLeft: secondsLeft ?? 0,
    saveState,
    submit: () => submitMutation.mutate(),
    isSubmitting: submitMutation.isPending,
    submitError: submitMutation.error,
  };
}
