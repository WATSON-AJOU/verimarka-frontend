import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { apiRequest } from "../../lib/api"
import { setTokens } from "../../lib/token"

interface OAuthTokenResponse {
  access: string
  refresh: string
}

export default function GoogleCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    async function login() {
      const params = new URLSearchParams(window.location.search)
      const code = params.get("code")

      const redirect_uri =
        "http://localhost:5173/auth/google/callback"

      const data = await apiRequest<OAuthTokenResponse>("/accounts/auth/oauth/google/", {
        method: "POST",
        body: { code, redirect_uri },
      })

      setTokens(data.access, data.refresh)

      navigate("/")
      window.location.reload()
    }

    login()
  }, [])

  return <div>Google 로그인 처리중...</div>
}
