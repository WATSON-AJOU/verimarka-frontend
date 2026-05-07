import { useEffect, useRef } from "react"
import { apiRequest } from "../../lib/api"
import { clearTokens, setTokens } from "../../lib/token"
import {
  POST_LOGOUT_TOAST_KEY,
  SUSPENDED_ACCOUNT_MESSAGE,
} from "../../lib/app-utils"

const GOOGLE_OAUTH_CODE_KEY = "verimarka:oauth:google:last-code"
const GOOGLE_OAUTH_PENDING_CODE_KEY = "verimarka:oauth:google:pending-code"

interface OAuthTokenResponse {
  access: string
  refresh: string
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

      const lastHandledCode = window.sessionStorage.getItem(GOOGLE_OAUTH_CODE_KEY)
      if (lastHandledCode === code) {
        window.location.replace("/")
        return
      }

      const pendingCode = window.sessionStorage.getItem(GOOGLE_OAUTH_PENDING_CODE_KEY)
      if (pendingCode === code) {
        return
      }
      window.sessionStorage.setItem(GOOGLE_OAUTH_PENDING_CODE_KEY, code)

      const redirect_uri =
        import.meta.env.VITE_GOOGLE_REDIRECT_URI ||
        `${window.location.origin}/auth/google/callback`

      const data = await apiRequest<OAuthTokenResponse>("/accounts/auth/oauth/google/", {
        method: "POST",
        body: { code, redirect_uri },
      })

      setTokens(data.access, data.refresh)
      window.sessionStorage.setItem(GOOGLE_OAUTH_CODE_KEY, code)
      window.sessionStorage.removeItem(GOOGLE_OAUTH_PENDING_CODE_KEY)
      window.location.replace("/")
    }

    login().catch((error) => {
      window.sessionStorage.removeItem(GOOGLE_OAUTH_PENDING_CODE_KEY)
      const message =
        error instanceof Error ? error.message : "Google 로그인에 실패했습니다."
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

  return <div>Google 로그인 처리중...</div>
}
