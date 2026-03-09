import { useMemo, useState } from "react";
import "./App.css";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import EmailLoginModal from "./components/auth/EmailLoginModal";
import LoginChoiceModal from "./components/auth/LoginChoiceModal";
import LoginSuccessToast from "./components/auth/LoginSuccessToast";
import SignupModal from "./components/auth/SignupModal";
import { useAuth } from "./hooks/useAuth";
import grapeImage from "./assets/verimarka.png";

type ModalType = "none" | "loginChoice" | "emailLogin" | "signup";

function App() {
  const { user, loading, isLoggedIn, login, signup, logout } = useAuth();
  const [modal, setModal] = useState<ModalType>("none");
  const [showToast, setShowToast] = useState(false);

  const displayName = useMemo(() => {
    if (!user) return "";

    const username = user.username?.trim();
    if (username) return username;

    const emailPrefix = user.email?.split("@")[0]?.trim() || "";
    if (emailPrefix) return emailPrefix.slice(0, 10);

    return "회원";
  }, [user]);

  async function handleLogin(email: string, password: string) {
    await login(email, password);
    setModal("none");
    setShowToast(true);
  }

  async function handleSignup(email: string, username: string, password: string) {
    await signup(email, username, password);
    setModal("none");
    setShowToast(true);
  }

  return (
    <div className="appShell">
      <Header
        isLoggedIn={isLoggedIn}
        loading={loading}
        displayName={displayName}
        onOpenLogin={() => setModal("loginChoice")}
        onLogout={logout}
      />

      <main className="mainContent">
        <section className="hero">
          <div className="heroText">
            <p className="heroEyebrow">저작물 등록, 저작물 검증</p>
            <h1>디지털 자산의 진위를 증명하세요.</h1>
            <p className="heroDescription">
              AI 유사도 분석과 블록체인 기반 신뢰 기록을 결합한 검증 시스템으로,
              창작물의 출처와 신뢰도를 빠르게 확인합니다.
            </p>

            <div className="heroButtons">
              <button className="primaryHeroButton">저작물 등록하기</button>
              <button className="secondaryHeroButton">저작물 검증하기</button>
            </div>
          </div>

          <div className="heroArt">
            <div className="heroImageCard">
              <img src={grapeImage} alt="VeriMarka grape" className="heroImage" />
            </div>
          </div>
        </section>

        <section className="contentSection">
          <div className="recentActivity">
            <h2>최근 활동</h2>

            <div className="activityGrid">
              <div className="activityCard">
                <span className="badge badge--allow">ALLOW</span>
                <div className="thumb thumb--allow" />
                <strong>일러스트_final.jpg</strong>
                <p>신규 등록 승인 완료 · 저작물 등록됨</p>
              </div>

              <div className="activityCard">
                <span className="badge badge--review">REVIEW</span>
                <div className="thumb thumb--review" />
                <strong>캐릭터_A.png</strong>
                <p>투표 진행 중 · D-2</p>
                <div className="progressTrack">
                  <div className="progressFill" />
                </div>
              </div>

              <div className="activityCard">
                <span className="badge badge--block">BLOCK</span>
                <div className="thumb thumb--block" />
                <strong>배경이미지_B.png</strong>
                <p>유사도 98%로 등록 차단됨</p>
              </div>
            </div>
          </div>

          <aside className="systemPanel">
            <h2>VeriMarka 신뢰 시스템</h2>

            <div className="systemItem">
              <div className="systemIcon">AI</div>
              <div>
                <strong>AI 의미 기반 유사도 분석</strong>
                <p>문맥 기반 특징 추출로 의미 유사도 측정</p>
              </div>
            </div>

            <div className="systemItem">
              <div className="systemIcon">PX</div>
              <div>
                <strong>픽셀 수준 정밀 비교</strong>
                <p>픽셀 단위 변형 감지로 위조 탐지 강화</p>
              </div>
            </div>

            <div className="systemItem">
              <div className="systemIcon">BC</div>
              <div>
                <strong>블록체인 기반 신뢰 기록</strong>
                <p>검증 이력의 불변성 보장 및 추적 가능</p>
              </div>
            </div>
          </aside>
        </section>
      </main>

      <Footer />

      <LoginChoiceModal
        open={modal === "loginChoice"}
        onClose={() => setModal("none")}
        onEmailLogin={() => setModal("emailLogin")}
        onSignup={() => setModal("signup")}
      />

      <EmailLoginModal
        open={modal === "emailLogin"}
        onClose={() => setModal("none")}
        onSubmit={handleLogin}
        onSignup={() => setModal("signup")}
      />

      <SignupModal
        open={modal === "signup"}
        onClose={() => setModal("none")}
        onSubmit={handleSignup}
        onLogin={() => setModal("emailLogin")}
      />

      <LoginSuccessToast open={showToast} onClose={() => setShowToast(false)} />
    </div>
  );
}

export default App;