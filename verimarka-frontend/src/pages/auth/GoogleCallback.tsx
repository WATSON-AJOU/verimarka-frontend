import { useEffect, useRef } from "react"
import { apiRequest } from "../../lib/api"
import { setTokens } from "../../lib/token"

interface OAuthLoginResponse {
  access: string
  refresh: string
  user?: {
    id: number
    username: string
    nickname: string
    display_name: string
    email: string
    email_verified: boolean
    phone: string | null
    phone_verified: boolean
    auth_provider: string
    is_profile_completed: boolean
    providers: string[]
  }
  created?: boolean
}

export default function GoogleCallback() {
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

      const redirect_uri = `${window.location.origin}/auth/google/callback`

      const data = await apiRequest<OAuthLoginResponse>("/accounts/auth/oauth/google/", {
        method: "POST",
        body: { code, redirect_uri },
      })

      setTokens(data.access, data.refresh)
      window.location.replace("/")
    }

    login()
  }, [])

  return <div>Google 로그인 처리중...</div>
}
