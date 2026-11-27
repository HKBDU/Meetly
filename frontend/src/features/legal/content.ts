import { CONTACT_EMAIL } from '@/shared/constants'
import type { Locale } from '@/shared/i18n'

export { CONTACT_EMAIL }

/**
 * Nội dung trang Chính sách quyền riêng tư và Điều khoản sử dụng. Viết theo đúng cách app
 * đang xử lý dữ liệu; đổi hạ tầng (email, analytics, hosting) thì cập nhật cả ở đây.
 * Một phần tử `string[]` trong `body` được hiển thị thành danh sách gạch đầu dòng.
 */
export interface LegalSection {
  heading: string
  body: (string | string[])[]
}

export interface LegalDocument {
  title: string
  intro: string
  sections: LegalSection[]
}

/** Ngày cập nhật gần nhất, dạng YYYY-MM-DD */
export const LAST_UPDATED = '2026-11-27'

const privacyVi: LegalDocument = {
  title: 'Chính sách quyền riêng tư',
  intro:
    'Meetly là công cụ miễn phí giúp một nhóm tìm thời gian gặp nhau. Chính sách này giải thích Meetly thu thập dữ liệu gì, dùng vào việc gì và bạn có những quyền gì với dữ liệu của mình.',
  sections: [
    {
      heading: 'Dữ liệu chúng tôi thu thập',
      body: [
        'Meetly không yêu cầu tạo tài khoản. Chúng tôi chỉ lưu những gì bạn nhập khi dùng dịch vụ:',
        [
          'Thông tin sự kiện: tên sự kiện, các ngày hoặc thứ trong tuần, khung giờ, thời gian đã chốt và link phòng họp nếu người tổ chức thêm.',
          'Tên hiển thị bạn nhập khi tham gia một sự kiện.',
          'Mật khẩu (nếu bạn đặt): được mã hoá một chiều trước khi lưu, không ai, kể cả chúng tôi, đọc được mật khẩu gốc.',
          'Lịch rảnh bạn đánh dấu trên lưới thời gian.',
          'Địa chỉ email (không bắt buộc): chỉ khi bạn chủ động đăng ký nhận thông báo.',
          'Dữ liệu sử dụng qua Google Analytics và Cloudflare Web Analytics: trang đã xem, loại thiết bị và trình duyệt, khu vực ước tính và các thao tác chính như tạo sự kiện hay lưu lịch.',
          'Dữ liệu kỹ thuật: địa chỉ IP và nhật ký yêu cầu trên máy chủ, dùng để chống lạm dụng và sửa lỗi.',
        ],
      ],
    },
    {
      heading: 'Chúng tôi dùng dữ liệu để làm gì',
      body: [
        [
          'Vận hành các tính năng: hiển thị sự kiện, gộp lịch rảnh thành bản đồ nhiệt và gợi ý giờ phù hợp.',
          'Gửi một email thông báo khi người tổ chức chốt lịch, nếu bạn đã đăng ký.',
          'Hiểu cách mọi người dùng Meetly để cải thiện sản phẩm.',
          'Bảo vệ dịch vụ khỏi spam và truy cập bất thường.',
        ],
        'Chúng tôi không bán dữ liệu của bạn và không dùng email của bạn để gửi quảng cáo.',
      ],
    },
    {
      heading: 'Ai có thể thấy thông tin của bạn',
      body: [
        'Bất kỳ ai có link hoặc mã của một sự kiện đều có thể xem tên sự kiện, tên hiển thị, lịch rảnh của những người tham gia và link phòng họp nếu có. Vì vậy, đừng nhập thông tin nhạy cảm vào tên sự kiện hay tên hiển thị.',
        'Địa chỉ email không hiển thị cho người tham gia khác. Mỗi người nhận một email riêng.',
      ],
    },
    {
      heading: 'Bên thứ ba xử lý dữ liệu',
      body: [
        'Để vận hành Meetly, chúng tôi dùng một số nhà cung cấp dịch vụ. Họ chỉ xử lý dữ liệu cần cho phần việc của mình:',
        [
          'Vercel: lưu trữ và phân phối giao diện web.',
          'Render và nhà cung cấp cơ sở dữ liệu: chạy máy chủ và lưu dữ liệu sự kiện.',
          'Brevo: gửi email thông báo chốt lịch.',
          'Google Analytics và Cloudflare Web Analytics: thống kê lượt truy cập và tốc độ tải trang.',
        ],
        'Các nhà cung cấp này có thể đặt máy chủ ở ngoài Việt Nam, nên dữ liệu của bạn có thể được xử lý ở nước ngoài.',
      ],
    },
    {
      heading: 'Cookie và lưu trữ trên trình duyệt',
      body: [
        'Meetly lưu một số thông tin ngay trên trình duyệt của bạn (localStorage): phiên tham gia sự kiện để bạn không phải nhập lại tên, chế độ sáng/tối và ngôn ngữ đã chọn.',
        'Google Analytics dùng cookie để phân biệt lượt truy cập. Cloudflare Web Analytics không dùng cookie và không lưu gì trên trình duyệt của bạn. Bạn có thể chặn cookie hoặc dùng tiện ích chặn theo dõi; Meetly vẫn hoạt động bình thường.',
      ],
    },
    {
      heading: 'Meetly Extension (tiện ích trình duyệt)',
      body: [
        'Nếu bạn dùng tiện ích Meetly cho trình duyệt, tiện ích lưu một số dữ liệu ngay trên máy bạn (trong bộ nhớ riêng của tiện ích), không đồng bộ lên máy chủ của chúng tôi:',
        [
          'Tên người tổ chức bạn hay dùng, để điền sẵn lần sau.',
          'Danh sách sự kiện bạn đã tạo bằng tiện ích: tên và mã sự kiện, thời điểm tạo.',
          'Mã đăng nhập và mật khẩu người tổ chức do tiện ích tự tạo ngẫu nhiên cho từng sự kiện, để bạn mở lại sự kiện với vai trò người tổ chức.',
        ],
        'Thông tin sự kiện bạn tạo (tên, ngày giờ, tên hiển thị) được gửi tới máy chủ Meetly giống hệt khi dùng trang web. Khi bạn bấm mở một sự kiện, tiện ích chuyển phiên đăng nhập sang trang web qua phần sau dấu # của đường dẫn; phần này không được gửi lên máy chủ.',
        'Tiện ích chỉ kết nối tới máy chủ Meetly. Tiện ích không đọc nội dung các trang web bạn mở, không theo dõi lịch sử duyệt web và không dùng công cụ thống kê truy cập nào.',
        'Bạn có thể xoá từng sự kiện khỏi danh sách trong tiện ích. Gỡ tiện ích sẽ xoá toàn bộ dữ liệu tiện ích đã lưu trên máy; sự kiện trên Meetly vẫn còn cho đến khi có yêu cầu xoá.',
      ],
    },
    {
      heading: 'Google Calendar và dữ liệu người dùng Google',
      body: [
        'Kết nối tài khoản Google là tùy chọn. Meetly chỉ xin quyền khi bạn bấm "Nhập từ Google Calendar".',
        'Nút "Thêm vào Google Calendar" không cần kết nối tài khoản: nút này chỉ mở trang tạo sự kiện của Google với thông tin cuộc hẹn điền sẵn, và bạn tự bấm Lưu trên Google.',
        'Chúng tôi truy cập gì và để làm gì:',
        [
          'Giờ rảnh/bận (quyền calendar.freebusy). Khi bạn nhập từ Google Calendar, Meetly chỉ đọc các khoảng bận trong khung giờ của cuộc hẹn để điền sẵn lịch rảnh. Đây là quyền duy nhất Meetly xin: Meetly không đọc tên hay nội dung sự kiện, cũng không tạo hay sửa sự kiện trong lịch của bạn.',
        ],
        'Cách chúng tôi xử lý dữ liệu Google:',
        [
          'Mã truy cập Google chỉ nằm trong tab trình duyệt của bạn và hết hạn sau khoảng một giờ. Mã này không bao giờ được gửi tới hay lưu trên máy chủ của chúng tôi.',
          'Giờ rảnh/bận được chuyển thành lưới lịch rảnh ngay trên trình duyệt. Meetly chỉ nhận lịch rảnh bạn đã xem lại và lưu, giống hệt khi bạn tự tô bằng tay. Dữ liệu rảnh/bận gốc không được lưu.',
          'Link cuộc họp (Google Meet, Zoom...) do người tổ chức tự dán vào, không lấy từ tài khoản Google. Nếu người tổ chức chọn tạo phòng Jitsi Meet, Meetly chỉ sinh một tên phòng ngẫu nhiên trên meet.jit.si (dịch vụ của 8x8) và không gửi dữ liệu nào của bạn cho Jitsi; khi vào phòng, bạn dùng dịch vụ của Jitsi theo điều khoản của họ. Meetly lưu link này cùng sự kiện; ai có link sự kiện đều xem được, và link cũng có trong file lịch và email gửi qua Brevo cho người đã đăng ký nhận thông báo.',
          'Dữ liệu người dùng Google chỉ được dùng để cung cấp tính năng bạn chọn. Dữ liệu này không được bán, dùng cho quảng cáo hay huấn luyện AI và mô hình học máy.',
        ],
        'Việc Meetly sử dụng và chuyển giao thông tin nhận từ Google API tuân thủ Chính sách dữ liệu người dùng của Google API Services (Google API Services User Data Policy), bao gồm các yêu cầu về Sử dụng giới hạn (Limited Use).',
        'Bạn có thể thu hồi quyền truy cập của Meetly bất cứ lúc nào tại https://myaccount.google.com/permissions.',
      ],
    },
    {
      heading: 'Thời gian lưu trữ',
      body: [
        'Dữ liệu sự kiện (gồm tên hiển thị, lịch rảnh và email đã đăng ký) được lưu cho đến khi có yêu cầu xoá. Dữ liệu thống kê được Google Analytics và Cloudflare lưu theo chính sách của từng dịch vụ.',
      ],
    },
    {
      heading: 'Quyền của bạn',
      body: [
        'Bạn có quyền yêu cầu xem, sửa hoặc xoá dữ liệu cá nhân của mình, cũng như huỷ đăng ký nhận email. Hãy gửi yêu cầu tới email liên hệ bên dưới, kèm mã sự kiện và tên hiển thị để chúng tôi tìm đúng dữ liệu. Chúng tôi sẽ phản hồi trong thời gian sớm nhất có thể.',
      ],
    },
    {
      heading: 'Bảo mật',
      body: [
        'Kết nối tới Meetly được mã hoá bằng HTTPS, mật khẩu được mã hoá một chiều và phiên đăng nhập có thời hạn. Dù vậy, không hệ thống nào an toàn tuyệt đối, nên chúng tôi không thể cam kết dữ liệu không bao giờ bị lộ.',
      ],
    },
    {
      heading: 'Trẻ em',
      body: ['Meetly không dành cho trẻ em dưới 13 tuổi và không cố ý thu thập dữ liệu của trẻ em.'],
    },
    {
      heading: 'Thay đổi chính sách',
      body: [
        'Chúng tôi có thể cập nhật chính sách này khi sản phẩm thay đổi. Ngày cập nhật gần nhất luôn được ghi ở đầu trang.',
      ],
    },
  ],
}

const privacyEn: LegalDocument = {
  title: 'Privacy Policy',
  intro:
    'Meetly is a free tool that helps a group find a time to meet. This policy explains what data Meetly collects, how it is used, and the rights you have over your data.',
  sections: [
    {
      heading: 'Data we collect',
      body: [
        'Meetly does not require an account. We only store what you enter while using the service:',
        [
          'Event details: the event name, dates or days of the week, the time range, the finalized time and an optional meeting link added by the host.',
          'The display name you enter when joining an event.',
          'A password, if you set one: it is hashed before storage, so nobody, including us, can read the original.',
          'The availability you mark on the time grid.',
          'Your email address (optional): only if you choose to sign up for notifications.',
          'Usage data through Google Analytics and Cloudflare Web Analytics: pages viewed, device and browser type, approximate region, and key actions such as creating an event or saving availability.',
          'Technical data: IP addresses and request logs on our servers, used to prevent abuse and fix problems.',
        ],
      ],
    },
    {
      heading: 'How we use your data',
      body: [
        [
          'To run the features: showing events, combining availability into the heatmap and suggesting good times.',
          'To send one email when the host finalizes the meeting time, if you signed up.',
          'To understand how people use Meetly so we can improve it.',
          'To protect the service from spam and unusual traffic.',
        ],
        'We do not sell your data and we do not use your email for marketing.',
      ],
    },
    {
      heading: 'Who can see your information',
      body: [
        "Anyone with an event's link or code can see the event name, the display names and availability of its participants, and the meeting link if one was added. Please don't put sensitive information in event or display names.",
        'Email addresses are never shown to other participants. Each recipient gets their own email.',
      ],
    },
    {
      heading: 'Third-party processors',
      body: [
        'We rely on a few service providers to run Meetly. They only process the data needed for their part of the work:',
        [
          'Vercel: hosts and serves the web app.',
          'Render and our database provider: run the server and store event data.',
          'Brevo: sends the finalized-meeting emails.',
          'Google Analytics and Cloudflare Web Analytics: measure website traffic and page load performance.',
        ],
        'These providers may operate servers outside your country, so your data may be processed abroad.',
      ],
    },
    {
      heading: 'Cookies and browser storage',
      body: [
        'Meetly keeps a few things in your browser (localStorage): your event session so you do not have to re-enter your name, your light/dark mode and your language.',
        'Google Analytics uses cookies to tell visits apart. Cloudflare Web Analytics does not use cookies or store anything in your browser. You can block cookies or use a tracker blocker; Meetly keeps working normally.',
      ],
    },
    {
      heading: 'Meetly Extension (browser extension)',
      body: [
        "If you use the Meetly browser extension, it stores some data on your device (in the extension's own storage). This data is not synced to our servers:",
        [
          'The host name you usually use, so it can be filled in next time.',
          'The list of events you created with the extension: event name and code, and when it was created.',
          'The access token and the host password that the extension randomly generates for each event, so you can reopen the event as the host.',
        ],
        'The event details you create (name, dates and times, display name) are sent to the Meetly server exactly as when you use the website. When you open an event, the extension passes your session to the website in the part of the link after the # sign, which is never sent to any server.',
        'The extension only connects to the Meetly server. It does not read the content of the pages you visit, does not track your browsing history and does not use any analytics tools.',
        'You can remove any event from the list in the extension. Uninstalling the extension deletes everything it stored on your device; the events on Meetly remain until a deletion is requested.',
      ],
    },
    {
      heading: 'Google Calendar and Google user data',
      body: [
        'Connecting your Google account is optional. Meetly asks for access only when you click "Import from Google Calendar".',
        'The "Add to Google Calendar" button needs no account connection: it only opens Google\'s event page with the meeting details filled in, and you click Save on Google yourself.',
        'What we access and why:',
        [
          'Free/busy times (scope calendar.freebusy). When you import from Google Calendar, Meetly reads only the busy time ranges within the poll window to pre-fill your availability. This is the only scope Meetly requests: it never reads event titles or details, and never creates or changes events in your calendar.',
        ],
        'How we handle Google data:',
        [
          'The Google access token stays in your browser tab and expires after about one hour. It is never sent to or stored on our servers.',
          'Free/busy times are turned into the availability grid in your browser. Only the availability you review and save is sent to Meetly, exactly as if you had marked it by hand. The raw free/busy data is not stored.',
          'Meeting links (Google Meet, Zoom...) are pasted by the host, not taken from a Google account. If the host chooses to create a Jitsi Meet room, Meetly only generates a random room name on meet.jit.si (run by 8x8) and sends none of your data to Jitsi; when you join, you use the Jitsi service under its own terms. Meetly stores the link with the event; anyone with the event link can see it, and it also appears in calendar files and in emails sent through Brevo to notification subscribers.',
          'Google user data is used to provide the feature you select. It is never sold or used for advertising or to train AI or machine learning models.',
        ],
        "Meetly's use and transfer of information received from Google APIs adheres to the Google API Services User Data Policy, including the Limited Use requirements.",
        'You can remove Meetly\'s access at any time at https://myaccount.google.com/permissions.',
      ],
    },
    {
      heading: 'Data retention',
      body: [
        'Event data (including display names, availability and subscribed emails) is kept until a deletion is requested. Analytics data is kept by Google Analytics and Cloudflare according to the policy of each service.',
      ],
    },
    {
      heading: 'Your rights',
      body: [
        'You can ask to access, correct or delete your personal data, or to stop receiving emails. Send your request to the contact email below with the event code and your display name so we can find the right data. We will reply as soon as we can.',
      ],
    },
    {
      heading: 'Security',
      body: [
        'Connections to Meetly are encrypted with HTTPS, passwords are hashed and sessions expire. Still, no system is perfectly secure, so we cannot promise your data will never be exposed.',
      ],
    },
    {
      heading: 'Children',
      body: ['Meetly is not intended for children under 13, and we do not knowingly collect their data.'],
    },
    {
      heading: 'Changes to this policy',
      body: ['We may update this policy as the product changes. The date of the latest update is always shown at the top of this page.'],
    },
  ],
}

const termsVi: LegalDocument = {
  title: 'Điều khoản sử dụng',
  intro:
    'Khi dùng Meetly, bạn đồng ý với các điều khoản dưới đây. Nếu không đồng ý, vui lòng ngừng sử dụng dịch vụ.',
  sections: [
    {
      heading: 'Dịch vụ',
      body: [
        'Meetly là công cụ miễn phí giúp tạo sự kiện, thu thập lịch rảnh và chốt thời gian họp. Dịch vụ được cung cấp "nguyên trạng". Chúng tôi có thể thay đổi, tạm ngừng hoặc dừng một phần hay toàn bộ dịch vụ bất cứ lúc nào.',
      ],
    },
    {
      heading: 'Sự kiện và link chia sẻ',
      body: [
        [
          'Ai có link hoặc mã sự kiện đều có thể xem và tham gia sự kiện đó. Bạn tự quyết định chia sẻ link cho ai.',
          'Người tạo sự kiện dùng mật khẩu để sửa hoặc chốt lịch. Mật khẩu này không thể khôi phục, hãy giữ cẩn thận.',
          'Sau khi chốt, lịch của sự kiện bị khoá và không thể chỉnh sửa.',
          'Nếu bạn thêm link cuộc họp cho sự kiện, Meetly sẽ chia sẻ link đó trên trang sự kiện, trong file lịch và email thông báo theo Chính sách quyền riêng tư.',
        ],
      ],
    },
    {
      heading: 'Nội dung của bạn',
      body: [
        'Bạn chịu trách nhiệm về nội dung mình nhập, như tên sự kiện và tên hiển thị. Bạn cho phép Meetly lưu trữ và hiển thị nội dung đó cho những người có link sự kiện, để dịch vụ hoạt động.',
      ],
    },
    {
      heading: 'Hành vi không được phép',
      body: [
        'Khi dùng Meetly, bạn không được:',
        [
          'Đăng nội dung vi phạm pháp luật, xúc phạm, quấy rối hoặc mạo danh người khác.',
          'Nhập thông tin cá nhân nhạy cảm của người khác khi chưa được họ đồng ý.',
          'Gửi spam hoặc dùng Meetly để lừa đảo.',
          'Tấn công, dò quét, làm quá tải hệ thống hoặc thu thập dữ liệu tự động.',
        ],
        'Chúng tôi có thể xoá nội dung hoặc sự kiện vi phạm mà không cần báo trước.',
      ],
    },
    {
      heading: 'Giới hạn trách nhiệm',
      body: [
        'Chúng tôi cố gắng giữ Meetly hoạt động ổn định nhưng không cam kết dịch vụ luôn sẵn sàng hay không có lỗi. Email thông báo có thể đến trễ hoặc rơi vào thư mục spam. Trong phạm vi pháp luật cho phép, Meetly không chịu trách nhiệm về thiệt hại phát sinh từ việc sử dụng dịch vụ, như cuộc họp bị lỡ hoặc dữ liệu bị mất.',
      ],
    },
    {
      heading: 'Mã nguồn',
      body: ['Mã nguồn của Meetly được công khai trên GitHub và sử dụng theo giấy phép ghi trong kho mã.'],
    },
    {
      heading: 'Luật áp dụng',
      body: ['Các điều khoản này được điều chỉnh theo pháp luật Việt Nam.'],
    },
    {
      heading: 'Thay đổi điều khoản',
      body: [
        'Chúng tôi có thể cập nhật điều khoản khi sản phẩm thay đổi. Việc tiếp tục sử dụng Meetly sau khi điều khoản được cập nhật đồng nghĩa với việc bạn chấp nhận bản mới.',
      ],
    },
  ],
}

const termsEn: LegalDocument = {
  title: 'Terms of Service',
  intro: 'By using Meetly you agree to these terms. If you do not agree, please stop using the service.',
  sections: [
    {
      heading: 'The service',
      body: [
        'Meetly is a free tool for creating events, collecting availability and finalizing a meeting time. It is provided "as is". We may change, suspend or stop all or part of the service at any time.',
      ],
    },
    {
      heading: 'Events and shared links',
      body: [
        [
          "Anyone with an event's link or code can view and join that event. You decide who you share it with.",
          'The event creator uses a password to edit or finalize the event. It cannot be recovered, so keep it safe.',
          'Once finalized, an event is locked and schedules can no longer be edited.',
          'If you add a meeting link to an event, Meetly shares it on the event page, in calendar files and in notification emails as described in the Privacy Policy.',
        ],
      ],
    },
    {
      heading: 'Your content',
      body: [
        'You are responsible for what you enter, such as event and display names. You allow Meetly to store it and show it to people who have the event link so the service can work.',
      ],
    },
    {
      heading: 'Acceptable use',
      body: [
        'When using Meetly, you must not:',
        [
          'Post unlawful, abusive or harassing content, or impersonate others.',
          "Enter other people's sensitive personal information without their consent.",
          'Send spam or use Meetly for fraud.',
          'Attack, probe or overload the system, or scrape data automatically.',
        ],
        'We may remove content or events that break these rules without notice.',
      ],
    },
    {
      heading: 'Limitation of liability',
      body: [
        'We try to keep Meetly running smoothly but do not promise it will always be available or error-free. Notification emails may be delayed or land in spam. To the extent permitted by law, Meetly is not liable for damages arising from use of the service, such as missed meetings or lost data.',
      ],
    },
    {
      heading: 'Source code',
      body: ["Meetly's source code is public on GitHub and available under the license stated in the repository."],
    },
    {
      heading: 'Governing law',
      body: ['These terms are governed by the laws of Vietnam.'],
    },
    {
      heading: 'Changes to these terms',
      body: ['We may update these terms as the product changes. Continuing to use Meetly after an update means you accept the new terms.'],
    },
  ],
}

export const LEGAL_CONTENT: Record<'privacy' | 'terms', Record<Locale, LegalDocument>> = {
  privacy: { en: privacyEn, vi: privacyVi },
  terms: { en: termsEn, vi: termsVi },
}
