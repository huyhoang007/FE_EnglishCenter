/**
 * i18n — Vietnamese dictionary
 * -----------------------------------------------------------
 * Phải implement đúng `TranslationKey` của `en.ts` — thiếu/thừa key sẽ
 * bị TypeScript báo lỗi ngay khi build.
 */

import type { TranslationKey } from './en';

export const vi: Record<TranslationKey, string> = {
  // =========================================================
  // Common
  // =========================================================
  'common.cancel': 'Huỷ',
  'common.close': 'Đóng',
  'common.save': 'Lưu',
  'common.saving': 'Đang lưu…',
  'common.saved': 'Đã lưu',
  'common.delete': 'Xoá',
  'common.edit': 'Chỉnh sửa',
  'common.add': 'Thêm',
  'common.search': 'Tìm kiếm',
  'common.retry': 'Thử lại',
  'common.confirm': 'Xác nhận',
  'common.loading': 'Đang tải…',
  'common.processing': 'Đang xử lý…',
  'common.none': 'Không có',
  'common.yes': 'Có',
  'common.no': 'Không',
  'common.optional': 'Không bắt buộc',
  'common.required': 'Bắt buộc',

  // =========================================================
  // Language switcher
  // =========================================================
  'lang.label': 'Ngôn ngữ',
  'lang.en': 'English',
  'lang.vi': 'Tiếng Việt',
  'lang.switchToEn': 'Chuyển sang tiếng Anh',
  'lang.switchToVi': 'Chuyển sang tiếng Việt',

  // =========================================================
  // Admin — course list / detail
  // =========================================================
  'admin.course.backToList': 'Quay lại danh sách khóa học',
  'admin.course.detailTitle': 'Chi tiết khóa học',
  'admin.course.notFound': 'Không tìm thấy khóa học',
  'admin.course.notFoundHint':
    'Khóa học có thể đã bị xoá, hoặc đường dẫn không hợp lệ.',
  'admin.course.tabOverview': 'Tổng quan',
  'admin.course.tabVocabulary': 'Từ vựng',
  'admin.course.tabLessons': 'Bài học',
  'admin.course.tabHomework': 'Bài tập',
  'admin.course.manageVocabulary': 'Quản lý từ vựng',
  'admin.course.vocabularyCount': '{count} từ',
  'admin.course.lessonCount': '{count} bài học',
  'admin.course.homeworkCount': '{count} bài tập',
  'admin.course.code': 'Mã khóa học',
  'admin.course.level': 'Trình độ',
  'admin.course.price': 'Học phí',
  'admin.course.targetScore': 'Điểm mục tiêu',
  'admin.course.certificate': 'Chứng chỉ',
  'admin.course.mentor': 'Mentor',
  'admin.course.status': 'Trạng thái',
  'admin.course.description': 'Mô tả',
  'admin.course.noDescription': 'Chưa có mô tả',
  'admin.course.backToDetail': 'Quay lại chi tiết khóa học',
  'admin.course.manageVocabularyLink': 'Quản lý từ vựng',

  // =========================================================
  // Admin — trang quản lý từ vựng
  // =========================================================
  'vocab.page.title': 'Quản lý từ vựng',
  'vocab.page.subtitle': 'Quản lý bộ flashcard từ vựng cho các khóa học.',
  'vocab.library.selectCourse': 'Chọn khóa học',
  'vocab.library.noCourses': 'Chưa có khóa học nào',
  'vocab.library.noCoursesHint':
    'Hãy tạo khóa học trước, sau đó thêm từ vựng vào.',
  // Kho từ vựng chung (global vocabulary bank)
  'vocab.bank.title': 'Kho từ vựng chung',
  'vocab.bank.subtitle':
    'Tạo từ vựng độc lập với mọi khóa học, sau đó gán bộ từ vựng vào khóa học phù hợp.',
  'vocab.bank.searchPlaceholder': 'Tìm theo bộ hoặc từ…',
  'vocab.bank.emptyTitle': 'Kho từ vựng chung còn trống',
  'vocab.bank.emptyDescription':
    'Tạo bộ từ vựng đầu tiên — sau đó có thể gán vào bất kỳ khóa học nào.',
  'vocab.bank.noResultTitle': 'Không tìm thấy bộ từ vựng phù hợp',
  'vocab.bank.sets': '{count} bộ',
  'vocab.bank.words': '{count} từ',
  'vocab.bank.usedInCourses': 'Đang dùng ở {count} khóa học',
  'vocab.bank.unused': 'Chưa gán khóa học nào',
  'vocab.bank.createTitle': 'Tạo bộ từ vựng',
  'vocab.bank.updateTitle': 'Chỉnh sửa bộ từ vựng',
  'vocab.bank.titleLabel': 'Tên bộ từ vựng',
  'vocab.bank.titlePlaceholder': 'VD: Từ vựng Học thuật',
  'vocab.bank.descriptionLabel': 'Mô tả',
  'vocab.bank.descriptionPlaceholder':
    'Bộ từ vựng này dùng để làm gì? (không bắt buộc)',
  'vocab.bank.wordsInSet': 'Từ vựng trong bộ',
  'vocab.bank.addWord': 'Thêm một từ',
  'vocab.bank.noWords': 'Chưa có từ vựng nào',
  'vocab.bank.noWordsHint':
    'Tải lên file Excel hoặc CSV để thêm từ vựng vào bộ này.',
  'vocab.bank.clearAll': 'Xoá tất cả',
  'vocab.bank.dragDropHint':
    'Kéo thả file Excel/CSV vào đây hoặc bấm để chọn file',
  'vocab.bank.uploadFile': 'Upload file',
  'vocab.bank.uploadHint':
    'Hỗ trợ .xlsx, .xls, .csv. Cột: Word, IPA, Meaning, Part of Speech, Example, Audio URL.',
  'vocab.bank.uploadSuccess': 'Đã import {count} từ từ file',
  'vocab.bank.uploadSkipped': '({skipped} dòng bị bỏ qua vì thiếu dữ liệu)',
  'vocab.bank.uploadFailed': 'Import file thất bại',
  'vocab.bank.uploadReplace': 'Thay thế toàn bộ',
  'vocab.bank.uploadAppend': 'Thêm vào danh sách',
  'vocab.bank.uploadConfirmTitle': 'Cách import từ vựng?',
  'vocab.bank.uploadConfirmBody':
    'Bộ hiện tại đã có {current} từ. Bạn muốn thêm {incoming} từ mới vào cuối, hay thay thế toàn bộ?',
  'vocab.bank.downloadTemplate': 'Tải file mẫu',
  'vocab.bank.wordsRequired': 'Cần thêm ít nhất một từ vào bộ',
  'vocab.bank.titleRequired': 'Tên bộ từ vựng là bắt buộc',
  'vocab.bank.titleExisted': 'Bộ từ vựng với tên này đã tồn tại',
  'vocab.bank.createNew': 'Bộ mới',
  'vocab.bank.assignToCourse': 'Gán vào khóa học',
  'vocab.bank.assignHint':
    'Tick chọn các bộ thuộc khóa học này, rồi lưu lại.',
  'vocab.bank.assignEmpty': 'Chưa chọn bộ nào',
  'vocab.bank.assignSaved': 'Đã gán từ vựng vào khóa học',
  'vocab.bank.assignFailed': 'Gán từ vựng thất bại',
  'vocab.bank.confirmDeleteTitle': 'Xoá bộ từ vựng này?',
  'vocab.bank.confirmDeleteBody':
    '“{title}” sẽ bị xoá vĩnh viễn khỏi kho từ vựng chung và bị gỡ khỏi mọi khóa học đang dùng.',
  'vocab.bank.unassignTitle': 'Gỡ khỏi khóa học này?',
  'vocab.bank.unassignBody':
    '“{title}” sẽ bị gỡ khỏi khóa học này. Bộ từ vựng vẫn còn trong kho từ vựng chung.',
  'vocab.bank.unassigned': 'Đã gỡ khỏi khóa học',
  'vocab.bank.shared': 'Dùng chung',
  'vocab.bank.createdBy': 'Tạo bởi {name}',
  'vocab.stat.total': 'Tổng từ vựng',
  'vocab.stat.totalHint': 'Trong toàn kho chung',
  'vocab.stat.setsHint': 'Dùng lại được cho mọi khóa học',
  'vocab.stat.withAudio': 'Có audio',
  'vocab.stat.withAudioHint': 'File phát âm',
  'vocab.stat.withIpa': 'Có phiên âm',
  'vocab.stat.withIpaHint': 'Ký hiệu IPA',
  'vocab.modal.createTitle': 'Thêm từ vựng mới',
  'vocab.modal.updateTitle': 'Chỉnh sửa từ vựng',
  'vocab.modal.noResultTitle': 'Không tìm thấy từ phù hợp',
  'vocab.modal.hint':
    'Từ vựng được lưu trong kho từ vựng chung. Thay đổi sẽ áp dụng ngay cho học viên.',

  // =========================================================
  // Admin — vocabulary management modal
  // =========================================================
  'vocab.modal.title': 'Quản lý từ vựng',
  'vocab.modal.subtitle': 'Quản lý bộ flashcard từ vựng của khóa học này',
  'vocab.modal.addTitle': 'Thêm từ vựng',
  'vocab.modal.editTitle': 'Chỉnh sửa từ vựng',
  'vocab.modal.listTitle': 'Danh sách từ vựng',
  'vocab.modal.emptyTitle': 'Chưa có từ vựng nào',
  'vocab.modal.emptyDescription':
    'Thêm từ đầu tiên bằng biểu mẫu bên trái.',
  'vocab.modal.total': 'Tổng ({count})',
  'vocab.modal.searchPlaceholder': 'Tìm theo từ…',

  // Form fields
  'vocab.form.word': 'Từ tiếng Anh',
  'vocab.form.wordPlaceholder': 'VD: Academic',
  'vocab.form.ipa': 'Phiên âm (IPA)',
  'vocab.form.ipaPlaceholder': 'VD: /ˌækəˈdemɪk/',
  'vocab.form.meaning': 'Nghĩa tiếng Việt',
  'vocab.form.meaningPlaceholder': 'VD: Học thuật',
  'vocab.form.audioUrl': 'Link audio',
  'vocab.form.audioUrlPlaceholder': 'https://… (mp3)',
  'vocab.form.partOfSpeech': 'Từ loại',
  'vocab.form.partOfSpeechPlaceholder': 'noun / verb / adjective',
  'vocab.form.example': 'Câu ví dụ',
  'vocab.form.examplePlaceholder': 'The meeting schedule has been updated.',

  // Validation
  'vocab.validation.wordRequired': 'Từ tiếng Anh là bắt buộc',
  'vocab.validation.wordTooLong': 'Tối đa 255 ký tự',
  'vocab.validation.meaningRequired': 'Nghĩa tiếng Việt là bắt buộc',
  'vocab.validation.meaningTooLong': 'Tối đa 500 ký tự',
  'vocab.validation.audioUrlInvalid': 'Link audio phải là URL hợp lệ',
  'vocab.validation.audioUrlTooLong': 'Tối đa 500 ký tự',
  'vocab.validation.ipaTooLong': 'Tối đa 100 ký tự',
  'vocab.validation.duplicateWord': 'Từ này đã tồn tại trong khóa học',

  // Actions / feedback
  'vocab.action.add': 'Thêm từ vựng',
  'vocab.action.update': 'Lưu thay đổi',
  'vocab.action.edit': 'Sửa từ vựng',
  'vocab.action.delete': 'Xoá từ vựng',
  'vocab.action.playAudio': 'Nghe thử',
  'vocab.action.editRow': 'Sửa từ vựng này',
  'vocab.action.deleteRow': 'Xoá từ vựng này',
  'vocab.action.cancelEdit': 'Huỷ chỉnh sửa',
  'vocab.action.addNew': 'Thêm từ vựng mới',
  'vocab.action.previewAudio': 'Nghe thử âm thanh',
  'vocab.feedback.added': 'Đã thêm từ vựng',
  'vocab.feedback.updated': 'Đã cập nhật từ vựng',
  'vocab.feedback.deleted': 'Đã xoá từ vựng',
  'vocab.feedback.addFailed': 'Thêm từ vựng thất bại',
  'vocab.feedback.updateFailed': 'Cập nhật từ vựng thất bại',
  'vocab.feedback.deleteFailed': 'Xoá từ vựng thất bại',
  'vocab.feedback.audioError': 'Không phát được audio',
  'vocab.feedback.audioMissing': 'Vui lòng nhập link audio trước',
  'vocab.confirmDeleteTitle': 'Xoá từ vựng này?',
  'vocab.confirmDeleteBody':
    '“{word}” sẽ bị xoá vĩnh viễn khỏi khóa học. Hành động này không thể hoàn tác.',
  'vocab.confirmDeleteConfirm': 'Xoá',
  'vocab.confirmDeleteCancel': 'Giữ lại',

  // Table columns
  'vocab.table.word': 'Từ vựng',
  'vocab.table.ipa': 'Phiên âm',
  'vocab.table.meaning': 'Nghĩa',
  'vocab.table.audio': 'Audio',
  'vocab.table.actions': 'Thao tác',
  'vocab.table.noAudio': 'Chưa có audio',

  // =========================================================
  // Admin — modal quản lý nội dung khóa học (form động theo contentType)
  // =========================================================
  'content.modal.createTitle': 'Thêm nội dung khóa học',
  'content.modal.updateTitle': 'Chỉnh sửa nội dung khóa học',
  'content.modal.subtitle': 'Quản lý bài học, từ vựng và bài tập',

  // Loại nội dung
  'content.type.lesson': 'Bài học',
  'content.type.vocabulary': 'Bộ từ vựng',
  'content.type.homework': 'Bài tập',

  // Trường chung
  'content.form.contentType': 'Loại nội dung',
  'content.form.typeLockedHint':
    'Loại nội dung không thể thay đổi sau khi đã tạo.',
  'content.form.title': 'Tiêu đề',
  'content.form.titlePlaceholder': 'VD: Mở đầu IELTS Writing',
  'content.form.description': 'Mô tả',
  'content.form.descriptionPlaceholder': 'Tóm tắt ngắn hiển thị cho học viên…',
  'content.form.contentOrder': 'Thứ tự',
  'content.form.durationMinutes': 'Thời lượng (phút)',
  'content.form.durationPlaceholder': 'VD: 30',
  'content.form.videoUrl': 'Link video',
  'content.form.videoUrlPlaceholder': 'https://… (mp4)',
  'content.form.videoUrlHint': 'Hỗ trợ link MP4 trực tiếp hoặc link Youtube.',
  'content.form.isPreview': 'Bài học thử',
  'content.form.isPreviewHint':
    'Mọi người đều có thể xem bài học này mà không cần đăng ký.',
  'content.form.instructions': 'Hướng dẫn',
  'content.form.instructionsPlaceholder': 'Học viên cần làm gì?',
  'content.form.dueDate': 'Hạn nộp',
  'content.form.maxScore': 'Điểm tối đa',
  'content.form.maxScorePlaceholder': 'VD: 100',
  'content.form.maxAttempts': 'Số lần làm tối đa',
  'content.form.maxAttemptsHint': 'Để trống nếu không giới hạn số lần làm.',
  'content.form.maxAttemptsPlaceholder': 'VD: 3',
  'content.form.attachmentUrl': 'Link tài liệu',
  'content.form.attachmentUrlPlaceholder': 'https://… (pdf)',
  'content.form.rubric': 'Tiêu chí chấm điểm',
  'content.form.rubricEmpty': 'Chưa có tiêu chí — thêm tiêu chí để mô tả cách chấm.',
  'content.form.criterionPlaceholder': 'Tên tiêu chí',
  'content.form.criterionDescPlaceholder': 'Mô tả (không bắt buộc)',

  // Bài tập — hình thức nộp (khớp cột homework_submissions của backend)
  'content.homework.submissionType': 'Hình thức nộp',
  'content.homework.submissionTypeHint':
    'Quyết định học viên nộp bài kiểu gì. Trắc nghiệm được chấm tự động.',
  'content.homework.type.text': 'Tự luận (gõ trả lời)',
  'content.homework.type.file': 'Nộp file',
  'content.homework.type.multiple_choice': 'Trắc nghiệm',
  'content.homework.passingScore': 'Điểm đạt',
  'content.homework.passingScoreHint':
    'Phần trăm điểm tối thiểu (0-100) để được đạt.',
  'content.homework.passingScorePlaceholder': 'VD: 60',
  'content.homework.timeLimit': 'Thời gian làm bài (phút)',
  'content.homework.timeLimitHint': 'Để trống nếu không giới hạn thời gian.',
  'content.homework.timeLimitPlaceholder': 'VD: 45',
  'content.homework.examId': 'Đề thi liên kết',
  'content.homework.examIdHint':
    'Chọn đề thi đã công bố của khóa học này. Học viên làm bài trong phòng thi.',
  'content.homework.examPlaceholder': 'Chọn đề thi…',
  'content.homework.noExam': 'Khóa học này chưa có đề thi đã công bố.',
  'content.homework.examEmpty': 'Hãy chọn đề trắc nghiệm để liên kết bài tập này.',

  // Từ vựng — chọn bộ từ vựng từ thư viện
  'content.vocab.libraryTitle': 'Chọn bộ từ vựng',
  'content.vocab.libraryHint':
    'Chọn một hoặc nhiều bộ trong thư viện. Các từ của bộ sẽ được sao chép vào nội dung này.',
  'content.vocab.libraryEmpty':
    'Thư viện từ vựng đang trống. Hãy thêm từ trước rồi liên kết vào đây.',
  'content.vocab.librarySearch': 'Tìm bộ từ vựng…',
  'content.vocab.libraryLoadFailed': 'Không tải được thư viện từ vựng.',
  'content.vocab.librarySelected': 'Bộ đã liên kết',
  'content.vocab.librarySelectedEmpty': 'Chưa liên kết bộ nào.',
  'content.vocab.libraryLink': 'Liên kết bộ',
  'content.vocab.libraryUnlink': 'Gỡ liên kết',
  'content.vocab.libraryWords': '{count} từ',
  'content.vocab.libraryKindSet': 'Bộ từ',
  'content.vocab.libraryKindWord': 'Từ đơn',
  'content.vocab.libraryLinkHint':
    'Các bộ đã liên kết được ghi lại để truy vết nguồn của từ vựng.',
  'content.vocab.libraryDuplicated': '{count} từ đã có trong danh sách',
  'content.vocab.libraryAllCourses': 'Tất cả khóa học',

  // Trình thêm từ vựng
  'content.vocab.builderTitle': 'Thêm một từ vào danh sách',
  'content.vocab.editingTitle': 'Sửa từ đang chọn',
  'content.vocab.listTitle': 'Các từ trong bộ này',
  'content.vocab.emptyTitle': 'Chưa thêm từ nào',
  'content.vocab.emptyDescription':
    'Điền từ ở bên trái, rồi bấm nút thêm vào danh sách.',

  // Từ vựng — chọn bộ từ vựng CHUNG để gán vào khóa học (contentType = vocabulary)
  'content.vocab.bankTitle': 'Chọn bộ từ vựng từ kho chung',
  'content.vocab.bankHint':
    'Tìm trong kho từ vựng chung và tick chọn các bộ muốn liên kết vào khóa học này.',
  'content.vocab.bankSearch': 'Tìm theo bộ hoặc từ…',
  'content.vocab.bankEmpty': 'Kho từ vựng chung đang trống.',
  'content.vocab.bankNoResult': 'Không tìm thấy bộ từ vựng phù hợp.',
  'content.vocab.bankSelected': 'Bộ đang chọn',
  'content.vocab.bankSelectedEmpty': 'Chưa chọn bộ nào.',
  'content.vocab.bankAssigned': 'Đã có trong khóa học',
  'content.vocab.bankRequired': 'Cần chọn ít nhất một bộ từ vựng',
  'content.vocab.bankLoadFailed': 'Không tải được kho từ vựng.',
  'content.vocab.bankCount': '{count} bộ',

  // Bài tập — chọn đề thi/bài kiểm tra định nghĩa sẵn
  'content.homework.examTitle': 'Chọn đề thi / bài kiểm tra',
  'content.homework.examSearch': 'Tìm đề thi…',
  'content.homework.examListEmpty':
    'Khóa học này chưa có đề thi hay bài kiểm tra nào. Hãy tạo ở phần Quản lý đề thi trước.',
  'content.homework.examNoResult': 'Không tìm thấy đề thi phù hợp.',
  'content.homework.examSelectHint':
    'Tick đề thi bạn muốn gắn. Học viên làm bài trong phòng thi.',
  'content.homework.examQuestions': '{count} câu hỏi',
  'content.homework.examDuration': '{count} phút',
  'content.homework.examType': 'Loại',
  'content.homework.examStatus': 'Trạng thái',
  'content.homework.examStatusPublished': 'Đã công bố',
  'content.homework.examStatusDraft': 'Nháp',
  'content.homework.examStatusArchived': 'Lưu trữ',

  // Cột phải — "HIỆN CÓ"
  'content.existing.title': 'Hiện có',
  'content.existing.lessonHint':
    'Kiểm tra lại cấu hình bài học trước khi lưu.',
  'content.existing.vocabHint':
    'Các từ trong bộ này — sửa hoặc xoá trước khi lưu.',
  'content.existing.homeworkHint':
    'Kiểm tra lại cấu hình bài tập trước khi lưu.',

  // Xem trước
  'content.lesson.previewTitle': 'Tóm tắt bài học',
  'content.lesson.previewHint':
    'Kiểm tra lại cấu hình bài học trước khi lưu.',
  'content.lesson.minutes': 'phút',
  'content.lesson.noVideo': 'Chưa gắn video',
  'content.homework.previewTitle': 'Tóm tắt bài tập',
  'content.homework.unlimitedAttempts': 'Không giới hạn',

  // Danh sách nội dung trong trang chi tiết khóa học
  'content.list.emptyTitle': 'Chưa có nội dung nào',
  'content.list.emptyDescription':
    'Thêm bài học, bộ từ vựng hoặc bài tập cho khóa học này.',
  'content.list.titleCol': 'Tiêu đề',
  'content.list.typeCol': 'Loại',
  'content.list.actionsCol': 'Thao tác',

  // Hành động
  'content.action.add': 'Thêm nội dung',
  'content.action.update': 'Lưu thay đổi',
  'content.action.addWordToList': '+ Thêm từ này vào danh sách',
  'content.action.updateWord': 'Lưu từ này',
  'content.action.cancelEditWord': 'Huỷ',
  'content.action.editWord': 'Sửa từ này',
  'content.action.removeWord': 'Xoá từ này khỏi danh sách',
  'content.action.addCriterion': 'Thêm tiêu chí',
  'content.action.removeCriterion': 'Xoá tiêu chí',

  // Kiểm tra dữ liệu
  'content.validation.titleRequired': 'Tiêu đề là bắt buộc',
  'content.validation.titleTooLong': 'Tối đa 255 ký tự',
  'content.validation.orderInvalid': 'Thứ tự phải là số không âm',
  'content.validation.videoUrlInvalid': 'Link video phải là URL hợp lệ',
  'content.validation.durationInvalid': 'Thời lượng phải là số dương',
  'content.validation.maxScoreInvalid': 'Điểm tối đa phải là số dương',
  'content.validation.maxAttemptsInvalid':
    'Số lần làm tối đa phải là số không âm',
  'content.validation.vocabularyEmpty': 'Cần thêm ít nhất một từ vào bộ từ vựng',
  'content.validation.wordRequired': 'Từ tiếng Anh là bắt buộc',
  'content.validation.meaningRequired': 'Nghĩa tiếng Việt là bắt buộc',
  'content.validation.duplicateWord': 'Từ này đã có trong danh sách',
  'content.validation.passingScoreInvalid':
    'Điểm đạt phải nằm trong khoảng 0 đến 100',
  'content.validation.timeLimitInvalid':
    'Thời gian làm bài phải là số phút dương',
  'content.validation.examRequired': 'Hãy chọn đề thi để liên kết',

  // Thông báo
  'content.feedback.added': 'Đã thêm nội dung khóa học',
  'content.feedback.updated': 'Đã cập nhật nội dung khóa học',
  'content.feedback.addFailed': 'Thêm nội dung thất bại',
  'content.feedback.updateFailed': 'Cập nhật nội dung thất bại',
  'content.feedback.wordAdded': 'Đã thêm từ vào danh sách',
  'content.feedback.wordUpdated': 'Đã cập nhật từ trong danh sách',
};

export default vi;
