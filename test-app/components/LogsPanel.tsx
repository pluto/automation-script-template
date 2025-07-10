import React, { useState, useEffect, useRef, useMemo } from "react";

type LogEntry = string | { message: string; [key: string]: any };

interface LogsPanelProps {
  logs: LogEntry[];
}

const LogsPanel: React.FC<LogsPanelProps> = ({ logs }) => {
  const [filter, setFilter] = useState(
    localStorage.getItem("pluto-custom-filter") || "",
  );
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const scrollableContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem("pluto-custom-filter", filter);
  }, [filter]);

  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchExpanded]);

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
      // Use requestAnimationFrame to ensure DOM has updated before scrolling
      requestAnimationFrame(() => {
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      });
    }
  }, [filteredLogs, isUserScrolledUp]);

  const handleScroll = () => {
    const container = scrollableContainerRef.current;
    if (container) {
      // Increased tolerance to 20px to handle rapid log updates better
      const atBottom =
        container.scrollHeight - container.scrollTop <=
        container.clientHeight + 20;
      if (atBottom) {
        setIsUserScrolledUp(false);
      } else {
        setIsUserScrolledUp(true);
      }
    }
  };

  const handleCustomFilterChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setFilter(event.target.value);
  };

  const handleSearchIconClick = () => {
    setIsSearchExpanded(true);
  };

  const handleSearchBlur = () => {
    setIsSearchExpanded(false);
  };

  return (
    <div className="flex-1 dark:border-gray-700 flex flex-col h-full relative">
      <div
        className={`absolute top-2 right-2 z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-md transition-all duration-300 ease-in-out h-8 ${
          isSearchExpanded ? "w-48" : "w-8"
        }`}
      >
        {isSearchExpanded ? (
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Filter logs..."
            value={filter}
            onChange={handleCustomFilterChange}
            onBlur={handleSearchBlur}
            className="w-full h-full px-2 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 border-none outline-none"
          />
        ) : (
          <button
            onClick={handleSearchIconClick}
            className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded"
            title="Search logs"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>
        )}
      </div>
      <div
        ref={scrollableContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 pt-12"
      >
        {filteredLogs && filteredLogs.length > 0 ? (
          filteredLogs.map((logEntry, index) => (
            <pre
              key={index}
              className="text-xs font-mono whitespace-pre-wrap break-all text-gray-800 dark:text-gray-200 my-0.5"
            >
              {getLogText(logEntry)}
            </pre>
          ))
        ) : (
          <p className="text-xs text-gray-500 dark:text-gray-400 italic px-2">
            {filter.trim() ? "No logs match your filter." : "No logs yet."}
          </p>
        )}
      </div>
    </div>
  );
};

export default LogsPanel;
