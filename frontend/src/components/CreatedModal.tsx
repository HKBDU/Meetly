import { useState } from 'react'
import { ArrowRight, Check, Clipboard, Link2, Sparkles } from 'lucide-react'

export function CreatedModal({
  code,
  title,
  onClose,
}: {
  code: string
  title: string
  onClose: () => void
}) {
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const fullUrl = `${window.location.origin}/event/${code}`

  const copyCode = async () => {
    await navigator.clipboard.writeText(code)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(fullUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="modal-header">
          <span className="modal-icon">
            <Sparkles size={22} />
          </span>
          <div>
            <h3>Tạo sự kiện thành công!</h3>
            <p className="modal-subtitle">
              Hãy lưu lại mã hoặc link để chia sẻ cho các thành viên.
            </p>
          </div>
        </div>
        <div className="modal-body">
          <p className="modal-event-name">
            <strong>Sự kiện:</strong> {title}
          </p>
          <div className="share-field">
            <span className="field-title">Mã sự kiện (Short code)</span>
            <div className="share-box">
              <span className="code-text">{code}</span>
              <button type="button" className="secondary-button" onClick={copyCode}>
                {copiedCode ? <Check size={16} /> : <Clipboard size={16} />}
                {copiedCode ? 'Đã chép' : 'Sao chép mã'}
              </button>
            </div>
          </div>
          <div className="share-field">
            <span className="field-title">Đường link tham gia</span>
            <div className="share-box">
              <input readOnly value={fullUrl} className="share-link-input" />
              <button type="button" className="secondary-button" onClick={copyLink}>
                {copiedLink ? <Check size={16} /> : <Link2 size={16} />}
                {copiedLink ? 'Đã chép' : 'Sao chép link'}
              </button>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="primary-button" onClick={onClose}>
            <ArrowRight size={17} /> Vào lịch sự kiện ngay
          </button>
        </div>
      </div>
    </div>
  )
}
