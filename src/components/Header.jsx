import { Link } from 'react-router-dom'

function Header() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link to="/" className="logo-link" aria-label="iceasy 홈">
          <span className="logo-text">iceasy</span>
        </Link>
      </div>
    </header>
  )
}

export default Header
