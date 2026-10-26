/**
 * i18n — English dictionary (nguồn chuẩn cho kiểu dữ liệu)
 * -----------------------------------------------------------
 * Đây là file ĐỊNH NGHĨA key. `vi.ts` phải implement đúng `TranslationKey`
 * nên TypeScript sẽ báo lỗi nếu thiếu key hoặc thừa key.
 *
 * Quy ước key: `<miền>.<câu>` — dùng chấm để nhóm theo màn hình.
 *
 * Chuỗi có thể chứa placeholder `{tên}` — hàm `t()` sẽ thay thế.
 */

/* eslint-disable prettier/prettier */
export const en = {
  // =========================================================
  // Common
  // =========================================================
  'common.cancel': 'Cancel',
  'common.close': 'Close',
  'common.save': 'Save',
  'common.saving': 'Saving…',
  'common.saved': 'Saved',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.add': 'Add',
  'common.search': 'Search',
  'common.retry': 'Retry',
  'common.confirm': 'Confirm',
  'common.loading': 'Loading…',
  'common.processing': 'Processing…',
  'common.none': 'None',
  'common.yes': 'Yes',
  'common.no': 'No',
  'common.optional': 'Optional',
  'common.required': 'Required',

  // =========================================================
  // Language switcher
  // =========================================================
  'lang.label': 'Language',
  'lang.en': 'English',
  'lang.vi': 'Tiếng Việt',
  'lang.switchToEn': 'Switch to English',
  'lang.switchToVi': 'Switch to Vietnamese',

  // =========================================================
  // Admin — course list / detail
  // =========================================================
  'admin.course.backToList': 'Back to courses',
  'admin.course.detailTitle': 'Course details',
  'admin.course.notFound': 'Course not found',
  'admin.course.notFoundHint':
    'The course may have been deleted, or the link is invalid.',
  'admin.course.tabOverview': 'Overview',
  'admin.course.tabVocabulary': 'Vocabulary',
  'admin.course.tabLessons': 'Lessons',
  'admin.course.tabHomework': 'Homework',
  'admin.course.manageVocabulary': 'Manage vocabulary',
  'admin.course.vocabularyCount': '{count} words',
  'admin.course.lessonCount': '{count} lessons',
  'admin.course.homeworkCount': '{count} assignments',
  'admin.course.code': 'Course code',
  'admin.course.level': 'Level',
  'admin.course.price': 'Price',
  'admin.course.targetScore': 'Target score',
  'admin.course.certificate': 'Certificate',
  'admin.course.mentor': 'Mentor',
  'admin.course.status': 'Status',
  'admin.course.description': 'Description',
  'admin.course.noDescription': 'No description',
  'admin.course.backToDetail': 'Back to course details',
  'admin.course.manageVocabularyLink': 'Manage vocabulary',

  // =========================================================
  // Admin — vocabulary management page
  // =========================================================
  'vocab.page.title': 'Vocabulary management',
  'vocab.page.subtitle': 'Manage flashcard vocabulary across your courses.',
  'vocab.library.selectCourse': 'Select a course',
  'vocab.library.noCourses': 'No courses yet',
  'vocab.library.noCoursesHint':
    'Create a course first, then add vocabulary to it.',
  // Kho từ vựng chung (global vocabulary bank)
  'vocab.bank.title': 'Global vocabulary bank',
  'vocab.bank.subtitle':
    'Create vocabulary independently of any course, then assign sets to courses.',
  'vocab.bank.searchPlaceholder': 'Search sets or words…',
  'vocab.bank.emptyTitle': 'The vocabulary bank is empty',
  'vocab.bank.emptyDescription':
    'Create your first vocabulary set — it can then be assigned to any course.',
  'vocab.bank.noResultTitle': 'No matching vocabulary set',
  'vocab.bank.sets': '{count} sets',
  'vocab.bank.words': '{count} words',
  'vocab.bank.usedInCourses': 'Used in {count} courses',
  'vocab.bank.unused': 'Not assigned yet',
  'vocab.bank.createTitle': 'Create vocabulary set',
  'vocab.bank.updateTitle': 'Edit vocabulary set',
  'vocab.bank.titleLabel': 'Set name',
  'vocab.bank.titlePlaceholder': 'e.g. Academic Writing Essentials',
  'vocab.bank.descriptionLabel': 'Description',
  'vocab.bank.descriptionPlaceholder':
    'What is this set about? (optional)',
  'vocab.bank.wordsInSet': 'Words in this set',
  'vocab.bank.addWord': 'Add a word',
  'vocab.bank.noWords': 'No words yet',
  'vocab.bank.noWordsHint':
    'Upload an Excel or CSV file to add vocabulary to this set.',
  'vocab.bank.clearAll': 'Clear all',
  'vocab.bank.dragDropHint':
    'Drag & drop Excel/CSV file here or click to browse',
  'vocab.bank.uploadFile': 'Upload file',
  'vocab.bank.uploadHint':
    'Supports .xlsx, .xls, .csv. Columns: Word, IPA, Meaning, Part of Speech, Example, Audio URL.',
  'vocab.bank.uploadSuccess': 'Imported {count} words from file',
  'vocab.bank.uploadSkipped': '({skipped} rows skipped due to missing data)',
  'vocab.bank.uploadFailed': 'Failed to import file',
  'vocab.bank.uploadReplace': 'Replace all',
  'vocab.bank.uploadAppend': 'Append to list',
  'vocab.bank.uploadConfirmTitle': 'How to import vocabulary?',
  'vocab.bank.uploadConfirmBody':
    'This set already has {current} words. Do you want to append {incoming} new words or replace the entire list?',
  'vocab.bank.downloadTemplate': 'Download template',
  'vocab.bank.wordsRequired': 'Add at least one word to the set',
  'vocab.bank.titleRequired': 'Set name is required',
  'vocab.bank.titleExisted': 'A set with this name already exists',
  'vocab.bank.createNew': 'New set',
  'vocab.bank.assignToCourse': 'Assign to course',
  'vocab.bank.assignHint':
    'Tick the sets that belong to this course, then save.',
  'vocab.bank.assignEmpty': 'No set selected yet',
  'vocab.bank.assignSaved': 'Vocabulary assigned to the course',
  'vocab.bank.assignFailed': 'Failed to assign vocabulary',
  'vocab.bank.confirmDeleteTitle': 'Delete this vocabulary set?',
  'vocab.bank.confirmDeleteBody':
    '“{title}” will be permanently removed from the vocabulary bank and unassigned from every course using it.',
  'vocab.bank.unassignTitle': 'Remove from this course?',
  'vocab.bank.unassignBody':
    '“{title}” will be removed from this course. The set stays in the vocabulary bank.',
  'vocab.bank.unassigned': 'Removed from the course',
  'vocab.bank.shared': 'Shared',
  'vocab.bank.createdBy': 'Created by {name}',
  'vocab.stat.total': 'Total words',
  'vocab.stat.totalHint': 'Across the whole bank',
  'vocab.stat.setsHint': 'Reusable across all courses',
  'vocab.stat.withAudio': 'With audio',
  'vocab.stat.withAudioHint': 'Pronunciation files',
  'vocab.stat.withIpa': 'With IPA',
  'vocab.stat.withIpaHint': 'Phonetic transcription',
  'vocab.modal.createTitle': 'Add new vocabulary',
  'vocab.modal.updateTitle': 'Edit vocabulary',
  'vocab.modal.noResultTitle': 'No matching word',
  'vocab.modal.hint':
    'Vocabulary is stored in the global vocabulary bank. Changes apply immediately to the learner view.',

  // =========================================================
  // Admin — vocabulary management modal
  // =========================================================
  'vocab.modal.title': 'Vocabulary management',
  'vocab.modal.subtitle': 'Manage flashcard vocabulary for this course',
  'vocab.modal.addTitle': 'Add vocabulary',
  'vocab.modal.editTitle': 'Edit vocabulary',
  'vocab.modal.listTitle': 'Vocabulary list',
  'vocab.modal.emptyTitle': 'No vocabulary yet',
  'vocab.modal.emptyDescription':
    'Add your first word using the form on the left.',
  'vocab.modal.total': 'Total ({count})',
  'vocab.modal.searchPlaceholder': 'Search for a word…',

  // Form fields
  'vocab.form.word': 'English word',
  'vocab.form.wordPlaceholder': 'e.g. Academic',
  'vocab.form.ipa': 'Pronunciation (IPA)',
  'vocab.form.ipaPlaceholder': 'e.g. /ˌækəˈdemɪk/',
  'vocab.form.meaning': 'Vietnamese meaning',
  'vocab.form.meaningPlaceholder': 'e.g. Học thuật',
  'vocab.form.audioUrl': 'Audio link',
  'vocab.form.audioUrlPlaceholder': 'https://… (mp3)',
  'vocab.form.partOfSpeech': 'Part of speech',
  'vocab.form.partOfSpeechPlaceholder': 'noun / verb / adjective',
  'vocab.form.example': 'Example sentence',
  'vocab.form.examplePlaceholder': 'The meeting schedule has been updated.',

  // Validation
  'vocab.validation.wordRequired': 'English word is required',
  'vocab.validation.wordTooLong': 'Maximum 255 characters',
  'vocab.validation.meaningRequired': 'Vietnamese meaning is required',
  'vocab.validation.meaningTooLong': 'Maximum 500 characters',
  'vocab.validation.audioUrlInvalid': 'Audio link must be a valid URL',
  'vocab.validation.audioUrlTooLong': 'Maximum 500 characters',
  'vocab.validation.ipaTooLong': 'Maximum 100 characters',
  'vocab.validation.duplicateWord': 'This word already exists in the course',

  // Actions / feedback
  'vocab.action.add': 'Add word',
  'vocab.action.update': 'Save changes',
  'vocab.action.edit': 'Edit word',
  'vocab.action.delete': 'Delete word',
  'vocab.action.playAudio': 'Play pronunciation',
  'vocab.action.editRow': 'Edit this word',
  'vocab.action.deleteRow': 'Delete this word',
  'vocab.action.cancelEdit': 'Cancel editing',
  'vocab.action.addNew': 'Add new word',
  'vocab.action.previewAudio': 'Preview pronunciation',
  'vocab.feedback.added': 'Word added successfully',
  'vocab.feedback.updated': 'Word updated successfully',
  'vocab.feedback.deleted': 'Word deleted successfully',
  'vocab.feedback.addFailed': 'Failed to add the word',
  'vocab.feedback.updateFailed': 'Failed to update the word',
  'vocab.feedback.deleteFailed': 'Failed to delete the word',
  'vocab.feedback.audioError': 'Unable to play the audio',
  'vocab.feedback.audioMissing': 'Enter an audio link first',
  'vocab.confirmDeleteTitle': 'Delete this word?',
  'vocab.confirmDeleteBody':
    '“{word}” will be permanently removed from this course. This action cannot be undone.',
  'vocab.confirmDeleteConfirm': 'Delete',
  'vocab.confirmDeleteCancel': 'Keep it',

  // Table columns
  'vocab.table.word': 'Word',
  'vocab.table.ipa': 'Pronunciation',
  'vocab.table.meaning': 'Meaning',
  'vocab.table.audio': 'Audio',
  'vocab.table.actions': 'Actions',
  'vocab.table.noAudio': 'No audio',

  // =========================================================
  // Admin — course content modal (dynamic form theo contentType)
  // =========================================================
  'content.modal.createTitle': 'Add course content',
  'content.modal.updateTitle': 'Edit course content',
  'content.modal.subtitle': 'Manage lessons, vocabulary and homework',

  // Content type
  'content.type.lesson': 'Lesson',
  'content.type.vocabulary': 'Vocabulary set',
  'content.type.homework': 'Homework',

  // Common fields
  'content.form.contentType': 'Content type',
  'content.form.typeLockedHint':
    'The content type cannot be changed after creation.',
  'content.form.title': 'Title',
  'content.form.titlePlaceholder': 'e.g. Introduction to IELTS Writing',
  'content.form.description': 'Description',
  'content.form.descriptionPlaceholder': 'Short summary shown to learners…',
  'content.form.contentOrder': 'Order',
  'content.form.durationMinutes': 'Duration (minutes)',
  'content.form.durationPlaceholder': 'e.g. 30',
  'content.form.videoUrl': 'Video URL',
  'content.form.videoUrlPlaceholder': 'https://… (mp4)',
  'content.form.videoUrlHint': 'Supports a direct MP4 link or a YouTube URL.',
  'content.form.isPreview': 'Free preview lesson',
  'content.form.isPreviewHint':
    'Everyone can watch this lesson without enrolling.',
  'content.form.instructions': 'Instructions',
  'content.form.instructionsPlaceholder': 'What should students do?',
  'content.form.dueDate': 'Due date',
  'content.form.maxScore': 'Max score',
  'content.form.maxScorePlaceholder': 'e.g. 100',
  'content.form.maxAttempts': 'Max attempts',
  'content.form.maxAttemptsHint':
    'Leave empty to allow unlimited attempts.',
  'content.form.maxAttemptsPlaceholder': 'e.g. 3',
  'content.form.attachmentUrl': 'Attachment URL',
  'content.form.attachmentUrlPlaceholder': 'https://… (pdf)',
  'content.form.rubric': 'Grading criteria',
  'content.form.rubricEmpty': 'No criteria yet — add one to describe how to grade.',
  'content.form.criterionPlaceholder': 'Criterion name',
  'content.form.criterionDescPlaceholder': 'Description (optional)',

  // Homework — hình thức nộp (khớp cột homework_submissions của backend)
  'content.homework.submissionType': 'Submission type',
  'content.homework.submissionTypeHint':
    'Determines what learners submit. Multiple choice is graded automatically.',
  'content.homework.type.text': 'Written answer',
  'content.homework.type.file': 'File upload',
  'content.homework.type.multiple_choice': 'Multiple choice',
  'content.homework.passingScore': 'Passing score',
  'content.homework.passingScoreHint':
    'Minimum percentage (0-100) required to pass.',
  'content.homework.passingScorePlaceholder': 'e.g. 60',
  'content.homework.timeLimit': 'Time limit (minutes)',
  'content.homework.timeLimitHint':
    'Leave empty if there is no time limit.',
  'content.homework.timeLimitPlaceholder': 'e.g. 45',
  'content.homework.examId': 'Linked exam',
  'content.homework.examIdHint':
    'Pick a published exam of this course. Learners take it in the exam room.',
  'content.homework.examPlaceholder': 'Select an exam…',
  'content.homework.noExam': 'No published exam available for this course.',
  'content.homework.examEmpty':
    'Choose a multiple choice exam to link to this homework.',

  // Vocabulary — chọn bộ từ vựng từ thư viện
  'content.vocab.libraryTitle': 'Pick a vocabulary set',
  'content.vocab.libraryHint':
    'Select one or more sets from the library. Their words are copied into this content.',
  'content.vocab.libraryEmpty':
    'The vocabulary library is empty. Add words first, then link them here.',
  'content.vocab.librarySearch': 'Search sets…',
  'content.vocab.libraryLoadFailed': 'Could not load the vocabulary library.',
  'content.vocab.librarySelected': 'Selected sets',
  'content.vocab.librarySelectedEmpty': 'No set linked yet.',
  'content.vocab.libraryLink': 'Link set',
  'content.vocab.libraryUnlink': 'Unlink',
  'content.vocab.libraryWords': '{count} words',
  'content.vocab.libraryKindSet': 'Set',
  'content.vocab.libraryKindWord': 'Single word',
  'content.vocab.libraryLinkHint':
    'Linked sets are recorded so you can trace where the words came from.',
  'content.vocab.libraryDuplicated': '{count} words are already in the list',
  'content.vocab.libraryAllCourses': 'All courses',

  // Vocabulary builder
  'content.vocab.builderTitle': 'Add a word to the list',
  'content.vocab.editingTitle': 'Edit the selected word',
  'content.vocab.listTitle': 'Words in this set',
  'content.vocab.emptyTitle': 'No words added yet',
  'content.vocab.emptyDescription':
    'Fill in the word on the left, then add it to the list.',

  // Vocabulary — chọn bộ từ vựng CHUNG để gán vào khóa học (contentType = vocabulary)
  'content.vocab.bankTitle': 'Pick vocabulary sets from the bank',
  'content.vocab.bankHint':
    'Search the global vocabulary bank and tick the sets to link into this course.',
  'content.vocab.bankSearch': 'Search sets or words…',
  'content.vocab.bankEmpty': 'The vocabulary bank is empty.',
  'content.vocab.bankNoResult': 'No matching vocabulary set.',
  'content.vocab.bankSelected': 'Selected sets',
  'content.vocab.bankSelectedEmpty': 'No set selected yet.',
  'content.vocab.bankAssigned': 'Already in this course',
  'content.vocab.bankRequired': 'Select at least one vocabulary set',
  'content.vocab.bankLoadFailed': 'Could not load the vocabulary bank.',
  'content.vocab.bankCount': '{count} sets',

  // Homework — chọn đề thi/bài kiểm tra định nghĩa sẵn
  'content.homework.examTitle': 'Pick an exam or practice test',
  'content.homework.examSearch': 'Search exams…',
  'content.homework.examListEmpty':
    'This course has no exam or practice test yet. Create one in Exam Management first.',
  'content.homework.examNoResult': 'No matching exam.',
  'content.homework.examSelectHint':
    'Tick the exam you want to attach. The learner takes it in the exam room.',
  'content.homework.examQuestions': '{count} questions',
  'content.homework.examDuration': '{count} min',
  'content.homework.examType': 'Type',
  'content.homework.examStatus': 'Status',
  'content.homework.examStatusPublished': 'Published',
  'content.homework.examStatusDraft': 'Draft',
  'content.homework.examStatusArchived': 'Archived',

  // Cột phải — "HIỆN CÓ"
  'content.existing.title': 'Currently added',
  'content.existing.lessonHint':
    'Review the lesson settings before saving.',
  'content.existing.vocabHint':
    'Words in this set — edit or remove before saving.',
  'content.existing.homeworkHint':
    'Review the homework settings before saving.',

  // Previews
  'content.lesson.previewTitle': 'Lesson summary',
  'content.lesson.previewHint':
    'Preview the lesson settings before saving.',
  'content.lesson.minutes': 'min',
  'content.lesson.noVideo': 'No video attached',
  'content.homework.previewTitle': 'Homework summary',
  'content.homework.unlimitedAttempts': 'Unlimited',

  // Course content list (on the course detail page)
  'content.list.emptyTitle': 'No content yet',
  'content.list.emptyDescription':
    'Add a lesson, a vocabulary set or a homework to this course.',
  'content.list.titleCol': 'Title',
  'content.list.typeCol': 'Type',
  'content.list.actionsCol': 'Actions',

  // Actions
  'content.action.add': 'Add content',
  'content.action.update': 'Save changes',
  'content.action.addWordToList': '+ Add this word to the list',
  'content.action.updateWord': 'Save this word',
  'content.action.cancelEditWord': 'Cancel',
  'content.action.editWord': 'Edit this word',
  'content.action.removeWord': 'Remove this word',
  'content.action.addCriterion': 'Add criterion',
  'content.action.removeCriterion': 'Remove criterion',

  // Validation
  'content.validation.titleRequired': 'Title is required',
  'content.validation.titleTooLong': 'Maximum 255 characters',
  'content.validation.orderInvalid': 'Order must be a non-negative number',
  'content.validation.videoUrlInvalid': 'Video URL must be a valid URL',
  'content.validation.durationInvalid': 'Duration must be a positive number',
  'content.validation.maxScoreInvalid': 'Max score must be a positive number',
  'content.validation.maxAttemptsInvalid':
    'Max attempts must be a non-negative number',
  'content.validation.vocabularyEmpty': 'Add at least one word to the set',
  'content.validation.wordRequired': 'The English word is required',
  'content.validation.meaningRequired': 'The Vietnamese meaning is required',
  'content.validation.duplicateWord': 'This word is already in the list',
  'content.validation.passingScoreInvalid':
    'Passing score must be between 0 and 100',
  'content.validation.timeLimitInvalid':
    'Time limit must be a positive number of minutes',
  'content.validation.examRequired': 'Select an exam to link',

  // Feedback
  'content.feedback.added': 'Course content added successfully',
  'content.feedback.updated': 'Course content updated successfully',
  'content.feedback.addFailed': 'Failed to add the content',
  'content.feedback.updateFailed': 'Failed to update the content',
  'content.feedback.wordAdded': 'Word added to the list',
  'content.feedback.wordUpdated': 'Word updated in the list',
} as const;

/** Danh sách key hợp lệ — dùng để type-safe cho `t()` và cho file `vi.ts`. */
export type TranslationKey = keyof typeof en;

export default en;
