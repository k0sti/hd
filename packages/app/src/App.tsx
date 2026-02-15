import { useState } from 'react';
import { useInit } from './hooks/useInit';
import { useNostr } from './hooks/useNostr';
import { useAppState, AppStateProvider } from './hooks/useAppState';
import { generateInsightReport } from './hd';
import { Header } from './components/Header';
import { BodygraphView } from './components/BodygraphView';
import { Sidebar } from './components/Sidebar';
import { LoginDialog } from './components/LoginDialog';
import { ProfileDialog } from './components/ProfileDialog';
import { PaymentDialog } from './components/PaymentDialog';
import { InsightDialog } from './components/InsightDialog';

function AppContent() {
  const { loggedIn } = useNostr();
  const { state } = useAppState();

  const [loginOpen, setLoginOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [insightOpen, setInsightOpen] = useState(false);
  const [reportText, setReportText] = useState<string | null>(null);

  const handleProfileClick = () => {
    if (loggedIn) {
      setProfileOpen(true);
    } else {
      setLoginOpen(true);
    }
  };

  const handleInsightClick = () => {
    setPaymentOpen(true);
  };

  const handlePaid = () => {
    const personA = state.selectedPersonA ? state.personCharts.get(state.selectedPersonA) : null;
    if (personA) {
      const report = generateInsightReport(
        personA.person.name,
        personA.chart,
        personA.analysis,
        state.transitActivations,
      );
      setReportText(report.fullText);
      setInsightOpen(true);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <Header onProfileClick={handleProfileClick} />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 flex items-center justify-center overflow-hidden p-4" style={{ backgroundColor: '#C1C0BF' }}>
          <BodygraphView />
        </main>
        <Sidebar onInsightClick={handleInsightClick} />
      </div>
      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
      <PaymentDialog open={paymentOpen} onOpenChange={setPaymentOpen} onPaid={handlePaid} />
      <InsightDialog open={insightOpen} onOpenChange={setInsightOpen} reportText={reportText} />
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-gray-400">Loading ephemeris...</p>
    </div>
  );
}

function ErrorScreen({ error }: { error: string }) {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <p className="text-red-500 font-medium">Failed to initialize</p>
        <p className="text-gray-400 text-sm mt-2">{error}</p>
      </div>
    </div>
  );
}

export default function App() {
  const { ready, error } = useInit();

  if (error) return <ErrorScreen error={error} />;
  if (!ready) return <LoadingScreen />;

  return (
    <AppStateProvider>
      <AppContent />
    </AppStateProvider>
  );
}
