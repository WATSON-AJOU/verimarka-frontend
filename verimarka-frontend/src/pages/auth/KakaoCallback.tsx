import { useEffect, useRef } from "react"
import { apiRequest } from "../../lib/api"
import { clearTokens, setTokens } from "../../lib/token"

const POST_LOGOUT_TOAST_KEY = "verimarka:post-logout-toast"
const SUSPENDED_ACCOUNT_MESSAGE = "정지된 계정입니다."
const KAKAO_OAUTH_CODE_KEY = "verimarka:oauth:kakao:last-code"

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

export default function KakaoCallback() {
  const hasStartedRef = useRef(false)

  useEffect(() => {
    if (hasStartedRef.current) return
    hasStartedRef.current = true

    async function login() {
      const params = new URLSearchParams(window.location.search)
      const code = params.get("code")
      if (!code) {
        throw new Error("Kakao authorization code가 없습니다.")
      }
      const lastHandledCode = window.sessionStorage.getItem(KAKAO_OAUTH_CODE_KEY)
      if (lastHandledCode === code) {
        return
      }
      window.sessionStorage.setItem(KAKAO_OAUTH_CODE_KEY, code)

      const redirect_uri = `${window.location.origin}/auth/kakao/callback`

      const data: OAuthLoginResponse = await apiRequest("/accounts/auth/oauth/kakao/", {
        method: "POST",
        body: { code, redirect_uri },
      })

      setTokens(data.access, data.refresh)
      window.location.replace("/")
    }

    login().catch((error) => {
      const message =
        error instanceof Error ? error.message : "Kakao 로그인에 실패했습니다."
      if (
        message.includes("사용 정지된 계정입니다.") ||
        message.includes(SUSPENDED_ACCOUNT_MESSAGE)
      ) {
        clearTokens()
        window.sessionStorage.setItem(POST_LOGOUT_TOAST_KEY, SUSPENDED_ACCOUNT_MESSAGE)
        window.location.replace("/")
        return
      }
      window.alert(message)
      window.location.replace("/")
    })
  }, [])

  return <div>Kakao 로그인 처리중...</div>
}
