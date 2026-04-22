import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import { CheckIcon } from '../components/Icons.jsx'

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
