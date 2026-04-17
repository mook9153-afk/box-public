import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import { CheckIcon, PhoneIcon } from '../components/Icons.jsx'

function ThankYouPage() {
  const navigate = useNavigate()

  return (
    <Layout>
      <div className="container">
        <div className="thank-you">
          <div className="thank-you-icon-wrap" aria-hidden="true">
            <CheckIcon size={36} strokeWidth={3} />
          </div>
          <h1 className="thank-you-headline">
            문의를 보내주셔서 감사합니다
          </h1>
          <p className="thank-you-sub">
            영업일 기준 24시간 이내에 담당자가 연락드리겠습니다.
          </p>

          <div className="contact-card">
            <div className="contact-row">
              <span className="contact-icon">
                <PhoneIcon size={18} />
              </span>
              <div className="contact-body">
                <span className="contact-label">전화 및 문자 문의</span>
                <a href="tel:010-4733-7440">010-4733-7440</a>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate('/')}
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    </Layout>
  )
}

export default ThankYouPage
