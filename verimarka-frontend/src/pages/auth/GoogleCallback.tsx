import { useEffect, useRef, useState } from "react"
import OAuthCallbackStatus from "../../components/auth/OAuthCallbackStatus"
import { apiRequest } from "../../lib/api"
import { clearTokens, setTokens } from "../../lib/token"
import {
  buildTabPath,
  POST_LOGOUT_TOAST_KEY,
  SUSPENDED_ACCOUNT_MESSAGE,
} from "../../lib/app-utils"

const GOOGLE_OAUTH_CODE_KEY = "verimarka:oauth:google:last-code"
const GOOGLE_OAUTH_PENDING_CODE_KEY = "verimarka:oauth:google:pending-code"
const GOOGLE_OAUTH_STATE_KEY = "verimarka:oauth:google:state"

interface OAuthTokenResponse {
  access: string
}

export default function GoogleCallback() {
  const hasStartedRef = useRef(false)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    if (hasStartedRef.current) return
    hasStartedRef.current = true

    async function login() {
      const params = new URLSearchParams(window.location.search)
      const code = params.get("code")
      const state = params.get("state")
      const expectedState = window.sessionStorage.getItem(GOOGLE_OAUTH_STATE_KEY)

      if (!code) {
        throw new Error("Google authorization code가 없습니다.")
      }
      if (!state || !expectedState || state !== expectedState) {
        throw new Error("Google 로그인 state 검증에 실패했습니다.")
      }
      window.sessionStorage.removeItem(GOOGLE_OAUTH_STATE_KEY)

      const lastHandledCode = window.sessionStorage.getItem(GOOGLE_OAUTH_CODE_KEY)
      if (lastHandledCode === code) {
        window.location.replace(buildTabPath("home"))
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

      setTokens(data.access)
      window.sessionStorage.setItem(GOOGLE_OAUTH_CODE_KEY, code)
      window.sessionStorage.removeItem(GOOGLE_OAUTH_PENDING_CODE_KEY)
      window.location.replace(buildTabPath("home"))
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
        window.location.replace(buildTabPath("home"))
        return
      }
      setErrorMessage(message)
    })
  }, [])

  return <OAuthCallbackStatus provider="Google" errorMessage={errorMessage} />
}
