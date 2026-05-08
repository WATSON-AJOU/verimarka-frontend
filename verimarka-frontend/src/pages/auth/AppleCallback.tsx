import { useEffect, useRef } from "react"
import { apiRequest } from "../../lib/api"
import { clearTokens, setTokens } from "../../lib/token"
import {
  buildTabPath,
  POST_LOGOUT_TOAST_KEY,
  SUSPENDED_ACCOUNT_MESSAGE,
} from "../../lib/app-utils"
const APPLE_OAUTH_CODE_KEY = "verimarka:oauth:apple:last-code"
const APPLE_OAUTH_STATE_KEY = "verimarka:oauth:apple:state"

interface OAuthTokenResponse {
  access: string
}

export default function AppleCallback() {
  const hasStartedRef = useRef(false)

  useEffect(() => {
    if (hasStartedRef.current) return
    hasStartedRef.current = true

    async function login() {
      const params = new URLSearchParams(window.location.search)
      const code = params.get("code")
      const state = params.get("state")
      const expectedState = window.sessionStorage.getItem(APPLE_OAUTH_STATE_KEY)

      if (!code) {
        throw new Error("Apple authorization code가 없습니다.")
      }
      if (!state || !expectedState || state !== expectedState) {
        throw new Error("Apple 로그인 state 검증에 실패했습니다.")
      }

      const lastHandledCode = window.sessionStorage.getItem(APPLE_OAUTH_CODE_KEY)
      if (lastHandledCode === code) {
        return
      }
      window.sessionStorage.setItem(APPLE_OAUTH_CODE_KEY, code)
      window.sessionStorage.removeItem(APPLE_OAUTH_STATE_KEY)

      const redirect_uri =
        import.meta.env.VITE_APPLE_REDIRECT_URI ||
        `${window.location.origin}/auth/apple/callback`

      const data = await apiRequest<OAuthTokenResponse>("/accounts/auth/oauth/apple/", {
        method: "POST",
        body: { code, redirect_uri },
      })

      setTokens(data.access)
      window.location.replace(buildTabPath("home"))
    }

    login().catch((error) => {
      const message =
        error instanceof Error ? error.message : "Apple 로그인에 실패했습니다."
      if (
        message.includes("사용 정지된 계정입니다.") ||
        message.includes(SUSPENDED_ACCOUNT_MESSAGE)
      ) {
        clearTokens()
        window.sessionStorage.setItem(POST_LOGOUT_TOAST_KEY, SUSPENDED_ACCOUNT_MESSAGE)
        window.location.replace(buildTabPath("home"))
        return
      }
      window.alert(message)
      window.location.replace(buildTabPath("home"))
    })
  }, [])

  return <div>Apple 로그인 처리중...</div>
}
