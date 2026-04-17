import { useNavigate } from 'react-router-dom'

function ThankYouPage() {
  const navigate = useNavigate()

  return (
    <div className="container">
      <div className="thank-you">
        <div className="thank-you-icon" aria-hidden="true">✅</div>
        <h1>문의가 접수되었습니다</h1>
        <p className="thank-you-sub">
          담당자가 영업일 기준 24시간 내에 연락드리겠습니다.
        </p>

        <div className="contact-box">
          <div className="contact-row">
            📞 급하신 경우 직접 전화:{' '}
            <a href="tel:02-0000-0000">02-0000-0000</a>
          </div>
          <div className="contact-row">
            💬 카카오톡 상담: 준비중
          </div>
        </div>

        <button
          type="button"
          className="btn-primary btn-secondary"
          onClick={() => navigate('/')}
        >
          처음으로 돌아가기
        </button>
      </div>
    </div>
  )
}

export default ThankYouPage
