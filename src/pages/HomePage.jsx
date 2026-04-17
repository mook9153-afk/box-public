import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import { CheckIcon } from '../components/Icons.jsx'

function HomePage() {
  const navigate = useNavigate()

  const steps = [
    {
      title: '스펙 입력',
      desc: '현재 사용 중인 제품의 정보를 선택하세요.',
    },
    {
      title: '자사 제품 매칭',
      desc: '입력하신 스펙에 맞는 제품을 즉시 추천해드립니다.',
    },
    {
      title: '담당자 연락',
      desc: '연락처를 남기시면 더 나은 조건을 제안드립니다.',
    },
  ]

  const trust = [
    {
      title: '빠른 납기',
      desc: '재고 제품은 바로, 맞춤 규격도 신속하게 안내드립니다.',
    },
    {
      title: '품질 보증',
      desc: '콜드체인 전용 규격과 자재로 안정적인 품질을 유지합니다.',
    },
    {
      title: '맞춤 제안',
      desc: '현재 단가·사용량에 맞춰 최적의 조건을 제안드립니다.',
    },
  ]

  return (
    <Layout>
      <div className="container">
        <div className="home-brand">
          <div className="home-logo">iceasy</div>
          <div className="home-logo-tag">박스 & 냉매 전문</div>
        </div>

        <h1 className="hero-headline">사용 제품 매칭 서비스</h1>
        <p className="hero-sub">
          사용 중인 제품의 스펙을 입력해주세요. 더 나은 조건을 제안드립니다.
        </p>

        <div className="cta-block">
          <button
            type="button"
            className="btn-primary"
            onClick={() => navigate('/match')}
          >
            매칭 시작
          </button>
        </div>

        <div className="steps">
          <div className="steps-title">이용 방법</div>
          {steps.map((step, i) => (
            <div key={i} className="step-card">
              <div className="step-number">{i + 1}</div>
              <div className="step-body">
                <div className="step-title">{step.title}</div>
                <div className="step-desc">{step.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="trust">
          <div className="trust-title">
            콜드체인 업체가 iceasy를 선택하는 이유
          </div>
          <div className="trust-list">
            {trust.map((item, i) => (
              <div key={i} className="trust-item">
                <CheckIcon size={22} className="trust-check" />
                <div>
                  <span className="trust-item-title">{item.title}</span>
                  <span className="trust-item-desc">— {item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default HomePage
