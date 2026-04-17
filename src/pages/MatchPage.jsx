import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import Layout from '../components/Layout.jsx'
import {
  AlertIcon,
  CheckCircleIcon,
  CloseIcon,
  LightbulbIcon,
  PlusIcon,
} from '../components/Icons.jsx'

function makeEmptySet() {
  return {
    key: crypto.randomUUID(),
    inner_width: '',
    inner_depth: '',
    inner_height: '',
    current_price: '',
    monthly_usage: '',
  }
}

function onlyDigits(value) {
  return value.replace(/\D/g, '')
}

function findMatch(products, w, d, h) {
  const candidates = products.filter(
    (p) => p.inner_w >= w && p.inner_d >= d && p.inner_h >= h,
  )
  if (candidates.length === 0) return null
  candidates.sort((a, b) => {
    const diffA = (a.inner_w - w) + (a.inner_d - d) + (a.inner_h - h)
    const diffB = (b.inner_w - w) + (b.inner_d - d) + (b.inner_h - h)
    return diffA - diffB
  })
  return candidates[0]
}

function MatchPage() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [sets, setSets] = useState([makeEmptySet()])
  const [phone, setPhone] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [totalQuantity, setTotalQuantity] = useState('')
  const [memo, setMemo] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function loadProducts() {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, inner_w, inner_d, inner_h')
        .eq('is_active', true)
        .in('company', ['음성 공장', '김포 공장'])
      if (cancelled) return
      if (error) {
        console.error('products 조회 실패:', error)
        return
      }
      setProducts(data ?? [])
    }
    loadProducts()
    return () => {
      cancelled = true
    }
  }, [])

  const matches = useMemo(() => {
    return sets.map((s) => {
      const w = Number(s.inner_width)
      const d = Number(s.inner_depth)
      const h = Number(s.inner_height)
      if (!w || !d || !h) return { status: 'pending', product: null }
      const product = findMatch(products, w, d, h)
      return product
        ? { status: 'found', product }
        : { status: 'none', product: null }
    })
  }, [sets, products])

  const hasContactInput = phone.trim().length > 0

  function updateSet(index, field, value) {
    setSets((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  function addSet() {
    setSets((prev) => [...prev, makeEmptySet()])
  }

  function removeSet(index) {
    setSets((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (submitting) return

    if (!phone.trim()) {
      alert('전화번호를 입력해주세요')
      return
    }

    const completeSets = sets.filter(
      (s) => s.inner_width && s.inner_depth && s.inner_height,
    )
    if (completeSets.length === 0) {
      alert('최소 1개 규격은 치수를 입력해주세요')
      return
    }

    setSubmitting(true)
    try {
      const items = sets
        .map((s) => {
          const w = Number(s.inner_width)
          const d = Number(s.inner_depth)
          const h = Number(s.inner_height)
          if (!w || !d || !h) return null
          const matched = findMatch(products, w, d, h)
          return {
            inner_width: w,
            inner_depth: d,
            inner_height: h,
            matched_product_id: matched?.id ?? null,
            matched_product_name: matched?.name ?? null,
            current_price: s.current_price ? Number(s.current_price) : null,
            monthly_usage: s.monthly_usage ? Number(s.monthly_usage) : null,
          }
        })
        .filter(Boolean)

      const { error: rpcError } = await supabase.rpc('submit_lead', {
        p_phone: phone.trim(),
        p_company_name: companyName.trim() || null,
        p_total_quantity: totalQuantity.trim() || null,
        p_memo: memo.trim() || null,
        p_items: items,
      })

      if (rpcError) throw rpcError

      navigate('/thank-you')
    } catch (err) {
      console.error('문의 저장 실패:', err)
      alert('전송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
      setSubmitting(false)
    }
  }

  return (
    <Layout>
      <div className="container">
        <div className="progress-steps" aria-label="진행 상태">
          <div
            className={`progress-step ${
              !hasContactInput ? 'is-active' : ''
            }`}
          >
            <span className="progress-step-num">1</span>
            <span>규격 입력</span>
          </div>
          <span className="progress-sep">→</span>
          <div
            className={`progress-step ${hasContactInput ? 'is-active' : ''}`}
          >
            <span className="progress-step-num">2</span>
            <span>연락처 입력</span>
          </div>
        </div>

        <h1 className="page-headline">규격 매칭</h1>
        <p className="page-sub">
          현재 사용 중인 박스 내부 치수를 입력해주세요. 실시간으로 맞는 제품을
          찾아드립니다.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="section-title">박스 규격</div>

          {sets.map((s, i) => {
            const match = matches[i]
            return (
              <div key={s.key} className="card spec-card">
                <div className="card-header">
                  <div className="badge">규격 {i + 1}</div>
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => removeSet(i)}
                    disabled={sets.length === 1}
                    aria-label={`규격 ${i + 1} 삭제`}
                  >
                    <CloseIcon size={14} />
                  </button>
                </div>

                <div className="field">
                  <span className="label">
                    내부 치수 <span className="label-muted">(mm)</span>
                  </span>
                  <div className="field-row">
                    <div>
                      <label
                        htmlFor={`w-${s.key}`}
                        className="label"
                      >
                        가로
                      </label>
                      <input
                        id={`w-${s.key}`}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="가로"
                        value={s.inner_width}
                        onChange={(e) =>
                          updateSet(
                            i,
                            'inner_width',
                            onlyDigits(e.target.value),
                          )
                        }
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={`d-${s.key}`}
                        className="label"
                      >
                        세로
                      </label>
                      <input
                        id={`d-${s.key}`}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="세로"
                        value={s.inner_depth}
                        onChange={(e) =>
                          updateSet(
                            i,
                            'inner_depth',
                            onlyDigits(e.target.value),
                          )
                        }
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={`h-${s.key}`}
                        className="label"
                      >
                        높이
                      </label>
                      <input
                        id={`h-${s.key}`}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="높이"
                        value={s.inner_height}
                        onChange={(e) =>
                          updateSet(
                            i,
                            'inner_height',
                            onlyDigits(e.target.value),
                          )
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="field">
                  <span className="label">추천 제품</span>
                  {match.status === 'pending' && (
                    <div className="match-block is-pending">
                      가로/세로/높이 3개 값을 모두 입력하면 추천 제품이
                      표시됩니다.
                    </div>
                  )}
                  {match.status === 'found' && (
                    <div className="match-block is-found">
                      <CheckCircleIcon className="match-icon" />
                      <div className="match-body">
                        <div className="match-result-name">
                          {match.product.name}
                        </div>
                        <div className="match-result-dim">
                          내부 {match.product.inner_w} ×{' '}
                          {match.product.inner_d} × {match.product.inner_h} mm
                        </div>
                      </div>
                    </div>
                  )}
                  {match.status === 'none' && (
                    <div className="match-block is-none">
                      <AlertIcon className="match-icon" />
                      <div className="match-body">
                        <div className="match-result-empty">
                          맞는 규격을 찾지 못했어요.
                        </div>
                        <div className="match-result-empty-sub">
                          담당자가 맞춤 제작 가능 여부를 함께 안내드리겠습니다.
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="field">
                  <label htmlFor={`price-${s.key}`} className="label">
                    현재 매입 단가{' '}
                    <span className="label-muted">(원/개)</span>
                  </label>
                  <input
                    id={`price-${s.key}`}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="예) 1200"
                    value={s.current_price}
                    onChange={(e) =>
                      updateSet(i, 'current_price', onlyDigits(e.target.value))
                    }
                  />
                </div>

                <div className="field">
                  <label htmlFor={`usage-${s.key}`} className="label">
                    월 사용량 <span className="label-muted">(개, 선택)</span>
                  </label>
                  <input
                    id={`usage-${s.key}`}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="예) 3000"
                    value={s.monthly_usage}
                    onChange={(e) =>
                      updateSet(i, 'monthly_usage', onlyDigits(e.target.value))
                    }
                  />
                </div>
              </div>
            )
          })}

          <button type="button" className="btn-ghost" onClick={addSet}>
            <PlusIcon size={18} />
            규격 추가
          </button>

          <div className="section-title">연락처 남기기</div>

          <div className="info-box">
            <LightbulbIcon className="info-icon" />
            <div>
              현재 사용 중인 단가를 알려주시면 더 나은 조건으로 제안드릴 수
              있어요. 입력하신 정보는 담당자만 확인합니다.
            </div>
          </div>

          <div className="card">
            <div className="field">
              <label htmlFor="phone" className="label">
                전화번호 <span className="label-muted">(필수)</span>
              </label>
              <input
                id="phone"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="01012345678"
                value={phone}
                onChange={(e) => setPhone(onlyDigits(e.target.value))}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="company" className="label">
                회사명 <span className="label-muted">(선택)</span>
              </label>
              <input
                id="company"
                type="text"
                placeholder="회사명"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="total-qty" className="label">
                예상 총 수량 <span className="label-muted">(선택)</span>
              </label>
              <input
                id="total-qty"
                type="text"
                placeholder="예) 월 3000개, 1회성 500개"
                value={totalQuantity}
                onChange={(e) => setTotalQuantity(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="memo" className="label">
                메모/요청사항 <span className="label-muted">(선택)</span>
              </label>
              <textarea
                id="memo"
                placeholder="납기, 재질, 기타 요청사항을 자유롭게 적어주세요."
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
              />
            </div>
          </div>

          <div className="submit-wrap">
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="btn-spinner" aria-hidden="true" />
                  전송 중...
                </>
              ) : (
                '문의 보내기'
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}

export default MatchPage
