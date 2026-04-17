import { useNavigate } from 'react-router-dom'

function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="container">
      <div className="brand">TS 콜드체인</div>

      <h1 className="hero-headline">박스 규격을 1분 만에 확인하세요</h1>
      <p className="hero-sub">
        현재 사용 중인 박스 치수를 입력하면 자사 제품 규격을 추천해드립니다.
        단가 비교 문의도 함께 받아드립니다.
      </p>

      <button
        type="button"
        className="btn-primary"
        onClick={() => navigate('/match')}
      >
        규격 매칭 시작하기
      </button>

      <div className="steps">
        <div className="steps-title">이용 방법</div>
        <div className="step">
          <div className="step-icon" aria-hidden="true">📏</div>
          <div className="step-text">사용 중인 박스 치수 입력</div>
        </div>
        <div className="step">
          <div className="step-icon" aria-hidden="true">📦</div>
          <div className="step-text">자사 제품과 매칭</div>
        </div>
        <div className="step">
          <div className="step-icon" aria-hidden="true">📞</div>
          <div className="step-text">담당자 연락 받기</div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
