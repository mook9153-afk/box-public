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

const ICEPACK_SPEC_FALLBACK = ['15x20', '16x23']

function makeEmptyBoxSet() {
  return {
    key: crypto.randomUUID(),
    inner_width: '',
    inner_depth: '',
    inner_height: '',
    current_price: '',
    monthly_usage: '',
  }
}

function makeEmptyIcepackSet() {
  return {
    key: crypto.randomUUID(),
    frozen: '',
    kind: '',
    spec: '',
    current_price: '',
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
  const [icepackSpecs, setIcepackSpecs] = useState(ICEPACK_SPEC_FALLBACK)

  const [wantBox, setWantBox] = useState(false)
  const [wantIcepack, setWantIcepack] = useState(false)
  const [wantDryice, setWantDryice] = useState(false)

  const [boxSets, setBoxSets] = useState([makeEmptyBoxSet()])
  const [icepackSets, setIcepackSets] = useState([makeEmptyIcepackSet()])

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

  useEffect(() => {
    let cancelled = false
    async function loadIcepackSpecs() {
      const { data, error } = await supabase
        .from('icepacks')
        .select('spec')
        .eq('is_active', true)
      if (cancelled) return
      if (error) {
        console.error('icepacks 조회 실패:', error)
        return
      }
      const specs = Array.from(
        new Set((data ?? []).map((r) => r.spec).filter(Boolean)),
      )
      if (specs.length > 0) setIcepackSpecs(specs)
    }
    loadIcepackSpecs()
    return () => {
      cancelled = true
    }
  }, [])

  const matches = useMemo(() => {
    return boxSets.map((s) => {
      const w = Number(s.inner_width)
      const d = Number(s.inner_depth)
      const h = Number(s.inner_height)
      if (!w || !d || !h) return { status: 'pending', product: null }
      const product = findMatch(products, w, d, h)
      return product
        ? { status: 'found', product }
        : { status: 'none', product: null }
    })
  }, [boxSets, products])

  const hasContactInput = phone.trim().length > 0

  function updateBoxSet(index, field, value) {
    setBoxSets((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  function addBoxSet() {
    setBoxSets((prev) => [...prev, makeEmptyBoxSet()])
  }

  function removeBoxSet(index) {
    setBoxSets((prev) => prev.filter((_, i) => i !== index))
  }

  function updateIcepackSet(index, field, value) {
    setIcepackSets((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  function addIcepackSet() {
    setIcepackSets((prev) => [...prev, makeEmptyIcepackSet()])
  }

  function removeIcepackSet(index) {
    setIcepackSets((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (submitting) return

    if (!wantBox && !wantIcepack && !wantDryice) {
      alert('견적을 원하시는 제품을 하나 이상 선택해주세요')
      return
    }

    const completeBoxSets = wantBox
      ? boxSets.filter(
          (s) => s.inner_width && s.inner_depth && s.inner_height,
        )
      : []

    if (wantBox && completeBoxSets.length === 0) {
      alert('박스 규격을 최소 1개 입력해주세요')
      return
    }

    if (wantIcepack) {
      const hasIncomplete = icepackSets.some(
        (s) => !s.frozen || !s.kind || !s.spec,
      )
      if (hasIncomplete) {
        alert('아이스팩: 동결 여부, 종류, 규격을 선택해주세요')
        return
      }
    }

    if (!phone.trim()) {
      alert('전화번호를 입력해주세요')
      return
    }

    setSubmitting(true)
    try {
      const items = []

      if (wantBox) {
        for (const s of boxSets) {
          const w = Number(s.inner_width)
          const d = Number(s.inner_depth)
          const h = Number(s.inner_height)
          if (!w || !d || !h) continue
          const matched = findMatch(products, w, d, h)
          items.push({
            item_type: 'box',
            inner_width: w,
            inner_depth: d,
            inner_height: h,
            matched_product_id: matched?.id ?? null,
            matched_product_name: matched?.name ?? null,
            current_price: s.current_price ? Number(s.current_price) : null,
            monthly_usage: s.monthly_usage ? Number(s.monthly_usage) : null,
          })
        }
      }

      if (wantIcepack) {
        for (const s of icepackSets) {
          items.push({
            item_type: 'icepack',
            icepack_frozen: s.frozen === 'frozen',
            icepack_kind: s.kind,
            icepack_spec: s.spec,
            current_price: s.current_price ? Number(s.current_price) : null,
          })
        }
      }

      if (wantDryice) {
        items.push({ item_type: 'dryice' })
      }

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
            <span>제품 선택</span>
          </div>
          <span className="progress-sep">→</span>
          <div
            className={`progress-step ${hasContactInput ? 'is-active' : ''}`}
          >
            <span className="progress-step-num">2</span>
            <span>연락처 입력</span>
          </div>
        </div>

        <h1 className="page-headline">견적 요청</h1>
        <p className="page-sub">
          원하시는 제품을 선택하고 조건을 입력해주세요. 담당자가 확인 후 맞춤
          견적으로 연락드립니다.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="card product-picker">
            <div className="product-picker-title">
              견적을 원하는 제품을 선택해주세요
            </div>
            <div className="product-picker-list">
              <label
                className={`product-check ${wantBox ? 'is-on' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={wantBox}
                  onChange={(e) => setWantBox(e.target.checked)}
                />
                <span className="product-check-emoji" aria-hidden="true">
                  📦
                </span>
                <span className="product-check-label">박스</span>
              </label>
              <label
                className={`product-check ${wantIcepack ? 'is-on' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={wantIcepack}
                  onChange={(e) => setWantIcepack(e.target.checked)}
                />
                <span className="product-check-emoji" aria-hidden="true">
                  🧊
                </span>
                <span className="product-check-label">아이스팩</span>
              </label>
              <label
                className={`product-check ${wantDryice ? 'is-on' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={wantDryice}
                  onChange={(e) => setWantDryice(e.target.checked)}
                />
                <span className="product-check-emoji" aria-hidden="true">
                  ❄️
                </span>
                <span className="product-check-label">드라이아이스</span>
              </label>
            </div>
          </div>

          {wantBox && (
            <>
              <div className="section-title">
                <span aria-hidden="true">📦</span> 박스 규격 매칭
              </div>

              {boxSets.map((s, i) => {
                const match = matches[i]
                return (
                  <div key={s.key} className="card spec-card">
                    <div className="card-header">
                      <div className="badge">규격 {i + 1}</div>
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => removeBoxSet(i)}
                        disabled={boxSets.length === 1}
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
                              updateBoxSet(
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
                              updateBoxSet(
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
                              updateBoxSet(
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
                              {match.product.inner_d} × {match.product.inner_h}{' '}
                              mm
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
                              담당자가 맞춤 제작 가능 여부를 함께
                              안내드리겠습니다.
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
                          updateBoxSet(
                            i,
                            'current_price',
                            onlyDigits(e.target.value),
                          )
                        }
                      />
                    </div>

                    <div className="field">
                      <label htmlFor={`usage-${s.key}`} className="label">
                        월 사용량{' '}
                        <span className="label-muted">(개, 선택)</span>
                      </label>
                      <input
                        id={`usage-${s.key}`}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="예) 3000"
                        value={s.monthly_usage}
                        onChange={(e) =>
                          updateBoxSet(
                            i,
                            'monthly_usage',
                            onlyDigits(e.target.value),
                          )
                        }
                      />
                    </div>
                  </div>
                )
              })}

              <button type="button" className="btn-ghost" onClick={addBoxSet}>
                <PlusIcon size={18} />
                규격 추가
              </button>
            </>
          )}

          {wantIcepack && (
            <>
              <div className="section-title">
                <span aria-hidden="true">🧊</span> 아이스팩
              </div>

              {icepackSets.map((s, i) => (
                <div key={s.key} className="card spec-card">
                  <div className="card-header">
                    <div className="badge">아이스팩 {i + 1}</div>
                    {icepackSets.length > 1 && (
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => removeIcepackSet(i)}
                        aria-label={`아이스팩 ${i + 1} 삭제`}
                      >
                        <CloseIcon size={14} />
                      </button>
                    )}
                  </div>

                  <div className="field">
                    <span className="label">동결 여부</span>
                    <div className="radio-row">
                      <label
                        className={`radio-pill ${
                          s.frozen === 'frozen' ? 'is-on' : ''
                        }`}
                      >
                        <input
                          type="radio"
                          name={`frozen-${s.key}`}
                          value="frozen"
                          checked={s.frozen === 'frozen'}
                          onChange={() =>
                            updateIcepackSet(i, 'frozen', 'frozen')
                          }
                        />
                        <span>동결</span>
                      </label>
                      <label
                        className={`radio-pill ${
                          s.frozen === 'nonfrozen' ? 'is-on' : ''
                        }`}
                      >
                        <input
                          type="radio"
                          name={`frozen-${s.key}`}
                          value="nonfrozen"
                          checked={s.frozen === 'nonfrozen'}
                          onChange={() =>
                            updateIcepackSet(i, 'frozen', 'nonfrozen')
                          }
                        />
                        <span>비동결</span>
                      </label>
                    </div>
                  </div>

                  <div className="field">
                    <span className="label">종류</span>
                    <div className="radio-row">
                      <label
                        className={`radio-pill ${
                          s.kind === 'water' ? 'is-on' : ''
                        }`}
                      >
                        <input
                          type="radio"
                          name={`kind-${s.key}`}
                          value="water"
                          checked={s.kind === 'water'}
                          onChange={() =>
                            updateIcepackSet(i, 'kind', 'water')
                          }
                        />
                        <span>워터</span>
                      </label>
                      <label
                        className={`radio-pill ${
                          s.kind === 'gel' ? 'is-on' : ''
                        }`}
                      >
                        <input
                          type="radio"
                          name={`kind-${s.key}`}
                          value="gel"
                          checked={s.kind === 'gel'}
                          onChange={() => updateIcepackSet(i, 'kind', 'gel')}
                        />
                        <span>젤</span>
                      </label>
                      <label
                        className={`radio-pill ${
                          s.kind === 'pcm' ? 'is-on' : ''
                        }`}
                      >
                        <input
                          type="radio"
                          name={`kind-${s.key}`}
                          value="pcm"
                          checked={s.kind === 'pcm'}
                          onChange={() => updateIcepackSet(i, 'kind', 'pcm')}
                        />
                        <span>PCM</span>
                      </label>
                    </div>
                  </div>

                  <div className="field">
                    <label htmlFor={`spec-${s.key}`} className="label">
                      규격
                    </label>
                    <select
                      id={`spec-${s.key}`}
                      value={s.spec}
                      onChange={(e) =>
                        updateIcepackSet(i, 'spec', e.target.value)
                      }
                    >
                      <option value="">규격 선택</option>
                      {icepackSpecs.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label htmlFor={`ice-price-${s.key}`} className="label">
                      현재 매입 단가{' '}
                      <span className="label-muted">(원/개, 선택)</span>
                    </label>
                    <input
                      id={`ice-price-${s.key}`}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="예) 500"
                      value={s.current_price}
                      onChange={(e) =>
                        updateIcepackSet(
                          i,
                          'current_price',
                          onlyDigits(e.target.value),
                        )
                      }
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                className="btn-ghost"
                onClick={addIcepackSet}
              >
                <PlusIcon size={18} />
                아이스팩 추가
              </button>
            </>
          )}

          {wantDryice && (
            <>
              <div className="section-title">
                <span aria-hidden="true">❄️</span> 드라이아이스
              </div>
              <div className="card dryice-card">
                <div className="info-box">
                  <LightbulbIcon className="info-icon" />
                  <div>
                    드라이아이스 견적도 함께 받으시겠습니다. 상세
                    조건(수량/포장)은 담당자가 직접 연락드려 확인합니다.
                  </div>
                </div>
              </div>
            </>
          )}

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
