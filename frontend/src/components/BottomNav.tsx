import type { TabId } from "../types";

const tabs: { id: TabId; label: string; icon: string }[] = [
  { id: "home", label: "Home", icon: "⌂" },
  { id: "sensors", label: "Sensors", icon: "◎" },
  { id: "alerts", label: "Alerts", icon: "◌" },
  { id: "care", label: "Care", icon: "✿" },
];

interface Props {
  active: TabId;
  alertCount: number;
  onChange: (tab: TabId) => void;
}

export function BottomNav({ active, alertCount, onChange }: Props) {
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`nav-tab${active === tab.id ? " active" : ""}`}
          onClick={() => onChange(tab.id)}
          aria-current={active === tab.id ? "page" : undefined}
        >
          <span className="nav-icon" aria-hidden="true">
            {tab.icon}
          </span>
          <span className="nav-label">{tab.label}</span>
          {tab.id === "alerts" && alertCount > 0 && (
            <span className="nav-badge">{alertCount}</span>
          )}
        </button>
      ))}
    </nav>
  );
}
