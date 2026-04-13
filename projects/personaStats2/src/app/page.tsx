import { Dashboard } from "@/components/dashboard/Dashboard";

type HomeProps = {
  searchParams: Promise<{ dev?: string }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const sp = await searchParams;
  const showDevControls = sp.dev === "1";

  return <Dashboard showDevControls={showDevControls} />;
}
