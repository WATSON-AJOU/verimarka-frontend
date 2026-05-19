import { Component, type ErrorInfo, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import ErrorPage from "../../pages/ErrorPage";
import { appLogger } from "../../lib/logger";

type AppErrorBoundaryProps = {
  children: ReactNode;
  resetKey: string;
};

type AppErrorBoundaryState = {
  error: Error | null;
};

class AppErrorBoundaryInner extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    appLogger.error("frontend.error_boundary", {
      error,
      componentStack: info.componentStack,
    });
  }

  componentDidUpdate(prevProps: AppErrorBoundaryProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <ErrorPage
          statusCode={500}
          title="일시적인 문제가 발생했습니다."
          description="작성 중이던 내용은 가능하면 그대로 두고, 화면만 다시 불러올 수 있게 준비했습니다."
          supportText="문제가 반복되면 문의 메일로 현재 화면과 발생 시점을 알려주세요."
          showReload
        />
      );
    }

    return this.props.children;
  }
}

export default function AppErrorBoundary({ children }: { children: ReactNode }) {
  const location = useLocation();
  return <AppErrorBoundaryInner resetKey={location.key}>{children}</AppErrorBoundaryInner>;
}
