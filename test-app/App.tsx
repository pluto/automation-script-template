import { useEffect, useRef, useState } from "react";
import { Frame, useCdpUrl } from "@plutoxyz/react-frame";
import { useLogs } from "@plutoxyz/react-frame";
import LogsPanel from "./components/LogsPanel";
import Chat from "./components/Chat";

// Declare the global variable from vite config
declare const __SCRIPT_NAME__: string;

function App() {
  const logs = useLogs();
  const cdpUrl = useCdpUrl();
  const [scriptSource, setScriptSource] = useState<string>("");

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

  return (
    <div className="flex h-screen w-screen">
      <div className="flex-2/3 flex gap-4 flex-col justify-center items-center p-4">
        <div className="flex flex-row h-[1300px] w-full shadow-2xl rounded-lg overflow-hidden">
          <div className="flex justify-center items-center p-6 h-full overflow-auto">
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

          <LogsPanel logs={logs} />
        </div>
        <div className="w-full flex justify-center items-center h-full overflow-auto">
          {cdpUrl && (
            <iframe
              src={devToolsUrl}
              className="w-full h-full border-0"
              title="Chrome DevTools"
            />
          )}
        </div>
      </div>
      <div className="flex-1/3">
        <Chat />
      </div>
    </div>
  );
}

export default App;
