import type { ReactNode } from "react";

export function PageHeading({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="pageHeading">
      <div>
        <h1>
          {title}
          <span className="gold">.</span>
        </h1>
        <p>{description}</p>
      </div>
      {children}
    </div>
  );
}
