import { useSyncExternalStore, type AnchorHTMLAttributes } from "react";

const changed = "mark-of-frame:navigate";
const subscribe = (listener: () => void) => {
  window.addEventListener("hashchange", listener);
  window.addEventListener(changed, listener);
  return () => {
    window.removeEventListener("hashchange", listener);
    window.removeEventListener(changed, listener);
  };
};
export function useSiteLocation() {
  const location = useSyncExternalStore(
    subscribe,
    () => window.location.hash.slice(1) || "/",
  );
  return new URL(location, window.location.origin);
}
export function navigate(href: string, replace = false, scroll = true) {
  const url = new URL(href, window.location.origin);
  if (url.origin !== window.location.origin) {
    window.location.assign(url.href);
    return;
  }
  window.history[replace ? "replaceState" : "pushState"](
    {},
    "",
    `#${url.pathname}${url.search}${url.hash}`,
  );
  window.dispatchEvent(new Event(changed));
  requestAnimationFrame(() => {
    if (url.hash)
      document
        .getElementById(decodeURIComponent(url.hash.slice(1)))
        ?.scrollIntoView({ block: "start" });
    else if (scroll) {
      window.scrollTo(0, 0);
      document.getElementById("main-content")?.focus({ preventScroll: true });
    }
  });
}
export function usePathname() {
  return useSiteLocation().pathname;
}
export function useRouter() {
  return { push: navigate, replace: (href: string) => navigate(href, true) };
}
type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  scroll?: boolean;
  prefetch?: boolean;
};
export default function SiteLink({
  href,
  onClick,
  scroll = true,
  prefetch: _prefetch,
  ...props
}: LinkProps) {
  void _prefetch;
  return (
    <a
      {...props}
      href={`#${href}`}
      onClick={(event) => {
        onClick?.(event);
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          props.target === "_blank"
        )
          return;
        event.preventDefault();
        navigate(href, false, scroll);
      }}
    />
  );
}
