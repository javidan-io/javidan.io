import { FilmingMenu } from "@/components/filming/filming-menu";
import { IntroLoader } from "@/components/filming/intro-loader";
import { LogoBackdrop } from "@/components/filming/logo-backdrop";
import { markIntroSeenScript } from "@/lib/filming/intro";

export default function FilmingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="filming-root relative flex min-h-dvh flex-1 flex-col bg-paper text-ink">
      <script dangerouslySetInnerHTML={{ __html: markIntroSeenScript }} />
      <IntroLoader />
      <LogoBackdrop />
      <FilmingMenu />
      <div className="relative flex flex-1 flex-col">{children}</div>
    </div>
  );
}
