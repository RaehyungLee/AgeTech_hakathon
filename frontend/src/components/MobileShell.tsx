import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  live: boolean;
}

export function MobileShell({ children, live }: Props) {
  return (
    <div className="mobile-demo">
      <div className="phone-frame">
        <div className="phone-notch" aria-hidden="true" />
        <div className="phone-screen">
          <div className="status-bar">
            <span>9:41</span>
            <span className={`status-live${live ? "" : " offline"}`}>
              {live ? "Kinu live" : "Offline"}
            </span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
