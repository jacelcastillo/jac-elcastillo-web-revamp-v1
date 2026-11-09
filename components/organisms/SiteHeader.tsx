import type { CSSProperties } from "react";
import { Link } from "@/components/atoms/Link";
import { Button } from "@/components/atoms/Button";
import { Container } from "@/components/atoms/Container";
import { Icon } from "@/components/atoms/Icon";
import { Logo } from "@/components/atoms/Logo";
import { NavLink } from "@/components/molecules/NavLink";
import { NAV } from "@/lib/site";

const topLinkClass =
  "rounded-full px-3 py-2 font-semibold hover:bg-white aria-[current=page]:text-brand xl:px-4 xl:text-lg";
const drawerLinkClass =
  "block border-b border-line py-3 text-lg aria-[current=page]:font-semibold aria-[current=page]:text-brand";
const linkClass =
  "block rounded-lg px-3 py-2 hover:bg-paper aria-[current=page]:font-semibold aria-[current=page]:text-brand";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
      <div className="flag-rule" />
      <Container size="wide" className="flex items-center justify-between py-2">
        <Link href="/">
          <Logo tone="dark" />
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-2 lg:flex">
          {NAV.map((entry, index) => {
            if ("href" in entry) {
              return (
                <NavLink key={entry.href} href={entry.href} className={topLinkClass}>
                  {entry.label}
                </NavLink>
              );
            }
            const id = `nav-${index}`;
            const style = { "--anchor": `--${id}` } as CSSProperties;
            return (
              <div key={entry.label}>
                <button
                  type="button"
                  popoverTarget={id}
                  style={style}
                  className="anchor-source inline-flex items-center gap-1 rounded-full px-3 py-2 font-semibold hover:bg-white xl:px-4 xl:text-lg"
                >
                  {entry.label}
                  <Icon name="chevron" />
                </button>
                <div
                  id={id}
                  popover=""
                  style={style}
                  className="anchor-panel min-w-56 rounded-xl border border-line bg-white p-2 text-lg shadow-lg"
                >
                  {entry.items.map((item) => (
                    <NavLink key={item.href} href={item.href} className={linkClass}>
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="lg:hidden">
          <Button variant="secondary" popoverTarget="site-menu">
            <Icon name="menu" />
            Menú
          </Button>
          <div
            id="site-menu"
            popover=""
            className="fixed inset-auto right-0 top-0 m-0 h-dvh w-[min(22rem,88vw)] overflow-y-auto bg-paper p-6 text-ink shadow-2xl backdrop:bg-ink/40 motion-safe:transition-transform motion-safe:duration-300 motion-safe:transition-discrete motion-safe:starting:open:translate-x-full"
          >
            <div className="flex justify-end">
              <Button
                variant="secondary"
                popoverTarget="site-menu"
                popoverTargetAction="hide"
                aria-label="Cerrar menú"
              >
                <Icon name="close" />
              </Button>
            </div>
            {NAV.map((entry) =>
              "href" in entry ? (
                <NavLink
                  key={entry.href}
                  href={entry.href}
                  className={`mt-6 ${drawerLinkClass}`}
                >
                  {entry.label}
                </NavLink>
              ) : (
                <div key={entry.label} className="mt-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">
                    {entry.label}
                  </p>
                  {entry.items.map((item) => (
                    <NavLink key={item.href} href={item.href} className={drawerLinkClass}>
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              ),
            )}
          </div>
        </div>
      </Container>
    </header>
  );
}
