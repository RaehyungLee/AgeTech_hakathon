import type { ReactNode } from "react";
import type { User } from "../types";

interface Props {
  children: ReactNode;
  live: boolean;
  user?: User | null;
}

export function MobileShell({ children, live, user }: Props) {
  return (
    <div className="mobile-demo">
      <div className="phone-frame">
        <div className="phone-notch" aria-hidden="true" />
        <div className="phone-screen">
          <div className="status-bar">
            <span>9:41</span>
            <div className="status-bar-right">
              {user && (
                <span className="user-chip">
                  {user.name.split(" ")[0]} · {user.relation}
                </span>
              )}
              <span className={`status-live${live ? "" : " offline"}`}>
                {live ? "Kinu live" : "Offline"}
              </span>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
