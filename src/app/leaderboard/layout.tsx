import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contextle Global Leaderboard - Top Players",
  description: "View the top Contextle players worldwide and their current levels.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
