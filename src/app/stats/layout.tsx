import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Stats - Contextle",
  description: "View your Contextle word guessing game stats and daily streak.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
