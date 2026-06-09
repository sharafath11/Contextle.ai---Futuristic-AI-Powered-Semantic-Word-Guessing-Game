import { Metadata } from "next";

export const metadata: Metadata = {
  title: "How to Play Contextle - Rules & Guide",
  description: "Learn how to play Contextle. Discover the semantic guessing rules and AI hints.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
