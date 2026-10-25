import { ToastHost } from "./components/Toast.tsx";
import { AddBookmarkletPage } from "./features/guide/AddBookmarkletPage.tsx";
import { HowtoPage } from "./features/guide/HowtoPage.tsx";
import { PasteGuidePage } from "./features/guide/PasteGuidePage.tsx";
import { HistoryPage } from "./features/history/HistoryPage.tsx";
import { AboutPage } from "./features/menu/AboutPage.tsx";
import { MenuPage } from "./features/menu/MenuPage.tsx";
import { ResultsPage } from "./features/results/ResultsPage.tsx";
import { ScanPage } from "./features/scan/ScanPage.tsx";
import { TopPage } from "./features/top/TopPage.tsx";
import { type Route, useRoute } from "./lib/router.ts";

function Page({ route }: { route: Route }) {
  switch (route.name) {
    case "top":
      return <TopPage />;
    case "scan":
      return <ScanPage />;
    case "history":
      return <HistoryPage />;
    case "addBookmarklet":
      return <AddBookmarkletPage />;
    case "pasteGuide":
      return <PasteGuidePage />;
    case "howto":
      return <HowtoPage />;
    case "menu":
      return <MenuPage />;
    case "about":
      return <AboutPage />;
    case "results":
      return <ResultsPage key={route.readingId} readingId={route.readingId} />;
  }
}

/** アプリ全体。URLのハッシュで画面を切り替える。 */
export function App() {
  const route = useRoute();
  return (
    <>
      <Page route={route} />
      <ToastHost />
    </>
  );
}
