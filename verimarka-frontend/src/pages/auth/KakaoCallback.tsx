import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { apiRequest } from "../../lib/api"
import { setTokens } from "../../lib/token"

interface OAuthTokenResponse {
  access: string
  refresh: string
}

export default function KakaoCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    async function login() {
      const params = new URLSearchParams(window.location.search)
      const code = params.get("code")

      const redirect_uri =
        import.meta.env.VITE_KAKAO_REDIRECT_URI ||
        `${window.location.origin}/auth/kakao/callback`

      const data = await apiRequest<OAuthTokenResponse>("/accounts/auth/oauth/kakao/", {
        method: "POST",
        body: { code, redirect_uri },
      })

      setTokens(data.access, data.refresh)

      navigate("/")
      window.location.reload()
    }

    void login().catch(() => {
      navigate("/")
    })
  }, [navigate])

  return <div>Kakao 로그인 처리중...</div>
}
