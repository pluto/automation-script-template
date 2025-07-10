import { useEffect, useRef, useState } from "react";
import { Frame, useCdpUrl } from "@plutoxyz/react-frame";
import { useLogs } from "@plutoxyz/react-frame";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import LogsPanel from "./components/LogsPanel";
import Chat from "./components/Chat";

// Declare the global variable from vite config
declare const __SCRIPT_NAME__: string;

function App() {
  const logs = useLogs();
  const cdpUrl = useCdpUrl();
  const [scriptSource, setScriptSource] = useState<string>("");
  const [topPanelSize, setTopPanelSize] = useState<number>(40);

  // Calculate top panel size based on min(550px, 40% window height)
  useEffect(() => {
    const calculateTopPanelSize = () => {
      const windowHeight = window.innerHeight;
      const pixelPercentage = (700 / windowHeight) * 100;
      console.log(pixelPercentage);
      const calculatedSize = Math.max(pixelPercentage, 80);
      setTopPanelSize(calculatedSize);
    };

    // Calculate on mount
    calculateTopPanelSize();

    // Recalculate on window resize
    window.addEventListener("resize", calculateTopPanelSize);
    return () => window.removeEventListener("resize", calculateTopPanelSize);
  }, []);

  useEffect(() => {
    const scriptName = __SCRIPT_NAME__;

    const loadScript = async () => {
      try {
        const script = await import(
          `../scripts/${scriptName}/dist/main.js?raw`
        );
        setScriptSource(script.default);
      } catch (error) {
        console.error(`Failed to load script ${scriptName}:`, error);
        setScriptSource("// Error loading script");
      }
    };

    loadScript();
  }, []);

  // Detect when cdpUrl changes
  const prevCdpUrl = useRef<string | null>(null);
  useEffect(() => {
    if (prevCdpUrl.current !== undefined && prevCdpUrl.current !== cdpUrl) {
      console.log("cdpUrl changed:", prevCdpUrl.current, "→", cdpUrl);
      // You can trigger any side effect here
    }
    prevCdpUrl.current = cdpUrl ?? null;
  }, [cdpUrl]);

  const devToolsUrl = cdpUrl
    ? (() => {
        const isWss = cdpUrl.trim().startsWith("wss://");
        const cleanUrl = cdpUrl
          .replace("wss://", "")
          .replace("ws://", "")
          .trim();
        return `https://browser-inspector.pluto.xyz/inspector.html?${
          isWss ? "wss" : "ws"
        }=${encodeURIComponent(cleanUrl)}`;
      })()
    : "";

  // Show loading state if script hasn't loaded yet
  if (!scriptSource) {
    return (
      <div className="h-screen w-screen flex justify-center items-center">
        Loading script...
      </div>
    );
  }

  console.log(topPanelSize);

  return (
    <div className="h-screen w-screen">
      <PanelGroup direction="horizontal">
        <Panel defaultSize={80} minSize={30}>
          <div className="h-full">
            <PanelGroup direction="vertical">
              <Panel defaultSize={topPanelSize} minSize={30}>
                <div className="flex flex-row h-full w-full shadow-2xl rounded-lg overflow-hidden">
                  <div className="flex min-w-[400px] justify-center items-center h-full overflow-auto">
                    <Frame
                      brand={{
                        name: "Pluto",
                        logo: "https://storage.googleapis.com/pluto-brand-assets/assets/logo-black-with-radius.svg",
                      }}
                      script={scriptSource} // Pass the imported string here
                      onProof={(proof) => {
                        console.log(proof);
                      }}
                      onError={(error) => {
                        console.error(error);
                      }}
                    />
                  </div>

                  <div className="w-full h-full overflow-auto">
                    {cdpUrl && (
                      <iframe
                        src={devToolsUrl}
                        className="w-full h-full border-0"
                        title="Chrome DevTools"
                      />
                    )}
                  </div>
                </div>
              </Panel>

              <PanelResizeHandle className="h-2 bg-gray-200 hover:bg-gray-300 transition-colors cursor-row-resize" />

              <Panel defaultSize={100 - topPanelSize} minSize={10}>
                <LogsPanel logs={logs} />
              </Panel>
            </PanelGroup>
          </div>
        </Panel>

        <PanelResizeHandle className="w-2 bg-gray-200 hover:bg-gray-300 transition-colors cursor-col-resize" />

        <Panel defaultSize={20} minSize={20}>
          <Chat />
        </Panel>
      </PanelGroup>
    </div>
  );
}

export default App;
