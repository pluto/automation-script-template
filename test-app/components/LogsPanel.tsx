import React, { useState, useEffect, useRef, useMemo } from "react";

type LogEntry = string | { message: string; [key: string]: any };

interface LogsPanelProps {
  logs: LogEntry[];
}

const PREBUILT_FILTERS = {
  noFilter: "",
  onlyPlaywright: "^pw:api.*",
  noPlaywrightAndOthers:
    "^(?!pw:api)(?!prompts response received)(?!cdp response received)(?!Waiting for prompts response).*",
};

const DEBUGGER_PREBUILT_FILTERS = {
  noPlaywright: "^(?!pw:api).*",
  promptsResponse: "^(?!prompts response received).*",
  cdpResponse: "^(?!cdp response received).*",
  waitingForResponse: "^(?!Waiting for prompts response).*",
  onlyPlaywright: "^pw:api.*",
};

const filtersToCombine = Object.keys(DEBUGGER_PREBUILT_FILTERS).filter(
  (key) => key !== "onlyPlaywright" && key !== "noPlaywright",
) as Array<keyof typeof DEBUGGER_PREBUILT_FILTERS>;

const lookaheads = filtersToCombine
  .map((key) => {
    const filterRegex = DEBUGGER_PREBUILT_FILTERS[key];
    const match = filterRegex.match(/\^\(\?!([^)]+)\)\.\*/);
    return match ? `(?!${match[1]})` : "";
  })
  .join("");
const combinedNoPlaywrightAndOthersFilter = `^${lookaheads}(?!pw:api).*`;

const SELECT_PREBUILT_FILTERS = {
  noFilter: { label: "All Logs", regex: "" },
  onlyPlaywright: {
    label: "Automation Logs",
    regex: DEBUGGER_PREBUILT_FILTERS.onlyPlaywright,
  },
  noPlaywright: {
    label: "Browser Logs",
    regex: combinedNoPlaywrightAndOthersFilter,
  },
};

type PrebuiltFilterKey = keyof typeof SELECT_PREBUILT_FILTERS;

const LogsPanel: React.FC<LogsPanelProps> = ({ logs }) => {
  const [filter, setFilter] = useState(
    localStorage.getItem("pluto-custom-filter") || "",
  );
  const [selectedPrebuiltFilter, setSelectedPrebuiltFilter] =
    useState<PrebuiltFilterKey>(
      (localStorage.getItem(
        "pluto-selected-prebuilt-filter",
      ) as PrebuiltFilterKey) || "noFilter",
    );
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  const scrollableContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (localStorage.getItem("pluto-selected-prebuilt-filter")) {
      const storedSelection = localStorage.getItem(
        "pluto-selected-prebuilt-filter",
      ) as PrebuiltFilterKey;
      setFilter(SELECT_PREBUILT_FILTERS[storedSelection]?.regex || "");
    } else if (localStorage.getItem("pluto-custom-filter")) {
      setFilter(SELECT_PREBUILT_FILTERS.noFilter.regex);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("pluto-custom-filter", filter);
  }, [filter]);

  useEffect(() => {
    localStorage.setItem(
      "pluto-selected-prebuilt-filter",
      selectedPrebuiltFilter,
    );
  }, [selectedPrebuiltFilter]);

  const getLogText = (logEntry: LogEntry): string => {
    if (typeof logEntry === "string") {
      return logEntry;
    }
    if (logEntry && typeof logEntry.message === "string") {
      return logEntry.message;
    }
    return JSON.stringify(logEntry);
  };

  const filteredLogs = useMemo(() => {
    const currentFilter = filter.trim();
    if (!currentFilter) return logs;
    try {
      const regex = new RegExp(currentFilter, "i");
      return logs.filter((log) => regex.test(getLogText(log)));
    } catch (error) {
      console.warn("Invalid regex, falling back to string match:", error);
      const lowerCaseFilter = currentFilter.toLowerCase();
      return logs.filter((log) =>
        getLogText(log).toLowerCase().includes(lowerCaseFilter),
      );
    }
  }, [logs, filter]);

  useEffect(() => {
    const container = scrollableContainerRef.current;
    if (container && !isUserScrolledUp) {
      container.scrollTop = container.scrollHeight;
    }
  }, [filteredLogs, isUserScrolledUp]);

  const handleScroll = () => {
    const container = scrollableContainerRef.current;
    if (container) {
      const atBottom =
        container.scrollHeight - container.scrollTop <=
        container.clientHeight + 5;
      if (atBottom) {
        setIsUserScrolledUp(false);
      } else {
        setIsUserScrolledUp(true);
      }
    }
  };

  const handlePrebuiltFilterChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const selection = event.target.value as PrebuiltFilterKey;
    setSelectedPrebuiltFilter(selection);
    setFilter(SELECT_PREBUILT_FILTERS[selection]?.regex || "");
  };

  const handleCustomFilterChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setFilter(event.target.value);
  };

  return (
    <div className="flex-1 dark:border-gray-700 flex flex-col h-full">
      <div className="p-4  dark:border-gray-700 space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Logs
        </h3>
        <span className="flex flex-row gap-2">
          <select
            value={selectedPrebuiltFilter}
            onChange={handlePrebuiltFilterChange}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100"
          >
            {Object.entries(SELECT_PREBUILT_FILTERS).map(([key, value]) => (
              <option key={key} value={key}>
                {value.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Filter logs (custom string or regex)..."
            value={filter}
            onChange={handleCustomFilterChange}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          />
        </span>
      </div>
      <div
        ref={scrollableContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4"
      >
        {filteredLogs && filteredLogs.length > 0 ? (
          filteredLogs.map((logEntry, index) => (
            <pre
              key={index}
              className="text-sm font-mono whitespace-pre-wrap break-all text-gray-800 dark:text-gray-200 my-0.5"
            >
              {getLogText(logEntry)}
            </pre>
          ))
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic px-2">
            {filter.trim() ? "No logs match your filter." : "No logs yet."}
          </p>
        )}
      </div>
    </div>
  );
};

export default LogsPanel;
