import AppMain from "./components/app/AppMain";
import AppModals from "./components/app/AppModals";
import { useAppController } from "./hooks/useAppController";

export default function App() {
  const controller = useAppController();

  return (
    <>
      <AppMain controller={controller} />
      <AppModals controller={controller} />
    </>
  );
}
