import { useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { apiRequest } from "../../lib/api"
import { setTokens } from "../../lib/token"

interface OAuthTokenResponse {
  access: string
  refresh: string
  user?: {
    id: number
    username: string
    nickname: string
    display_name: string
    email: string
    phone: string | null
    phone_verified: boolean
    auth_provider: string
    is_profile_completed: boolean
    providers: string[]
  }
  created?: boolean
}

export default function GoogleCallback() {
  const navigate = useNavigate()
  const hasStartedRef = useRef(false)

  useEffect(() => {
    if (hasStartedRef.current) return
    hasStartedRef.current = true

    async function login() {
      const params = new URLSearchParams(window.location.search)
      const code = params.get("code")
      if (!code) {
        throw new Error("Google authorization code가 없습니다.")
      }

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
  }, [navigate])

  return <div>Google 로그인 처리중...</div>
}
