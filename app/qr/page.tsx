import QRCode from "qrcode";
import { SITE } from "@/lib/config";

export const metadata = { title: "Join in" };

export default async function QRPage() {
  const svg = await QRCode.toString(SITE.url, {
    type: "svg",
    margin: 1,
    color: { dark: "#0c1524", light: "#ffffff" },
  });
  return (
    <div className="flex flex-col items-center px-4 py-16 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        Scan to join in
      </h1>
      <p className="mt-3 max-w-md text-lg text-ink-soft">
        Add ideas, vote, and watch the board — live.
      </p>
      <div
        className="mt-10 w-full max-w-sm rounded-3xl border border-ink/10 bg-white p-6 shadow-lg [&_svg]:h-auto [&_svg]:w-full"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <p className="mt-8 font-mono text-2xl font-bold">
        {SITE.url.replace("https://", "")}
      </p>
    </div>
  );
}
