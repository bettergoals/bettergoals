import Link from "next/link";
import { BUILD_URL, REPO_URL } from "@/lib/config";

const NAV = [
  { href: "/principles", label: "Principles" },
  { href: "/okrs", label: "OKRs" },
  { href: "/checker", label: "Checker" },
  { href: "/templates", label: "Templates" },
  { href: "/skills", label: "Skills" },
  { href: "/contribute", label: "Contribute" },
  { href: BUILD_URL, label: "Ideas Board ↗" },
];

export function Nav() {
  return (
    <header className="sticky top-0 z-20 border-b border-ink/10 bg-chalk/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight">
          better<span className="text-sooner">goals</span>.ai
        </Link>
        <nav className="flex flex-wrap items-center gap-1 text-sm font-medium sm:gap-2">
          {NAV.map((item) =>
            item.href.startsWith("http") ? (
              <a key={item.href} href={item.href} className="rounded-full px-3 py-1.5 hover:bg-ink/5">
                {item.label}
              </a>
            ) : (
              <Link key={item.href} href={item.href} className="rounded-full px-3 py-1.5 hover:bg-ink/5">
                {item.label}
              </Link>
            )
          )}
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="ml-1 hidden rounded-full border border-ink/15 px-3 py-1.5 hover:bg-ink/5 sm:block"
          >
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-16 border-t border-ink/10 bg-ink text-chalk">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-8 text-center text-sm sm:flex-row sm:justify-between sm:text-left">
        <p className="opacity-80">
          Built in the open by the community, for the community.{" "}
          <a href={REPO_URL} className="underline underline-offset-2" target="_blank" rel="noreferrer">
            Contribute on GitHub
          </a>
        </p>
        <p className="opacity-80">
          Supported by{" "}
          <a href="https://teamform.co" target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-2">
            TeamForm
          </a>{" "}
          and{" "}
          <a href="https://soonersaferhappier.com" target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-2">
            Sooner Safer Happier
          </a>
        </p>
      </div>
    </footer>
  );
}
